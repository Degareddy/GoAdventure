import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SubSink } from 'subsink';
import { technicianClass } from '../../utilities.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DatePipe } from '@angular/common';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-technician',
  templateUrl: './technician.component.html',
  styleUrls: ['./technician.component.css']
})
export class TechnicianComponent implements OnInit, OnDestroy {
  technicianForm!: FormGroup;
  subsink!: SubSink;
  public slNum: number = 0;
  retMessage: string = "";
  textMessageClass: string = "";
  dialogOpen = false;
  currentStatus: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  dataFlag: boolean = false;
  returnMsg: string = "";

  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80, resizable: true, },
  { field: "techCode", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "techName", headerName: "Technician", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "startDate", headerName: "Start Date", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "startTime", headerName: "Start Time", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "givenDate", headerName: "Given Date", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "givenTime", headerName: "Given Time", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "endDate", headerName: "End Date", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "endTime", headerName: "End Time", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "taskStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  ];
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];

  statusList: Item[] = [
    { itemCode: "Allocate", itemName: "Allocate" },
    { itemCode: "Progress", itemName: "Progress" },
    { itemCode: "Close", itemName: "Close" }
  ];

  private techCls: technicianClass;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private utilityService: UtilitiesService, public dialog: MatDialog,
    private loader: NgxUiLoaderService, private datepipe: DatePipe, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, tranNo: string, status: string,
      complaintType: string, unit: string, block: string, complaint: string,
      tenant: string, priority: string, complaintTypeName: string, property: string
    }) {
    this.technicianForm = this.formInit();
    this.subsink = new SubSink();
    this.techCls = new technicianClass();
  }

  ngOnDestroy() {
    this.subsink.unsubscribe();
  }

  prepareGrvCls() {
    const formValues = this.technicianForm.value;
    this.techCls.Company = this.userDataService.userData.company;
    this.techCls.LangId = this.userDataService.userData.langId;
    this.techCls.Location = this.userDataService.userData.location;
    this.techCls.Mode = this.data.mode;
    this.techCls.Notes = formValues.notes;
    this.techCls.RefNo = this.userDataService.userData.sessionID;
    this.techCls.SlNo = this.slNum;
    const fromDateControl = formValues.fromDate;
    const givenDateControl = formValues.givenDate;
    const toDateControl = formValues.toDate;
    const selectedFromDate = fromDateControl;
    const selectedGivenDate = givenDateControl;
    const selectedToDate = toDateControl;
    const utcFromDate = new Date(selectedFromDate);
    const utcGivenDate = new Date(selectedGivenDate);
    const utcToDate = new Date(selectedToDate);
    const formattedFromDate = this.datepipe.transform(utcFromDate, 'yyyy-MM-dd');
    const formattedGivenDate = this.datepipe.transform(utcGivenDate, 'yyyy-MM-dd');
    const formattedToDate = this.datepipe.transform(utcToDate, 'yyyy-MM-dd');

    if (formattedFromDate) {
      this.techCls.StartDate = formattedFromDate;

    }
    if (formattedGivenDate) {
      this.techCls.givenDate = formattedGivenDate;
    }
    if (formattedToDate) {
      this.techCls.EndDate = formattedToDate;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (timeRegex.test(formValues.fromTime)) {
      this.techCls.StartTime = formValues.fromTime + ":00";
    }
    else {
      this.techCls.StartTime = formValues.fromTime;
    }

    if (timeRegex.test(formValues.toTime)) {
      this.techCls.EndTime = formValues.toTime + ":00";
    }
    else {
      this.techCls.EndTime = formValues.toTime;
    }
    if (timeRegex.test(formValues.givenTime)) {
      this.techCls.givenTime = formValues.givenTime + ":00";
    }
    else {
      this.techCls.givenTime = formValues.givenTime;
    }
    this.techCls.TaskStatus = formValues.taskStatus;
    this.techCls.TranNo = this.data.tranNo;
    this.techCls.User = this.userDataService.userData.userID;
  }
  apply() {
    if (this.technicianForm.invalid) {
      return;
    }
    else {
      this.prepareGrvCls();
      this.loader.start();
      try {
        this.subsink.sink = this.utilityService.UpdateGrievanceTechs(this.techCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.returnMsg = res.message;
            this.loadData(res.tranNoNew, true);
            this.dataFlag = true;
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }

  ngOnInit() {
    this.loadData(this.data.tranNo, false);
  }

  loadData(tarnNo: string, loadFlag: boolean) {
    const techBody = {
      ...this.commonParams(),
      tranNo: tarnNo,
      issueStatus: this.data.status
    }
    try {
      this.subsink.sink = this.utilityService.GetGrievanceTechs(techBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
          if (loadFlag && this.data.mode != "Delete" && this.slNum === 0) {
            const maxSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
              return Math.max(maxSlNo, currentItem.slNo);
            }, 0);
            console.log('Max slNo:', maxSlNo);
            this.slNum = maxSlNo;
          }
          else if (loadFlag && this.data.mode === "Delete" && this.slNum != 0) {
            this.addRecord();
            this.retMessage = this.returnMsg;
            this.textMessageClass = "green";
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
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

  formInit() {
    return this.fb.group({
      // mode: ['View'],
      party: ['', Validators.required],
      fromDate: [new Date(), Validators.required],
      givenDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      fromTime: [this.getCurrentTime(), Validators.required],
      givenTime: [this.getCurrentTime(), Validators.required],
      toTime: [this.getCurrentTime(), Validators.required],
      notes: [''],
      taskStatus: ['', Validators.required]
    });
  }

  onRowSelected(event: any) {
    // console.log(event.data);
    this.slNum = event.data.slNo;
    this.techCls.TechCode = event.data.techCode;
    this.techCls.Notes = event.data.notes;
    this.currentStatus = event.data.taskStatus;
    this.technicianForm.patchValue({
      party: event.data.techName,
      fromDate: event.data.startDate,
      givenDate: event.data.givenDate,
      toDate: event.data.endDate,
      fromTime: event.data.startTime,
      givenTime: event.data.givenTime,
      toTime: event.data.endTime,
      notes: event.data.notes,
      taskStatus: event.data.taskStatus
    });
    // this.getGrievanceDetails(event.data.tranNo);
    this.retMessage = "";
    this.textMessageClass = "";
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      item: this.technicianForm.controls['party'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subsink.sink = this.utilityService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.technicianForm.controls['party'].patchValue(res.data.selName);
            this.techCls.TechCode = res.data.selCode
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.technicianForm.controls['party'].value, 'PartyType': "EMPLOYEE",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.technicianForm.controls['party'].setValue(result.partyName);
                  this.techCls.TechCode = result.code;
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
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

  Delete() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      console.log(dialogResult);
      if (dialogResult) {
        this.apply();
      }
    });
  }

  addRecord() {
    this.technicianForm = this.formInit();
    this.slNum = 0;
    this.currentStatus = "";
    this.textMessageClass = "";
    this.retMessage = "";
  }
}
