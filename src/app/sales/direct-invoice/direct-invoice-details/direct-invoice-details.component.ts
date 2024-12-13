import { Component, OnDestroy, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { InvoiceDetailsClass } from 'src/app/sales/sales.class';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { SalesService } from 'src/app/Services/sales.service';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-direct-invoice-details',
  templateUrl: './direct-invoice-details.component.html',
  styleUrls: ['./direct-invoice-details.component.css']
})
export class DirectInvoiceDetailsComponent implements OnInit, OnDestroy {
  invDetForm!: FormGroup;
  tranStatus!: string;
  masterParams!: MasterParams;
  tranNo!: string;
  tranType!: string;
  retMessage: string = "";
  textMessageClass: string = "";
  mode!: string;
  slNum: number = 0;
  prodCode!: string;
  private subSink!: SubSink;
  public dailogchange: boolean = false;
  slValue: boolean = false;
  invoiceDetCls: InvoiceDetailsClass;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  warehouseList: Item[] = []
  vatRate: number = 0;
  // private unitCls: unitSalesDetailsClass = new unitSalesDetailsClass();
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "product", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  // { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1, },
  {
    field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "unitRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  // {
  //   field: "discAmount", headerName: "Disc Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
  //   valueFormatter: function (params: any) {
  //     if (typeof params.value === 'number' || typeof params.value === 'string') {
  //       const numericValue = parseFloat(params.value.toString());
  //       if (!isNaN(numericValue)) {
  //         return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
  //       }
  //     }
  //     return null;
  //   },
  // },

  {
    field: "vatRate", headerName: "VAT", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "netRate", headerName: "Net Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  }
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    private utldservice: UtilitiesService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog,
    private salesService: SalesService,
    private invService: InventoryService) {
    this.invDetForm = this.formInit();
    this.subSink = new SubSink();
    this.invoiceDetCls = new InvoiceDetailsClass();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  formInit() {
    return this.fb.group({
      prodName: ['', [Validators.required, Validators.maxLength(100)]],
      uom: [{ value: '', disabled: true }],
      unitRate: ['0.00'],
      discRate: ['0.00'],
      vatRate: [{ value: '0.00', disabled: true }],
      netRate: ['0.00'],
      quantity: ['1'],
      amount: ['0.00'],
      warehouse: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    if (this.data.tranNo != "") {
      this.tranNo = this.data.tranNo;
      this.tranType = this.data.tranType;
      this.getInvoiceItemDetails(this.data);
    }
    this.mode = this.data.mode;
    this.tranStatus = this.data.status;
    const body: getPayload = {
      ...this.commonParams(),
      item: "WAREHOUSE"
    };
    this.subSink.sink = this.invService.GetMasterItemsList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.warehouseList = res.data;
      }
    });
  }


  getInvoiceItemDetails(data: any) {
    if (data.tranNo) {
      this.masterParams.tranNo = data.tranNo;
    }
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.tranType = this.data.tranType;
    try {
      this.loader.start();
      this.subSink.sink = this.salesService.getInvoiceDetailsData(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != 'FAIL') {
          this.rowData = res.data;
        } else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  prepareDetailsCls() {
    this.invoiceDetCls.mode = this.data.mode;
    this.invoiceDetCls.user = this.userDataService.userData.userID;
    this.invoiceDetCls.refNo = this.userDataService.userData.sessionID;
    this.invoiceDetCls.company = this.userDataService.userData.company;
    this.invoiceDetCls.location = this.userDataService.userData.location;
    this.invoiceDetCls.langID = this.userDataService.userData.langId;
    this.invoiceDetCls.invType = this.data.tranType;;
    this.invoiceDetCls.tranNo = this.data.tranNo;
    this.invoiceDetCls.slNo = this.slNum || 0;
    this.invoiceDetCls.prodCode = this.prodCode;
    this.invoiceDetCls.product = this.prodCode;
    this.invoiceDetCls.uom = this.invDetForm.get('uom')!.value;
    this.invoiceDetCls.warehouse = this.invDetForm.get('warehouse')!.value;
    this.invoiceDetCls.unitRate = parseFloat(this.invDetForm.get('unitRate')!.value.replace(/,/g, ''));
    this.invoiceDetCls.discRate = parseFloat(this.invDetForm.get('discRate')!.value.replace(/,/g, ''));
    this.invoiceDetCls.netRate = parseFloat(this.invDetForm.get('netRate')!.value.replace(/,/g, ''));
    this.invoiceDetCls.vatRate = parseFloat(this.invDetForm.get('vatRate')!.value.replace(/,/g, ''));
    this.invoiceDetCls.quantity = parseFloat(this.invDetForm.get('quantity')!.value.replace(/,/g, ''));
    this.invoiceDetCls.amount = parseFloat(this.invDetForm.get('amount')!.value.replace(/,/g, ''));
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.clearMsg();
    this.slNum = event.data.slNo;
    this.vatRate = event.data.vatRate;
    this.prodCode = event.data.product;
    this.invoiceDetCls.prodCode = event.data.product;
    this.invDetForm.patchValue({
      warehouse: event.data.warehouse,
      uom: event.data.uom,
      prodName: event.data.productName,
      quantity: event.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      unitRate: event.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      discRate: event.data.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: event.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: event.data.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
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
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  New() {
    this.clearMsg();
    this.invDetForm = this.formInit();
    this.slNum = 0;
  }
  onProductSearch() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.invDetForm.controls['prodName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utldservice.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.nameCount === 1) {
          this.invDetForm.get('prodName')!.patchValue(res.data.selName);
          this.invDetForm.get('code')!.patchValue(res.data.selCode);
          this.prodCode = res.data.selCode;

        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.invDetForm.get('prodName')!.value, 'TranType': "PRODUCT",
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
            this.invDetForm.controls['prodName'].patchValue(result.prodName);
            this.invDetForm.controls['uom'].patchValue(result.uom);
            this.invDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.invDetForm.controls['vatRate'].patchValue(result.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.invDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.invDetForm.controls['quantity'].patchValue("1");
            this.invDetForm.controls['amount'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  onUpdate() {
    this.clearMsg();
    try {
      this.prepareDetailsCls();
      this.loader.start();
      this.subSink.sink = this.salesService.updateInvoiceDetails(this.invoiceDetCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.dailogchange = true;
          this.masterParams.tranNo = res.tranNoNew
          this.getInvoiceItemDetails(this.masterParams.tranNo);
        }
        else {
          this.dailogchange = false;
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }

  onUnitRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.invDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.invDetForm.controls['discRate'].value.toString();
    let strQty = this.invDetForm.controls['quantity'].value.toString();

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


    this.invDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  }

  formatNumbers() {
    this.invDetForm.controls['unitRate'].patchValue(this.invDetForm.controls['unitRate'].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['netRate'].patchValue(this.invDetForm.controls['netRate'].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onDiscountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;
    let strUnitRate = this.invDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.invDetForm.controls['discRate'].value.toString();
    let strQty = this.invDetForm.controls['quantity'].value.toString();

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
    this.invDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }


  onNetRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.invDetForm.controls['unitRate'].value.toString();
    let strNetRate = this.invDetForm.controls['netRate'].value.toString();
    let strQty = this.invDetForm.controls['quantity'].value.toString();

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
    this.invDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['discRate'].patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.invDetForm.controls['netRate'].value.toString();
    let strQty = this.invDetForm.controls['quantity'].value.toString();
    if (strNetRate == "" || strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;
    this.invDetForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.invDetForm.controls['amount'].patchValue(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  onAmountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.invDetForm.controls['unitRate'].value.toString();
    let strAmount = this.invDetForm.controls['amount'].value.toString();
    let strQty = this.invDetForm.controls['quantity'].value.toString();

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
    this.invDetForm.get('unitRate')!.patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.get('discRate')!.patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.get('netRate')!.patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.invDetForm.get('amount')!.patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
}
