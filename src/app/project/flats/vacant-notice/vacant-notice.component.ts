import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-vacant-notice',
  templateUrl: './vacant-notice.component.html',
  styleUrls: ['./vacant-notice.component.css']
})
export class VacantNoticeComponent implements OnInit {
  vacantNoticeForm!:FormGroup;
  private subSink!: SubSink;
  rowData: any = [];
  retMessage: string="";
  textMessageClass: string="";
  columnDefs: any = [
    { field: "propertyName", headerName: "Property Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "blockName", headerName: "Block Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "unitName", headerName: "Unit Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "tenantName", headerName: "Tenant Name", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "noticeDate", headerName: "Notice Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    {
      field: "vacateDate", headerName: "Vacate Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    { field: "vacateStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
  ];
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  public gridOptions!: GridOptions;

  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, Trantype: string, Property: string, Block: string, Flat: string, type: string, status: string,tenant:string,tenantCode:string },
  private utlService: UtilitiesService, private userDataService: UserDataService, private loader: NgxUiLoaderService,
  public dialog: MatDialog, private fb: FormBuilder, private projectService: ProjectsService,) {
  this.subSink = new SubSink();
  this.vacantNoticeForm = this.formInit();
}

  ngOnInit(): void {
    this.vacantNoticeForm.get('tenantName')?.patchValue(this.data.tenant);
    this.loadData();
  }
  onSubmit(){
    if (this.data.tenant) {
      const body = {
        ...this.commonParams(),
        Property: this.data.Property,
        Block: this.data.Block,
        UnitId: this.data.Flat,
        NoticeDate: this.formatDate(this.vacantNoticeForm.value.noticeDate),
        VacateDate: this.formatDate(this.vacantNoticeForm.value.vacantDate),
        notes: this.vacantNoticeForm.value.notes,
        VacateStatus: this.vacantNoticeForm.value.status,
        Tenant: this.data.tenantCode,
        mode: this.data.mode
      }
      try {
        this.loader.start();
        this.subSink.sink = this.projectService.updateNoticeDate(body).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.loadData();
            this.retMessage = res.message;
          this.textMessageClass = 'green';
          }
          else {
            this.retMessage = res.message;
    this.textMessageClass = 'red';
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }
  getUnitHistory() {
    const body = {
      ...this.commonParams(),
      PropCode: this.data.Property,
      BlockCode: this.data.Block,
      UnitCode: this.data.Flat,
    }
    try {
      this.subSink.sink = this.projectService.GetUnitPreBookings(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.handleErrorMsg(res.message);
        }
      });
    }
    catch (ex: any) {
      this.handleErrorMsg(ex);
    }
  }
  handleErrorMsg(res: any) {
    this.retMessage = res;
    this.textMessageClass = 'red';
  }
  handleSuccessMsg(res: any) {
    this.retMessage = res;
    this.textMessageClass = 'green';
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
loadData(){
  const body = {
    ...this.commonParams(),
    PropCode: this.data.Property,
    BlockCode: this.data.Block,
    UnitCode: this.data.Flat,
  }
  try {
    this.loader.start();
    this.subSink.sink = this.projectService.getNoticeDateDetails(body).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res['data'];
        // this.handleSuccessMsg(res.message);
      }
      else {
        this.handleErrorMsg(res.message);
      }
    });
  }
  catch (ex: any) {
    this.handleErrorMsg(ex.message);
  }
}
  onRowSelected(event: any) {
   
    // this.tenantCode = event.data.tenant,
    this.vacantNoticeForm.patchValue({
      tenantName:event.data.tenantName,
      
      noticeDate:event.data.noticeDate,
      vacantDate:event.data.vacateDate,
      status: event.data.vacateStatus,
      notes: event.data.notes,
    })
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  formInit() {
    return this.fb.group({
      tenantName: ['', Validators.required],
      noticeDate: [new Date(), Validators.required],
      vacantDate: [new Date(), Validators.required],
      status: ['', Validators.required],
      notes: ['']
    });
  }

}
