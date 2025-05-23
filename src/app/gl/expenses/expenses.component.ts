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
import { SalesService } from 'src/app/Services/sales.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { displayMsg, Mode, ScreenId, TextClr, TranStatus, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';


interface Item {
  itemCode: string;
  itemName: string;
}
@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, OnDestroy {
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
  balanceAmount: number = 0;
  masterParams!: MasterParams;
  modes!: any[];
  tranStatus!: string;
  tranAmount: number =0;
  clientCode!: string;
  private subSink!: SubSink;
  clientTypeList: Item[] = [
    { itemCode: 'TENANT', itemName: 'Tenant' },
    { itemCode: 'STAFF', itemName: 'Staff' },
    { itemCode: 'LANDLORD', itemName: 'Landlord' },
    { itemCode: 'VENDOR', itemName: 'Vendor' },
    { itemCode: 'CUSTOMER', itemName: 'Customer' },
    { itemCode: 'SUPPLIER', itemName: 'Supplier' },
    { itemCode: 'EMPLOYEE', itemName: 'Employee' },

  ];

  constructor(protected route: ActivatedRoute, private saleService: SalesService, private utlService: UtilitiesService,
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
    this.tomorrow = new Date();
    this.tomorrow.setDate(this.tomorrow.getDate() + 1);
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<ExpenseDetailsComponent> = this.dialog.open(ExpenseDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: this.expensesForm.get('tranNo')!.value,
        mode: this.expensesForm.controls['mode'].value,
        status: this.tranStatus,
        name: this.expensesForm.get('client')?.value,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
      }
    });
  }
  async getCashBalace() {
    const balBody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      asOnDate: new Date(),
      reportType: 'XYZ',
    };

    try {
      this.subSink.sink = await this.saleService.GetUserCashBalance(balBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.balanceAmount = res.data.totalAmount;
        }
        else {
          this.displayMessage(displayMsg.ERROR + "No cash balance!", TextClr.red);
        }
      });
    } catch (ex: any) {

      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modeBody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: ScreenId.EXPENSES_SCRID,
      refNo: this.userDataService.userData.sessionID
    };
    try {
      this.subSink.sink = this.masterService.getModesList(modeBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Modes list not found", TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
    this.getCashBalace();

  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      notes: [''],
      clientType: [''],
      client: ['', Validators.required]
    })
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    };
  }
  async onClientSearch() {
    this.displayMessage("","");
    this.clientCode = '';
    if (this.expensesForm.controls.clientType.value === "" || this.expensesForm.controls.clientType.value === null || this.expensesForm.controls.clientType.value === undefined) {
      this.displayMessage(displayMsg.ERROR + "Please Select Client Type", TextClr.red);
      return;
    }
    else {
      const body = {
        ...this.commonParams(),
        Type: Type.CLIENT,
        item: this.expensesForm.controls['client'].value || "",
        ItemSecondLevel: ""
      }
      try {
        this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
          if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
            if (res && res.data && res.data.nameCount === 1) {
              this.expensesForm.controls['client'].patchValue(res.data.selName);
              this.clientCode = res.data.selCode;
            }
            else {
              if (!this.dialogOpen) {
                const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                  width: '90%',
                  disableClose: true,
                  data: {
                    'PartyName': this.expensesForm.controls['client'].value,
                    'PartyType': this.expensesForm.controls['clientType'].value,
                    'search': 'Client Search'
                  }
                });
                this.dialogOpen = true;
                dialogRef.afterClosed().subscribe(result => {
                  if (result != true) {
                    this.expensesForm.controls['client'].patchValue(result.partyName);
                    this.clientCode = result.code;
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

  }
  prepareCls() {
    this.expCls.company = this.userDataService.userData.company;
    this.expCls.location = this.userDataService.userData.location;
    this.expCls.langId = this.userDataService.userData.langId;
    this.expCls.user = this.userDataService.userData.userID;
    this.expCls.refNo = this.userDataService.userData.sessionID;
    this.expCls.mode = this.expensesForm.controls['mode'].value;
    this.expCls.notes = this.expensesForm.controls['notes'].value;
    this.expCls.tranStatus = this.tranStatus;
    this.expCls.tranDate = this.formatDate(this.expensesForm.controls['tranDate'].value);

    this.expCls.tranNo = this.expensesForm.controls['tranNo'].value;
    this.expCls.Supplier = this.clientCode;
  }
  onSubmit() {
    if (this.expensesForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subSink.sink = this.glService.UpdateExpensesHdr(this.expCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            this.masterParams.tranNo = res.tranNoNew;
            if (this.expensesForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.modeChange("Modify");
            }
            this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      } catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
    if (event.toUpperCase() === Mode.Add) {
      this.clear();
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
    this.displayMessage("", "");
    // this.expensesForm = this.formInit();
    this.tranAmount = 0;
    // this.balanceAmount = 0;
    this.tranStatus = "";
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      TranType: Type.EXPENSES,
      TranNo: this.expensesForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: TranStatus.ANY,
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    this.subSink.sink = this.glService.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
        }
        else {
          this.openSearch();
        }
      }
      else {
        this.openSearch();
      }
    });
  }
  openSearch() {
    if (!this.detdialogOpen) {
      const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: this.expensesForm.get('tranNo')?.value,
          search: 'Expenses Search', TranType: Type.EXPENSES
        }
      });
      this.detdialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        this.detdialogOpen = false;
        if (result != true && result != undefined) {
          // console.log(result);
          this.masterParams.tranNo = result;
          this.getExpenseData(this.masterParams, this.expensesForm.controls['mode'].value);
        }

      });
    }
  }
  clear() {
    this.expensesForm = this.formInit();
    this.tranStatus = '';
    this.dialogOpen = false;
    this.tranAmount = 0;
    // this.balanceAmount = 0;
    this.displayMessage("", "");
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.expensesForm.controls['mode'].value, tranNo: this.expensesForm.controls['tranNo'].value,
        search: 'Expenses Docs', tranType: Type.EXPENSES
      }
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
        if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
          this.expCls = res['data'];
          this.tranStatus = res['data'].tranStatus;
          this.tranAmount = res['data'].totalAmt;
          this.expensesForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.expensesForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.expensesForm.controls['notes'].patchValue(res['data'].notes);
          this.expensesForm.controls['client'].patchValue(res['data'].supplierName);
          this.clientCode = res['data'].supplier;
          this.textMessageClass = 'green';
          if (mode.toUpperCase() != Mode.view) {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
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

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.EXPENSES_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
