import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { MastersService } from 'src/app/Services/masters.service';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { SaleOrderDetailsComponent } from './sale-order-details/sale-order-details.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { InventoryService } from 'src/app/Services/inventory.service';
import { SaleOrderHeader } from '../sales.class';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';

@Component({
  selector: 'app-sale-order',
  templateUrl: './sale-order.component.html',
  styleUrls: ['./sale-order.component.css']
})
export class SaleOrderComponent implements OnInit, OnDestroy {
  title: string = "Sale Order";
  saleOrderForm!: FormGroup;
  private masterParams:MasterParams = new MasterParams();
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
  pricingList: Item[] = [];
  scheduleList: Item[] = [
    { itemCode: 'single', itemName: 'Single' },
    { itemCode: 'multiple', itemName: 'Multiple' }
  ];
  dialogOpen: boolean = false;
  retMessage: string = "";
  private subSink!: SubSink;
  newTranMsg: string = "";
  textMessageClass: string = "";
  salesExecCode: string = "";
  saleOrderCls: SaleOrderHeader = new SaleOrderHeader();
  custCode: string = "";
  itemCount: number = 0;
  constructor(private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private masterService: MastersService, private invService: InventoryService,
    private utlService: UtilitiesService, protected saleService: SalesService, private loader: NgxUiLoaderService,
    protected router: Router, private datePipe: DatePipe) {
    this.saleOrderForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
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
      item: 'ST203',
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY"
    };
    const payTerm: getPayload = {
      ...this.commonParams(),
      item: "PAYTERM"
    };
    const pricing: getPayload = {
      ...this.commonParams(),
      item: "PRICING"
    };
    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(curbody);
      const service3 = this.masterService.GetMasterItemsList(payTerm);
      const service4 = this.masterService.GetMasterItemsList(pricing);
      this.subSink.sink = forkJoin([service1, service2, service3, service4]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          const res4 = results[3];
          this.modes = res1.data;
          this.currencyList = res2.data;
          this.payTermList = res3.data;
          this.pricingList = res4.data;
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
  onDocsCilcked() {

  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<SaleOrderDetailsComponent> = this.dialog.open(SaleOrderDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': "SALEORDER", 'tranNo': this.saleOrderForm.get('saleNo')!.value, 'search': "Sale Order Details",
        'mode': this.saleOrderForm.get('mode')!.value, 'status': this.tranStatus
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getSaleOrderHeader(this.saleOrderForm.get('saleNo')!.value, this.saleOrderForm.get('mode')?.value);
      }
    });
  }
  prepareSaleOrderCls() {
    this.saleOrderCls.company = this.userDataService.userData.company;
    this.saleOrderCls.location = this.userDataService.userData.location;
    this.saleOrderCls.langId = this.userDataService.userData.langId;
    this.saleOrderCls.refNo = this.userDataService.userData.sessionID;
    this.saleOrderCls.user = this.userDataService.userData.userID;

    this.saleOrderCls.applyVAT = this.saleOrderForm.get('applyVAT')?.value;
    this.saleOrderCls.currency = this.saleOrderForm.get('currency')?.value;
    this.saleOrderCls.custRef = this.saleOrderForm.get('custRef')?.value;
    this.saleOrderCls.customer = this.custCode;
    this.saleOrderCls.exchRate = this.saleOrderForm.get('exchangeRate')?.value;
    this.saleOrderCls.mode = this.saleOrderForm.get('mode')?.value;

    this.saleOrderCls.payTerm = this.saleOrderForm.get('payTerm')?.value;
    this.saleOrderCls.pricing = this.saleOrderForm.get('pricing')?.value;
    this.saleOrderCls.quotationNo = this.saleOrderForm.get('quotationNo')?.value;
    this.saleOrderCls.remarks = this.saleOrderForm.get('remarks')?.value;

    this.saleOrderCls.salesExec = this.salesExecCode;
    this.saleOrderCls.scheduleType = this.saleOrderForm.get('schedule')?.value;

    // this.saleOrderCls.shipTo = this.saleOrderForm.get('remarks')?.value;
    // this.saleOrderCls.billTo = this.userDataService.userData.company;
    const transformedDate = this.datePipe.transform(this.saleOrderForm.controls['tranDate'].value, 'yyyy-MM-dd');
		if (transformedDate !== undefined && transformedDate !== null) {
		  this.saleOrderCls.tranDate = transformedDate.toString();
		} else {
		  this.saleOrderCls.tranDate = ''; // or any default value you prefer
		}

    // this.saleOrderCls.tranDate = this.saleOrderForm.get('tranDate')?.value;
    this.saleOrderCls.tranNo = this.saleOrderForm.get('saleNo')?.value;
    this.saleOrderCls.tranStatus = "Any";

  }
  quotationData(supp: MasterParams, mode: string): void {
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.getQtnHeaderData(supp).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.saleOrderForm.patchValue({
            // quotationNo: res.data.quotationNo,
            tranDate: res.data.tranDate,
            customer: res.data.customerName,
            notes: res.data.remarks,
            pricing: res.data.pricing,
            schedule: res.data.scheduleType,
            payTerm: res.data.payTerm,
            salesRep: res.data.salesExecName,
            // lopNo: res.data,
            billTo: res.data.billToDesc,
            // shipTo: res.data.shipToDesc,
            currency: res.data.currency,
            exchangeRate: res.data.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            applyVAT: res.data.applyVAT,
          });
          this.salesExecCode = res.data.salesExec;
          this.custCode = res.data.customer;

          this.tranStatus = res.data.tranStatus;
          this.amountExclVat = res.data.tranAmount;
          this.vatAmount = res.data.vatAmount;
          this.totalAmount = res.data.totalAmount;
          this.itemCount = res.data.itemCount;
        //   this.saleOrderForm.controls['revisionNo'].patchValue(res['data'].revisionNo);
        //   this.saleOrderForm.controls['quoteDate'].patchValue(res['data'].tranDate);
        //   this.saleOrderForm.controls['validForDays'].patchValue(res['data'].validDays);
        //   this.saleOrderForm.controls['customer'].patchValue(res['data'].customerName);
        //   this.saleOrderForm.controls['currency'].patchValue(res['data'].currency);
        //   this.saleOrderForm.controls['payTerm'].patchValue(res['data'].payTerm);
        //   this.saleOrderForm.controls['salesExec'].patchValue(res['data'].salesExecName);
        //   this.salesExecCode = res['data'].salesExec;
        //   this.custCode = res['data'].customer;
        //   this.tranStatus = res['data'].tranStatus;
        //   // this.qtnCls.BillTo = res['data'].billTo;
        //   this.saleOrderForm.controls['custRef'].patchValue(res['data'].custRef);
        //   this.saleOrderForm.controls['applyVat'].patchValue(res['data'].applyVAT);
        //   this.saleOrderForm.controls['remarks'].patchValue(res['data'].remarks);
        //   this.saleOrderForm.controls['addressNo'].patchValue(res['data'].billToDesc);
        //   this.amountExclVat = res['data'].tranAmount;
        //   this.vatAmount = res['data'].vatAmount;
        //   this.totalAmount = res['data'].totalAmount;
        //   this.itemCount = res['data'].itemCount;
        //   if (mode != "View" && this.newTranMsg != "") {
        //     this.retMessage = this.newTranMsg;
        //     this.textMessageClass = "green";
        //   }
        //   else {
        //     this.retMessage = 'Retriving data ' + res.message + ' has completed';
        //     this.textMessageClass = "green";
        //   }

        // } else {
        //   this.retMessage = res.message;
        //   this.textMessageClass = "red";
         }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  onSubmit() {
    this.clearMsg();
    if (this.saleOrderForm.invalid) {
      this.retMessage = "Enter all mandatory fields!";
      this.textMessageClass = "red";
      return;
    }
    else {
      this.prepareSaleOrderCls();
      try {
        this.loader.start();
        this.subSink.sink = this.saleService.InsertSaleOrderHdr(this.saleOrderCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            if (this.saleOrderForm.get('mode')?.value === "Add") {
              this.modeChange('Modify');
            }
            this.saleOrderForm.get('saleNo')?.patchValue(res.tranNoNew)
            this.newTranMsg = res.message;
            this.getSaleOrderHeader(res.tranNoNew, this.saleOrderForm.get('mode')?.value)
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        })
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }

    }

  }
  searchData(tranType: string, tranNo: string) {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: tranType,
      TranNo: tranNo,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS" || res.status.toUpperCase() === "FAIL") {
          if (res && res.data && res.data.tranCount === 1) {
            if (tranType === "QUOTATION") {
              this.saleOrderForm.get('quotationNo')?.patchValue(res.data.selTranNo);
              this.masterParams.tranNo = res.data.selTranNo;
              this.quotationData(this.masterParams,this.saleOrderForm.get('mode')?.value);

            } else {
              this.saleOrderForm.get('saleNo')?.patchValue(res.data.selTranNo);
              this.getSaleOrderHeader(res.data.selTranNo, this.saleOrderForm.get('mode')?.value);
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': tranNo, 'TranType': tranType,
                  'search': tranType + ' Search'
                }
              });
              // this.tranStatus = "";
              // this.saleOrderForm = this.formInit();
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  if (tranType === "QUOTATION") {
                    this.saleOrderForm.get('quotationNo')?.patchValue(result);
                    this.masterParams.tranNo = result;
                    this.quotationData(this.masterParams,this.saleOrderForm.get('mode')?.value);

                  } else {
                    this.saleOrderForm.get('saleNo')?.patchValue(result);
                    this.getSaleOrderHeader(result, this.saleOrderForm.get('mode')?.value);
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
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  getSaleOrderHeader(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetSaleOrderHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.saleOrderForm.patchValue({
          quotationNo: res.data.quotationNo,
          tranDate: res.data.tranDate,
          customer: res.data.customerName,
          notes: res.data.remarks,
          pricing: res.data.pricing,
          schedule: res.data.scheduleType,
          payTerm: res.data.payTerm,
          salesRep: res.data.salesExecName,
          // lopNo: res.data,
          billTo: res.data.billToDesc,
          shipTo: res.data.shipToDesc,
          currency: res.data.currency,
          exchangeRate: res.data.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
          applyVAT: res.data.applyVAT,
        });
        this.salesExecCode = res.data.salesExec;
        this.custCode = res.data.customer;

        this.tranStatus = res.data.tranStatus;
        this.amountExclVat = res.data.tranAmount;
        this.vatAmount = res.data.vatAmount;
        this.totalAmount = res.data.totalAmount;
        this.itemCount = res.data.itemCount;
        if (mode != 'View' && this.newTranMsg != "") {
          this.retMessage = this.newTranMsg;
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
    })
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  quotationSearch() {
    this.searchData('QUOTATION', this.saleOrderForm.get('quotationNo')?.value)
  }
  saleNoSearch() {
    this.searchData('SALE ORDER', this.saleOrderForm.get('saleNo')?.value)

  }
  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      PartyName: this.saleOrderForm.controls['customer'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleOrderForm.get('customer')!.patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleOrderForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.saleOrderForm.get('customer')!.patchValue(result.partyName);
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
      PartyName: this.saleOrderForm.get('salesRep')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleOrderForm.controls['salesRep'].patchValue(res.data.selName);
            this.salesExecCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleOrderForm.get('salesRep')!.value, 'PartyType': "Employee",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.saleOrderForm.controls['salesRep'].patchValue(result.partyName);
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
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  clear() {
    this.saleOrderForm = this.formInit();
    this.clearMsg();
    this.tranStatus = "";
    this.itemCount = 0;
    this.totalAmount = 0;
    this.vatAmount = 0;
    this.amountExclVat = 0;
  }
  Close() {

  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      quotationNo: [''],
      saleNo: [''],
      tranDate: [new Date(), [Validators.required]],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      notes: [''],
      pricing: ['', [Validators.required]],
      schedule: ['', [Validators.required]],
      payTerm: ['',Validators.required],
      salesRep: ['', [Validators.required, Validators.maxLength(50)]],
      lopNo: ['0', [Validators.required, Validators.maxLength(18)]],
      billTo: [''],
      shipTo: [''],
      currency: ['',Validators.required],
      exchangeRate: ['1.0000',Validators.required],
      applyVAT: [false],
    });
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.saleOrderForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleOrderForm.get('saleNo')!.patchValue('');
      this.saleOrderForm.get('saleNo')!.disable();
      this.saleOrderForm.get('saleNo')!.clearValidators();
    }
    else {
      this.saleOrderForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleOrderForm.get('saleNo')!.enable();
    }
  }
  billToSearch(itemType: string) {
    let controlValue: string;
    if (itemType == 'SHIPTO') {
      controlValue = this.saleOrderForm.get('shipTo')!.value
    }
    else {
      controlValue = this.saleOrderForm.get('billTo')!.value
    }
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.saleOrderForm.get('customer')!.value,
      ItemFirstLevel: controlValue,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            if (itemType == 'SHIPTO') {
              this.saleOrderForm.get('shipTo')!.patchValue(res.data.selName);
              this.saleOrderCls.shipTo = res.data.selCode;
              this.saleOrderCls.shipToDesc = res.data.selName;
            }
            else {
              this.saleOrderForm.get('billTo')!.patchValue(res.data.selName);
              this.saleOrderCls.billTo = res.data.selCode;
              this.saleOrderCls.billToDes = res.data.selName;
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.saleOrderForm.controls['customer'].value, 'PartyType': itemType,
                  'search': itemType + ' Search', 'PartyName': ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (itemType == 'SHIPTO') {
                  this.saleOrderForm.get('shipTo')!.patchValue(result.partyName);
                  this.saleOrderCls.shipTo = result.code;
                  this.saleOrderCls.shipToDesc = result.partyName;
                }
                else {
                  this.saleOrderForm.get('billTo')!.patchValue(result.partyName);
                  this.saleOrderCls.billTo = result.code;
                  this.saleOrderCls.billToDes = result.partyName;
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

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST203",
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
