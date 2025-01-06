import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { forkJoin } from 'rxjs';
import { leaveType } from '../payroll.class';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-leave-types',
  templateUrl: './leave-types.component.html',
  styleUrls: ['./leave-types.component.css']
})
export class LeaveTypesComponent implements OnInit, OnDestroy {
  private leaveCls: leaveType = new leaveType();
  ltDetForm!: FormGroup;
  modes: Item[] = [];
  leaveList: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  newTranMsg: string = "";
  status: string = ""
  masterParams!: MasterParams;
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();
  constructor(private fb: FormBuilder, public dialog: MatDialog, private datePipe: DatePipe,
    private masterService: MastersService, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private payService: PayrollService) {
    this.ltDetForm = this.formInit();
    this.masterParams = new MasterParams();

  }

  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  modeChanged(event: string) {
    if (event.toUpperCase() === "ADD") {
      this.ltDetForm = this.formInit();
      this.clearMsg();
      this.status = "";
      this.ltDetForm.get('leaveCode')?.disable();
      this.ltDetForm.get('code')?.enable();
      this.ltDetForm.get('mode')?.patchValue(event,{emitEvent:false});
      this.loadData();
    }
    else {
      this.ltDetForm.get('leaveCode')?.enable();
      this.ltDetForm.get('mode')?.patchValue(event,{emitEvent:false});
      this.ltDetForm.get('code')?.disable();
    }
  }
  formInit() {
    return this.fb.group({
      leaveCode: [''],
      leaveDesc: ['', [Validators.required, Validators.maxLength(50)]],
      applicableTo: ['', [Validators.required, Validators.maxLength(30)]],
      isEncashable: [false],
      isCarryFwdble: [false],
      tranDate: [new Date(), [Validators.required]],
      notes: [''],
      mode: ['View'],
      code: [{ value: '', disabled: true }]
    })
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
  }

  loadData() {
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM604',
    };
    const leavebody: getPayload = {
      ...this.commonParams(),
      item: "PAYROLLLEAVETYPES",
      mode:this.ltDetForm.get('mode')?.value
    };

    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(leavebody);
      this.subsink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          this.modes = res1.data;
          this.leaveList = res2.data;
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

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  leaveTypeChanged(event: any) {
    this.getLeaveTypes(event.value, this.ltDetForm.get('mode')?.value);
  }

  getLeaveTypes(leaveCode: string, mode: string) {
    const body: getPayload = {
      ...this.commonParams(),
      item: leaveCode,
    };
    try {
      this.loader.start();
      this.subsink.sink = this.payService.getLeaveTypes(body).subscribe((res: any) => {
        this.loader.stop();
        console.log(res.data);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.status = res['data'].typeStatus;
          this.ltDetForm.patchValue({
            code:res.data.leaveCode,
            leaveCode: res.data.leaveCode,
            leaveDesc: res.data.leaveDesc,
            applicableTo: res.data.applicableTo,
            isEncashable: res.data.isEncashable,
            isCarryFwdble: res.data.isCarryFwdble,
            tranDate: res.data.tranDate,
            notes: res.data.notes
          });
          if (mode != 'View' && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
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

    } catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }

  }
  prepareLeaveCls() {
    this.leaveCls.company = this.userDataService.userData.company;
    this.leaveCls.location = this.userDataService.userData.location;
    this.leaveCls.user = this.userDataService.userData.userID;
    this.leaveCls.refNo = this.userDataService.userData.sessionID;
    this.leaveCls.mode = this.ltDetForm.get('mode')?.value;
    this.leaveCls.applicableTo = this.ltDetForm.get('applicableTo')?.value;
    this.leaveCls.isCarryFwdble = this.ltDetForm.get('isCarryFwdble')?.value;
    this.leaveCls.isEncashable = this.ltDetForm.get('isEncashable')?.value;
    if (this.ltDetForm.get('mode')?.value === "Add") {
      this.leaveCls.leaveCode = this.ltDetForm.get('code')?.value;
    }
    else {
      this.leaveCls.leaveCode = this.ltDetForm.get('leaveCode')?.value;
    }
    this.leaveCls.leaveDesc = this.ltDetForm.get('leaveDesc')?.value;
    this.leaveCls.notes = this.ltDetForm.get('notes')?.value;

    const transformedDate = this.datePipe.transform(this.ltDetForm.get('tranDate')!.value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.leaveCls.tranDate = transformedDate.toString();
    } else {
      this.leaveCls.tranDate = ''; // or any default value you prefer
    }
  }
  onUpdate() {
    this.clearMsg();
    if (this.ltDetForm.invalid) {
      return;
    }
    else {
      this.prepareLeaveCls();
      this.subsink.sink = this.payService.UpdateLeaveTypes(this.leaveCls).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (this.ltDetForm.get('mode')?.value === "Add") {
            this.modeChanged('Modify');
            this.leaveList.push({ itemCode: this.ltDetForm.get('code')?.value, itemName: this.ltDetForm.get('leaveDesc')?.value })
          }
          this.newTranMsg = res.message;
          this.textMessageClass = 'green';
          this.getLeaveTypes(res.tranNoNew, this.ltDetForm.get('mode')?.value);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }

  }
  reset() {
    this.ltDetForm = this.formInit();
    this.clearMsg();
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
    this.newTranMsg = "";
    this.status = "";
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM604",
        Page: "Leave Type",
        SlNo: 61,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
