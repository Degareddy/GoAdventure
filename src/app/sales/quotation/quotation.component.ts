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
import { firstValueFrom, forkJoin, map, startWith } from 'rxjs';
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
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';


interface params {
  itemCode: string
  itemName: string

}
interface autoComplete {
  itemCode: string
  itemName: string
  itemDetails:string

}
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
  filteredCustomer: any[] = [];
  filteredEmployee: any[] = [];
  autoFilteredCustomer: autoComplete[] = [];
  customerList:autoComplete[]=[]
  autoFilteredEmployee: autoComplete[] = [];
  employeeList:autoComplete[]=[]

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
    if (event.toUpperCase() === Mode.view) {
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
      width: '90%',
      disableClose: true,
      data: {
        mode: this.quotationForm.get('mode')!.value, tranNo: this.quotationForm.get('tranNo')!.value,
        'status': this.tranStatus,
        search: 'Quotation Details', tranType:TranType.QUOTATION
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
                  tranNum: this.quotationForm.controls['customer'].value, PartyType: itemType,
                  search: itemType + ' Search', PartyName: ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != true && result != undefined){
                  this.quotationForm.get('addressNo')!.patchValue(result.partyName);
                  this.qtnCls.BillTo = result.code;
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
      item: ScreenId.QUOTATION_SCRID
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: Items.CURRENCY,
      mode: this.quotationForm.get('mode')!.value

    };
    const payTerm: getPayload = {
      ...this.commonParams(),
      item: Items.PAYTERM,
      mode: this.quotationForm.get('mode')!.value
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
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res1.data;
        }
        else {
          this.displayMessage("Error: Modes list empty!", "red");
          return;
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.currencyList = res2.data;
        }
        else {
          this.displayMessage("Error: Currency list empty!", "red");
          return;
        }
        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.payTermList = res3.data;
        }
        else {
          this.displayMessage("Error: Payterm list empty!", "red");
          return;
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR+ error.message, TextClr.red);
      }
    );
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  async ngOnInit() {
    this.customerList=await this.loadCust("CUSTOMER");
    this.filteredCustomer=this.customerList
    this.employeeList=await  this.loadCust("EMPLOYEE");
    this.filteredEmployee=this.employeeList
    this.loadData();
    this.quotationForm.get('customer')!.valueChanges
  .pipe(
    startWith(''),
    map(value => typeof value === 'string' ? value : value?.itemName || ''),
    map(name => this._filter(name))
  )
  .subscribe(filtered => {
    this.autoFilteredCustomer = filtered;
  });
  this.quotationForm.get('salesExec')!.valueChanges
  .pipe(
    startWith(''),
    map(value => typeof value === 'string' ? value : value?.itemName || ''),
    map(name => this._filterEmployee(name))
  )
  .subscribe(filtered => {
    this.autoFilteredEmployee = filtered;
  });


  }

  displayCustomer(item: autoComplete): string {
    return item && item.itemName ? item.itemName : '';
  }
  
  filerCutomers(value: any) {
    const filterValue = value.toLowerCase();
    return this.customerList.filter((cust: params) => cust.itemName.toLowerCase().includes(filterValue));
  }
  private _filter(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.customerList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue) ||
      option.itemDetails.toLowerCase().includes(filterValue)
    );
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
    debugger
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
      debugger
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
      TranType: TranType.QUOTATION,
      TranNo: this.quotationForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: TranStatus.ANY
    }
    try {
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.quotationForm.get('tranNo')?.patchValue(res.data.selTranNo);
            this.quotationData(this.masterParams, this.quotationForm.get('mode')?.value);
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
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  openSearch() {
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: this.quotationForm.get('tranNo')!.value, TranType: TranType.QUOTATION,
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
            this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
          }
        }

      });
    }
  }
  quotationData(supp: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.salesServices.getQtnHeaderData(supp).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
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
            this.displayMessage(displayMsg.SUCCESS +  this.newTranMsg, TextClr.green);
          }
          else {
            this.displayMessage("Success: Retriving data " + res.message + " has completed", "green");
          }

        } else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
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
  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.CUSTOMER,
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
                  PartyName: this.quotationForm.controls['customer'].value || "", PartyType: Type.CUSTOMER,
                  search: 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.quotationForm.get('customer')!.patchValue(result.partyName);
                  this.custCode = result.code;
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

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.EMPLOYEE,
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
                  PartyName: this.quotationForm.get('salesExec')!.value, PartyType: Type.EMPLOYEE,
                  search: 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.quotationForm.controls['salesExec'].patchValue(result.partyName);
                  this.salesExecCode = result.code;
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
  clearMsgs() {
   this.displayMessage("", "");
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
    this.qtnCls.ScrId = ScreenId.QUOTATION_SCRID;
    this.qtnCls.Mode = this.quotationForm.get('mode')?.value;
    this.qtnCls.TranNo = this.quotationForm.get('tranNo')?.value;
    this.qtnCls.SalesExec = this.salesExecCode;
    const transformedDate = this.datePipe.transform(this.quotationForm.controls['quoteDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.qtnCls.TranDate = transformedDate.toString();
    } else {
      this.qtnCls.TranDate = '';
    }
    this.qtnCls.RevisionNo = this.quotationForm.get('revisionNo')?.value;
    this.qtnCls.ValidDays = this.quotationForm.get('validForDays')?.value;
    this.qtnCls.Customer = this.custCode;
    this.qtnCls.Currency = this.quotationForm.get('currency')?.value;
    this.qtnCls.PayTerm = this.quotationForm.get('payTerm')?.value;
    this.qtnCls.CustRef = this.quotationForm.get('custRef')?.value;

    this.qtnCls.ApplyVAT = this.quotationForm.get('applyVat')?.value;
    this.qtnCls.ExchRate = this.quotationForm.get('exchangeRate')?.value;
    this.qtnCls.Remarks = this.quotationForm.get('remarks')?.value;
    this.qtnCls.TranStatus =TranStatus.ANY;
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
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (this.quotationForm.get('mode')?.value.toUpperCase() === Mode.Add) {
            this.modeChange('Modify');

          }
          this.quotationForm.get('tranNo')?.patchValue(res.tranNoNew);
          this.newTranMsg = res.message;
          this.masterParams.tranNo = res.tranNoNew;

          this.quotationData(this.masterParams, this.quotationForm.get('mode')?.value)
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
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
    try{
      this.subSink.sink = this.salesServices.GetQuotationReport(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.pdfService.generateQuotationPDF(res['data'], "Quotation", new Date(), "PDF");
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch(ex:any){
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

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
      data: { mode: this.quotationForm.controls['mode'].value,
        tranNo: this.quotationForm.controls['tranNo'].value,
         search: 'Quotation Docs', tranType: TranType.QUOTATION }
    });

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.QUOTATION_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
