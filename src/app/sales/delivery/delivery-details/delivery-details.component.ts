import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import {  SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { InventoryService } from 'src/app/Services/inventory.service';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { deliveryDetails } from '../../sales.class';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-delivery-details',
  templateUrl: './delivery-details.component.html',
  styleUrls: ['./delivery-details.component.css']
})
export class DeliveryDetailsComponent implements OnInit, OnDestroy {
  delDetForm!: FormGroup;
  tranStatus!: string;
  retMessage: string = "";
  textMessageClass: string = "";
  slNum: number = 0;
  prodCode!: string;
  private subSink!: SubSink;
  public dailogchange: boolean = false;
  slValue: boolean = false;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  vatRate: number = 0;
  private delDetCls: deliveryDetails = new deliveryDetails();
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "product", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
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
    field: "rowWeight", headerName: "Row Weight", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  warehouseList: Item[] = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { search: string, tranType: string, tranNo: string, mode: string, status: string }, private dialog: MatDialog,
    private salesService: SalesService, private invService: InventoryService) {
    this.delDetForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy() {
    this.subSink.unsubscribe();
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  ngOnInit() {
    const body = {
      ...this.commonParams(),
      item: "WAREHOUSE",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };
    this.subSink.sink = this.invService.GetMasterItemsList(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.warehouseList = res.data;
      }
    });
    if (this.data.tranNo) {
      this.getDeliveryDet(this.data.tranNo);

    }

  }
  prepareDelCls() {
    this.delDetCls.company = this.userDataService.userData.company;
    this.delDetCls.location = this.userDataService.userData.location;
    this.delDetCls.langID = this.userDataService.userData.langId;
    this.delDetCls.refNo = this.userDataService.userData.sessionID;
    this.delDetCls.user = this.userDataService.userData.userID;
    this.delDetCls.mode = this.data.mode;
    this.delDetCls.product = this.prodCode;
    this.delDetCls.quantity = this.delDetForm.get('quantity')?.value;
    this.delDetCls.rowWeight = this.delDetForm.get('rowWeight')?.value;
    this.delDetCls.slNo = this.slNum;
    this.delDetCls.uom = this.delDetForm.get('uom')?.value;
    this.delDetCls.warehouse = this.delDetForm.get('warehouse')?.value;
    this.delDetCls.tranNo = this.data.tranNo;
  }
  onUpdate() {
    this.clearMsg();
    if (this.delDetForm.invalid) {
      return;
    }
    else {
      this.prepareDelCls();
      this.loader.start();
      this.subSink.sink = this.salesService.UpdateDeliveryItemDetails(this.delDetCls).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getDeliveryDet(res.tranNoNew);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })

    }

  }
  getDeliveryDet(tranNo: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.salesService.GetDeliveryDetails(body).subscribe((res: any) => {
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
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  // onProductSearch() {
  //   const body = {
  //     ...this.commonParams(),
  //     Type: "PRODUCT",
  //     Item: this.delDetForm.controls['prodName'].value,
  //     ItemFirstLevel: "",
  //     ItemSecondLevel: ""
  //   }
  //   this.subSink.sink = this.utldservice.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
  //     if (res.retVal === 0) {
  //       if (res && res.data && res.data.nameCount === 1) {
  //         this.delDetForm.get('prodName')!.patchValue(res.data.selName);
  //         this.delDetForm.get('code')!.patchValue(res.data.selCode);
  //         this.prodCode = res.data.selCode;

  //       }
  //       else {
  //         const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
  //           width: '90%',
  //           disableClose: true,
  //           data: {
  //             'tranNum': this.delDetForm.get('prodName')!.value, 'TranType': "PRODUCT",
  //             'search': 'Product Search'
  //           }
  //         });
  //         dialogRef.afterClosed().subscribe(result => {
  //           this.vatRate = result.vatRate;
  //           this.prodCode = result.prodCode
  //           this.delDetForm.get('prodName')!.patchValue(result.prodName);
  //           this.delDetForm.controls['uom'].patchValue(result.uom);

  //         });
  //       }
  //     }
  //     else {
  //       this.retMessage = res.message;
  //       this.textMessageClass = "red";
  //     }
  //   });
  // }
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
  formInit() {
    return this.fb.group({
      prodName: [{ value: '', disabled: true }],
      uom: [{ value: '', disabled: true }],
      quantity: ['1', Validators.required],
      rowWeight: ['0.00', Validators.required],
      warehouse: ['', Validators.required]
    })
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.prodCode = event.data.product;
    this.slNum= event.data.slNo;
    this.delDetForm.patchValue({
      warehouse: event.data.warehouse,
      uom: event.data.uom,
      prodName: event.data.productName,
      quantity: event.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      rowWeight: event.data.rowWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
}
