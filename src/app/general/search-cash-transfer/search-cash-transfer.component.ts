import { AfterViewInit, ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service'
import { MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-search-cash-transfer',
  templateUrl: './search-cash-transfer.component.html',
  styleUrls: ['./search-cash-transfer.component.css']
})
export class SearchCashTransferComponent implements OnInit, OnDestroy {

  tranSearchForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  textMessageClass!: string;
  retMessage!: string;
  tranStatus: any = ['ANY', 'Closed', 'Authorized', 'Open', 'Deleted', 'Confirmed'];
  allocationStatus: any = ['Allocated', 'Not Allocated', 'Partial Allocated'];
  masterParams!: MasterParams;
  tranNo!: any[];
  searchName!: string;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private subSink!: SubSink;
  loader!: NgxUiLoaderService;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  paymentAmount: number = 0;
  receivedAmount: number = 0;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 100 },
  { field: "partyName", headerName: "Party", sortable: true, filter: true, resizable: true, width: 280 },
  { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, width: 380 },
  { field: "tranType", headerName: "Tran Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "tranForDesc", headerName: "Tran For", sortable: true, filter: true, resizable: true, flex: 1 },

  { field: "tranStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "allocStatus", headerName: "Allocation", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1,
    valueFormatter: function (params: any) {
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
    field: "totalAmount", headerName: "Total Amount", sortable: true, filter: true, resizable: true, flex: 1,
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    },
    type: 'rightAligned',
    cellStyle: { justifyContent: "flex-end" },
  },
  ];
  constructor(protected mastService: MastersService, private userDataService: UserDataService,
    private fb: FormBuilder, private datePipe: DatePipe,private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SearchCashTransferComponent>,
    private loaderService: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.tranSearchForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngAfterViewInit(): void {
    this.loader = this.loaderService;
  }

  ngOnInit(): void {

    this.searchName = this.data.search;
    if (this.data.tranNum) {
      this.tranSearchForm.get('tranNo')!.patchValue(this.data.tranNum);
    }
    if (this.data.supplier || this.data.party) {
      this.tranSearchForm.get('client')?.patchValue(this.data.supplier || this.data.party);

    }
    this.search();
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.dialogRef.close(event.data.tranNo);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  formInit() {
    return this.fb.group({
      tranType: [''],
      tranNo: [''],
      party: [''],
      slNo: [''],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), Validators.required],
      toDate: [new Date(), Validators.required],
      tranStatus: ['ANY'],
      client: [''],
      message: [''],
      allocationStatus: ['']
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
  async search() {
    this.displayMessage("", "");
    if (this.tranSearchForm.invalid) {
      return
    }
    else {
      const fromDate = new Date(this.tranSearchForm.get('fromDate')!.value);
      const toDate = new Date(this.tranSearchForm.get('toDate')!.value);
      if (fromDate > toDate) {
        this.displayMessage(displayMsg.ERROR + "From date should be less than To date", TextClr.red);
        return;
      }
      const body = {
        ...this.commonParams(),
        TranType: this.data.TranType,
        TranNo: this.tranSearchForm.get('tranNo')!.value,
        Party: this.tranSearchForm.get('client')!.value,
        FromDate: this.datePipe.transform(this.tranSearchForm.get('fromDate')!.value, 'yyyy-MM-dd'),
        ToDate: this.datePipe.transform(this.tranSearchForm.get('toDate')!.value, 'yyyy-MM-dd'),
        TranStatus: this.tranSearchForm.get('tranStatus')!.value,
        AllocStatus: this.tranSearchForm.get('allocationStatus')!.value,
      }
      try {
        this.subSink.sink = await this.mastService.GetRctPmtTranSearchList(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else {
            this.rowData = res['data'];
            const totalsByTranType = this.calculateTotalByTranType(this.rowData);
            // console.log(totalsByTranType);
            this.receivedAmount = totalsByTranType.RECEIPT || 0;
            this.paymentAmount = totalsByTranType.PAYMENT || 0;
            this.cdr.detectChanges();
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }
  }
  onFilterData(event: any) {
     console.log(event);
     const totalsByTranType = this.calculateTotalByTranType(event);
     this.receivedAmount = totalsByTranType.RECEIPT || 0;
     this.paymentAmount = totalsByTranType.PAYMENT || 0;
     this.cdr.detectChanges();
  }
  calculateTotalByTranType = (data: any[]) => {
    return data.reduce((acc, item) => {
      const { tranType, totalAmount } = item;
      acc[tranType] = (acc[tranType] || 0) + totalAmount;
      return acc;
    }, {} as { [key: string]: number });
  };



  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onRowClick(row: any, i: number) {
    this.dialogRef.close(row.tranNo);
  }
  clear() {
    this.tranSearchForm.reset()
    this.tranSearchForm = this.formInit();
    this.displayMessage("", "");
  }

}
