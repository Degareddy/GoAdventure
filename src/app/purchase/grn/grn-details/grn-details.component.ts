import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { grnDetails } from '../../purchase.class';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-grn-details',
  templateUrl: './grn-details.component.html',
  styleUrls: ['./grn-details.component.css']
})
export class GrnDetailsComponent implements OnInit, OnDestroy {
  grnDetailsForm!: FormGroup;
  dataFlag: boolean = false;
  masterParams!: MasterParams;
  slNum!: number;
  subSink: SubSink;
  productCode!: string;
  selectedRowIndex: number = -1;
  wareHouseList: Item[] = [];
  retMessage!: string;
  textMessageClass!: string;
  grnDetailsCls!: grnDetails;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  autoHeight: boolean = true;

  columnDefs: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "unitRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "discRate", headerName: "Disc%", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "vatRate", headerName: "Vat", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "netRate", headerName: "Net", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
  { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, flex: 1 },
  ];
  vatRate!: number;
  selectedTabIndex: number = 0;


  constructor(protected purchaseService: PurchaseService, private fb: FormBuilder, private invService: InventoryService,
    private utlService: UtilitiesService, public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNum: string, status: string, applyVat: boolean },) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.grnDetailsForm = this.formInit();
    this.grnDetailsCls = new grnDetails();
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
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const wrbody = {
      ...this.commonParams(),
      Item: "WAREHOUSE"
    };
    const service1 = this.invService.GetMasterItemsList(wrbody);
    this.subSink.sink = forkJoin([service1]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        this.wareHouseList = res1.data;
      },
      (error: any) => {
        this.loader.stop();
      }
    );
    this.getGRNDetails(this.data.tranNum);
  }
  onTabSelected(event: any) {
    this.selectedTabIndex = event.index;
  }
  newGRN() {
    this.grnDetailsForm = this.formInit();
    this.slNum = 0;
  }
  prepareDetCls() {
    this.grnDetailsCls.company = this.userDataService.userData.company;
    this.grnDetailsCls.location = this.userDataService.userData.location;
    this.grnDetailsCls.user = this.userDataService.userData.userID;
    this.grnDetailsCls.refNo = this.userDataService.userData.sessionID;
    this.grnDetailsCls.warehouse = this.grnDetailsForm.controls['warehouse'].value;
    this.grnDetailsCls.unitRate = parseFloat(this.grnDetailsForm.controls['unitRate'].value.replace(/,/g, ''));
    this.grnDetailsCls.discRate = parseFloat(this.grnDetailsForm.controls['discRate'].value.replace(/,/g, ''));
    this.grnDetailsCls.vatRate = this.grnDetailsForm.controls['vatRate'].value;
    this.grnDetailsCls.netRate = parseFloat(this.grnDetailsForm.controls['netRate'].value.replace(/,/g, ''));
    this.grnDetailsCls.quantity = parseFloat(this.grnDetailsForm.controls['quantity'].value.replace(/,/g, ''));
    this.grnDetailsCls.amount = parseFloat(this.grnDetailsForm.controls['amount'].value.replace(/,/g, ''));
    this.grnDetailsCls.uom = this.grnDetailsForm.controls['uom'].value;
    this.grnDetailsCls.slNo = this.slNum;
    this.grnDetailsCls.lotNo = this.grnDetailsForm.controls['lotNo'].value;
    this.grnDetailsCls.serialNo = this.grnDetailsForm.controls['serialNo'].value;
    this.grnDetailsCls.poNo = this.grnDetailsForm.controls['poNo'].value;
    this.grnDetailsCls.unitWeight = this.grnDetailsForm.controls['unitWeight'].value;
    this.grnDetailsCls.langID = this.userDataService.userData.langId;
    this.grnDetailsCls.tranNo = this.data.tranNum;
    this.grnDetailsCls.mode = this.data.mode;
    this.grnDetailsCls.prodCode = this.productCode;
  }
  onSubmit() {
    if (this.grnDetailsForm.invalid) {
      return;
    }
    else {
      this.prepareDetCls();
      try {
        this.loader.start();
        this.subSink.sink = this.purchaseService.updateGrnDetails(this.grnDetailsCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
          else
            if (res.status.toUpperCase() === "SUCCESS") {
              this.dataFlag = true;
              this.getGRNDetails(this.data.tranNum);
              this.retMessage = res.message;
              this.textMessageClass = "green";
            }
        });

      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }

    }
  }
  onItemSubmit() {

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
    //  //console.log(event.data);
    this.onRowClick(event.data);

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onFirstDataRendered(params: { api: any }) {
    params.api.sizeColumnsToFit();
  }
  onProductFocusOut() {
    this.searchProduct();
  }
  searchProduct() {
    const body = {
      ...this.commonParams(),
      type: "PRODUCT",
      item: this.grnDetailsForm.controls['product'].value

    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
      // console.log(res);
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.grnDetailsForm.controls['product'].patchValue(res.data.selName);
          this.productCode = res.data.selCode;
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.grnDetailsForm.controls['product'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result != true){
              this.grnDetailsForm.controls['product'].patchValue(result.prodName);
              this.grnDetailsForm.controls['uom'].patchValue(result.uom);
              this.vatRate = result.vatRate;
              this.productCode = result.prodCode;
              this.grnDetailsForm.controls['unitRate'].patchValue(result.stdSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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
  formInit() {
    return this.fb.group({
      poNo: [''],
      slNo: [''],
      product: ['', [Validators.required, Validators.maxLength(150)]],
      uom: ['', [Validators.required, Validators.maxLength(15)]],
      unitRate: ['0.00'],
      discRate: ['0.00'],
      vatRate: [{ value: "0.00", disabled: true }],
      netRate: ['0.00'],
      quantity: ['0'],
      amount: ['0.00'],
      warehouse: ['', Validators.required],
      unitWeight: ['0'],
      lotNo: ['0'],
      serialNo: [''],
    });
  }

  getGRNDetails(tarnNO: string) {
    this.masterParams.tranNo = tarnNO;

    try {
      this.loader.start();
      this.subSink.sink = this.purchaseService.getGrnDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAIL") {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
        else {
          this.rowData = res['data'];
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  onRowClick(row: any) {
    this.slNum = row.slNo;
    // this.grnDetailsForm.patchValue(row);
    this.grnDetailsForm.controls['product'].patchValue(row.prodName);
    this.grnDetailsForm.controls['warehouse'].patchValue(row.warehouse);
    this.grnDetailsForm.controls['serialNo'].patchValue(row.serialNo);
    this.grnDetailsForm.controls['poNo'].patchValue(row.poNo);
    this.productCode = row.prodCode;
    this.grnDetailsForm.patchValue({
      serialNo: row.grnSlNo,
      uom: row.uom,
      chargeItem: row.chargeItem,
      unitRate: row.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: row.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: row.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    })
  }
  onUnitRateGotFocus() {
    let numUnitRate: number;
    let strUnitRate = this.grnDetailsForm.controls['unitRate'].value.toString();
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    this.grnDetailsForm.controls['unitRate'].patchValue(numUnitRate.toString());
  }

  onUnitRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.grnDetailsForm.controls['unitRate'].value.toString();
    let strDiscRate = this.grnDetailsForm.controls['discRate'].value.toString();
    let strQty = this.grnDetailsForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

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

    this.grnDetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));

  }

  onDiscountGotFocus() {
    let numDiscPer: number;
    let strDiscPer = this.grnDetailsForm.controls['discRate'].value.toString();
    numDiscPer = Number(strDiscPer.replace(/,/g, ''));
    this.grnDetailsForm.controls['discRate'].patchValue(numDiscPer.toString());
  }
  formatNumbers() {
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.grnDetailsForm.controls['unitRate'].patchValue(this.grnDetailsForm.controls['unitRate'].value.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['netRate'].patchValue(this.grnDetailsForm.controls['netRate'].value.toLocaleString(undefined, options));
  }
  onDiscountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.grnDetailsForm.controls['unitRate'].value.toString();
    let strDiscRate = this.grnDetailsForm.controls['discRate'].value.toString();
    let strQty = this.grnDetailsForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

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

    this.grnDetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  // onNetRateGotFocus() {
  //   let numNetRate: number;
  //   let strNetRate = this.grnDetailsForm.controls['netRate'].value.toString();
  //   numNetRate = Number(strNetRate.replace(/,/g, ''));
  //   this.grnDetailsForm.controls['netRate'].patchValue(numNetRate.toString());
  // }

  onNetRateChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.grnDetailsForm.controls['unitRate'].value.toString();
    let strNetRate = this.grnDetailsForm.controls['netRate'].value.toString();
    let strQty = this.grnDetailsForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    if (strNetRate == "") {
      return;
    }

    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

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
    // discper
    this.grnDetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['discRate'].patchValue(numDiscRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.grnDetailsForm.controls['netRate'].value.toString();
    let strQty = this.grnDetailsForm.controls['quantity'].value.toString();
    if (strNetRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.grnDetailsForm.controls['quantity'].patchValue(numQty.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }

  onAmountChanged() {
    let numUnitRate: number;
    let numDiscRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;
    let strUnitRate = this.grnDetailsForm.controls['unitRate'].value.toString();
    let strAmount = this.grnDetailsForm.controls['amount'].value.toString();
    let strQty = this.grnDetailsForm.controls['quantity'].value.toString();
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

    this.grnDetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['discRate'].patchValue(numDiscRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.grnDetailsForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }

}
