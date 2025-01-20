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

@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.css']
})

export class SearchEngineComponent implements OnInit, OnDestroy, AfterViewInit {
  tranSearchForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  textMessageClass!: string;
  retMessage!: string;
  tranStatus: any = ['ANY','Closed', 'Authorized', 'Open', 'Deleted','Confirmed']
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
  pageSizes = [100, 250, 500];
  pageSize = 100;
  totalAmount:number=0;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true,width: 90 ,hide:true},
  { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 90 },
  { field: "partyName", headerName: "Party Name", sortable: true, filter: true, resizable: true, width: 190 },
  { field: "partyId", headerName: "Party Id", sortable: true, filter: true, resizable: true, width: 190,hide:true },
  { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, width: 190 },

  { field: "tranType", headerName: "Tran Type", sortable: true, filter: true, resizable: true,width: 120 },

  {
    field: "tranAmount", headerName: "Tran Amount", sortable: true, filter: true, resizable: true,width: 120,
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
  {
    field: "totalAmount", headerName: "Total Amount", sortable: true, filter: true, resizable: true,width: 120,
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
  { field: "tranStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 120 },
  {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true,width: 120,
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
  }
  ];
  constructor(protected mastService: MastersService, private userDataService: UserDataService,
    private fb: FormBuilder, private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SearchEngineComponent>,
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
      message: ['']
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
async  search() {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.tranSearchForm.invalid) {
      return
    }
    else {
      const fromDate = new Date(this.tranSearchForm.get('fromDate')!.value);
      const toDate = new Date(this.tranSearchForm.get('toDate')!.value);
      if (fromDate > toDate) {
        this.retMessage = "From date should be less than To date";
        this.textMessageClass = "red";
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
      }
      try {
        this.subSink.sink =await this.mastService.GetTranSearchList(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === "FAIL") {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
            this.rowData = [];
          }
          else {
            this.rowData = res['data'];
            console.log(this.rowData);
            this.calculateTotal(this.rowData);
            this.textMessageClass = 'green';
            this.retMessage = res.message;
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = 'red';
      }

    }
  }
  
  calculateTotal(data:any){
    this.totalAmount = data.reduce((sum: number, item: any) => {
      return sum + (item?.totalAmount || 0); // Safely access totalAmount
    }, 0);
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }


  onRowClick(row: any, i: number) {
    this.dialogRef.close(row.tranNo);
  }
  clear() {
    this.tranSearchForm.reset()
    this.tranSearchForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
  }
  onFilterData(event: any) {
    // console.log(event);
    this.calculateTotal(event);
  }
}
