import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { TransactionDetails } from '../../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Company, displayMsg, ExpenseType, Items, TextClr, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-extended-details',
  templateUrl: './extended-details.component.html',
  styleUrls: ['./extended-details.component.css']
})
export class ExtendedDetailsComponent implements OnInit, OnDestroy {
  updateBillsForm!: FormGroup;
  serviceTypes: Item[] = [
    { itemCode: 'Water Meter', itemName: 'Water Meter' },
  ]
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "serviceTypeDesc", headerName: "Service Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "prevRdg", headerName: "Prev Reading", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "currRdg", headerName: "Current Reading", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "unitCount", headerName: "Unit Count", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "rate", headerName: "Rate", sortable: true, filter: true, resizable: true, flex: 1,
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
  ];
  modes: Item[] = [
    {itemCode:'View',itemName:'View'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'}
  ];
  rowData: any = [];
  isAltered: boolean = false;
  expenseTypes: any = [];
  gridOptions!: GridOptions;
  private subSink: SubSink;
  private tranCls: TransactionDetails;
  rowSelection: any;
  pageSize = 25;
  slNo: number = 0;
  pageSizes = [25, 50, 100, 250, 500];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  retMessage: string = "";
  textMessageClass: string = "";
  previousReading: number = 0;
  tenantName: string = "";
  lastReading: string = ""
  constructor(
    private fb: FormBuilder, private masterService: MastersService, private projService: ProjectsService, private loader: NgxUiLoaderService,
    private dialogRef: MatDialogRef<ExtendedDetailsComponent>, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, property: string, block: string, unit: string }
  ) {
    this.formInit();
    this.subSink = new SubSink();
    this.tranCls = new TransactionDetails();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
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
  Clear() {
    this.rowData = [];
    this.displayMessage("", "");
    this.slNo = 0;
    this.formInit();
    this.previousReading = 0;
    this.tenantName = "";
    this.lastReading = '';
  }

  onPageSizeChanged() {

  }
  ngOnInit(): void {
    this.updateBillsForm.get('mode')?.patchValue(this.data.mode)
    this.loadData();
    if (this.data.tranNo) {
      this.getExtendedDet();
    }
  }
  formInit() {
    this.updateBillsForm = this.fb.group({
      serviceType: ['', Validators.required],
      mode:[''],
      expenseType: ['', Validators.required],
      reading: ['0', Validators.required],
      unit: [{ value: '0', disabled: true }],
      rate: ['0.00', Validators.required],
      amount: [{ value: '0.00', disabled: false }],
      prevReading: [{ value: '', disabled: true }]
    });
  }
  expenseChange(event: any) {
    if (event.value === ExpenseType.WM) {
      this.updateBillsForm.get('expenseType')?.patchValue(ExpenseType.WATEXP, { emitEvent: false });
    }
    else if (event.value === ExpenseType.ESN) {
      this.updateBillsForm.get('expenseType')?.patchValue(ExpenseType.ELECEXP, { emitEvent: false });
    }
    this.serviceChange(event.value);
  }
  serviceChange(event: any) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      itemType2: this.updateBillsForm.get('serviceType')?.value,
      PropCode: this.data.property,
      BlockCode: this.data.block,
      UnitCode: this.data.unit,
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    try {
      this.subSink.sink = this.projService.GetUnitWaterMeterRdg(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.previousReading = res.data.prevRdg;
          this.updateBillsForm.get('prevReading')?.patchValue(res.data.prevRdg);
          this.updateBillsForm.get('rate')?.patchValue(res.data.unitRate);
          this.tenantName = res.data.tenant;
          this.lastReading = res.data.prevRdgDate
          this.updateBillsForm.get('expenseType')?.disable();
          // if (this.userDataService.userData.company.toUpperCase() === Company.SADASA) {
          //   this.updateBillsForm.get('reading')?.patchValue(this.lastReading + 1);
          // }
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
  loadData() {
    const servBill = this.createRequestData(TranType.EXTDBILL);
    const expenseList = this.createRequestData(Items.SERNUMBER);
    try {
      const property$ = this.masterService.GetMasterItemsList(servBill);
      const expenses$ = this.masterService.GetMasterItemsList(expenseList);
      this.subSink.sink = forkJoin([property$, expenses$]).subscribe(
        ([serRes, expRes]: any) => {
          if (serRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.serviceTypes = serRes.data;
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Service list empty!", TextClr.red);
          }
          if (expRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.expenseTypes = expRes.data;
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Expense types list empty!", TextClr.red);
          }
        },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );
    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  getExtendedDet() {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      tranNo: this.data.tranNo
    }
    try {
      this.subSink.sink = this.projService.GetExtendedBillsDetInfo(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res.data;
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
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onCancel() {

  }
  prepareCls() {
    this.tranCls.mode = this.updateBillsForm.get('mode')?.value;
    this.tranCls.company = this.userDataService.userData.company;
    this.tranCls.location = this.userDataService.userData.location;
    this.tranCls.user = this.userDataService.userData.userID;
    this.tranCls.refNo = this.userDataService.userData.sessionID;
    this.tranCls.tranNo = this.data.tranNo;
    this.tranCls.slNo = this.slNo;
    this.tranCls.serviceType = this.updateBillsForm.get('serviceType')?.value;
    this.tranCls.expenseType = ExpenseType.WATERM;
    this.tranCls.PrevRdg = parseFloat(this.updateBillsForm.get('prevReading')?.value);
    this.tranCls.CurrRdg = parseFloat(this.updateBillsForm.get('reading')?.value.replace(/,/g, ''));
    this.tranCls.unitCount = parseFloat(this.updateBillsForm.get('unit')?.value.replace(/,/g, ''));
    this.tranCls.rate = parseFloat(this.updateBillsForm.get('rate')?.value.replace(/,/g, ''));
    this.tranCls.amount = parseFloat(this.updateBillsForm.get('amount')?.value.replace(/,/g, ''));
  }
  onSubmit() {
    this.displayMessage("", "");
    if (this.updateBillsForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      try {
        this.loader.start();
        this.subSink.sink = this.projService.UpdateExtendedBillsDetInfo(this.tranCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.isAltered = true;
            this.getExtendedDet();
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
  }
  onRowSelected(event: any) {
    this.slNo = event.data.slNo;
    this.previousReading = event.data.prevRdg;
    this.updateBillsForm.patchValue({
      serviceType: event.data.serviceType,
      expenseType: event.data.expenseType,
      prevReading: event.data.prevRdg.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      reading: event.data.currRdg.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      unit: event.data.unitCount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      rate: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }, { emitEvent: false });
  }
  onCurrentReadingChanged() {
    this.validateReading();
    if (this.updateBillsForm.controls['reading'].hasError('incorrect')) {
      return;
    }

    let numUnitRate: number;
    let numUnits: number;
    let numAmount: number;
    let numCurrRdg: number;

    let strUnitRate = this.updateBillsForm.controls['rate'].value.toString();
    let strCurrRdg = this.updateBillsForm.controls['reading'].value.toString();
    if (strUnitRate == "") {
      return;
    }

    if (strCurrRdg == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numCurrRdg = Number(strCurrRdg.replace(/,/g, ''));
    numUnits = numCurrRdg - this.previousReading;
    numAmount = numUnits * numUnitRate;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.updateBillsForm.controls['rate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.updateBillsForm.controls['reading'].patchValue(numCurrRdg.toLocaleString(undefined, options));
    this.updateBillsForm.controls['unit'].patchValue(numUnits.toLocaleString(undefined, options));
    this.updateBillsForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }


  validateReading() {
    this.displayMessage("","");
    const currentReadingValue = this.updateBillsForm.controls['reading'].value
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    const previousReadingValue = this.previousReading
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    if (Number(currentReadingValue) < Number(previousReadingValue)) {
      this.retMessage = "Current reading should be greater than previous reading!";
      this.textMessageClass = "red";
      this.updateBillsForm.controls['reading'].setErrors({ 'incorrect': true });
      return;
    }
  }

  onRateChanged() {
    this.validateReading();
    if (this.updateBillsForm.controls['reading'].hasError('incorrect')) {
      return;
    }
    let numUnitRate: number;
    let numUnits: number;
    let numAmount: number;
    let numCurrRdg: number;
    let strUnitRate = this.updateBillsForm.controls['rate'].value.toString();
    let strCurrRdg = this.updateBillsForm.controls['reading'].value.toString();
    if (strUnitRate == "") {
      return;
    }

    if (strCurrRdg == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numCurrRdg = Number(strCurrRdg.replace(/,/g, ''));
    numUnits = numCurrRdg - this.previousReading;
    numAmount = numUnits * numUnitRate;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.updateBillsForm.get('rate')!.patchValue(numUnitRate.toLocaleString(undefined, options));
    this.updateBillsForm.get('reading')!.patchValue(numCurrRdg.toLocaleString(undefined, options));
    this.updateBillsForm.get('amount')!.patchValue(numAmount.toLocaleString(undefined, options));
  }


}
