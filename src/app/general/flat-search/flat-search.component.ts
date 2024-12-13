import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatDialogRef } from '@angular/material/dialog';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from '../Interface/interface';

@Component({
  selector: 'app-flat-search',
  templateUrl: './flat-search.component.html',
  styleUrls: ['./flat-search.component.css']
})
export class FlatSearchComponent implements OnInit, OnDestroy {
  flatSearchForm!: FormGroup;
  textMessageClass!: string;
  retMessage!: string;
  modeIndex!: number;
  tranStatus: any = ['Any', 'Closed', 'Authorized', 'Open', 'Deleted']
  masterParams!: MasterParams;
  tranNo!: any[];
  searchName!: string;
  productGroupList: Item[] = [];
  UOMList: Item[] = [];
  private subSink!: SubSink;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  public property: string = "";
  public block: string = "";
  columnDefs1: any = [
    { field: "unitId", headerName: "Unit Id", sortable: true, filter: true, resizable: true, width: 100 },
    { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 100 },
    { field: "bedRooms", headerName: "Bed Rooms", sortable: true, filter: true, resizable: true, width: 100 },
    { field: "landlord", headerName: "Landlord", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "currentTenant", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "tenant", headerName: "Tenant", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "plexType", headerName: "Plex Type", sortable: true, filter: true, resizable: true, width: 130 },
    //
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(protected utlService: UtilitiesService,
    protected prjService: ProjectsService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FlatSearchComponent>,
    private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { search: string, type: string, flat: string, block: string, property: string }) {
    this.masterParams = new MasterParams();
    this.flatSearchForm = this.formInit();
    this.subSink = new SubSink();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  ngAfterViewInit(): void {
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
    this.flatSearchForm.controls['unit'].patchValue(this.data.flat);
    this.search();
  }
  formInit() {
    return this.fb.group({
      landlord: ['', [Validators.maxLength(50)]],
      tenant: ['', [Validators.maxLength(50)]],
      unit: ['', [Validators.maxLength(50)]],
      unitStatus: ['', [Validators.maxLength(25)]],
      plexType: ['']
    });
  }

 async search() {
    if (this.flatSearchForm.invalid) {
      return
    }
    else {
      this.rowData = [];
      const body = {
        Company: this.userDataService.userData.company,
        Location: this.userDataService.userData.location,
        ItemType: "FLAT",
        Property: this.data.property || "",
        Block: this.data.block || "",
        Unit: this.flatSearchForm.controls['unit'].value,
        Tenant: this.flatSearchForm.controls['tenant'].value,
        Landlord: this.flatSearchForm.controls['landlord'].value,
        PlexType: this.flatSearchForm.controls['plexType'].value,
        Status: this.flatSearchForm.controls['unitStatus'].value,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
      try {
        this.subSink.sink =await this.prjService.GetUnitsSearchList(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
            this.rowData = [];
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
    this.flatSearchForm.reset()
    this.flatSearchForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";

  }

}
