import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatDialogRef } from '@angular/material/dialog';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { partySearchClass } from '../../layouts/partySearch';
import { SubSink } from 'subsink';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';
import { PartyResponse } from '../Interface/admin/admin';
@Component({
  selector: 'app-search-party',
  templateUrl: './search-party.component.html',
  styleUrls: ['./search-party.component.css']
})
export class SearchPartyComponent implements OnInit, OnDestroy {
  SearchPartyForm!: FormGroup;
  textMessageClass: string="";
  retMessage: string="";
  masterParams!: MasterParams;
  partyCls!: partySearchClass;
  tranNo!: any[];
  searchName!: string;
  private subSink!: SubSink;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";

  columnDefs: any = [{ field: "code", headerName: "Code", width: 89,filter:true,sortable:true },
  { field: "partyName", headerName: "Name", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "property", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 100 },

  { field: "fullAddress", headerName: "Full address", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "city", headerName: "City", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "partyStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "phones", headerName: "Phone", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "email", headerName: "Email", sortable: true, filter: true, resizable: true, width: 160 },

  ];
  selectedRowIndex: number = -1;
  constructor(protected utlService: UtilitiesService, private userDataService: UserDataService,
    private fb: FormBuilder, private dialogRef: MatDialogRef<SearchPartyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.partyCls = new partySearchClass();
    this.SearchPartyForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }
  onRowClick(row: any) {
    this.dialogRef.close(row);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }


  ngOnInit(): void {
    this.searchName = this.data.search;
    this.SearchPartyForm.controls['name'].patchValue(this.data.PartyName);
    this.search();
  }
  formInit() {
    return this.fb.group({
      name: [''],
      city: [''],
      address: [''],
      phone: [''],
      email: ['']
    });
  }

 async search() {
    if (this.SearchPartyForm.invalid) {
      return
    }
    else {
      this.partyCls.Company = this.userDataService.userData.company;
      this.partyCls.Location = this.userDataService.userData.location;
      this.partyCls.City = this.SearchPartyForm.controls['city'].value || "";
      this.partyCls.Email = this.SearchPartyForm.controls['email'].value || "";
      this.partyCls.FullAddress = this.SearchPartyForm.controls['address'].value || "";
      this.partyCls.Phones = this.SearchPartyForm.controls['phone'].value || "";
      this.partyCls.PartyName = this.SearchPartyForm.controls['name'].value || "";
      this.partyCls.PartyStatus = "Open";
      this.partyCls.RefNo = this.userDataService.userData.sessionID;
      this.partyCls.User = this.userDataService.userData.userID;
      this.partyCls.PartyType = this.data.PartyType || "";
      try {
        this.subSink.sink =await this.utlService.GetPartySearchList(this.partyCls).subscribe((res: PartyResponse) => {
          if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
            this.rowData = [];
          }
          else {
            this.rowData = res['data'];
            this.exportTmp = false;
            this.textMessageClass = 'green';
            this.retMessage = res.message;
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }

  clear() {
    this.SearchPartyForm.reset()
    this.SearchPartyForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
    this.rowData = "";
  }
}
