
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { SubSink } from 'subsink';
import { materialRequestDetails } from '../../inventory.class';
import { UserDataService } from 'src/app/Services/user-data.service';
import {  nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { Item } from 'src/app/general/Interface/interface';

@Component({
  selector: 'app-material-request-details',
  templateUrl: './material-request-details.component.html',
  styleUrls: ['./material-request-details.component.css']
})
export class MaterialRequestDetailsComponent implements OnInit, OnDestroy {
  mrhReqForm!: any;
  modes: Item[] = [];
  textMessageClass!: string;
  retMessage!: string;
  slNum!: number;
  mode!: string;
  private subSink!: SubSink;
  selectedRowIndex: number = -1;
  materialdetcls!: materialRequestDetails;
  dataFlag: boolean = false;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  dialogOpen = false;
  newMsg: string = "";
  columnDef: any = [{ field: "slNo", headerName: "S.No", width: 90 },
  { field: "product", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1, hide:true },
  { field: "productName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1 },
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
  }
  ]
  constructor(private userDataService: UserDataService,
    public dialog: MatDialog, private invService: InventoryService, protected utlService: UtilitiesService,
    private _formBuilder: FormBuilder, private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNum: string, TranType: string, search: string }) {
    this.mrhReqForm = this.formInit();
    this.subSink = new SubSink();
    this.materialdetcls = new materialRequestDetails();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this._formBuilder.group({
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      uom: [{ value: '', disabled: true }],
      quantity: ['1', Validators.required]
    })
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

  ngOnInit() {

    this.mode = this.data.mode;
    this.getrequestDetails();
    // this.mrhReqForm = this._formBuilder.group
  }

  prepareReqDetCls() {
    this.materialdetcls.company = this.userDataService.userData.company;
    this.materialdetcls.location = this.userDataService.userData.location;
    this.materialdetcls.langID = this.userDataService.userData.langId;;
    this.materialdetcls.user = this.userDataService.userData.userID;
    this.materialdetcls.refNo = this.userDataService.userData.sessionID;
    this.materialdetcls.mode = this.mode;
    this.materialdetcls.slNo = this.slNum || 0;
    this.materialdetcls.tranNo = this.data.tranNum;
    this.materialdetcls.uom = this.mrhReqForm.get('uom').value;
    this.materialdetcls.quantity = this.mrhReqForm.get('quantity').value;
  }

  onSubmit() {
    this.prepareReqDetCls();
    this.loader.start();
    try {
      this.subSink.sink = this.invService.UpdateMaterialRequestDetails(this.materialdetcls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.getrequestDetails();
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }

  addMaterialRequest() {
    this.mrhReqForm.reset();
    this.mrhReqForm = this.formInit();
  }

  onRowClick(row: any) {
    this.slNum = row.slNo;
    this.mrhReqForm.patchValue(row);
    this.mrhReqForm.controls['productName'].setValue(row.productName);
    this.materialdetcls.product = row.product;
    this.materialdetcls.productName = row.productName;
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  getrequestDetails() {
    const body = {
      ...this.commonParams(),
      TranNo: this.data.tranNum,
      LangId: this.userDataService.userData.langId,
    };
    try {
      this.loader.start();
      this.invService.GetMaterialRequestDetails(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
        else {
          this.rowData = res['data'];
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.mrhReqForm.controls['productName'].value

    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res && res.data && res.data.nameCount === 1) {
        this.mrhReqForm.controls['productName'].patchValue(res.data.selName);
        this.materialdetcls.product = res.data.selCode;
        // this.mrhReqForm.controls['uom'].patchValue(res);
      }
      else {
        const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
          width: '90%',
          disableClose: true,
          data: {
            'tranNum': this.mrhReqForm.controls['productName'].value, 'TranType': "PRODUCT",
            'search': 'Product Search'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result != true) {
            this.mrhReqForm.controls['productName'].patchValue(result.prodName);
            this.materialdetcls.product = result.prodCode;
            this.mrhReqForm.controls['uom'].patchValue(result.uom);
          }
        });
      }
    });
  }

}
