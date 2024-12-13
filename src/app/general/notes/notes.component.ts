import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDataService } from 'src/app/Services/user-data.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { notesdetails, SaveApiResponse } from '../Interface/admin/admin';
import { SubSink } from 'subsink';
import { notesDetailscls } from 'src/app/admin/admin.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AssetsService } from 'src/app/Services/assets.service';
import { DatePipe } from '@angular/common';
import { ConfirmDialogComponent, ConfirmDialogModel } from '../confirm-dialog/confirm-dialog.component';
@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit, OnDestroy {
  dataFlag: boolean = false;
  retMessage: string = "";
  textMessageClass: string = "";
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;

  public gridOptions!: GridOptions;
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;
  slNum: number = 0;
  private notecls!: notesDetailscls;
  notesForm!: FormGroup;
  mode!: string;
  searchName!: string;
  DatauserID!: string;
  private subSink!: SubSink;

  columnDefs: any = [
    { field: "slNo", headerName: "S.No", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "userId", headerName: "User", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "notesDate", headerName: "Notes Date", sortable: true, filter: true,
      resizable: true,
      flex: 1,
      valueFormatter: function (params: any) {
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
    { field: "notesStatus", headerName: "Notes Status", sortable: true, filter: true, resizable: true, flex: 1 },

  ]
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';

  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, private loader: NgxUiLoaderService,
    private assetserv: AssetsService, private datePipe: DatePipe) {
    this.notesForm = this.formInit();
    this.subSink = new SubSink();
    this.notecls = new notesDetailscls();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      User: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      langId: "1"
    }
  }

  formInit() {
    return this.fb.group({
      slNo: [''],
      notes: ['', [Validators.required, Validators.maxLength(100)]],
      userId: [''],
      notesDate: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    this.searchName = this.data.search;
    if (this.data.tranNo) {
      this.getNotesData(this.data);
    }
    //  this.mode = this.data.mode;
    this.DatauserID = this.userDataService.userData.userID;
  }

  getNotesData(data: any) {
    this.rowData = [];
    const body: notesdetails = {
      ...this.commonParams(),
      user: this.DatauserID,
      tranType: this.data.TranType,
      tranNo: this.data.tranNo,

    };
    try {
      this.subSink.sink = this.assetserv.getTransactionNotes(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.hanldeError(res);
        }
      });
    }
    catch (ex: any) {
      this.hanldeError(ex);
    }

  }

  notesclass() {
    const formControls = this.notesForm.controls;
    this.notecls = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      refNo: this.userDataService.userData.sessionID,
      userId: this.DatauserID,
      mode: this.data.mode,
      notes: formControls.notes.value,
      notesDate: this.datePipe.transform(formControls.notesDate.value, "yyyy-MM-dd"),
      langId: this.userDataService.userData.langId,
      tranType: this.data.TranType,
      slNo: this.slNum,
      tranNo: this.data.tranNo
    } as notesDetailscls
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd-MM-yyyy') || '';
  }
  onSubmit() {
    this.clearMsgs();
    if (this.notesForm.invalid) {
      return;
    }
    else {
      this.notesclass();
      this.loader.start();
      this.subSink.sink = this.assetserv.updateTransactionNotes(this.notecls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.retVal > 100 && res.retVal < 200) {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getNotesData(this.data);
          if (this.data.mode.toUpperCase() === "DELETE") {
            this.Add();
          }
        }
        else {
          this.hanldeError(res);
        }
      });
    }
  }

  hanldeError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }



  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowClick(row: any) {
    this.notesForm.patchValue(row.data);
    this.slNum = row.data.slNo;
    this.notecls.notes = this.rowData.notes;
    this.notecls.userId = this.rowData.user;
    this.notecls.notesDate = this.rowData.notesDate;

  }
  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  Add() {
    this.notesForm.clearValidators();
    this.notesForm.reset();
    this.notesForm = this.formInit();
    this.clearMsgs();
    this.slNum = 0;
  }

  Clear() {
    this.notesForm.reset();
    this.notesForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.slNum = 0;
    this.slNum = 0;
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
        this.onSubmit();
      }
    });
  }
}
