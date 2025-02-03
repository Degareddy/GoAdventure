import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryService } from 'src/app/Services/inventory.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { stockConsumptionDetails } from '../../inventory.class';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { forkJoin } from 'rxjs';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { displayMsg, Items, Mode, TextClr, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-consumption-details',
  templateUrl: './consumption-details.component.html',
  styleUrls: ['./consumption-details.component.css']
})
export class ConsumptionDetailsComponent implements OnInit, OnDestroy {
  consumptionDetForm!: FormGroup;
  whCode!: string;
  productName!: string;
  prodCode!: string;
  masterParams!: MasterParams;
  retMessage: string = "";
  selProdCode!: string;
  retNum!: number;
  textMessageClass: string = "";
  modes: Item[] = [];
  mainWorksList: Item[] = [];
  subWorksList: Item[] = [];
  slNum: number = 0;
  stkConDtCls!: stockConsumptionDetails;
  slValue: boolean = false;
  private subSink!: SubSink;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex!: number;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  dataFlag: boolean = false;
  public exportTmp: boolean = true;
  public excelName: string = "";
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  dialogOpen = false;
  newMsg: string = "";
  warehouseList: Item[] = [];
  flatName: string = "";
  flatCode: string = "";

  columnDef: any = [{ field: "slNo", headerName: "S.No", width: 90 },
  { field: "product", headerName: "Proerty Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "warehouseName", headerName: "Warehouse", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
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
    }
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
    field: "rowValue", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  { field: "mainWorkType", headerName: "Main Work Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "mainWorkName", headerName: "Main Work", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "subWorkType", headerName: "Sub Work Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "subWorkName", headerName: "Sub Work", sortable: true, filter: true, resizable: true, flex: 1 }

  ]

