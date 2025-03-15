import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CustomerService } from 'src/app/Services/customer.service';
import { Customer } from '../sales.class';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { LogComponent } from 'src/app/general/log/log.component';
export interface custApiResponse {
  status: string;
  message: string;
  retVal: number;
  data: customerresp[];
}

export interface customerresp {
  mode: string;
  company: string;
  location: string;
  groupCode: string;
  groupName: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  catDesc: string;
  isCustomer: boolean;
  isVendor: boolean;
  isEmployee: boolean;
  isLandlord: boolean;
  isTenant: boolean;
  isStaker: boolean;
  effectiveDate: string;
  status: string;
  vatpinNo: string;
  currency: string;
  payTerm: string;
  pricing: string;
  maxCrLimit: number;
  secuItemDesc: string;
  salesExecutive: string;
  notes: string;
  url: string;
  refNo: any;
  user: any;
  isCareTaker:any;
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})

export class CustomerComponent implements OnInit, OnDestroy {
  customersList: Customer[] = [];
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  chartData: any[] = [];
  chartOptions: any;
  checked: boolean = false;
  id!: number;
  custForm!: FormGroup;
  public exportTmp: boolean = true;
  public customerId!: string;
  custData: Customer;
  receivedData: any;
  expandedChart: any = null;

  private columnApi!: ColumnApi;
  private subsink: SubSink = new SubSink()
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  public filteredPartyTypeList: Item[] = [];
  public partyTypeList: Item[] = [
    { itemCode: 'Customers', itemName: "Customers" },
    { itemCode: 'Vendors', itemName: "Vendors" },
    { itemCode: 'Employees', itemName: "Staff" },
    { itemCode: 'BOTH', itemName: "Both" },
    { itemCode: 'All', itemName: "All" },
  ]
  columnDefs: any = [
    { field: "name", headerName: "Name", sortable: true, filter: true, resizable: true, width: 300, cellRenderer: 'agLnkRenderer' },
    { field: "code", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "clientType", headerName: "Client Type", sortable: true, filter: true, resizable: true, flex: 1 },

    {
      field: "effectiveDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },
    { field: "status", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "locnName", headerName: "Created At", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "currency", headerName: "Currency", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "phone", headerName: "Mobile", sortable: true, filter: true, resizable: true, flex: 1, },
    { field: "email", headerName: "Email", sortable: true, filter: true, resizable: true, flex: 1, }
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  retMessage: string = "";
  textMessageClass: string = "";
  userProfile: string = "";
  constructor(private custService: CustomerService, public dialog: MatDialog, private fb: FormBuilder,
    protected router: Router, private _loader: NgxUiLoaderService, private userDataService: UserDataService,
    protected route: ActivatedRoute) {
    this.custData = new Customer();
    this.custForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      type: ['']
    });
  }
  expandChart(chart: any): void {
    this.expandedChart = chart;
  }

  closeExpandedChart(): void {
    this.expandedChart = null;
  }

  onRowSelected(event: any) {
    this.onViewCilcked(event.data);
  }
  onLnkClicked(event: any) {
    this.onViewCilcked(event.data);
  }

  ngOnInit(): void {
    this.custData.company = this.userDataService.userData.company;
    this.custData.location = this.userDataService.userData.location;
    this.custData.refNo = this.userDataService.userData.sessionID;
    this.custData.user = this.userDataService.userData.userID;
    this.userProfile = this.userDataService.userData.userProfile;
    if (this.userProfile.toUpperCase() === 'CMPUSER') {
      this.filteredPartyTypeList = this.partyTypeList.filter(item =>
        ['Customers', 'Vendors', 'Employees',  'All'].includes(item.itemCode)
      );
    } else {
      this.filteredPartyTypeList = this.partyTypeList;
    }
  }

