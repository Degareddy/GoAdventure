import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-multi-land-lord',
  templateUrl: './multi-land-lord.component.html',
  styleUrls: ['./multi-land-lord.component.css']
})
export class MultiLandLordComponent implements OnInit {

    private subSink: SubSink = new SubSink();
    retMessage: string = "";
    textMessageClass: string = "";
    rowData: any = [];
    private gridApi!: GridApi;
    public gridOptions!: GridOptions;
    public rowSelection: 'single' | 'multiple' = 'multiple';
    private columnApi!: ColumnApi;
      
    columnDefs: any = [
      { field: "slNo", headerName: "slNo", width: 70 },
      // { field: "tranNo", headerName: "Tran No", resizable: true, flex: 1 },
      { field: "landlordName", headerName: "Landlord", sortable: true, filter: true, resizable: true, width: 180, },
  
      {
        field: "share", headerName: "Share", resizable: true, flex: 1, type: 'rightAligned',
        cellStyle: { justifyContent: "flex-end" },
        valueFormatter: function (params: any) {
          if (typeof params.value === 'number' || typeof params.value === 'string') {
            const numericValue = parseFloat(params.value.toString());
            if (!isNaN(numericValue)) {
              return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
            }
          }
          return null;
        },
      },
      {
        field: "dateJoined", headerName: "Joined Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
        field: "dateLeft", headerName: "Left Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
        field: "llStatus",
        headerName: "Status",
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
        cellStyle: (params:any) => {
          if (params.value === 'Deleted') {
            return { color: 'red' };
          }
          return { color: 'green' };
        }
      },
  
    ];
  constructor(private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: {property: string ,block: string,flat:string },
    private loader: NgxUiLoaderService,private projService: ProjectsService,private dialogRef: MatDialogRef<MultiLandLordComponent>,
    
  ) { }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  ngOnInit(): void {
    const body = {
      ...this.commonParams(),
      PropCode: this.data.property,
      BlockCode: this.data.block,
      UnitCode: this.data.flat
    }
    try {
      this.loader.start();
      this.subSink.sink = this.projService.GetUnitLandlords(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.displayMessage( res.message + " : Data Retrived " , "green");
          this.rowData=res['data'];
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    
    this.onRowClick(event.data);
  }
  onRowClick(row: any) {
    
    console.log(row)
    this.dialogRef.close(row);
  }
}
