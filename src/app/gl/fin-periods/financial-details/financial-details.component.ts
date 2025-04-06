import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { financialPerioddetails } from '../../gl.class';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { DatePipe } from '@angular/common';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Item } from 'src/app/general/Interface/interface';

@Component({
  selector: 'app-financial-details',
  templateUrl: './financial-details.component.html',
  styleUrls: ['./financial-details.component.css']
})
export class FinancialDetailsComponent implements OnInit, OnDestroy {
  finaDetForm!: FormGroup;
  slNum: number = 0;
  retMessage: string = "";
  private subsink: SubSink = new SubSink();
  private finDetCls: financialPerioddetails = new financialPerioddetails();
  textMessageClass: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  periods:Item[]=[
    {
      itemCode:'',itemName:'--Select--'
    },
    {
      itemCode:'Open',itemName:'Open'
    },
    {
      itemCode:'Authorised',itemName:'Authorised'
    },
    {
      itemCode:'Closed',itemName:'Closed'
    },
  ]
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  // { field: "finYrCode", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "periodNo", headerName: "Period No", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "periodName", headerName: "Period Name", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "periodFrom", headerName: "Period From", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    field: "periodTo", headerName: "Period To", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
  { field: "prdStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, flex: 1 },

  ];
  tomorrow = new Date();
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  dailogchange: boolean = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data:
    { search: string, yearCode: string, mode: string, status: string }, private datePipe: DatePipe,
    private userDataService: UserDataService, private loader: NgxUiLoaderService,
    private fb: FormBuilder, private glService: GeneralLedgerService) {
    this.finaDetForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  ngOnInit(): void {
    if (this.data.yearCode) {
      this.getDetails();
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
  getDetails() {
    const body = {
      ...this.commonParams(),
      item: this.data.yearCode
    }
    this.subsink.sink = this.glService.GetFinancialPeriods(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res.data;
        // this.retMessage = res.message;
        // this.textMessageClass = "green";
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });

  }
  prepareCls() {
    this.finDetCls.company = this.userDataService.userData.company;
    this.finDetCls.location = this.userDataService.userData.location;
    this.finDetCls.user = this.userDataService.userData.userID;
    this.finDetCls.refNo = this.userDataService.userData.sessionID;
    this.finDetCls.prdStatus=this.finaDetForm.get('finPeriod')?.value;
    this.finDetCls.mode = this.data.mode;
    this.finDetCls.slNo = this.slNum;

    const fromeDate = this.datePipe.transform(this.finaDetForm.controls['periodFrom'].value, 'yyyy-MM-dd');
    if (fromeDate !== undefined && fromeDate !== null) {
      this.finDetCls.periodFrom = fromeDate.toString();
    } else {
      this.finDetCls.periodFrom = ''; // or any default value you prefer
    }

    const toDate = this.datePipe.transform(this.finaDetForm.controls['periodTo'].value, 'yyyy-MM-dd');
    if (toDate !== undefined && toDate !== null) {
      this.finDetCls.periodTo = toDate.toString();
    } else {
      this.finDetCls.periodTo = ''; // or any default value you prefer
    }

    this.finDetCls.periodName = this.finaDetForm.get('periodName')?.value;
    this.finDetCls.remarks = this.finaDetForm.get('remarks')?.value;
    this.finDetCls.periodNo = this.finaDetForm.get('periodNo')?.value;
    this.finDetCls.finYrCode = this.data.yearCode;

  }
  onUpdate() {
    this.clearMsg();
    if (this.finaDetForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.loader.start();
      this.subsink.sink = this.glService.UpdateFinancialPeriods(this.finDetCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getDetails();
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
  }
  formInit() {
    return this.fb.group({
      periodNo: ['', Validators.required],
      periodName: ['', Validators.required],
      periodFrom: [new Date(), Validators.required],
      periodTo: [new Date(), Validators.required],
      remarks: [''],
      finPeriod:['']
    })
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    // console.log(event.data);
    // this.prodCode = event.data.product;
    this.clearMsg();
    this.slNum = event.data.slNo;
    this.finaDetForm.patchValue({
      periodNo: event.data.periodNo,
      periodName: event.data.periodName,
      periodFrom: event.data.periodFrom,
      periodTo: event.data.periodTo,
      remarks: event.data.remarks,
      finPeriod:event.data.prdStatus
    });
  }
  New() {
    this.clearMsg();
    this.slNum = 0;
    this.formInit();
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
}
