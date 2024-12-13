import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UserData } from 'src/app/admin/admin.module';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-receipt-details',
  templateUrl: './receipt-details.component.html',
  styleUrls: ['./receipt-details.component.css']
})

export class ReceiptDetailsComponent implements OnInit, OnDestroy {
  formName = "receipt details";
  reactiveForm!: FormGroup
  textMessageClass: any;
  retMessage: any;
  rowData: any = [];
  columnDefs: any = [
    { field: "slNo", headerName: "S.No", sortable: true, filter: true, resizable: true, width: 80 },
    { field: "refDocNo", headerName: "Doc No", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "docAmt", headerName: "Doc Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
      field: "receiptAmt", headerName: "Receipt Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
      field: "balAmt", headerName: "Bal Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
      field: "refDocDate", headerName: "Doc Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
        // Format date as dd-MM-yyyy
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },
    {
      field: "receiptDueDate", headerName: "Due Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
        // Format date as dd-MM-yyyy
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },


  ];
  private subSink!: SubSink;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  userData!: UserData;
  currency: any;
  constructor(private formBuilder: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: { tranNo: string, mode: string },
    private dialogRef: MatDialogRef<ReceiptDetailsComponent>, private loader: NgxUiLoaderService,private userDataService: UserDataService,
    private saleService: SalesService) {
    this.reactiveForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {

    this.loadData();

  }
  commomParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      langId: this.userDataService.userData.langId,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID
    }
  }
  loadData() {
    const service1 = this.saleService.GetMasterItemsList({ ...this.commomParams(), item: "CURRENCY" });
    this.subSink.sink = forkJoin([service1]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        this.currency = res1.data;
      },
      (error: any) => {
        this.retMessage = error.message;
        this.textMessageClass = "red";
      }
    );
    const body = {
      ...this.commomParams(), TranNo: this.data.tranNo
    }
    this.subSink.sink = this.saleService.GetReceiptAllocatedDetails(body).subscribe((res: any) => {
      console.log(res);
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res.data;
      }
      else {
        this.rowData = [];
        this.handleError(res);
      }
    });
  }
  handleSuccess(res: any) {
    this.textMessageClass = "green";
    this.retMessage = res.message;
  }
  handleError(res: any) {
    this.textMessageClass = "red";
    this.retMessage = res.message;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onRowClick(row: any) {
    this.reactiveForm.patchValue({
      SlNo: row.slNo,
      RefDocNo: row.refDocNo,
      RefDocDate: row.refDocDate,
      ReceiptDueDate: row.receiptDueDate,
      Currency: row.currency,
      CurrencyName: row.currencyName,
      ExchRate: row.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      DocAmt: row.docAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      BalAmt: row.balAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ReceiptAmt: row.receiptAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      Remarks: row.remarks
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }


  onSubmit() {
    if (this.reactiveForm.valid) {
      // console.log(this.reactiveForm.value);
    } else {
    }
  }
  clear() {
    this.reactiveForm = this.formInit();
    this.retMessage="";
    this.textMessageClass="";
  }
  onCurrencySelectionChange(itemCode: string) {
    const selectedItem = this.currency.find((item: any) => item.itemCode === itemCode);
    if (selectedItem) {
      this.reactiveForm.get('CurrencyName')?.setValue(selectedItem.itemName);
    } else {
      this.reactiveForm.get('CurrencyName')?.setValue('');
    }
  }
  formInit() {
    return this.formBuilder.group({
      SlNo: [{ value: '', disabled: true }],
      RefDocNo: [{ value: '', disabled: true }],
      RefDocDate: [{ value: new Date(), disabled: true }],
      ReceiptDueDate: [{ value: new Date(), disabled: true }],
      Currency: [{ value: '', disabled: true }],
      CurrencyName: [{ value: '', disabled: true }],
      ExchRate: [{ value: 0, disabled: true }],
      DocAmt: [{ value: 0, disabled: true }],
      BalAmt: [{ value: 0, disabled: true }],
      ReceiptAmt: [0, Validators.required],
      Remarks: ['']
    });
  }
  fetchDetails() {
    this.retMessage = "";
    this.textMessageClass = "";
    const body = {
      ...this.commomParams(),
      tranNo: this.data.tranNo
    }
    console.log(body);
    this.loader.start();
    this.subSink.sink = this.saleService.GetReceiptDetToAllocate(body).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === "SUCCESS") {
        console.log(res);
        this.rowData = res.data;
      }
      else {
        this.handleError(res);
      }
    })
  }
}
