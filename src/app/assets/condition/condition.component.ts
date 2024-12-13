import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { SubSink } from 'subsink';
import { assetConditions } from '../assets.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';


@Component({
  selector: 'app-condition',
  templateUrl: './condition.component.html',
  styleUrls: ['./condition.component.css']
})
export class ConditionComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  condList: Item[] = [];
  acDetForm!: FormGroup;
  textMessageClass: string = "";
  retMessage: string = "";
  newTranMessage: string = "";
  itemStatus: string = "";
  subSink = new SubSink();
  assConditioncls!: assetConditions;
  assetConCode!: string;
  @Input() max: any;
  tomorrow = new Date();

  constructor(protected route: ActivatedRoute,
    protected router: Router, private datepipe: DatePipe,
    private masterService: MastersService, public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder, private userDataService: UserDataService,
    protected assetService: AssetsService) {
    this.masterParams = new MasterParams();
    this.acDetForm = this.formInit();
    this.subSink = new SubSink();
    this.assConditioncls = new assetConditions();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      condCode: ['',],
      condition: ['', Validators.required],
      assetConditionCode: ['', Validators.required],
      condDate: [new Date(), [Validators.required]],
      usable: [false],
      notes: [''],
      mode: ['View', { emitEvent: false }]
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

    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM503'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }
    catch (ex) {
      //console.log(ex);
    }
    this.loadData();
  }

  formatDate(date: Date) {
    return this.datepipe.transform(date, 'yyyy-MM-dd') || '';
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.acDetForm = this.formInit();
      this.acDetForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.acDetForm.get('condCode')!.disable();
    }
    else {
      this.acDetForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.acDetForm.get('condCode')!.enable();
    }

    this.acDetForm.controls['mode'].patchValue(event);
  }

  reset() {
    // this.assetConditonData(this.assetConCode);
    this.acDetForm = this.formInit();
    this.itemStatus = "";
    this.clearMsg();
  }

  loadData() {
    const condCodes = {
      ...this.commonParams(),
      item: "ASSETCOND"
    };
    const requests = [
      this.assetService.GetMasterItemsList(condCodes)
    ];
    this.subSink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.condList = results[0]['data'];;
      },
      (error: any) => {
        console.error(error);
      }
    );

  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  getAssetConditionChange(event: any) {
    this.assetConCode = event.value.itemCode;
    this.assetConditonData(this.assetConCode, this.acDetForm.get('mode')?.value);
  }

  assetConditonData(item: string, mode: string) {
    this.masterParams.item = item;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    try {
      this.loader.start();
      this.subSink.sink = this.assetService.getassetcdt(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.textMessageClass = 'green';
          this.acDetForm.controls['condition'].patchValue(res['data'].condition);
          this.acDetForm.controls['condDate'].patchValue(res['data'].condDate);
          this.acDetForm.controls['usable'].patchValue(res['data'].usable);
          this.acDetForm.controls['notes'].patchValue(res['data'].notes);
          this.itemStatus = res['data'].itemStatus;
          this.acDetForm.controls['assetConditionCode'].patchValue(res['data'].condCode);
          if (mode != "View" && this.newTranMessage != "") {
            this.retMessage = this.newTranMessage;
          }
          else{
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
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
  clearMsg() {
    this.textMessageClass = '';
    this.retMessage = '';
  }

  onSubmit() {
    this.clearMsg();
    if (this.acDetForm.invalid) {
      return;
    }
    else {
      this.assConditioncls.company = this.userDataService.userData.company;
      this.assConditioncls.location = this.userDataService.userData.location;
      this.assConditioncls.user = this.userDataService.userData.userID;
      this.assConditioncls.refNo = this.userDataService.userData.sessionID;
      this.assConditioncls.mode = this.acDetForm.controls['mode'].value;
      this.assConditioncls.condition = this.acDetForm.controls['condition'].value;

      const transformedDate = this.datepipe.transform(this.acDetForm.controls['condDate'].value, 'yyyy-MM-dd');
      if (transformedDate !== undefined && transformedDate !== null) {
        this.assConditioncls.condDate = transformedDate.toString();
      } else {
        this.assConditioncls.condDate = '';
      }

      this.assConditioncls.condCode = this.acDetForm.controls['assetConditionCode'].value;
      this.assConditioncls.usable = this.acDetForm.controls['usable'].value;
      this.assConditioncls.notes = this.acDetForm.controls['notes'].value;
      try {
        this.loader.start();
        this.subSink.sink = this.assetService.updateACdt(this.assConditioncls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 || res.retVal < 200) {
            this.newTranMessage = res.message;
            if (this.acDetForm.controls['mode'].value === "Add") {
              this.modeChange("Modify");
            }
            this.assetConditonData(res.tranNoNew, this.acDetForm.get('mode')!.value)
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM503",
        // Page: "Condition",
        // SlNo: 57,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': 'ASSCON',
        'tranNo': tranNo,
        'search': 'Asset Conditions Log'
      }
    });
  }

}

