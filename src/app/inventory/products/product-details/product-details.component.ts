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

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit,OnDestroy {
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
    public dialog: MatDialog,private userDataService: UserDataService,
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
    this.load();

  }

  formInit() {
    return this.fb.group({
      slNo: [0],
      aliasName: ['', Validators.required],
      remarks: ['', Validators.required]
    })
  }

  load() {

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(event: any) {
    //console.log(event.data);
    this.retMessage = "";
    this.textMessageClass = "";
    this.onRowClick(event.data);
  }
  onRowClick(row: any) {
    this.productListForm.patchValue(row);
    this.slNum = row.slNo;
    //this.slNum = row.data.slNo;
    //this.productListForm.controls['aliasName'].setValue(row.data.product);
    //this.productListForm.controls['aliasName'].setValue(row.data.code);
    // this.productListForm.controls['remarks'].setValue(row.data.remarks);
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
        console.log(res);
        if (res.status.toUpperCase() == "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
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

  hanldeError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }

  onUpdate() {
    //updateProductAliasDetails
    //this.submitted = true;
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
          this.hanldeError(res);
        }
      });
    }
  }

  clear() {
    this.productListForm = this.formInit();
  }

  addNew() {
    this.clearMsgs();
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
      console.log(dialogResult);
      if (dialogResult) {
        this.onUpdate();
      }
    });
  }
  // deleteSelectedRow() {
  //   if (this.data.mode.toUpperCase() == "DELETE") {
  //     // const selRow = this.get();

  //     const selectedRows = this.gridApi.getSelectedRows();
  //     console.log(selectedRows);
  //     if (selectedRows.length === 0) {
  //       this.retMessage = "No row selected for deletion.";
  //       this.textMessageClass = "red";
  //       return;
  //     }

  //     this.loader.start();
  //     this.subSink.sink = this.invService.updateProductAliasDetails(selectedRows).subscribe((res: any) => {
  //       this.loader.stop();
  //       if (res.status.toUpperCase() === "SUCCESS") {
  //         this.gridApi.applyTransaction({ remove: selectedRows });

  //         this.retMessage = "Selected row(s) deleted successfully.";
  //         this.textMessageClass = "green";
  //       } else {
  //         this.retMessage = res.message;
  //         this.textMessageClass = "red";
  //       }
  //     }, (error) => {
  //       console.error("Error deleting selected row(s):", error);
  //       this.retMessage = "Error deleting selected row(s).";
  //       this.textMessageClass = "red";
  //       this.loader.stop();
  //     });
  //   }
  // }

  // getseletedRow() {
  //   const selectedRows = this.gridApi.getSelectedRows()?.length;
  //   if(selectedRows == 1)
  //     {
  //       return true;
  //     }
  //     else{
  //       return false;
  //     }
  //   console.log(selectedRows); // You can access selected rows here
  // }




}

