import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { supplierQuotationItems } from '../../purchase.class';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { SubSink } from 'subsink';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-supplier-quotaion-details',
  templateUrl: './supplier-quotaion-details.component.html',
  styleUrls: ['./supplier-quotaion-details.component.css']
})
export class SupplierQuotaionDetailsComponent implements OnInit, OnDestroy {
  supplierdetailsForm!: FormGroup;
  slNum!: number;
  dataFlag: boolean = false;
  textMessageClass!: string;
  retMessage!: string;
  masterParams!: MasterParams;
  suppDetCls!: supplierQuotationItems;
  mode!: string;
  prodCode!: string;
  units!: string;
  status!: string;
  private subSink!: SubSink;
  selectedRowIndex: number = -1;
  slValue: boolean = false;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  vatRate!: number;


  columnDefs: any = [{ field: "slNo", headerName: "S.No", resizable: true, flex: 1 },
  { field: "prodCode", headerName: "Code", filter: true, resizable: true, hide: true, flex: 1 },
  { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 450, },
  { field: "uom", headerName: "uom", sortable: true, filter: true, resizable: true, flex: 1 },
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
    field: "discRate", headerName: "Disc %", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    field: "vatRate", headerName: "Tax %", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "netRate", headerName: "Net Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    // valueFormatter: function (params: any) {
    //   if (params.value || params.value === 0) {
    //     return params.value.toLocaleString();
    //   }
    //   return null;
    // },
    // valueFormatter: function (params: any) {
    //   if (params.value || params.value === 0) {
    //     return parseFloat(params.value).toFixed(2).toLocaleString();
    //   }
    //   return null;
    // },
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
    // { field: "discRate", headerName: "unitRate", sortable: true, filter: true, resizable: true, width: 120 },
  ];
  constructor(private fb: FormBuilder, private purchreqservice: PurchaseService,
    private utlService: UtilitiesService, public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string, applyVat: boolean }) {
    this.supplierdetailsForm = this.formInit();
    this.masterParams = new MasterParams();
    this.suppDetCls = new supplierQuotationItems();
    this.subSink = new SubSink();
    this.mode = this.data.mode;
    this.status = this.data.status;
    this.excelName = "Supplier_Quotation";
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
  }
  ngOnInit(): void {

    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.get(this.data.tranNo);

  }
  prepareSupCls() {
    this.suppDetCls.slNo = this.slNum || 0;
    this.suppDetCls.company = this.userDataService.userData.company;
    this.suppDetCls.location = this.userDataService.userData.location;
    this.suppDetCls.user = this.userDataService.userData.userID;
    this.suppDetCls.refNo = this.userDataService.userData.sessionID;
    this.suppDetCls.mode = this.data.mode;
    this.suppDetCls.remarks = "";
    this.suppDetCls.langID = this.userDataService.userData.langId;
    this.suppDetCls.tranNo = this.data.tranNo;
    this.suppDetCls.amount = parseFloat(this.supplierdetailsForm.controls['amount'].value.toString().replace(/,/g, ''));
    this.suppDetCls.discRate = parseFloat(this.supplierdetailsForm.controls['discRate'].value.toString().replace(/,/g, ''));
    this.suppDetCls.netRate = parseFloat(this.supplierdetailsForm.controls['netRate'].value.toString().replace(/,/g, ''));
    this.suppDetCls.quantity = parseFloat(this.supplierdetailsForm.controls['quantity'].value.toString().replace(/,/g, ''));
    this.suppDetCls.unitRate = parseFloat(this.supplierdetailsForm.controls['unitRate'].value.toString().replace(/,/g, ''));
    this.suppDetCls.vatRate = parseFloat(this.supplierdetailsForm.controls['vatRate'].value);
    this.suppDetCls.uom = this.supplierdetailsForm.controls['uom'].value;
  }

  onSubmit() {
    try {
      this.prepareSupCls();
      this.loader.start();
      this.subSink.sink = this.purchreqservice.UpdateSupplierQtnItems(this.suppDetCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.get(res.tranNoNew);
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";

    }

  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.retMessage = "";
    this.textMessageClass = "";
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
    this.gridApi.sizeColumnsToFit();
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

    this.suppDetCls.prodName = "";
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      item: this.supplierdetailsForm.controls['product'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {

      if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {

        if (res && res.data && res.data.nameCount === 1) {

          this.supplierdetailsForm.controls['product'].patchValue(res.data.selName);
          this.prodCode = res.data.selCode;
          this.suppDetCls.prodName = res.data.selName;
        }
        else {

          this.retMessage = "";
          this.textMessageClass = "";
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.supplierdetailsForm.controls['product'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            // console.log(result);
            if(result != true){
              this.units = result.uom;
              this.suppDetCls.prodCode = result.prodCode;
              this.suppDetCls.prodName = result.prodName;
              this.vatRate = Number(result.vatRate);
              let numNetRate: number = 0;
              if (this.data.applyVat) {
                numNetRate = result.stdPurRate * (1 + this.vatRate / 100.0);
              }
              else {
                numNetRate = result.stdPurRate;
              }
              this.supplierdetailsForm.controls['product'].patchValue(result.prodName);
              this.supplierdetailsForm.controls['uom'].patchValue(result.uom);
              this.supplierdetailsForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
              this.supplierdetailsForm.controls['vatRate'].patchValue(result.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              this.supplierdetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
              this.supplierdetailsForm.controls['quantity'].patchValue(1.00,{emitEvent: false});
              this.supplierdetailsForm.controls['amount'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
              this.onUnitRateChanged();
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
  Clear() {
    this.supplierdetailsForm.reset();
    this.supplierdetailsForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.slNum = 0;
  }
  formInit() {
    return this.fb.group({
      product: [''],
      uom: [{ value: '', disabled: true }],
      unitRate: [0,Validators.required],
      quantity: [0,Validators.required],
      vatRate: [{ value: 0, disabled: true }],
      discRate: [0],
      amount: [0,Validators.required],
      netRate: [0,Validators.required]
    });
  }
  onRowClick(row: any) {
    let qoptions: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
    this.slNum = row.slNo;
    this.suppDetCls.prodCode = row.prodCode;
    this.suppDetCls.prodName = row.prodName;
    this.vatRate = row.vatRate;
    this.supplierdetailsForm.controls['product'].patchValue(row.prodName);
    this.supplierdetailsForm.controls['uom'].patchValue(row.uom);
    this.supplierdetailsForm.controls['unitRate'].patchValue(row.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['quantity'].patchValue(row.quantity.toLocaleString(undefined, qoptions),{emitEvent: false});
    this.supplierdetailsForm.controls['netRate'].patchValue(row.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['vatRate'].patchValue(row.vatRate);
    this.supplierdetailsForm.controls['discRate'].patchValue(row.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['amount'].patchValue(row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
  }
  get(tarnNO: string) {
    this.masterParams.tranNo = tarnNO;
    try {
      this.loader.start();
      this.subSink.sink = this.purchreqservice.GetSuppQuotationItems(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.exportTmp = false;
          this.rowData = res['data'];
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }

      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = "Exception " + ex.message;
    }
  }

  onUnitRateChanged() {
    let numUnitRate: number = 0;
    let numDiscRate: number = 0;
    let numQty: number = 0;
    let numNetRate: number = 0;
    let numAmount: number = 0;
    let strUnitRate = this.supplierdetailsForm.controls['unitRate'].value.toString();
    let strDiscRate = this.supplierdetailsForm.controls['discRate'].value.toString();
    let strQty = this.supplierdetailsForm.controls['quantity'].value.toString();
    let vatRate: number;
    let vat = this.supplierdetailsForm.get('vatRate')?.value;
    vatRate = vat;

    if (strUnitRate == "" || strQty == "") {
      return;
    }
    if (strDiscRate == "") {
      strDiscRate = '0';
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    if (vatRate != undefined && vatRate != 0 && vatRate != null) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + Number(vatRate) / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }
    numAmount = numNetRate * numQty;
    this.supplierdetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});

  }

  formatNumbers() {
    this.supplierdetailsForm.controls['unitRate'].patchValue(this.supplierdetailsForm.controls['unitRate'].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    this.supplierdetailsForm.controls['netRate'].patchValue(this.supplierdetailsForm.controls['netRate'].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  onDiscountChanged() {
    let numUnitRate: number = 0;
    let numDiscRate: number = 0;
    let numQty: number = 0;
    let numNetRate: number = 0;
    let numAmount: number = 0;
    let strUnitRate = this.supplierdetailsForm.controls['unitRate'].value.toString();
    let strDiscRate = this.supplierdetailsForm.controls['discRate'].value.toString();
    let strQty = this.supplierdetailsForm.controls['quantity'].value.toString();
    let vatRate: number;
    let vat = this.supplierdetailsForm.get('vatRate')?.value;
    vatRate = vat;
    if (strUnitRate == "" || strQty == "") {
      return;
    }
    if (strDiscRate == "") {
      strDiscRate = '0';
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numDiscRate = Number(strDiscRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));

    if (vatRate != undefined && vatRate != 0 && vatRate != null) {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0) * (1 + Number(vatRate) / 100.0);
    }
    else {
      numNetRate = numUnitRate * (1 - numDiscRate / 100.0);
    }

    numAmount = numNetRate * numQty;
    this.supplierdetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
  }


  onNetRateChanged() {
    let numUnitRate: number = 0;
    let numDiscRate: number = 0;
    let numQty: number = 0;
    let numNetRate: number = 0;
    let numAmount: number = 0;

    let strUnitRate = this.supplierdetailsForm.controls['unitRate'].value.toString();
    let strNetRate = this.supplierdetailsForm.controls['netRate'].value.toString();
    let strQty = this.supplierdetailsForm.controls['quantity'].value.toString();

    if (strNetRate == "" || strUnitRate == "" || strQty == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let vatRate: number;
    let vat = this.supplierdetailsForm.get('vatRate')?.value;
    vatRate = vat;
    if (vatRate != undefined && vatRate != 0 && vatRate != null) {
      numDiscRate = (numUnitRate * (1 + Number(vatRate) / 100.0) - numNetRate) / (numUnitRate * (1 + Number(vatRate) / 100.0)) * 100.0;
    }
    else {
      numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;
      if (vatRate != undefined && vatRate != 0 && vatRate != null) {
        numUnitRate = numNetRate / (1 + Number(vatRate) / 100.0);
      }
      else {
        numUnitRate = numUnitRate;
      }
    }
    numAmount = numNetRate * numQty;
    this.supplierdetailsForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['discRate'].patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['netRate'].patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.controls['amount'].patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
  }
  onQuantityChanged() {
    let numQty: number = 0;
    let numNetRate: number = 0;
    let strNetRate = this.supplierdetailsForm.controls['netRate'].value.toString();
    let strQty = this.supplierdetailsForm.controls['quantity'].value.toString();
    if (strNetRate == "" || strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;
    this.supplierdetailsForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.supplierdetailsForm.controls['amount'].patchValue(amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
  }

  onAmountChanged() {
    let numUnitRate: number = 0;
    let numDiscRate: number = 0;
    let numQty: number = 0;
    let numNetRate: number = 0;
    let numAmount: number = 0;
    let strUnitRate = this.supplierdetailsForm.controls['unitRate'].value.toString();
    let strAmount = this.supplierdetailsForm.controls['amount'].value.toString();
    let strQty = this.supplierdetailsForm.controls['quantity'].value.toString();
    let vatRate: number;
    let vat = this.supplierdetailsForm.get('vatRate')?.value;
    vatRate = vat;
    if (strAmount == "" || strUnitRate == "" || strQty == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numAmount = Number(strAmount.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    numNetRate = numAmount / numQty;
    // if (vatRate != undefined && vatRate != 0 && vatRate != null) {
    //   numDiscRate = (numUnitRate * (1 + Number(vatRate) / 100.0) - numNetRate) / (numUnitRate * (1 + Number(vatRate) / 100.0)) * 100.0;
    // }
    // else {
    //   numDiscRate = ((numUnitRate - numNetRate) * 100.0) / (numUnitRate);
    // }

    // if (numDiscRate < 0) {
    //   numDiscRate = 0;
    //   if (vatRate != undefined && vatRate != 0 && vatRate != null) {
    //     numUnitRate = numNetRate / (1 + Number(vatRate) / 100.0);
    //   }
    //   else {
    //     numUnitRate = numUnitRate;
    //   }
    // }
    if (vatRate && vatRate !== 0) {
      numDiscRate =
        ((numUnitRate * (1 + Number(vatRate) / 100) - numNetRate) /
        (numUnitRate * (1 + Number(vatRate) / 100))) * 100;
    } else {
      numDiscRate = ((numUnitRate - numNetRate) / numUnitRate) * 100;
    }

    if (numDiscRate < 0) {
      numDiscRate = 0;

      if (vatRate && vatRate !== 0) {
        numUnitRate = numNetRate / (1 + Number(vatRate) / 100);
      }
    }

    this.supplierdetailsForm.get('unitRate')!.patchValue(numUnitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.get('discRate')!.patchValue(numDiscRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.get('netRate')!.patchValue(numNetRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
    this.supplierdetailsForm.get('amount')!.patchValue(numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),{emitEvent: false});
  }

}
