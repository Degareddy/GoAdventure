import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';
import { WarehouseSearchClass } from '../../inventory.class';
import { TransferDetailsComponent } from '../transfer-details/transfer-details.component';

@Component({
  selector: 'app-ware-house-search',
  templateUrl: './ware-house-search.component.html',
  styleUrls: ['./ware-house-search.component.css']
})
export class WareHouseSearchComponent implements OnInit, OnDestroy {
  searchName!: string;
  slNum!: number;
  pageSize = 25;
  retMessage!: string;
  textMessageClass!: string;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  private subSink!: SubSink;
  rowData: any[] = [];
  whSearchClass!: WarehouseSearchClass;
  masterParams!: MasterParams;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDef: any = [
    { field: "slNo", headerName: "S.No", flex: 1 },
    { field: "whNo", headerName: "Warehouse", sortable: true, filter: true, resizable: true, width: 220, hide: true },
    { field: "whName", headerName: "WareHouse", sortable: true, filter: true, resizable: true, width: 220 },
    { field: "lotNo", headerName: "LotNo", sortable: true, filter: true, resizable: true, width: 220 },
    {
      field: "unitRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
          }
        }
        return null;
      }
    },
    {
      field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericValue);
          }
        }
        return null;
      }
    },
  ];
  constructor(private invService: InventoryService,
    private dialogRef: MatDialogRef<TransferDetailsComponent>,
    protected router: Router, private userDataService: UserDataService,
    protected utlService: UtilitiesService, @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // { search: string, type: string, project: string, plot:string }
    this.masterParams = new MasterParams();
    this.whSearchClass = new WarehouseSearchClass()
    this.subSink = new SubSink();
  }

  ngOnInit(): void {
    //console.log(this.data);
    this.searchName = this.data.search;

    this.getWareHousedata();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  // onRowClick(row: any) {

  //   this.whSearchClass.slNo = row.slNo;

  //   this.whSearchClass.whNo = row.whNo;
  //   this.whSearchClass.whName = row.whName;
  //   this.whSearchClass.quantity = row.quantity;
  //   this.whSearchClass.unitRate = row.unitRate;
  //   this.whSearchClass.lotNo = row.lotNo;
  //   this.whSearchClass.whNo = row.whNo;
  // }
 

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  getWareHousedata() {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      Type: this.data.Type,
      Item: this.data.Item
    }

    try {
      this.subSink.sink = this.invService.getWareHouseLotStock(body).subscribe((res: any) => {
        console.log(res);

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
  onRowClick(row: any) {
    this.dialogRef.close(row);
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

}
