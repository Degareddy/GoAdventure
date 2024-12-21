import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CustomerService } from 'src/app/Services/customer.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink/dist/subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CustomerParam } from '../../sales.class';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-customer-units',
  templateUrl: './customer-units.component.html',
  styleUrls: ['./customer-units.component.css']
})
export class CustomerUnitsComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() custID!: string;
  @Input() custName!: string;
  noOfUnits!:number;
  private subsink: SubSink = new SubSink();
  CustomerParam: CustomerParam;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  rowData: any = [];
  columnDefs: any = [];
  totals: string = "";
  Actual: number = 0;
  Payble: number = 0;
  acBalTmp: boolean = false;
  payTmp: boolean = false;
  retMessage: string = "";
  textMessageClass: string = "";
  gridData: any = [];
  constructor(private customerService: CustomerService, private userDataService: UserDataService, private loader: NgxUiLoaderService) {
    this.CustomerParam = new CustomerParam();
  }
  ngAfterViewInit(): void {
    this.columnDefs = [
      { field: "propName", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "bedRooms", headerName: "Bedrooms", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "landlord", headerName: "Landlord", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "unitStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
      {
        field: "share",
        headerName: "Share",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        valueGetter: (params: { data: { share: number } }) => {
          return params.data.share;
        },
        valueFormatter: (params: { value: number }) => {
          if(params.value){
            return `${params.value}%`;
          }
          else{
            return '';
          }

        },
      },

      {
        headerName: "Rent",
        field: "amount",
        sortable: true,
        resizable: true,
        filter: 'agNumberColumnFilter',
        type: 'rightAligned',
        flex: 1,

        valueFormatter: (params: { data: { amount: any; }; }) => {
          const amount = params.data.amount;
          if (amount !== undefined) {
            const formattedBalance = amount < 0
              ? `(${Math.abs(amount).toLocaleString()})`
              : amount.toLocaleString();


            return `Ksh ${formattedBalance}`;
          }
          return '';
        },
      },
      {
        field: "joinDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    ]
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    console.log(field);
    if (field.toUpperCase() === 'AMOUNT') {
      this.acBalTmp = hide;
    }
    this.getTotal();

    // this.getTotalLoan();
  }

  getTotal() {
    if (!this.acBalTmp) {
      this.totals = "Rent Amount: " + this.Actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "  Payble Amount: "
        + this.Payble.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    else {
      this.totals = "";
    }
  }
  onFilterData(event: any) {
    this.processRowPostCreate(event);
    // this.calculateTotalLoan(event);
  }
  calculateTotalLoan(params: any) {

    this.Actual = 0;
    this.Payble = 0;
    for (let i = 0; i < params.length; i++) {
      this.Actual = this.Actual + (Number(params[i].amount) || 0);
      if (params[i].unitStatus === 'Allocated') {
        this.Payble = this.Payble + (Number(params[i].amount) || 0);
      }
    }

  }
  processRowPostCreate(params: any) {

    let actual = 0;
    let payble = 0;

    if (params) {
      const processedData = params.map((row: any) => {
        actual += Number(row.amount) || 0;
        if (row.unitStatus === 'Allocated') {
          payble += Number(row.amount) || 0;
        }
        return {
          ...row,
          actual,
          payble
        };
      });
      processedData.push({
        propertyName: "Total",
        amount: "Rent " + actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        unitStatus: "Payble " + payble.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
      this.Actual = actual
      this.Payble = payble;
      return processedData;
    }
  }
  ngOnInit(): void {
    this.loadData();
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
  }
  loadData() {

    if (this.custID) {
      this.CustomerParam.Code = this.custID;
      this.CustomerParam.refNo = this.userDataService.userData.sessionID;
      this.CustomerParam.user = this.userDataService.userData.userID;
      this.CustomerParam.company = this.userDataService.userData.company;
      this.CustomerParam.location = this.userDataService.userData.location;
      try {
        this.loader.start();
        this.subsink.sink = this.customerService.getUnitDetailsForClient(this.CustomerParam).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.rowData = this.processRowPostCreate(res['data']);
            this.noOfUnits=this.rowData.length;
            --this.noOfUnits;
            this.displayMessage("Success: " + res.message, "green");
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }
    else {
      this.displayMessage("No Customer ID", "red");
      return;
    }



  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

}
