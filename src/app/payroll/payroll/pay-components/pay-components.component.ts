import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { payComponents } from '../payroll.class';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-pay-components',
  templateUrl: './pay-components.component.html',
  styleUrls: ['./pay-components.component.css']
})
export class PayComponentsComponent implements OnInit, OnDestroy {
  ppcForm!: FormGroup;
  modes: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  tranMessage: string = "";
  @Input() max: any;
  private subsink: SubSink = new SubSink();
  tomorrow = new Date();
  payComp: Item[] = []
  status: string = "";
  private payCls: payComponents = new payComponents();
  constructor(private fb: FormBuilder,
    public dialog: MatDialog, private payService: PayrollService,
    private loader: NgxUiLoaderService, protected router: Router,
    private masterService: MastersService, private datePipe: DatePipe,
    private userDataService: UserDataService) {
    this.ppcForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  modeChange(event: string) {
    if (this.ppcForm.get('mode')?.value === "Add") {
      this.clearMsg();
      this.ppcForm = this.formInit();
      this.ppcForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.ppcForm.get('payList')?.disable();
      this.loadData();
    }
    else {
      this.ppcForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.ppcForm.get('payList')?.enable();

    }
  }
  formInit() {
    return this.fb.group({
      payID: ['', [Validators.required, Validators.maxLength(10)]],
      payDesc: ['', [Validators.required, Validators.maxLength(50)]],
      payOn: ['', [Validators.required, Validators.maxLength(50)]],
      payType: ['', [Validators.required, Validators.maxLength(50)]],
      payBy: ['', [Validators.required, Validators.maxLength(50)]],
      taxable: [false],
      isMandatory: [false],
      payValue: ['', Validators.required],
      createdDate: [new Date(), [Validators.required]],
      notes: [''],
      mode: ['View'],
      payList: ['']
    })
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
    this.loadData();
  }
  loadData(){
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM602',
    };

    const yearBody: getPayload = {
      ...this.commonParams(),
      item: "PAYROLLCOMP",
      mode:this.ppcForm.get('mode')?.value
    };

    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(yearBody);
      this.subsink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          this.modes = res1.data;
          this.payComp = res2.data;
        },
        (error: any) => {
          this.loader.stop();
          this.retMessage = error.message;
          this.textMessageClass = 'red';
        }
      );

    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  prepareCls() {
    this.payCls.company = this.userDataService.userData.company;
    this.payCls.location = this.userDataService.userData.location;
    this.payCls.user = this.userDataService.userData.userID;
    this.payCls.refNo = this.userDataService.userData.sessionID;

    this.payCls.mode = this.ppcForm.get('mode')?.value;
    this.payCls.isMandatory = this.ppcForm.get('isMandatory')?.value;
    this.payCls.taxable = this.ppcForm.get('taxable')?.value;

    const transformedDate = this.datePipe.transform(this.ppcForm.controls['createdDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.payCls.createdDate = transformedDate.toString();
    } else {
      this.payCls.createdDate = ''; // or any default value you prefer
    }

    // this.payCls.createdDate = this.ppcForm.get('createdDate')?.value;
    this.payCls.payBy = this.ppcForm.get('payBy')?.value;
    this.payCls.payDesc = this.ppcForm.get('payDesc')?.value;

    this.payCls.payId = this.ppcForm.get('payID')?.value;
    this.payCls.payOn = this.ppcForm.get('payOn')?.value;
    this.payCls.payType = this.ppcForm.get('payType')?.value;
    this.payCls.notes = this.ppcForm.get('notes')?.value;
    this.payCls.payValue = parseFloat(this.ppcForm.get('payValue')?.value.replace(/,/g, ''));
  }
  onUpdate() {
    this.clearMsg();
    if (this.ppcForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.subsink.sink = this.payService.UpdatePayComponents(this.payCls).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (this.ppcForm.get('mode')?.value === "Add") {
            this.modeChange('Modify');
          }
          this.tranMessage = res.message;
          this.getPayData(res.tranNoNew, this.ppcForm.get('mode')?.value);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  reset() {
    this.ppcForm = this.formInit();
    this.clearMsg();
  }
  populateData(res: any) {
    this.ppcForm.patchValue({
      payID: res.data.payID,
      payDesc: res.data.payDesc,
      payOn: res.data.payOn,
      payType: res.data.payType,
      payBy: res.data.payBy,
      taxable: res.data.taxable,
      isMandatory: res.data.isMandatory,
      payValue: res.data.payValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      createdDate: res.data.createdDate,
      notes: res.data.notes
    });
    this.status = res.data.tranStatus;
  }
  getpayCompData(event: string) {
    this.getPayData(event, this.ppcForm.get('mode')?.value)
  }
  getPayData(event: string, mode: string) {
    const body: getPayload = {
      ...this.commonParams(),
      item: event
    }
    this.subsink.sink = this.payService.GetPayComponentData(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.populateData(res);
        if (mode != 'View' && this.tranMessage != "") {
          this.retMessage = this.tranMessage;
          this.textMessageClass = 'green';
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'green';
        }

      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = 'red';
      }
    })
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM602",
        Page: "Pay Components",
        SlNo: 59,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
