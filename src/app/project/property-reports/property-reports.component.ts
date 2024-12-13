import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { propertyReportData } from '../Project.class';
import { forkJoin } from 'rxjs';
import { ColumnApi, GridApi, GridOptions, RowClassParams } from 'ag-grid-community';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { DatePipe } from '@angular/common';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { FilteredUnitsComponent } from './filtered-units/filtered-units.component';
interface IReportData {
  Company: string;
  Location: string;
  PropCode: string;
  BlockCode: string;
  UnitID: string;
  UnitStatus: string;
  FromDate: Date;
  ToDate: Date;
  Report: string;
  User: string;
  RefNo: string;
}
@Component({
  selector: 'app-property-reports',
  templateUrl: './property-reports.component.html',
  styleUrls: ['./property-reports.component.css']
})
export class PropertyReportsComponent implements OnInit, OnDestroy {
  properytList: Item[] = [];
  blocksList: Item[] = [];
  flatsList: Item[] = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  reoprtForm!: FormGroup;
  public checkAllColumns = false;
  private subSink: SubSink;
  private propCls: propertyReportData;
  public totalRent: number = 0;
  public totalService: number = 0;
  rentTmp: boolean = false;
  serviceTmp: boolean = false;
  rowData = [];
  checked = false;
  hidden: Boolean = false;
  columnDefs1: any = []
  public themeClass: string =
    "ag-theme-quartz";
  columnDefs: any = [
    { field: "propName", headerName: "Property", sortable: true, filter: true, resizable: true, width: 280 },
    { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, width: 28, hide: true },
    { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 180 },
    { field: "bedRooms", headerName: "Bed Rooms", width: 250, resizable: true, sortable: true, filter: true, },
    { field: "unitStatus", headerName: "Unit Status", sortable: true, filter: true, resizable: true, width: 200 },
    { field: "llName", headerName: "Land Lord", sortable: true, resizable: true, width: 300, filter: true },
    { field: "llPhone", headerName: "LL Phone", sortable: true, resizable: true, width: 300, filter: true, hide: true },
    { field: "tenant", headerName: "Tenant", sortable: true, resizable: true, width: 300, filter: true },
    { field: "tntPhone", headerName: "T Phone", sortable: true, resizable: true, width: 260, filter: true, hide: true },
    {
      field: "unitDate", headerName: "Join Date", sortable: true, resizable: true, width: 250, filter: true, hide: true, valueFormatter: function (params: any) {
        // Format date as dd-MM-yyyy
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
    {
      field: "rent", headerName: "Rent", width: 250, resizable: true, sortable: true, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      },
    },
    {
      field: "service", headerName: "Service", width: 250, resizable: true, sortable: true, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      },
    }

  ];
  chartData: any[] = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  reoprttList: Item[] = [
    { itemCode: 'Units', itemName: 'Units' },
    { itemCode: 'Technician History', itemName: 'Technician History' }
  ];
  statusList: Item[] = [
    { itemCode: 'Allocated', itemName: 'Allocated' },
    { itemCode: 'Vacant', itemName: 'Vacant' },
    { itemCode: 'Occupied', itemName: 'Occupied' },
    { itemCode: 'Repair', itemName: 'Repair' },
    { itemCode: 'Renovate', itemName: 'Renovate' }
  ];
  chartOptions: any;
  @Input() max: any;
  today = new Date();
  dialogOpen: any;
  custCode: any;
  totals: string = "";
  filteredUnits: any = [];
  constructor(private fb: FormBuilder, private datepipe: DatePipe,
    private masterService: MastersService, protected router: Router,
    private projectService: ProjectsService, private userDataService: UserDataService,
    private utlService: UtilitiesService,
    public dialog: MatDialog,
    private loader: NgxUiLoaderService) {
    this.reoprtForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.propCls = new propertyReportData();
    this.gridOptions = {
      rowSelection: 'single',
    };
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  onFilterData(event: any) {
    // console.log(event);
    this.calculateTotals(event);
  }
  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    if (field.toUpperCase() === 'RENT') {
      this.rentTmp = hide;
    }
    else if (field.toUpperCase() === 'SERVICE') {
      this.serviceTmp = hide;
    }
    this.getTotal();
  }
  getTotal() {
    if (!this.rentTmp && !this.serviceTmp) {
      this.totals = "Rent: " + this.totalRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        + "  Service: " + this.totalService.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else if (!this.rentTmp) {
      this.totals = "Rent: " + this.totalRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else if (!this.serviceTmp) {
      this.totals = "Service: " + this.totalService.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else {
      this.totals = "";
    }
  }
  ngOnInit() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.refreshData();
  }
  refreshData() {
    this.reoprtForm.get('Report')!.valueChanges.subscribe((data) => {
      this.rowData = [];
      this.clearMsgs();
      if (data === "Technician History") {
        this.reoprtForm.controls['FromDate'].enable();
        this.reoprtForm.controls['ToDate'].enable();
        this.reoprtForm.controls['customer'].enable();
      }
      else {
        this.reoprtForm.controls['FromDate'].disable();
        this.reoprtForm.controls['ToDate'].disable();
        this.reoprtForm.controls['customer'].disable();
        this.totalRent = 0;
        this.totalService = 0;
      }

    });
    this.reoprtForm.valueChanges.subscribe(changes => {
      this.rowData = [];
      this.textMessageClass = "";
      this.retMessage = "";
    });
  }
  getAggregatedData(data: any[]): any[] {
    const groupedData = data.reduce((acc, curr) => {
      const { propName, unitStatus, landLord } = curr;

      if (!acc[propName]) {
        acc[propName] = { totalUnits: 0, allocatedUnits: 0, openUnits: 0, vacantUnits: 0, llmissing: 0 };
      }

      acc[propName].totalUnits += 1;
      acc[propName][unitStatus.toLowerCase() + 'Units'] += 1;
      if (!landLord || landLord.trim() === "") {
        acc[propName].llmissing += 1;
      }
      return acc;
    }, {});

    // console.log(groupedData);
    return Object.entries(groupedData).map(([key, value]: [string, any]) => ({
      propName: key,
      totalUnits: value.totalUnits,
      allocatedUnits: value.allocatedUnits,
      openUnits: value.openUnits,
      Vacant: value.vacantUnits,
      llmissing: value.llmissing,
    }));
  }

  prepareChartData(data: any[]): any[] {
    return data.map((property) => ({
      labels: ['Total', 'Allocated', 'Open', 'Vacant', 'No LL'],
      datasets: [
        {
          label: property.propName,
          data: [property.totalUnits, property.allocatedUnits, property.openUnits, property.Vacant, property.llmissing],
          backgroundColor: ['#42A5F5', '#6aa84f', '#FFA726', '#cc0000', '#9E9E9E'],
        },
      ]
    }));
  }

  formInit() {

    return this.fb.group({
      PropCode: ['All', [Validators.required]],
      BlockCode: ['All', [Validators.required]],
      UnitID: ['All', [Validators.required]],
      Report: ['', [Validators.required]],
      UnitStatus: ['All', Validators.required],
      FromDate: [{ value: new Date(), disabled: true }],
      ToDate: [{ value: new Date(), disabled: true }],
      customer: [{ value: 'All', disabled: true }]
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    // console.log(event.data);
  }

  onSelectionChanged(event: any) {
    const selectedRows = this.gridApi.getSelectedRows();
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    // const gridApi = params.api;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async loadData() {
    const propertybody: getPayload = {
      ...this.commonParams(),
      item: 'REPPROP'
    };
    const property$ = await this.masterService.GetMasterItemsList(propertybody);
    this.subSink.sink = forkJoin([property$]).subscribe(([propRes]: any) => {
      this.loader.stop();
      if (propRes.status.toUpperCase() === "SUCCESS") {
        this.properytList = propRes['data'];
      }
      else {
        this.retMessage = "Property list empty!";
        this.textMessageClass = "red";
        return;
      }
    },
      error => {
        this.handleError(error);
      }
    );
  }
  async onSelectedPropertyChanged() {
    this.blocksList = [];
    this.clearMsgs();
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.reoprtForm.controls['PropCode'].value;
    if (this.masterParams.item != 'All') {
      this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.blocksList = result['data'];
        }
        else {
          this.handleError(result);
        }
      });
    }

  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  formatDates(date: any): string {
    if (!date) return ''; // Handle null or undefined date
    if (!(date instanceof Date)) {
      date = new Date(date); // Assuming date is in a format that can be converted to a Date object
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  close() {
    this.router.navigateByUrl('/home');
  }
  async onSelectedBlockChanged() {
    this.clearMsgs();
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.reoprtForm.controls['PropCode'].value;
    this.masterParams.itemFirstLevel = this.reoprtForm.controls['BlockCode'].value;
    if (this.masterParams.item != 'All') {
      try {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: getResponse) => {
          if (result.status.toUpperCase() === "SUCCESS") {
            this.flatsList = result['data'];
          }
          else {
            this.handleError(result);
          }
        });
      }
      catch (ex: any) {
        this.handleError(ex);
      }
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }
  handleSuccess(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "green";
  }
  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
    this.rowData = [];
  }
  onToggleChange(event: any) {
    this.checked = event.checked;
  }
  onChartClick(event: any, property: string): void {
    this.filteredUnits = [];
    const clickedIndex = event.element.index;
    const clickedLabel = this.chartData[0].labels[clickedIndex];
    const propertyName = property;
    if (clickedLabel === 'Open') {
      this.filteredUnits = this.rowData.filter((unit: any) => unit.unitStatus === 'Open' && unit.propName === propertyName);
    } else if (clickedLabel === 'Allocated') {
      this.filteredUnits = this.rowData.filter((unit: any) => unit.unitStatus === 'Allocated' && unit.propName === propertyName);
    }
    else if (clickedLabel === 'Vacant') {
      this.filteredUnits = this.rowData.filter((unit: any) => unit.unitStatus === 'Vacant' && unit.propName === propertyName);
    }
    else if (clickedLabel === 'Total') {
      this.filteredUnits = this.rowData.filter((unit: any) => unit.propName === propertyName);
    }

    else if (clickedLabel === 'No LL') {
      this.hidden = true;
      this.filteredUnits = this.rowData.filter((unit: any) => unit.llName.trim() === '' && unit.propName === propertyName);
    }
    // console.log(this.filteredUnits);
    if (this.filteredUnits.length > 0) {
      if (!this.dialogOpen) {
        const dialogRef: MatDialogRef<FilteredUnitsComponent> = this.dialog.open(FilteredUnitsComponent, {
          width: '90%',
          disableClose: true,
          data: { filteredUnits: this.filteredUnits, label: clickedLabel, propertyName: propertyName, hide: this.hidden }
        });
        this.dialogOpen = true;
        dialogRef.afterClosed().subscribe(result => {
          this.dialogOpen = false;
        });
      }
    }
    else {
      this.retMessage = "No units found";
      this.textMessageClass = "red";
    }

  }
  async onSubmit() {
    if (this.reoprtForm.valid) {
      if (this.reoprtForm.controls['Report'].value === "Technician History") {
        const body = {
          ...this.commonParams(),
          Technician: this.custCode || "All",
          FromDate: this.datepipe.transform(this.reoprtForm.controls['FromDate'].value, "yyyy-MM-dd"),
          ToDate: this.datepipe.transform(this.reoprtForm.controls['ToDate'].value, "yyyy-MM-dd"),
          Type: "Tasks"
        }
        try {
          this.loader.start();
          this.subSink.sink = await this.projectService.GetReportTechnicianHistory(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              this.handleSuccess(res);
              this.rowData = res.data;
              if (this.rowData) {
                this.columnDefs1 = this.generateColumns(this.rowData);

              }
            }
            else {
              this.handleError(res);
            }
          });
        }
        catch (ex: any) {
          this.handleError(ex);
        }
      }
      else {
        const formValues: IReportData = this.reoprtForm.value;
        this.propCls.BlockCode = formValues.BlockCode;
        this.propCls.Company = this.userDataService.userData.company;
        this.propCls.FromDate = formValues.FromDate;
        this.propCls.Location = this.userDataService.userData.location;
        this.propCls.PropCode = formValues.PropCode;
        this.propCls.RefNo = this.userDataService.userData.sessionID;
        this.propCls.Report = formValues.Report;
        this.propCls.ToDate = formValues.ToDate;
        this.propCls.UnitID = formValues.UnitID;
        this.propCls.UnitStatus = formValues.UnitStatus;
        this.propCls.User = this.userDataService.userData.userID;
        this.loader.start();
        try {
          this.subSink.sink = await this.projectService.GetReportUnitsData(this.propCls).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              this.rowData = res.data;
              this.calculateTotals(this.rowData);
              const aggregatedData = this.getAggregatedData(this.rowData);
              this.chartData = this.prepareChartData(aggregatedData);
              this.handleSuccess(res);
            }
            else {
              this.rowData = [];
              this.handleError(res);
            }
          });
        }
        catch (ex: any) {
          this.handleError(ex);
        }
      }
    }

  }
  calculateTotals(data: any[]) {
    let totalRent = 0;
    let totalService = 0;
    data.forEach(row => {
      const rentValue = parseFloat(row.rent);
      const serviceValue = parseFloat(row.service);

      if (!isNaN(rentValue)) {
        totalRent += rentValue;
      }

      if (!isNaN(serviceValue)) {
        totalService += serviceValue;
      }
    });
    this.totalRent = totalRent;
    this.totalService = totalService;
    this.getTotal();
  }
  async onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      PartyName: this.reoprtForm.controls['customer'].value || ""
    }
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.reoprtForm.controls['customer'].patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.reoprtForm.controls['customer'].value || "", 'PartyType': "EMPLOYEE",
                  'search': 'Technician Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.reoprtForm.controls['customer'].setValue(result.partyName);
                  this.custCode = result.code;
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }
  generateColumns(data: any[]) {
    const desiredFields = [
      "tranNo",
      "tenantName",
      "propertyName",
      "blockName",
      "unitName",
      "techName",
      "startDate",
      "startTime",
      "givenDate",
      "givenTime",
      "endDate",
      "endTime",
      "extraDays",
      "extraHours",
      "extraMins"
    ];

    let columnDefinitions: any[] = [];
    desiredFields.forEach(field => {
      if (data[0].hasOwnProperty(field)) {
        let mappedColumn: any = {
          headerName: field.toUpperCase(),
          field: field,
          sortable: true, // Enable sorting
          filter: true, // Enable filtering
          resizable: true, // Enable resizing
          width: 210 // Set width to 210 pixels
        };

        if (field.toLowerCase().includes('date')) {
          mappedColumn.valueFormatter = (params: any) => {
            return this.formatDate(params.value);
          };
        }

        columnDefinitions.push(mappedColumn);
      }
    });

    // console.log(columnDefinitions);
    return columnDefinitions;
  }
  clear() {
    this.reoprtForm = this.formInit();
    this.refreshData();
    this.clearMsgs();
    this.rowData = [];
    this.blocksList = [];
    this.flatsList = [];
    this.columnDefs1 = [];
    this.custCode = "";
    this.totalRent = 0;
    this.totalService = 0;
  }

  isDate(value: any) {
    return (new Date(value)).toString() !== 'Invalid Date' && !isNaN(new Date(value).getDate());
  }

  formatDate(date: any) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are zero based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SR901",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }

}

