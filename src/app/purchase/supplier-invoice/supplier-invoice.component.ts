import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SupplierInvoiceDetailsComponent } from './supplier-invoice-details/supplier-invoice-details.component';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { supplierInvoice } from '../purchase.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { LinkUnitComponent } from 'src/app/gl/expenses/link-unit/link-unit.component';
import { SideOverlayComponent } from 'src/app/general/side-overlay/side-overlay.component';
import { CustomerDetailsComponent } from 'src/app/sales/customer/customer-details/customer-details.component';
import { Company, displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-supplier-invoice',
  templateUrl: './supplier-invoice.component.html',
  styleUrls: ['./supplier-invoice.component.css']
})
export class SupplierInvoiceComponent implements OnInit, OnDestroy {
  @ViewChild('overlay') overlay!: SideOverlayComponent;
  @Input() max: any;
  tomorrow = new Date();
   selectedFullMonth = '';
  selectedYear = 0;
  selectedMonthYear = '';
  supinvForm!: FormGroup;
  retMessage: string = "";
  newMessage: string = "";
  retNum!: number;
  textMessageClass: string = "";
  dialogOpen: boolean = false;
  masterParams!: MasterParams;
  modes: Item[] = [];
  currencyList: Item[] = [];
  tranStatus!: string;
  private subSink!: SubSink;
  private suppInvCls!: supplierInvoice;
  yearList: any = [];
  monthlist: Item[] = [
    { itemCode: 'January', itemName: "January" },
    { itemCode: 'February', itemName: "February" },
    { itemCode: 'March', itemName: "March" },
    { itemCode: 'April', itemName: "April" },
    { itemCode: 'May', itemName: "May" },
    { itemCode: 'June', itemName: "June" },
    { itemCode: 'July', itemName: "July" },
    { itemCode: 'August', itemName: "August" },
    { itemCode: 'September', itemName: "September" },
    { itemCode: 'October', itemName: "October" },
    { itemCode: 'November', itemName: "November" },
    { itemCode: 'December', itemName: "December" }
  ]
  constructor(protected router: Router, protected purchreqservice: PurchaseService,
    private loader: NgxUiLoaderService, private utlService: UtilitiesService,
    private datePipe: DatePipe, private masterService: MastersService,
    private userDataService: UserDataService, public dialog: MatDialog,
    private fb: FormBuilder) {
    this.masterParams = new MasterParams();
    this.supinvForm = this.formInit();
    this.subSink = new SubSink();
    this.populateYears();
    this.suppInvCls = new supplierInvoice();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  populateYears() {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    this.yearList = [
      {
        itemCode: previousYear, itemName: previousYear
      },
      {
        itemCode: currentYear, itemName: currentYear
      }
    ]
  }
  formInit() {
    return this.fb.group({
      tranNo: ['',],
      tranDate: [new Date(), [Validators.required]],
      supplier: ['', [Validators.required, Validators.maxLength(50)]],
      currency: ['', [Validators.required, Validators.maxLength(20)]],
      applyVAT: [false, [Validators.required]],
      inclusiveVAT: [false],
      vatMonth: ['', [Validators.required]],
      vatYear: ['', [Validators.required]],
      supplierAmt: ['0.00', [Validators.required]],
      invoiceAmt: ['0.00', [Validators.required]],
      vatAmt: [{ value: '0.00', disabled: true }],
      grnAmt: [{ value: '0.00', disabled: true }],
      payableAmt: ['0.00', [Validators.required]],
      paidAmt: [{ value: '0.00', disabled: true }],
      balAmt: [{ value: '0.00', disabled: true }],
      remarks: [''],
      mode: ['View'],

    });
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  // }
  ngOnInit(): void {
    this.onDateChange(new Date())
    this.loadData();
    this.supinvForm.get('inclusiveVAT')?.valueChanges.subscribe(value => {
      if (value) {
        this.supinvForm.controls['applyVAT'].patchValue(true);
        this.supinvForm.get('applyVAT')?.disable();
      } else {
        this.supinvForm.controls['applyVAT'].patchValue(false);
        this.supinvForm.get('applyVAT')?.enable();
      }
    });
    this.supinvForm.get('mode')?.patchValue('Add')
  }
  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body = {
      ...this.commonParams(),
      item: ScreenId.SUPPLIER_INVOICE_SCRID
    }
    const curbody = {
      ...this.commonParams(),
      Item: Items.CURRENCY,
      mode: this.supinvForm.get('mode')?.value
    };
    this.subSink.sink = this.masterService.getModesList(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.modes = res['data'];
      }
      else {
        this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
      }
    });
    this.subSink.sink = this.masterService.GetMasterItemsList(curbody).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.currencyList = res['data'];
      if(this.currencyList.length == 1){
        this.supinvForm.get('currency')?.setValue(this.currencyList[0].itemCode);
      }
      } else {
        this.displayMessage(displayMsg.ERROR + "Currency list empty!", TextClr.red);
      }
    });
    this.masterParams.item = this.supinvForm.controls['tranNo'].value;
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  
  // Date change function
  onDateChange(selectedDate: Date | null): void {
    if (selectedDate) {
      // Get full month name and year
      this.selectedFullMonth = this.getFullMonthName(selectedDate);
      this.selectedYear = selectedDate.getFullYear();
      this.selectedMonthYear = `${this.selectedFullMonth} ${this.selectedYear}`;
          this.supinvForm.get('vatYear')?.patchValue(this.selectedYear);

      console.log('Selected Date:', selectedDate);
      console.log('Full Month:', this.selectedFullMonth);
      console.log('Year:', this.selectedYear);
      console.log('Month & Year:', this.selectedMonthYear);
    }
  }

  // Helper function to get full month name
  getFullMonthName(date: Date): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    this.supinvForm.get('vatMonth')?.patchValue(monthNames[date.getMonth()]);
    return monthNames[date.getMonth()];
  }

  // Alternative method using Intl.DateTimeFormat for localization
  getFormattedMonthYear(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  }

  // Get month and year separately using Intl
  getLocalizedDateParts(date: Date): { month: string; year: string } {
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
    const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric' });
    
    return {
      month: monthFormatter.format(date),
      year: yearFormatter.format(date)
    };
  }

  searcInvoice() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: TranType.SUPINV,
      TranNo: this.supinvForm.controls['tranNo'].value,
      Party: "",
      FromDate: this.datePipe.transform(formattedFirstDayOfMonth, 'yyyy-MM-dd'),
      ToDate: this.datePipe.transform(formattedCurrentDate, 'yyyy-MM-dd'),
      TranStatus: TranStatus.ANY
    }
    this.subSink.sink = this.purchreqservice.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.getSupplierInvoive(this.masterParams, this.supinvForm.get('mode')?.value);
        }
        else {
          this.openSearch();
        }
      }
      else {
        // this.supinvForm.controls['tranDate'].patchValue(new Date());
        this.openSearch();
      }
    });
  }
  openSearch() {
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: this.supinvForm.controls['tranNo'].value, TranType: TranType.SUPINV,
          search: 'Supplier Invoice Search'
        }
      });
      this.dialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        this.dialogOpen = false;
        if (result != true && result != undefined) {
          this.masterParams.tranNo = result.tranNo;
          this.getSupplierInvoive(this.masterParams, this.supinvForm.get('mode')?.value);
        }
      });
    }
  }
  reset() {
    this.supinvForm = this.formInit();
    this.dialogOpen = false;
    this.tranStatus = "";
    this.displayMessage("", "");
  }
  handleGetData(res: any) {
    this.supinvForm.controls['tranNo'].patchValue(res['data'].tranNo);
    this.supinvForm.controls['tranDate'].patchValue(res['data'].tranDate);
    this.supinvForm.controls['supplier'].patchValue(res['data'].supplierName);
    this.supinvForm.controls['currency'].patchValue(res['data'].currency);
    this.supinvForm.controls['applyVAT'].patchValue(res['data'].applyVAT);
    this.supinvForm.controls['vatMonth'].patchValue(res['data'].vatMonth);
    this.supinvForm.controls['vatYear'].patchValue(res['data'].vatYear);
    this.supinvForm.controls['supplierAmt'].patchValue(res['data'].supplierAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['invoiceAmt'].patchValue(res['data'].invoiceAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['vatAmt'].patchValue(res['data'].vatAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['grnAmt'].patchValue(res['data'].grnAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['payableAmt'].patchValue(res['data'].payableAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['paidAmt'].patchValue(res['data'].paidAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['balAmt'].patchValue(res['data'].balAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supinvForm.controls['remarks'].patchValue(res['data'].remarks);
    this.tranStatus = res['data'].tranStatus;
    this.suppInvCls.supplier = res.data.supplier;

  }
  getSupplierInvoive(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.purchreqservice.GetSupplierInvoice(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.handleGetData(res);
          if (mode.toUpperCase() === Mode.view) {
            this.displayMessage(displayMsg.SUCCESS + 'Retriving data ' + res.message + ' has completed', TextClr.green);
          }
          else {
            this.retMessage = this.newMessage;
            this.displayMessage(displayMsg.SUCCESS + this.retMessage, TextClr.green);
          }

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

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<SupplierInvoiceDetailsComponent> = this.dialog.open(SupplierInvoiceDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.supinvForm.controls.mode.value, tranNo: tranNo, currency: this.supinvForm.controls.currency.value,
        vat: this.supinvForm.controls.applyVAT.value, client: this.suppInvCls.supplier, status: this.tranStatus
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getSupplierInvoive(this.masterParams, this.supinvForm.get('mode')?.value);
      }
    });
  }
  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.reset();
      this.supinvForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.loadData();
    }
    else {
      this.supinvForm.controls['supplier'].disable();
      this.supinvForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
  }

  clear() {
    this.supinvForm = this.formInit();
    this.displayMessage("", "");
    this.newMessage = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.supinvForm.controls['mode'].value,
        tranNo: this.supinvForm.controls['tranNo'].value, search: 'Supplier Invoice Docs',
        tranType: TranType.SUPINV
      }
    });
  }
  prepareSupInvCls() {
    const value = this.supinvForm.value;
    this.suppInvCls.company = this.userDataService.userData.company;
    this.suppInvCls.location = this.userDataService.userData.location;
    this.suppInvCls.langID = this.userDataService.userData.langId;
    this.suppInvCls.user = this.userDataService.userData.userID;
    this.suppInvCls.refNo = this.userDataService.userData.sessionID;
    this.suppInvCls.mode = value.mode;
    if (value.applyVAT) {
      this.suppInvCls.applyVAT = 1;
    }
    else {
      this.suppInvCls.applyVAT = 0;
    }
    this.suppInvCls.vATMonth = value.vatMonth;
    this.suppInvCls.vATYear = value.vatYear
    this.suppInvCls.currency = value.currency;
    this.suppInvCls.remarks = value.remarks;
    this.suppInvCls.balAmt = parseFloat(value.balAmt ? value.balAmt.replace(/,/g, '') : '0');
    this.suppInvCls.gRNAmt = parseFloat(value.grnAmt ? value.grnAmt.replace(/,/g, '') : '0');
    this.suppInvCls.invoiceAmt = parseFloat(value.invoiceAmt ? value.invoiceAmt.replace(/,/g, '') : '0');
    this.suppInvCls.paidAmt = parseFloat(value.paidAmt ? value.paidAmt.replace(/,/g, '') : '0');
    this.suppInvCls.payableAmt = parseFloat(value.payableAmt ? value.payableAmt.replace(/,/g, '') : '0');
    this.suppInvCls.supplierAmt = parseFloat(this.supinvForm.get('supplierAmt')?.value);
    console.log(this.suppInvCls.supplierAmt)

    if (value.tranNo) {
      this.suppInvCls.tranNo = value.tranNo;
    } else {
      this.suppInvCls.tranNo = "";
    }
    const transformedDate = this.datePipe.transform(this.supinvForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.suppInvCls.tranDate = transformedDate.toString();
    } else {
      this.suppInvCls.tranDate = '';
    }
  }
  clearMsg() {
    this.displayMessage("", "");
  }
  onAllocation() {
    const dialogRef: MatDialogRef<LinkUnitComponent> = this.dialog.open(LinkUnitComponent,
      {
        width: '80%',
        disableClose: true,
        data: {
          mode: this.supinvForm.controls['mode'].value,
          tranNo: this.supinvForm.controls['tranNo'].value,
          tranType: TranType.SUPINV,
          search: 'Supplier Invoice Allocation'
        },
      }
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result.isAltered) {
        // this.onSearchCilcked();
      }
    });
  }
  GetClietBalanceSummary(supplierCode: string) {
    let currency: string = '';
    if (this.userDataService.userData.company === Company.GA) {
      currency = 'INR';
    } else {
      currency = "KES"
    }
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      Client: supplierCode,
      TranType: TranType.SUPGRN,
      Currency: currency,
      AsOnDate: this.formatDate(new Date()),
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    try {
      this.subSink.sink = this.purchreqservice.GetClietBalanceSummary(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS && supplierCode === res.data.client) {
          this.supinvForm.get('supplierAmt')?.patchValue('');
          this.supinvForm.get('invoiceAmt')?.patchValue('');
          this.supinvForm.get('supplierAmt')?.patchValue(res.data.tranAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.supinvForm.get('invoiceAmt')?.patchValue(res.data.tranAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.supinvForm.get('supplierAmt')?.disable();
          this.supinvForm.get('currency')?.patchValue((res.data.currency));
          this.supinvForm.get('grnAmt')?.patchValue((res.data.grnAmount));
          this.supinvForm.get('vatAmt')?.patchValue((res.data.vatAmount));
          this.supinvForm.get('supplierAmt')?.patchValue((res.data.tranAmount));
          if(res.data.isVatable){
            this.supinvForm.get('inclusiveVAT')?.patchValue(res.data.isVatable);
            this.supinvForm.get('inclusiveVAT')?.disable()
          }
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);

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
  onSubmit() {
    this.clearMsg();
    if (this.supinvForm.invalid) {
      return;
    }
    else {
      this.prepareSupInvCls();
      try {
        this.loader.start();
        this.subSink.sink = this.purchreqservice.updateSupplierInvoice(this.suppInvCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            // this.textMessageClass = "green";
            this.newMessage = res.message;
            this.masterParams.tranNo = res.tranNoNew;
            if (this.supinvForm.get('mode')?.value.toUpperCase() === Mode.Add) {
              this.modeChange("Modify");
            }
            this.getSupplierInvoive(this.masterParams, this.supinvForm.get('mode')?.value);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }
  }

  onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.SUPPLIER,
      Item: this.supinvForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.supinvForm.controls['supplier'].patchValue(res.data.selName);
            this.suppInvCls.supplier = res.data.selCode;
            this.GetClietBalanceSummary(res.data.selCode);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  tranNum: this.supinvForm.controls['supplier'].value, PartyType: Type.SUPPLIER,
                  search: 'Supplier Search', PartyName: this.supinvForm.controls['supplier'].value
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.supinvForm.controls['supplier'].patchValue(result.partyName);
                  this.suppInvCls.supplier = result.code;
                  this.GetClietBalanceSummary(result.code);
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
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.SUPPLIER_INVOICE_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID

      }
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: tranNo,
        mode: this.supinvForm.controls['mode'].value,
        TranType: TranType.SUPINV,
        search: "Supplier Invoice Notes"
      }
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: TranType.SUPINV,
        tranNo: tranNo,
        search: 'Supplier Log Details'
      }
    });
  }

  openOverlay(): void {

    const dialogRef: MatDialogRef<CustomerDetailsComponent> = this.dialog.open(CustomerDetailsComponent, {
      width: '980px',
      disableClose: true,
      data: { customerId: '', customerName: '', mode: "Add" },
    });
    // debugger;
    // if (this.overlay) {
    //    this.overlay.open(CustomerDetailsComponent);
    // } else {
    //   console.error('Overlay component not initialized.');
    // }
  }
}

