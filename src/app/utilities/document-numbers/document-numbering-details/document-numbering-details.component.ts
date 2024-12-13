import { Component, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyClass } from 'src/app/admin/admin.class';
import { documnetNumberSaveCalss, documnetNumberingClass } from './docNumber.modal';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-document-numbering-details',
  templateUrl: './document-numbering-details.component.html',
  styleUrls: ['./document-numbering-details.component.css']
})
export class DocumentNumberingDetailsComponent implements OnInit, OnDestroy {
  DocDetailsForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  retMessage: string = "";
  companyCls!: CompanyClass;
  textMessageClass: string = "";
  bDetForm!: FormGroup;
  modes: Item[] = [];
  mode!: string;
  slNum: number = 0;
  docNumCls!: documnetNumberingClass;
  docSaveCls!: documnetNumberSaveCalss;
  private subSink: SubSink;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;

  @Input() detailsdDta: any;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "prefix", headerName: "Prefix", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "lastNo", headerName: "Last No", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "suffix", headerName: "Suffix", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "startDate", headerName: "Start Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    field: "endDate", headerName: "End Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    field: "lastTranDate", headerName: "Last Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
  }];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private utldservice: UtilitiesService, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private datePipe: DatePipe, private router: Router
  ) {
    this.DocDetailsForm = this.formInit();
    this.slNum = 0;
    this.docNumCls = new documnetNumberingClass();
    this.subSink = new SubSink();
    this.docSaveCls = new documnetNumberSaveCalss();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
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
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }
  formInit() {
    return this.fb.group({
      prefix: ['', [Validators.required, Validators.maxLength(10)]],
      lastNo: ['', [Validators.required]],
      suffix: ['', [Validators.required, Validators.maxLength(6)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [new Date(), [Validators.required]],
      lastTranDate: [new Date(), [Validators.required]],
    })
  }
  ngOnInit(): void {

  }
  create() {
    this.Clear();
  }

  Clear() {
    this.DocDetailsForm.reset();
    this.DocDetailsForm = this.formInit();
    this.docSaveCls.selCompany = this.detailsdDta.company;
    this.docSaveCls.selLocation = this.detailsdDta.location;
    this.docSaveCls.scrID = this.detailsdDta.transaction;
    this.docSaveCls.currStatus = "Open";
    this.docSaveCls.remarks = "";
    this.docSaveCls.mode = "Modify";
    this.docSaveCls.slNo = 0;
    this.slNum = 0;
    this.clearMsgs();
    // this.rowData=[];
  }
  clearMsgs() {
    this.textMessageClass = "";
    this.retMessage = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }
  onRowClick(rowdata: any, i: number) {
    this.clearMsgs();
    const row = rowdata.data;
    if (row) {
      this.DocDetailsForm.controls['prefix'].patchValue(row.prefix);
      this.DocDetailsForm.controls['lastNo'].patchValue(row.lastNo);
      this.DocDetailsForm.controls['suffix'].patchValue(row.suffix);
      this.DocDetailsForm.controls['startDate'].patchValue(row.startDate);
      this.DocDetailsForm.controls['endDate'].patchValue(row.endDate);
      this.DocDetailsForm.controls['lastTranDate'].patchValue(row.lastTranDate);
      this.docSaveCls.selCompany = this.detailsdDta.company;
      this.docSaveCls.selLocation = this.detailsdDta.location;
      this.docSaveCls.scrID = row.scrID;
      this.docSaveCls.currStatus = row.currStatus;
      this.docSaveCls.remarks = row.remarks;
      this.docSaveCls.mode = this.detailsdDta.mode;
      this.docSaveCls.slNo = row.slNo;
      this.slNum = row.slNo;
    }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd-MM-yyyy') || '';
  }
  onDeleteClicked(data: any) {
    this.detailsdDta = data;
    this.mode = this.detailsdDta.mode;
    this.docNumCls.Company = this.userDataService.userData.company;
    this.docNumCls.Location = this.userDataService.userData.location;
    this.docNumCls.RefNo = this.userDataService.userData.sessionID;
    this.docNumCls.User = this.userDataService.userData.userID;
    this.docNumCls.TranType = this.detailsdDta.company;
    this.docNumCls.TranNo = this.detailsdDta.location;
    this.docNumCls.Party = this.detailsdDta.transaction.itemCode;
    try {
      this.loader.start();
      this.subSink.sink = this.utldservice.getdocumentData(this.docNumCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
          this.rowData = [];
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }
  prepareDocCls() {
    this.docSaveCls.company = this.userDataService.userData.company;
    this.docSaveCls.location = this.userDataService.userData.location;
    this.docSaveCls.refNo = this.userDataService.userData.sessionID;
    this.docSaveCls.user = this.userDataService.userData.userID;
    this.docSaveCls.mode = this.detailsdDta.mode;
    this.docSaveCls.selCompany = this.detailsdDta.company;
    this.docSaveCls.selLocation = this.detailsdDta.location;
    this.docSaveCls.scrID = this.detailsdDta.transaction.itemCode;
    this.docSaveCls.prefix = this.DocDetailsForm.controls['prefix'].value;
    this.docSaveCls.suffix = this.DocDetailsForm.controls['suffix'].value;
    this.docSaveCls.lastNo = this.DocDetailsForm.controls['lastNo'].value;
    this.docSaveCls.slNo = this.slNum;
    const startDateValue = this.DocDetailsForm.controls['startDate'].value;
    const endDateValue = this.DocDetailsForm.controls['endDate'].value;
    const lastDateValue = this.DocDetailsForm.controls['lastTranDate'].value;
    this.docSaveCls.startDate = this.datePipe.transform(startDateValue, 'yyyy-MM-dd');
    this.docSaveCls.endDate = this.datePipe.transform(endDateValue, 'yyyy-MM-dd');
    this.docSaveCls.lastTranDate = this.datePipe.transform(lastDateValue, 'yyyy-MM-dd');
    this.docSaveCls.langID = this.userDataService.userData.langId;
  }
  onSubmit() {
    this.clearMsgs();
    if (this.DocDetailsForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareDocCls();
        this.loader.start();
        this.subSink.sink = this.utldservice.UpdateDocumentNumbers(this.docSaveCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() == "ERROR" || res.status.toUpperCase() == "FAIL") {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.onDeleteClicked(this.detailsdDta);
          }
        });

      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }

    }
  }
}
