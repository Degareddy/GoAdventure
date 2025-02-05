import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { SubSink } from 'subsink';
import { productAliasNameDetails } from '../../inventory.class';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  productListForm!: any;
  retMessage!: string;
  textMessageClass!: string;
  slNum: number = 0;
  rowData: any = [];
  private subSink: SubSink;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private prodCls: productAliasNameDetails;
  public gridOptions!: GridOptions;

  columnDefs: any = [
    { field: "slNo", headerName: "SlNo", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "aliasName", headerName: "Alias Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, flex: 1 }
  ]


  constructor(private fb: FormBuilder, private invService: InventoryService,
    public dialog: MatDialog, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, product: string, code: string }, private loader: NgxUiLoaderService
  ) {
    this.productListForm = this.formInit(),
      this.subSink = new SubSink();
    this.prodCls = new productAliasNameDetails();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.getAliasNames(this.data.product);
  }

  formInit() {
    return this.fb.group({
      slNo: [0],
      aliasName: ['', Validators.required],
      remarks: ['', Validators.required]
    })
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(event: any) {
    this.displayMessage("","");
    this.onRowClick(event.data);
  }
  onRowClick(row: any) {
    this.productListForm.patchValue(row);
    this.slNum = row.slNo;
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  getAliasNames(products: string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      item: this.data.code,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    }
    try {
      this.subSink.sink = this.invService.getProductAliasDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
          this.rowData = res['data'];
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

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  productcls() {
    const formControls = this.productListForm.controls;
    this.prodCls = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID,
      mode: this.data.mode,
      slNo: this.slNum,
      code: this.data.code,
      aliasname: formControls.aliasName.value,
      remarks: formControls.remarks.value,
    }
  }
  onUpdate() {
    this.displayMessage("", "");
    if (this.productListForm.invalid) {
      return;
    }
    else {
      this.productcls();
      this.loader.start();
      this.subSink.sink = this.invService.updateProductAliasDetails(this.prodCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal > 100 && res.retVal < 200) {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getAliasNames(this.data.product);
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
  }

  clear() {
    this.productListForm = this.formInit();
  }

  addNew() {
    this.displayMessage("", "");
    this.slNum = 0;
    this.productListForm = this.formInit();
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
        this.onUpdate();
      }
    });
  }




}

