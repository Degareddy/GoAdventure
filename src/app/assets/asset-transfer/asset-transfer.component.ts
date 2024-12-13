import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { AssetTransferDetailsComponent } from './asset-transfer-details/asset-transfer-details.component';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { forkJoin } from 'rxjs';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AssetTranfer } from '../assets.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';


@Component({
  selector: 'app-asset-transfer',
  templateUrl: './asset-transfer.component.html',
  styleUrls: ['./asset-transfer.component.css']
})
export class AssetTransferComponent implements OnInit, OnDestroy {
  assetTranferCls: AssetTranfer;
  dialogOpen = false;
  masterParams: MasterParams;
  modes: Item[] = [];
  departmentList: Item[] = [];
  departmentList2: Item[] = [];
  assetTForm!: FormGroup;
  tranStatus: string = "";
  textMessageClass: string = "";
  retMessage: string = "";
  newTranMsg: string = "";
  tranNo!: any[];
  private subSink: SubSink;
  @Input() max: any;
  tomorrow = new Date();
  fromCustodianCode: any;
  toCustodianCode: any;
  fromLocationList: Item[] = [];
  toLocationList: Item[] = [];
  selMode!: string;

  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private masterService: MastersService, public dialog: MatDialog, private fb: FormBuilder,
    private loader: NgxUiLoaderService, private datePipe: DatePipe, private userDataService: UserDataService,
    protected assetService: AssetsService) {
    this.masterParams = new MasterParams();
    this.assetTForm = this.formInit();
    this.subSink = new SubSink();
    this.assetTranferCls = new AssetTranfer;
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      fromCustodian: [''],
      fromLocation: [''],
      toCustodian: [''],
      fromDepartment: ['', Validators.required],
      toDepartment: [''],
      toLocation: [''],
      tranStatus: [''],
      remarks: ['', [Validators.maxLength(512)]],
      mode: ['View']
    });
  }

  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST502'
    };

    const branchbody: getPayload = {
      ...this.commonParams(),
      item: 'BRANCHES',
    };

    const deptbody: getPayload = {
      ...this.commonParams(),
      item: 'DEPARTMENT',
    };

    try {
      this.loader.start();
      const modes$ = this.masterService.getModesList(modebody);
      const branches$ = this.masterService.GetMasterItemsList(branchbody);
      const department$ = this.masterService.GetMasterItemsList(deptbody);
      this.subSink.sink = forkJoin([modes$, branches$, department$]).subscribe(
        ([modesRes, branchRes, deptRes]: any) => {
          this.loader.stop();
          this.modes = modesRes['data'];
          this.fromLocationList = branchRes['data'];
          this.toLocationList = branchRes['data'];
          this.departmentList = deptRes['data'];
          this.departmentList2 = deptRes['data'];
        },
        error => {
          console.error(error);
        }
      );
    }

    catch (ex) {
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.assetTForm = this.formInit();
      this.assetTForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.assetTForm.get('tranNo')!.disable();
      this.retMessage = "";
      this.textMessageClass = "";
    }
    else {
      this.assetTForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.assetTForm.get('tranNo')!.enable();
    }
  }

  assetTranferdata(assetdata: MasterParams) {
    this.loader.start();
    try {
      this.subSink.sink = this.assetService.getATHdr(assetdata).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.assetTForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.assetTForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.assetTForm.controls['fromCustodian'].patchValue(res['data'].fromCustodianName);
          this.fromCustodianCode = res.data.fromCustodian;
          this.assetTForm.controls['fromLocation'].patchValue(res['data'].fromLocation);
          this.assetTForm.controls['fromDepartment'].patchValue(res['data'].fromDepartment);
          this.assetTForm.controls['toCustodian'].patchValue(res['data'].toCustodianName);
          this.toCustodianCode = res.data.toCustodian;
          this.assetTForm.controls['toLocation'].patchValue(res['data'].toLocation);
          this.assetTForm.controls['toDepartment'].patchValue(res['data'].toDepartment);
          this.assetTForm.controls['remarks'].patchValue(res['data'].remarks);
          this.tranStatus = res['data'].tranStatus;
          if (this.selMode === 'Add') {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.textMessageClass = "green";
            this.retMessage = res.message;
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = "red";
    }

  }

  onSubmit() {
    //console.log(this.assetTForm.value);
    if (this.assetTForm.valid) {
    };
    this.assetTranferCls.mode = this.assetTForm.controls['mode'].value;
    this.assetTranferCls.user = this.userDataService.userData.userID;
    this.assetTranferCls.company = this.userDataService.userData.company;
    this.assetTranferCls.location = this.userDataService.userData.location;
    this.assetTranferCls.user = this.userDataService.userData.userID,
      this.assetTranferCls.refNo = this.userDataService.userData.sessionID;
    this.assetTranferCls.tranNo = this.assetTForm.controls['tranNo'].value;
    this.assetTranferCls.tranDate = this.assetTForm.controls['tranDate'].value;
    this.assetTranferCls.fromCustodian = this.fromCustodianCode;
    this.assetTranferCls.toCustodian = this.toCustodianCode;
    this.assetTranferCls.toLocation = this.assetTForm.controls['toLocation'].value;
    this.assetTranferCls.fromLocation = this.assetTForm.controls['fromLocation'].value;
    this.assetTranferCls.toDepartment = this.assetTForm.controls['toDepartment'].value;
    this.assetTranferCls.fromDepartment = this.assetTForm.controls['fromDepartment'].value;
    this.assetTranferCls.remarks = this.assetTForm.controls['remarks'].value;
    this.assetTranferCls.tranStatus = this.tranStatus;

    this.loader.start();
    this.subSink.sink = this.assetService.updateAT(this.assetTranferCls).subscribe((res: SaveApiResponse) => {
      this.loader.stop();
      if (res.retVal > 100 && res.retVal < 200) {
        this.textMessageClass = 'green';
        this.newTranMsg = res.message;
        if (this.assetTForm.controls['mode'].value == "Add") {
          this.modeChange("Modify");
          this.masterParams.tranNo = res.tranNoNew;
          this.assetTranferdata(this.masterParams);
        }
        else {
          this.retMessage = res.message;
        }
      }
      else {
        this.textMessageClass = 'red';
        this.retMessage = res.message;
      }
    });
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
        TranType: 'ASSETTRANSFER',
        TranNo: this.assetTForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.loader.start();
      this.subSink.sink = this.assetService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.assetTranferdata(this.masterParams);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetTForm.controls['tranNo'].value, 'TranType': "ASSETTRANSFER",
                  'search': 'Asset Transfer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.masterParams.tranNo = result;
                  this.assetTForm.controls['tranNo'].patchValue(result.tranNo);
                  this.assetTranferdata(this.masterParams)
                }
              });
            }
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

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<AssetTransferDetailsComponent> = this.dialog.open(AssetTransferDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { 'tranNo': tranNo, 'mode': this.assetTForm.controls['mode'].value, 'status': this.tranStatus }  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.assetTranferdata(this.masterParams);
      }
    });

  }

  searchFromCustodian() {

    const body = {
      ...this.commonParams(),
      Type: "USER",
      item: this.assetTForm.controls['fromCustodian'].value
    }
    try {
      this.subSink.sink = this.assetService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res.data.nameCount === 1) {
            this.assetTForm.controls['fromCustodian'].patchValue(res.data.selName);
            this.assetTranferdata(this.masterParams);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetTForm.controls['fromCustodian'].value, 'PartyType': "EMPLOYEE",
                  'search': 'Asset Transfer Custodian Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.assetTForm.controls['fromCustodian'].patchValue(result.partyName);
                  this.fromCustodianCode = result.code
                  this.dialogOpen = false;
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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  searchToCustodian() {

    try {
      const body = {
        ...this.commonParams(),
        Type: "USER",
        item: this.assetTForm.controls['toCustodian'].value,
      }
      this.subSink.sink = this.assetService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.assetTForm.controls['toCustodian'].patchValue(res.data.selName);
          }
          else {
            const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'PartyNo': this.assetTForm.controls['toCustodian'].value, 'PartyType': "EMPLOYEE",
                'search': 'Asset Transfer Custodian Search'
              }
            });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.assetTForm.controls['toCustodian'].patchValue(result.partyName);
                this.toCustodianCode = result.code;
                this.dialogOpen = false;
              }
              this.dialogOpen = false;
            });
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }

  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.assetTForm.controls['mode'].value, tranNo: this.assetTForm.controls['tranNo'].value, search: 'Asset-Transfer Docs', tranType: "ASSETTRANSFER" }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.assetTranferdata(this.masterParams);
      }
    });
  }
  reset() {
    this.assetTranferdata(this.masterParams);
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST502",
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



