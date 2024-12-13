import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { DatePipe } from '@angular/common'
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { AssetGroups } from 'src/app/assets/assets.class'
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-asset-groups',
  templateUrl: './asset-groups.component.html',
  styleUrls: ['./asset-groups.component.css']
})
export class AssetGroupsComponent implements OnInit, OnDestroy {
  assetgrpForm!: FormGroup;
  Item!: String;
  textMessageClass: string = "";
  retMessage: string = "";
  modes: Item[] = [];
  masterParams!: MasterParams;
  itemGroupID: Item[] = [];
  itemGCode!: string;
  groupStatus!: string;
  subSink: SubSink = new SubSink();
  @Input() max: any;
  tomorrow = new Date();
  assetGrpCls!: AssetGroups;
  newTranMsg: string = "";
  constructor(protected route: ActivatedRoute, private datePipe: DatePipe,
    private masterService: MastersService,
    protected router: Router, private userDataService: UserDataService,
    public dialog: MatDialog,
    protected assetService: AssetsService,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder, private notifyService: NotificationService,) {
    this.assetgrpForm = this.formInit();
    this.masterParams = new MasterParams();
    this.assetGrpCls = new AssetGroups();
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
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM501'
    };
    try {
      this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
      // this.masterParams.item = this.assetgrpForm.controls['itemGroupList'].value;
    }

    catch (ex) {
      //console.log(ex);
    }
    this.loadData();
  }

  reset() {
    this.assetgrpForm = this.formInit();
    this.textMessageClass = '';
    this.retMessage = '';
    this.newTranMsg = "";
    this.groupStatus="";
  }

  loadData() {
    const itemGroup: getPayload = {
      ...this.commonParams(),
      item: "ASSETGROUP"
    };

    const requests = [
      this.assetService.GetMasterItemsList(itemGroup)
    ];

    this.subSink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.itemGroupID = results[0]['data'];;
      },
      (error: any) => {
        console.error(error);
      }
    );

  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      itemGroupList: [''],
      itemGroupCode: ['', [Validators.required, Validators.maxLength(40)]],
      itemGroupDesc: ['', [Validators.required, Validators.maxLength(50)]],
      effectiveDate: [new Date(), Validators.required],
      depValue: ['0.00', [Validators.required]],
      depType: ['', [Validators.required]],
      depOn: [''],
      notes: ['', [Validators.maxLength(255)]],
    });
  }
  getAssetGroupChange() {
    this.newTranMsg = "";
    this.getGroupData(this.assetgrpForm.controls['itemGroupList'].value, this.assetgrpForm.get('mode')?.value);
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  modeChange(event: string) {
    if (event == "Add") {
      this.reset();
      this.assetgrpForm.get('itemGroupList')!.disable();
      this.assetgrpForm.get('mode')!.patchValue(event, { emitEvent: false });
    }
    else {
      this.assetgrpForm.get('itemGroupList')!.enable();
      this.assetgrpForm.get('mode')!.patchValue(event, { emitEvent: false });

    }
  }
  clearMSg() {
    this.retMessage = "";
    this.textMessageClass = "";
    // this.newTranMsg = "";
  }
  onSubmit() {
    this.clearMSg();
    if (this.assetgrpForm.valid) {
      this.assetGrpCls.company = this.userDataService.userData.company;
      this.assetGrpCls.location = this.userDataService.userData.location;
      this.assetGrpCls.user = this.userDataService.userData.userID;
      this.assetGrpCls.refNo = this.userDataService.userData.sessionID;

      this.assetGrpCls.mode = this.assetgrpForm.controls['mode'].value;
      this.assetGrpCls.itemGroupID = this.assetgrpForm.controls['itemGroupCode'].value;
      this.assetGrpCls.itemGroupDesc = this.assetgrpForm.controls['itemGroupDesc'].value;
      this.assetGrpCls.notes = this.assetgrpForm.controls['notes'].value;
      this.assetGrpCls.depOn = this.assetgrpForm.controls['depOn'].value;
      this.assetGrpCls.depType = this.assetgrpForm.controls['depType'].value;
      this.assetGrpCls.depValue = parseFloat(this.assetgrpForm.controls['depValue'].value.replace(/,/g, ','));
      const transformedDate = this.datePipe.transform(this.assetgrpForm.controls['effectiveDate'].value, 'yyyy-MM-dd');
      if (transformedDate !== undefined && transformedDate !== null) {
        this.assetGrpCls.effectiveDate = transformedDate.toString();
      } else {
        this.assetGrpCls.effectiveDate = ''; // or any default value you prefer
      }

      try {
        this.loader.start();
        this.subSink.sink = this.assetService.updateAssetGrpdt(this.assetGrpCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            if (this.assetgrpForm.controls['mode'].value.toUpperCase() == "ADD") {
              this.modeChange("Modify");
              this.itemGroupID.push({ itemCode: this.assetgrpForm.get('itemGroupCode')?.value, itemName: this.assetgrpForm.get('itemGroupDesc')?.value });
              this.assetgrpForm.get('itemGroupList')?.patchValue(res.tranNoNew);
            }
            this.newTranMsg = res.message;
            this.getGroupData(res.tranNoNew, this.assetgrpForm.get('mode')?.value);
          }
          else {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
          }
        });
      }
      catch (ex: any) {
        this.notifyService.showError(ex.message, 'ERROR');
      }
    } else {
      this.notifyService.showError('Form Invalid', 'ERROR');
    }
  }

  getGroupData(item: string, mode: string) {
    this.clearMSg();
    this.masterParams.item = item;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    //console.log(this.masterParams);
    try {
      this.loader.start();
      this.subSink.sink = this.assetService.getAssetGroupData(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.groupStatus = res['data'].groupStatus;
          this.assetgrpForm.controls['itemGroupCode'].patchValue(res['data'].itemGroupID);
          this.assetgrpForm.controls['itemGroupDesc'].patchValue(res['data'].itemGroupDesc);
          this.assetgrpForm.controls['depValue'].patchValue(res['data'].depValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.assetgrpForm.controls['depType'].patchValue(res['data'].depType);
          this.assetgrpForm.controls['depOn'].patchValue(res['data'].depOn);
          this.assetgrpForm.controls['notes'].patchValue(res['data'].notes);
          this.assetgrpForm.controls['effectiveDate'].patchValue(res['data'].effectiveDate)
          if (mode != 'View' && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = "red";
    }

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
      if (dialogResult) {
        this.assetgrpForm.get('mode')?.patchValue("Delete");
        this.onSubmit();
      }
    });
  }


  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM501",
        // Page: "Asset Group",
        // SlNo: 15,
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
  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': 'ASSETGROUP',
        'tranNo': tranNo,
        'search': 'Asset Group Log'
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
