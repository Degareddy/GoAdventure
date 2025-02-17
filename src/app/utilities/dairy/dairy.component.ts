import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Mode, ScreenId, searchType, TextClr, Type } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
import { ActivityDiary } from '../utilities.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dairy',
  templateUrl: './dairy.component.html',
  styleUrls: ['./dairy.component.css']
})
export class DairyComponent implements OnInit, OnDestroy {

  dairyForm!: FormGroup;
  private subsink: SubSink = new SubSink();
  modes: Item[] = [];
  retMessage: string = "";
  maxTime: string = '';
  textMessageClass: string = "";
  tomorrow: Date = new Date();
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private actCls: ActivityDiary = new ActivityDiary();
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 100;
  statusList: Item[] = [
    { itemCode: "OPEN", itemName: "Open" },
    { itemCode: "CONFIRM", itemName: "Confirm" }
  ];
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "activityDescription", headerName: "Activity", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "activityStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "fromTime", headerName: "From Time", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "toTime", headerName: "To Time", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "selfRating", headerName: "Self Rating", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "evalRating", headerName: "Eval Rating", sortable: true, filter: true, resizable: true, width: 220 },
  {
    field: "diaryDate", headerName: "Date", sortable: true, filter: true, resizable: true, width: 220, valueFormatter: function (params: any) {
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
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  empCode!: string;
  admCode:string='';
  dialogOpen: boolean = false;
  constructor(private fb: FormBuilder, protected router: Router,
    private loader: NgxUiLoaderService, private dialog: MatDialog,
    private userDataService: UserDataService, private datePipe: DatePipe,
    private masterService: MastersService, private utilService: UtilitiesService) {
    this.dairyForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  ngOnInit(): void {
    this.setMaxTime();
    this.dairyForm.get('Evalname')?.patchValue(this.userDataService.userData.userName);
    this.admCode = this.userDataService.userData.userID;
    const currentTime = this.getCurrentTime();
    this.dairyForm.get('fromTime')?.patchValue(currentTime);
    this.dairyForm.get('toTime')?.patchValue(currentTime);
    // this.loadData();
  }
  private createRequestDataForSearch(item: string, type: string) {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }
  checkIsSame(){
    if(this.empCode === this.admCode){
      this.dairyForm.get('Evalrating')!.patchValue('0');
      this.dairyForm.get('Evalrating')?.disable();
      this.dairyForm.get('date')?.enable();
      this.dairyForm.get('fromTime')?.enable();
      this.dairyForm.get('activity')?.enable();
      this.dairyForm.get('toTime')?.enable();
      this.dairyForm.get('status')?.enable();
      this.dairyForm.get('rating')?.enable();
      // this.dairyForm.get('Evalrating')?.enable();
    }
    else{
      // this.dairyForm.get('name')?.disable();
      this.dairyForm.get('date')?.disable();
      this.dairyForm.get('fromTime')?.disable();
      this.dairyForm.get('activity')?.disable();
      this.dairyForm.get('toTime')?.disable();
      this.dairyForm.get('status')?.disable();
      this.dairyForm.get('rating')?.disable();
      this.dairyForm.get('Evalrating')?.enable();
    }
  }
  // async onAdminSearch() {
  //   const body = this.createRequestDataForSearch(this.dairyForm.get('Evalname')!.value || "", Type.EMPLOYEE);
  //   try {
  //     this.subsink.sink = await this.utilService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
  //       if (res.retVal === 0) {
  //         if (res && res.data && res.data.nameCount === 1) {
  //           this.dairyForm.get('Evalname')!.patchValue(res.data.selName,{emitEvent: false});
  //           this.admCode = res.data.selCode;
  //           this.checkIsSame();
  //         }
  //         else {
  //           if (!this.dialogOpen) {
  //             const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
  //               width: '90%',
  //               disableClose: true,
  //               data: {
  //                 PartyName: this.dairyForm.get('Evalname')!.value, PartyType: Type.EMPLOYEE,
  //                 search: searchType.EMPLOYEE
  //               }
  //             });
  //             this.dialogOpen = true;
  //             dialogRef.afterClosed().subscribe(result => {
  //               if (result != true && result != undefined) {
  //                 this.dairyForm.get('Evalname')!.patchValue(result.partyName,{emitEvent: false});
  //                 this.admCode = result.code;
                  
  //               }
  //               this.dialogOpen = false;
  //               this.checkIsSame()
  //             });
  //           }

  //         }
  //       }
  //       else {
  //         this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
  //       }
  //     });
  //   }
  //   catch (ex: any) {
  //     this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
  //   }
  // }
  onEmpClear(){
    this.dairyForm.get('name')!.setValue('');
    this.rowData=[];
  }
  async onEmployeeSearch() {
    const body = this.createRequestDataForSearch(this.dairyForm.get('name')!.value || "", Type.EMPLOYEE);
    try {
      this.subsink.sink = await this.utilService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.dairyForm.get('name')!.patchValue(res.data.selName,{emitEvent: false});
            this.empCode = res.data.selCode;
            this.getActivity(this.empCode);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.checkIsSame()

          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.dairyForm.get('name')!.value, PartyType: Type.EMPLOYEE,
                  search: searchType.EMPLOYEE
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.dairyForm.get('name')!.patchValue(result.partyName,{emitEvent: false});
                  this.empCode = result.code;
                  this.getActivity(this.empCode);
                  this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);

                }
                this.dialogOpen = false;
                this.checkIsSame()

              });
            }

          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.green);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  prepareCls() {
    let asDate: any;
    const formControls = this.dairyForm.controls;
    asDate = this.formatDate(formControls.date.value);
    this.actCls.company = this.userDataService.userData.company;
    this.actCls.location = this.userDataService.userData.location;
    this.actCls.user = this.userDataService.userData.userID;
    this.actCls.refNo = this.userDataService.userData.sessionID;
    this.actCls.mode = Mode.Modify;
    this.actCls.activityDescription = this.dairyForm.controls.activity.value;
    this.actCls.activityStatus = this.dairyForm.controls.status.value;
    this.actCls.diaryDate = asDate;
    this.actCls.selfRating= this.dairyForm.controls.rating.value;
    this.actCls.evalRating= this.dairyForm.controls.Evalrating.value;
    const fromTimeValue = this.dairyForm.controls.fromTime.value;
    const toTimeValue = this.dairyForm.controls.toTime.value;
    if (fromTimeValue) {
      this.actCls.fromTime = fromTimeValue.length === 5 ? `${fromTimeValue}:00` : fromTimeValue;
    }
    
    if (toTimeValue) {
      this.actCls.toTime = toTimeValue.length === 5 ? `${toTimeValue}:00` : toTimeValue;
    }
    
    this.actCls.remarks = this.dairyForm.controls.remarks.value;
    this.actCls.empCode = this.empCode;
    this.actCls.slNo = this.slNum;
  }
  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }
  isAdmin():boolean{
    if(this.userDataService.userData.userProfile.toUpperCase() !== 'CMPADMIN'){
      return true;
    }
    return false
  }
  setMaxTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.maxTime = `${hours}:${minutes}`; 
  }
  validateTime() {
    const selectedTime = this.dairyForm.controls['toTime'].value;
    if (selectedTime && selectedTime > this.maxTime) {
      alert('Future time selection is not allowed!');
      this.dairyForm.controls['toTime'].setValue(this.maxTime);
    }
  }
  getActivity(tranNo: string) {
    let asDate: any;
    const formControls = this.dairyForm.controls;
    asDate = this.formatDate(formControls.date.value);
    const body = {
      ...this.commonParams(),
      client: tranNo || '',
      asOnDate: asDate
    }
    try {
      this.subsink.sink = this.utilService.GetDiaryDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res.data;
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
        else {
          this.displayMessage(displayMsg.SUCCESS + res.message +' OR No Work is Done yet', TextClr.green);
        }
      })
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }


  }
  onSubmit() {
    if (this.dairyForm.invalid) {
      this.displayMessage("Enter required fields!", TextClr.red);
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subsink.sink = this.utilService.UpdateDiaryDetails(this.actCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.getActivity(res.tranNoNew);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }

  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  loadData() {
    const modeBody = {
      ...this.commonParams(),
      item: ScreenId.PURCHASE_REQUEST_SCRID
    };
    try {
      this.subsink.sink = this.masterService.getModesList(modeBody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  formInItS(){
    return this.fb.group({
      // name: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
      fromTime: ['', Validators.required],
      toTime: ['', Validators.required],
      activity: ['', Validators.required],
      status: ['', Validators.required],
      remarks: ['', Validators.required],
      rating: ['0'],
      Evalrating:['0'],
      Evalname:['']
    });
  }
  formInit() {
    return this.fb.group({
      name: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
      fromTime: ['', Validators.required],
      toTime: ['', Validators.required],
      activity: ['', Validators.required],
      status: ['', Validators.required],
      remarks: ['', Validators.required],
      rating: ['0'],
      Evalrating:['0'],
      Evalname:['']
    });


  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  clear() {
    this.dairyForm = this.formInItS();
    this.slNum = 0;
    this.displayMessage("", "");
  }
  close() {
    this.router.navigateByUrl('/home');
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
  onRowSelected(event: any) {
    console.log(event.data)
    this.dairyForm.get('name')?.patchValue(event.data.empName);
    this.empCode=event.data.empCode;
    this.dairyForm.get('date')?.patchValue(this.formatDate(event.data.diaryDate));
    this.dairyForm.get('date')?.patchValue(this.formatDate(event.data.diaryDate));
    this.dairyForm.get('fromTime')?.patchValue(event.data.fromTime);
    this.dairyForm.get('toTime')?.patchValue(event.data.toTime);
    this.slNum=event.data.slNo;
    this.dairyForm.get('activity')?.patchValue(event.data.activityDescription);
    this.dairyForm.get('status')?.patchValue(event.data.activityStatus);
    this.dairyForm.get('rating')?.patchValue(event.data.selfRating);
    this.dairyForm.get('remarks')?.patchValue(event.data.remarks);
    this.dairyForm.get('Evalrating')?.patchValue(event.data.evalRating);
    // this.dairyForm.get('rating')?.patchValue(event.data.activityStatus);
  }
  formatDates(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
}
