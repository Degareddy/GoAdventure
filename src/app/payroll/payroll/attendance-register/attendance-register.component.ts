import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { attendenceRegister } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-attendance-register',
  templateUrl: './attendance-register.component.html',
  styleUrls: ['./attendance-register.component.css']
})
export class AttendanceRegisterComponent implements OnInit,OnDestroy {

  masterParams!: MasterParams;
  modes: Item[] = [];
  attendenceForm!: FormGroup;
  payrollYear!: Item[];
  payrollPeriods!: Item[];
  textMessageClass: string = "";
  retMessage: string = "";
  tranStatus: string = "";
  @Input() max: any;
  tomorrow = new Date();
  attendenceRegisterCls!: attendenceRegister;
  private subsink: SubSink = new SubSink();
  constructor(protected route: ActivatedRoute,
    private loader: NgxUiLoaderService, private payService: PayrollService,
    protected router: Router,
    private masterService: MastersService, public dialog: MatDialog,
    private fb: FormBuilder, private userDataService: UserDataService) {
    this.masterParams = new MasterParams();
    this.attendenceRegisterCls = new attendenceRegister();

    this.attendenceForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date()],
      payrollYear: [''],
      payrollPeriod: [''],
      notes: [''],
      mode: ['View']
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
      item: 'ST607'
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
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST607",
        Page: "Attendance",
        SlNo: 70,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  searchData() {
    this.masterParams.tranNo = this.attendenceForm.controls['tranNo'].value;

    try {
      this.loader.start();
      this.subsink.sink = this.payService.GetAttendance(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.attendenceForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.attendenceForm.controls['payrollYear'].setValue(res['data'].payrollYear);
          this.attendenceForm.controls['payrollPeriod'].setValue(res['data'].payrollPeriod);
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
  onSubmit() {
    if (this.attendenceForm.valid) {
      // this.WerehouseForm.patchValue(this.WerehouseForm.value);
      //console.log(this.attendenceForm.value);
      this.attendenceRegisterCls.mode = this.attendenceForm.controls['mode'].value;
      this.attendenceRegisterCls.company = this.userDataService.userData.company;
      this.attendenceRegisterCls.location = this.userDataService.userData.location;
      this.attendenceRegisterCls.tranNo = this.attendenceForm.controls['tranNo'].value;
      this.attendenceRegisterCls.payrollYear = this.attendenceForm.controls['payrollYear'].value;
      this.attendenceRegisterCls.payrollPeriod = this.attendenceForm.controls['payrollPeriod'].value;
      this.attendenceRegisterCls.tranDate = this.attendenceForm.controls['tranDate'].value;
      this.attendenceRegisterCls.notes = this.attendenceForm.controls['notes'].value;
      this.attendenceRegisterCls.user = this.userDataService.userData.userID;
      this.attendenceRegisterCls.refNo = this.userDataService.userData.sessionID;
      //console.log(this.attendenceRegisterCls);
      try {
        this.loader.start();
        this.subsink.sink = this.payService.UpdateAttendance(this.attendenceRegisterCls).subscribe((res: SaveApiResponse) => {
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
    this.attendenceForm = this.formInit();
    this.tranStatus = '';
    this.retMessage = '';
  }

}
