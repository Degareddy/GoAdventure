

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { DatePipe } from '@angular/common'
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AssetLeaseDetailsComponent } from './asset-lease-details/asset-lease-details.component';
import { SubSink } from 'subsink';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-leasing',
  templateUrl: './leasing.component.html',
  styleUrls: ['./leasing.component.css']
})
export class LeasingComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  alDetForm!: FormGroup;
  textMessageClass: string = "";
  retMessage: string = "";
  tranStatus: string = "";
  private subSink!: SubSink;
  @Input() max: any;
  tomorrow = new Date();
  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private userDataService: UserDataService,
    private masterService: MastersService, public dialog: MatDialog,
    private loader: NgxUiLoaderService, private datePipe: DatePipe,
    private fb: FormBuilder,
    protected assetService: AssetsService) {
    this.masterParams = new MasterParams();
    this.alDetForm = this.formInit();
    this.subSink = new SubSink();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      customer: ['', [Validators.required, Validators.maxLength(60)]],
      remarks: [''],
      mode: ['View']
    });
  }

  modChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.alDetForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.alDetForm.get('tranNo')!.disable();
    }
    else {
      this.alDetForm.get('tranNo')!.enable();
      this.alDetForm.controls['mode'].patchValue(event, { emitEvent: false });
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
  ngOnInit(): void {
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST504'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }

    catch (ex) {
    }

  }

  loadData() {

  }

  get() {
    this.masterParams.tranNo = this.alDetForm.controls['tranNo'].value;
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    try {
      this.loader.start();
      this.subSink.sink = this.assetService.getalDet(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.alDetForm.controls['mode'].patchValue("View");
          this.alDetForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.alDetForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.alDetForm.controls['customer'].patchValue(res['data'].customer);
          this.alDetForm.controls['remarks'].patchValue(res['data'].remarks);
          this.alDetForm.controls['tranStatus'].patchValue(res['data'].tranStatus);
          this.textMessageClass = 'green';
          this.retMessage = 'Retriving data ' + res.message;
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

  onSubmit() {
    if (this.alDetForm.valid) {
      const sessionData = {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        langId: this.userDataService.userData.langId,
        user: this.userDataService.userData.userID
      };
      const requestData = {
        ...this.alDetForm.value,
        ...sessionData,

      };
      this.loader.start();
      this.subSink.sink = this.assetService.updateAlDet(requestData).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal >= 100) {
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

  reset() {
    this.assetLeaseData(this.masterParams);
    // this.alDetForm = this.formInit();
    // this.alDetForm.reset();
    // this.tranStatus = '';
    // this.retMessage = '';
    // this.fetchStatus = true;
    // this.disableDetail = true;
  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<AssetLeaseDetailsComponent> = this.dialog.open(AssetLeaseDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: tranNo
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  assetLeaseData(assetLease: MasterParams) {
    this.loader.start();
    try {
      this.subSink.sink = this.assetService.getalDet(assetLease).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.tranStatus = res['data'].tranStatus;
          this.alDetForm.controls['mode'].patchValue("View");
          this.alDetForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.alDetForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.alDetForm.controls['customer'].patchValue(res['data'].customer);
          this.alDetForm.controls['remarks'].patchValue(res['data'].remarks);
          this.alDetForm.controls['tranStatus'].patchValue(res['data'].tranStatus);
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
        TranType: 'ASSETLEASE',
        TranNo: this.alDetForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }

      this.subSink.sink = this.assetService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.assetLeaseData(this.masterParams);
          }
          else {
            this.alDetForm.controls['customer'].patchValue('');
            this.alDetForm.controls['remarks'].patchValue('');
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.alDetForm.controls['tranNo'].value, 'TranType': "AssetLease",
                'search': 'Asset-Lease Search'
              }
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.masterParams.tranNo = result;
                try {
                  this.assetLeaseData(this.masterParams);
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
          this.alDetForm.controls['customer'].patchValue('');
          this.alDetForm.controls['remarks'].patchValue('');
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';

    }
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.alDetForm.controls['mode'].value, tranNo: this.alDetForm.controls['tranNo'].value, search: 'Asset Leasing Doc', tranType: "ASSETLEASE" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST504",
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
