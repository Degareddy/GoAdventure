import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi } from 'ag-grid-community';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
@Component({
  selector: 'app-receipt-details-data',
  templateUrl: './receipt-details-data.component.html',
  styleUrls: ['./receipt-details-data.component.css']
})
export class ReceiptDetailsDataComponent implements OnInit {
  searchName: string = "";
  tableData: any = [];
  private subSink!: SubSink;
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;
  retMessage: string = "";
  textMessageClass: string = "";
  columnDefs: any = [
    {
      field: "tranNo", headerName: "Inv No", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
        const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        const isNegative = params.value < 0;
        return {
          color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          fontSize: isLastRow ? '12px' : 'inherit',
          backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        };
      },
    },
    {
      field: "propName", headerName: "Property", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
        const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        const isNegative = params.value < 0;
        return {
          color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          fontSize: isLastRow ? '12px' : 'inherit',
          backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        };
      },
    },
    {
      field: "blockName", headerName: "Block", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
        const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        const isNegative = params.value < 0;
        return {
          color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          fontSize: isLastRow ? '12px' : 'inherit',
          backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        };
      },
    },
    {
      field: "unitName", headerName: "Unit", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
        const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        const isNegative = params.value < 0;
        return {
          color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          fontSize: isLastRow ? '12px' : 'inherit',
          backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        };
      },
    },
    {
      field: "allocatedAmount", headerName: "Amount", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
        const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        const isNegative = params.value < 0;
        return {
          color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          fontSize: isLastRow ? '12px' : 'inherit',
          backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        };
      },
    },

  ];
  rowData: any = [];
  type: string = "";
  constructor(@Inject(MAT_DIALOG_DATA) public popdata: { data: any, name: string, type: string, tranNo: string }, private userDataService: UserDataService
    , private saleService: SalesService,
  ) {

  }

  ngOnInit(): void {
    this.type = this.popdata.type;
    this.searchName = this.popdata.name;
    this.tableData = this.popdata.data;
    this.getAllocationData(this.popdata.tranNo);
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    // this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  getAllocationData(tranNo: string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      tranNo: tranNo,
      // tranFor:tranFor,
    }
    try {
      this.subSink.sink = this.saleService.FetchPaymentsReceiptsToAllocate(body).subscribe((res: any) => {
        if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res.data;
          const safeParse = (value: any) => {
            const parsedValue = parseFloat(value?.toString().replace(/,/g, '') || '0');
            return isNaN(parsedValue) ? 0 : parsedValue;
          };

        }
        else {
          this.displayMessage(displayMsg.ERROR + "This transactions is not allocated at the moment.", TextClr.red);
        }
      })
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

}
