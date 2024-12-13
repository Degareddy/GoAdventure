import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { workdetails } from '../../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-budget-sub-details',
  templateUrl: './budget-sub-details.component.html',
  styleUrls: ['./budget-sub-details.component.css']
})
export class BudgetSubDetailsComponent implements OnInit, OnDestroy {
  private subSink!: SubSink;
  bgtDetForm!: FormGroup;
  slNum: number = 0;
  dataFlag: boolean = false;
  subTasks: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  workCls!: workdetails
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "workType", headerName: "Work Type", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  { field: "workTypeName", headerName: "Work Name", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "subWorkType", headerName: "Sub Task", sortable: true, filter: true, resizable: true, flex: 1 },

  { field: "subWorkTypeName", headerName: "Sub Task Name", sortable: true, filter: true, resizable: true, flex: 1 },

  {
    field: "budgetAmt", headerName: "Budget", sortable: true, filter: true, resizable: true, width: 150, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, workType: string }, private loader: NgxUiLoaderService,
    private mastService: MastersService, protected projService: ProjectsService) {
    this.bgtDetForm = this.formInit();
    this.subSink = new SubSink();
    this.workCls = new workdetails();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      subTask: ['', Validators.required],
      budgetAmt: ['0.00', Validators.required]
    })
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  loadData() {
    const workbody: getPayload = {
      ...this.commonParams(),
      item: "WORKTYPE"
    };
    try {
      const wtypes$ = this.mastService.GetMasterItemsList(workbody);
      this.subSink.sink = forkJoin([wtypes$]).subscribe(
        ([wtRes]: any) => {
          this.subTasks = wtRes['data'];
        },
        error => {
          this.retMessage = error.message;
          this.textMessageClass = 'red';
        }
      );
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    };
    this.getSubTasks(this.data.tranNo);
  }
  getSubTasks(tranNo: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo,
      mainWork:this.data.workType
    }
    this.subSink.sink = this.projService.GetBudgetWorkDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res['data'];
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = 'red';
      }
    });
  }
  ngOnInit(): void {
    this.loadData();
  }
  prepareCls() {
    this.workCls.Company = this.userDataService.userData.company;
    this.workCls.Location = this.userDataService.userData.location;
    this.workCls.LangId = this.userDataService.userData.langId;
    this.workCls.RefNo = this.userDataService.userData.sessionID;
    this.workCls.Mode = this.data.mode;
    this.workCls.SlNo = this.slNum;
    this.workCls.TranNo = this.data.tranNo;
    this.workCls.User = this.userDataService.userData.userID;
    this.workCls.BudgetAmt = parseFloat(this.bgtDetForm.get('budgetAmt')?.value.replace(/,/g, ''));
    this.workCls.SubWorkType = this.bgtDetForm.get('subTask')?.value;
    this.workCls.WorkType = this.data.workType;
  }
  onSubmit() {
    this.clearMsgs();
    if (this.bgtDetForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.loader.start();
      this.subSink.sink = this.projService.UpdateBudgetWorkDet(this.workCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.retMessage = res.message;
          this.textMessageClass = 'green';
          this.getSubTasks(res.tranNoNew);
        }
        else {
          this.dataFlag = false;
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      })
    }
  }
  clearMsgs() {
    this.textMessageClass = "";
    this.retMessage = "";

  }
  addBudget() {
    this.bgtDetForm = this.formInit();
    this.clearMsgs();
    this.slNum = 0;
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
    this.onRowClick(event.data);
  }
  onRowClick(row: any) {
    this.slNum = row.slNo;
    this.data.workType = row.workType;
    this.bgtDetForm.patchValue({
      subTask: row.subWorkType,
      budgetAmt: row.budgetAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    })
  }
}
