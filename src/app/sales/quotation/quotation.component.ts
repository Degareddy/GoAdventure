import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuatationDetailsComponent } from './quatation-details/quatation-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { DatePipe } from '@angular/common';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SalesService } from 'src/app/Services/sales.service';
import { saleQuotationHdrCls } from '../sales.class';
import { InventoryService } from 'src/app/Services/inventory.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';

@Component({
  selector: 'app-quotation',
  templateUrl: './quotation.component.html',
  styleUrls: ['./quotation.component.css']
})
export class QuotationComponent implements OnInit, OnDestroy {
  quotationForm!: FormGroup;
  title: string = "Quotation";
  private subSink!: SubSink;
  retMessage: string = "";
  retNum!: number;
  textMessageClass: string = "";
  modeIndex!: number;
  masterParams!: MasterParams;
  modes: Item[] = [];
  currencyList: Item[] = [];
  payTermList: Item[] = [];
  tranStatus: string = "";
  amountExclVat: number = 0;
  vatAmount: number = 0;
  totalAmount: number = 0;
  billList: Item[] = [];
  itemCount!: number;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  public dialogOpen: boolean = false;
  public qtnCls!: saleQuotationHdrCls;
  salesExecCode: string = "";
  custCode: string = "";
  newTranMsg: string = "";

  constructor(private fb: FormBuilder,
    public dialog: MatDialog, protected purchreqservice: PurchaseService, private userDataService: UserDataService,
    protected router: Router, private invService: InventoryService, private pdfService: PdfReportsService,
    protected salesServices: SalesService,
    private loader: NgxUiLoaderService,
    private datePipe: DatePipe,
    private utlService: UtilitiesService) {
    this.quotationForm = this.formInit();
    this.qtnCls = new saleQuotationHdrCls();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }

