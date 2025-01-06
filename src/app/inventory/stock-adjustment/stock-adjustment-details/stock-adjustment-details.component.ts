import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import {  getPayload, getResponse, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { SubSink } from 'subsink';
import { stockAdjDetailsClass } from '../../inventory.class';
import { Item } from 'src/app/general/Interface/interface';

@Component({
  selector: 'app-stock-adjustment-details',
  templateUrl: './stock-adjustment-details.component.html',
  styleUrls: ['./stock-adjustment-details.component.css']
})
export class StockAdjustmentDetailsComponent implements OnInit, OnDestroy {
  adjDetForm!: FormGroup;
  slNum: number = 0;
  dataFlag: boolean = false;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  warehouseList: Item[] = [];
  tblData: any;
  prodCode!: string;
  displayColumns: string[] = [];
  selectedRowIndex!: number;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  dataSource: any;
  mode: string = "";
  adjdetCls!: stockAdjDetailsClass;
  private subSink!: SubSink;
  rowData: any = [];
  newMsg: string = "";
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  public rowSelection: 'single' | 'multiple' = 'multiple';

  columnDef: any = [
    { field: "slNo", headerName: "S.No", width: 90 },
    { field: "product", headerName: "product", sortable: "true", filter: "true", reziable: "true", flex: 1, hide:true },
    { field: "productName", headerName: "product", sortable: "true", filter: "true", reziable: "true", flex: 1 },
    { field: "warehouse", headerName: "Warehouse", sortable: "true", filter: "true", reziable: "true", flex: 1, hide:true },
    { field: "warehouseName", headerName: "Warehouse", sortable: "true", filter: "true", reziable: "true", flex: 1 },
    { field: "uom", headerName: "UOM", sortable: "true", filter: "true", reziable: "true", flex: 1 },
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
      field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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

  ];

  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: {
      tranNo: string, mode: string, status: string
    },
    private userDataService: UserDataService,
    private invService: InventoryService, public dialog: MatDialog,
    protected utlService: UtilitiesService,
  ) {
    this.adjDetForm = this.formInit();
    this.subSink = new SubSink();
    this.adjdetCls = new stockAdjDetailsClass();

  }

  formInit() {
    return this.fb.group({

      //slNo: ['', [Validators.required]],
      productName: ['', [Validators.required]],
      uom: [{ value: '', disabled: true }],
      unitRate: [{ value: '0.00', disabled: true }],
      quantity: ['0', Validators.required],
      warehouseName: ['', [Validators.required, Validators.maxLength(50)]],
      amount: [{ value: '0.00', disabled: true }],
      // remarks: ['', [Validators.required, Validators.maxLength(255)]],

    })
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.mode = this.data.mode;

    this.loadData();
    this.getStockAdjData(this.data.tranNo, this.adjDetForm.get('mode')?.value);
  }

  // loadData(){
  //   const warehouseBody: getPayload = {
  //     ...this.commonParams(),
  //     item: "WAREHOUSE"
  //   };


  //   this.subSink.sink = this.invService.GetMasterItemsList(warehouseBody).subscribe((res: getResponse) => {
  //     if (res.status.toUpperCase() === "SUCCESS") {
  //       this.warehouseList =  res['data'].map((item: any) => {
  //         return {
  //           itemCode: item.itemCode,
  //           itemName: item.itemName
  //         };
  //       });
  //     }
  //   });
  // }

  loadData() {
    const warehouseBody: getPayload = {
      ...this.commonParams(),
      item: "WAREHOUSE",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };

    this.subSink.sink = this.invService.GetMasterItemsList(warehouseBody).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.warehouseList = res['data'].map((item: any) => {
          return {
            itemCode: item.itemCode,
            itemName: item.itemName
          };
        });


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

  onRowClick(row: any) {
    console.log(row);
    this.adjDetForm.controls['warehouseName'].setValue(row.warehouse);
    this.adjDetForm.patchValue({
      product: row.product,
      productName : row.productName,
      warehouse: row.warehouse,
      // warehouseName: row.warehouseName,

      uom:row.uom,
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      unitRate: row.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount: row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    this.slNum = row.slNo;
    this.prodCode = row.product;
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.adjDetForm.controls['productName'].value
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res && res.data && res.data.nameCount === 1) {
        this.adjDetForm.controls['productName'].patchValue(res.data.selName);

       // this.adjdetCls.productcode = res.data.selCode;
      }
      else {
        const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
          width: '90%',
          disableClose: true,
          data: {
            'tranNum': this.adjDetForm.controls['productName'].value, 'TranType': "PRODUCT",
            'search': 'Product Search'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result != true) {
            this.adjDetForm.controls['productName'].patchValue(result.prodName);
            this.adjDetForm.controls['uom'].patchValue(result.uom);
            this.adjDetForm.controls['unitRate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.prodCode = result.prodCode;
          }
        });
      }
    });
  }

  onUnitRateChanged() {
    let numQty: number;
    let numRate: number;
    let uRate = this.adjDetForm.controls['unitRate'].value.toString();
    let strQty = this.adjDetForm.controls['quantity'].value.toString();

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

    this.adjDetForm.controls['unitRate'].setValue(numRate.toLocaleString(undefined, options));
    this.adjDetForm.controls['amount'].setValue(amount.toLocaleString(undefined, options));

  }

  onQuantityFocusOut() {
    let numQty: number;
    let numRate: number;
    let uRate = this.adjDetForm.controls['unitRate'].value.toString();
    let strQty = this.adjDetForm.controls['quantity'].value.toString();
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

    this.adjDetForm.controls['quantity'].setValue(numQty.toLocaleString(undefined, options1));
    this.adjDetForm.controls['amount'].setValue(amount.toLocaleString(undefined, options));
  }

  clear() {

  }
  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  addNew() {
    this.clearMsgs();
    this.slNum = 0;
    this.adjDetForm = this.formInit();
  }

  onPageSizeChanged() {

  }

  Close() {

  }
  reset() {
    this.adjDetForm.reset();
  }
  // get(tranNo: any) {

  //   const body = {
  //     Company: this.userData.company,
  //     Location: this.userData.location,
  //     User: this.userData.userID,
  //     TranNo: tranNo,
  //     refNo: this.userData.sessionID,
  //     LangId: 1
  //   };
  //   try {
  //     this.loader.start();
  //     this.invService.GetStockTransferDetails(body).subscribe((res: any) => {
  //       this.loader.stop();
  //       //console.log(res.data);
  //       this.dataSource = res['data'];
  //       this.dataSource = new MatTableDataSource(res.data);
  //       this.dataSource.paginator = this.paginator;
  //       this.dataSource.sort = this.matsort;
  //       // this.mrhForm.setValue(res.data);
  //       // this.status = res.data.tranStatus;
  //     });
  //   }
  //   catch (ex: any) {
  //     //console.log(ex);
  //     this.retMessage = ex;
  //     this.textMessageClass = 'red';
  //   }

  // }

  getStockAdjData(tarnNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tarnNo,
      LangId: this.userDataService.userData.langId
    }
    try {
      this.subSink.sink = this.invService.GetStockAdjDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != 'FAIL' || res.status.toUpperCase() != "ERROR") {
          this.rowData = res['data'];
          if (this.data.mode != "View" && this.newMsg != "") {
            this.retMessage = this.newMsg;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }
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

  StockAdjDetailsCls() {
    if (this.data.tranNo != undefined && this.data.tranNo != "") {
      this.adjdetCls.company = this.userDataService.userData.company;
      this.adjdetCls.location = this.userDataService.userData.location;
      this.adjdetCls.refNo = this.userDataService.userData.sessionID;
      this.adjdetCls.user = this.userDataService.userData.userID;
      this.adjdetCls.langID = this.userDataService.userData.langId;
      this.adjdetCls.mode = this.data.mode;

      this.adjdetCls.slNo = this.slNum || 0;
      this.adjdetCls.tranNo = this.data.tranNo;
     // this.adjdetCls.product = this.adjDetForm.get('product')!.value;
      this.adjdetCls.product = this.prodCode;

      this.adjdetCls.warehouse = this.adjDetForm.get('warehouseName')?.value;

      //this.adjdetCls.warehouse = selectedWarehouseItem.itemName;
      this.adjdetCls.uom = this.adjDetForm.get('uom')!.value;
      this.adjdetCls.unitRate = parseFloat(this.adjDetForm.get('unitRate')!.value.replace(/,/g, ''));
      this.adjdetCls.quantity = parseFloat(this.adjDetForm.get('quantity')!.value.replace(/,/g, ''));
      this.adjdetCls.amount = parseFloat(this.adjDetForm.get('amount')!.value.replace(/,/g, ''));

    }
    else {
      this.retMessage = "Transaction Number not selected!";
      this.textMessageClass = "red";

    }
  }

  onSubmit() {
    this.retMessage = "";
    this.textMessageClass = ""
    if (this.adjDetForm.invalid) {
      return;
    }
    else {
      try {
        this.StockAdjDetailsCls();
        this.loader.start();
        this.subSink.sink = this.invService.UpdateStockAdjDetails(this.adjdetCls)
          .subscribe((res: any) => {
            console.log(res);
            this.loader.stop;
            if (res.status.toUpperCase() === "SUCCESS") {
              this.dataFlag = true;
              this.getStockAdjData(res.tranNoNew, this.mode);
              this.newMsg = res.message;
            }
            else {
              this.retMessage = res.message;
              this.textMessageClass = "red"
              this.dataFlag = false;
            }
          });
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }
}
