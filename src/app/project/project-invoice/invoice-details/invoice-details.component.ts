import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { invoiceDetailClass } from '../../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.css']
})

export class InvoiceDetailsComponent implements OnInit, OnDestroy {
  invDetForm!: FormGroup;
  slNum: number = 0;
  itemsList: Item[] = [];
  vatAmount!: string;
  private invDetailCls: invoiceDetailClass
  private subSink!: SubSink;
  textMessageClass!: string;
  retMessage!: string;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  discountLabel = 'Discount';
  vatAmountLabel = 'Vat Amount';

  public gridOptions!: GridOptions;
  public vatTypes: Item[] = [];
  dataFlag: boolean = false;
  columnDefs: any = [{ field: "slNo", headerName: "Sl No", width: 80, resizable: true, },
  { field: "chargeItem", headerName: "Code", sortable: true, filter: true, resizable: true, hide: true },
  { field: "prodName", headerName: "Charge", sortable: true, filter: true, resizable: true, flex: 1, },
  {
    field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null
    },
  },
  { field: "discType", headerName: "Disc Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  {
    field: "discRate", headerName: "Disc Rate", sortable: true, filter: true, resizable: true, flex: 1, hide: true, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null
    },
  },
  {
    field: "discAmount", headerName: "Disc Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null
    },
  },
  {
    field: "vatRate", headerName: "Vat Rate", sortable: true, filter: true, resizable: true, flex: 1, hide: true, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null
    },
  },
  {
    field: "vatAmount", headerName: "Vat Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
    cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    },
  },
  {
    field: "netAmount", headerName: "Net Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
    cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    },
  },

  ];
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(public dialog: MatDialog, private fb: FormBuilder,
    private masterService: MastersService,
    private projectService: ProjectsService, private loader: NgxUiLoaderService, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, tranNo: string, status: string,
      complaintType: string, unit: string, block: string, complaint: string,
      tenant: string, priority: string, complaintTypeName: string, property: string, isMiscellaneous: boolean
    }) {
    this.subSink = new SubSink();
    this.invDetForm = this.formInit();
    this.invDetailCls = new invoiceDetailClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
    this.invDetForm.get('amount')?.valueChanges.subscribe(() => {
      this.calculateNetAmount();
    });
    this.invDetForm.get('discAmount')?.valueChanges.subscribe(() => {
      this.calculateNetAmount();
    });
    this.invDetForm.get('vatAmount')?.valueChanges.subscribe(() => {
      this.calculateNetAmount();
    });
  }

  formInit() {
    return this.fb.group({
      itemType: ['', Validators.required],
      amount: ['0.00', Validators.required],
      vatAmount: ['0.00'],
      net: ['0.00', Validators.required],
      vatType: [''],
      discType: [''],
      discRate: ['0.00'],
      discAmount: [{ value: 0.00, disabled: true }],
      isRepeat: [false]
    }, { validator: this.discRateRequired });

  }

  discRateRequired(control: AbstractControl): { [key: string]: boolean } | null {
    const discType = control.get('discType');
    const discRate = control.get('discRate');
    const vatType = control.get('vatType');
    const vatAmount = control.get('vatAmount');
    let errors = {};

    if (discType && discRate && discType.value && (!discRate.value)) {
      return { 'discRateRequired': true };
    }
    if (vatType && vatAmount && vatType.value && (!vatAmount.value)) {
      return { 'vatAmountRequired': true };
    }
    return null;
  }
  private parseCurrency(value: string): number {
    return parseFloat(value.replace(/,/g, '')) || 0;
  }

  private setCommonValues(mode: string) {
    const formValues = this.invDetForm.value;

    this.invDetailCls.company = this.userDataService.userData.company;
    this.invDetailCls.amount = this.parseCurrency(this.invDetForm.controls['net'].value);
    this.invDetailCls.ChargeItem = formValues.itemType;
    this.invDetailCls.itemRate = this.parseCurrency(this.invDetForm.controls['amount'].value);
    this.invDetailCls.location = this.userDataService.userData.location;
    this.invDetailCls.slNo = this.slNum;
    this.invDetailCls.tranNo = this.data.tranNo;
    this.invDetailCls.vatAmount = this.parseCurrency(this.invDetForm.controls['vatAmount'].value);
    this.invDetailCls.vatRate = formValues.vatType;
    this.invDetailCls.mode = mode;
    this.invDetailCls.user = this.userDataService.userData.userID;
    this.invDetailCls.refNo = this.userDataService.userData.sessionID;
    this.invDetailCls.discType = this.invDetForm.controls['discType'].value;
    this.invDetailCls.discAmount = this.parseCurrency(this.invDetForm.get('discAmount')!.value.toString());
    this.invDetailCls.discRate = this.parseCurrency(this.invDetForm.controls['discRate'].value);
    this.invDetailCls.NetAmount = this.parseCurrency(this.invDetForm.controls['net'].value);
  }

  prepareClsToDelete() {
    this.setCommonValues('Delete');
  }

  prepareCls() {
    this.setCommonValues(this.data.mode);
  }

  apply() {
    if (this.invDetForm.invalid) {
      return;
    }
    else {
      if (this.invDetForm.get('isRepeat')?.value) {
        const message = `The current invoice amount of ${this.invDetForm.controls['itemType'].value} ${this.invDetForm.controls['net'].value} will be applied to subsequent invoices.`;
        const dialogData = new ConfirmDialogModel("Confirm repeat invoice?", message);
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: "400px",
          height: '210px',
          data: dialogData,
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(dialogResult => {
          if (dialogResult != true && dialogResult === "YES") {
            this.submit();
            // return;
          }
          else {
            return;
          }
        });
      }
      else {
        this.submit()
      }

    }
  }
  itemChange(value: any) {
    const body = {
      ...this.commonParams(),
      PropCode: this.data.property,
      BlockCode: this.data.block,
      UnitCode: this.data.unit,
      chargeItem: this.invDetForm.get('itemType')?.value
    };
    try {
      this.loader.start();
      this.subSink.sink = this.projectService.getLegalChargesCalcs(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.invDetForm.get('amount')?.patchValue(res.data[0].amount);
          this.displayMessage("Success: " + res.message, "green");
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
  deleteInvDetails() {

    this.prepareClsToDelete();
    try {

      this.loader.start();
      this.subSink.sink = this.projectService.UpdateTenantInvoiceDet(this.invDetailCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {

          this.dataFlag = true;
          this.getTenantInvoiceDetails(res.tranNoNew);
          this.displayMessage("Success: " + res.message, "green");
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
  submit() {
    this.prepareCls();
    try {
      this.loader.start();
      this.subSink.sink = this.projectService.UpdateTenantInvoiceDet(this.invDetailCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.getTenantInvoiceDetails(res.tranNoNew);
          this.displayMessage("Success: " + res.message, "green");
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
  add() {
    this.slNum = 0;
    this.invDetForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.vatAmount = '0';
  }

  Delete() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult != true && dialogResult === 'YES') {
        this.deleteInvDetails();
      }
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.slNum = event.data.slNo;
    this.vatAmount = event.data.vatAmount;
    this.invDetForm.patchValue(
      {
        itemType: event.data.chargeItem,
        amount: Number(event.data.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        net: Number(event.data.netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discRate: Number(event.data.discRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discAmount: Number(event.data.discAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discType: event.data.discType,
        vatType: event.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vatAmount: event.data.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      },
      { emitEvent: false }
    );

  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
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
    try {
      let cbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'RENTCHARGE', mode: this.data.mode });
      let vatbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'VATR', mode: this.data.mode });
      if (this.data.isMiscellaneous) {
        cbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'LEGLCHARGE', mode: this.data.mode });
        vatbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'VATR', mode: this.data.mode });
      }
      this.subSink.sink = forkJoin([cbody$, vatbody$]).subscribe(
        ([chargeRes, vatRes]: any) => {
          this.itemsList = chargeRes['data'];
          if (this.itemsList.length === 1) {
            this.invDetForm.get('itemType')!.patchValue(this.itemsList[0].itemCode);
          }
          this.vatTypes = vatRes['data'];
          if (this.vatTypes.length === 1) {
            this.invDetForm.get('vatType')!.patchValue(this.vatTypes[0].itemCode);
          }
        },
        error => {
          this.displayMessage("Error: " + error.message, "red");
        }
      );
      this.getTenantInvoiceDetails(this.data.tranNo);
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  getTenantInvoiceDetails(tranNo: string) {
    const invDetBody = {
      ...this.commonParams(),
      tranNo: tranNo,
      issueStatus: this.data.status
    }
    try {
      this.subSink.sink = this.projectService.GetTenantInvoiceDet(invDetBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
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



  // doCalculation() {

  //   let numAmount: number=0;
  //   let numDiscRate: number=0;
  //   let numDiscAmount: number=0;
  //   let numVatRate: number=0;
  //   let numVatAmount: number=0;
  //   let numNetAmount: number=0;

  //   // let strAmount = value.target.value.toString();
  //   let strAmount = this.invDetForm.controls['amount'].value.toString();
  //   let strDiscRate = this.invDetForm.controls['discRate'].value.toString();
  //   let strVatRate = this.invDetForm.controls['vatRate'].value.toString();

  //   if (strAmount == "") {
  //     return;
  //   }

  //   if (strVatRate == "") {
  //     return;
  //   }

  //   if (strDiscRate == "") {
  //     strDiscRate = '0';
  //   }

  //   numAmount = Number(strAmount.replace(/,/g, ''));
  //   numDiscRate = Number(strDiscRate.replace(/,/g, ''));
  //   numVatRate = Number(strVatRate.replace(/,/g, ''));

  //   if (this.invDetForm.controls['discType'].value.toUpperCase() == 'PERCENTAGE') {
  //     numDiscAmount = numAmount * numDiscRate / 100.0;
  //   }
  //   else {
  //     numDiscAmount = numDiscRate;
  //   }

  //   numVatAmount = (numAmount - numDiscAmount) * numVatRate / 100.00;
  //   numNetAmount = numAmount - numDiscAmount + numVatAmount;

  //   let options: Intl.NumberFormatOptions = {
  //     style: 'decimal',
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2,
  //   };

  //   this.invDetForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  //   this.invDetForm.controls['discRate'].patchValue(numDiscRate.toLocaleString(undefined, options));
  //   this.invDetForm.controls['discAmount'].patchValue(numDiscAmount.toLocaleString(undefined, options));
  //   this.invDetForm.controls['vatAmount'].patchValue(numVatAmount.toLocaleString(undefined, options));
  //   this.invDetForm.controls['netAmount'].patchValue(numNetAmount.toLocaleString(undefined, options));
  // }
  onAmountChanged() {
    this.calculateNetAmount();
  }

  onDiscTypeChanged(discType: string) {
    this.calculateNetAmount();
  }

  onDiscountRateChanged() {
    this.calculateNetAmount();
  }

  onNetChanged() {
    this.calculateNetAmount();
  }

  calculateNetAmount() {

    const amount: number = parseFloat(this.invDetForm.get('amount')?.value || 0);
    const discRate: number = parseFloat(this.invDetForm.get('discRate')?.value) || 0;
    const discType: string = this.invDetForm.get('discType')?.value;
    const vatAmount: number = this.invDetForm.get('vatAmount')?.value || 0;

    let discAmount = 0;

    if (discType === 'PERCENTAGE') {
      discAmount = (amount * discRate) / 100;
    } else if (discType === 'FLAT') {
      discAmount = discRate;
    }

    this.invDetForm.get('discAmount')?.setValue(discAmount, { emitEvent: false });

    const netAmount: number = parseFloat(amount.toString()) - parseFloat(discAmount.toString()) + parseFloat(vatAmount.toString());
    this.invDetForm.get('net')?.setValue(netAmount, { emitEvent: false });
  }
}
