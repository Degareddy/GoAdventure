import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { PurchaseOrderDetails } from 'src/app/purchase/purchase.class';
import { UserDataService } from 'src/app/Services/user-data.service';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-purchasedetails',
  templateUrl: './purchase-order-details.component.html',
  styleUrls: ['./purchase-order-details.component.css']
})
export class PurchaseorderdetailsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  purDet!: PurchaseOrderDetails;
  retMessage!: string;
  textMessageClass!: string;
  purDetForm!: FormGroup;
  slNum!: number;
  prodCode!: string;
  units!: string;
  vatRate!: number;
  dataSource: any;
  rowValue!: number;
  private subSink!: SubSink;
  mode!: string;
  status!: string;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  dataFlag: boolean = false;
  public exportTmp: boolean = true;
  public excelName: string = "";
  selectedRowIndex: number = -1;
  returnMsg!: string;

  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 70 },
  { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 180, },
  { field: "uom", headerName: "UOM", resizable: true, flex: 1 },
  {
    field: "unitRate", headerName: "Unit Rate", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "discPer", headerName: "Disc%", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "vatRate", headerName: "Vat Rate", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "netRate", headerName: "Net Rate", filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "quantity", headerName: "Quantity", filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "receivedQty", headerName: "Recieve Qty", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "rowValue", headerName: "Amount", resizable: true, flex: 1, type: 'rightAligned',
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
  }
  ];

  constructor(protected purchorddetervice: PurchaseService,
    private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private utlService: UtilitiesService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string, applyVat: boolean }) {
    this.masterParams = new MasterParams();
    this.purDetForm = this.formInit();
    this.subSink = new SubSink();
    this.purDet = new PurchaseOrderDetails();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  onDelete() {
    // this.data.mode ="Delete";
    this.mode = "Delete";
    this.onSubmit();
  }
  formInit() {
    return this.fb.group({
      prodName: ['', [Validators.required, Validators.maxLength(300)]],
      // uom: ['', [Validators.required, Validators.maxLength(10)]],
      unitRate: ['0', [Validators.required]],
      discPer: ['0'],
      vatRate: ['0'],
      netRate: ['0', [Validators.required]],
      quantity: ['0', [Validators.required]],
      receivedQty: [{ value: '0', disabled: true }],
      rowValue: ['0', [Validators.required]],
    });
  }

  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    //console.log(event.data);
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  ngOnInit(): void {

    this.mode = this.data.mode;
    this.status = this.data.status;
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    if (this.data.tranNo) {
      this.getPOData(this.data.tranNo);
    }
    else {
      this.data.tranNo = "";
      this.getPOData(this.data.tranNo);
    }
  }

  newItem() {
    this.slNum = 0;
    this.rowValue = 0;
    this.prodCode = "";
    this.purDetForm.controls['prodName'].patchValue("");
    // this.purDetForm.controls['uom'].patchValue("");
    this.units = '';
    this.purDetForm.controls['unitRate'].patchValue("");
    this.purDetForm.controls['discPer'].patchValue("0");
    this.vatRate = 0;
    this.purDetForm.controls['netRate'].patchValue("0");
    this.purDetForm.controls['quantity'].patchValue("1.00");
    this.purDetForm.controls['receivedQty'].patchValue("0");
    this.purDetForm.controls['rowValue'].patchValue("0");
    this.retMessage = '';
  }

  getPOData(tarnNo: any) {
    this.masterParams.tranNo = tarnNo;

    // //console.log(this.masterParams);
    try {
      this.loader.start();
      this.subSink.sink = this.purchorddetervice.getPurchaseDetailsData(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.handleChargeSuccess(res);
        } else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      // //console.log(ex);
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }

  }
  handleChargeSuccess(res: any) {
    this.rowData = res.data || [];
    // if (this.data.mode !== "Delete" && this.slNum === 0) {
    //   const maxSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
    //     return Math.max(maxSlNo, currentItem.slNo);
    //   }, 0);
    //   this.slNum = maxSlNo;
    // } else if (this.data.mode === "Delete" && this.slNum !== 0) {
    //   this.slNum = 0;
    //   this.purDetForm = this.formInit();
    //   this.retMessage = this.returnMsg || '';
    //   this.textMessageClass = "green";
    // }
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.purDetForm.controls['prodName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.status.toUpperCase() != "FAIL") {
        if (res && res.data && res.data.nameCount === 1) {
          this.purDetForm.controls['prodName'].patchValue(res.data.selName);
          this.prodCode = res.data.selCode;
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.purDetForm.controls['prodName'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.prodCode = result.prodCode;
              this.purDetForm.controls['prodName'].patchValue(result.prodName);
              this.units = result.uom;
              this.purDetForm.controls['unitRate'].patchValue(result.stdPurRate);
              this.purDetForm.controls['discPer'].patchValue(0);
              this.vatRate = result.vatRate;

              let numNetRate: number = 0;
              if (this.data.applyVat) {
                numNetRate = result.stdPurRate * (1 + this.vatRate / 100.0);
              }
              else {
                numNetRate = result.stdPurRate;
              }
              this.purDetForm.controls['netRate'].patchValue(numNetRate);
              this.purDetForm.controls['quantity'].patchValue(1.00);
              this.purDetForm.controls['receivedQty'].patchValue(0);
              this.purDetForm.controls['rowValue'].patchValue(numNetRate);
              this.formatNumbers();
            }
          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }

  onRowClick(row: any) {
    // //console.log(row, i);
    // this.selectedRowIndex = i;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.slNum = row.slNo;
    this.rowValue = row.rowValue;
    this.prodCode = row.prodCode;

    //  this.purDetForm.patchValue(row);
    this.purDetForm.controls['prodName'].patchValue(row.prodName);
    this.units = row.uom;
    this.vatRate = row.vatRate;
    this.purDetForm.controls['unitRate'].patchValue(row.unitRate.toLocaleString(undefined, options));
    this.purDetForm.controls['discPer'].patchValue(row.discPer.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(row.netRate.toLocaleString(undefined, options));
    this.purDetForm.controls['quantity'].patchValue(row.quantity.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(row.rowValue.toLocaleString(undefined, options));
  }
  prepareDetCls() {
    this.purDet.company = this.userDataService.userData.company;
    this.purDet.location = this.userDataService.userData.location;
    this.purDet.langCode = this.userDataService.userData.langId;
    this.purDet.mode = this.mode;
    this.purDet.user = this.userDataService.userData.userID;
    this.purDet.refNo = this.userDataService.userData.sessionID;
    this.purDet.tranNo = this.masterParams.tranNo;
    this.purDet.slNo = this.slNum;
    this.purDet.prodCode = this.prodCode;
    this.purDet.prodName = this.purDetForm.controls['prodName'].value;
    this.purDet.uom = this.units;
    this.purDet.unitRate = Number(this.purDetForm.controls['unitRate'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.purDet.discPer = Number(this.purDetForm.controls['discPer'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.purDet.vATRate = this.vatRate;
    this.purDet.netRate = Number(this.purDetForm.controls['netRate'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.purDet.quantity = Number(this.purDetForm.controls['quantity'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.purDet.receivedQty = Number(this.purDetForm.controls['receivedQty'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.purDet.rowValue = Number(this.purDetForm.controls['rowValue'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
  }

  onSubmit() {
    if (this.purDetForm.valid) {
      this.prepareDetCls();
      this.loader.start();
      this.subSink.sink = this.purchorddetervice.updatePurchaseOrderDetails(this.purDet).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === 'FAIL' || res.status.toUpperCase() === 'ERROR' || res.status.toUpperCase() === 'WARNING') {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.getPOData(this.masterParams.tranNo);
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.purDetForm = this.formInit();
          this.slNum = 0;
          this.vatRate = 0;
          this.units = "";
        }
      });
    }
  }

  onUnitRateGotFocus() {
    let numUnitRate: number;
    let strUnitRate = this.purDetForm.controls['unitRate'].value.toString();
    numUnitRate = Number(strUnitRate.replace(/,(?=\d*\.\d*)/g, ''));
    this.purDetForm.controls['unitRate'].patchValue(numUnitRate.toString());
  }

  onUnitRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.purDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.purDetForm.controls['discPer'].value.toString();
    let strQty = this.purDetForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,(?=\d*\.\d*)/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));

    if (this.data.applyVat) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + this.vatRate / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }

    numAmount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(numAmount.toLocaleString(undefined, options));

  }

  onDiscountGotFocus() {
    let numDiscPer: number;
    let strDiscPer = this.purDetForm.controls['discPer'].value.toString();
    numDiscPer = Number(strDiscPer.replace(/,(?=\d*\.\d*)/g, ''));
    this.purDetForm.controls['discPer'].patchValue(numDiscPer.toString());
  }

  onDiscountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.purDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.purDetForm.controls['discPer'].value.toString();
    let strQty = this.purDetForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,(?=\d*\.\d*)/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));

    if (this.data.applyVat) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + this.vatRate / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }

    numAmount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  onNetRateGotFocus() {
    let numNetRate: number;
    let strNetRate = this.purDetForm.controls['netRate'].value.toString();
    numNetRate = Number(strNetRate.replace(/,(?=\d*\.\d*)/g, ''));
    this.purDetForm.controls['netRate'].patchValue(numNetRate.toString());
  }

  onNetRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.purDetForm.controls['unitRate'].value.toString();
    let strNetRate = this.purDetForm.controls['netRate'].value.toString();
    let strQty = this.purDetForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strNetRate == "") {
      return;
    }

    numUnitRate = Number(strUnitRate.replace(/,(?=\d*\.\d*)/g, ''));
    numNetRate = Number(strNetRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));

    if (this.data.applyVat) {
      numDiscRate = (numUnitRate * (1 + this.vatRate / 100.0) - numNetRate) / (numUnitRate * (1 + this.vatRate / 100.0)) * 100.0;
    }
    else {
      numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;

      if (this.data.applyVat) {
        numUnitRate = numNetRate / (1 + this.vatRate / 100.0);
      }
      else {
        numUnitRate = numUnitRate;
      }

    }
    numAmount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.purDetForm.controls['discPer'].patchValue(numDiscRate.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.purDetForm.controls['netRate'].value.toString();
    let strQty = this.purDetForm.controls['quantity'].value.toString();
    if (strNetRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));
    let amount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purDetForm.controls['quantity'].patchValue(numQty.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(amount.toLocaleString(undefined, options));
  }

  onAmountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.purDetForm.controls['unitRate'].value.toString();
    let strAmount = this.purDetForm.controls['rowValue'].value.toString();
    let strQty = this.purDetForm.controls['quantity'].value.toString();

    if (strAmount == "") {
      return;
    }
    if (strUnitRate == "") {
      return;
    }

    if (strQty == "") {
      return;
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numAmount = Number(strAmount.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    numNetRate = numAmount / numQty;

    if (this.data.applyVat) {
      numDiscRate = (numUnitRate * (1 + this.vatRate / 100.0) - numNetRate) / (numUnitRate * (1 + this.vatRate / 100.0)) * 100.0;
    }
    else {
      numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;

      if (this.data.applyVat) {
        numUnitRate = numNetRate / (1 + this.vatRate / 100.0);
      }
      else {
        numUnitRate = numUnitRate;
      }

    }
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.purDetForm.controls['discPer'].patchValue(numDiscRate.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  formatNumbers() {
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.purDetForm.controls['unitRate'].patchValue(this.purDetForm.controls['unitRate'].value.toLocaleString(undefined, options));
    this.purDetForm.controls['netRate'].patchValue(this.purDetForm.controls['netRate'].value.toLocaleString(undefined, options));
    this.purDetForm.controls['quantity'].patchValue(this.purDetForm.controls['quantity'].value.toLocaleString(undefined, options));
    this.purDetForm.controls['rowValue'].patchValue(this.purDetForm.controls['rowValue'].value.toLocaleString(undefined, options));
  }
}
