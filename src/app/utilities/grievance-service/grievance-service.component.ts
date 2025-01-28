import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MasterParams } from 'src/app/sales/sales.class';
import { SubSink } from 'subsink';
import { GreivanceClass, GrievanceParams } from '../utilities.class'
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { GrievanceCostsComponent } from './grievance-costs/grievance-costs.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TechnicianComponent } from './technician/technician.component';
import { Router } from '@angular/router';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { displayMsg, ScreenId, searchNotes, TextClr, TranStatus, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-grievance-service',
  templateUrl: './grievance-service.component.html',
  styleUrls: ['./grievance-service.component.css']
})
export class GrievanceServiceComponent implements OnInit, OnDestroy {
  grievancesForm!: FormGroup;
  formName: string = "grievance services"
  @Input() max: any;
  today = new Date();
  masterParams!: MasterParams;
  grParams!: GrievanceParams;
  modes: Item[] = [];
  private subSink: SubSink;
  retMessage: string = "";
  textMessageClass: string = "";
  refernceNo!: string;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  grcls: GreivanceClass;
  tenant!: string;
  tenantName!: string;
  property!: string;
  block!: string;
  unit!: string
  propertyName!: string;
  blockName!: string;
  unitName!: string
  complaintType!: string;
  complaint!: string;
  notes!: string;
  currIssueStatus!: string;
  ttDays!: string;
  ttHours!: string;
  ttMins!: string;
  costToMgmt!: number;
  costToLandlord!: number;
  costToTenant!: number;
  yearlyCount!: number;
  monthlyCount!: number;
  raisedDate!: Date;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  formattedDateTime!: string;
  dialogOpen = false;

