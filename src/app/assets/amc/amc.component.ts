import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { assetAMc } from '../assets.class';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AssetAMCDetailsComponent } from './asset-amc-details/asset-amc-details.component';
import { SearchEngineComponent } from '../../general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';

@Component({
  selector: 'app-amc',
  templateUrl: './amc.component.html',
  styleUrls: ['./amc.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class AmcComponent implements OnInit, OnDestroy {
  amcForm!: FormGroup;
  textMessageClass: string = "";
  retMessage: string = "";
  modes: Item[] = [];
  masterParams!: MasterParams;
  assstAMCCls: assetAMc;
  tranStatus!: any;
  subSink = new SubSink();
  dialogOpen = false;
  @Input() max: any;
  tomorrow = new Date();
  suppCode: string = "";
  constructor(protected route: ActivatedRoute,
    private masterService: MastersService, private utlService: UtilitiesService,
    protected router: Router, public dialog: MatDialog,
    protected assetService: AssetsService, private userDataService: UserDataService,
    private datepipe: DatePipe,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder) {
    this.amcForm = this.formInit();
    this.masterParams = new MasterParams();
    this.assstAMCCls = new assetAMc();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      amcType: ['', [Validators.required, Validators.maxLength(32)]],
      tranDate: [new Date(), [Validators.required]],
      supplier: ['', [Validators.required, Validators.maxLength(50)]],
      referenceNo: [''],
      effectiveDate: [new Date(), [Validators.required]],
      expiryDate: [new Date(), [Validators.required]],
      amcAmount: ['0.00', [Validators.required]],
      notes: [''],
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
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST505'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }

  }

  // get() {
  //   const body = {
  //     ...this.commonParams(),
  //     TranNo: this.amcForm.controls['tranNo'].value,
  //     LangId: this.userDataService.userData.langId
  //   }
  //   try {

  //     this.loader.start();
  //     this.subSink.sink = this.assetService.getAMCHdr(body).subscribe((res: any) => {
  //       this.loader.stop();
  //       if (res.status.toUpperCase() === "SUCCESS") {
  //         this.amcForm.controls['amcType'].patchValue(res['data'].amcType);
  //         this.amcForm.controls['tranDate'].patchValue(res['data'].tranDate);
  //         this.amcForm.controls['supplier'].patchValue(res['data'].supplier);
  //         this.amcForm.controls['refNo'].patchValue(res['data'].refNo);
  //         this.amcForm.controls['effectiveDate'].patchValue(res['data'].effectiveDate);
  //         this.amcForm.controls['expiryDate'].patchValue(res['data'].expiryDate);
  //         this.amcForm.controls['amcAmount'].patchValue(res['data'].amcAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  //         this.amcForm.controls['tranStatus'].patchValue(res['data'].tranStatus);
  //         this.amcForm.controls['notes'].patchValue(res['data'].notes);
  //         this.amcForm.controls['referenceNo'].patchValue(res['data'].referenceNo);
  //         this.textMessageClass = 'green';
  //         this.retMessage = res.message;
  //       }
  //       else {
  //         this.textMessageClass = 'red';
  //         this.retMessage = res.message;

  //       }
  //     })
  //   }
  //   catch (ex: any) {
  //     this.textMessageClass = 'red';
  //     this.retMessage = ex.message;
  //   }
  // }
  prepareAmcCls() {
      this.assstAMCCls.company = this.userDataService.userData.company;
      this.assstAMCCls.location = this.userDataService.userData.location;
      this.assstAMCCls.refNo = this.userDataService.userData.sessionID;
      this.assstAMCCls.user = this.userDataService.userData.userID;

      // this.assstAMCCls. = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
      // this.assstAMCCls.company = this.userDataService.userData.company;
  }
  onSubmit() {
    if (this.amcForm.valid) {
      const sessionData = {
        ...this.commonParams(),
        langID: this.userDataService.userData.langId
      };
      const requestData = {
        ...sessionData,
        ...this.amcForm.value
      };
      this.loader.start();
      this.subSink.sink = this.assetService.updateAMCHdr(requestData).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal > 100 && res.retVal < 200) {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
        else {
          this.textMessageClass = 'green';
          this.retMessage = res.message;
        }
      });
    }
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.tranStatus = '';
      this.amcForm = this.formInit();
      this.amcForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.amcForm.get('tranNo')?.disable();
      this.amcForm.get('supplier')?.enable();
    }
    else {
      this.amcForm.get('tranNo')?.enable();
      this.amcForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.amcForm.get('supplier')?.disable()
    }
  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<AssetAMCDetailsComponent> = this.dialog.open(AssetAMCDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: tranNo
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.assetAMCData(this.masterParams);
      }
    });
  }
  formatDate(date: Date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }
  assetAMCData(assetAMC: MasterParams) {
    this.loader.start();
    try {
      this.subSink.sink = this.assetService.getAMCHdr(assetAMC).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.amcForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.amcForm.controls['amcType'].patchValue(res['data'].amcType);
          this.amcForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.amcForm.controls['supplier'].patchValue(res['data'].supplier);
          this.amcForm.controls['effectiveDate'].patchValue(res['data'].effectiveDate);
          this.amcForm.controls['expiryDate'].patchValue(res['data'].expiryDate);
          this.amcForm.controls['amcAmount'].patchValue(res['data'].amcAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.amcForm.controls['notes'].patchValue(res['data'].notes);
          this.amcForm.controls['referenceNo'].patchValue(res['data'].referenceNo);
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
      this.retMessage = ex.message;
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
        TranType: 'ASSETAMC',
        TranNo: this.amcForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.subSink.sink = this.assetService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.assetAMCData(this.masterParams);
          }
          else {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.amcForm.controls['tranNo'].value, 'TranType': "ASSETAMC",
                'search': 'Asset AMC Search'
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.masterParams.item = result;
                try {
                  this.assetAMCData(this.masterParams);
                }
                catch (ex: any) {
                  this.retMessage = ex.message;
                  this.textMessageClass = 'red';
                }
              }

            });
          }
        }
        else {
          this.reset();
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }


  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.amcForm.controls['mode'].value, tranNo: this.amcForm.controls['tranNo'].value, search: 'Asset Docs', tranType: "ASSET" }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.assetAMCData(this.masterParams);
      }
    });
  }
  reset() {
    this.assetAMCData(this.masterParams);

  }
  Close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.amcForm = this.formInit();
    this.retMessage = "";
    this.tranStatus = "";
    this.suppCode = "";
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST1505",
        // Page: "AMC",
        // SlNo: 57,
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

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.amcForm.controls['mode'].value,
        'note': this.amcForm.controls['notes'].value,
        'TranType': "ASSETAMC",
        'search': 'AMC Notes'
      }

    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': "AMC",
        'tranNo': tranNo,
        'search': 'AMC log Search'
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  searchSupplier() {
    const body = {
      ...this.commonParams(),
      Type: "SUPPLIER",
      Item: this.amcForm.controls['supplier'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.amcForm.get('supplier')!.patchValue(res.data.selName);
            this.suppCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.amcForm.controls['supplier'].value || "", 'PartyType': "SUPPLIER",
                  'search': 'SUPPLIER Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.amcForm.get('supplier')!.patchValue(result.partyName);
                this.suppCode = result.code;
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
}
