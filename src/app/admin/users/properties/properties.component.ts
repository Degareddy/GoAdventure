import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AdminService } from 'src/app/Services/admin.service';
import { MastersService } from 'src/app/Services/masters.service';
import { userBranchClass } from '../../admin.class';
import { Router } from '@angular/router';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { BranchMappingResponse, getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.css']
})
export class PropertiesComponent implements OnInit, OnDestroy {
  propertyForm!: FormGroup;
  @Input() max: any;
  private branchCls: userBranchClass;
  today = new Date();
  textMessageClass: string = "";
  retMessage: string = "";
  rowData: any = [];
  branchList: Item[] = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subsink!: SubSink;
  columnDefs: any = [
    { field: "branchName", headerName: "Mapped Branch", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "dateMapped", headerName: "Mapped On", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    { field: "branch", headerName: "Branch", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  ];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private adminService: AdminService,
    private masterService: MastersService, protected router: Router, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, userId: string }) {
    this.propertyForm = this.formInit();
    this.subsink = new SubSink();
    this.branchCls = new userBranchClass();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  ngOnInit() {
    this.loadData();
  }
  branchChanged(branch: string) {
    this.clearMsgs();
    this.branchCls.branch = branch;
  }
  onSubmit() {
    this.clearMsgs();
    if (this.propertyForm.invalid) {
      this.retMessage = "Form ivalid enter all required fields!";
      this.textMessageClass = "red";
      return;
    }
    else {
      this.branchCls.company = this.userDataService.userData.company;
      this.branchCls.location = this.userDataService.userData.location;
      this.branchCls.mode = this.data.mode;
      this.branchCls.refNo = this.userDataService.userData.sessionID;
      this.branchCls.remarks = "";
      this.branchCls.user = this.userDataService.userData.userID;
      this.branchCls.userId = this.data.userId;
      this.loader.start();
      this.subsink.sink = this.adminService.UpdateUserBranches(this.branchCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getUserBranchDetails(this.data.userId);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })
    }
  }
  close() {
    this.router.navigateByUrl('/home');
  }
  clear() {
    this.propertyForm = this.formInit();
    this.clearMsgs();
  }
  Map() {
    this.branchCls.mapStatus = "MAP";
    this.onSubmit();
  }
  unMap() {
    this.branchCls.mapStatus = "UNMAP";
    this.onSubmit();
  }
  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    }
  }
  loadData() {
    this.getUserBranchDetails(this.data.userId);
    const branchBody: getPayload = {
      ...this.commonParams(),
      item: 'CMPUSERBRANCH',
      mode:this.data.mode
    };
    try {
      this.subsink.sink = this.masterService.GetMasterItemsList(branchBody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.branchList = res['data'];
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }
  getUserBranchDetails(item: string) {
    const body: getPayload = {
      ...this.commonParams(),
      item: item
    }
    try {
      this.subsink.sink = this.adminService.GetUserBranches(body).subscribe((res: BranchMappingResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
          this.rowData = [];
        }
      })
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  formInit() {
    return this.fb.group({
      branch: ['', Validators.required],
      date: [new Date(), Validators.required],
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.branchCls.branch = event.data.branch;
    this.propertyForm.patchValue({
      branch: event.data.branch,
      date: event.data.dateMapped,
    })

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
}
