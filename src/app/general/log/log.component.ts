import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { AdminService } from 'src/app/Services/admin.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';
@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css']
})
export class LogComponent implements OnInit, OnDestroy {
  searchName: string = "";
  slNum!: number;
  pageSize = 25;
  retMessage: string = "";
  textMessageClass: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  private subSink!: SubSink;
  rowData: any[] = [];
  masterParams!: MasterParams;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDef: any = [
    { field: "slNo", headerName: "S.No", sortable: true, filter: true, resizable: true, width: 90 },
    { field: "changedByCode", headerName: "User Id", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "changedByName", headerName: "User", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "changedOn", headerName: "Changed On", ssortable: true, filter: true, resizable: true, width: 140, valueFormatter: function (params: any) {
      if (params.value) {
        const dateString = params.value.replace('T', ' ');
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      }
      return null;
    }
  },
{ field: "changeType", headerName: "Mode Of Change", sortable: true, filter: true, resizable: true, width: 150 }
  ];

constructor(
  protected router: Router, private userDataService: UserDataService,
  protected adminService: AdminService, @Inject(MAT_DIALOG_DATA) public data: { tranType: string, tranNo: string, search: string },
) {
  this.masterParams = new MasterParams();
  this.subSink = new SubSink();
}
ngOnInit(): void {
  if(this.data && this.data.tranNo) {
  this.searchName = this.data.search;
  this.getLogdata(this.data.tranType, this.data.tranNo);

}
  }
ngOnDestroy(): void {
  this.subSink.unsubscribe();
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
    refNo: this.userDataService.userData.sessionID,
    LangId: this.userDataService.userData.langId
  }
}
getLogdata(tranType: string, tranNo: string) {
  const body = {
    ...this.commonParams(),
    tranType: tranType,
    tranNo: tranNo,
  }
  try {
    this.subSink.sink = this.adminService.getTransactionLog(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != 'FAIL') {
        this.rowData = res['data'];
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
    this.retMessage = ex.message;
    this.textMessageClass = "red";
  }
}
onGridReady(params: any) {
  this.gridApi = params.api;
  this.columnApi = params.columnApi;
  const gridApi = params.api;
}
}

