import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { LeaveRegister } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
interface params {
  itemCode: string
  itemName: string

}
@Component({
  selector: 'app-leave-register',
  templateUrl: './leave-register.component.html',
  styleUrls: ['./leave-register.component.css']
})
export class LeaveRegisterComponent implements OnInit, OnDestroy {
  plrHdrForm!: FormGroup;
  modes: Item[] = []
  textMessageClass: string = "";
  retMessage: string = "";
  tranMessage: string = "";
  ppcForm!: FormGroup;
  status: string = "";
  empList: Item[] = [];
  leaveList: Item[] = [];
  private subSink: SubSink;
  LeaveRegisterCls!: LeaveRegister;
  @Input() max: any;
  tomorrow = new Date();
  dialogOpen: boolean = false;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private router: Router,
    private masterService: MastersService, private userDataService: UserDataService, private datePipe: DatePipe,
    private loader: NgxUiLoaderService, private payService: PayrollService) {
    this.plrHdrForm = this.formInit();
    this.subSink = new SubSink();
    this.LeaveRegisterCls = new LeaveRegister();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      employee: ['', [Validators.required, Validators.maxLength(50)]],
      leaveType: ['', [Validators.required, Validators.maxLength(24)]],
      requestedLeaveFrom: [new Date(), [Validators.required]],
      requestedLeaveTo: [new Date(), [Validators.required]],
      sanctionedLeaveFrom: [new Date(), [Validators.required]],
      sanctionedLeaveTo: [new Date(), [Validators.required]],
      joinedBackOn: [new Date(), [Validators.required]],
      totalLeaveDays: ['', [Validators.required]],
      appliedOn: [new Date(), [Validators.required]],
      approvedOn: [new Date(), [Validators.required]],
      approvedBy: ['', [Validators.required, Validators.maxLength(10)]],
      isBonusLeave: [false],
      extraLeavesTaken: ['', [Validators.required]],
      leaveStatus: [''],
      remarks: [''],
      empId: [''],
      mode: ['View']
    })
  }
  ngOnInit(): void {
    this.loadData();

  }
  displayEMP(item: params): string {
    return item ? item.itemName : '';
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  loadData() {
    const empbody: getPayload = {
      ...this.commonParams(),
      item: "EMPLOYEE"
    };
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST601'
    };
    const leavebody: getPayload = {
      ...this.commonParams(),
      item: "PAYROLLLEAVETYPES"
    };

    try {
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(empbody);
      const service3 = this.masterService.GetMasterItemsList(leavebody);
      this.subSink.sink = forkJoin([service1, service2, service3]).subscribe((results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        this.modes = res1.data;
        this.empList = res2.data;
        this.leaveList = res3.data;
      });

    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }


  }
  prepareLeaveCls() {
    this.LeaveRegisterCls.company = this.userDataService.userData.company;
    this.LeaveRegisterCls.location = this.userDataService.userData.location;
    this.LeaveRegisterCls.langID = this.userDataService.userData.langId;
    this.LeaveRegisterCls.user = this.userDataService.userData.userID;
    this.LeaveRegisterCls.refNo = this.userDataService.userData.sessionID;
    this.LeaveRegisterCls.mode = this.plrHdrForm.controls['mode'].value;
    this.LeaveRegisterCls.tranNo = this.plrHdrForm.controls['tranNo'].value;
    this.LeaveRegisterCls.tranDate = this.plrHdrForm.controls['tranDate'].value;
    this.LeaveRegisterCls.employee = this.plrHdrForm.controls['employee'].value;
    this.LeaveRegisterCls.leaveType = this.plrHdrForm.controls['leaveType'].value;
    this.LeaveRegisterCls.requestedLeaveFrom = this.plrHdrForm.controls['requestedLeaveFrom'].value;
    this.LeaveRegisterCls.requestedLeaveTo = this.plrHdrForm.controls['requestedLeaveTo'].value;
    this.LeaveRegisterCls.sanctionedLeaveFrom = this.plrHdrForm.controls['sanctionedLeaveFrom'].value;
    this.LeaveRegisterCls.sanctionedLeaveTo = this.plrHdrForm.controls['sanctionedLeaveTo'].value;
    this.LeaveRegisterCls.joinedBackOn = this.plrHdrForm.controls['joinedBackOn'].value;
    this.LeaveRegisterCls.appliedOn = this.plrHdrForm.controls['appliedOn'].value;
    this.LeaveRegisterCls.totalLeaveDays = this.plrHdrForm.controls['totalLeaveDays'].value;
    this.LeaveRegisterCls.approvedOn = this.plrHdrForm.controls['approvedOn'].value;
    this.LeaveRegisterCls.approvedBy = this.plrHdrForm.controls['approvedBy'].value;
    this.LeaveRegisterCls.isBonusLeave = this.plrHdrForm.controls['isBonusLeave'].value;
    this.LeaveRegisterCls.extraLeavesTaken = this.plrHdrForm.controls['extraLeavesTaken'].value;
    this.LeaveRegisterCls.remarks = this.plrHdrForm.controls['remarks'].value;
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  onSubmit() {
    this.prepareLeaveCls();
    try {
      this.loader.start();
      this.subSink.sink = this.payService.UpdateLeaveRegister(this.LeaveRegisterCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.retVal >= 100 && res.retVal <= 200) {
          this.tranMessage = res.message;
          this.textMessageClass = "green";
          this.getLeaveRegister(res.tranNoNew, this.plrHdrForm.get('mode')?.value);
        }

      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }



  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  reset() {
    this.status = '';
    this.retMessage = '';
    this.plrHdrForm = this.formInit();
  }
  getLeaveRegister(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tranNo
    };
    try {
      this.loader.start();
      this.subSink.sink = this.payService.GetLeaveRegister(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.status = res['data'].leaveStatus;
          this.plrHdrForm.patchValue({
            tranDate: res.data.tranDate,
            employee: res.data.employee,
            leaveType: res.data.leaveType,
            requestedLeaveFrom: res.data.requestedLeaveFrom,
            requestedLeaveTo: res.data.requestedLeaveTo,
            sanctionedLeaveFrom: res.data.sanctionedLeaveFrom,
            sanctionedLeaveTo: res.data.sanctionedLeaveTo,
            joinedBackOn: res.data.joinedBackOn,
            totalLeaveDays: res.data.totalLeaveDays,
            appliedOn: res.data.appliedOn,
            approvedOn: res.data.approvedOn,
            approvedBy: res.data.approvedBy,
            isBonusLeave: res.data.isBonusLeave,
            extraLeavesTaken: res.data.extraLeavesTaken,
            // leaveStatus: res.data.leaveStatus,
            remarks: res.data.remarks,
            empId: res.data.empId,
          });
          if (mode != "View" && this.tranMessage != "") {
            this.retMessage = this.tranMessage;
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
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'LEAVEREGISTER',
      TranNo: this.plrHdrForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.loader.start();
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        this.loader.stop()
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.plrHdrForm.controls['tranNo'].patchValue(res.data.selTranNo);
            this.getLeaveRegister(res.data.selTranNo, this.plrHdrForm.get('mode')!.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.plrHdrForm.controls['tranNo'].value, 'TranType': "LEAVEREGISTER",
                  'search': 'Leave Search'
                }
              });
              // this.tranStatus = "";
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.plrHdrForm.controls["tranNo"].patchValue(result);
                  this.getLeaveRegister(result, this.plrHdrForm.get('mode')!.value);

                }
              });
            }
          }
        }
        else {
          // this.handleError(res);
        }

      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST601",
        Page: "Leave Register",
        SlNo: 64,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
}
