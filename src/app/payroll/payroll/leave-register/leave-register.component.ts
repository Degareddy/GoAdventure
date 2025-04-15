import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { firstValueFrom, forkJoin, map, startWith } from 'rxjs';
import { SubSink } from 'subsink';
import { LeaveRegister } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { AccessSettings } from 'src/app/utils/access';

interface params {
  itemCode: string
  itemName: string

}

interface autoComplete {
  itemCode: string
  itemName: string
  itemDetails: string

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
  empCode: string = "";
  autoFilteredEmployee: autoComplete[] = [];
  employeeList: autoComplete[] = []
  filteredEmployee: any[] = [];

  constructor(private fb: FormBuilder,
    public dialog: MatDialog,
    private router: Router,
    private masterService: MastersService,
    private userDataService: UserDataService,
    private datePipe: DatePipe,
    private loader: NgxUiLoaderService,
    private payService: PayrollService,
    private utlService: UtilitiesService) {
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
  async ngOnInit(): Promise<void> {
    this.loadData();

    this.plrHdrForm.get('employee')!.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.itemName || ''),
        map(name => this._filterEmployee(name))
      )
      .subscribe(filtered => {
        this.autoFilteredEmployee = filtered;
      });
      this.employeeList=await  this.loadCust("EMPLOYEE");
      this.filteredEmployee=this.employeeList
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
      item: "EMPLOYEE",
      mode: this.plrHdrForm.get('mode')?.value
    };
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST601'
    };
    const leavebody: getPayload = {
      ...this.commonParams(),
      item: "PAYROLLLEAVETYPES",
      mode: this.plrHdrForm.get('mode')?.value
    };

    try {
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(empbody);
      const service3 = this.masterService.GetMasterItemsList(leavebody);
      this.subSink.sink = forkJoin([service1, service2, service3]).subscribe((results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];

        if (res1.status.toUpperCase() === "SUCCESS") {
          this.modes = res1.data;

        } else {
          this.retMessage = "Modes List empty!";
          this.textMessageClass = "red";
        }
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.empList = res2.data;

        }
        else {
          this.retMessage = "Employee List empty!";
          this.textMessageClass = "red";
        }
        if (res3.status.toUpperCase() === "SUCCESS") {
          this.leaveList = res3.data;

        }
        else {
          this.retMessage = "Leave List empty!";
          this.textMessageClass = "red";
        }
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

  displayEmployee(item: autoComplete): string {
    return item && item.itemName ? item.itemName : '';
  }
  
  filerEmployee(value: any) {
    const filterValue = value.toLowerCase();
    return this.employeeList.filter((cust: params) => cust.itemName.toLowerCase().includes(filterValue));
  }
  private _filterEmployee(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.employeeList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue) ||
      option.itemDetails.toLowerCase().includes(filterValue)
    );
  }
  async loadCust(partyType: string): Promise<autoComplete[]> {
      
      let resList:autoComplete[]=[]
      const body = {
        Company: this.userDataService.userData.company,
        Location: this.userDataService.userData.location,
        City: "",
        Email: "",
        FullAddress: "",
        Phones: "",
        PartyName: "",
        PartyStatus: TranStatus.OPEN,
        RefNo: this.userDataService.userData.sessionID,
        User: this.userDataService.userData.userID,
        PartyType: partyType,
      };
    
      try {
        const res: any = await firstValueFrom(this.utlService.GetPartySearchList(body));
        
        if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          return [];
        }
    
        this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        resList=res.data.map((item: any) => ({
          itemCode: item.code,
          itemName: item.partyName,
          itemDetails: item.phones || item.email || 'No Email Or Phone number'
        }));
        return resList
      } catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        return [];
      }
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

  modeChange(event: string) {
    if (this.plrHdrForm.get('mode')?.value === "Add") {
      this.clearMsg();
      this.plrHdrForm = this.formInit();
      this.plrHdrForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.plrHdrForm.get('leaveType')?.enable();
      this.loadData();
    }
    else {
      this.plrHdrForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.plrHdrForm.get('leaveType')?.disable();
    }
  }

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.EMPLOYEE,
      Item: this.plrHdrForm.get('employee')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.plrHdrForm.controls['employee'].patchValue(res.data.selName);
            this.empCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.plrHdrForm.get('employee')!.value, PartyType: Type.EMPLOYEE,
                  search: 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.plrHdrForm.controls['employee'].patchValue(result.partyName);
                  this.empCode = result.code;
                  if(this.empCode.length !==0){
                    this.autoFilteredEmployee=[]
                  }
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
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
