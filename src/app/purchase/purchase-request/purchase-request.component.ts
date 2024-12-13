import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { purchaseRequestHeader } from './../purchase.class';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PurchasedetailsComponent } from './purchasedetails/purchasedetails.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { GridApi } from 'ag-grid-community';
import { ExcelReportsService } from 'src/app/FileGenerator/excel-reports.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.css']
})

export class PurchaseRequestComponent implements OnInit, OnDestroy {
  purReqHdrForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  dialogOpen = false;
  private gridApi!: GridApi;
  retMessage!: string;
  textMessageClass!: string;
  retNum!: number;
  modeIndex!: number;
  prhClass!: purchaseRequestHeader;
  masterParams!: MasterParams;
  modes!: any[];
  tranStatus!: string;
  receivedOn!: string;
  receivedBy!: string;
  issuedOn!: string;
  issuedBy!: string;
  approvedOn!: string;
  approvedBy!: string;
  private subSink!: SubSink;
  totalAmount:number=0;
  itemCount:number=0;
  data: any;
  purDetailData: any;
  purHeaderData: any;
  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private excelService: ExcelReportsService,
    private loader: NgxUiLoaderService,
    protected purchreqservice: PurchaseService,
    private masterService: MastersService, private userDataService: UserDataService,
    public dialog: MatDialog, private fb: FormBuilder,
    private datePipe: DatePipe) {
    this.masterParams = new MasterParams();
    this.purReqHdrForm = this.formInit();
    this.prhClass = new purchaseRequestHeader();
    this.subSink = new SubSink();
  }

  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      purpose: ['', [Validators.required]],
      mode: ['View'],
      authorizePOs: [false]
    });
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modeBody = {
      ...this.commonParams(),
      item: 'ST111'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(modeBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  purchaseCls() {
    this.prhClass.company = this.userDataService.userData.company;
    this.prhClass.location = this.userDataService.userData.location;
    this.prhClass.langID = this.userDataService.userData.langId;
    this.prhClass.user = this.userDataService.userData.userID;
    this.prhClass.refNo = this.userDataService.userData.sessionID;
    this.prhClass.authorizePOs = false;
    this.prhClass.mode = this.purReqHdrForm.controls['mode'].value;
    this.prhClass.purpose = this.purReqHdrForm.controls['purpose'].value;
    this.prhClass.tranStatus = this.tranStatus;
    this.prhClass.tranDate = this.purReqHdrForm.controls['tranDate'].value;
    this.prhClass.tranNo = this.purReqHdrForm.controls['tranNo'].value;
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  onSubmit() {
    this.clearMsg();
    if (this.purReqHdrForm.invalid) {
      return;
    }
    else {
      this.purchaseCls();
      try {
        this.loader.start();
        this.subSink.sink = this.purchreqservice.InsertPurchaseRequestHdr(this.prhClass).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.modeChange("Modify");
            this.purReqHdrForm.controls['tranNo'].patchValue(res.tranNoNew);
            if (res.tranNoNew) {
              this.searchData();
            }
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

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<PurchasedetailsComponent> = this.dialog.open(PurchasedetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo, 'mode': this.purReqHdrForm.controls['mode'].value, 'status': this.tranStatus }  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.purchaseData(this.masterParams);
      }
    });

  }

  reset() {
    this.purReqHdrForm = this.formInit();
    this.clearValues();
    this.dialogOpen = false;
  }

  modeChange(event: string) {
    this.purReqHdrForm.controls['mode'].patchValue(event, { emitEvent: false });
    if (event === "Add") {
      this.purReqHdrForm.get('tranNo')!.patchValue('');
      this.purReqHdrForm.get('tranNo')!.disable();
      this.purReqHdrForm.get('tranNo')!.clearValidators();
      this.purReqHdrForm.get('tranNo')!.updateValueAndValidity();
      this.itemCount=0;
      this.totalAmount=0;
      this.purReqHdrForm.get('tranDate')?.patchValue(new Date());
      this.purReqHdrForm.get('purpose')?.patchValue('');
      
      this.clearValues();
    }
    else {
      this.purReqHdrForm.get('tranNo')!.enable();
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  getpurchaseDetails(tarnNum: any) {
    this.masterParams.tranNo = tarnNum;
    debugger;
    try {
      this.loader.start();
      this.subSink.sink = this.purchreqservice.GetPurRequestDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != 'FAIL') {
          this.purDetailData = res['data']
          // if (this.purDetailData) {
          //   this.excelService.generateExcel(this.purDetailData, this.purHeaderData, "Purchase-Request", new Date());
          // }
        } else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  generateExcel() {
    if (this.purReqHdrForm.controls['tranNo'].value) {
      this.getpurchaseDetails(this.purReqHdrForm.controls['tranNo'].value);
    }
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'PURREQ',
        TranNo: this.purReqHdrForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.subSink.sink = this.purchreqservice.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.purchaseData(this.masterParams);
          }
          else {
            this.clearValues();
            this.purReqHdrForm.controls['tranDate'].patchValue(new Date());
            this.purReqHdrForm.controls['purpose'].patchValue('');
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.purReqHdrForm.controls['tranNo'].value, 'TranType': "PURREQ",
                  'search': 'Purchase Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.masterParams.tranNo = result;
                  this.purchaseData(this.masterParams);
                }
              });
            }

          }
        }
        else {
          this.clearValues();
          this.purReqHdrForm.controls['tranDate'].patchValue(new Date());
          this.purReqHdrForm.controls['purpose'].patchValue('');
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });

    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST111",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID

      }
    });

  }

  clearValues() {
    this.itemCount=0;
    this.totalAmount=0;
    this.purReqHdrForm.get('tranDate')?.patchValue(new Date());
    this.purReqHdrForm.get('purpose')?.patchValue('');
    this.tranStatus = '';
    this.retMessage = '';
    this.receivedOn = "";
    this.receivedBy = "";
    this.issuedOn = "";
    this.issuedBy = "";
    this.approvedOn = "";
    this.approvedBy = "";
    this.retMessage = "";
    this.textMessageClass = "";
  }
  purchaseData(masterParams: MasterParams) {
    this.loader.start();
    try {
      this.subSink.sink = this.purchreqservice.getPurchaseReqData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.purHeaderData = res['data'];
          this.tranStatus = res['data'].tranStatus;
          this.purReqHdrForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.purReqHdrForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.purReqHdrForm.controls['purpose'].patchValue(res['data'].purpose);
          this.receivedBy = res['data'].receivedBy;
          this.issuedBy = res['data'].issuedBy;
          this.approvedOn = res['data'].approvedOn.startsWith('0001-01-01') ? '' : res['data'].approvedOn;
          this.issuedOn = res['data'].issuedOn.startsWith('0001-01-01') ? '' : res['data'].issuedOn;
          this.receivedOn = res['data'].receivedOn.startsWith('0001-01-01') ? '' : res['data'].receivedOn;
          this.approvedBy = res['data'].approvedBy;
          this.itemCount= res['data'].itemCount;
          this.totalAmount= res['data'].totalAmt;
          this.textMessageClass = 'green';
          this.retMessage =
            'Retriving data ' + res.message + ' has completed';

        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;

          // this.reset();
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }

  clear() {
    this.purReqHdrForm = this.formInit();
    this.tranStatus = '';
    this.retMessage = '';
    this.receivedOn = "";
    this.receivedBy = "";
    this.issuedOn = "";
    this.issuedBy = "";
    this.approvedOn = "";
    this.approvedBy = "";
    this.itemCount=0;
    this.totalAmount=0;
    this.dialogOpen = false;
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.purReqHdrForm.controls['mode'].value, tranNo: this.purReqHdrForm.controls['tranNo'].value, search: 'Purchase Request Docs', tranType: "PURREQ" }
    });

  }


  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.purReqHdrForm.controls['mode'].value,
        // 'note':this.purReqHdrForm.controls['notes'].value ,
        'TranType': "PURREQ",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Purchase Request Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "PURREQ",
        'tranNo': tranNo,
        'search': 'Purchase Request Log'
      }
    });
  }
}
