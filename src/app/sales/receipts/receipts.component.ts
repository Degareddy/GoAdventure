import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { recieptsClass } from '../sales.class';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { SalesService } from 'src/app/Services/sales.service';
import { forkJoin } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { DatePipe } from '@angular/common';
import autoTable from 'jspdf-autotable';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { TenantSearchComponent } from './tenant-search/tenant-search.component';
import jsPDF from 'jspdf';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { SmsService } from 'src/app/Services/sms.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UserData } from 'src/app/admin/admin.module';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { SideOverlayComponent } from 'src/app/general/side-overlay/side-overlay.component';
import { ReprotsComponent } from 'src/app/general/reprots/reprots.component';
import { AllocateComponent } from './allocate/allocate.component';
import { SearchCashTransferComponent } from 'src/app/general/search-cash-transfer/search-cash-transfer.component';
import { start } from 'repl';
import { style } from '@angular/animations';
import { LoanAllocationComponent } from './loan-allocation/loan-allocation.component';
import { LogoService } from 'src/app/Services/logo.service';
// import { SalesReportsComponent } from '../sales-reports/sales-reports.component';
interface Item {
  itemCode: string;
  itemName: string;
}
interface ReceiptFormData {
  receiptNo: string;
  receiptDate: Date;
  customer: string;
  currency: string;
  rctMode: string;

