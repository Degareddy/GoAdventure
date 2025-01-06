import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Observable, forkJoin } from 'rxjs';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { purchaseRequestDetailsClass } from '../../purchase.class';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { ExcelReportsService } from 'src/app/FileGenerator/excel-reports.service';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { DecimalPipe } from '@angular/common';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

interface params {
  itemCode: string
  itemName: string
}
@Component({
  selector: 'app-purchasedetails',
  templateUrl: './purchasedetails.component.html',
  styleUrls: ['./purchasedetails.component.css']
})
export class PurchasedetailsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  retMessage!: string;
  textMessageClass!: string;
  purReqDetForm!: FormGroup;
  slNum!: number;
  mode!: string;
  private subSink!: SubSink;
  displayColumns: string[] = [];
  dataSource: any;
  prodCode!: string;
  suppCode: string = '';
  selectedRowIndex: number = -1;
  filteredProductList!: Observable<params[]>;
  filteredSupplierList!: Observable<params[]>;
  supplierlist: Item[] = [];
  UOMList: Item[] = [];
  groupList: Item[] = [];
  wareHouseList: Item[] = [];
  modes: Item[] = [];
  productList: Item[] = [];
  status!: string
  purchaseDetCls!: purchaseRequestDetailsClass;
  slValue: boolean = false;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  isAltered: boolean = false;
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "product", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "supplier", headerName: "Supplier", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, width: 220 },
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
    }
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
    }
  },
  {
    field: "availableQty", headerName: "Available Qty", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
        }
      }
      return null;
    }
  },
  {
    field: "pendingQty", headerName: "Pending Qty", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
        }
      }
      return null;
    }
  },
  {
    field: "orderingQty", headerName: "Ordering Qty", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
        }
      }
      return null;
    }
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
    }
  }
    //
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';

  constructor(protected purchreqservice: PurchaseService, private decimalPipe: DecimalPipe,
    private fb: FormBuilder, private userDataService: UserDataService,
    private invService: InventoryService,
    private excelService: ExcelReportsService,
    private pdfService: PdfReportsService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: {tranNo:string,mode:string,status:string},
    public dialog: MatDialog,
    private utlService: UtilitiesService) {
    this.masterParams = new MasterParams();
    this.purReqDetForm = this.formInit();
    this.subSink = new SubSink();
    this.purchaseDetCls = new purchaseRequestDetailsClass();
    this.excelName = "Purchase-Details";
  }
  formInit() {
    return this.fb.group({
      product: [''],
      uom: [{ value: 'PKT', disabled: true }],
      supplier: [''],
      warehouse: [''],
      unitRate: ['0.00'],
      quantity: ['0'],
      availableQty: ['0'],
      pendingQty: ['0'],
      orderingQty: ['0'],
      amount: ['0.00'],
      remarks: ['']
    });
  }

  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + "-" + this.data.tranNo + '.csv' });
    }
  }

  formatAvailableQty() {
    const availableQty = this.purReqDetForm.get('availableQty')!.value;
    if (availableQty != null) {
      const formattedValue = this.decimalPipe.transform(availableQty, '1.2-2');
      this.purReqDetForm.get('availableQty')!.patchValue(formattedValue);
    }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }

  ngOnInit(): void {

    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    if (this.data.tranNo) {
      this.getpurchaseDetails(this.data);
    }
    this.mode = this.data.mode;
    this.status = this.data.status;
    this.loadData();
  }

  generateExcel() {
    this.excelService.generateExcel(this.data, "", "Purchase-Request", new Date());
  }

  generatePDF() {
    this.pdfService.generatePDF(this.data, "Purchase-Request-Details", new Date(), "sss");
  }

  getpurchaseDetails(data: any) {
    if (data.tranNo) {
      this.masterParams.tranNo = data.tranNo;
    }
    else {
      this.masterParams.tranNo = data;
    }

    try {
      this.loader.start();
      this.subSink.sink = this.purchreqservice.GetPurRequestDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != 'FAIL' && res.status.toUpperCase() != 'ERROR') {
          this.exportTmp = false;
          this.rowData = res['data'];
          // if (this.slValue) {
          //   const lastRowIndex = this.dataSource.data.length - 1;
          //   const lastRowData = this.dataSource.data[lastRowIndex];
          //   this.purchaseDetCls.slNo = lastRowData.slNo;
          //   this.slNum = lastRowData.slNo;
          // }

        } else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }

  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  displayProduct(item: params): string {
    return item && item.itemName ? item.itemName : '';
  }

  displaySupplier(item: any): string {
    return item ? item.itemName : '';
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
    // const body = {
    //   ...this.commonParams(),
    //   Item: "PRODUCTS",
    //   mode:this.data.mode

    // };
    // const supbody = {
    //   ...this.commonParams(),
    //   Item: "SUPPLIER",
    //   mode:this.data.mode
    // };
    // const wrbody = {
    //   ...this.commonParams(),
    //   Item: "WAREHOUSE",
    //   mode:this.data.mode

    // };
    const body = {
      ...this.commonParams(),
      Item: "PRODUCTS",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };

    const supbody = {
      ...this.commonParams(),
      Item: "SUPPLIER",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };

    const wrbody = {
      ...this.commonParams(),
      Item: "WAREHOUSE",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };

    const service1 = this.invService.GetMasterItemsList(body);
    const service2 = this.invService.GetMasterItemsList(supbody);
    const service3 = this.invService.GetMasterItemsList(wrbody);
    this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.productList = res1.data;
        }
        else{
          this.retMessage="Product list empty!";
          this.textMessageClass="red";
        }
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.supplierlist = res2.data;
        }
        else{
          this.retMessage="Supplier list empty!";
          this.textMessageClass="red";
        }
        if (res3.status.toUpperCase() === "SUCCESS") {
          this.wareHouseList = res3.data;
        }
        else{
          this.retMessage="WareHouse list empty!";
          this.textMessageClass="red";
        }
      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }
  purDetCls() {
    this.purchaseDetCls.company = this.userDataService.userData.company;
    this.purchaseDetCls.location = this.userDataService.userData.location;
    this.purchaseDetCls.langId = this.userDataService.userData.langId;
    this.purchaseDetCls.user = this.userDataService.userData.userID;
    this.purchaseDetCls.refNo = this.userDataService.userData.sessionID;
    this.purchaseDetCls.mode = this.mode;
    this.purchaseDetCls.slNo = this.slNum || 0;
    this.purchaseDetCls.tranNo = this.masterParams.tranNo;
    this.purchaseDetCls.supplier = this.purReqDetForm.controls['supplier'].value;
    this.purchaseDetCls.suppCode = this.purReqDetForm.controls['supplier'].value;
    this.purchaseDetCls.uom = this.purReqDetForm.controls['uom'].value;
    this.purchaseDetCls.warehouse = this.purReqDetForm.controls['warehouse'].value;
    let unitRateValue = this.purReqDetForm.controls['unitRate'].value || '0';
    this.purchaseDetCls.unitRate = parseFloat(unitRateValue.toString().replace(/,/g, ''));
    let quantityValue = this.purReqDetForm.controls['quantity'].value || '0';
    this.purchaseDetCls.quantity = parseFloat(quantityValue.toString().replace(/,/g, ''));

    let availableQtyValue = this.purReqDetForm.controls['availableQty'].value || '0';
    this.purchaseDetCls.availableQty = parseFloat(availableQtyValue.toString().replace(/,/g, ''));

    let pendingQtyValue = this.purReqDetForm.controls['pendingQty'].value || '0';
    this.purchaseDetCls.pendingQty = parseFloat(pendingQtyValue.toString().replace(/,/g, ''));

    let orderingQtyValue = this.purReqDetForm.controls['orderingQty'].value || '0';
    this.purchaseDetCls.orderingQty = parseFloat(orderingQtyValue.toString().replace(/,/g, ''));

    let amountValue = this.purReqDetForm.controls['amount'].value || '0';
    this.purchaseDetCls.amount = parseFloat(amountValue.toString().replace(/,/g, ''));
    ;
    this.purchaseDetCls.remarks = this.purReqDetForm.controls['remarks'].value;
  }
  onSubmit() {
    this.purDetCls();
    this.loader.start();
    try {
      this.subSink.sink = this.purchreqservice.insertPurchaseDetails(this.purchaseDetCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.retVal >= 100 && res.retVal <= 200) {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.slValue = true;
          this.isAltered = true;
          this.getpurchaseDetails(this.masterParams.tranNo);
        }

      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  onProductFocusOut() {
    this.searchProduct();
  }

  onRowClick(row: any, i: number) {
    // this.purReqDetForm.patchValue(row.data);
    this.slNum = row.data.slNo;
    this.prodCode = row.data.prodCode;
    this.purchaseDetCls.product = row.data.prodCode;
    this.purchaseDetCls.prodCode = row.data.prodCode;
    this.suppCode = row.data.suppCode;
    this.purReqDetForm.controls['supplier'].patchValue(row.data.suppCode);
    this.purReqDetForm.controls['product'].patchValue(row.data.product);
    this.purReqDetForm.controls['warehouse'].patchValue(row.data.whCode);
    this.purReqDetForm.controls['quantity'].patchValue(row.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.purReqDetForm.controls['availableQty'].patchValue(row.data.availableQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.purReqDetForm.controls['pendingQty'].patchValue(row.data.pendingQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.purReqDetForm.controls['orderingQty'].patchValue(row.data.orderingQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));

    this.purReqDetForm.controls['unitRate'].patchValue(row.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.purReqDetForm.controls['amount'].patchValue(row.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  }

  addPurchase() {
    this.purReqDetForm.reset();
    this.purReqDetForm = this.formInit();
    this.slNum = 0;
    this.slValue = true;
    this.textMessageClass = "";
    this.retMessage = "";
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.purReqDetForm.controls['product'].value
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != "FAIL") {
        if (res.data.nameCount === 1) {
          this.purReqDetForm.controls['product'].patchValue(res.data.selName);
          this.purReqDetForm.controls['unitRate'].patchValue(0);
          this.purchaseDetCls.product = res.data.selName;
          this.purchaseDetCls.prodCode = res.data.selCode;
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.purReqDetForm.controls['product'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            this.purReqDetForm.controls['product'].patchValue(result.prodName);
            this.purReqDetForm.controls['uom'].patchValue(result.uom);
            this.purReqDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.purchaseDetCls.product = result.prodCode;
            this.purchaseDetCls.prodCode = result.prodCode;
          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }

  onUnitRateChanged() {
    let numQty: number;
    let numRate: number;
    let uRate = this.purReqDetForm.controls['unitRate'].value.toString();
    let strQty = this.purReqDetForm.controls['quantity'].value.toString();

    if (uRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));
    numRate = Number(uRate.replace(/,(?=\d*\.\d*)/g, ''));
    let amount = numRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purReqDetForm.controls['unitRate'].patchValue(numRate.toLocaleString(undefined, options));
    this.purReqDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));

  }

  onQuantityChanged() {
    let numQty: number;
    let uRate = this.purReqDetForm.controls['unitRate'].value;
    if (uRate == '') {
      return;
    }
    let strQty: string = this.purReqDetForm.controls['quantity'].value;
    if (strQty == '') {
      return;
    }
    let lastLetter: string = strQty.charAt(strQty.length - 1);
    if (lastLetter == ".") {
      return;
    }
    else if (strQty.includes(".")) {
      strQty = strQty.replace(new RegExp(",", 'g'), '');
      numQty = Number(strQty);
    }
    else {
      numQty = Number(strQty.replace(/,/g, ''));
    }
    let amount = uRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purReqDetForm.controls['quantity'].patchValue(numQty.toLocaleString());
    this.purReqDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }

  onAmountChanged() {
    let numAmount: number;
    let qty = this.purReqDetForm.controls['quantity'].value.toString();
    let strAmount = this.purReqDetForm.controls['amount'].value.toString();
    if (qty == "") {
      return;
    }
    if (strAmount == "") {
      return;
    }
    numAmount = Number(strAmount.replace(/,/g, ''));
    let numQty = Number(qty.replace(/,/g, ''));
    let uRate = numAmount / numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.purReqDetForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
    this.purReqDetForm.controls['unitRate'].patchValue(uRate.toLocaleString(undefined, options));

  }

  onQuantityFocusOut() {
    let numQty: number;
    let numRate: number;
    let uRate = this.purReqDetForm.controls['unitRate'].value.toString();
    let strQty = this.purReqDetForm.controls['quantity'].value.toString();
    if (uRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numRate = Number(uRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));
    let amount = numRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    // this.purReqDetForm.controls['quantity'].patchValue(numQty.toLocaleString(undefined, options));
    this.purReqDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }
}
