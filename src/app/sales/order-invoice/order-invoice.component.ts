import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderInvoiceDetailsComponent } from './order-invoice-details/order-invoice-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { getPayload, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { UserDataService } from 'src/app/Services/user-data.service';
import { DatePipe } from '@angular/common';
import { SalesService } from 'src/app/Services/sales.service';
import { OrderInvoiceHeader } from '../sales.class';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Router } from '@angular/router';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Mode, TextClr } from 'src/app/utils/enums';

@Component({
  selector: 'app-order-invoice',
  templateUrl: './order-invoice.component.html',
  styleUrls: ['./order-invoice.component.css']
})
export class OrderInvoiceComponent implements OnInit, OnDestroy {
  tranStatus!: string;
  totalAmt: number = 0;
  newTranMsg!: string;
  CustLPONo!: number;
  amt: number = 0;
  Currency!: string;
  CurrencyName!: string;
  payTerms!: string;
  payTermDesc!: string;
  billTo!:string
  Charge: number = 0;
  vatAmt: number = 0;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  orderInvoiceForm!: FormGroup;
  modeIndex!: string;
  dialogOpen = false;
  private subSink!: SubSink;
  ordInvHdrCls: OrderInvoiceHeader = new OrderInvoiceHeader();
  modes!: any[];
  custCode: string = "";
  salesExecCode: string='';

  amountExclVat: string='';
  vatAmount: string='';
  totalAmount: string='';
  itemCount: string='';
  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private masterService: MastersService,
    private datePipe: DatePipe,
    protected salesService: SalesService,
    private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    protected saleService: SalesService,
    protected router: Router,
    private utlService: UtilitiesService) {
    this.orderInvoiceForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      invoiceNo: [''],
      customerLopNo: [''],
      invoiceDate: [new Date(), [Validators.required]],
      // payTerms: [''],
      saleNo: [''],
      currency: [''],
      customer: [''],
      exchangeRate: ['1.0000'],
      billTo: [''],
      applyVat: [false],
      notes: [''],

    })
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  modeChange(event: string) {

  }

  onSubmit() {
    if (this.orderInvoiceForm.invalid) {
      return;
    }
    else {

    }

  }

  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST204',
    };
    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      this.subSink.sink = forkJoin([service1]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          this.modes = res1.data;
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

  getOrderInvoiceData(masterparm: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.salesService.getOrderInvoiceHdr(masterparm).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          const formData = res['data'];
          const form = this.orderInvoiceForm;
          const ordInvCls = this.ordInvHdrCls;
          form.patchValue({
            tranDate: formData.tranDate,
            billTo: formData.billToDes,
            customer: formData.customerName,
            saleNo: formData.saleNo,
            exchangeRate: formData.exchRate?.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            payTerm: formData.payTerm,
            lopNo: formData.customerLopNo,
            applyVAT: formData.applyVAT,
            amount: formData.amount,
            Charge: formData.charges,
            currency: formData.currency,
            VAtAmount: formData.VAtAmount,
            TotalAmount: formData.TotalAmount,
            Status: formData.Status,
            notes: formData.remarks
          });
          this.Charge = formData.charge || 0;
          this.vatAmt = formData.vatAmount || 0;
          this.totalAmt = formData.totalAmount || 0;
          this.CustLPONo = formData.customerLopNo || 0;
          this.payTerms = formData.PayTerm || 0;
          this.Currency = formData.currency || 0;
          this.tranStatus = formData.tranStatus;
          if (mode != "View" && this.newTranMsg != "") {
            this.textMessageClass = 'green';
            this.retMessage = this.newTranMsg;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      })
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  searchSaleNo() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: "SALEORDER",
      TranNo: "",
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.orderInvoiceForm.get("tranNo")!.patchValue(res.data.selTranNo);
            this.getSaleOrderHeader(res.data.selTranNo, 'View');
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.orderInvoiceForm.get("saleNo")!.value, 'TranType': "SALEORDER", 'search': 'Sale order Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  console.log(result)
                  this.orderInvoiceForm.get("saleNo")!.patchValue(result);

                  this.getSaleOrderHeader(result, "View");
                }
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  getSaleOrderHeader(tranNo:string,mode:string){
const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetSaleOrderHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.orderInvoiceForm.patchValue({
          quotationNo: res.data.quotationNo,
          tranDate: res.data.tranDate,
          customer: res.data.customerName,
          notes: res.data.remarks,
          pricing: res.data.pricing,
          schedule: res.data.scheduleType,
          payTerm: res.data.payTerm,
          salesRep: res.data.salesExecName,
          billTo: res.data.billToDesc,
          shipTo: res.data.shipToDesc,
          currency: res.data.currency,
          exchangeRate: res.data.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
          applyVat: res.data.applyVAT,
        }, { emitEvent: false });
        this.CurrencyName= res.data.currencyName,
        this.Currency=res.data.currency;
        this.salesExecCode = res.data.salesExec;
        this.custCode = res.data.customer;
        this.billTo=res.data.billto
        this.CustLPONo=res.data.custRef
        this.payTerms=res.data.payTerm
        this.payTermDesc=res.data.payTermDesc
        // this.tranStatus = res.data.tranStatus;
        this.amountExclVat = res.data.tranAmount;
        this.vatAmount = res.data.vatAmount;
        this.totalAmount = res.data.totalAmount;
        this.itemCount = res.data.itemCount;
        if (mode.toUpperCase() != Mode.view && this.newTranMsg != "") {
          this.displayMessage(displayMsg.SUCCESS + this.newTranMsg, TextClr.green);
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      }
      else {
        this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
      }
    })
  }
  displayMessage(arg0: string, green: any) {
    throw new Error('Method not implemented.');
  }

  searchData() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'ORDINV',
      TranNo: this.orderInvoiceForm.get('invoiceNo')!.value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    console.log(body);
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.orderInvoiceForm.get('invoiceNo')?.patchValue(res.data.selTranNo);
            this.getOrderInvoiceData(this.masterParams, this.orderInvoiceForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              this.dialogOpen = true;
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.orderInvoiceForm.get('invoiceNo')!.value, 'TranType': "ORDINV",
                  'search': 'Order Invoice Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.orderInvoiceForm.get("invoiceNo")!.patchValue(result);
                  this.masterParams.tranNo = result;
                  this.getOrderInvoiceData(this.masterParams, this.orderInvoiceForm.get('mode')?.value);
                }
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }


  onDetailsCilcked(invoiceNo: any) {
    const dialogRef: MatDialogRef<OrderInvoiceDetailsComponent> = this.dialog.open(OrderInvoiceDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: invoiceNo
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  billToSearch(itemType: string) {
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.orderInvoiceForm.get('customer')!.value,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.orderInvoiceForm.get('billTo')!.patchValue(res.data.selName);
            this.ordInvHdrCls.BillTo = res.data.selCode;

          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.orderInvoiceForm.controls['invoiceNo'].value, 'PartyType': itemType,
                  'search': itemType + ' Search', 'PartyName': ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.orderInvoiceForm.get('billTo')!.patchValue(result.partyName);
                this.ordInvHdrCls.BillTo = result.code;
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  Close() {
    this.router.navigateByUrl('/home');

  }
  reset() {
    // this.orderInvoiceForm.reset();
    this.orderInvoiceForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
  }
  searchCustomer() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      PartyName: this.orderInvoiceForm.controls['customer'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.orderInvoiceForm.get('customer')!.patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.orderInvoiceForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.orderInvoiceForm.get('customer')!.patchValue(result.partyName);
                this.custCode = result.code;
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
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
        ScrId: "ST205",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
