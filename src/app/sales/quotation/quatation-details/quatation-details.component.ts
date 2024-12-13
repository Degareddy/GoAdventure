import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { QuatationDetails } from '../../sales.class';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-quatation-details',
  templateUrl: './quatation-details.component.html',
  styleUrls: ['./quatation-details.component.css']
})
export class QuatationDetailsComponent implements OnInit, OnDestroy {
  qtnDetForm!: FormGroup;
  retMessage: string = "";
  retNum!: number;
  textMessageClass: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  rowData: any = [];
  slNum: number = 0;
  subSink: SubSink = new SubSink();
  private qtnCls: QuatationDetails = new QuatationDetails();
  public rowSelection: 'single' | 'multiple' = 'multiple';
  quatationcolumnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "product", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, width: 120 },
  {
    field: "unitRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
        }
      }
      return null;
    },
  },
  {
    field: "vatRate", headerName: "VAT Rate", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "discRate", headerName: "Disc Rate", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "netRate", headerName: "Net rate", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  // { field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, width: 120 },
  {
    field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    //
  ];
  dailogchange: boolean = false;
  prodCode: string = "";
  vatRate: number = 0;

  constructor(private fb: FormBuilder, private userDataService: UserDataService, private utldservice: UtilitiesService,
    protected saleService: SalesService, private loader: NgxUiLoaderService,
    private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string },) {
    this.qtnDetForm = this.formInit();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();

  }
  formInit() {
    return this.fb.group({
      prodCode: ['', [Validators.required, Validators.maxLength(50)]],
      uom: [{ value: '', disabled: true }],
      unitRate: ['0.00'],
      discRate: ['0.00'],
      vatRate: [{ value: '0.00', disabled: true }],
      netRate: ['0.00'],
      quantity: ['0'],
      amount: ['0.00'],
    })
  }
  ngOnInit(): void {
    if (this.data.tranNo) {
      this.getQuotatinDetails(this.data.tranNo);
    }
    else {
      this.retMessage = "Select Tran number from header data!";
      this.textMessageClass = "red";
    }
  }
  getQuotatinDetails(tranNo: string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID,
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.getQuotationDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res.data;
      }
      else {
        this.rowData = [];
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  prepareDetailsCls() {
    this.qtnCls.company = this.userDataService.userData.company;
    this.qtnCls.location = this.userDataService.userData.location;
    this.qtnCls.langID = this.userDataService.userData.langId;
    this.qtnCls.refNo = this.userDataService.userData.sessionID;
    this.qtnCls.user = this.userDataService.userData.userID;
    this.qtnCls.product = this.prodCode;
    this.qtnCls.productName = this.qtnDetForm.get('prodCode')?.value;
    this.qtnCls.uom = this.qtnDetForm.get('uom')?.value;
    this.qtnCls.tranNo = this.data.tranNo;
    this.qtnCls.quantity = parseFloat(this.qtnDetForm.get('quantity')?.value.replace(/,/g, ''));
    this.qtnCls.unitRate = parseFloat(this.qtnDetForm.get('unitRate')?.value.replace(/,/g, ''));
    this.qtnCls.vatRate = parseFloat(this.qtnDetForm.get('vatRate')?.value.replace(/,/g, ''));
    this.qtnCls.amount = parseFloat(this.qtnDetForm.get('amount')?.value.replace(/,/g, ''));
    this.qtnCls.discRate = parseFloat(this.qtnDetForm.get('discRate')?.value.replace(/,/g, ''));
    this.qtnCls.netRate = parseFloat(this.qtnDetForm.get('netRate')?.value.replace(/,/g, ''));
    this.qtnCls.slNo = this.slNum || 0;
    this.qtnCls.mode = this.data.mode;

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
      if (dialogResult) {
        this.data.mode = "Delete";
        this.onUpdate();
        // this.Clear();
      }
    });
  }
  onUpdate() {
    this.clearMsgs();
    if (this.qtnDetForm.invalid) {
      this.retMessage = "Enter all mandatory fields!";
      this.textMessageClass = "red";
      return;
    }
    else {
      this.prepareDetailsCls();
      try {
        this.loader.start();
        this.subSink.sink = this.saleService.updateQuotationDetails(this.qtnCls).subscribe((res: SaveApiResponse) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.getQuotatinDetails(res.tranNoNew);
            this.dailogchange = true;
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
            this.dailogchange = false;
          }
        })
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
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
  onProductSearch() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.qtnDetForm.controls['prodCode'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utldservice.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.nameCount === 1) {
          this.qtnDetForm.get('prodCode')!.patchValue(res.data.selName);
          this.qtnDetForm.get('code')!.patchValue(res.data.selCode);
          this.prodCode = res.data.selCode;

        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.qtnDetForm.get('prodCode')!.value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            let numNetRate: number = 0;
            this.vatRate = result.vatRate;
            this.prodCode = result.prodCode

            if (this.vatRate != 0) {
              numNetRate = result.stdPurRate * (1 + this.vatRate / 100.0);
            }
            else {
              numNetRate = result.stdPurRate;
            }
            this.qtnDetForm.controls['prodCode'].patchValue(result.prodName);
            this.qtnDetForm.controls['uom'].patchValue(result.uom);
            this.qtnDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.qtnDetForm.controls['vatRate'].patchValue(result.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.qtnDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.qtnDetForm.controls['quantity'].patchValue("1");
            this.qtnDetForm.controls['amount'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  Clear() {
    this.qtnDetForm = this.formInit();
    this.clearMsgs();
    this.slNum = 0;
  }
  reset() {
  }
  onRowSelected(event: any) {
  }
  onGridReady(event: any) {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    const gridApi = event.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }
  onRowClick(row: any) {
    // this.qtnDetForm.patchValue(row.data);
    this.slNum = row.data.slNo;
    this.prodCode = row.data.product;
    this.qtnDetForm.patchValue({
      prodCode: row.data.productName,
      uom: row.data.uom,
      unitRate: row.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      discRate: row.data.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: row.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: row.data.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: row.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: row.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onDiscountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;
    let strUnitRate = this.qtnDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.qtnDetForm.controls['discRate'].value.toString();
    let strQty = this.qtnDetForm.controls['quantity'].value.toString();

    if (strUnitRate == "" || strQty == "") {
      return;
    }
    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

    if (this.vatRate) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + this.vatRate / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }

    numAmount = numNetRate * numQty;
    this.qtnDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }


  onNetRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.qtnDetForm.controls['unitRate'].value.toString();
    let strNetRate = this.qtnDetForm.controls['netRate'].value.toString();
    let strQty = this.qtnDetForm.controls['quantity'].value.toString();

    if (strNetRate == "" || strUnitRate == "" || strQty == "") {
      return;
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

    if (this.vatRate) {
      numDiscRate = (numUnitRate * (1 + this.vatRate / 100.0) - numNetRate) / (numUnitRate * (1 + this.vatRate / 100.0)) * 100.0;
    }
    else {
      numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;
      if (this.vatRate) {
        numUnitRate = numNetRate / (1 + this.vatRate / 100.0);
      }
      else {
        numUnitRate = numUnitRate;
      }

    }
    numAmount = numNetRate * numQty;
    this.qtnDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['discRate'].patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.qtnDetForm.controls['netRate'].value.toString();
    let strQty = this.qtnDetForm.controls['quantity'].value.toString();
    if (strNetRate == "" || strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;
    this.qtnDetForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.qtnDetForm.controls['amount'].patchValue(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  onAmountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.qtnDetForm.controls['unitRate'].value.toString();
    let strAmount = this.qtnDetForm.controls['amount'].value.toString();
    let strQty = this.qtnDetForm.controls['quantity'].value.toString();

    if (strAmount == "" || strUnitRate == "" || strQty == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numAmount = Number(strAmount.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    numNetRate = numAmount / numQty;
    if (this.vatRate) {
      numDiscRate = (numUnitRate * (1 + this.vatRate / 100.0) - numNetRate) / (numUnitRate * (1 + this.vatRate / 100.0)) * 100.0;
    }
    else {
      numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;
      if (this.vatRate) {
        numUnitRate = numNetRate / (1 + this.vatRate / 100.0);
      }
      else {
        numUnitRate = numUnitRate;
      }
    }
    this.qtnDetForm.get('unitRate')!.patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.get('discRate')!.patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.get('netRate')!.patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.get('amount')!.patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onUnitRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.qtnDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.qtnDetForm.controls['discRate'].value.toString();
    let strQty = this.qtnDetForm.controls['quantity'].value.toString();

    if (strUnitRate == "" || strQty == "") {
      return;
    }
    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    if (this.vatRate) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + this.vatRate / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }
    numAmount = numNetRate * numQty;


    this.qtnDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.qtnDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  }

}