  constructor(private fb: FormBuilder,
    private invService: InventoryService,
    private masterService: MastersService, private loader: NgxUiLoaderService,
    protected router: Router, private userDataService: UserDataService,
    protected utlService: UtilitiesService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      tranNo: string, mode: string, property: string, propertyName: string,
      blockName: string, block: string, status: string
    }) {
    this.consumptionDetForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.stkConDtCls = new stockConsumptionDetails();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      flat: [''],
      product: ['', Validators.required],
      uom: [{ value: '', disabled: true }],
      unitRate: [{ value: '0.00', disabled: true }],
      quantity: ['0', Validators.required],
      warehouse: ['', [Validators.required, Validators.maxLength(50)]],
      rowValue: [{ value: '0.00', disabled: true }],
      property: [{ value: this.consumptionDetForm ? this.consumptionDetForm.get('property')?.value : '', disabled: true }],
      block: [{ value: this.consumptionDetForm ? this.consumptionDetForm.get('block')?.value : '', disabled: true }],
      mainWorkType: ['', Validators.required],
      subWorkType: ['', Validators.required],
    })
  }


  ngOnInit(): void {
    this.consumptionDetForm.controls['property'].setValue(this.data.propertyName);
    this.consumptionDetForm.controls['block'].setValue(this.data.blockName);

    const warehouseBody: getPayload = {
      ...this.commonParams(),
      item: Items.WAREHOUSE,
      ...(this.data.mode.toUpperCase() === Mode.Add ? { mode: this.data.mode } : {})
    };

    const mainWorksBody: getPayload = {
      ...this.commonParams(),
      item: Items.WRKMAIN,
      ...(this.data.mode.toUpperCase() === Mode.Add ? { mode: this.data.mode } : {})
    };

    const subWorksBody: getPayload = {
      ...this.commonParams(),
      item: Items.WORKTYPE,
      ...(this.data.mode.toUpperCase() === Mode.Add ? { mode: this.data.mode } : {})
    };

    this.subSink.sink = this.invService.GetMasterItemsList(warehouseBody).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.warehouseList = res['data'];
      }
    });

    try {
      const mwBody$ = this.masterService.GetMasterItemsList(mainWorksBody);
      const swBody$ = this.masterService.GetMasterItemsList(subWorksBody);
      this.subSink.sink = forkJoin([mwBody$, swBody$]).subscribe(
        ([mwRes, swRes]: any) => {
          this.mainWorksList = mwRes['data'];
          this.subWorksList = swRes['data'];
        },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
    this.getStockConDetails(this.data.tranNo, this.data.mode);
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  getStockConDetails(tarnNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tarnNo,
      LangId: this.userDataService.userData.langId
    }
    try {
      this.subSink.sink = this.invService.GetStockConsumptionDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  onUnitRateChanged() {
    let numQty: number;
    let numRate: number;
    let uRate = this.consumptionDetForm.controls['unitRate'].value.toString();
    let strQty = this.consumptionDetForm.controls['quantity'].value.toString();

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

    this.consumptionDetForm.controls['unitRate'].setValue(numRate.toLocaleString(undefined, options));
    this.consumptionDetForm.controls['rowValue'].setValue(amount.toLocaleString(undefined, options));

  }

  onQuantityChanged() {
    let numQty: number;
    let uRate = this.consumptionDetForm.controls['unitRate'].value;
    if (uRate == '') {
      return;
    }
    let strQty: string = this.consumptionDetForm.controls['quantity'].value;
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

    this.consumptionDetForm.controls['quantity'].setValue(numQty.toLocaleString());
    this.consumptionDetForm.controls['rowValue'].setValue(amount.toLocaleString(undefined, options));
  }

  onAmountChanged() {
    let numAmount: number;
    let qty = this.consumptionDetForm.controls['quantity'].value.toString();
    let strAmount = this.consumptionDetForm.controls['rowValue'].value.toString();
    if (qty == "") {
      return;
    }
    if (strAmount == "") {
      return;
    }
    numAmount = Number(strAmount.replace(/,(?=\d*\.\d*)/g, ''));
    let numQty = Number(qty.replace(/,(?=\d*\.\d*)/g, ''));
    let uRate = numAmount / numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.consumptionDetForm.controls['rowValue'].setValue(numAmount.toLocaleString(undefined, options));
    this.consumptionDetForm.controls['unitRate'].setValue(uRate.toLocaleString());

  }

  onQuantityFocusOut() {
    let numQty: number;
    let numRate: number;
    let uRate = this.consumptionDetForm.controls['unitRate'].value.toString();
    let strQty = this.consumptionDetForm.controls['quantity'].value.toString();
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

    let options1: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    this.consumptionDetForm.controls['quantity'].setValue(numQty.toLocaleString(undefined, options1));
    this.consumptionDetForm.controls['rowValue'].setValue(amount.toLocaleString(undefined, options));
  }

  clear() {
    this.consumptionDetForm = this.formInit();
    this.slNum = 0;
    this.displayMessage("","");
    this.stkConDtCls.product = "";
    this.stkConDtCls.warehouse = "";
  }

  prepareStockConDetailsCls() {
    if (this.data.tranNo != undefined && this.data.tranNo != "") {
      this.stkConDtCls.company = this.userDataService.userData.company;
      this.stkConDtCls.location = this.userDataService.userData.location;
      this.stkConDtCls.refNo = this.userDataService.userData.sessionID;
      this.stkConDtCls.user = this.userDataService.userData.userID;
      this.stkConDtCls.langID = this.userDataService.userData.langId;
      this.stkConDtCls.mode = this.data.mode;
      this.stkConDtCls.slNo = this.slNum || 0;
      this.stkConDtCls.tranNo = this.data.tranNo;
      this.stkConDtCls.productName = this.consumptionDetForm.get('product')!.value;
      this.stkConDtCls.property = this.data.property;
      this.stkConDtCls.product = this.prodCode;
      this.stkConDtCls.blockId = this.data.block;
      this.stkConDtCls.unitId = this.flatCode;
      this.stkConDtCls.warehouse = this.consumptionDetForm.get('warehouse')?.value;
      this.stkConDtCls.uom = this.consumptionDetForm.get('uom')!.value;
      this.stkConDtCls.unitRate = parseFloat(this.consumptionDetForm.get('unitRate')!.value.replace(/,/g, ''));
      this.stkConDtCls.quantity = parseFloat(this.consumptionDetForm.get('quantity')!.value.replace(/,/g, ''));
      this.stkConDtCls.rowValue = parseFloat(this.consumptionDetForm.get('rowValue')!.value.replace(/,/g, ''));
      this.stkConDtCls.subWorkType = this.consumptionDetForm.get('subWorkType')!.value;
      this.stkConDtCls.mainWorkType = this.consumptionDetForm.get('mainWorkType')!.value;

    }
    else {
      this.displayMessage(displayMsg.ERROR + "Transaction Number not selected!", TextClr.red);
    }
  }

  onSubmit() {
    this.displayMessage("", "");
    if (this.consumptionDetForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareStockConDetailsCls();
        this.loader.start();
        this.subSink.sink = this.invService.UpdateStockConsDetails(this.stkConDtCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.dataFlag = true;
            this.getStockConDetails(res.tranNoNew, this.consumptionDetForm.get('mode')?.value);
            this.newMsg = res.message;
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.dataFlag = false;
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: Type.PRODUCT,
      Item: this.consumptionDetForm.controls['product'].value
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res && res.data && res.data.nameCount === 1) {
        this.consumptionDetForm.controls['product'].patchValue(res.data.selName);
        this.stkConDtCls.product = res.data.selCode;
      }
      else {
        const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
          width: '90%',
          disableClose: true,
          data: {
            tranNum: this.consumptionDetForm.controls['product'].value, TranType: Type.PRODUCT,
            search: 'Product Search'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result != true && result != undefined) {
            this.consumptionDetForm.controls['product'].patchValue(result.prodName);
            this.consumptionDetForm.controls['uom'].patchValue(result.uom);
            this.consumptionDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.prodCode = result.prodCode;
          }
        });
      }
    });
  }

  onRowClick(row: any) {
    this.consumptionDetForm.patchValue({
      flat: row.unitName,
      uom: row.uom,
      product: row.productName,
      block: row.blockName,
      Property: row.property,
      warehouse: row.warehouse,
      subWorkType: row.subWorkType,
      mainWorkType: row.mainWorkType,
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      unitRate: row.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rowValue: row.rowValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    }, { emitEvent: false });
    this.slNum = row.slNo;
    this.flatCode = row.unitId;
    this.prodCode = row.product;

  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onPageSizeChanged() {

  }
  clearMsgs() {
    this.displayMessage("", "");
  }

  addNew() {
    this.clearMsgs();
    this.slNum = 0;
    this.consumptionDetForm = this.formInit();
  }

  onFlatSearch() {
    this.clearMsgs();
    if (this.consumptionDetForm.controls['flat'].value == "") {
      this.flatCode = "";
    }
    const body = {
      ...this.commonParams(),
      Type: Type.FLAT,
      Item: this.consumptionDetForm.controls['flat'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.consumptionDetForm.controls['flat'].patchValue(res.data.selName);
            this.flatCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  flat: this.consumptionDetForm.controls['flat'].value || '', type: Type.FLAT,
                  search: 'Flat Search', property: this.data.property, block: this.data.block,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.consumptionDetForm.controls['flat'].patchValue(result.unitName);
                  this.flatCode = result.unitId;

                }
              });
            }
          }
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
