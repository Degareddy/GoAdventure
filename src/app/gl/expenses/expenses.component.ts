import { ExpenseDetailsComponent } from 'src/app/gl/expenses/expense-details/expense-details.component';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { ExpenseHdr } from '../gl.class'
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  expensesForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  dialogOpen = false;
  expCls!: ExpenseHdr;
  retMessage!: string;
  textMessageClass!: string;
  newTranMsg!: string;
  retNum!: number;
  modeIndex!: number;
  selMode!: string;
  detdialogOpen = false;

  // userData: any;
  masterParams!: MasterParams;
  modes!: any[];
  tranStatus!: string;
  tranAmount!: number;
  private subSink!: SubSink;


  // @ViewChild('frmClear') public expenfrm !: NgForm;

  constructor(protected route: ActivatedRoute,
    protected router: Router, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    protected glService: GeneralLedgerService,
    private masterService: MastersService,
    public dialog: MatDialog, private fb: FormBuilder,
    private datePipe: DatePipe) {
    this.masterParams = new MasterParams();
    this.expensesForm = this.formInit();
    this.expCls = new ExpenseHdr();
    this.subSink = new SubSink();
  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<ExpenseDetailsComponent> = this.dialog.open(ExpenseDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        'tranNo': this.expensesForm.get('tranNo')!.value,
        'mode': this.expensesForm.controls['mode'].value,
        'status': this.tranStatus,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != true && result != undefined) {
        this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);

      }
    });
  }
  ngOnInit(): void {
    // const storedUserData = sessionStorage.getItem('userData');
    // if (storedUserData) {
    //   this.userData = JSON.parse(storedUserData) as UserData;
    // }
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modeBody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: 'ST401',
      refNo: this.userDataService.userData.sessionID
    };
    try {
      this.subSink.sink = this.masterService.getModesList(modeBody).subscribe((res: any) => {
        this.modes = res['data'];
      });
      // this.masterParams.item = this.purReqHdrForm.controls['tranNo'].value;
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      notes: ['']
    })
  }

  onSubmit() {
    if (this.expensesForm.invalid) {
      return;
    }
    else {
      this.expCls.company = this.userDataService.userData.company;
      this.expCls.location = this.userDataService.userData.location;
      this.expCls.langId = this.userDataService.userData.langId;
      this.expCls.user = this.userDataService.userData.userID;
      this.expCls.refNo = this.userDataService.userData.sessionID;
      this.expCls.mode = this.expensesForm.controls['mode'].value;
      this.expCls.notes = this.expensesForm.controls['notes'].value;
      this.expCls.tranStatus = this.tranStatus;
      this.expCls.tranDate = this.expensesForm.controls['tranDate'].value;
      this.expCls.tranNo = this.expensesForm.controls['tranNo'].value;
      try {
        this.loader.start();
        this.subSink.sink = this.glService.UpdateExpensesHdr(this.expCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            this.masterParams.tranNo = res.tranNoNew;

            if (this.expensesForm.controls['mode'].value == "Add") {
              // this.selMode = 'Add';
              this.modeChange("Modify");
            }
            this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);

            this.retMessage = res.message;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = "red";
      }
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }
  Reset() {
    this.expensesForm = this.formInit();
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.expensesForm = this.formInit();
      this.expensesForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.expensesForm.get('tranNo')!.patchValue('');
      this.expensesForm.get('tranNo')!.disable();
      this.expensesForm.get('tranNo')!.clearValidators();
      this.expensesForm.get('tranNo')!.updateValueAndValidity();
      this.expensesForm.controls['tranDate'].patchValue(new Date);
    }
    else {
      this.expensesForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.expensesForm.get('tranNo')!.enable();
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
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      TranType: 'EXPENSES',
      TranNo: this.expensesForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY",
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    this.subSink.sink = this.glService.GetTranCount(body).subscribe((res: any) => {
      // if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
      if (res && res.data && res.data.tranCount === 1) {
        this.masterParams.tranNo = res.data.selTranNo;
        this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
      }
      else {
        this.retMessage = '';
        if (!this.detdialogOpen) {
          const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
            width: '90%',
            disableClose: true,
            data: { 'tranNum': this.expensesForm.controls['tranNo'].value, 'search': 'Expenses Search', 'TranType': "EXPENSES" }  // Pass any data you want to send to CustomerDetailsComponent
          });
          this.detdialogOpen = true;
          dialogRef.afterClosed().subscribe(result => {
            this.detdialogOpen = false;
            if (result != true && result != undefined) {
              this.masterParams.tranNo = result;
              this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
            }

          });
        }
      }
      // }
      // else {
      //   this.fetchStatus = true;
      //   this.disableDetail = true;
      //   this.retMessage = res.message;
      //   this.textMessageClass = 'red';
      // }
    });
  }

  clear() {
    this.expensesForm = this.formInit();
    this.tranStatus = '';
    this.retMessage = '';
    this.dialogOpen = false;
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.expensesForm.controls['mode'].value, tranNo: this.expensesForm.controls['tranNo'].value, search: 'Expenses Docs', tranType: "EXPENSES" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  generateExcel() {
    if (this.expensesForm.controls['tranNo'].value) {
      this.getExpenseData(this.expensesForm.controls['tranNo'].value, this.expensesForm.controls['mode'].value);
    }
  }

  getExpenseData(masterParams: MasterParams, mode: string) {
    this.loader.start();
    try {
      this.subSink.sink = this.glService.getExpensesHdr(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.expCls = res['data'];
          this.tranStatus = res['data'].tranStatus;
          this.tranAmount = res['data'].totalAmt;
          this.expensesForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.expensesForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.expensesForm.controls['notes'].patchValue(res['data'].notes);
          this.textMessageClass = 'green';
          if (mode != 'View') {
            this.retMessage = this.newTranMsg;
          }
          else {
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

  reset() {
    this.expensesForm = this.formInit();
    this.clearValues();
    this.dialogOpen = false;
  }
  clearValues() {
    this.tranStatus = "";
    this.tranAmount = 0;
    this.retMessage = "";
    this.textMessageClass = "";
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST401",
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

}
