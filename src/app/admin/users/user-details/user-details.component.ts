import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { AdminService } from 'src/app/Services/admin.service';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  aipDetForm: FormGroup;
  retMessage: string = "";
  public rowSelection: 'single' | 'multiple' = 'multiple';
  textMessageClass: string = "";
  modes: Item[] = [];
  rowData: any = [];
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subsink!: SubSink;
  columnDefs: any = [
    // { field: "remarks", headerName: "S.No", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "ipNo", headerName: "IP Number", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, flex: 1 },
  ];
  constructor(private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: { mode: string, userId: string }, private dialog: MatDialog,
    private adminService: AdminService, private userDataService: UserDataService) {
    this.aipDetForm = this.formInit();
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      iPNo: ['', [Validators.required, Validators.maxLength(20)]],
      remarks: ['', [Validators.required, Validators.maxLength(255)]],
    })
  }
  ngOnInit(): void {
    this.getIpAdressData();
  }
  getIpAdressData() {
    const body: getPayload = {
      ...this.commonParams(),
      item: this.data.userId
    }
    try {
      this.subsink.sink = this.adminService.getUserIpsList(body).subscribe((res: any) => {
        if (res.status.toUpperCase() == "SUCCESS") {
          this.rowData = res.data;
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

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  onUpdate() {
    this.clearMsg();
    const body = {
      ...this.commonParams(),
      remarks: this.aipDetForm.get('remarks')?.value,
      IPNo: this.aipDetForm.get('iPNo')?.value,
      mode: this.data.mode,
      UserName: this.data.userId,
      SlNo: this.slNum
    }
    try {
      this.subsink.sink = this.adminService.UpdateAllowedIps(body).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getIpAdressData();
          if (this.data.mode === "DELETE") {
            this.data.mode = "Modify"
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
          this.rowData=[];
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  reset() {
    // this.aipDetForm.reset();
  }
  Close() {

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.aipDetForm.patchValue({
      iPNo: event.data.ipNo,
      remarks: event.data.remarks
    })
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
        this.data.mode = "DELETE";
        this.onUpdate();
        this.aipDetForm = this.formInit();
      }
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
}

