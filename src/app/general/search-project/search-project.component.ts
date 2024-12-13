import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatDialogRef } from '@angular/material/dialog';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-search-project',
  templateUrl: './search-project.component.html',
  styleUrls: ['./search-project.component.css']
})

export class SearchProjectComponent implements OnInit,OnDestroy {
  SearchProjectForm!: FormGroup;
  textMessageClass!: string;
  retMessage!: string;
  tranStatus: any = ['Any', 'Closed', 'Authorized', 'Open', 'Deleted']
  masterParams!: MasterParams;
  // userData: any;
  tranNo!: any[];
  searchName!: string;
  productGroupList: any = [];
  UOMList: any = [];
  private subSink!: SubSink;
  selectedRowIndex: number = -1;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  columnDefs1: any = [
    // { field: "slNo", headerName: "S.No", flex: 1 },
  { field: "itemLocn", headerName: "Item Location", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "itemCode", headerName: "Code", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "itemName", headerName: "Name", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "itemDesc", headerName: "Desc", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "itemStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 120 },

    //
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(protected utlService: UtilitiesService,
    protected prjService: MastersService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SearchProjectComponent>,
   private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { search: string, type: string, project: string, plot:string }) {
    this.masterParams = new MasterParams();
    this.SearchProjectForm = this.formInit();
    this.subSink = new SubSink();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }


  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
     this.onRowClick(event.data);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  ngOnInit(): void {
    this.searchName = this.data.search;
    if (this.data.project) {
      this.SearchProjectForm.controls['project'].setValue(this.data.project);
    }
    this.search();
  }


  formInit() {
    return this.fb.group({
      location: ['', [Validators.maxLength(50)]],
      project: ['', [Validators.maxLength(50)]],
      block: ['', [Validators.maxLength(50)]],
      unit: ['', [Validators.maxLength(50)]],
      plot: ['', [Validators.maxLength(50)]],
      unitStatus: ['Open', [Validators.required, Validators.maxLength(10)]]
    });
  }

 async search() {
    if (this.SearchProjectForm.invalid) {
      return
    }
    else {
      this.masterParams.company = this.userDataService.userData.company;
      this.masterParams.location = this.userDataService.userData.location;
      this.masterParams.user = this.userDataService.userData.userID;
      this.masterParams.refNo = this.userDataService.userData.sessionID;

      this.masterParams.type = this.data.type;
      this.masterParams.item = this.SearchProjectForm.controls['project'].value;
      this.masterParams.itemFirstLevel = this.SearchProjectForm.controls['block'].value;
      this.masterParams.itemSecondLevel = this.SearchProjectForm.controls['plot'].value;
      try {
        this.subSink.sink =await this.prjService.GetProjectsSearchResults(this.masterParams).subscribe((res: any) => {
          if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
          }
          else {
            this.rowData = res['data'];
            this.textMessageClass = 'green';
            this.retMessage = res.message;
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = 'red';
      }
    }
  }

  onRowClick(row: any) {
    this.dialogRef.close(row);
  }

  clear() {
    this.SearchProjectForm.reset()
    this.SearchProjectForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
  }

}
