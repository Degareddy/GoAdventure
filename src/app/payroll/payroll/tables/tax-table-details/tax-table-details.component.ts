import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { taxTableDetails } from '../../payroll.class';
import { UserDataService } from 'src/app/Services/user-data.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-tax-table-details',
  templateUrl: './tax-table-details.component.html',
  styleUrls: ['./tax-table-details.component.css']
})
export class TaxTableDetailsComponent implements OnInit, OnDestroy {
  dailogchange: boolean = false;
  taxDetForm!: FormGroup;
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subSink: SubSink = new SubSink();
  private taxCls: taxTableDetails = new taxTableDetails();
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "rateType", headerName: "Rate Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "yearCode", headerName: "Year Code", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "fromAmt", headerName: "From Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "toAmt", headerName: "To Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "rate", headerName: "Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "note", headerName: "Notes", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  public rowSelection: 'single' | 'multiple' = 'multiple';
  retMessage: string = "";
  textMessageClass: string = "";
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, search: string, yearCode: string, tableType: string, status: string },
    private userDataService: UserDataService, private payService: PayrollService, private loader: NgxUiLoaderService, private fb: FormBuilder) {
    this.taxDetForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  clear() {
    this.clearMsg();
    this.slNum = 0;
    this.taxDetForm = this.formInit();
  }


  formInit() {
    return this.fb.group({
      rateType: [''],
      fromAmount: ['0.00'],
      toAmount: ['0.00'],
      rate: ['0.00'],
      notes: ['']
    });
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  ngOnInit(): void {
    this.loadData();
  }
  loadData() {
    if (this.data) {
      const body = {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        langId: this.userDataService.userData.langId,
        Item: this.data.yearCode,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID
      }
      this.subSink.sink = this.payService.GetTaxTableDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
  }
  prepareCls() {
    this.taxCls.company = this.userDataService.userData.company;
    this.taxCls.location = this.userDataService.userData.location;
    this.taxCls.user = this.userDataService.userData.userID;
    this.taxCls.refNo = this.userDataService.userData.sessionID;
    this.taxCls.fromAmt = parseFloat(this.taxDetForm.get('fromAmount')?.value.replace(/,/g, ''));
    this.taxCls.toAmt = parseFloat(this.taxDetForm.get('toAmount')?.value.replace(/,/g, ''));
    this.taxCls.rate = this.taxDetForm.get('rate')?.value.replace(/,/g, '');
    this.taxCls.note = this.taxDetForm.get('notes')?.value;
    this.taxCls.rateType = this.taxDetForm.get('rateType')?.value;
    this.taxCls.slNo = this.slNum;
    this.taxCls.mode = this.data.mode;
    this.taxCls.yearCode = this.data.yearCode;
    this.taxCls.tableType = this.data.tableType;
  }
  onUpdate() {
    this.clearMsg();
    if (this.taxDetForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subSink.sink = this.payService.UpdateTaxTableDetails(this.taxCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.loadData();
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
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.taxDetForm.patchValue({
      rateType: event.data.rateType,
      fromAmount: event.data.fromAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      toAmount: event.data.toAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rate: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      notes: event.data.note
    });
    this.taxCls.yearCode = event.data.yearCode;
    this.taxCls.tableType = event.data.tableType;
    this.slNum = event.data.slNo;
  }
}
