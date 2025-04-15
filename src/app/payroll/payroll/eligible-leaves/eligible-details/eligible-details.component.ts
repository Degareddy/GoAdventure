import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { eligibleLeavesDetails } from '../../payroll.class';

@Component({
  selector: 'app-eligible-details',
  templateUrl: './eligible-details.component.html',
  styleUrls: ['./eligible-details.component.css']
})
export class EligibleDetailsComponent implements OnInit, OnDestroy {
  dailogchange: boolean = false;
  eligibleForm!: FormGroup;
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subSink: SubSink = new SubSink();
  leaveList: Item[] = [];
  private eligibleCls: eligibleLeavesDetails = new eligibleLeavesDetails();
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "leaveDesc", headerName: "Leave Type", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "leaveType", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "eligibleLeaves", headerName: "Eligible Leaves", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, flex: 1 },

  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  retMessage: string = "";
  textMessageClass: string = "";
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, search: string, yearNo: string, status: string },
    private userDataService: UserDataService, private payService: PayrollService, private masterService: MastersService,
    private loader: NgxUiLoaderService, private fb: FormBuilder) {
    this.eligibleForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    // console.log(this.data);
    this.getData();
    const body: getPayload = {
      ...this.commonParams(),
      item: "PAYROLLLEAVETYPES",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };
    this.subSink.sink = this.masterService.GetMasterItemsList(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.leaveList = res.data;

      }
      else {
        this.retMessage = "Leave Types Not Found";
        this.textMessageClass = "red";
      }
    })
  }
  clear() {
    this.textMessageClass = "";
    this.retMessage = "";
    this.eligibleForm = this.formInit();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  getData() {
    const body = {
      ...this.commonParams(),
      item: this.data.yearNo
    }
    this.subSink.sink = this.payService.GetEligibleLeaveDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        // console.log(res);
        this.rowData = res.data;
      }
      else {
        this.rowData = [];
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  prepareCls() {
    this.eligibleCls.company = this.userDataService.userData.company;
    this.eligibleCls.location = this.userDataService.userData.location;
    this.eligibleCls.user = this.userDataService.userData.userID;
    this.eligibleCls.refNo = this.userDataService.userData.sessionID;

    this.eligibleCls.eligibleLeaves = this.eligibleForm.get('eligibleDetails')?.value;
    this.eligibleCls.leaveType = this.eligibleForm.get('leaveType')?.value;
    this.eligibleCls.remarks = this.eligibleForm.get('remarks')?.value;
    this.eligibleCls.yearNo = this.data.yearNo;
    this.eligibleCls.slNo = this.slNum;
    this.eligibleCls.mode = this.data.mode;
  }
  onUpdate() {
    if (this.eligibleForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.loader.start();
      this.subSink.sink = this.payService.UpdateEligibleLeaveDetails(this.eligibleCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.textMessageClass = 'green';
          this.retMessage = res.message;
          this.getData();
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      })
    }

  }
  onDelete() {
    if (this.eligibleForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.eligibleCls.mode = 'Delete';
      this.loader.start();
      this.subSink.sink = this.payService.UpdateEligibleLeaveDetails(this.eligibleCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.textMessageClass = 'green';
          this.retMessage = res.message;
          this.getData();
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      })
    }

  }
  formInit() {
    return this.fb.group({
      leaveType: [''],
      eligibleDetails: [''],
      remarks: ['']
    });
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
    this.eligibleForm.patchValue({
      leaveType: event.data.leaveType,
      eligibleDetails: event.data.eligibleLeaves,
      remarks: event.data.remarks
    });
    this.slNum = event.data.slNo;
    // this.taxDetForm.patchValue({
    //   rateType: event.data.rateType,
    //   fromAmount: event.data.fromAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    //   toAmount: event.data.toAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    //   rate: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    //   notes: event.data.note
    // });
    // this.taxCls.yearCode = event.data.yearCode;
    // this.taxCls.tableType = event.data.tableType;
    // this.slNum = event.data.slNo;
  }
  
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  New() {
    this.clearMsg();
    this.eligibleForm = this.formInit();
    this.slNum = 0;
  }
}
