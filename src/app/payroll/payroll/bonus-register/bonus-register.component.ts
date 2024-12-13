import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { PayrollService } from 'src/app/Services/payroll.service';
import { BonusClass } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-bonus-register',
  templateUrl: './bonus-register.component.html',
  styleUrls: ['./bonus-register.component.css']
})
export class BonusRegisterComponent implements OnInit, OnDestroy {
  pbrHdrForm!: FormGroup;
  modes: Item[] = [];
  textMessageClass: string="";
  retMessage: string="";
  masterParams!: MasterParams;
  BounsCls!: BonusClass
  tranStatus!: string;
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();
  constructor(private fb: FormBuilder, private masterService: MastersService,
    public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private payService: PayrollService) {
    this.pbrHdrForm = this.formInit();
    this.masterParams = new MasterParams();
    this.BounsCls = new BonusClass();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  close() {

  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      payrollYear: ['', [Validators.required, Validators.maxLength(10)]],
      payrollMonth: ['', [Validators.required, Validators.maxLength(10)]],
      notes: [''],
      mode: ['view']
    })
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST611",
        Page: "Bonus Register",
        SlNo: 74,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  searchData() {
    this.masterParams.tranNo = this.pbrHdrForm.controls['tranNo'].value;
    try {
      this.loader.start();
      this.payService.GetBonusRegister(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.pbrHdrForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.pbrHdrForm.controls['payrollYear'].patchValue(res['data'].payrollYear);
          this.pbrHdrForm.controls['payrollMonth'].patchValue(res['data'].payrollMonth);
          this.pbrHdrForm.controls['tranStatus'].patchValue(res['data'].tranStatus);
          this.pbrHdrForm.controls['notes'].patchValue(res['data'].notes);
          this.tranStatus = res['data'].tranStatus;
          this.pbrHdrForm.controls['mode'].patchValue('View');
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
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST611'
    };
    try {
      this.subsink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }

    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }
  onSubmit() {
    if (this.pbrHdrForm.valid) {
      this.BounsCls.mode = this.pbrHdrForm.controls['mode'].value;
      this.BounsCls.company = this.userDataService.userData.company;
      this.BounsCls.location = this.userDataService.userData.location;
      this.BounsCls.tranNo = this.pbrHdrForm.controls['tranNo'].value;
      this.BounsCls.tranDate = this.pbrHdrForm.controls['tranDate'].value;
      this.BounsCls.payrollYear = this.pbrHdrForm.controls['payrollYear'].value;
      this.BounsCls.payrollMonth = this.pbrHdrForm.controls['payrollMonth'].value;
      this.BounsCls.notes = this.pbrHdrForm.controls['notes'].value;
      this.BounsCls.user = this.userDataService.userData.userID;
      this.BounsCls.refNo = this.userDataService.userData.sessionID;
      try {
        this.loader.start();
        this.subsink.sink = this.payService.UpdateBonusRegister(this.BounsCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() == "SUCCESS") {
            this.retMessage = res.message;
            this.textMessageClass = 'green';
          } else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        });
      } catch (ex: any) {
        this.loader.stop();
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }
  modeChange(event: string) {
    if (event === 'Add') {
      this.pbrHdrForm = this.formInit();
      this.pbrHdrForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.retMessage = "";
      this.textMessageClass = "";
    }
    else {
      this.pbrHdrForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
  }
  reset() {
    this.tranStatus = "";
    this.retMessage = ""
    this.textMessageClass="";
    this.pbrHdrForm = this.formInit();

  }
}
