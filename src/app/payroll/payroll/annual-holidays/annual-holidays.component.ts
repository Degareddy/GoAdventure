import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { annualHolidays } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-annual-holidays',
  templateUrl: './annual-holidays.component.html',
  styleUrls: ['./annual-holidays.component.css']
})
export class AnnualHolidaysComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  ahdForm!: FormGroup;
  bonusCode!: string;
  textMessageClass: string = "";
  retMessage: string = "";
  tranStatus: string = "";
  YearNo: any = [];
  annualHolidaysCls!: annualHolidays;
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();

  constructor(protected route: ActivatedRoute,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService, public dialog: MatDialog,
    private payService: PayrollService, private loader: NgxUiLoaderService,
    private fb: FormBuilder,) {
    this.masterParams = new MasterParams();
    this.annualHolidaysCls = new annualHolidays()
    this.ahdForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      yearNo: ['', [Validators.required, Validators.maxLength(10)]],
      tranDate: [new Date(), [Validators.required]],
      optionalHolidays: ['', [Validators.required]],
      publicHolidays: ['', [Validators.required]],
      remarks: [''],
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
      item: 'ST612'
    };
    try {
      this.subsink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];

        }
      });
      // this.masterParams.item = this.ahdForm.controls['bonusCode'].value;
    }

    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }

  }
  reset() {
    this.ahdForm = this.formInit();
    this.tranStatus = '';
    this.retMessage = '';
    this.textMessageClass = "";
  }
  get() {

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST612",
        Page: "Annual Holidays",
        SlNo: 75,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  searchData() {
    this.masterParams.tranNo = this.ahdForm.controls['yearNo'].value;

    try {
      this.loader.start();
      this.subsink.sink = this.payService.GetAnnualHolidays(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.ahdForm.controls['optionalHolidays'].setValue(res['data'].optionalHolidays);
          this.ahdForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.ahdForm.controls['publicHolidays'].setValue(res['data'].publicHolidays);
          this.ahdForm.controls['remarks'].setValue(res['data'].remarks);
          this.tranStatus = res['data'].tranStatus;
          this.ahdForm.controls['mode'].setValue('View');
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
    if (this.ahdForm.valid) {
      this.annualHolidaysCls.mode = this.ahdForm.controls['mode'].value;
      this.annualHolidaysCls.company = this.userDataService.userData.company;
      this.annualHolidaysCls.location = this.userDataService.userData.location;
      this.annualHolidaysCls.yearNo = this.ahdForm.controls['yearNo'].value;
      this.annualHolidaysCls.optionalHolidays = this.ahdForm.controls['optionalHolidays'].value;
      this.annualHolidaysCls.publicHolidays = this.ahdForm.controls['publicHolidays'].value;
      this.annualHolidaysCls.remarks = this.ahdForm.controls['remarks'].value;
      this.annualHolidaysCls.tranDate = this.ahdForm.controls['tranDate'].value;
      this.annualHolidaysCls.user = this.userDataService.userData.userID;
      this.annualHolidaysCls.refNo = this.userDataService.userData.sessionID;
      try {
        this.loader.start();
        this.subsink.sink = this.payService.UpdateAnnualHolidays(this.annualHolidaysCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal === 4) {
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
  onUpdate() {

  }
}
