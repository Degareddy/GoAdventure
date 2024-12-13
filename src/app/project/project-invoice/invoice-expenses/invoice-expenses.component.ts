import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { invoiceDetailClass } from '../../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
@Component({
  selector: 'app-invoice-expenses',
  templateUrl: './invoice-expenses.component.html',
  styleUrls: ['./invoice-expenses.component.css']
})
export class InvoiceExpensesComponent implements OnInit, OnDestroy {
  slNum: number = 0;
  itemsList: any = [];
  vatAmount: string = "0";
  private invDetailCls: invoiceDetailClass
  private subSink!: SubSink;
  textMessageClass: string="";
  retMessage: string="";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  public vatTypes: any = [];
  dataFlag: boolean = false;
  refNo!: string;
  amount: number = 0;
  net: number = 0;
  vatType!: string;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80, resizable: true, },
  { field: "referenceNo", headerName: "Ref No", sortable: true, filter: true, resizable: true },
  {
    field: "refCostAmount", headerName: "Ref Amount", sortable: true, filter: true, resizable: true, flex: 1,
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
  { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true },

  ];
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(public dialog: MatDialog,
    private projectService: ProjectsService, private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, tranNo: string, status: string,
      complaintType: string, unit: string, block: string, complaint: string,
      tenant: string, priority: string, complaintTypeName: string, property: string
    }, private userDataService: UserDataService) {
    this.subSink = new SubSink();
    this.invDetailCls = new invoiceDetailClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.GetTenantInvoiceCosts(this.data.tranNo);
  }

  apply() {
    this.invDetailCls.user = this.userDataService.userData.userID;
    this.invDetailCls.company = this.userDataService.userData.company;
    this.invDetailCls.location = this.userDataService.userData.location;
    this.invDetailCls.slNo = this.slNum;
    this.invDetailCls.tranNo = this.data.tranNo;
    this.invDetailCls.mode = this.data.mode;
    try {
    this.loader.start();
      this.subSink.sink = this.projectService.UpdateTenantInvoiceDet(this.invDetailCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.GetTenantInvoiceCosts(res.tranNoNew);

          if (this.slNum === 0) {
            const highestSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
              return Math.max(maxSlNo, currentItem.slNo);
            }, 0);
            console.log('Highest slNo:', highestSlNo);
            this.slNum = highestSlNo;
          }
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();

      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  add() {
    this.slNum = 0;
    this.refNo = "";
    this.amount = 0;
    this.retMessage = "";
    this.textMessageClass = "";
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
        this.apply();
      }
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.slNum = event.data.slNo;
    this.refNo = event.data.referenceNo,
      this.amount = event.data.refCostAmount;

  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  pullData() {
    const body = {
      ...this.commonParams(),
      tranNo: this.data.tranNo,
      langID: this.userDataService.userData.langId
    }
    try {
      this.loader.start()
      this.subSink.sink = this.projectService.pullTenantInvoiceCosts(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
          this.dataFlag = true;
          this.retMessage = res.message;
          this.textMessageClass = 'green';
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
          this.dataFlag = false;
        }
      });
    }
    catch (ex: any) {

    }
  }

  GetTenantInvoiceCosts(tranNo: string) {
    const invDetBody = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo,
      issueStatus: this.data.status
    }
    try {
      this.subSink.sink = this.projectService.GetTenantInvoiceCosts(invDetBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
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


}
