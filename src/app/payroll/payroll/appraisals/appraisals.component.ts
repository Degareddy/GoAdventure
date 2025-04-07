import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { AppraisalClass } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appraisals',
  templateUrl: './appraisals.component.html',
  styleUrls: ['./appraisals.component.css']
})
export class AppraisalsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  aprForm!: FormGroup;
  modes: Item[] = [];
  bonusCode!: string;
  textMessageClass: string = "";
  retMessage: string = "";
  tranStatus: string = "";
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();
  AppraisalCls!: AppraisalClass;
  constructor(private fb: FormBuilder, private masterService: MastersService, private userDataService: UserDataService,
    protected router: Router,
    public dialog: MatDialog, private loader: NgxUiLoaderService, private payService: PayrollService) {
    this.aprForm = this.formInit();
    this.masterParams = new MasterParams();
    this.AppraisalCls = new AppraisalClass();

  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      payrollYear: ['', [Validators.required, Validators.maxLength(10)]],
      payrollMonth: ['', [Validators.required, Validators.maxLength(10)]],
      wEF: [new Date(), [Validators.required]],
      notes: ['',],
      mode: ['View']

    })
  }
  searchData() {
    // this.masterParams.tranNo = this.aprForm.controls['tranNo'].value;

    try {
      this.loader.start();
      this.subsink.sink = this.payService.GetAppraisals(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.aprForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.aprForm.controls['payrollYear'].setValue(res['data'].payrollYear);
          this.aprForm.controls['payrollMonth'].setValue(res['data'].payrollMonth);
          this.aprForm.controls['wEF'].setValue(res['data'].wef);
          this.tranStatus = res['data'].tranStatus;
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
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST609'
    };
    try {
      this.subsink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }

    catch (ex:any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }

  }
  Close() {
    this.router.navigateByUrl('/home');

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST609",
        Page: "Appraisals",
        SlNo: 72,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  onSubmit() {
    if (this.aprForm.valid) {
      this.AppraisalCls.mode = this.aprForm.controls['mode'].value;
      this.AppraisalCls.company = this.userDataService.userData.company;
      this.AppraisalCls.location = this.userDataService.userData.location;
      this.AppraisalCls.tranNo = this.aprForm.controls['tranNo'].value;
      this.AppraisalCls.payrollYear = this.aprForm.controls['payrollYear'].value;
      this.AppraisalCls.payrollMonth = this.aprForm.controls['payrollMonth'].value;
      this.AppraisalCls.wEF = this.aprForm.controls['wEF'].value;
      this.AppraisalCls.tranDate = this.aprForm.controls['tranDate'].value;
      this.AppraisalCls.notes = this.aprForm.controls['notes'].value;
      this.AppraisalCls.user = this.userDataService.userData.userID;
      this.AppraisalCls.refNo = this.userDataService.userData.sessionID;
      try {
        this.loader.start();
        this.subsink.sink = this.payService.UpdateAppraisal(this.AppraisalCls).subscribe((res: any) => {
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
  reset() {
    this.tranStatus = '';
    this.retMessage = '';
    this.aprForm = this.formInit();
    this.textMessageClass = "";
  }
}