  columnDefs: any = [{ field: "unit", headerName: "Unit", width: 80, resizable: true, },
  { field: "complaintType", headerName: "Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "raisedDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
      }
      return null;
    },

  },
  {
    field: "issueStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1,
    cellStyle: (params: any) => {
      const cellValue = params.value;

      if (cellValue === 'Open') {
        return { backgroundColor: 'red', color: 'White' };
      }
      else if (cellValue === 'Progress') {
        return { backgroundColor: 'blue', color: 'White' };
      }
      else if (cellValue === 'Closed') {
        return { backgroundColor: 'green', color: 'White' };
      }
      else if (cellValue === 'Allocated') {
        return { backgroundColor: 'gray', color: 'White' };
      }
      else {
        return null;
      }
    }
  },
  { field: "priority", headerName: "Priority", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "tenantName", headerName: "Tenant Name", sortable: true, filter: true, resizable: true, flex: 1 },
  ];

  public rowSelection: 'single' | 'multiple' = 'multiple';
  onRowClick: any;

  priorityList: Item[] = [
    { itemCode: "Urgent", itemName: "Urgent" },
    { itemCode: "Emergency", itemName: "Emergency" },
    { itemCode: "Immediate", itemName: "Immediate" },
    { itemCode: "Not Immediate", itemName: "Not Immediate" }
  ];

  issuesStatusList: Item[] = [
    { itemCode: "all", itemName: "All" },
    { itemCode: "open", itemName: "Open" },
    { itemCode: "allocated", itemName: "Allocated" },
    { itemCode: "progress", itemName: "Progress" },
    { itemCode: "pending", itemName: "Pending" },
    { itemCode: "closed", itemName: "Closed" }
  ];
  data: any;
  constructor(private fb: FormBuilder,
    private datePipe: DatePipe,
    private masterService: MastersService,
    private loader: NgxUiLoaderService,
    public dialog: MatDialog,
    protected router: Router, private userDataService: UserDataService,
    private utilityService: UtilitiesService) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.grievancesForm = this.formInit();
    this.grParams = new GrievanceParams();
    this.grcls = new GreivanceClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
    this.grParams.company = this.userDataService.userData.company;
    this.grParams.location = this.userDataService.userData.location;
    this.grParams.refNo = this.userDataService.userData.sessionID;
    this.grParams.user = this.userDataService.userData.userID;
    this.grParams.langId = this.userDataService.userData.langId;

    if (history.state.data) {
      this.data = history.state.data;
      if (this.data && this.data.tranNo) {

        this.getGrievanceDetails(this.data.tranNo);
      }
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    const hours = this.padZero(now.getHours());
    const minutes = this.padZero(now.getMinutes());

    return `${hours}:${minutes}`;
  }

  padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      priority: ['', Validators.required],
      costTo: [''],
      allocatedDate: [new Date(), Validators.required],
      allocatedTime: [this.getCurrentTime()],
      closedDate: [new Date(), Validators.required],
      closedTime: [this.getCurrentTime()],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1)],
      toDate: [new Date()],
      all: [false],
      issueStatus: ['', Validators.required]
    });
  }

  Close() {
    this.router.navigateByUrl('/home');
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
  loadData() {
    const modebody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: ScreenId.GRIEVANCES_SCRID,
      refNo: this.userDataService.userData.sessionID
    };
    try {
      const modes$ = this.masterService.getModesList(modebody);
      this.subSink.sink = forkJoin([modes$]).subscribe(
        ([modesRes]: any) => {
          if(modesRes.status.toUpperCase()=== AccessSettings.SUCCESS){
            this.modes = modesRes['data'];
          }
          else{
            this.displayMessage(displayMsg.ERROR+ "Modes list empty!", TextClr.red);
          }
        },
        error => {
          this.displayMessage(displayMsg.ERROR+ error.message, TextClr.red);

        }
      );

    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  getGrievanceDetailsList() {
    this.rowData = [];
    this.clearMsg();
    this.grParams.issueStatus = this.grievancesForm.controls['issueStatus'].value;
    this.grParams.fromDate = this.formatDate(this.grievancesForm.controls['fromDate'].value);
    this.grParams.toDate = this.formatDate(this.grievancesForm.controls['toDate'].value);
    this.grParams.all = this.grievancesForm.controls['all'].value;
    this.grParams.tranType = TranType.GRIEVANCE;
    this.loader.start();
    try {
      this.subSink.sink = this.utilityService.GetSelectedGrievancesList(this.grParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      this.loader.stop();
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onRowSelected(event: any) {

    this.getGrievanceDetails(event.data.tranNo);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  pullData() {
    this.getGrievanceDetailsList();
  }

  clearMsg() {
    this.displayMessage("", "");
    this.tenant = "";
    this.tenantName = "";

    this.property = "";
    this.block = "";
    this.unit = "";
    this.propertyName = "";
    this.blockName = "";
    this.unitName = "";
    this.complaintType = "";
    this.complaint = "";
    this.notes = "";

    this.grievancesForm.controls['priority'].setValue("");
    this.currIssueStatus = "";

    this.ttDays = "";
    this.ttHours = "";
    this.ttMins = "";
    this.raisedDate = new Date();
    this.costToMgmt = 0;
    this.costToLandlord = 0;
    this.costToTenant = 0;
    this.refernceNo = "";
  }
  getRowStyle(params: any) {
    if (params.node.isSelected()) {
      return { background: 'yellow' }; // Apply the selected row highlight style
    }
    return null;
  }

  getGrievanceDetails(tranNo: string) {
    this.clearMsg();
    this.refernceNo = tranNo;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);

    this.grParams.langId = this.userDataService.userData.langId;
    this.grParams.issueStatus = TranStatus.ANY;
    this.grParams.fromDate = formattedFirstDayOfMonth;
    this.grParams.toDate = formattedCurrentDate;
    this.grParams.tranNo = tranNo;
    this.grParams.tranType = TranType.GRIEVANCE;
    this.loader.start();
    this.subSink.sink = this.utilityService.GetTenantSpecificGrievanceDetails(this.grParams).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.tenant = res['data'].tenant;
        this.tenantName = res['data'].tenantName;
        this.grcls.propertyName = res['data'].propertyName
        this.blockName = res['data'].blockName;
        this.unitName = res['data'].unitName;
        this.property = res['data'].property;
        this.block = res['data'].block;
        this.unit = res['data'].unit;
        this.complaintType = res['data'].complaintType;
        this.complaint = res['data'].complaint;
        this.notes = res['data'].notes;
        this.grievancesForm.controls['priority'].setValue(res['data'].priority);
        this.currIssueStatus = res['data'].issueStatus;
        this.ttDays = res['data'].ttDays;
        this.ttHours = res['data'].ttHours;
        this.ttMins = res['data'].ttMins;
        this.costToMgmt = res['data'].costToMgmt;
        this.costToLandlord = res['data'].costToLandlord;
        this.costToTenant = res['data'].costToTenant;
        this.yearlyCount = res['data'].yearlyCount;
        this.monthlyCount = res['data'].monthlyCount;
        this.raisedDate = res['data'].raisedDate;
        if (res['data'].allocatedDate !== '0001-01-01T00:00:00' && res['data'].allocatedDate !== "") {
          const dateTime = new Date(res['data'].allocatedDate);
          const datePart = dateTime.toISOString().split('T')[0];
          console.log(dateTime);
          this.grievancesForm.controls['allocatedDate'].setValue(datePart);
        }
        if (res['data'].closedDate !== '0001-01-01T00:00:00' && res['data'].closedDate !== "") {
          const closedDateTime = new Date(res['data'].closedDate);
          const closedDatePart = closedDateTime.toISOString().split('T')[0];
          console.log(closedDateTime);
          this.grievancesForm.controls['closedDate'].setValue(closedDatePart);
        }
        this.grievancesForm.controls['closedTime'].setValue(res['data'].closedTime);
        this.grievancesForm.controls['allocatedTime'].setValue(res['data'].allocatedTime);
      }
      else {
        this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
      }
    });
  }

  onCostClick() {
    const dialogRef: MatDialogRef<GrievanceCostsComponent> = this.dialog.open(GrievanceCostsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        'tranNo': this.refernceNo,
        'mode': this.grievancesForm.controls['mode'].value,
        'complaintType': this.complaintType,
        'status': this.currIssueStatus,
        'unit': this.unit,
        'block': this.block,
        'complaint': this.complaint,
        'tenant': this.tenant,
        'priority': this.grievancesForm.controls['priority'].value,
        'complaintTypeName': "",
        'property': this.property,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getGrievanceDetails(this.refernceNo);
      }
    });
  }

  technicianAllocation() {
    const dialogRef: MatDialogRef<TechnicianComponent> = this.dialog.open(TechnicianComponent, {
      width: '78%', // Set the width of the dialog
      disableClose: true,
      data: {
        'tranNo': this.refernceNo,
        'mode': this.grievancesForm.controls['mode'].value,
        'complaintType': this.complaintType,
        'status': this.currIssueStatus,
        'unit': this.unit,
        'block': this.block,
        'complaint': this.complaint,
        'tenant': this.tenant,
        'priority': this.grievancesForm.controls['priority'].value,
        'complaintTypeName': "",
        'property': this.property,
        'fromDate':this.formatDate(this.raisedDate)
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getGrievanceDetails(this.refernceNo);
      }
    });
  }
  prepareGrivenceCls() {
    const formValues = this.grievancesForm.value;
    this.grcls.mode = this.grievancesForm.controls['mode'].value;
    this.grcls.company = this.userDataService.userData.company;
    this.grcls.location = this.userDataService.userData.location;
    this.grcls.langId = 1;
    this.grcls.tranNo = this.refernceNo;

    this.grcls.property = this.property;
    this.grcls.block = this.block;
    this.grcls.unit = this.unit;
    this.grcls.tenant = this.tenant;
    this.grcls.complaintType = this.complaintType;
    this.grcls.complaintTypeName = "";
    this.grcls.complaint = this.complaint;
    this.grcls.priority = formValues.priority;
    this.grcls.remarks = "";
    this.grcls.user = this.userDataService.userData.userID;
    this.grcls.refNo = this.userDataService.userData.sessionID;
    this.grcls.raisedDate = this.raisedDate;


    const fromDateControl = this.grievancesForm.controls['allocatedDate'].value;
    const toDateControl = this.grievancesForm.controls['closedDate'].value;
    const selectedFromDate = fromDateControl;
    const selectedToDate = toDateControl;
    const utcFromDate = new Date(selectedFromDate);
    const utcToDate = new Date(selectedToDate);
    const formattedFromDate = this.datePipe.transform(utcFromDate, 'dd-MM-yyyy');
    const formattedToDate = this.datePipe.transform(utcToDate, 'dd-MM-yyyy');
    if (formattedFromDate) {
      this.grcls.allocatedDate = formattedFromDate;
    }
    if (formattedToDate) {
      this.grcls.closedDate = formattedToDate;
    }
    this.grcls.allocatedTime = formValues.allocatedTime;
    this.grcls.closedTime = formValues.closedTime;
  }
  update() {
    this.displayMessage("","");
    if (this.grievancesForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareGrivenceCls();
        this.loader.start();
        this.subSink.sink = this.utilityService.UpdateGrievanceAllocation(this.grcls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.refernceNo = res.tranNoNew;
            this.getGrievanceDetails(this.refernceNo);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.GRIEVANCES_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }

  NotesDetails() {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': this.refernceNo,
        'mode': this.grievancesForm.controls['mode'].value,
        'note': this.notes,
        'TranType': TranType.GRIEVANCE,  // Pass any data you want to send to CustomerDetailsComponent
        'search': searchNotes.GRIEVANCE_NOTE
      }
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

}