  modeChange(event: string) {
    if (event === "Add") {
      this.clear();
      this.quotationForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.quotationForm.get('tranNo')!.patchValue('');
      this.quotationForm.get('tranNo')!.disable();
      this.loadData();
    }
    else {
      this.quotationForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.quotationForm.get('tranNo')!.enable();
    }
  }
  onDetailsCilcked(quotationNo: any) {
    const dialogRef: MatDialogRef<QuatationDetailsComponent> = this.dialog.open(QuatationDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        mode: this.quotationForm.get('mode')!.value, tranNo: this.quotationForm.get('tranNo')!.value,
        'status': this.tranStatus,
        search: 'Quotation Details', tranType: "QUOTATION"
      }

    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered) {
        this.masterParams.tranNo = this.quotationForm.get('tranNo')!.value;
        this.quotationData(this.masterParams, this.quotationForm.get('mode')!.value)
      }
    });
  }
  billToSearch(itemType: string) {
    let controlValue: string;
    controlValue = this.quotationForm.get('addressNo')!.value
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.quotationForm.get('customer')!.value,
      ItemFirstLevel: controlValue,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.quotationForm.get('addressNo')!.patchValue(res.data.selName);
            this.qtnCls.BillTo = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.quotationForm.controls['customer'].value, 'PartyType': itemType,
                  'search': itemType + ' Search', 'PartyName': ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {

                this.quotationForm.get('addressNo')!.patchValue(result.partyName);
                this.qtnCls.BillTo = result.code;
                // this.invoiceHdrCls.billToDes = result.partyName;
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
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
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
      item: 'ST202'
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY",
      mode:this.quotationForm.get('mode')!.value

    };
    const payTerm: getPayload = {
      ...this.commonParams(),
      item: "PAYTERM",
      mode:this.quotationForm.get('mode')!.value
    };
    const service1 = this.invService.getModesList(modebody);
    const service2 = this.invService.GetMasterItemsList(curbody);
    const service3 = this.invService.GetMasterItemsList(payTerm);
    this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.modes = res1.data;
        }
        else {
          this.displayMessage("Error: Modes list empty!", "red");
          return;
        }
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.currencyList = res2.data;
        }
        else {
          this.displayMessage("Error: Currency list empty!", "red");
          return;
        }
        if (res3.status.toUpperCase() === "SUCCESS") {
          this.payTermList = res3.data;
        }
        else {
          this.displayMessage("Error: Payterm list empty!", "red");
          return;
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage("Error: " + error.message, "red");
      }
    );
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  ngOnInit() {
    this.loadData();
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  onSearchCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'QUOTATION',
      TranNo: this.quotationForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;

            this.quotationForm.get('tranNo')?.patchValue(res.data.selTranNo);
            this.quotationData(this.masterParams, this.quotationForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.quotationForm.get('tranNo')!.value, 'TranType': "QUOTATION",
                  'search': 'Quotation Search'
                }
              });
              // this.tranStatus = "";
              // this.quotationForm = this.formInit();
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.masterParams.tranNo = result;

                  this.quotationForm.get('tranNo')?.patchValue(result);
                  try {
                    this.quotationData(this.masterParams, this.quotationForm.get('mode')?.value);
                  }
                  catch (ex: any) {
                    this.retMessage = "Exception " + ex.message;
                    this.textMessageClass = 'red';
                  }
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
  quotationData(supp: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.salesServices.getQtnHeaderData(supp).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.quotationForm.controls['revisionNo'].patchValue(res['data'].revisionNo);
          this.quotationForm.controls['quoteDate'].patchValue(res['data'].tranDate);
          this.quotationForm.controls['validForDays'].patchValue(res['data'].validDays);
          this.quotationForm.controls['customer'].patchValue(res['data'].customerName);
          this.quotationForm.controls['currency'].patchValue(res['data'].currency);
          this.quotationForm.controls['payTerm'].patchValue(res['data'].payTerm);
          this.quotationForm.controls['salesExec'].patchValue(res['data'].salesExecName);
          this.salesExecCode = res['data'].salesExec;
          this.custCode = res['data'].customer;
          this.tranStatus = res['data'].tranStatus;
          this.qtnCls.BillTo = res['data'].billTo;
          this.quotationForm.controls['custRef'].patchValue(res['data'].custRef);
          this.quotationForm.controls['applyVat'].patchValue(res['data'].applyVAT);
          this.quotationForm.controls['remarks'].patchValue(res['data'].remarks);
          this.quotationForm.controls['addressNo'].patchValue(res['data'].billToDesc);
          this.amountExclVat = res['data'].tranAmount;
          this.vatAmount = res['data'].vatAmount;
          this.totalAmount = res['data'].totalAmount;
          this.itemCount = res['data'].itemCount;
          if (mode != "View" && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
            this.textMessageClass = "green";
          }
          else {
            this.displayMessage("Success: Retriving data " + res.message + " has completed", "green");
          }

        } else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      PartyName: this.quotationForm.controls['customer'].value || ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.quotationForm.get('customer')!.patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.quotationForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != true){
                  this.quotationForm.get('customer')!.patchValue(result.partyName);
                  this.custCode = result.code;
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      PartyName: this.quotationForm.get('salesExec')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.quotationForm.controls['salesExec'].patchValue(res.data.selName);
            this.salesExecCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.quotationForm.get('salesExec')!.value, 'PartyType': "Employee",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != true){
                  this.quotationForm.controls['salesExec'].patchValue(result.partyName);
                  this.salesExecCode = result.code;
                }
                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  clearMsgs() {
    this.textMessageClass = "";
    this.retMessage = "";
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      salesExec: ['', [Validators.required]],
      quoteDate: [new Date(), [Validators.required]],
      addressNo: ['', Validators.required],
      revisionNo: [1, [Validators.required]],
      validForDays: [7, [Validators.required]],
      customer: ['', [Validators.required]],
      currency: ['', [Validators.required]],
      payTerm: ['', [Validators.required]],
      custRef: ['', [Validators.required]],
      applyVat: [false],
      exchangeRate: ['1.0000', [Validators.required]],
      remarks: [''],
    });
  }
  prepareHeaderCls() {
    this.qtnCls.Company = this.userDataService.userData.company;
    this.qtnCls.Location = this.userDataService.userData.location;
    this.qtnCls.User = this.userDataService.userData.userID;
    this.qtnCls.LangId = this.userDataService.userData.langId;
    this.qtnCls.RefNo = this.userDataService.userData.sessionID;
    this.qtnCls.ScrId = "ST202";
    this.qtnCls.Mode = this.quotationForm.get('mode')?.value;
    this.qtnCls.TranNo = this.quotationForm.get('tranNo')?.value;
    this.qtnCls.SalesExec = this.salesExecCode;
    const transformedDate = this.datePipe.transform(this.quotationForm.controls['quoteDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.qtnCls.TranDate = transformedDate.toString();
    } else {
      this.qtnCls.TranDate = ''; // or any default value you prefer
    }
    // this.qtnCls.BillTo = this.quotationForm.get('addressNo')?.value;
    this.qtnCls.RevisionNo = this.quotationForm.get('revisionNo')?.value;
    this.qtnCls.ValidDays = this.quotationForm.get('validForDays')?.value;
    this.qtnCls.Customer = this.custCode;
    this.qtnCls.Currency = this.quotationForm.get('currency')?.value;
    this.qtnCls.PayTerm = this.quotationForm.get('payTerm')?.value;
    this.qtnCls.CustRef = this.quotationForm.get('custRef')?.value;

    this.qtnCls.ApplyVAT = this.quotationForm.get('applyVat')?.value;
    this.qtnCls.ExchRate = this.quotationForm.get('exchangeRate')?.value;
    this.qtnCls.Remarks = this.quotationForm.get('remarks')?.value;
    this.qtnCls.TranStatus = "ANY";
  }
  onSubmit() {
    this.clearMsgs();
    if (this.quotationForm.invalid) {
      this.textMessageClass = "red";
      this.retMessage = "Enter all manadatory fields";
      return;
    }
    else {
      if (this.custCode === "") {
        this.textMessageClass = "red";
        this.retMessage = "Select Customer!";
        return
      }
      if (this.salesExecCode === "") {
        this.textMessageClass = "red";
        this.retMessage = "Select Executive!";
        return
      }
      this.prepareHeaderCls();
      this.loader.start();
      this.subSink.sink = this.salesServices.UpdateQuotation(this.qtnCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          if (this.quotationForm.get('mode')?.value === "Add") {
            this.modeChange('Modify');

          }
          this.quotationForm.get('tranNo')?.patchValue(res.tranNoNew);
          this.newTranMsg = res.message;
          this.masterParams.tranNo = res.tranNoNew;

          this.quotationData(this.masterParams, this.quotationForm.get('mode')?.value)
        }
        else {
       this.displayMessage("Error: " + res.message, "red");
        }


      })
    }

  }
  quotationreports() {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.quotationForm.get('tranNo')!.value
    }
    this.subSink.sink = this.salesServices.GetQuotationReport(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.pdfService.generateQuotationPDF(res['data'], "Quotation", new Date(), "PDF");
      }
      else {
        this.displayMessage("Error: " + res.message, "red");
      }
    });
  }
  Close() {
    this.router.navigateByUrl('/home');
  }

  reset() {
    this.quotationForm = this.formInit();
    this.tranStatus = "";
    this.totalAmount = 0;
    this.amountExclVat = 0;
    this.vatAmount = 0
    this.custCode = "";
    this.salesExecCode = ""
    this.clearMsgs();
  }

  clear() {
    this.quotationForm = this.formInit();
    this.tranStatus = "";
    this.totalAmount = 0;
    this.amountExclVat = 0;
    this.vatAmount = 0
    this.custCode = "";
    this.salesExecCode = ""
    this.clearMsgs();
  }
  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.quotationForm.controls['mode'].value, tranNo: this.quotationForm.controls['tranNo'].value, search: 'Quotation Docs', tranType: "QUOTATION" }
    });

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST202",
        // Page: "User Registration",
        // SlNo: 6,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