  customerBank: string;
  custAccount: string;
  instrumentNo: string;
  instrumentDate: Date;
  instrumentStatus: string;
  rctType: string;
  rctBank: string;
  rctAccount: string;
  rctDate: Date;
  rctStatus: string;
  rctAmount: number;
  remarks: string;
  mode: string;
  accname: string;
  paidCurrency: string;
  exchRate: number;
  charges: number;
  paidAmt: number;
  tranFor: string;
}
@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.css'],
})
export class ReceiptsComponent implements OnInit, AfterViewInit, OnDestroy {
  onSearchRefNo() {
    this.displayMessage("", "");

  }
  @ViewChild('overlay') overlay!: SideOverlayComponent;
  receiptsForm!: FormGroup;
  receiptNoValid: boolean = true;
  modes: Item[] = [];
  Report!: string;
  receiptmodes: Item[] = [
    { itemCode: 'receiveRent', itemName: 'Rent receipt' },
    { itemCode: 'payRent', itemName: 'Rent payment' },
    { itemCode: 'utilityReceipt', itemName: 'Utility Receipt' },
    { itemCode: 'other', itemName: '...Other' },
  ];
  labelPosition: 'before' | 'after' = 'after';
  formName: string = 'Receipts / Payments';
  fromName: string = 'From';
  toName: string = 'To';
  payMode: Item[] = [];
  filteredpayMode: any = '';
  currency: Item[] = [];
  bank: Item[] = [];
  filteredbank: any = "";
  receiptAmount: number = 0;
  masterParams!: MasterParams;
  recptCls: recieptsClass;
  private selMode!: string;
  tctBankCode!: string;
  payStatus!: string;
  responseData: any;
  logoImageBlob: string = "";
  clientBankCode: string = '';
  // clientType: string = '';
  overHeadsLsit: Item[] = [];
  StatusList: Item[] = [
    { itemCode: 'Cleared', itemName: 'Cleared' },
    { itemCode: 'Paid', itemName: 'Paid' },
    { itemCode: 'Bounced', itemName: 'Bounced' },
    { itemCode: 'Pending', itemName: 'Pending' },
  ];
  filteredStatusList: any = "";
  @Input() max: any;
  today = new Date();
  tomorrow = new Date();
  retMessage!: string;
  textMessageClass!: string;
  balanceAmount: number = 0;
  pendingAmount: number = 0;
  filteredItemsClientType: Item[] = [];
  filteredItemsTranFor: any;
  filteredItemsTranType: any;
  isBalanceVisible: boolean = false;
  checkStatusList: Item[] = [
    { itemCode: 'balance', itemName: 'Balance' },
    { itemCode: 'recived', itemName: 'Recived' },
    { itemCode: 'returned', itemName: 'Returned' },
    { itemCode: 'waiting', itemName: 'Waiting' },
  ];
  rctTypeList: Item[] = [
    { itemCode: 'RECEIPT', itemName: 'Receipt' },
    { itemCode: 'PAYMENT', itemName: 'Payment' },
    { itemCode: 'DEBIT', itemName: 'Debit Note' },
    { itemCode: 'CREDIT', itemName: 'Credit Note' },
    { itemCode: 'JOURNAL', itemName: 'Journal' },
  ];
  clientTypeList: Item[] = [
    { itemCode: 'TENANT', itemName: 'Tenant' },
    { itemCode: 'STAFF', itemName: 'Staff' },
    { itemCode: 'LANDLORD', itemName: 'Landlord' },
    { itemCode: 'VENDOR', itemName: 'Vendor' },
    { itemCode: 'CUSTOMER', itemName: 'Customer' },
    { itemCode: 'SUPPLIER', itemName: 'Supplier' },
    { itemCode: 'EMPLOYEE', itemName: 'Employee' },

  ];
  private subSink!: SubSink;
  imageBlob: string = 'assets/img/user.jpg';
  dialogOpen: boolean = false;
  supCode: string = '';
  newMsg: string = '';
  data: any;
  allocStatus: string = '';
  constructor(
    private fb: FormBuilder,
    protected purchaseService: PurchaseService,
    private masterService: MastersService,
    private smsService: SmsService,
    public dialog: MatDialog,
    private userDataService: UserDataService,
    protected router: Router,
    private loader: NgxUiLoaderService,
    private datePipe: DatePipe,
    private toaster: ToastrService,
    private saleService: SalesService,
    private fileUploadService: MastersService,
    private logoService: LogoService,
  ) {
    this.receiptsForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.recptCls = new recieptsClass();
    this.subSink = new SubSink();

  }
  onSelectionChangeClientType() {
    const tarnType = this.receiptsForm.controls['rctType'].value.toUpperCase();
    const tranFor = this.receiptsForm.controls['tranFor'].value.toUpperCase();
    if (tarnType) {
      this.onSelectionChangeTranFor(tarnType);
      switch (tarnType) {
        case "RECEIPT":
          if (tranFor === "RENTPMT" || tranFor === "RENTDPST") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "TENANT");
            this.receiptsForm.controls['clientType'].patchValue("TENANT");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode.filter(item => item.itemCode === "CASH" || item.itemCode === "TRANSFER");
          }
          else if (tranFor === "REFUND") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "LANDLORD");
            this.receiptsForm.controls['clientType'].patchValue("LANDLORD");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          } else {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList;
            this.receiptsForm.controls['clientType'].patchValue("");
            this.receiptsForm.controls['clientType'].enable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          }
          break;
        case "PAYMENT":
          if (tranFor === "CASHTRF") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "STAFF");
            this.receiptsForm.controls['clientType'].patchValue("STAFF");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode.filter(item => item.itemCode === "CASH" || item.itemCode === "TRANSFER");
          }
          else if (tranFor === "REFUND") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "TENANT");
            this.receiptsForm.controls['clientType'].patchValue("TENANT");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          }
          else if (tranFor === "SUPPLIES") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "SUPPLIER");
            this.receiptsForm.controls['clientType'].patchValue("SUPPLIER");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          }
          else if (tranFor === "RENTPMT" || tranFor === "RENTDPST") {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList.filter(item => item.itemCode === "LANDLORD");
            this.receiptsForm.controls['clientType'].patchValue("LANDLORD");
            this.receiptsForm.controls['clientType'].disable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          }
          else {
            this.filteredItemsClientType = [];
            this.filteredItemsClientType = this.clientTypeList;
            this.receiptsForm.controls['clientType'].patchValue("");
            this.receiptsForm.controls['clientType'].enable();
            this.filteredpayMode = "";
            this.filteredpayMode = this.payMode;
          }
          break;
        default:
          this.filteredItemsClientType = [];
          this.filteredItemsClientType = this.clientTypeList;
          this.receiptsForm.controls['clientType'].patchValue("");
          this.receiptsForm.controls['clientType'].enable();
          this.filteredpayMode = "";
          this.filteredpayMode = this.payMode;
          break;
      }
    }
    else {
      this.filteredItemsTranFor = this.overHeadsLsit;
      this.filteredItemsClientType = this.payMode;
    }

  }

  onSelectionChangeTranFor(tranType: string) {
    const tarnType = this.receiptsForm.controls['rctType'].value.toUpperCase();
    if (tarnType) {
      switch (tarnType) {
        case "RECEIPT":
          this.filteredItemsTranFor = "";
          this.filteredItemsTranFor = this.overHeadsLsit.filter(item => item.itemCode === "BORROW" || item.itemCode === "LENDR" || item.itemCode === "RENTPMT" || item.itemCode === "RENTDPST" || item.itemCode === "REFUND" || item.itemCode === "UTILITY"
          );
          break;
        case "PAYMENT":
          this.filteredItemsTranFor = "";
          this.filteredItemsTranFor = this.overHeadsLsit.filter(item => item.itemCode === "BORROWR" || item.itemCode === "LENDR" || item.itemCode === "RENTPMT" || item.itemCode === "CASHTRF" || item.itemCode === "RENTDPST" || item.itemCode === "REFUND" || item.itemCode === "EXPENSE"
          );
          break;
        default:
          this.filteredItemsTranFor = this.overHeadsLsit;
          break;

      }
    }
    else {
      this.filteredItemsTranFor = this.overHeadsLsit;
    }
  }
  receiptTypeChange(event: string) {
    console.log(event);
    if (event.toUpperCase() === 'RECEIVERENT') {
      this.filteredpayMode = "";
      this.filteredpayMode = this.payMode.filter(item => item.itemCode === "CASH" || item.itemCode === "TRANSFER");
      this.receiptsForm.controls['mode'].patchValue('Add');
      this.receiptsForm.controls['rctType'].patchValue('RECEIPT');
      this.receiptsForm.controls['tranFor'].patchValue('RENTPMT');
      this.receiptsForm.controls['clientType'].patchValue("TENANT");
      this.Report = 'CLIENTBAL'
    }
    else if (event.toUpperCase() === 'PAYRENT') {
      this.filteredpayMode = "";
      this.filteredpayMode = this.payMode.filter(item => item.itemCode === "CASH" || item.itemCode === "TRANSFER" || item.itemCode === "DEDUCTION");
      this.receiptsForm.controls['mode'].patchValue('Add');
      this.receiptsForm.controls['rctType'].patchValue('PAYMENT');
      this.receiptsForm.controls['tranFor'].patchValue('RENTPMT');
      this.receiptsForm.controls['clientType'].patchValue("LANDLORD");
      this.Report = 'CLIENTBAL'
    }
    else if (event.toUpperCase() === 'UTILITYRECEIPT') {

      this.filteredpayMode = "";
      this.filteredpayMode = this.payMode.filter(item => item.itemCode === "CASH" || item.itemCode === "TRANSFER" || item.itemCode === "DEDUCTION");
      this.receiptsForm.controls['mode'].patchValue('Add');
      this.receiptsForm.controls['rctType'].patchValue('RECEIPT');
      this.receiptsForm.controls['tranFor'].patchValue('UTILITY');
      this.receiptsForm.controls['clientType'].patchValue("TENANT");
      this.Report = 'UTILBAL'
    }
    else {
      this.receiptsForm.controls['mode'].patchValue('View');
      this.receiptsForm.controls['rctType'].patchValue('');
      this.receiptsForm.controls['tranFor'].patchValue('');
      this.receiptsForm.controls['clientType'].patchValue("");

    }
  }
  toggleBalanceVisibility() {
    this.isBalanceVisible = !this.isBalanceVisible;
  }
  loanallocate() {
    const dialogRef: MatDialogRef<LoanAllocationComponent> = this.dialog.open(LoanAllocationComponent,
      {
        width: '60%', // Set the width of the dialog
        disableClose: true,
        data: {
          mode: this.receiptsForm.controls['mode'].value,
          tranNo: this.receiptsForm.controls['receiptNo'].value,
          search: 'Loan Statement',
          client: this.supCode,
          clientName: this.receiptsForm.controls['customer'].value
        },
      }
    );
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result.isAltered) {
    //     this.onSearchCilmcked();
    //   }
    // });
  }
  allocate() {
    const dialogRef: MatDialogRef<AllocateComponent> = this.dialog.open(AllocateComponent,
      {
        width: '80%', // Set the width of the dialog
        disableClose: true,
        data: {
          mode: this.receiptsForm.controls['mode'].value,
          tranNo: this.receiptsForm.controls['receiptNo'].value,
          search: 'Allocate',
          tranType: 'RECEIPT',
          tranAmount: this.receiptsForm.controls['rctAmount'].value,
          allocStatus: this.allocStatus,
          tranFor: this.receiptsForm.controls['tranFor'].value
        },
      }
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result.isAltered) {
        this.onSearchCilcked();
      }
    });
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
    this.clear();
  }
  ngAfterViewInit(): void { }
  openOverlay(): void {
    if (this.overlay) {
      this.overlay.open(ReprotsComponent);
    } else {
      console.error('Overlay component not initialized.');
    }
  }
  formInit() {
    return this.fb.group({
      receiptmode: [this.receiptmodes[3].itemCode],
      mode: ['View'],
      receiptNo: [''],
      receiptDate: [new Date(), Validators.required],
      // customer: [{ value: '', disabled: true }, Validators.required],
      currency: ['', Validators.required],
      rctMode: ['', Validators.required],
      customerBank: ['', Validators.required],
      custAccount: ['', Validators.required],
      accname: [''],
      instrumentNo: ['', Validators.required],
      instrumentDate: [new Date(), Validators.required],
      instrumentStatus: ['', Validators.required],
      rctBank: ['', Validators.required],
      rctType: ['', Validators.required],
      rctAccount: [{ value: '', disabled: true }, Validators.required],
      rctDate: [{ value: new Date(), disabled: true }, Validators.required],
      rctStatus: ['', Validators.required],
      rctAmount: ['0', Validators.required],
      remarks: [''],
      paidCurrency: [''],
      exchRate: [1.0],
      charges: [0],
      paidAmt: [{ value: 0, disabled: true }],
      tranFor: ['', Validators.required],
      sms: [false],
      clientType: [''],
      customer: [{ value: '', disabled: true }, Validators.required],
    });
  }
  formatExchangeRate() {
    const exchRateControl = this.receiptsForm.get('exchRate')!.value;
    const value = exchRateControl;
    if (value !== null && value !== undefined) {
      this.receiptsForm.get('exchRate')?.patchValue(value.toFixed(4));
    }
    return '';
  }

  updateExchangeRate(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.receiptsForm.get('exchRate')?.patchValue(isNaN(value) ? null : value);
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
        if (res.status.toUpperCase() === 'SUCCESS') {
          this.balanceAmount = res.data.totalAmount;
          this.pendingAmount = res.data.pendingAmount;
        }
        else {
          this.displayMessage("No cash balances found", 'red');
        }
      });
    } catch (ex: any) {

      this.displayMessage("Error " + ex.message, 'red');
    }
  }
  async ngOnInit() {
    this.refreshData();
    this.getCashBalace();
    const logoFileName = sessionStorage.getItem('logo') as string;
    this.downloadSelectedFile(logoFileName, 'logo');
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modeBody = {
      ...this.commonParams(),
      item: 'ST210',
    };
    try {
      this.subSink.sink = await this.masterService.getModesList(modeBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === 'SUCCESS') {
          this.modes = res['data'];
        } else {
          this.displayMessage("Modes list empty!", 'red');
        }
      });
    } catch (ex: any) {
      this.displayMessage("Error " + ex.message, 'red');
    }

    this.loadData();
    if (history.state.data) {
      this.data = history.state.data;
      if (
        this.data && this.data.tranNo && history.state.type != 'Payment' && history.state.type != 'Receipt'
      ) {
        this.masterParams.tranNo = this.data.tranNo;
        this.getReceiptDetails(this.masterParams, this.receiptsForm.get('mode')?.value);
      } else if ((this.data && this.data.receipt === 'Receipt') || history.state.type === 'Receipt') {
        this.receiptsForm.patchValue({
          mode: 'Add',
          rctType: 'RECEIPT',
          tranFor: 'RENTPMT',
          customer: this.data.clientName || this.data.partyName,
        });
        this.payStatus = 'Open';
        if (this.data.clientName || this.data.partyName) {
          this.onSearchCustomer();
        }
      } else if (
        (this.data && this.data.receipt === 'Payment') ||
        history.state.type === 'Payment'
      ) {
        this.receiptsForm.patchValue({
          mode: 'Add',
          rctType: 'PAYMENT',
          tranFor: 'RENTPMT',
          clientType: this.data.partyType,
          customer: this.data.clientName || this.data.partyName,
        });
        this.payStatus = 'Open';
        if (this.data.clientName || this.data.partyName) {
          this.onSearchCustomer();
        }
      }
    }
  }

  calculateAmount(): void {
    const tranAmountValue = this.receiptsForm.get('rctAmount')!.value;
    const tranAmount = typeof tranAmountValue === 'string' ? parseFloat(tranAmountValue.replace(',', '')) : parseFloat(tranAmountValue);
    const exchRateValue = this.receiptsForm.get('exchRate')!.value;
    const exchRate = typeof exchRateValue === 'string' ? parseFloat(exchRateValue.replace(',', '')) : parseFloat(exchRateValue);
    const chargesValue = this.receiptsForm.get('charges')!.value;
    const charges = typeof chargesValue === 'string' ? parseFloat(chargesValue.replace(',', '')) : parseFloat(chargesValue);
    const amount = (tranAmount - exchRate * charges) / exchRate;
    const formattedAmount = amount;
    this.receiptsForm
      .get('paidAmt')!
      .patchValue(
        formattedAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
  }
  refreshData() {
    this.receiptsForm.get('clientType')?.valueChanges.subscribe((value) => {
      if (value != "" && value != undefined) {
        this.receiptsForm.get('customer')?.enable();
      } else {
        this.receiptsForm.get('customer')?.disable();
      }
    });
    this.receiptsForm.get('rctMode')?.valueChanges.subscribe((value) => {
      if (this.receiptsForm.controls.rctMode.value === 'DEDUCTION') {
        this.receiptsForm.controls['instrumentNo'].clearValidators();
        this.receiptsForm.controls['instrumentNo'].updateValueAndValidity();
      }
    })
    this.receiptsForm.get('customerBank')!.valueChanges.subscribe((data) => {
      if (data === 'CASH' || data === 'M-PESA') {
        this.receiptsForm.controls['custAccount'].patchValue(data);
        this.receiptsForm.controls['custAccount'].disable();
        this.receiptsForm.controls['rctBank'].patchValue(data);
        if (data === 'CASH') {
          this.receiptsForm.controls['rctBank'].disable();
        } else {
          this.receiptsForm.controls['rctBank'].enable();
        }
      } else {
        this.receiptsForm.controls['custAccount'].patchValue('');
        this.receiptsForm.controls['custAccount'].enable();
        this.receiptsForm.controls['rctBank'].patchValue('');
        this.receiptsForm.controls['rctBank'].enable();
      }
    });
    this.receiptsForm.get('rctType')!.valueChanges.subscribe((data) => {
      if (data === 'RECEIPT') {
        this.fromName = 'Receipt From';
        this.toName = 'Receipt To';
        // this.receiptsForm.get('customer')?.enable();
        // this.receiptsForm.controls.tranFor.patchValue('RENTPMT');
        this.receiptsForm.controls.tranFor.get('Rent')?.disabled;
      } else if (data === 'PAYMENT') {
        this.fromName = 'Payment To';
        this.toName = 'Payment From';
        // this.receiptsForm.get('customer')?.enable();
        this.receiptsForm.controls.tranFor.patchValue('');
        this.receiptsForm.controls.tranFor.get('Rent')?.enabled;
      } else {
        this.fromName = 'From';
        this.toName = 'To';
        // this.receiptsForm.get('customer')?.disable();
      }
    });
    this.receiptsForm.get('customerBank')!.valueChanges.subscribe((data) => {
      this.displayMessage('', "");
      if (this.receiptsForm.controls['rctMode'].value.toUpperCase === '') {
        this.displayMessage(`Please select Pay mode`, "red");
        return;
      }
      // if (this.receiptsForm.controls['customerBank'].value.toUpperCase() === "CASH" && this.receiptsForm.controls['rctMode'].value.toUpperCase() === "TRANSFER") {
      //   this.displayMessage(`Please change the client's bank method from cash`, "red");
      //   return;
      // }
    })
    this.receiptsForm.get('tranFor')!.valueChanges.subscribe((data) => {
      this.displayMessage('', "");

      const rctType = this.receiptsForm.controls['rctType'].value.toUpperCase();
      const tranFor = this.receiptsForm.controls['tranFor'].value.toUpperCase();

      if (tranFor === "BORROWR" && rctType !== 'PAYMENT') {
        this.displayMessage(`Transaction type "${tranFor}" must have a tran type of Payment`, "red");
        return;
      }

      if (tranFor.includes('LENDR') && rctType !== 'RECEIPT') {
        this.displayMessage(`Transaction type "${tranFor}" must have a tran type of "${rctType}"`, "red");
        return;
      }
    });
    try {
      this.receiptsForm.get('rctAmount')!.valueChanges.subscribe(() => {
        this.calculateAmount();
      });

      this.receiptsForm.get('exchRate')!.valueChanges.subscribe(() => {
        this.calculateAmount();
      });

      this.receiptsForm.get('charges')!.valueChanges.subscribe(() => {
        this.calculateAmount();
      });
    } catch (error) {
      // console.error('Error subscribing to value changes:', error);
    }
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    };
  }
  async loadData() {
    const service = this.saleService.GetMasterItemsList({
      ...this.commonParams(),
      item: 'PAYMODE',
      mode:this.receiptsForm.get('mode')?.value
    });
    const service1 = this.saleService.GetMasterItemsList({
      ...this.commonParams(),
      item: 'CURRENCY',
      mode:this.receiptsForm.get('mode')?.value
    });
    const service2 = this.saleService.GetMasterItemsList({
      ...this.commonParams(),
      item: 'BANK',
      mode:this.receiptsForm.get('mode')?.value
    });
    const service3 = this.saleService.GetMasterItemsList({
      ...this.commonParams(),
      item: 'RCTPMT',
      mode:this.receiptsForm.get('mode')?.value
    });
    // this.loader.start();
    this.subSink.sink = await forkJoin([
      service,
      service1,
      service2,
      service3,
    ]).subscribe(
      (results: any[]) => {
        // this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        const res4 = results[3];
        if (res1.status.toUpperCase() === 'SUCCESS') {
          this.payMode = res1.data;
        } else {
          this.displayMessage('Error: Paymode list empty!', 'red');
        }

        if (res2.status.toUpperCase() === 'SUCCESS') {
          this.currency = res2.data;
        } else {
          this.displayMessage('Error: Currency list empty!', 'red');
        }

        if (res3.status.toUpperCase() === 'SUCCESS') {
          this.bank = res3.data;
        } else {
          this.displayMessage('Error: Bank list empty!', 'red');
        }
        if (res4.status.toUpperCase() === 'SUCCESS') {
          this.overHeadsLsit = res4.data;
          this.filteredItemsTranFor = res4.data;
        } else {
          this.displayMessage('Error: Transaction for list empty!', 'red');
        }
        // this.bank = res3.data;
        // this.overHeadsLsit = res4.data;
      },
      (error: any) => {
        this.loader.stop();
        this.toaster.info(error.message, 'Exception');
      }
    );
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.clear();
      this.receiptsForm.controls['mode'].patchValue(event, {
        emitEvent: false,
      });
      this.receiptsForm.controls['receiptNo'].disable();
      this.loadData();
    } else {
      this.receiptsForm.controls['receiptNo'].enable();
      this.receiptsForm.controls['mode'].patchValue(event, {
        emitEvent: false,
      });
    }
  }

  close() {
    this.router.navigateByUrl('/home');
  }
  reset() {
    this.receiptsForm = this.formInit();
    this.displayMessage("", "");
    this.payStatus = '';
  }

  sendSms(mobile: string) {

    if (mobile) {
      const dateObject = new Date(this.responseData.data.receiptDate);
      const receiptMonth = this.datePipe.transform(dateObject, 'MMMM');
      const receiptYear = this.datePipe.transform(dateObject, 'yyyy');
      const messages =
        'Dear ' +
        this.responseData.data.customerName +
        ', We confirm the receipt of rent with RefNo. ' +
        this.responseData.data.receiptNo +
        ' for the month of ' +
        receiptMonth +
        ' ' +
        receiptYear +
        ' with thanks.\nNagaad Properties';
      const body = {
        ...this.commonParams(),
        serviceType: 'SMS',
        MsgType: 'SMS',
        mobile: mobile,
        message: messages,
      };
      this.subSink.sink = this.smsService
        .SendSingleSMS(body)
        .subscribe((res: any) => {
          if (res.status.toUpperCase() === 'SUCCESS') {
            this.toaster.success(res.message, 'SUCCESS');
          } else {
            this.toaster.error(
              'Invalid response format for sending SMS',
              'ERROR'
            );
          }
        });
    } else {
      this.displayMessage('Error: Mobile number not found to send SMS.', 'red');
    }
  }
  onSubmit() {
    if (this.receiptsForm.valid) {
      if (this.supCode) {
        this.recptCls.customer = this.supCode;
      } else {
        this.displayMessage(
          'Error: Select Valid Customer/Tenant/Others!',
          'red'
        );
        return;
      }
      const rctAmountValue = parseFloat(
        this.receiptsForm.controls.rctAmount.value.replace(/,/g, '')
      );
      if (this.receiptsForm.controls['mode'].value.toUpperCase() == 'REVERSE' && this.receiptsForm.controls['tranFor'].value.toUpperCase() != "CASHTRF") {
        this.displayMessage(
          'Error: Reverse  transction is not allowed!',
          'red'
        );
        return;
      }
      if (this.receiptsForm.controls['tranFor'].value.toUpperCase() == '' || this.receiptsForm.controls['tranFor'].value.toUpperCase() == undefined) {
        this.displayMessage(
          'Error: Please select Transction For',
          'Red'
        );
        return;
      }
      if (this.receiptsForm.controls['rctType'].value.toUpperCase() == "RECEIPT" && this.receiptsForm.controls['tranFor'].value.toUpperCase() == "CASHTRF") {
        this.displayMessage(
          'Error: Receipt is not allowed for Cash transfer',
          'red'
        );
        return;
      }

      if (
        this.receiptsForm.controls['rctBank'].value.toUpperCase() == 'CASHBOOK'
      ) {
        this.recptCls.rctAccount =
          this.userDataService.userData.userID.toUpperCase();
      } else {
        if (this.receiptsForm.controls['rctAccount'].value) {
          this.recptCls.rctAccount =
            this.receiptsForm.controls['rctAccount'].value;
        } else {
          this.displayMessage('Error: Select Valid Account!', 'red');
          return;
        }
      }
      const recpynt = this.receiptsForm.controls.rctType.value.toLowerCase();
      if (rctAmountValue <= 0 || isNaN(rctAmountValue)) {
        this.displayMessage(
          'Error: Transaction amount should be greater than Zero(0)!',
          'red'
        );
        this.receiptsForm.controls.rctAmount.setErrors({ invalidAmount: true });
        return;
      }
      if (
        rctAmountValue > this.receiptAmount &&
        this.receiptsForm.controls.tranFor.value.toUpperCase() != 'CASHTRF' && this.receiptsForm.controls.tranFor.value.toUpperCase() != 'BORROW' && this.receiptsForm.controls.tranFor.value.toUpperCase() != 'BORROWR' && this.receiptsForm.controls.tranFor.value.toUpperCase() != 'LEND' && this.receiptsForm.controls.tranFor.value.toUpperCase() != 'LENDR' && this.receiptsForm.controls.tranFor.value.toUpperCase() != 'PAYMENT'
      ) {
        const message = `The payment amount of <b>${rctAmountValue.toLocaleString(
          'en-US',
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}</b>
        exceeds the actual <b>${recpynt}</b> amount of <b>${this.receiptAmount.toLocaleString(
          'en-US',
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}</b>. Are you sure you want to proceed with this payment?`;
        const dialogData = new ConfirmDialogModel(
          `Confirm ${recpynt}?`,
          message
        );
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: '400px',
          height: '210px',
          data: dialogData,
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((dialogResult) => {
          if (dialogResult != true && dialogResult === 'YES') {
            this.submitWithData();
          } else {
            return;
          }
        });
      } else {
        if (
          this.receiptsForm.controls.rctType.value === 'PAYMENT' &&
          this.receiptsForm.controls.rctMode.value === 'CASH'
        ) {
          if (rctAmountValue > this.balanceAmount) {
            this.displayMessage(
              'Error: Transaction amount exceeds balance amount!',
              'red'
            );
            return;
          } else {
            this.submitWithData();
          }
        } else {
          this.submitWithData();
        }
      }
    }
  }
  async submitWithData() {
    this.prepareRecieptCls();
    try {
      this.loader.start();
      this.subSink.sink = await this.saleService
        .UpdateReceiptDetails(this.recptCls)
        .subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === 'SUCCESS') {
            this.receiptsForm.controls['receiptNo'].patchValue(res.tranNoNew);
            this.masterParams.tranNo = res.tranNoNew;
            this.textMessageClass = 'green';
            this.newMsg = res.message;
            if (this.receiptsForm.controls['mode'].value === 'Add') {
              this.modeChange('Modify');
              this.getReceiptDetails(
                this.masterParams,
                this.receiptsForm.get('mode')?.value
              );
            }
            this.getCashBalace();
          } else {
            this.displayMessage('Error: ' + res.message, 'red');
          }
        });
    } catch (ex: any) {
      this.displayMessage('Exception: ' + ex.message, 'red');
    }
  }

  prepareRecieptCls() {
    const formData: ReceiptFormData = this.receiptsForm.value;
    this.recptCls.Mode = formData.mode;
    this.recptCls.RefNo = this.userDataService.userData.sessionID;
    this.recptCls.User = this.userDataService.userData.userID;
    this.recptCls.company = this.userDataService.userData.company;
    this.recptCls.location = this.userDataService.userData.location;
    this.recptCls.langID = this.userDataService.userData.langId;
    this.recptCls.rctType = formData.rctType;
    this.recptCls.currency = formData.currency;
    this.recptCls.custAccount = this.receiptsForm.get('custAccount')?.value;
    this.recptCls.custAccountName = formData.accname;
    this.recptCls.customerBank = this.receiptsForm.get('customerBank')?.value;
    this.recptCls.instrumentNo = formData.instrumentNo;
    this.recptCls.instrumentStatus = formData.instrumentStatus;
    this.recptCls.txnFor = formData.tranFor;

    this.recptCls.rctBank = this.receiptsForm.get('rctBank')?.value;
    this.recptCls.rctMode = formData.rctMode;
    this.recptCls.rctStatus = formData.rctStatus;
    this.recptCls.receiptNo = formData.receiptNo || '';
    this.recptCls.remarks = formData.remarks;
    this.recptCls.paidCurrency = formData.paidCurrency;
    this.recptCls.exchRate = formData.exchRate;
    this.recptCls.charges = formData.charges;
    const paidAmountValue = this.receiptsForm.controls['paidAmt'].value;
    if (paidAmountValue !== null && paidAmountValue !== undefined) {
      const parsedValue = typeof paidAmountValue === 'string' ? paidAmountValue.replace(/,/g, '') : paidAmountValue;
      this.recptCls.paidAmt = Number(parsedValue);
    }
    // if (formData.rctMode.toUpperCase() === 'DEDUCTION') {
    //   this.recptCls.rctAmount = this.recptCls.paidAmt
    // } else {
    const rctAmountValue = this.receiptsForm.controls['rctAmount'].value;
    if (rctAmountValue !== null && rctAmountValue !== undefined) {
      const parsedValue = typeof rctAmountValue === 'string' ? rctAmountValue.replace(/,/g, '') : rctAmountValue;
      this.recptCls.rctAmount = Number(parsedValue);
    }
    // }

    this.recptCls.instrumentDate = this.formatDate(formData.instrumentDate);
    this.recptCls.rctDate = this.formatDate(this.receiptsForm.controls['rctDate'].value);
    this.recptCls.receiptDate = this.formatDate(formData.receiptDate);
  }

  clear() {
    this.displayMessage('', '');
    this.receiptsForm = this.formInit();
    this.selMode = '';
    this.payStatus = '';
    this.fromName = 'From';
    this.toName = 'To';
    this.refreshData();
    this.responseData = [];
    this.allocStatus = '';
    this.filteredItemsClientType = [];
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  async onSearchCilcked() {
    this.selMode = '';
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'RECEIPT',
      TranNo: this.receiptsForm.controls['receiptNo'].value || '',
      Party: '',
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: 'CLOSED',
    };
    this.subSink.sink = await this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != 'FAIL' && res.status.toUpperCase() != 'ERROR') {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.getReceiptDetails(
            this.masterParams,
            this.receiptsForm.get('mode')?.value
          );
        } else {
          this.retMessage = '';
          if (!this.dialogOpen) {
            const dialogRef: MatDialogRef<SearchCashTransferComponent> = this.dialog.open(SearchCashTransferComponent,
              {
                width: '100%',
                disableClose: true,
                data: {
                  tranNum: this.receiptsForm.controls['receiptNo'].value,
                  search: 'Receipt Search',
                  TranType: 'RECEIPT',
                  cashBalance: this.balanceAmount
                },
              });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe((result) => {
              this.dialogOpen = false;
              // console.log(result);
              if (result != true) {
                this.masterParams.tranNo = result;
                this.getReceiptDetails(
                  this.masterParams,
                  this.receiptsForm.get('mode')?.value
                );
              }
            });
          }
        }
      }
      else {
        this.displayMessage("Error: " + res.message, "red");
      }
    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }


  bindDataToForm(res: any) {
    this.filteredpayMode = this.payMode;
    this.filteredStatusList = this.StatusList;
    this.filteredbank = this.bank;
    this.payStatus = res['data'].tranStatus;
    this.allocStatus = res['data'].allocStatus;
    this.supCode = res['data'].customer;

    // console.log(res.data);
    this.receiptsForm.get('receiptmode')?.patchValue(this.receiptmodes[3].itemCode);
    this.receiptsForm.patchValue({
      // receiptmode:this.receiptmodes[3].itemCode,
      rctType: res['data'].rctType,
      receiptNo: res['data'].receiptNo,
      receiptDate: res['data'].receiptDate,
      customer: res['data'].customerName,
      currency: res['data'].currency,
      rctMode: res['data'].rctMode,
      customerBank: res['data'].customerBank,
      custAccount: res['data'].custAccount,
      accname: res['data'].customerName,
      instrumentNo: res['data'].instrumentNo,
      instrumentDate: res['data'].instrumentDate,
      instrumentStatus: res['data'].instrumentStatus,
      rctBank: res['data'].rctBank,
      rctAccount: res['data'].rctAccount,
      rctDate: res['data'].rctDate,
      rctStatus: res['data'].rctStatus,
      rctAmount:
        res['data'].rctAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        }) || 0.0,
      remarks: res['data'].remarks,
      paidAmt:
        res['data'].paidAmt.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        }) || 0.0,
      exchRate:
        res['data'].exchRate.toLocaleString('en-US', {
          minimumFractionDigits: 4,
        }) || 1.0,
      charges:
        res['data'].charges.toLocaleString('en-US', {
          minimumFractionDigits: 2,
        }) || 0.0,
      paidCurrency: res['data'].paidCurrency,
      tranFor: res['data'].txnFor,
    });
    if (this.receiptsForm.get('rctType')?.value === "RECEIPT" && this.receiptsForm.get('tranFor')?.value === "RENTPMT") {
      this.receiptsForm.get('receiptmode')?.patchValue("receiveRent");
    }
    else if (this.receiptsForm.get('rctType')?.value === "PAYMENT" && this.receiptsForm.get('tranFor')?.value === "RENTPMT") {
      this.receiptsForm.get('receiptmode')?.patchValue("payRent");
    }
    else {
      this.receiptsForm.get('receiptmode')?.patchValue("other");
    }
  }
  async getReceiptDetails(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = await this.saleService.GetReceiptDetails(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === 'SUCCESS') {
          this.responseData = res;
          this.bindDataToForm(this.responseData);
          this.onSelectionChangeClientType();
          if (mode != 'View') {
            if (this.receiptsForm.get('sms')?.value) {
              this.sendSms(res.data.mobileNo.replace(/[\s+]/g, ''));
            }
            this.displayMessage('Success: ' + this.newMsg, 'green');
            return;
          } else {
            this.displayMessage('Success: ' + res.message, 'green');
            return;
          }
        } else {
          this.displayMessage('Error: ' + res.message, 'red');
        }
      });
    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage('Exception: ' + ex.message, 'red');
    }
  }
  // SUPPLIES

  async onSearchCustomer() {

    this.displayMessage("", "");
    let clientTypeTemp = '';
    if (this.receiptsForm.controls['receiptmode'].value.toUpperCase() === 'RECEIVERENT') {
      this.Report = 'CLIENTBAL'
      clientTypeTemp = 'TENANT';
    }
    else if (this.receiptsForm.controls['receiptmode'].value.toUpperCase() === 'PAYRENT') {
      this.Report = 'CLIENTBAL'
      clientTypeTemp = 'LANDLORD';
    }
    else if (this.receiptsForm.controls['receiptmode'].value.toUpperCase() === 'utilityReceipt') {
      this.Report = 'UTILBAL'
    }
    else {
      this.Report = 'UTILBAL'
      clientTypeTemp = this.receiptsForm.controls['clientType'].value || 'ALL';
    }
    const body = {
      ...this.commonParams(),
      property: '',
      block: '',
      unit: '',
      Client: this.receiptsForm.controls['customer'].value || '',
      ClientType: clientTypeTemp,
      txnFor: this.receiptsForm.controls['tranFor'].value || '',
      isSummary: true,
      Report: this.Report
    };
    try {
      this.subSink.sink = await this.saleService.GetClientBalances(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === 'SUCCESS') {
          if (res && res.data && res.data.length === 1) {
            if (this.userDataService.userData.userID === res.data[0].clientCode) {
              this.displayMessage("Error: You can't make payment to yourself.", "red");
              return;
            }
            this.receiptsForm.controls['customer'].patchValue(res.data[0].clientName);
            this.supCode = res.data[0].clientCode;
            this.receiptsForm.controls['accname'].patchValue(res.data[0].clientName);
            this.receiptsForm.controls['currency'].patchValue(res.data[0].currency);
            this.receiptsForm.controls['paidCurrency'].patchValue(res.data[0].currency);
            this.receiptAmount = res.data[0].balAmount;
            const balAmount = res.data[0].balAmount;
            const positiveAmount = Math.abs(balAmount).toLocaleString('en-US', { minimumFractionDigits: 2 });

            this.receiptsForm.controls['rctAmount'].patchValue(positiveAmount || '0.00');

          } else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<TenantSearchComponent> = this.dialog.open(TenantSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.receiptsForm.controls['customer'].value,
                  PartyType: this.receiptsForm.controls['clientType'].value.toUpperCase(),
                  search: this.receiptsForm.controls['clientType'].value + ' Search',
                  serData: res.data,
                  searchFor: this.receiptsForm.get('receiptmode')?.value
                },
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe((result) => {
                // console.log(result);
                if (result != true) {
                  if (this.userDataService.userData.userID === result.clientCode) {
                    this.displayMessage("Error: You can't make payment to yourself.", "red");
                    this.dialogOpen = false;
                    return;
                  }
                  this.receiptsForm.controls['customer'].patchValue(result.clientName);
                  if (this.receiptsForm.controls['rctType'].value.toUpperCase() === "PAYMENT") {
                    if (result.balAmount < 0) {
                      const positiveBal = result.balAmount * -1;
                      this.receiptsForm.controls['rctAmount'].patchValue(positiveBal.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);
                    }
                    else {
                      this.receiptsForm.controls['rctAmount'].patchValue(result.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);
                    }
                  } else {
                    this.receiptsForm.controls['rctAmount'].patchValue(result.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);

                  }
                  this.supCode = result.clientCode;
                  this.receiptsForm.controls['accname'].patchValue(result.clientName);
                  this.receiptsForm.controls['paidCurrency'].patchValue(result.currency);
                  this.receiptsForm.controls['currency'].patchValue(result.currency);
                  this.receiptAmount = result.balAmount;
                }
                this.dialogOpen = false;
              });
            }
          }
        } else {
          this.displayMessage('No client balances available for this location!', 'red');
        }
      });
    } catch (ex: any) {
      this.displayMessage('Exception: ' + ex.message, 'red');
    }
  }

  searchAccount() {
    const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent,
      {
        width: '90%',
        disableClose: true,
        data: {
          PartyName: this.receiptsForm.controls['rctBank'].value,
          PartyType: 'ACCOUNT',
          search: 'Account Search',
        },
      }
    );
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((result) => {
      if (result != true) {
        this.receiptsForm.controls['rctAccount'].patchValue(result.code);
        this.tctBankCode = result.code;
      }
      this.dialogOpen = false;
    });
  }
  searchClientAccount() {
    const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent,
      {
        width: '90%',
        disableClose: true,
        data: {
          PartyName: this.receiptsForm.controls['custAccount'].value,
          PartyType: 'ACCOUNT',
          search: 'Client Account Search',
        },
      }
    );
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((result) => {
      this.dialogOpen = false;
      if (result != true) {
        this.receiptsForm.controls['custAccount'].patchValue(result.code);
        this.clientBankCode = result.code;
      }
    });
  }
  tranDateChanged() {
    this.receiptsForm.controls['instrumentDate'].patchValue(
      this.receiptsForm.controls['receiptDate'].value
    );
    this.receiptsForm.controls['rctDate'].patchValue(
      this.receiptsForm.controls['receiptDate'].value
    );
  }
  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Convert the blob to base64
    });
  }
  private isImageFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg');
  }
  // downloadSelectedFile(fileName: string, type: 'user' | 'logo') {
  //   try {
  //     this.subSink.sink = this.fileUploadService.downloadFile(fileName).subscribe({
  //       next: (res: Blob) => {
  //         this.convertBlobToBase64(res)
  //           .then((base64: string) => {
  //             if (this.isImageFile(fileName)) {
  //               if (type === 'user') {
  //                 this.imageBlob = base64;
  //               } else if (type === 'logo') {
  //                 this.logoImageBlob = base64;
  //                 // sessionStorage.setItem('logoImageBlob', base64);
  //                 this.logoService.setLogoPath(base64);

  //               }
  //             } else {
  //               if (type === 'user') {
  //                 this.imageBlob = "assets/img/user.jpg";
  //               } else if (type === 'logo') {
  //                 this.logoImageBlob = "";
  //                 sessionStorage.setItem('logoImageBlob', "");
  //               }
  //             }
  //           })
  //           .catch(() => {
  //             if (type === 'user') {
  //               this.imageBlob = "assets/img/user.jpg";
  //             } else if (type === 'logo') {
  //               this.logoImageBlob = "";
  //               sessionStorage.setItem('logoImageBlob', "");
  //             }
  //           });
  //       },
  //       error: (error) => {
  //         if (type === 'user') {
  //           this.imageBlob = "assets/img/user.jpg";
  //         } else if (type === 'logo') {
  //           this.logoImageBlob = "";
  //           sessionStorage.setItem('logoImageBlob', "");
  //         }
  //       }
  //     });
  //   } catch (ex: any) {
  //     if (type === 'user') {
  //       this.imageBlob = "assets/img/user.jpg";
  //     } else if (type === 'logo') {
  //       this.logoImageBlob = "";
  //       sessionStorage.setItem('logoImageBlob', "");
  //     }
  //   }
  // }
  downloadSelectedFile(fileName: string, type: 'user' | 'logo'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.subSink.sink = this.fileUploadService.downloadFile(fileName).subscribe({
          next: (res: Blob) => {
            this.convertBlobToBase64(res)
              .then((base64: string) => {
                if (this.isImageFile(fileName)) {
                  if (type === 'user') {
                    this.imageBlob = base64;
                    resolve(this.imageBlob);
                  } else if (type === 'logo') {
                    this.logoImageBlob = base64;
                    this.logoService.setLogoPath(base64);
                    resolve(this.logoImageBlob);
                  }
                } else {
                  if (type === 'user') {
                    this.imageBlob = "assets/img/user.jpg";
                    resolve(this.imageBlob);
                  } else if (type === 'logo') {
                    this.logoImageBlob = "";
                    sessionStorage.setItem('logoImageBlob', "");
                    resolve(this.logoImageBlob);
                  }
                }
              })
              .catch(() => {
                if (type === 'user') {
                  this.imageBlob = "assets/img/user.jpg";
                  resolve(this.imageBlob);
                } else if (type === 'logo') {
                  this.logoImageBlob = "";
                  sessionStorage.setItem('logoImageBlob', "");
                  resolve(this.logoImageBlob);
                }
              });
          },
          error: (error) => {
            if (type === 'user') {
              this.imageBlob = "assets/img/user.jpg";
              resolve(this.imageBlob);
            } else if (type === 'logo') {
              this.logoImageBlob = "";
              sessionStorage.setItem('logoImageBlob', "");
              resolve(this.logoImageBlob);
            }
          }
        });
      } catch (ex: any) {
        if (type === 'user') {
          this.imageBlob = "assets/img/user.jpg";
          resolve(this.imageBlob);
        } else if (type === 'logo') {
          this.logoImageBlob = "";
          sessionStorage.setItem('logoImageBlob', "");
          resolve(this.logoImageBlob);
        }
      }
    });
  }

  generatePDF(res: any) {

    let pdf = new jsPDF();
    pdf.setFontSize(14);
    const rightImage = new Image();
    //rightImage.src = 'assets/img/TKGlogo.jpg';
    rightImage.src = this.logoImageBlob;
    const rightImageWidth = 30;
    const rightImageHeight = 20;
    const form = this.receiptsForm
    let finalY = 0;
    rightImage.onload = function () {
      pdf.addImage(
        rightImage,
        'PNG',
        pdf.internal.pageSize.width - rightImageWidth - 10,
        10,
        rightImageWidth,
        rightImageHeight
      );
      const address = res.compAdd1 + ',' + res.compAdd2;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('Helvetica', 'bold');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let textWidth = pdf.getTextWidth(form.controls.rctType.value.toUpperCase());
      let xCoordinate = (pageWidth - textWidth) / 2;
      pdf.text(form.controls.rctType.value.toUpperCase(), xCoordinate, 10);
      const company = res.companyName;
      textWidth = pdf.getTextWidth(company);
      xCoordinate = (pageWidth - textWidth) / 2;
      pdf.text(company, xCoordinate, 20);
      pdf.line(xCoordinate, 22, xCoordinate + textWidth, 22);
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'normal');
      textWidth = pdf.getTextWidth(address);
      xCoordinate = (pageWidth - textWidth) / 2;
      pdf.text(address, xCoordinate, 27);
      pdf.setFont('Helvetica', 'normal');
      textWidth = pdf.getTextWidth(res.compPhone);
      xCoordinate = (pageWidth - textWidth) / 2;
      pdf.text(res.compPhone, xCoordinate, 32);
      pdf.setFont('Helvetica', 'normal');
      //pdf.text(res.compAdd2, 60, 32);
      const amount = res.rctAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const referenceNo = res.tranNo;
      const clientName = res.customerName;
      const currency = res.currency;
      const amountInWords = res.amountInWords;
      const paymentMode = res.rctMode;
      const beignPaymentOf = res.txnFor.toLowerCase() === "rentpmt" ? "Rent Payment" : res.txnFor;
      function formatDate(inputDate: string): string {
        const date = new Date(inputDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }

      const receiptDate = formatDate(res.tranDate);
      const marginFromRight = 50;
      const fontSize = 10;
      const lineHeight = 1;
      const location = res.locationName;
      const propName = res.propName;
      const block = res.blockName;
      const unit = res.unitName;
      const availableWidth = pdf.internal.pageSize.width - marginFromRight;
      let receiptContentLine1 = ""
      function pdfgeneratorWithTable(headers: any, data: any, pdf: jsPDF) {
        if (paymentMode.toUpperCase() !== 'CASH') {
          const clientAccountNo = res.instrumentNo;
          const clientAccountName = res.custAccName;
          const chequeRefNo = res.refNo;
          const accountOf = res.rctBank;
          const receiverAccountNo = res.rctAccount;
          headers.push({ header: "Client Account No", data: `${clientAccountNo}` });
          headers.push({ header: "Client Account Name", data: `${clientAccountName}` });
          headers.push({ header: "Cheque/Ref No", data: `${chequeRefNo}` });
          headers.push({ header: "Account Of", data: `${accountOf}` });
          headers.push({ header: "Account number", data: `${receiverAccountNo}` });
          data.push(clientAccountNo, clientAccountName, chequeRefNo, accountOf, receiverAccountNo);
        }
        const rows = headers.map((item: any, index: number) => [item.header, data[index]]);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const tableWidth = 130;
        const marginD = (pageWidth - tableWidth) / 2;

        autoTable(pdf, {
          body: rows,
          columnStyles: {
            0: { cellWidth: 80, textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
            1: { cellWidth: 80 },
          },
          styles: {
            fontSize: 10,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [211, 211, 211],
            halign: 'center',
          },
          bodyStyles: {
            valign: 'middle',
            halign: 'left',
          },
          margin: { top: 20, left: marginD, right: marginD },
          startY: 70,
        });

        return pdf;
      }
      const exchangeRate = "kes";
      let transctionFor = form.controls.rctType.value.toUpperCase();
      switch (transctionFor) {
        case 'RECEIPT': {
          const headers = [
            { header: 'Currency', data: `${currency}` },
            { header: 'Received From', data: `${clientName}` },
            { header: 'Amount ', data: `${amount}` },
            { header: 'Amount in words', data: `${amountInWords}` },
            { header: 'Being Payment of ', data: `${beignPaymentOf}` },
            { header: 'Balance', data: 0 },
            { header: 'Mode of Payment', data: `${paymentMode}` },

          ];
          const data = headers.map(item => item.data);
          pdf = pdfgeneratorWithTable(headers, data, pdf);
          finalY = (pdf as any).lastAutoTable.finalY || 70;
          const property = `Property: ${propName}\t  Unit: ${unit}`;
          const textWidth = pdf.getTextWidth(property);
          xCoordinate = (pageWidth - textWidth) / 2
          pdf.text(property, xCoordinate, finalY + 10);
        }
          break;
        case 'PAYMENT': {
          const headers = [
            { header: 'Currency', data: `${currency}` },
            { header: 'Paid To', data: `${clientName}` },
            { header: 'Amount ', data: `${amount}` },
            { header: 'Amount in words', data: `${amountInWords}` },
            { header: 'Paid For', data: `${beignPaymentOf}` },
            { header: 'Balance', data: 0 },
            { header: 'Mode of Payment', data: `${paymentMode}` },

          ];
          const data = headers.map(item => item.data);
          pdf = pdfgeneratorWithTable(headers, data, pdf);
          finalY = (pdf as any).lastAutoTable.finalY || 70;
          const property = `Propert: ${location}\t  Unit: ${location}`;
          const textWidth = pdf.getStringUnitWidth(property) * 10;
          const startX = pdf.internal.pageSize.width - textWidth - (-70);
          pdf.text(property, startX, finalY + 10);
        }
          break;
      }

      function drawUnderlinedText(
        label: string,
        value: string,
        x: number,
        y: number,
        textColor: [number, number, number]
      ) {
        const labelWidth =
          (pdf.getStringUnitWidth(label) * fontSize) / pdf.internal.scaleFactor;
        const valueWidth =
          (pdf.getStringUnitWidth(value) * fontSize) / pdf.internal.scaleFactor;
        pdf.text(label, x, y);
        pdf.setTextColor(...textColor);
        if (value !== '') {
          pdf.text(value, x + labelWidth, y);
          pdf.line(
            x + labelWidth,
            y + lineHeight,
            x + labelWidth + valueWidth,
            y + lineHeight
          );
        } else {
          pdf.text(value, x + labelWidth, y);
        }
        pdf.setTextColor(0);
      }

      const lines = pdf.splitTextToSize(receiptContentLine1, availableWidth);
      pdf.setFontSize(10);
      drawUnderlinedText(` ${form.controls.rctType.value.toUpperCase()} No: ${referenceNo} \t\t\t\t\t\t\t\t\t Date:${receiptDate}`, '', 20, 50, [0, 0, 0]); // Adding label
      pdf.setFont('helvetica', 'bold');
      lines.forEach((line: any, index: any) => {
        const yPosition = 60 + index * lineHeight * fontSize;
        drawUnderlinedText('', line, 20, yPosition, [0, 0, 0]); // Drawing each line
      });

      const storedUserData = sessionStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData) as UserData;
        pdf.setFont('Helvetica', 'bold');
        const receiverText = form.controls.rctType.value.toUpperCase() === "RECEIPT" ? 'Reciever' : 'Paid by';
        const takowText = form.controls.rctType.value.toUpperCase() === "RECEIPT" ? `for ${userData.defaultCompanyName}` : `from ${userData.defaultCompanyName}`;
        const user = '(User ' + userData.userID.toUpperCase() + ' )';
        const textWidth = pdf.getStringUnitWidth(receiverText) * 10;
        const startX = pdf.internal.pageSize.width - textWidth - 40; // Adjust for margin
        pdf.text(receiverText, startX, finalY + 18);
        pdf.setFont('Helvetica', 'bold');
        const textWidths = pdf.getTextWidth(receiverText);
        pdf.line(startX, finalY + 20, startX + textWidths, finalY + 20);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(takowText, startX, finalY + 25);
        pdf.setFont('Helvetica', 'normal');
        pdf.text(user, startX, finalY + 30);
      }
      pdf.save(`${clientName} ${form.controls.rctType.value.toUpperCase()}.pdf`);
    };
  }

  //   generatePDF(res: any) {
  //     let pdf = new jsPDF();
  //     pdf.setFontSize(14);

  //     const rightImage = new Image();
  //     rightImage.src = this.logoImageBlob;
  //     const rightImageWidth = 30;
  //     const rightImageHeight = 20;
  //     const form = this.receiptsForm;
  //     let finalY = 0;

  //     rightImage.onload = function () {
  //       // Adding logo image
  //       pdf.addImage(
  //         rightImage,
  //         'PNG',
  //         pdf.internal.pageSize.width - rightImageWidth - 10,
  //         10,
  //         rightImageWidth,
  //         rightImageHeight
  //       );

  //       // Title Header with Background Color
  //       pdf.setFillColor(0, 102, 204); // Dark Blue Background
  //       pdf.rect(0, 10, pdf.internal.pageSize.width, 20, 'F');
  //       pdf.setTextColor(255, 255, 255); // White Text
  //       pdf.setFont('Helvetica', 'bold');
  //       const pageWidth = pdf.internal.pageSize.getWidth();
  //       let textWidth = pdf.getTextWidth(form.controls.rctType.value.toUpperCase());
  //       let xCoordinate = (pageWidth - textWidth) / 2;
  //       pdf.text(form.controls.rctType.value.toUpperCase(), xCoordinate, 25);

  //       // Company Information Section with Underlined Separator
  //       pdf.setTextColor(0, 0, 0); // Black text for body
  //       pdf.setFontSize(12);
  //       const company = res.companyName;
  //       textWidth = pdf.getTextWidth(company);
  //       xCoordinate = (pageWidth - textWidth) / 2;
  //       pdf.text(company, xCoordinate, 40);
  //       pdf.setLineWidth(0.5);
  //       pdf.setDrawColor(0, 102, 204); // Dark Blue underline
  //       pdf.line(xCoordinate, 42, xCoordinate + textWidth, 42);

  //       // Address and Other Details in smaller font
  //       pdf.setFontSize(10);
  //       pdf.text(res.compAdd1 +',', 70, 47);
  //       pdf.text(res.compAdd2, 70, 47);
  //       pdf.text(res.compPhone, 70, 52);
  //       const beignPaymentOf = res.txnFor.toLowerCase() === "renttmt" ? "Rent Payment" : res.txnFor;

  //       // Section for Receipt Information
  //       pdf.setFontSize(11);
  //       pdf.setFont('Helvetica', 'bold');
  //       pdf.setTextColor(0, 102, 204); // Dark Blue for the receipt title
  //       pdf.text(`RECEIPT No: ${res.tranNo}`, 20, 60);
  //       pdf.text(`Date: ${formatDate(res.tranDate)}`, 80, 60);

  //       // Styling Table Content
  //       const headers = [
  //         { header: 'Currency', data: `${res.currency}` },
  //         { header: 'Received From', data: `${res.customerName}` },
  //         { header: 'Amount', data: `${res.rctAmount.toFixed(2)}` },
  //         { header: 'Amount in Words', data: `${res.amountInWords}` },
  //         { header: 'Mode of Payment', data: `${res.rctMode}` },
  //         { header: 'Begin Payment of ', data: `${beignPaymentOf}` },
  //         { header: 'Property', data: `Property: ${res.locationName}` },
  //       ];
  //       const data = headers.map(item => item.data);

  //       // Table with Colored Header and Alternating Row Colors
  //       function pdfgeneratorWithTable(headers: any, data: any, pdf: jsPDF) {
  //         const rows = headers.map((item: any, index: number) => [item.header, data[index]]);
  //         const tableWidth = 140;
  //         const margin = (pageWidth - tableWidth) / 2;

  //         autoTable(pdf, {
  //           body: rows,
  //           columnStyles: {
  //             0: { cellWidth: 80, fontStyle: 'bold' },
  //             1: { cellWidth: 80 },
  //           },
  //           styles: {
  //             fontSize: 10,
  //             cellPadding: 4,
  //           },
  //           headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255] }, // Blue header with white text
  //           bodyStyles: {
  //             textColor: [0, 0, 0],
  //             fillColor: [245, 245, 245], // Light gray alternating row
  //             lineColor: [240, 240, 240], // Light gray row lines
  //           },
  //           alternateRowStyles: { fillColor: [255, 255, 255] }, // White for alternate rows
  //           margin: { top: 65, left: margin, right: margin },
  //           startY: 65,
  //         });
  //       }

  //       // Generate the Table
  //       pdfgeneratorWithTable(headers, data, pdf);

  //       // Footer Section with Receiver Information
  //       finalY = (pdf as any).lastAutoTable.finalY || 70;
  //       pdf.setFontSize(10);
  //       pdf.setTextColor(0, 102, 204); // Dark blue for the footer text
  //       const receiverText = form.controls.rctType.value.toUpperCase() === "RECEIPT" ? 'Receiver' : 'Paid by';
  //       pdf.text(receiverText, 20, finalY + 20);

  //       // Save the PDF
  //       pdf.save(`${res.customerName} ${form.controls.rctType.value.toUpperCase()}.pdf`);
  //     };


  //   // Helper Function to Format Dates
  //   function formatDate(inputDate: string): string {
  //     const date = new Date(inputDate);
  //     const day = String(date.getDate()).padStart(2, '0');
  //     const month = String(date.getMonth() + 1).padStart(2, '0');
  //     const year = date.getFullYear();
  //     return `${day}-${month}-${year}`;
  //   }
  // }


  PayModeChanged() {

    // if (this.receiptsForm.controls['mode'].value.toUpperCase() == 'ADD') {
    if (this.receiptsForm.controls['rctMode'].value.toUpperCase() == 'CASH') {
      this.receiptsForm.controls['custAccount'].patchValue('CASH');
      this.receiptsForm.controls['instrumentNo'].patchValue('NA');
      this.receiptsForm.controls['rctBank'].patchValue('CASHBOOK');
      this.receiptsForm.controls['rctAccount'].patchValue(
        this.userDataService.userData.userID
      );
      this.receiptsForm.controls['customerBank'].patchValue('CASH', {
        emitEvent: false,
      });
      this.receiptsForm.controls['customerBank'].disable();
      this.filteredbank = '';
      this.filteredbank = this.bank.filter(item => item.itemCode === "CASH");
      this.filteredStatusList = "";
      this.filteredStatusList = this.StatusList.filter(item => item.itemCode === "Paid");
      this.receiptsForm.controls['instrumentStatus'].patchValue('Paid');
      // this.receiptsForm.controls['instrumentStatus'].disable();
      this.receiptsForm.controls['rctStatus'].patchValue('Paid');
      // this.receiptsForm.controls['rctStatus'].disable();
    }
    else if (this.receiptsForm.controls['rctMode'].value.toUpperCase() == 'DEDUCTION') {
      this.receiptsForm.controls['customerBank'].patchValue('LOAN');
      this.receiptsForm.controls['rctAccount'].patchValue(this.receiptsForm.controls['customer'].value);
      this.receiptsForm.controls['customerBank'].disable();
      this.receiptsForm.controls['accname'].disable();
      this.receiptsForm.controls['rctAccount'].disable();
      this.receiptsForm.controls['custAccount'].patchValue(this.supCode);
      this.receiptsForm.controls['custAccount'].disable();
      this.receiptsForm.controls['rctBank'].patchValue('RENT');
      this.receiptsForm.controls['rctBank'].disable();
      this.receiptsForm.controls['instrumentNo'].clearValidators();
      this.receiptsForm.controls['instrumentNo'].updateValueAndValidity();
      this.filteredbank = '';
      this.filteredbank = this.bank.filter(item => item.itemCode === "LOAN" || item.itemCode === "RENT");
      this.filteredStatusList = "";
      this.filteredStatusList = this.StatusList.filter(item => item.itemCode === "Cleared");
      this.receiptsForm.controls['instrumentStatus'].patchValue('Cleared');
      // this.receiptsForm.controls['instrumentStatus'].disable();
      this.receiptsForm.controls['rctStatus'].patchValue('Cleared');
      // this.receiptsForm.controls['rctStatus'].disable();
    }
    else if (this.receiptsForm.controls['rctMode'].value.toUpperCase() === 'TRANSFER') {
      this.receiptsForm.controls['rctBank'].enable();
      this.receiptsForm.controls['customerBank'].enable();
      this.receiptsForm.controls['custAccount'].enable();
      this.receiptsForm.controls['instrumentNo'].patchValue('');
      this.receiptsForm.controls['rctAccount'].patchValue('');
      this.receiptsForm.controls['rctBank'].patchValue('');
      this.receiptsForm.controls['customerBank'].patchValue('');
      this.receiptsForm.controls['rctBank'].enable();
      this.filteredbank = '';
      this.filteredbank = this.bank.filter(item => item.itemCode !== "LOAN" && item.itemCode !== "RENT" && item.itemCode !== "CASH");
      this.filteredStatusList = "";
      this.filteredStatusList = this.StatusList;
      this.receiptsForm.controls['instrumentStatus'].patchValue('Select');
      this.receiptsForm.controls['instrumentStatus'].enable();
      this.receiptsForm.controls['rctStatus'].patchValue('Select');
      this.receiptsForm.controls['rctStatus'].enable();
    }
    else {
      this.receiptsForm.controls['rctBank'].enable();
      this.receiptsForm.controls['customerBank'].enable();
      this.receiptsForm.controls['custAccount'].enable();
      this.receiptsForm.controls['instrumentNo'].patchValue('');
      this.receiptsForm.controls['rctAccount'].patchValue('');
      this.receiptsForm.controls['rctBank'].patchValue('');
      this.receiptsForm.controls['rctBank'].enable();
      this.filteredbank = '';
      this.filteredbank = this.bank;
      this.filteredStatusList = "";
      this.filteredStatusList = this.StatusList;
    }
  }
  // }

  RctBankChanged() {
    if (
      this.receiptsForm.controls['rctBank'].value.toUpperCase() == 'CASHBOOK' ||
      this.receiptsForm.controls['rctBank'].value.toUpperCase() == 'CASH'
    ) {
      this.receiptsForm.controls['rctAccount'].patchValue(
        this.userDataService.userData.userID.toUpperCase()
      );
    } else {
      this.receiptsForm.controls['rctAccount'].patchValue('');
      // this.receiptsForm.controls['rctAccount'].enable();
    }
  }

  downloadPDF() {

    // if (this.responseData) {
    //   body{

    //   }
    //   this.generatePDF(this.responseData);
    // }
    const body = {
      ...this.commonParams(),
      tranNo: this.receiptsForm.controls['receiptNo'].value,
    };
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.getDetailsPdf(body).subscribe((result: any) => {
        this.loader.stop();
        if (result.status.toUpperCase() === "SUCCESS") {

          this.generatePDF(result.data);
          this.retMessage = result.message;
          this.textMessageClass = 'green';
        }
        else {
          this.retMessage = result.message;
          this.textMessageClass = 'red'
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red'
    }
  }

  onDetailsCilcked() {
    const dialogRef: MatDialogRef<ReceiptDetailsComponent> = this.dialog.open(
      ReceiptDetailsComponent,
      {
        width: '90%',
        disableClose: true,
        data: {
          tranNo: this.receiptsForm.controls['receiptNo'].value,
          mode: this.receiptsForm.controls['mode'].value,
        },
      }
    );
    this.dialogOpen = true;
    dialogRef.afterClosed().subscribe((result) => {
      this.dialogOpen = false;
    });
  }
  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(
      FileUploadComponent,
      {
        width: '90%', // Set the width of the dialog
        disableClose: true,
        data: {
          mode: this.receiptsForm.controls['mode'].value,
          tranNo: this.receiptsForm.controls['receiptNo'].value,
          search: 'Receipt Docs',
          tranType: 'RECEIPT',
        },
      }
    );
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(
      AppHelpComponent,
      {
        disableClose: true,
        data: {
          ScrId: 'ST210',
          SlNo: 0,
          IsPrevious: false,
          IsNext: false,
          User: this.userDataService.userData.userID,
          RefNo: this.userDataService.userData.sessionID,
        },
      }
    );
  }

  NotesDetails(tranNo: string) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(
      NotesComponent,
      {
        width: '90%',
        disableClose: true,
        data: {
          tranNo: tranNo,
          mode: this.receiptsForm.controls['mode'].value,
          note: this.receiptsForm.controls['remarks'].value,
          TranType: 'RECEIPT',
          search: 'Receipt Notes',
        },
      }
    );
  }
}
