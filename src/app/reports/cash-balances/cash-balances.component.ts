import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CashTransfersComponent } from 'src/app/layouts/cash-transfers/cash-transfers.component';
import { MastersService } from 'src/app/Services/masters.service';
import { ReportsService } from 'src/app/Services/reports.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-cash-balances',
  templateUrl: './cash-balances.component.html',
  styleUrls: ['./cash-balances.component.css']
})
export class CashBalancesComponent implements OnInit, OnDestroy {
  private subsink: SubSink;
  textMessageClass: string = "";
  retMessage: string = "";
  totalAmount: number = 0;
  actualAmount: number = 0;
  pendingAmount: number = 0;
  rowData: any = [];
  totals: string = '';
  columnDefs: any = [
    { field: "clientName", headerName: "Name", sortable: true, filter: true, resizable: true, flex: 1, },
    { field: "locationName", headerName: "Location Name", sortable: true, filter: true, resizable: true, flex: 1, },
    {
      field: "asOnDate", headerName: "As On Date", sortable: true, filter: true, resizable: true, flex: 1,
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
    {
      field: "totalAmount", headerName: "Actual Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      }
    },

    {
      field: "pendingAmount", headerName: "Pending Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      }
    },

    {
      field: "balanceAmount", headerName: "Total Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      }
    },

  ]

  constructor(private userDataService: UserDataService, private router: Router, private msService: MastersService,
    private loader: NgxUiLoaderService, private reportService: ReportsService, private dialog: MatDialog,) {
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  close() {
    this.router.navigate(['/home']);
  }
  getTransactions() {
    this.rowData = [];
    this.displayMessage("", "");
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      langId: this.userDataService.userData.langId,
      fromDate: new Date(),
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      reportType: "CASHTRF"
    }
    try {
      this.loader.start();
      this.subsink.sink = this.reportService.GetReportCashBalances(body).subscribe((res: any) => {
        this.loader.stop();
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
          this.calculateTotals(this.rowData);
          this.displayMessage("Success: Cash balances retrived successfully.", "green");
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      })
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  ngOnInit(): void {
    this.getTransactions();
  }

  onFilterData(event: any) {
    this.calculateTotals(event);
  }

  calculateTotals(rowData: any) {
    this.totalAmount = rowData.reduce((acc: number, item: any) => acc + parseFloat(item.balanceAmount), 0);
    this.actualAmount = rowData.reduce((acc: number, item: any) => acc + parseFloat(item.totalAmount), 0);
    this.pendingAmount = rowData.reduce((acc: number, item: any) => acc + parseFloat(item.pendingAmount), 0);
    this.totals = "Actual Amount " + this.actualAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      + "Pending Amount " + this.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      + "Total Amount: " + this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onPending() {
    this.displayMessage("", "");
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      // langId: this.userDataService.userData.langId
    };
    try {
      this.subsink.sink = this.msService.GetMyCashTransfers(body).subscribe((res: any) => {
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          const dialogRef: MatDialogRef<CashTransfersComponent> = this.dialog.open(CashTransfersComponent, {
            width: '70%',
            disableClose: true,
            data: res.data
          });
          // dialogRef.afterClosed().subscribe(result => {

          // })
        }
        else {
          this.displayMessage("No pending transactions found to confirm.", "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }

}
