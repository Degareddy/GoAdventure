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

@Component({
  selector: 'app-extended-details',
  templateUrl: './extended-details.component.html',
  styleUrls: ['./extended-details.component.css']
})
export class ExtendedDetailsComponent implements OnInit, OnDestroy {
  updateBillsForm!: FormGroup;
  serviceTypes: Item[] = [
    {itemCode:'Water Meter',itemName:'Water Meter'},
  ]
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "serviceType", headerName: "Service Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "expenseType", headerName: "Expense Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
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
  rowData: any = []
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
    // throw new Error('Method not implemented.');
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
    this.previousReading=0;
    this.tenantName="";
    this.lastReading='';
  }

  onPageSizeChanged() {

  }
  ngOnInit(): void {
    this.loadData();
    if (this.data.tranNo) {
      this.getExtendedDet();
    }
  }
  formInit() {
    this.updateBillsForm = this.fb.group({
      serviceType: ['', Validators.required],
      expenseType: ['', Validators.required],
      reading: ['0', Validators.required],
      unit: [{ value: '0', disabled: true }],
      rate: ['0.00', Validators.required],
      amount: [{ value: '0.00', disabled: true }],
    });
  }
  serviceChange(event: any) {
    // console.log(event.value);
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
        // console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.previousReading = res.data.prevRdg;
          this.tenantName = res.data.tenant;
          this.lastReading = res.data.prevRdgDate
        }
        else {
          this.displayMessage(res.message, "red")
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  loadData() {
    const servBill = this.createRequestData('EXTDBILL');
    const expenseList = this.createRequestData('SERNUMBER');
    try {
      const property$ = this.masterService.GetMasterItemsList(servBill);
      const expenses$ = this.masterService.GetMasterItemsList(expenseList);
      this.subSink.sink = forkJoin([property$, expenses$]).subscribe(
        ([serRes, expRes]: any) => {
          if (serRes.status.toUpperCase() === "SUCCESS") {
            this.serviceTypes = serRes.data;
            // console.log(this.serviceTypes);
            // if (this.serviceTypes.length === 1) {

            // }
          }
          else {
            this.displayMessage("Error:Service list empty!", "red");

          }
          if (expRes.status.toUpperCase() === "SUCCESS") {
            this.expenseTypes = expRes.data;
            // console.log(this.serviceTypes);
            // if (this.serviceTypes.length === 1) {

            // }
          }
          else {
            this.displayMessage("Error:Expense types list empty! ", "red");

          }
        },
        error => {
          this.displayMessage("Error: " + error.message, "red");
        }
      );
    } catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
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
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
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
    this.tranCls.mode = this.data.mode;
    this.tranCls.company = this.userDataService.userData.company;
    this.tranCls.location = this.userDataService.userData.location;
    this.tranCls.user = this.userDataService.userData.userID;
    this.tranCls.refNo = this.userDataService.userData.sessionID;
    this.tranCls.tranNo = this.data.tranNo;
    this.tranCls.slNo = this.slNo;
    this.tranCls.serviceType = this.updateBillsForm.get('serviceType')?.value;
    this.tranCls.expenseType = this.updateBillsForm.get('expenseType')?.value;
    this.tranCls.reading = parseFloat(this.updateBillsForm.get('reading')?.value.replace(/,/g, ''));
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
          // console.log(res);
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage("Success: " + res.message, "green");
            this.getExtendedDet();
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
  }
  onRowSelected(event: any) {
    // console.log(event.data);
    this.slNo = event.data.slNo;
    this.previousReading=event.data.prevReading;
    this.updateBillsForm.patchValue({
      serviceType:event.data.serviceType,
      expenseType: event.data.expenseType,
      reading:event.data.reading.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      unit: event.data.unitCount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      rate:event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount:event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    })
  }
  onCurrentReadingChanged() {
    this.validateReading();
    if (this.updateBillsForm.controls['reading'].hasError('incorrect')) {
      return; // Do not proceed with calculation if current reading is incorrect
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
    this.retMessage = "";
    this.textMessageClass = "";
    const currentReadingValue = this.updateBillsForm.controls['reading'].value
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    const previousReadingValue = this.previousReading
      .toString()
      .replace(/,/g, '')
      .replace(/\./g, '');

    // Compare the sanitized values
    if (Number(currentReadingValue) < Number(previousReadingValue)) {
      this.retMessage = "Current reading should be greater than previous reading!";
      this.textMessageClass = "red";
      this.updateBillsForm.controls['reading'].setErrors({ 'incorrect': true });
      // this.cdr.detectChanges();
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
