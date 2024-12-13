import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-filtered-units',
  templateUrl: './filtered-units.component.html',
  styleUrls: ['./filtered-units.component.css']
})
export class FilteredUnitsComponent implements OnInit {
  hide!: boolean;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs1: any = [
    { field: "propName", headerName: "Property Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "bedRooms", headerName: "Bed Rooms", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "llName", headerName: "Landlord", sortable: true, filter: true, resizable: true, flex: 1 },
    // { field: "currentTenant", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "tenant", headerName: "Tenant", sortable: true, filter: true, resizable: true, flex: 1, hide: this.hide },
    { field: "unitStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1, hide: this.hide },
    //
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private dialogRef: MatDialogRef<FilteredUnitsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.hide = this.data.hide;
  }

  ngOnInit(): void {
    // console.log(this.data);
    if (this.data) {
      this.rowData = this.data.filteredUnits;
    }
    this.hide = this.data.hide;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(event: any) {
    // this.onRowClick(event.data);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

}
