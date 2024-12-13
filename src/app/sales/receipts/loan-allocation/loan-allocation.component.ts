import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-loan-allocation',
  templateUrl: './loan-allocation.component.html',
  styleUrls: ['./loan-allocation.component.css']
})
export class LoanAllocationComponent implements OnInit, OnDestroy {
  private subSink: SubSink = new SubSink()
  retMessage: string = "";
  textMessageClass: string = "";
  altered: boolean = true;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [
    { field: "client", headerName: "Client", sortable: true, filter: true, resizable: true, width: 130 },
    {
      field: "loanAmount", headerName: "Loan Amount", sortable: true, resizable: true, width: 150, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
      field: "paidAmount", headerName: "Paid Amount", sortable: true, resizable: true, width: 150, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
      field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 150, valueFormatter: function (params: any) {
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
    // { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true,  width:150 },
    { field: "currency", headerName: "Currency", sortable: true, filter: true, resizable: true, width: 100 },



  ];
  reAllocate() {
    // throw new Error('Method not implemented.');
  }
  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowClick(row: any) {
    this.dialogRef.close(row);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  constructor(private userDataService: UserDataService, private saleService: SalesService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string,
      tranNo: string,
      search: string,
      client: string,
      clientName: string
    }, private dialogRef: MatDialogRef<LoanAllocationComponent>,
  ) { }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }
  loadData() {
    const body = {
      ...this.commonParams(),
      Client: this.data.client,
    }
    try {
      this.subSink.sink = this.saleService.GetLoanBalances(body).subscribe((res: any) => {
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
          this.rowData = [];

        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

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
      refNo: this.userDataService.userData.sessionID,
    };
  }
}

