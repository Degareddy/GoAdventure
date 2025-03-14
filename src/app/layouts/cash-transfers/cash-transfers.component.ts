import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-cash-transfers',
  templateUrl: './cash-transfers.component.html',
  styleUrls: ['./cash-transfers.component.css']
})
export class CashTransfersComponent implements OnInit, OnDestroy {
  retMessage: string = "";
  textMessageClass: string = "";
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private subSink!: SubSink;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  altered: boolean = false;
  columnDefs: any = [
    { field: "locnName", headerName: "Location", sortable: true, filter: true, resizable: true, flex: 1, },
    { field: "receiptNo", headerName: "Tran No", sortable: true,width: 300, filter: true, resizable: true, flex: 1 },
    { field: "rctFromName", headerName: "Sender", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "rctDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1,
      valueFormatter: function (params: any) {
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
      field: "rctAmount", headerName: "Total Amount", sortable: true, filter: true, resizable: true, flex: 1,
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      },
      type: 'rightAligned',
      cellStyle: { justifyContent: "flex-end" },
    },
    { field: "confirm", headerName: "Confirm", flex: 1, resizable: true,width: 175, sortable: true, filter: true, cellRenderer: 'agLnkRenderer' },
    { field: "reject", headerName: "Reject", flex: 1, resizable: true,width: 175, sortable: true, filter: true, cellRenderer: 'agDtlRenderer' },
  ];
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<CashTransfersComponent>,
    private userDataService: UserDataService, private loader: NgxUiLoaderService, private msService: MastersService) {
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    // console.log(this.data);
    if (this.data) {
      this.rowData = this.data;
      if (this.rowData.length >= 1) {
        for (let i = 0; i < this.rowData.length; i++) {
          this.rowData[i].confirm = "Confirm";
          this.rowData[i].reject = "Reject";
        }
      }
    }
  }

  onDtlClicked(event: any) {
    console.log(event);
    this.confirmReject(event, event.data.reject);
  }

  onLnkClicked(event: any): void {
    this.confirmReject(event, event.data.confirm);

  }

 async confirmReject(event: any, action: string) {
    if (event.data.location) {
      const body = {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID,
        tranNo: event.data.receiptNo,
        fromLocn: event.data.location,
        action: action
      }
      try {
        this.loader.start();
        this.subSink.sink =await this.msService.UpdateMyCashTransfers(body).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            const cashbody = {
              company: this.userDataService.userData.company,
              location: this.userDataService.userData.location,
              user: this.userDataService.userData.userID,
              refNo: this.userDataService.userData.sessionID,
            }
            this.rowData = [];
            this.data = [];
            // this.subSink.sink = this.msService.GetMyCashTransfers(cashbody).subscribe((res: any) => {
            //   if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
            //     this.rowData = res.data;
            //     if (this.rowData.length >= 1) {
            //       for (let i = 0; i < this.rowData.length; i++) {
            //         this.rowData[i].confirm = "Confirm";
            //         this.rowData[i].reject = "Reject";
            //       }
            //     }
            //   }
            //   else {
            //     this.rowData = [];
            //   }
            // })
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }
  }
  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;

  }
  onFilterData(event: any) {

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
}
