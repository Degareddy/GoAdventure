import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InventoryService } from 'src/app/Services/inventory.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { ToastrService } from 'ngx-toastr';
import { stocktransferDetailsclass } from '../../inventory.class';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { WareHouseSearchComponent } from '../../stock-transfer/ware-house-search/ware-house-search.component';
// import { WareHouseSearchComponent } from '../ware-house-search/ware-house-search.component';
@Component({
  selector: 'app-receipt-details',
  templateUrl: './receipt-details.component.html',
  styleUrls: ['./receipt-details.component.css']
})
export class ReceiptDetailsComponent implements OnInit, OnDestroy {
  trfDetForm!: FormGroup;
  prodCode!: string;
  masterParams!: MasterParams;
  retMessage!: string;
  selProdCode!: string;
  retNum!: number;
  textMessageClass!: string;
  modes: Item[] = [];
  slNum: number = 0;
  stkTrfDtCls!: stocktransferDetailsclass;
  slValue: boolean = false;
  private subSink!: SubSink;
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
  columnDef: any = [{ field: "slNo", headerName: "S.No", width: 90 },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "product", headerName: "Product Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, flex: 1 },
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
    }
  },
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
  }
  ]

  constructor(private fb: FormBuilder, private invService: InventoryService,
    protected router: Router, private userDataService: UserDataService,
    protected utlService: UtilitiesService,
    public dialog: MatDialog, private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.trfDetForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.stkTrfDtCls = new stocktransferDetailsclass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      prodCode: ['', [Validators.required, Validators.maxLength(50)]],
      uom: [{ value: '', disabled: true }],
      lotNo: [{ value: '0', disabled: true }],
      unitRate: [{ value: '0.00', disabled: true }],
      quantity: [{ value: '1', disabled: true }],
      warehouse: ['', [Validators.required, Validators.maxLength(50)]],
      rowValue: [{ value: '0.00', disabled: true }]
    })
  }

  ngOnInit(): void {
    this.getTransferReceiptDetails(this.data.tranNo, this.trfDetForm.get('mode')?.value);
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

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }


  getTransferReceiptDetails(tarnNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tarnNo,
      LangId: this.userDataService.userData.langId
    }
    try {
      this.subSink.sink = this.invService.GetTransferReceiptDetails(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() != 'FAIL') {
          if (mode != "View") {
            this.retMessage = this.newMsg;
            this.textMessageClass = "green";
          }
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
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

  clear() {
    this.trfDetForm = this.formInit();
    this.slNum = 0;
    this.retMessage = "";
    this.textMessageClass = "";
    this.stkTrfDtCls.product = "";
    this.stkTrfDtCls.warehouse = "";
  }

  prepareStockCls() {
    this.stkTrfDtCls.company = this.userDataService.userData.company;
    this.stkTrfDtCls.location = this.userDataService.userData.location;
    this.stkTrfDtCls.refNo = this.userDataService.userData.sessionID;
    this.stkTrfDtCls.user = this.userDataService.userData.userID;
    this.stkTrfDtCls.langID = this.userDataService.userData.langId;
    this.stkTrfDtCls.mode = this.data.mode;
    this.stkTrfDtCls.slNo = this.slNum || 0;
    this.stkTrfDtCls.tranNo = this.data.tranNo;
    this.stkTrfDtCls.uom = this.trfDetForm.get('uom')!.value;
    this.stkTrfDtCls.quantity = parseFloat(this.trfDetForm.controls['quantity'].value.replace(/,/g, ''));
    this.stkTrfDtCls.unitRate = parseFloat(this.trfDetForm.controls['unitRate'].value.replace(/,/g, ''));
    this.stkTrfDtCls.lotNo = this.trfDetForm.get('lotNo')!.value;
    this.stkTrfDtCls.rowValue = 0;
  }

  onSubmit() {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.trfDetForm.invalid) {
      return;
    }
    else {
      this.prepareStockCls();
      this.subSink.sink = this.invService.UpdateStockTransferDetails(this.stkTrfDtCls).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.newMsg = res.message;
          this.textMessageClass = "green";
          this.getTransferReceiptDetails(res.tranNoNew, this.trfDetForm.get('mode')?.value);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.trfDetForm.controls['prodCode'].value

    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res && res.data && res.data.nameCount === 1) {
        this.trfDetForm.controls['prodCode'].patchValue(res.data.selName);
        this.stkTrfDtCls.product = res.data.selCode;
      }
      else {
        const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
          width: '90%',
          disableClose: true,
          data: {
            'tranNum': this.trfDetForm.controls['prodCode'].value, 'TranType': "PRODUCT",
            'search': 'Product Search'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result != true) {
            this.trfDetForm.controls['prodCode'].patchValue(result.prodName);
            this.trfDetForm.controls['uom'].patchValue(result.uom);
            this.stkTrfDtCls.product = result.prodCode;
          }
        });
      }
    });
  }

  searchWarehouse() {
    const dialogRef: MatDialogRef<WareHouseSearchComponent> = this.dialog.open(WareHouseSearchComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'Type': this.stkTrfDtCls.product,
        'Item': this.trfDetForm.controls['warehouse'].value,
        'search': 'Warehouse Search'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != true) {
        this.trfDetForm.controls['warehouse'].patchValue(result.whName);
        this.trfDetForm.controls['lotNo'].patchValue(result.lotNo);
        this.trfDetForm.controls['unitRate'].patchValue(result.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        this.stkTrfDtCls.warehouse = result.whNo;
      }
    });
  }

  onRowClick(row: any) {
    this.trfDetForm.patchValue({
      prodCode: row.productName,
      uom: row.uom,
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      warehouse: row.warehouse,
      lotNo: row.lotNo,
      rowValue: row.rowValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    this.slNum = row.slNo;
    this.stkTrfDtCls.product = row.product;
    this.stkTrfDtCls.warehouse = row.whCode;
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

  warehouse(event: any) {
    const body = {
      ...this.commonParams(),
      Type: "WAREHOUSE",
      Item: event
    }
    if (event) {
      try {
        this.subSink.sink = this.invService.GetWarehouseDetails(body).subscribe((res: any) => {
          const dataToPatch = { ...res.data };
          delete dataToPatch.mode;
          this.trfDetForm.patchValue(dataToPatch);
        });
      }
      catch (ex: any) {
        this.toastr.info(ex, "Exception");
      }
    }
  }

}
