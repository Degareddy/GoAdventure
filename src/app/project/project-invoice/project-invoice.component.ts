import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { SalesService } from 'src/app/Services/sales.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { invoiceClass } from '../Project.class';
import { InvoiceDetailsComponent } from './invoice-details/invoice-details.component';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { InvoiceExpensesComponent } from './invoice-expenses/invoice-expenses.component';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-invoice',
  templateUrl: './project-invoice.component.html',
  styleUrls: ['./project-invoice.component.css']
})
export class ProjectInvoiceComponent implements OnInit, OnDestroy {
  saleForm!: FormGroup;
  @ViewChild('picker1') picker1!: ElementRef;
  @Input() max: any;
  today = new Date();
  amountExclVat: number = 0.00;
  charges: number = 0.00;
  vatAmount: number = 0.00;
  totalAmount: number = 0.00;
  tranStatus!: string;
  modes: Item[] = [];
  payTermList: Item[] = [];
  currencyList: Item[] = [];
  props: Item[] = [];
  blocks: Item[] = [];
  flatCode!: string;
  isModeAdd: boolean = false;
  custCode!: string;
  salesExecCode!: string;
  dialogOpen = false;
  data: any;
  exchRate: number = 0;
  retMessage: string = "";
  textMessageClass: string = "";
  masterParams!: MasterParams;
  private subSink: SubSink;
  private invCls: invoiceClass;
  public rentalCharges: number = 0;
  public othrCharges: number = 0;
  public discAmount: number = 0;
  public totalCharges: number = 0;
  invPeriodicity!: string;
  monthlist: Item[] = [
    { itemCode: '1', itemName: "January" },
    { itemCode: '2', itemName: "February" },
    { itemCode: '3', itemName: "March" },
    { itemCode: '4', itemName: "April" },
    { itemCode: '5', itemName: "May" },
    { itemCode: '6', itemName: "June" },
    { itemCode: '7', itemName: "July" },
    { itemCode: '8', itemName: "August" },
    { itemCode: '9', itemName: "September" },
    { itemCode: '10', itemName: "October" },
    { itemCode: '11', itemName: "November" },
    { itemCode: '12', itemName: "December" }

  ]
  yearList: any = [];
  newTranMsg: string = "";
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    public dialog: MatDialog, private reportsService: PdfReportsService, private route: ActivatedRoute,
    private masterService: MastersService, private utlService: UtilitiesService,
    protected saleService: SalesService, protected projService: ProjectsService,
    private loader: NgxUiLoaderService, protected router: Router, private datePipe: DatePipe) {
    this.saleForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.populateYears();
    this.invCls = new invoiceClass();
  }

  ngOnDestroy() {
    this.subSink.unsubscribe();
    this.clear();
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
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
 async fetchTenantData() {
    if ( this.flatCode) {
      const tbody = {
        ...this.commonParams(),
        property : this.saleForm.get('property')?.value,
        block : this.saleForm.get('block')?.value,
        unit : this.flatCode,
        // tenant: this.invCls.tenant
       
      }
      this.subSink.sink =await this.projService.FetchTenantInvoiceData(tbody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.invPeriodicity = res.data.invPeriodicity;
          this.invDateChanged(res.data.fromInvoiceDate);
          const fromInvoiceDate = new Date(res.data.fromInvoiceDate);
          const today = new Date();
          this.saleForm.patchValue({
            invDay: res.data.invDay,
            invFromDate: res.data.fromInvoiceDate,
            invToDate: res.data.toInvoiceDate,
            invPeriodicityName: res.data.invPeriodicityName,
            currency: res.data.currency,
            invMonth: res.data.rentMonth.toString(),
            invYear: res.data.rentYear,
            saleDate: res.data.fromInvoiceDate,
            customer: res.data.tenantName
          });
          this.invCls.tenant = res.data.tenant;
          this.invCls.tenantName = res.data.tenantName;
          if (fromInvoiceDate > today) {
            this.displayMessage(this.datePipe.transform(new Date(res.data.fromInvoiceDate), "dd-MM-yyyy") + " Invoice date is too early to raise an invoice.", "red");
            return;
          }
        }
        else {
          this.displayMessage(res.message, "red");
        }
      });
    }
    // else {
    //   this.displayMessage("Tenant Details not found.", "red");
    // }

  }

  invDateChanged(event: any) {
    let originalSaleDate: Date;
    originalSaleDate = event;
    const dueDate = new Date(originalSaleDate);
    dueDate.setDate(dueDate.getDate() + 5);
    this.saleForm.controls['dueDate'].patchValue(dueDate);
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      property: [{ value: '', disabled: true }, Validators.required],
      block: [{ value: '', disabled: true }, Validators.required],
      flat: [{ value: '', disabled: true }, Validators.required],
      tranNo: ['', [Validators.maxLength(30)]],
      saleDate: [new Date(), [Validators.required]],
      invFromDate: [{ value: new Date(), disabled: true }],
      invToDate: [{ value: new Date(), disabled: true }],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      invPeriodicityName: [{ value: '', disabled: true }],
      currency: ['', [Validators.required, Validators.maxLength(10)]],
      exchRate: ['1.0000', [Validators.required]],
      excutive: ['', [Validators.maxLength(50)]],
      lpoNo: ['', [Validators.maxLength(18)]],
      applyVAT: [false],
      miscellaneous:[false],
      remarks: ['', [Validators.maxLength(512)]],
      includeExpenses: [false],
      dueDate: [new Date(), Validators.required],
      invDay: ['', Validators.required],
      invYear: ['', Validators.required],
      invMonth: ['', Validators.required],
      penaltyDay: [0, Validators.required],
      isRentInvoice: [false],
      isApplyForAll:[false],
      // isFull: [false],
      // transferAmount: ["0.00"],
      // transferTo: [""]
    }, { validators: this.rentInvoiceValidator() });
  }
  rentInvoiceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const isRentInvoice = control.get('isRentInvoice')?.value;
      // return isRentInvoice === true ? null : { rentInvoiceInvalid: true };
      return null;
    };
  }

  onExpensesCilcked() {
    const dialogRef: MatDialogRef<InvoiceExpensesComponent> = this.dialog.open(InvoiceExpensesComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        'tranType': "TENINV", 'tranNo': this.saleForm.controls['tranNo'].value,
        'mode': this.saleForm.controls['mode'].value, 'status': this.tranStatus
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getInvoiceData(this.masterParams, this.saleForm.controls.mode.value);
      }
    });
  }

  onDetailsCilcked() {
    const dialogRef: MatDialogRef<InvoiceDetailsComponent> = this.dialog.open(InvoiceDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { 'tranType': "TENINV", 'tranNo': this.saleForm.controls['tranNo'].value, 'mode': this.saleForm.controls['mode'].value, 'status': this.tranStatus,'isMiscellaneous' :this.saleForm.controls['miscellaneous']!.value,'property':this.saleForm.controls['property']!.value,'block':this.saleForm.controls['block']!.value,'unit':this.saleForm.controls['flat']!.value }  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getInvoiceData(this.masterParams, this.saleForm.controls.mode.value);
      }
    });
  }

  refershData() {
    // this.saleForm.controls.isFull.valueChanges.subscribe((isFullValue: boolean) => {
    //   this.displayMessage("", "");
    //   if (isFullValue) {
    //     this.saleForm.controls.transferAmount.patchValue(this.totalAmount, { emitEvent: false });
    //     this.saleForm.controls.transferAmount.disable({ emitEvent: false });
    //   } else {
    //     this.saleForm.controls.transferAmount.enable({ emitEvent: false });
    //   }
    // });

    // this.saleForm.controls.transferAmount.valueChanges.subscribe((transferAmountValue: number) => {
    //   this.displayMessage("", "");
    //   if (transferAmountValue > this.totalAmount) {
    //     this.displayMessage("Transfer amount cannot be greater than total amount!", "red");
    //     this.saleForm.controls.transferAmount.patchValue(this.totalAmount, { emitEvent: false });
    //     this.saleForm.controls.isFull.patchValue(true, { emitEvent: false });
    //     this.saleForm.controls.transferAmount.disable({ emitEvent: false });
    //   }
    // });
  }
  ngOnInit() {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.refershData();
    this.saleForm.get('saleDate')!.valueChanges.subscribe(newDate => {
      this.invDateChanged(newDate);

    });
    this.saleForm.get('property')!.valueChanges.subscribe(newDate => {
      this.onSelectedPropertyChanged();
    });

    // console.log(history.state.data);
    if (history.state.data) {
      this.data = history.state.data;
      if (this.data && this.data.tranNo) {
        this.masterParams.tranNo = this.data.tranNo;
        this.getInvoiceData(this.masterParams, 'View')
      }
    }



  }

