import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SaleOrderHeader, SalesOrderDetails } from '../../sales.class';
import { SubSink } from 'subsink';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SalesService } from 'src/app/Services/sales.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Mode, TextClr, Type } from 'src/app/utils/enums';

@Component({
  selector: 'app-sale-order-details',
  templateUrl: './sale-order-details.component.html',
  styleUrls: ['./sale-order-details.component.css']
})
export class SaleOrderDetailsComponent implements OnInit, OnDestroy {
  dailogchange: boolean = false;
  saleDetForm!: FormGroup;
  slNum: number = 0;
  saleCls: SaleOrderHeader = new SaleOrderHeader();
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  private subSink: SubSink = new SubSink();
  vatRate: number = 0;
  prodCode: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private soDetCls: SalesOrderDetails = new SalesOrderDetails();
  public rowSelection: 'single' | 'multiple' = 'multiple';
  quatationcolumnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "product", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220,hide:true },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220 },
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
  rowData: any = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    mode: string, tranNo: string,
    search: string, tranType: string, status: string
  }, private dialog: MatDialog, private fb: FormBuilder, protected saleService: SalesService, private loader: NgxUiLoaderService,
    private userDataService: UserDataService, private utldservice: UtilitiesService,) {
    this.saleDetForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
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
        this.data.mode = Mode.Delete;
        this.onUpdate();
      }
    });
  }
  ngOnInit(): void {
    if (this.data.tranNo) {
      this.getOrderDetails(this.data.tranNo);
    }
    else {
      this.retMessage = "Select sale number from header data!";
      this.textMessageClass = "red";
      return;
    }
  }
  getOrderDetails(tranNo: string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID,
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetSaleOrderDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.rowData = res.data;
      }
      else {
        this.rowData = [];
        this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
      }
    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }

  prepareSOdetails() {
    this.soDetCls.company = this.userDataService.userData.company;
    this.soDetCls.location = this.userDataService.userData.location;
    this.soDetCls.langID = this.userDataService.userData.langId;
    this.soDetCls.refNo = this.userDataService.userData.sessionID;
    this.soDetCls.user = this.userDataService.userData.userID;

    this.soDetCls.amount = parseFloat(this.saleDetForm.get('amount')?.value.replace(/,/g, ''));
    this.soDetCls.discRate = parseFloat(this.saleDetForm.get('discRate')?.value.replace(/,/g, ''));
    this.soDetCls.mode = this.data.mode;
    this.soDetCls.netRate = parseFloat(this.saleDetForm.get('netRate')?.value.replace(/,/g, ''));
    this.soDetCls.product = this.prodCode
    this.soDetCls.productName = this.saleDetForm.get('prodName')?.value;

    this.soDetCls.quantity = parseFloat(this.saleDetForm.get('quantity')?.value.replace(/,/g, ''));
    this.soDetCls.slNo = this.slNum || 0;
    this.soDetCls.tranNo = this.data.tranNo;
    this.soDetCls.unitRate = parseFloat(this.saleDetForm.get('unitRate')?.value.replace(/,/g, ''));
    this.soDetCls.uom = this.saleDetForm.get('uom')?.value
    this.soDetCls.vatRate = parseFloat(this.saleDetForm.get('vatRate')?.value.replace(/,/g, ''));


  }
  clear() {
    this.clearMsgs();
    this.saleDetForm = this.formInit();
    this.slNum = 0;
    this.prodCode="";
  }
  clearMsgs() {
   this.displayMessage('', '');
  }
  onRowClick(row: any) {
    this.slNum = row.data.slNo;
    this.prodCode = row.data.product;
    this.saleDetForm.patchValue({
      prodName: row.data.productName,
      uom: row.data.uom,
      unitRate: row.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      discRate: row.data.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: row.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: row.data.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: row.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: row.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },{emitEvent:false});

  }
  onUpdate() {
    this.clearMsgs();
    if (this.saleDetForm.invalid) {
      this.retMessage = "Enter all mandatory fields!";
      this.textMessageClass = "red";
      return;
    }
    else {

      try {
        this.prepareSOdetails();
        this.loader.start();
        this.subSink.sink = this.saleService.UpdateSaleOrderItemDetails(this.soDetCls).subscribe((res: SaveApiResponse) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.dailogchange=true;
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.getOrderDetails(res.tranNoNew);
          }
          else {
            this.dailogchange=false;

            this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }

  }

  formInit() {
    return this.fb.group({
      prodName: [''],
      uom: [{ value: '', disabled: true }],
      unitRate: ['0.00'],
      discRate: ['0.00'],
      vatRate: [{ value: '0.00', disabled: true }],
      netRate: ['0.00'],
      quantity: ['0'],
      amount: ['0.00'],
    })
  }
  onDiscountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;
    let strUnitRate = this.saleDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.saleDetForm.controls['discRate'].value.toString();
    let strQty = this.saleDetForm.controls['quantity'].value.toString();

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
    this.saleDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }


  onNetRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.saleDetForm.controls['unitRate'].value.toString();
    let strNetRate = this.saleDetForm.controls['netRate'].value.toString();
    let strQty = this.saleDetForm.controls['quantity'].value.toString();

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
    this.saleDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['discRate'].patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.saleDetForm.controls['netRate'].value.toString();
    let strQty = this.saleDetForm.controls['quantity'].value.toString();
    if (strNetRate == "" || strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;
    this.saleDetForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.saleDetForm.controls['amount'].patchValue(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  onAmountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.saleDetForm.controls['unitRate'].value.toString();
    let strAmount = this.saleDetForm.controls['amount'].value.toString();
    let strQty = this.saleDetForm.controls['quantity'].value.toString();

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
    this.saleDetForm.get('unitRate')!.patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.get('discRate')!.patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.get('netRate')!.patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.get('amount')!.patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onUnitRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.saleDetForm.controls['unitRate'].value.toString();
    let strDiscRate = this.saleDetForm.controls['discRate'].value.toString();
    let strQty = this.saleDetForm.controls['quantity'].value.toString();

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


    this.saleDetForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.saleDetForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  }
  onGridReady(event: any) {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    const gridApi = event.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
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
  onProductSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.PRODUCT,
      Item: this.saleDetForm.controls['prodName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utldservice.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.nameCount === 1) {
          this.saleDetForm.get('prodName')!.patchValue(res.data.selName);
          this.saleDetForm.get('code')!.patchValue(res.data.selCode);
          this.prodCode = res.data.selCode;

        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              tranNum: this.saleDetForm.get('prodName')!.value, TranType: Type.PRODUCT,
              search: 'Product Search'
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
            this.saleDetForm.controls['prodName'].patchValue(result.prodName);
            this.saleDetForm.controls['uom'].patchValue(result.uom);
            this.saleDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.saleDetForm.controls['vatRate'].patchValue(result.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.saleDetForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.saleDetForm.controls['quantity'].patchValue("1");
            this.saleDetForm.controls['amount'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

          });
        }
      }
      else {
        this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
      }
    });
  }
}
