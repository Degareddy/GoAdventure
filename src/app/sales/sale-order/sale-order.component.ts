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
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-sale-order',
  templateUrl: './sale-order.component.html',
  styleUrls: ['./sale-order.component.css']
})
export class SaleOrderComponent implements OnInit, OnDestroy {
  title: string = "Sale Order";
  saleOrderForm!: FormGroup;
  private masterParams: MasterParams = new MasterParams();
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
      item: ScreenId.SALE_ORDER_SCRID,
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: Items.CURRENCY,
      mode: this.saleOrderForm.get('mode')?.value
    };
    const payTerm: getPayload = {
      ...this.commonParams(),
      item: Items.PAYTERM,
      mode: this.saleOrderForm.get('mode')?.value
    };
    const pricing: getPayload = {
      ...this.commonParams(),
      item: Items.PRICING,
      mode: this.saleOrderForm.get('mode')?.value
    };
    try {
      // this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(curbody);
      const service3 = this.masterService.GetMasterItemsList(payTerm);
      const service4 = this.masterService.GetMasterItemsList(pricing);
      this.subSink.sink = forkJoin([service1, service2, service3, service4]).subscribe(
        (results: any[]) => {
          // this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          const res4 = results[3];
          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.modes = res1.data;

          }
          else {
            this.displayMessage(displayMsg.ERROR + "Modes List " + res1.message, TextClr.red);
          }
          if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.currencyList = res2.data;

          }
          else {
            this.displayMessage(displayMsg.ERROR + "Currency List " + res2.message, TextClr.red);
          }
          if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.payTermList = res3.data;

          }
          else {
            this.displayMessage(displayMsg.ERROR + "Pay Term List " + res3.message, TextClr.red);
          }
          if (res4.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.pricingList = res4.data;
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Pricing List " + res4.message, TextClr.red);
          }
        },
        (error: any) => {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onDocsCilcked() {

  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<SaleOrderDetailsComponent> = this.dialog.open(SaleOrderDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranType: TranType.SALEORDER,
        tranNo: this.saleOrderForm.get('saleNo')!.value, search: "Sale Order Details",
        mode: this.saleOrderForm.get('mode')!.value, status: this.tranStatus
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
    const transformedDate = this.datePipe.transform(this.saleOrderForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.saleOrderCls.tranDate = transformedDate.toString();
    } else {
      this.saleOrderCls.tranDate = '';
    }

    this.saleOrderCls.tranNo = this.saleOrderForm.get('saleNo')?.value;
    this.saleOrderCls.tranStatus = TranStatus.ANY;

  }
  quotationData(supp: MasterParams, mode: string): void {
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.getQtnHeaderData(supp).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.saleOrderForm.patchValue({
            tranDate: res.data.tranDate,
            customer: res.data.customerName,
            notes: res.data.remarks,
            pricing: res.data.pricing,
            schedule: res.data.scheduleType,
            payTerm: res.data.payTerm,
            salesRep: res.data.salesExecName,
            billTo: res.data.billToDesc,
            currency: res.data.currency,
            exchangeRate: res.data.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
            applyVAT: res.data.applyVAT,
          }, { emitEvent: false });
          this.salesExecCode = res.data.salesExec;
          this.custCode = res.data.customer;
          this.tranStatus = res.data.tranStatus;
          this.amountExclVat = res.data.tranAmount;
          this.vatAmount = res.data.vatAmount;
          this.totalAmount = res.data.totalAmount;
          this.itemCount = res.data.itemCount;
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            if (this.saleOrderForm.get('mode')?.value.toUpperCase() === Mode.Add) {
              this.modeChange('Modify');
            }
            this.saleOrderForm.get('saleNo')?.patchValue(res.tranNoNew)
            this.newTranMsg = res.message;
            this.getSaleOrderHeader(res.tranNoNew, this.saleOrderForm.get('mode')?.value)
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
      TranStatus: TranStatus.ANY
    }
    try {
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (res && res.data && res.data.tranCount === 1) {
            if (tranType === TranType.QUOTATION) {
              this.saleOrderForm.get('quotationNo')?.patchValue(res.data.selTranNo);
              this.masterParams.tranNo = res.data.selTranNo;
              this.quotationData(this.masterParams, this.saleOrderForm.get('mode')?.value);

            } else {
              this.saleOrderForm.get('saleNo')?.patchValue(res.data.selTranNo);
              this.getSaleOrderHeader(res.data.selTranNo, this.saleOrderForm.get('mode')?.value);
            }
          }
          else {
           this.searchPopup(tranType, tranNo);

          }
        }
        else {
          this.searchPopup(tranType, tranNo);

          // this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }

      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  searchPopup(tranType: string, tranNo: string) {
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: tranNo, TranType: tranType,
          search: tranType + ' Search'
        }
      });
      this.dialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        this.dialogOpen = false;
        if (result != true) {
          if (tranType === TranType.QUOTATION) {
            this.saleOrderForm.get('quotationNo')?.patchValue(result);
            this.masterParams.tranNo = result;
            this.quotationData(this.masterParams, this.saleOrderForm.get('mode')?.value);

          } else {
            this.saleOrderForm.get('saleNo')?.patchValue(result);
            this.getSaleOrderHeader(result, this.saleOrderForm.get('mode')?.value);
          }
        }

      });
    }
  }
  getSaleOrderHeader(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetSaleOrderHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);

        this.saleOrderForm.patchValue({
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
          applyVAT: res.data.applyVAT,
        }, { emitEvent: false });
        this.salesExecCode = res.data.salesExec;
        this.custCode = res.data.customer;

        this.tranStatus = res.data.tranStatus;
        this.amountExclVat = res.data.tranAmount;
        this.vatAmount = res.data.vatAmount;
        this.totalAmount = res.data.totalAmount;
        this.itemCount = res.data.itemCount;
        if (mode.toUpperCase() != Mode.view && this.newTranMsg != "") {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
        // else {
        //   this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        // }
      }
      else {
        this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
      }
    })
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  quotationSearch() {
    this.searchData(TranType.QUOTATION, this.saleOrderForm.get('quotationNo')?.value)
  }
  saleNoSearch() {
    this.searchData('SALEORDER', this.saleOrderForm.get('saleNo')?.value)

  }
  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.CUSTOMER,
      PartyName: this.saleOrderForm.controls['customer'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
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
                  PartyName: this.saleOrderForm.controls['customer'].value || "", PartyType: Type.CUSTOMER,
                  search: 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.saleOrderForm.get('customer')!.patchValue(result.partyName);
                  this.custCode = result.code;
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

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.EMPLOYEE,
      PartyName: this.saleOrderForm.get('salesRep')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
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
                  PartyName: this.saleOrderForm.get('salesRep')!.value, PartyType: Type.EMPLOYEE,
                  search: 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.saleOrderForm.controls['salesRep'].patchValue(result.partyName);
                  this.salesExecCode = result.code;
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
  clearMsg() {
    this.displayMessage("", "");
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
    this.router.navigateByUrl('/home');

    
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
      payTerm: ['', Validators.required],
      salesRep: ['', [Validators.required, Validators.maxLength(50)]],
      lopNo: ['0', [Validators.required, Validators.maxLength(18)]],
      billTo: [''],
      shipTo: [''],
      currency: ['', Validators.required],
      exchangeRate: ['1.0000', Validators.required],
      applyVAT: [false],
    });
  }
  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.saleOrderForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleOrderForm.get('saleNo')!.patchValue('');
      this.saleOrderForm.get('saleNo')!.disable();
      this.saleOrderForm.get('saleNo')!.clearValidators();
      this.loadData();
    }
    else {
      this.saleOrderForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.saleOrderForm.get('saleNo')!.enable();
    }
  }
  billToSearch(itemType: string) {
    let controlValue: string;
    if (itemType == Items.SHIPTO) {
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
            if (itemType == Items.SHIPTO) {
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
                  tranNum: this.saleOrderForm.controls['customer'].value, PartyType: itemType,
                  search: itemType + ' Search', PartyName: ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != undefined && result != true){
                  if (itemType == Items.SHIPTO) {
                    this.saleOrderForm.get('shipTo')!.patchValue(result.partyName);
                    this.saleOrderCls.shipTo = result.code;
                    this.saleOrderCls.shipToDesc = result.partyName;
                  }
                  else {
                    this.saleOrderForm.get('billTo')!.patchValue(result.partyName);
                    this.saleOrderCls.billTo = result.code;
                    this.saleOrderCls.billToDes = result.partyName;
                  }
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
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
        ScrId: ScreenId.SALE_ORDER_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