async  loadData() {
    const propertyBody = this.createRequestData('PROPERTY');
    try {
      const service1 = this.masterService.getModesList({ ...this.commonParams(), item: 'ST913' });
      const service2 = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'CURRENCY' });
      const property$ = this.masterService.GetMasterItemsList(propertyBody);
      this.subSink.sink =await forkJoin([service1, service2, property$]).subscribe(
        (results: any[]) => {
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          if (res1.status.toUpperCase() === "SUCCESS") {
            this.modes = res1.data;
          } else {
            this.displayMessage("Error: Modes list Empty!", "red");
          }
          if (res2.status.toUpperCase() === "SUCCESS") {
            this.currencyList = res2.data;
            if (this.currencyList.length === 1) {
              this.saleForm.get('currency')!.patchValue(this.currencyList[0].itemCode);
            }

          } else {
            this.displayMessage("Error: Currency list Empty!", "red");
          }

          if (res3.status.toUpperCase() === "SUCCESS") {
            this.props = res3.data;
            if (this.props.length === 1) {
              this.saleForm.get('property')!.patchValue(this.props[0].itemCode);
              this.onSelectedPropertyChanged();
            }

          } else {
            this.displayMessage("Error: Property list Empty!", "red");
          }
        },
        (error: any) => {
          this.loader.stop();
          this.displayMessage("Error: " + error.message, "red");
        }
      );

    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  private createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: item
    };
  }

  // handleError(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = 'red';
  // }

  // handleSuccess(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = 'green';
  // }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  reset() {
    this.saleForm.reset()
    this.saleForm = this.formInit();
    this.custCode = "";
    this.salesExecCode = "";
  }
  prepareInvCls() {
    let invFromDate: any;
    let invToDate: any;
    let dueDate: any;
    let saleDate: any;
    const formControls = this.saleForm.controls;
    dueDate = this.formatDate(formControls.dueDate.value);
    invFromDate = this.formatDate(formControls.invFromDate.value);
    invToDate = this.formatDate(formControls.invToDate.value);
    saleDate = this.formatDate(formControls.saleDate.value);
    const formValues = this.saleForm.value;
    this.invCls.applyVAT = formValues.applyVAT;
    this.invCls.company = this.userDataService.userData.company;
    this.invCls.currency = formValues.currency;
    this.invCls.dueDate = dueDate;
    this.invCls.isRentInvoice = formValues.isRentInvoice;
    this.invCls.invFromDate = invFromDate;
    this.invCls.invToDate = invToDate;
    this.invCls.IsMiscInvoice=formValues.miscellaneous;
    this.invCls.exchRate = formValues.exchRate.replace(/,/g, '');
    this.invCls.invPeriodicity = this.invPeriodicity;
    this.invCls.executive = this.salesExecCode;
    this.invCls.invDay = formValues.invDay;
    this.invCls.includeExpenses = formValues.includeExpenses;
    this.invCls.lPONo = formValues.lpoNo;
    this.invCls.location = this.userDataService.userData.location;
    this.invCls.mode = formValues.mode;
    this.invCls.penaltyPerDay = formValues.penaltyDay;
    this.invCls.refNo = this.userDataService.userData.sessionID;
    this.invCls.remarks = formValues.remarks;
    this.invCls.rentMonth = formValues.invMonth;
    this.invCls.rentYear = formValues.invYear;
    this.invCls.tranDate = saleDate;
    this.invCls.tranNo = this.saleForm.get('tranNo')?.value;
    this.invCls.unitCount = 0;
    this.invCls.user = this.userDataService.userData.userID;
    this.invCls.property = this.saleForm.get('property')?.value;
    this.invCls.block = this.saleForm.get('block')?.value;;
    this.invCls.unit = this.flatCode;

    this.invCls.transferAmount = this.saleForm.get('transferAmount')?.value
    ? parseFloat(this.saleForm.get('transferAmount')?.value.replace(/,/g, '')) || 0
    : 0;

    // this.invCls.transferTo = this.saleForm.get('transferTo')?.value;
    this.invCls.isFull = this.saleForm.get('isFull')?.value;
  }

  private showConfirmationDialog(title: string, message: string, onConfirm: () => void): void {
    const dialogData = new ConfirmDialogModel(title, message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '210px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult === "YES") {
        onConfirm();
      }
    });
  }
  apply(){
    this.displayMessage("", "");
    let isSubmitted = false;
    // if (this.saleForm.controls.isFull.value) {
    //   // If 'isFull' is true, set transferAmount to totalAmount and disable the field
    //   if (this.saleForm.controls.transferAmount.value > this.totalAmount) {
    //     this.displayMessage("Transfer amount cannot be greater than total amount!", "red");
    //     return;
    //   } else {
    //     // Assign totalAmount and disable the field
    //     this.saleForm.controls.transferAmount.patchValue(this.totalAmount);
    //     this.saleForm.controls.transferAmount.disable();
    //   }
    // } else {
    //   // If 'isFull' is false, allow editing but prevent transferAmount from exceeding totalAmount
    //   this.saleForm.controls.transferAmount.enable();

    //   if (this.saleForm.controls.transferAmount.value > this.totalAmount) {
    //     this.displayMessage("Transfer amount cannot be greater than total amount!", "red");
    //     this.saleForm.controls.transferAmount.patchValue(this.totalAmount);
    //   }
    // }

    const mode = this.saleForm.controls.mode.value.toUpperCase();
    const tranNo = this.saleForm.controls.tranNo.value;
    const tranStatus = this.tranStatus.toUpperCase();
    const confirmAndSubmit = (title: string, message: string) => {
      const dialogData = new ConfirmDialogModel(title, message);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: "400px",
        height: '210px',
        data: dialogData,
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult === "YES" && !isSubmitted) {
          this.submit();
          isSubmitted = true; // Mark as submitted
        }
      });
    };
    if (mode !== 'ACTIVATE' && tranStatus === "DELETED") {
      this.displayMessage(`Failed: Tenant invoice ${tranNo} already deleted, to modify activate.`, "red");
      return;
    }
    const invSaleDate = new Date(this.saleForm.controls.saleDate.value);
    const invDate = new Date(this.saleForm.controls.invFromDate.value);

    if (invSaleDate < invDate) {
      this.displayMessage("Validation Error: The invoice date cannot be earlier than the from date.", "red");
      return;
    }

    if (mode === 'AUTHORIZE' && this.totalAmount === 0) {
      this.displayMessage("Failed: Tenant invoice amount is zero (0). Check the details for authorization.", "red");
      return;
    }
    if (!this.isValidFlatCode(this.flatCode)) {
      this.displayMessage("Select a valid flat!", "red");
      return;
    }

    // if (tranStatus === 'AUTHORIZED') {
    //   this.displayMessage(`Failed: Tenant invoice ${tranNo} already authorized.`, "red");
    //   return;
    // }
    if (mode === 'AUTHORIZE' && this.totalAmount >= 0 && !isSubmitted) {
      const message = `You are about to authorize an invoice with a total amount of ${this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Do you wish to proceed?`;
      confirmAndSubmit("Authorize Invoice?", message);

    }
    else if (mode === 'DELETE' && this.totalAmount >= 0 && !isSubmitted) {
      const message = `Are you sure you want to delete invoice no. ${tranNo} with an amount of ${this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? This action can be undone by activating the invoice.`;
      confirmAndSubmit("Delete Invoice?", message);

    }

    else {

      this.submit();
    }

  }
  // applyForEnable():boolean{
  //   if(this.saleForm.controls['includeExpenses']!.value || this.saleForm.controls['isRentInvoice']!.value)
  // }
  onSubmit() {
    this.displayMessage("", "");
    let isSubmitted = false;
    if (this.saleForm.invalid) {
      this.displayMessage("Enter all required fields!", "red");
      return;
    }
    if(!this.saleForm.controls['includeExpenses'].value && !this.saleForm.controls['isRentInvoice'].value && this.saleForm.controls['mode'].value !== 'Authorize' && !this.saleForm.controls['miscellaneous'].value){
      const message = `Are you sure you want to generate an empty invoice?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult != true && dialogResult === 'YES') {
        this.apply();
      }
      });
    }
    else{
      this.apply();
    }

  }

 async submit() {
  if(this.saleForm.controls['isApplyForAll'].value && this.saleForm.controls['mode'].value === 'Authorize'){
    this.invCls.AllUnits=true;
  }
    this.prepareInvCls();
    try {
      this.loader.start();
      this.subSink.sink =await this.projService.UpdateTenantInvoiceHdr(this.invCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.handleSuccessfulUpdate(res);
        } else {
          this.displayMessage("Error: " + res.message, "red");
          // this.handleError(res);
        }
      },
        (error: any) => {
          // this.handleError(error);
          this.displayMessage("Error: " + error.message, "red");
        }
      );
    } catch (error: any) {
      this.displayMessage("Error: " + error.message, "red");
    }
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  private isValidFlatCode(flatCode: string | null | undefined): boolean {
    return flatCode !== "" && flatCode !== undefined && flatCode !== null;
  }

  private handleSuccessfulUpdate(res: SaveApiResponse) {
    this.newTranMsg = res.message;
    this.saleForm.controls['tranNo'].patchValue(res.tranNoNew);

    if (this.saleForm.controls['mode'].value.toUpperCase() === "ADD") {
      this.saleForm.controls.mode.patchValue('Modify');
    } else {
      // this.handleSuccess(res);
      this.displayMessage("Success: " + res.message, "green");
    }

    this.masterParams.tranNo = res.tranNoNew;
    this.getInvoiceData(this.masterParams, this.saleForm.controls.mode.value);
  }

 async searchData() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'TENINV',
      TranNo: this.saleForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "Open"
    }
    try {
      this.loader.start();
      this.subSink.sink =await this.masterService.GetTranCount(body).subscribe((res: any) => {
        this.loader.stop()
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.getInvoiceData(this.masterParams, this.saleForm.controls.mode.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.saleForm.controls['tranNo'].value, 'TranType': "TENINV",
                  'search': 'Tenant Invoice Search'
                }
              });
              this.tranStatus = "";
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.saleForm.controls["tranNo"].patchValue(result);
                  this.masterParams.tranNo = result;
                  try {
                    this.getInvoiceData(this.masterParams, this.saleForm.controls.mode.value);
                  }
                  catch (ex: any) {
                    // this.handleError(ex);
                    this.displayMessage("Exception: " + ex.message, "red");
                  }
                }
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
          // this.handleError(res);

        }

      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }

  }

  modeChange(event: string) {
    if (event === "Add") {
      this.clear();
      this.saleForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.saleForm.get('tranNo')!.patchValue('');
      this.saleForm.get('tranNo')!.disable();
      this.saleForm.get('tranNo')!.clearValidators();
      this.saleForm.controls['property'].enable({ emitEvent: false });
      this.saleForm.controls['block'].enable({ emitEvent: false });
      this.saleForm.controls['flat'].enable({ emitEvent: false });
      if (this.props.length === 1) {
        this.saleForm.get('property')!.patchValue(this.props[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    }
    else {
      if (this.saleForm.get('tranNo')!.value === "") {
        this.saleForm.get('tranNo')!.enable();
        this.saleForm.controls['mode'].patchValue(event, { emitEvent: false });
        this.saleForm.controls['property'].disable({ emitEvent: false });
        this.saleForm.controls['block'].disable({ emitEvent: false });
        this.saleForm.get('flat')!.disable({ emitEvent: false });
      }

    }
  }
  bindFormData(res: any) {
    this.salesExecCode = res['data'].executive;
    this.saleForm.patchValue({
      tranNo: res['data'].tranNo,
      saleDate: res['data'].tranDate,
      customer: res['data'].tenantName,
      currency: res['data'].currency,
      exchRate: res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      excutive: res['data'].exeName,
      includeExpenses: res['data'].includeExpenses,
      lpoNo: res['data'].lpoNo,
      invDay: res['data'].invDay,
      applyVAT: res['data'].applyVAT,
      isRentInvoice: res['data'].isRentInvoice,
      invPeriodicityName: res['data'].invPeriodicity,
      remarks: res['data'].remarks,
      invMonth: res['data'].rentMonth.toString(),
      invYear: res['data'].rentYear,
      dueDate: res['data'].dueDate,
      invFromDate: res['data'].invFromDate,
      invToDate: res['data'].invToDate,
      penaltyDay: res['data'].penaltyPerDay,
      property: res['data'].property,
      block: res['data'].block,
      flat: res['data'].unitName,
      isFull: res['data'].isFull,
      transferAmount: res['data'].transferAmount,
      transferTo: res['data'].transferTo,
      miscellaneous:res['data'].isMiscInvoice
    });

    this.invCls.tenant = res['data'].tenant;
    this.custCode = res['data'].custCode;
    this.invPeriodicity = res['data'].invPeriodicity;
    this.flatCode = res['data'].unit;
    this.tranStatus = res['data'].tranStatus;
    this.amountExclVat = res['data'].rentalCharges;
    this.charges = res['data'].othrCharges;
    this.discAmount = res['data'].discAmount;
    this.vatAmount = res['data'].vatAmount;
    this.totalAmount = res['data'].totalCharges;
  }
 async getInvoiceData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink =await this.saleService.getTenantInvoiceHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.bindFormData(res);
          if (mode != "View" && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
            this.textMessageClass = "green";
          }
          else {
            this.displayMessage("Success: " + res.message, "green");
            // this.handleSuccess(res);
          }
        }
        else {
          this.loader.stop();
          // this.handleError(res);
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage("Exception: " + ex.message, "red");
      // this.handleError(ex);
    }
  }
  // updateExchangeRate(event: Event): void {
  //   const value = parseFloat((event.target as HTMLInputElement).value);
  //   this.saleForm.get('exchRate')?.patchValue(isNaN(value) ? null : value);
  // }
  formatDates(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }
 async onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "TENANT",
      item: this.saleForm.controls['customer'].value || ""
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.controls['customer'].patchValue(res.data.selName);
            // this.invCls.tenantName = res.data.selName;
            // this.invCls.tenant = res.data.selCode;
            this.invCls.unit = res.data.selCode
            // this.custCode = res.data.selCode;
            if ( this.invCls.unit) {
              this.fetchTenantData();
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleForm.controls['customer'].value || "", 'PartyType': "TENANT",
                  'search': 'Tenant Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.retMessage = "";
                this.textMessageClass = "";
                this.saleForm.controls['customer'].patchValue(result.partyName);
                this.custCode = result.code;
                // this.invCls.tenantName = result.partyName
                this.invCls.unit = result.selCode
                // this.invCls.tenant = result.code;
                if (this.invCls.unit) {
                  this.fetchTenantData();
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
          // this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
      // this.handleError(ex);
    }
  }

 async onTransferSearch() {
    const body = {
      ...this.commonParams(),
      Type: "TENANT",
      item: this.saleForm.controls['transferTo'].value || ""
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.controls['transferTo'].patchValue(res.data.selName);
            this.invCls.transferTo = res.data.selCode;
            if (this.invCls.transferTo === this.invCls.tenant) {
              this.displayMessage("Error: Transfer To cannot be same as Tenant", "red");
              return;
            }

          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleForm.controls['transferTo'].value || "", 'PartyType': "TENANT",
                  'search': 'Transfer to search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.retMessage = "";
                this.textMessageClass = "";
                this.saleForm.controls['transferTo'].patchValue(result.partyName);
                this.invCls.transferTo = result.code;
                this.dialogOpen = false;
                if (this.invCls.transferTo === this.invCls.tenant) {
                  this.displayMessage("Error: Transfer To cannot be same as Tenant", "red");
                  return;
                }
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
          // this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
      // this.handleError(ex);
    }
  }

async  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      PartyName: this.saleForm.controls['excutive'].value
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.controls['excutive'].patchValue(res.data.selName);
            this.invCls.exeName = res.data.selName;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleForm.controls['excutive'].value, 'PartyType': "Employee",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.saleForm.controls['excutive'].patchValue(result.partyName);
                this.salesExecCode = result.code;
                this.invCls.exeName = result.partyName;
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
          // this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
      // this.handleError(ex);
    }
  }

  clear() {
    this.saleForm = this.formInit();
    this.tranStatus = "";
    this.totalAmount = 0.00;
    this.amountExclVat = 0.00;
    this.vatAmount = 0.00;
    this.charges = 0.00;
    this.textMessageClass = "";
    this.retMessage = "";
    this.custCode = "";
    this.salesExecCode = "";
    this.newTranMsg = "";
    this.data = [];
    if (this.props.length === 1) {
      this.saleForm.get('property')!.patchValue(this.props[0].itemCode);
      this.onSelectedPropertyChanged();
    }
    this.refershData();
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  sendEmail() {
    this.generatePDF("Email");
  }

  downloadPDF() {
    this.generatePDF("Download");
  }

 async generatePDF(type: string) {
    const reportBody = {
      ...this.commonParams(),
      LangId: this.userDataService.userData.langId,
      TranNo: this.saleForm.get('tranNo')!.value
    }
    this.loader.start();
    this.subSink.sink =await this.projService.GetReportTenantInvoice(reportBody).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === "SUCCESS") {
        if (type.toUpperCase() === "EMAIL") {
          const mailTo = res.data[0].emailId;
          if(mailTo){
            const formFile: any = this.reportsService.generatePDF(res.data, 'Invoice', new Date(), type);
            const mailToName = res.data[0].tenantName;
            const mailSubject = 'Invoice : ' + res.data[0].invoiceNo;
            const mailMsg = 'Dear ' + res.data[0].tenantName + ', find the invoice attached for the month of ' + res.data[0].tranYear.toString() + '-' + res.data[0].tranMonthName + '.';

            this.subSink.sink = this.projService.sendEmailWithAttachment(formFile, mailTo, mailToName, mailSubject, mailMsg)
              .subscribe(response => {
                this.displayMessage("Success: Email sent successfully.", "green");
                // this.retMessage = "Email sent successfully";
                // this.textMessageClass = "green";
              }, error => {
                this.displayMessage("Error: " + error.message, "red");
              });
            this.displayMessage("Success: " + res.message, "green");
          }
          else{
            this.displayMessage("No registered email address found for the client. Please update the contact information.", "red");

          }

          // }
        }
        else {
          this.reportsService.generatePDF(res.data, 'Invoice', new Date(), type);
        }

      }
      else {
        this.displayMessage("Error: " + res.message, "red");
      }
    })
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.saleForm.controls['mode'].value, tranNo: this.saleForm.controls['tranNo'].value, search: 'Invoice Docs', tranType: "DIRINV" }
    });

  }
  onCheckboxChange(controlName: string) {
    const controls = this.saleForm.controls;

    if (controlName === 'applyVAT') {
      // No additional actions for "Apply VAT" checkbox since it can be independent
    } else if (['miscellaneous', 'includeExpenses', 'isRentInvoice'].includes(controlName)) {
      // Uncheck the others when one of these grouped checkboxes is checked
      ['miscellaneous', 'includeExpenses', 'isRentInvoice'].forEach(name => {
        if (name !== controlName) {
          controls[name].setValue(false);
        }
      });
    }
  }
 async onSelectedPropertyChanged() {
  
    this.saleForm.controls.flat.patchValue('');
    if (this.saleForm.controls.property.value != "") {
      this.blocks = [];
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = this.saleForm.controls.property.value;
      this.saleForm.controls.property.value;
      try {
        this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
          if (result.status.toUpperCase() === 'SUCCESS') {
            this.blocks = result.data;
            if (this.blocks.length === 1) {
              this.saleForm.controls.block.patchValue(this.blocks[0].itemCode);
            }
          } else {
            // this.handleError(result.message);
            this.displayMessage("Error: " + result.message, "red");
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
        // this.handleError(ex.message);
      }
    }


  }

  onSelectedBlockChanged() {
    this.saleForm.controls.flat.patchValue('');
  }

async  onFlatSearch() {
    this.retMessage = ""
    this.textMessageClass = "";
    if (this.saleForm.get('property')!.value === "" || this.saleForm.get('property')!.value === undefined) {
      this.retMessage = "Select Valid Property!"
      this.textMessageClass = "red";
      return;
    }
    if (this.saleForm.get('block')!.value === "" || this.saleForm.get('block')!.value === undefined) {
      this.retMessage = "Select Valid Block!"
      this.textMessageClass = "red";
      return;
    }
    const body = {
      ...this.commonParams(),
      Type: 'FLAT',
      Item: this.saleForm.controls['flat'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.saleForm.controls['flat'].patchValue(res.data.selName);
            this.masterParams.item = res.data.selCode;
            this.flatCode = res.data.selCode;
            // this.invCls.tenant = res.data.selCode;
            if (this.flatCode) {
              this.fetchTenantData();
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'flat': this.saleForm.controls['flat'].value, 'type': 'FLAT',
                  'search': 'Flat Search', property: this.saleForm.controls['property'].value, block: this.saleForm.controls['block'].value,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.saleForm.controls['flat'].patchValue(result.unitName);
                  this.masterParams.item = result.unitId;
                  this.flatCode = result.unitId;
                  this.saleForm.controls['customer'].patchValue(result.tenant);
                  this.invCls.tenantName = result.tenant;
                  this.invCls.tenant = result.currentTenant;
                  if (this.invCls.tenant) {
                    this.fetchTenantData();
                  }
                }
              });
            }
          }
        }
        else {
          // this.handleError(res);
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST913",
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
        'tranNo': tranNo,
        'mode': this.saleForm.controls['mode'].value,
        'note': this.saleForm.controls['remarks'].value,
        'TranType': "TENINV",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Invoice Notes"
      }
    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "TENINV",
        'tranNo': tranNo,
        'search': 'Invoice Logs'
      }
    });
  }
}
