import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SalesService } from 'src/app/Services/sales.service';
import { DirectInvoiceDetailsComponent } from './direct-invoice-details/direct-invoice-details.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { QuotationHdrCls } from '../sales.class';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';

@Component({
  selector: 'app-direct-invoice',
  templateUrl: './direct-invoice.component.html',
  styleUrls: ['./direct-invoice.component.css']
})

export class DirectInvoiceComponent implements OnInit, OnDestroy {
  saleForm!: FormGroup;
  title: string = "Direct Invoice";
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  amountExclVat: number = 0;
  charges: number = 0;
  vatAmount: number = 0;
  totalAmount: number = 0;
  totalWeight: number = 0;
  tranStatus: string = "";
  modes: Item[] = [];
  payTermList: Item[] = [];
  currencyList: Item[] = [];
  billToList: Item[] = [{ itemCode: "1", itemName: "1" },
  { itemCode: "2", itemName: "2" },
  { itemCode: "3", itemName: "3" }
  ];
  shipToList: Item[] = [{ itemCode: "1", itemName: "1" },
  { itemCode: "2", itemName: "2" },
  { itemCode: "3", itemName: "3" }];
  deliveryMethodList: Item[] = [{ itemCode: "byRoad", itemName: "By Road" }];
  custCode: string = "";
  salesExecCode: string = "";
  dialogOpen = false;
  exchRate: number = 0;
  retMessage: string = "";
  textMessageClass: string = "";
  masterParams!: MasterParams;
  invoiceHdrCls: QuotationHdrCls = new QuotationHdrCls();
  private subSink: SubSink;
  newTranMsg: string = "";

