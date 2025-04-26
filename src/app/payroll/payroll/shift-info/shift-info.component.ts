import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { UserData } from '../payroll.module';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { NgxUiLoaderRouterModule, NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { shiftInfo } from '../payroll.class';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { ScreenId, TextClr } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-shift-info',
  templateUrl: './shift-info.component.html',
  styleUrls: ['./shift-info.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class ShiftInfoComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  pstForm!: FormGroup;
  typeCode!: any;
  textMessageClass!: string;
  retMessage!: string;
  typeStatus!: string;
  @Input() max: any;
  tomorrow = new Date();
  shiftCls: shiftInfo;
  newMessage!: string;
  shiftCodes:Item[]=[]
  private subsink: SubSink = new SubSink();

  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [
      { field: "typeCode", headerName: "Type Code", sortable: true, filter: true, resizable: true, flex: 2},
      { field: "typeDesc", headerName: "Type Desc", sortable: true, filter: true, resizable: true, flex: 1},
      { field: "fromTime", headerName: "From Time",valueFormatter: (params: any) => {
        const timeStr = params.value;
        if (!timeStr) return '';
    
        const [hours, minutes, seconds] = timeStr.split(':');
        const date = new Date();
        date.setHours(+hours, +minutes, +seconds || 0);
    
        return this.datePipe.transform(date, 'hh:mm a');
      },sortable: true, filter: true, resizable: true, flex: 1},
      { field: "toTime", headerName: "To Time",valueFormatter: (params: any) => {
        const timeStr = params.value;
        if (!timeStr) return '';
    
        const [hours, minutes, seconds] = timeStr.split(':');
        const date = new Date();
        date.setHours(+hours, +minutes, +seconds || 0);
    
        return this.datePipe.transform(date, 'hh:mm a');},sortable: true, filter: true, resizable: true, flex: 1},
      { field: "typeRate", headerName: "Type Rate", sortable: true, filter: true, resizable: true, flex: 1},
      { field: "tranDate", headerName: "Type Date",valueFormatter:(params:any)=>{ return this.datePipe.transform(params.value)} ,sortable: true, filter: true, resizable: true, flex: 1},
      { field: "typeStatus", headerName: "Type Status", sortable: true, filter: true, resizable: true, flex: 1},
  ];

  constructor(protected route: ActivatedRoute,
    protected router: Router, private userDataService: UserDataService,
   
    private masterService: MastersService, public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder, private prService: PayrollService,
    private datePipe: DatePipe,private payService: PayrollService,) {
    this.masterParams = new MasterParams();

    this.pstForm = this.formInit();
    this.shiftCls = new shiftInfo();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({

      typeCode: ['', [Validators.required, Validators.maxLength(10)]],
      typeDesc: ['', [Validators.required, Validators.maxLength(50)]],
      fromTime: [this.getCurrentTime()],
      toTime: [this.getCurrentTime()],
      typeRate: [''],
      tranDate: [new Date(), [Validators.required, this.validateSqlDate]],
      notes: ['', [Validators.maxLength(512)]],
      mode: ['View']
    });
  }
  validateSqlDate(control: AbstractControl): ValidationErrors | null {
    const date = control.value;
    if (!(date instanceof Date)) return { invalidDate: true };
    const minDate = new Date('1753-01-01');
    const maxDate = new Date('9999-12-31');
    return date >= minDate && date <= maxDate ? null : { dateOutOfRange: true };
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
    this.gridApi.sizeColumnsToFit();
  }
  onRowSelected(event: any) {
    // this.pstForm.get('typeCode')?.setValue(event.data.typeCode);
    // this.getShiftData(event.data.typeCode, "View");

    const rowData = event.data;
    this.reset() 

    if (rowData) {
      this.pstForm.patchValue({
      typeCode: rowData.typeCode || '',
      fromTime: rowData.fromTime || '',
      toTime: rowData.toTime || '',
      typeDesc: rowData.typeDesc || '',
      typeRate: rowData.typeRate || '',
      tranDate: rowData.tranDate ? new Date(rowData.tranDate) : '',
      notes: rowData.notes || ''
    });
    this.typeStatus = rowData.typeStatus;


    this.textMessageClass = 'green';
    this.retMessage = "Shift data loaded for " + (rowData.typeCode || '');
  }

  }

  ngOnInit(): void {
   this.loadData();
   this.loadGridData();
  }
  loadGridData(){
     const data ={
          ...this.commonParams(),
          item:"SHIFTTYPES",
          mode:this.pstForm.get('mode')?.value
        }
        const requests = [
          this.payService.GetShiftTypesList(data)
        ];
         this.subsink.sink = forkJoin(requests).subscribe(
          (results: any[]) => {
            this.rowData = results[0]['data'];
          },
          (error: any) => {
            this.textMessageClass = 'red';
            this.retMessage = error.message;
    
          }
        );  
  }
  loadData(){
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body = {
      ...this.commonParams(),
      item: 'SM607'

    };
    try {
      this.masterService.getModesList(body).subscribe((res: any) => {
        //console.log(res);
        this.modes = res['data'];
      });
      this.masterParams.item = this.pstForm.controls['bonusCode'].value;
    }
    catch (ex) {
      //console.log(ex);
    }
    this.masterParams.company = this.userDataService.userData.company;
        this.masterParams.location = this.userDataService.userData.location;
        this.masterParams.langId = this.userDataService.userData.langId;
        this.masterParams.item = "SHIFTTYPES";
        this.masterParams.user = this.userDataService.userData.userID;
        this.masterParams.refNo = this.userDataService.userData.sessionID;
        

        // this.subsink.sink = this.masterService.GetMasterItemsList(this.masterParams).subscribe((res: any) => {
        //   if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        //     this.shiftCodes = res['data'];
        //     if (this.shiftCodes.length === 1) {
        //       this.pstForm.get('typeCode')!.patchValue(this.shiftCodes[0].itemCode);
        //     }
        //   }
        //   else {
        //     this.displayMessage(res.message + " for types list!", TextClr.red);
        //   }
    
        // });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'SHIFTYPES',
        TranNo: this.pstForm.controls['typeCode'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      console.log(body);
      this.subsink.sink = this.prService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.shiftCls.typeCode = res.data.selTranNo;
            this.getShiftData(this.masterParams, this.pstForm.get('mode')?.value);
          }
          else {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.pstForm.controls['typeCode'].value, 'TranType': "SHIFTYPES",
                'search': 'Shift Details'
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.shiftCls.typeCode = result;
                try {
                  this.getShiftData(this.masterParams, this.pstForm.get('mode')?.value);
                }
                catch (ex: any) {
                  this.retMessage = ex;
                  this.textMessageClass = 'red';
                }
              }
            });
          }
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
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


  reset() {
    this.pstForm = this.formInit();
    this.typeStatus = '';
    this.retMessage = '';
  }

  getShiftData(masterparams: MasterParams, mode: string) {
    // this.masterParams.tranNo = this.pstForm.controls['typeCode'].value;
    this.masterParams.tranNo = this.pstForm.controls['typeCode'].value;

    //console.log(this.masterParams);
    try {
      this.loader.start();
      this.prService.GetShiftTypeDetails(this.masterParams).subscribe((res: any) => {
        // console.log(res);
        this.loader.stop();

        if (res.status.toUpperCase() == "SUCCESS") {
          console.log(res);
          this.typeStatus = res['data'].tranStatus;
          this.pstForm.controls['typeCode'].setValue(res['data'].typeCode);
          this.pstForm.controls['toTime'].setValue(res['data'].toTime);
          this.pstForm.controls['fromTime'].setValue(res['data'].fromTime);

          this.pstForm.controls['typeDesc'].setValue(res['data'].typeDesc);
          this.pstForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.pstForm.controls['typeRate'].setValue(res['data'].typeDate);
          this.pstForm.controls['notes'].setValue(res['data'].notes);

          this.textMessageClass = 'green';
          this.retMessage =
            'Retriving data ' + res.message + ' has completed';
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex;
    }
  }


  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  ShiftDetailsCls() {
    this.shiftCls.company = this.userDataService.userData.company;
    this.shiftCls.location = this.userDataService.userData.location
    //this.shiftCls.langID = this.userDataService.userData.langId
    this.shiftCls.typeCode = this.pstForm.controls['typeCode'].value;

    this.shiftCls.toTime = this.pstForm.controls['toTime'].value;
    this.shiftCls.fromTime = this.pstForm.controls['fromTime'].value;
    this.shiftCls.typeDesc = this.pstForm.controls['typeDesc'].value;
    this.shiftCls.typeRate = this.pstForm.controls['typeRate'].value;
    this.shiftCls.notes = this.pstForm.controls['notes'].value;
    this.shiftCls.typeStatus = this.typeStatus;
    this.shiftCls.mode = this.pstForm.controls['mode'].value;
    this.shiftCls.user = this.userDataService.userData.userID;
    this.shiftCls.refNo = this.userDataService.userData.sessionID;
    this.shiftCls.tranDate = this.pstForm.controls['tranDate'].value;

  }


  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.pstForm.controls['mode'].setValue(event, { emitEvent: false });
      // this.pstForm.get('typeCode')!.disable();
      this.pstForm.get('typeCode')!.enable();
      this.pstForm.get('typeCode')!.updateValueAndValidity();
      // this.pstForm.get('typeCode')!.clearValidators();
      // this.pstForm.controls['mode'].setValue("");
    }

    else {
      this.pstForm.controls['mode'].setValue(event, { emitEvent: false });
      this.pstForm.get('typeCode')!.enable();
    }
  }

  onUpdate() {
    this.clearMsg();
    if (this.pstForm.invalid) {
      return;
    }
    else {
      this.ShiftDetailsCls();
        try {
          this.loader.start();
          this.subsink.sink = this.prService.UpdateShiftDetails(this.shiftCls).subscribe((res: SaveApiResponse) => {
            this.loader.stop();
            if (res.retVal > 100 && res.retVal < 200) {
              this.newMessage = res.message;
              this.textMessageClass = "green";
              this.modeChange("Modify");
              this.pstForm.controls['typeCode'].setValue(res.tranNoNew);
              this.shiftCls.typeCode = res.tranNoNew;
              // if (res.tranNoNew) {
              //   this.getShiftData(this.masterParams, this.pstForm.get('mode')?.value);
              // }
              this.loadGridData();
            }
            else {
              this.retMessage = res.message;
              this.textMessageClass = "red";
            }
          });
        } catch (ex: any) {
          this.retMessage = ex;
          this.textMessageClass = "red";
        }
      }
    }

    Close(){
      this.router.navigateByUrl('/home');

    }
    onHelpCilcked() {
      const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

        disableClose: true,
        data: {
          ScrId: "SM607",
          SlNo: 0,
          IsPrevious: false,
          IsNext: false,
          User: this.userDataService.userData.userID,
          RefNo: this.userDataService.userData.sessionID
        }
      });
      dialogRef.afterClosed().subscribe(result => {

      });
    }

  }
