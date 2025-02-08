import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { ProjectsService } from 'src/app/Services/projects.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { animate, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'app-financials',
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.css'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }), // Start off-screen to the right
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })) // Slide in to center
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' })) // Slide out to the left
      ])
    ])
  ]
})
export class FinancialsComponent implements OnInit, OnDestroy {
  financeForm!: FormGroup;
  financeForm1!: FormGroup;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  textMessageClass: string = "";
  retMessage: string = "";
  private subSink!: SubSink;
  payLandlorsList: Item[] = [{ itemCode: "PERCENT", itemName: "PERCENT" },
  { itemCode: "FLAT", itemName: "FLAT" }
  ]
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "chargeDesc", headerName: "Charge Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "charge", headerName: "Charge", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  {
    field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  { field: "discType", headerName: "Disc Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  {
    field: "discRate", headerName: "Disc Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "discAmount", headerName: "Disc Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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

  { field: "vatRate", headerName: "Vat Rate", sortable: true, filter: true, resizable: true, type: 'rightAligned', flex: 1, hide: true },
  {
    field: "vatAmount", headerName: "Vat Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "netAmount", headerName: "Net Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "reviewedOn", headerName: "Last Reviewed", sortable: true, filter: true, resizable: true, flex: 1, hide: true, valueFormatter: function (params: any) {
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return null;
    },
  },
  {
    field: "nextReviewOn", headerName: "Next Reviewed", sortable: true, filter: true, resizable: true, flex: 1, hide: true, valueFormatter: function (params: any) {
      // Format date as dd-MM-yyyy
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return null;
    },
  },
  { field: "revenueTo", headerName: "Revenue To", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "isRecurring", headerName: "Last Reviewed", sortable: true, hide: true, resizable: true, flex: 1 },
  { field: "isRefundable", headerName: "Next Reviewed", sortable: true, hide: true, resizable: true, flex: 1 }
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  onRowClick: any;
  vats: Item[] = [];
  charges: Item[] = []
  slNum: number = 0;
  tranStatus: string = "Open";
  revenueTo: string = "";
  landlordRes: any;
  returnMsg!: string;
  public totalAmount: number = 0;
  loader!: NgxUiLoaderService;
  revenueList: Item[] = [{ itemCode: "COMPANY", itemName: "Company" },
  { itemCode: "LANDLORD", itemName: "Landlord" },
  { itemCode: "LIABILITY", itemName: "Liability" },
  { itemCode: "PROPERTY", itemName: "Property" }];

  constructor(private fb: FormBuilder, public dialog: MatDialog, protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService, private projService: ProjectsService, private loaderService: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, Trantype: string, Property: string, Block: string, Flat: string, type: string, status: string }) {
    this.financeForm1 = this.formInit1();
    this.subSink = new SubSink();
  }
  ngOnDestroy() {
    this.subSink.unsubscribe();
  }
  ngAfterViewInit() {
    this.loader = this.loaderService;
  }

  formInit() {
    return this.fb.group({
      paytolandlord: ['', Validators.required],
      landrate: ['', Validators.required],
      deposit: ['', Validators.required],
      reviewedOn: [new Date(), Validators.required]
    })
  }

  formInit1() {
    return this.fb.group({
      chargeType: ['', Validators.required],
      amount: ['', Validators.required],
      discType: [''],
      discRate: [0,],
      discAmount: [{ value: 0, disabled: true }],
      vatRate: ['', Validators.required],
      vatAmount: [{ value: 0, disabled: true }],
      netAmount: [{ value: 0, disabled: true }],
      lastReviewed: [new Date(), Validators.required],
      IsRecurring: [false],
      IsRefundable: [false],
      revenueTo: ['', Validators.required],
      reviewedOn: [new Date(), Validators.required],
      nextReviewed: [new Date(), Validators.required],
    })
  }
  onChargeTypeChanged(chargeType:string){
    this.financeForm1.get('vatRate')?.patchValue('0.00');
    console.log(chargeType);
    if(chargeType === "DEPOSIT"){
      this.financeForm1.get('IsRecurring')?.setValue(false);
      this.financeForm1.get('IsRefundable')?.setValue(true);
      this.financeForm1.get('revenueTo')?.patchValue('LIABILITY');
    }
    else if(chargeType === "RENT"){
      this.financeForm1.get('IsRecurring')?.setValue(true);
      this.financeForm1.get('IsRefundable')?.setValue(false);
      this.financeForm1.get('revenueTo')?.patchValue('LANDLORD');
    }
    else{
      this.financeForm1.get('IsRecurring')?.setValue(true);
      this.financeForm1.get('IsRefundable')?.setValue(false);
      this.financeForm1.get('revenueTo')?.patchValue('PROPERTY');
    }
  }
  loadData() {
    const vatBody = { ...this.createRequestData(Items.VATRATE), mode: this.data.mode };
    const chargeBody = { ...this.createRequestData(Items.RENTCHARGE), mode: this.data.mode };
    const vat$ = this.masterService.GetMasterItemsList(vatBody);
    const charge$ = this.masterService.GetMasterItemsList(chargeBody);
    this.subSink.sink = forkJoin([vat$, charge$]).subscribe(
      ([vatRes, chargeRes]: any) => {
        this.handleVatData(vatRes);
        this.handleChargeData(chargeRes);
      },
      error => this.handleError(error.message)
    );

    this.getUnitCharges(this.data.Flat, false);
  }

  createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      refNo: this.userDataService.userData.sessionID
    };
  }

  createLandlordRequestData() {
    return {
      ...this.createRequestData(''),
      PropCode: this.data.Property,
      BlockCode: this.data.Block,
      UnitCode: this.data.Flat,
      itemType: Items.LANDLORD
    };
  }

  handleVatData(vatRes: getResponse) {
    this.vats = vatRes?.data || [];
  }

  handleChargeData(chargeRes: getResponse) {
    this.charges = chargeRes?.data || [];
  }

  handleLandlordData(landlordRes: any) {
    const data = landlordRes?.data?.[0] || {};
    this.financeForm.patchValue({
      paytolandlord: data.rentPayBy,
      landrate: data.rate,
      deposit: data.depositWithLandlord,
      reviewedOn: data.lastReviewedOn
    });
  }

  getUnitCharges(flat: string, loadFlag: boolean) {
    const body = {
      ...this.createLandlordRequestData(),
      ItemType: Items.CHARGE
    };

    this.subSink.sink = this.projService.GetUnitChargeDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.handleChargeSuccess(res, loadFlag);
      } else {
        this.handleChargeError(res);
      }
    },
      error => {
        this.loader.stop();
        this.handleError(error.message);
      }
    );
  }
  calculateTotals(data: any[]) {
    let totalAmount = 0;
    data.forEach(row => {
      const rentValue = parseFloat(row.netAmount);
      if (!isNaN(rentValue)) {
        totalAmount += rentValue;
      }
    });
    this.totalAmount = totalAmount;
  }
  handleChargeSuccess(res: any, loadFlag: boolean) {
    this.rowData = res.data || [];
    this.calculateTotals(this.rowData);
    if (loadFlag && this.data.mode.toUpperCase() !== Mode.Delete && this.slNum === 0) {
      const maxSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
        return Math.max(maxSlNo, currentItem.slNo);
      }, 0);
      this.slNum = maxSlNo;
    } else if (loadFlag && this.data.mode.toUpperCase() === Mode.Delete && this.slNum !== 0) {
      this.slNum = 0;
      this.financeForm = this.formInit();
      this.retMessage = this.returnMsg || '';
      this.textMessageClass = "green";
    }
  }

  handleChargeError(res: any) {
    if (this.returnMsg) {
      this.retMessage = this.returnMsg;
      this.textMessageClass = "green";
      this.rowData = [];
    } else {
      this.retMessage = res.message;
      this.textMessageClass = "red";
    }
  }

  ngOnInit() {
    this.loadData();
  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  apply() {
    this.clearMsgs();
    const updateData = {
      Mode: this.data.mode,
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID,
      BlockCode: this.data.Block,
      PropCode: this.data.Property,
      UnitCode: this.data.Flat,
      LastReviewedOn: this.financeForm.controls['reviewedOn'].value,
      DepositWithLandlord: this.financeForm.controls['deposit'].value,
      RentPayBy: this.financeForm.controls['paytolandlord'].value,
      Rate: this.financeForm.controls['landrate'].value
    };
    if (!this.isFormValid()) {
      this.retMessage = "Form data is invalid.";
      this.textMessageClass = "red";
      return;
    }
    this.loader.start();
    this.subSink.sink = this.projService.UpdateUnitLandlordCharge(updateData).subscribe((res: SaveApiResponse) => {
      this.loader.stop();
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.handleSuccess(res.message, res.tranNoNew);
      } else {
        this.handleError(res.message);
      }
    },
      error => {
        this.loader.stop();
        this.handleError(error.message);
      }
    );
  }

  onSubmit() {
    this.clearMsgs();
    if (this.financeForm1.invalid) {
      return;
    } else {
      const updateData = {
        blockCode: this.data.Block,
        charge: this.financeForm1.value.chargeType,
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        nextReviewOn: this.financeForm1.value.nextReviewed,
        notes: "",
        propCode: this.data.Property,
        revenueTo: this.financeForm1.value.revenueTo,
        reviewedOn: this.financeForm1.value.lastReviewed,
        slNo: this.slNum,
        tranStatus: this.tranStatus,
        unitCode: this.data.Flat,
        amount: Number(this.financeForm1.controls['amount'].value.toString().replace(',', '')),
        discType: this.financeForm1.value.discType,
        discRate: Number(this.financeForm1.controls['discRate'].value.toString().replace(',', '')),
        discAmount: Number(this.financeForm1.controls['discAmount'].value.toString().replace(',', '')),
        vatRate: Number(this.financeForm1.controls['vatRate'].value.toString().replace(',', '')),
        vatAmount: Number(this.financeForm1.controls['vatAmount'].value.toString().replace(',', '')),
        netAmount: Number(this.financeForm1.controls['netAmount'].value.toString().replace(',', '')),

        isRecurring: this.financeForm1.value.IsRecurring,
        isRefundable: this.financeForm1.value.IsRefundable,

        mode: this.data.mode,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID
      };
      try {
        this.loader.start();
        this.subSink.sink = this.projService.UpdateUnitCharges(updateData).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.handleSuccess(res.message, res.tranNoNew);
          } else {
            this.handleError(res.message);
          }
        },
          error => {
            this.loader.stop();
            this.handleError(error.message);
          }
        );
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }

  isFormValid(): boolean {
    return this.financeForm.valid;
  }

  handleSuccess(message: string, newTranNo: string) {
    this.returnMsg = message;
    this.retMessage = message;
    this.textMessageClass = "green";
    this.getUnitCharges(newTranNo, true);
  }

  handleError(message: string) {
    this.retMessage = message;
    this.textMessageClass = "red";
  }

  addNew() {
    this.clearMsgs();
    this.slNum = 0;
    this.totalAmount = 0;
    this.financeForm1 = this.formInit1();
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
      console.log(dialogResult);
      if (dialogResult) {
        this.onSubmit();
      }
    });
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    if (event.data) {
      this.slNum = event.data.slNo;
      this.tranStatus = event.data.tranStatus;
      this.revenueTo = event.data.revenueTo;
      let vatRate = event.data.vatRate;
      if (typeof vatRate === 'string' && vatRate.endsWith('.00')) {
      } else {
        vatRate += '.00';
      }
      this.financeForm1.patchValue({
        chargeType: event.data.charge,
        amount: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discType: event.data.discType,
        discRate: event.data.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        discAmount: event.data.discAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vatRate: vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        vatAmount: event.data.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        netAmount: event.data.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        lastReviewed: event.data.reviewedOn,
        nextReviewed: event.data.nextReviewOn,
        revenueTo: event.data.revenueTo,
        IsRecurring: event.data.isRecurring,
        IsRefundable: event.data.isRefundable
      }, { emitEvent: false });
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onAmountChanged() {
    this.doCalculation();
  }

  onDiscountRateChanged() {
    this.doCalculation();
  }

  onDiscTypeChanged(event: any) {
    this.doCalculation();
  }
  onVatRateChanged(event: any) {
    this.doCalculation();
  }

  doCalculation() {
    let numAmount: number;
    let numDiscRate: number;
    let numDiscAmount: number;
    let numVatRate: number;
    let numVatAmount: number;
    let numNetAmount: number;
    let strAmount = this.financeForm1.controls['amount'].value.toString();
    let strDiscRate = this.financeForm1.controls['discRate'].value.toString();
    let strVatRate = this.financeForm1.controls['vatRate'].value.toString();

    if (strAmount == "") {
      return;
    }

    if (strVatRate == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numAmount = Number(strAmount.replace(',', ''));
    numDiscRate = Number(strDiscRate.replace(',', ''));
    numVatRate = Number(strVatRate.replace(',', ''));

    if (this.financeForm1.controls['discType'].value.toUpperCase() == 'PERCENTAGE') {
      numDiscAmount = numAmount * numDiscRate / 100.0;
    }
    else {
      numDiscAmount = numDiscRate;
    }

    numVatAmount = (numAmount - numDiscAmount) * numVatRate / 100.00;
    numNetAmount = numAmount - numDiscAmount + numVatAmount;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.financeForm1.controls['amount'].setValue(numAmount.toLocaleString(undefined, options));
    this.financeForm1.controls['discRate'].setValue(numDiscRate.toLocaleString(undefined, options));
    this.financeForm1.controls['discAmount'].setValue(numDiscAmount.toLocaleString(undefined, options));
    this.financeForm1.controls['vatAmount'].setValue(numVatAmount.toLocaleString(undefined, options));
    this.financeForm1.controls['netAmount'].setValue(numNetAmount.toLocaleString(undefined, options));
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Items, Mode } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Pipe({
  name: 'commaSeparator'
})
export class CommaSeparatorPipe implements PipeTransform {
  transform(value: number): string {
    if (value) {

      return parseFloat(value.toString()).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

    }
    else {
      return "";
    }
  }

}