  constructor(private fb: FormBuilder, private pdfService: PdfReportsService,
    public dialog: MatDialog, private userDataService: UserDataService, private masterService: MastersService,
    private utlService: UtilitiesService, protected saleService: SalesService, private loader: NgxUiLoaderService,
    protected router: Router, private datePipe: DatePipe) {
    this.saleForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      notes: [''],
      pricing: [{ value: '0.00', disabled: true }],
      shipTo: [''],
      payTerm: [''],
      salesRep: ['', [Validators.required, Validators.maxLength(50)]],
      lopNo: ['', [Validators.required, Validators.maxLength(18)]],
      deliveryMethod: [''],
      deliveryNo: [''],
      transporter: [''],
      truckNo: [''],
      driverName: [''],
      driverId: [''],
      billTo: [''],
      currency: [''],
      exchangeRate: ['1.0000'],
      applyVAT: [false],
      issueStcok: [false]
    });
  }

  onDetailsCilcked(invoiceNo: any) {
    const dialogRef: MatDialogRef<DirectInvoiceDetailsComponent> = this.dialog.open(DirectInvoiceDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': "DIRINV", 'tranNo': this.saleForm.controls['tranNo'].value, 'search': "Direct Invoice Details",
        'mode': this.saleForm.controls['mode'].value, 'status': this.tranStatus
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
      }
    });
  }

  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.tranType = "DIRINV";
    this.loadData();
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
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST206',
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY",
      mode:this.saleForm.get('mode')?.value
    };
    const payTerm = {
      ...this.commonParams(),
      Item: "PAYTERM",
      mode:this.saleForm.get('mode')?.value
    };
    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(curbody);
      const service3 = this.masterService.GetMasterItemsList(payTerm);
      this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          this.modes = res1.data;
          this.currencyList = res2.data;
          this.payTermList = res3.data;
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

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  reset() {
    this.saleForm.reset()
    this.saleForm = this.formInit();
    this.custCode = "";
    this.salesExecCode = "";
    this.clearMsg();
  }
  prepareHederData() {
    const formValues = this.saleForm.value;
    this.invoiceHdrCls.Company = this.userDataService.userData.company;
    this.invoiceHdrCls.Location = this.userDataService.userData.location;
    this.invoiceHdrCls.LangID = this.userDataService.userData.langId;
    this.invoiceHdrCls.refNo = this.userDataService.userData.sessionID;
    this.invoiceHdrCls.user = this.userDataService.userData.userID;
    this.invoiceHdrCls.ApplyVAT = formValues.applyVAT;
    this.invoiceHdrCls.Currency = formValues.currency;
    this.invoiceHdrCls.Customer = this.custCode;
    this.invoiceHdrCls.InvType = "DIRINV";
    this.invoiceHdrCls.ExchRate = formValues.exchangeRate;
    this.invoiceHdrCls.PayTerm = formValues.payTerm;
    this.invoiceHdrCls.Remarks = formValues.notes;
    this.invoiceHdrCls.Mode = formValues.mode;
    this.invoiceHdrCls.LPONo = formValues.lopNo;
    this.invoiceHdrCls.SalesRep = this.salesExecCode;
    this.invoiceHdrCls.ScrId = "ST206A";
    this.invoiceHdrCls.DriverID = formValues.driverId;
    this.invoiceHdrCls.DriverName = formValues.driverName;
    this.invoiceHdrCls.TruckNo = formValues.truckNo;
    this.invoiceHdrCls.IssueStock = formValues.issueStcok;
    this.invoiceHdrCls.Transporter = formValues.transporter;
    this.invoiceHdrCls.DelMethod = formValues.deliveryMethod;
    this.invoiceHdrCls.DelNo = formValues.deliveryNo;
    const transformedDate = this.datePipe.transform(formValues.tranDate, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.invoiceHdrCls.TranDate = transformedDate.toString();
    } else {
      this.invoiceHdrCls.TranDate = ''; // or any default value you prefer
    }
    this.invoiceHdrCls.TranNo = formValues.tranNo || "";


  }
  onSubmit() {
    this.clearMsg();
    if (this.saleForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareHederData();
        this.subSink.sink = this.saleService.updateInvoiceHdr(this.invoiceHdrCls).subscribe((res: SaveApiResponse) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.newTranMsg = res.message;
            this.modeChange('Modify');
            this.saleForm.get('tranNo')!.patchValue(res.tranNoNew);
            this.masterParams.tranNo = res.tranNoNew;

            this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        })
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }

    }
  }

  searchData() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'DIRINV',
      TranNo: this.saleForm.get('tranNo')!.value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.saleForm.get("tranNo")!.patchValue(res.data.selTranNo);
            this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              this.dialogOpen = true;
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.saleForm.get('tranNo')!.value, 'TranType': "DIRINV",
                  'search': 'Sale Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.saleForm.get("tranNo")!.patchValue(result);
                  this.masterParams.tranNo = result;
                  this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
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
  invoiceReport() {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.saleForm.get('tranNo')?.value,
      tranType: "DIRINV"
    }
    this.subSink.sink = this.saleService.GetInvoiceReport(body).subscribe((res: any) => {
      console.log(res);
      if (res.status.toUpperCase() === "SUCCESS") {
        this.pdfService.generateInvoicePDF(res.data, "Direct Invoice", new Date(), "PDF")
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.saleForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleForm.get('tranNo')!.patchValue('');
      this.saleForm.get('tranNo')!.disable();
      this.saleForm.get('tranNo')!.clearValidators();
      this.loadData();
    }
    else {
      this.saleForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleForm.get('tranNo')!.enable();
    }
  }

  saleData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.saleService.getInvoiceHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          const formData = res['data'];
          const form = this.saleForm;
          const invoiceHdrCls = this.invoiceHdrCls;
          form.patchValue({
            tranDate: formData.tranDate,
            billTo: formData.billToDes,
            shipTo: formData.shipToDesc,
            customer: formData.customerName,
            payTerm: formData.payTerm,
            currency: formData.currency,
            exchangeRate: formData.exchRate?.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            salesRep: formData.salesRepName,
            lopNo: formData.lpoNo,
            applyVAT: formData.applyVAT,
            issueStcok: formData.issueStock,
            deliveryMethod: formData.delMethod,
            deliveryNo: formData.delNo,
            transporter: formData.transporter,
            truckNo: formData.truckNo,
            driverName: formData.driverName,
            driverId: formData.driverID,
            notes: formData.remarks
          });
          this.amountExclVat = formData.tranAmount || 0;
          this.charges = formData.charges || 0;
          this.vatAmount = formData.vatAmount || 0;
          this.totalAmount = formData.totalAmount || 0;
          this.totalWeight = formData.totalWeight || 0;
          invoiceHdrCls.BillTo = formData.billTo;
          invoiceHdrCls.ShipTo = formData.shipTo;
          this.custCode = formData.customer;
          this.salesExecCode = formData.salesRep;
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

  handleCustomerChange() {
    this.onCustomerSearch();
  }

  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      PartyName: this.saleForm.controls['customer'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.get('customer')!.patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.saleForm.get('customer')!.patchValue(result.partyName);
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

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      PartyName: this.saleForm.get('salesRep')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.controls['salesRep'].patchValue(res.data.selName);
            this.salesExecCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleForm.get('salesRep')!.value, 'PartyType': "Employee",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.saleForm.controls['salesRep'].patchValue(result.partyName);
                this.salesExecCode = result.code;
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
  billToSearch(itemType: string) {
    let controlValue: string;
    if (itemType == 'SHIPTO') {
      controlValue = this.saleForm.get('shipTo')!.value
    }
    else {
      controlValue = this.saleForm.get('billTo')!.value
    }
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.saleForm.get('customer')!.value,
      ItemFirstLevel: controlValue,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            if (itemType == 'SHIPTO') {
              this.saleForm.get('shipTo')!.patchValue(res.data.selName);
              this.invoiceHdrCls.ShipTo = res.data.selCode;
              this.invoiceHdrCls.shipToDesc = res.data.selName;
            }
            else {
              this.saleForm.get('billTo')!.patchValue(res.data.selName);
              this.invoiceHdrCls.BillTo = res.data.selCode;
              this.invoiceHdrCls.billToDes = res.data.selName;

            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.saleForm.controls['customer'].value, 'PartyType': itemType,
                  'search': itemType + ' Search', 'PartyName': ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (itemType == 'SHIPTO') {
                  this.saleForm.get('shipTo')!.patchValue(result.partyName);
                  this.invoiceHdrCls.ShipTo = result.code;
                  this.invoiceHdrCls.shipToDesc = result.partyName;
                }
                else {
                  this.saleForm.get('billTo')!.patchValue(result.partyName);
                  this.invoiceHdrCls.BillTo = result.code;
                  this.invoiceHdrCls.billToDes = result.partyName;
                }
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
  clear() {
    this.saleForm = this.formInit();
    this.tranStatus = "";
    this.totalAmount = 0;
    this.amountExclVat = 0;
    this.vatAmount = 0;
    this.charges = 0;
    this.totalWeight = 0;
    this.clearMsg();
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.saleForm.get('mode')!.value, tranNo: this.saleForm.get('tranNo')!.value,
        search: 'Direct Invoice Docs', tranType: "DIRINV"
      }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST206",
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