  onPageSizeChanged(pageSize: any) {
    this.pageSize = pageSize.target.value;
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  typeChange() {
    this.displayMessage("", "");
    const value = this.custForm.get('type')!.value;
    if (value != "" && value != undefined && value != null) {
      this.loadData();
    }
    else {
      this.rowData = [];
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  async loadData() {
    this.displayMessage("", "");
    this.rowData = [];
    this.custData.Type = this.custForm.controls['type'].value;
    if (this.custData.Type) {
      try {
        this._loader.start();
        this.subsink.sink = await this.custService.getCustomerData(this.custData).subscribe((result: custApiResponse) => {
          this._loader.stop();
          if (result.status.toUpperCase() === "SUCCESS") {
            const updatedData = result['data'].map(item => {
              let clientTypes = [];
              if (item.isLandlord) clientTypes.push('Landlord');
              if (item.isTenant) clientTypes.push('Tenant');
              if (item.isCustomer) clientTypes.push('Customer');
              if (item.isVendor) clientTypes.push('Vendor');
              if (item.isEmployee) clientTypes.push('Employee');
              if (item.isStaker) clientTypes.push('Stake Holder');
              if(item.isCareTaker) clientTypes.push('Rep');
              return {
                ...item,
                clientType: clientTypes.join(', ') || null
              };
            });
            this.rowData = updatedData;
            if (this.rowData.length > 0) {
              this.generateChartData();
              this.initializeChartOptions();
            }
            this.displayMessage("Success: " + this.custForm.controls.type.value + " data loaded successfully", "green");
          }
          else {
            this.rowData = [];
            if (this.custData.Type === "*Landlords") {
              this.displayMessage("Landlords not allocated to any unit in this property yet", "red");
            }
            else if (this.custData.Type === "Customers") {
              this.displayMessage("Customers not allocated to any unit in this property yet", "red");
            }
            else {
              this.displayMessage("Error: " + this.custForm.controls.type.value + " data not loaded yet.", "red");
            }
          }

        });
      }
      catch (ex: any) {
        this._loader.stop();
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }
    else {
      this.displayMessage("Select Client Type", "red");
    }

  }
  onToggleChange(event: any) {
    this.checked = event.checked;
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  refreshClientTypes() {
    const value = this.custForm.get('type')!.value;
    if (value === "" || value === undefined || value === null) {
      this.displayMessage("Select Client Type", "red");
    }
    else {

      this.typeChange();

    }
  }

  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: "Customer" + '.csv' });
    }
  }

  AddCustomer() {
    const dialogRef: MatDialogRef<CustomerDetailsComponent> = this.dialog.open(CustomerDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { customerId: "", customerName: "", mode: "Add" },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.loadData();
      }
    })
  }

  onViewCilcked(code: any) {
    const dialogRef: MatDialogRef<CustomerDetailsComponent> = this.dialog.open(CustomerDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { customerId: code.code, customerName: code.name, mode: "View",type:this.custForm.controls['type'].value },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.loadData();
      }
    })
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM201",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
  logDetails() {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '50%',
      disableClose: true,
      data: {
        'tranType': 'CLIENT',
        'search': 'Client Log'
      }
    });

  }

  generateChartData(): void {
    this.chartData=[];
    const propertyCounts = {
      Landlord: 0,
      Tenant: 0,
      Customer: 0,
      Vendor: 0,
      Employee: 0,
      Staker: 0,
      CareTaker: 0
    };

    const multiCategoryCounts: { [key: string]: any } = {};
    const locationCounts: { [key: string]: any } = {};

    this.rowData.forEach((item: any) => {
      const categories = [];
      if (item.isLandlord) {
        propertyCounts.Landlord++;
        categories.push('Landlord');
      }
      if (item.isTenant) {
        propertyCounts.Tenant++;
        categories.push('Tenant');
      }
      if (item.isCustomer) {
        propertyCounts.Customer++;
        categories.push('Customer');
      }
      if (item.isVendor) {
        propertyCounts.Vendor++;
        categories.push('Vendor');
      }
      if (item.isEmployee) {
        propertyCounts.Employee++;
        categories.push('Employee');
      }
      if (item.isStaker) {
        propertyCounts.Staker++;
        categories.push('Staker');
      }
      if (item.isCareTaker) {
        propertyCounts.CareTaker++;
        categories.push('CareTaker');
      }
      if (categories.length > 1) {
        const key = categories.sort().join(' & ');
        multiCategoryCounts[key] = (multiCategoryCounts[key] || 0) + 1;

        if (!locationCounts[item.locnName]) {
          locationCounts[item.locnName] = {};
        }
        locationCounts[item.locnName][key] = (locationCounts[item.locnName][key] || 0) + 1;
      }

      if (!locationCounts[item.locnName]) {
        locationCounts[item.locnName] = {
          Landlord: 0,
          Tenant: 0,
          Customer: 0,
          Vendor: 0,
          Employee: 0,
          Staker: 0,
        };
      }

      categories.forEach(category => {
        locationCounts[item.locnName][category] = (locationCounts[item.locnName][category] || 0) + 1;
      });
    });

    for (const [key, value] of Object.entries(propertyCounts)) {
      this.chartData.push({
        labels: Object.keys(locationCounts),
        datasets: [
          {
            label: key,
            backgroundColor: this.getRandomColor(),
            data: Object.values(locationCounts).map(loc => loc[key] || 0),
          },
        ],
      });
    }

    const multiCategoryOverallChart = {
      labels: Object.keys(multiCategoryCounts),
      datasets: [
        {
          label: 'Multiple Categories (Overall)',
          backgroundColor: Object.keys(multiCategoryCounts).map(() => this.getRandomColor()),
          data: Object.values(multiCategoryCounts),
        },
      ],
    };
    this.chartData.push(multiCategoryOverallChart);

    const locationSpecificMultiCategoryChart = {
      labels: Object.keys(locationCounts),
      datasets: Object.keys(multiCategoryCounts).map((multiCategoryKey) => ({
        label: multiCategoryKey,
        backgroundColor: this.getRandomColor(),
        data: Object.values(locationCounts).map(
          loc => loc[multiCategoryKey] || 0 // Use 0 if the category is not present
        ),
      })),
    };
    this.chartData.push(locationSpecificMultiCategoryChart);

    const overallTotalsChart = {
      labels: Object.keys(propertyCounts),
      datasets: [
        {
          label: 'Overall Totals',
          backgroundColor: Object.keys(propertyCounts).map(() => this.getRandomColor()),
          data: Object.values(propertyCounts),
        },
      ],
    };
    this.chartData.push(overallTotalsChart);
  }

  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  // Chart options for consistent styling
  initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => `${tooltipItem.raw} entries`
          }
        }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    };
  }

  // Event handler for chart clicks
  onChartClick(event: any, chartLabel: string): void {
    // const selectedLabel = event.element._model.label; // Retrieve clicked bar's label
    // console.log(`Clicked on ${selectedLabel} in chart ${chartLabel}`);
    // Handle further actions here
  }
}
