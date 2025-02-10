import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, Subscription } from 'rxjs';
import { AdminService } from 'src/app/Services/admin.service';
import { ReportsService } from 'src/app/Services/reports.service';
import { SubSink } from 'subsink';
import 'jspdf-autotable';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { Store } from '@ngrx/store';
import { NavigationService } from 'src/app/Services/navigation.service';
import { PLReportState } from 'src/app/utils/location.reducer';
import { clearPLReportState, loadPLReportState, savePLReportState } from 'src/app/utils/location.actions';
import { selectPLReportData } from 'src/app/utils/location.selectors';
import { Item } from 'src/app/general/Interface/interface';
import { Company, Items, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
interface ProfitLossItem {
  company: string;
  companyName: string;
  mainHeader: string;
  subHeader: string;
  tranAmount: number;
}

@Component({
  selector: 'app-plreports',
  templateUrl: './plreports.component.html',
  styleUrls: ['./plreports.component.css']
})

export class PlreportsComponent implements OnInit, OnDestroy {
  PandLForm!: FormGroup;
  labelPosition: 'before' | 'after' = 'after';
  reportList: any = [
    { itemCode: "COMPANY", itemName: "Company" },
    { itemCode: "BRANCH", itemName: "Branch" },
    { itemCode: "NPML", itemName: "NPML" },
  ];
  incomeData: ProfitLossItem[] = [];
  expenseData: ProfitLossItem[] = [];
  checked = false;
  totalIncome = 0;
  totalExpenses = 0;
  totalProfit = 0;
  private subsink: SubSink;
  textMessageClass: string = "";
  retMessage: string = "";
  rowData: any = [];
  columnDefs: any = []
  branchList: Item[] = [];
  today = new Date();
  private subscriptions: Subscription = new Subscription();
  profitLossData = [
  ];
  incomeChartData: any;
  expenseChartData: any;
  combinedChartData: any;
  constructor(private fb: FormBuilder, protected router: Router, private store: Store, private navigationService: NavigationService,
    private datepipe: DatePipe, private userDataService: UserDataService,
    private reportService: ReportsService, private adminService: AdminService, private loader: NgxUiLoaderService) {
    this.PandLForm = this.formInit();
    this.subsink = new SubSink();
  }

  ngOnDestroy(): void {
    this.subsink.unsubscribe();
    this.subscriptions.unsubscribe();
  }
  downloadPDF() {
    const doc = new jsPDF.default();
    const fromDate = this.datepipe.transform(this.PandLForm.controls.fromDate.value, 'dd-MM-YYYY');
    const toDate = this.datepipe.transform(this.PandLForm.controls.toDate.value, 'dd-MM-YYYY');

    const currentDate = moment().format('DD-MM-YYYY');
    const dateText = `Report Date: ${fromDate} to ${toDate}`;
    doc.setFontSize(9);
    const dateTextWidth = doc.getStringUnitWidth(dateText) * 12 / doc.internal.scaleFactor;
    const datePos = doc.internal.pageSize.width - dateTextWidth - 10;
    doc.text(dateText, datePos, 10);

    doc.setFontSize(13);
    const header = this.PandLForm.controls.branch.value;
    doc.setFont('helvetica', 'bold');
    doc.text(header, 100, 10, { align: 'center' });

    doc.setFontSize(12);
    let data: any = []
    data = this.extractDataFromGrid(this.rowData);
    const columns = this.columnDefs;
    const text = 'Profit and Loss';
    const textWidth = doc.getStringUnitWidth(text) * 5;  // Adjust the font size accordingly
    const startX = (doc.internal.pageSize.width - textWidth) / 2.1;
    const startY = 20.5;
    doc.setLineWidth(0);
    doc.line(startX, startY, startX + textWidth, startY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(text, 100, 20, { align: 'center' });
    if (this.PandLForm.controls.summary.value) {
      const options = {
        startY: 30,
        styles: {
          fontSize: 8,
          maxCellHeight: 1,
        },
        headStyles: {
          fillColor: [169, 169, 169],
          textColor: [0, 0, 0],
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          border: [0, 0, 0, 1],
          Amount: { halign: 'right' }
        },
        bodyStyles: { fontSize: 8 },
        theme: 'grid',
        columnStyles: {
          2: { halign: 'right' }
        },
      };
      (doc as any).autoTable({
        head: [columns.map((col: any) => col.headerName)],
        body: data.map((row: any) => columns.map((col: any) => row[col.field])),
        ...options
      });
    }
    else {
      const options = {
        startY: 25,
        styles: {
          fontSize: 8,
          maxCellHeight: 3,
        },
        headStyles: {
          fillColor: [169, 169, 169],
          textColor: [0, 0, 0],
          fontSize: 10,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          border: [0, 0, 0, 1],
          tranAmount: { halign: 'right' }
        },
        bodyStyles: { fontSize: 8 },
        theme: 'grid',
        columnStyles: {
          5: { halign: 'right' }
        },
      };
      (doc as any).autoTable({
        head: [columns.map((col: any) => col.headerName)],
        body: data.map((row: any) => columns.map((col: any) => row[col.field])),
        ...options
      });
    }

    doc.save('PLReport.pdf');
  }

  extractDataFromGrid(rowdata: any) {
    let data: any = [];
    data = [...rowdata];
    let skipIncome = false;
    let skipExpenses = false;
    let firstIncome = true;
    let firstExpenses = true;
    for (let i = 0; i < data.length; i++) {
      const category = data[i]['mainHeader'];
      if (firstIncome && category === Type.INCOME) {
        firstIncome = false;
      } else if (firstExpenses && category === Type.EXPENSES) {
        firstExpenses = false;
      } else if (category === Type.INCOME) {
        skipIncome = true;
      } else if (category === Type.INCOME_TOTAL) {
        skipIncome = false;
      } else if (category === Type.EXPENSES) {
        skipExpenses = true;
      } else if (category === Type.EXPENSES_TOTAL) {
        skipExpenses = false;
      }
      data[i]['tranAmount'] = this.formatAmount(data[i]['tranAmount']);
      if (data[i]['tranDate']) {
        const trDate = this.formatDate(data[i]['tranDate']);
        data[i]['tranDate'] = trDate;
      }
      if (skipIncome || skipExpenses) {
        data[i]['mainHeader'] = '';
      }
    }
    return data;
  }

  formatAmount(amount: any): string {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '' : numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  onToggleChange(event: any) {
    this.checked = event.checked;
  }
  formatDate(dateString: any): string {
    const dateObject = new Date(dateString);
    if (isNaN(dateObject.getTime())) {
      return 'Invalid Date';
    }

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    const formattedDate = dateObject.toLocaleDateString('en-GB', options);
    const [day, month, year] = formattedDate.split('/');

    return `${day}-${month}-${year}`;
  }


  ngOnInit(): void {
    this.loadData("");
    this.refreshData();
    this.setColumnDefs();
    this.subscriptions.add(
      this.store.select(selectPLReportData).subscribe((state: PLReportState) => {
        if (state) {
          this.PandLForm.controls['reportType'].patchValue(state.reportType);
          this.PandLForm.controls['branch'].patchValue(state.branch);
          this.PandLForm.controls['fromDate'].patchValue(state.fromDate);
          this.PandLForm.controls['toDate'].patchValue(state.toDate);
          this.PandLForm.controls['summary'].patchValue(state.summary);
          this.rowData = state.data;
        }
      })
    );

    const previousUrl = this.navigationService.getPreviousUrl();
    if (previousUrl === '/property/receipts-payments' || previousUrl === '/property/invoice') {
      this.store.dispatch(loadPLReportState());

    } else {

      this.store.dispatch(clearPLReportState());
    }
  }

  setColumnDefs() {
    if (this.PandLForm.controls.summary.value) {
      this.columnDefs = [
        {
          headerName: 'Category', field: 'mainHeader', resizable: true,
          valueFormatter: function (params: any) {
            const mainHeader = params.value.toUpperCase();
            const displayedRowCount = params.api.getDisplayedRowCount();
            const rowIndex = params.node.rowIndex;
            if (mainHeader === Type.INCOME && rowIndex === 0) {
              return mainHeader;
            }

            if (mainHeader === Type.EXPENSES && rowIndex > 0 && params.api.getRowNode(rowIndex - 1).data.mainHeader === Type.INCOME_TOTAL) {
              return mainHeader;
            }
            if (mainHeader === Type.INCOME_TOTAL || mainHeader === Type.EXPENSES_TOTAL || mainHeader === Type.NET_PROFIT_LOSS) {
              return mainHeader;
            }
            return '';
          },
          cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Charge', field: 'subHeaderDesc', resizable: true, filter: true, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Amount', field: 'tranAmount', resizable: true, type: 'rightAligned',
          cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '14px',
                color: 'black',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.tranAmount < 0) {
              return {
                color: 'red',
                fontWeight: 'bold',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.tranAmount > 0) {
              return {
                color: 'green',
                fontWeight: 'bold',
                justifyContent: 'flex-end'
              };
            }
            else {
              return { justifyContent: 'flex-end' };
            }
          },
          valueFormatter: function (params: any) {
            if (typeof params.value === 'number' || typeof params.value === 'string') {
              const numericValue = parseFloat(params.value.toString());
              if (!isNaN(numericValue)) {
                const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
                return numericValue < 0 ? `${formattedValue}` : formattedValue; // Wrap negative values in parentheses
              }
            }
            return null;
          }
        }
      ];
    }
    else {
      this.columnDefs = [
        {
          headerName: 'Category', field: 'mainHeader', resizable: true, flex: 1,
          valueFormatter: function (params: any) {
            const mainHeader = params.value.toUpperCase();
            const displayedRowCount = params.api.getDisplayedRowCount();
            const rowIndex = params.node.rowIndex;
            if (mainHeader === Type.INCOME && rowIndex === 0) {
              return mainHeader;
            }

            if (mainHeader === Type.EXPENSES && rowIndex > 0 && params.api.getRowNode(rowIndex - 1).data.mainHeader === Type.INCOME_TOTAL) {
              return mainHeader;
            }
            if (mainHeader === Type.INCOME_TOTAL || mainHeader === Type.EXPENSES_TOTAL || mainHeader === Type.NET_PROFIT_LOSS) {
              return mainHeader;
            }
            return '';
          },
          cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Property', field: 'propName', sortable: true, filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Block', field: 'blockName', sortable: true, filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Unit', field: 'unitName', sortable: true, filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Charge', field: 'subHeaderDesc', filter: true, sortable: true, flex: 1, resizable: true, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '14px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Tran Type', field: 'tranType', resizable: true, sortable: true, flex: 1, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Tran No', field: 'tranNo', width: 330, sortable: true, resizable: true, cellRenderer: 'agLnkRenderer', cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
                justifyContent: 'flex-end'
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Tran Date', field: 'tranDate', flex: 1, sortable: true, resizable: true, valueFormatter: function (params: any) {
            if (params.value) {
              const date = new Date(params.value);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
            }
            return null;
          }, cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'black',
              };
            }
            else {
              return;
            }
          }
        },
        {
          headerName: 'Amount', field: 'tranAmount', type: 'rightAligned', flex: 1, resizable: true,
          cellStyle: function (params: any) {
            if (params.data.mainHeader === Type.INCOME_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'green',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.mainHeader === Type.EXPENSES_TOTAL) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '12px',
                color: 'red',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.mainHeader === Type.NET_PROFIT_LOSS) {
              return {
                backgroundColor: 'lightyellow',
                fontSize: '14px',
                color: 'black',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.tranAmount < 0) {
              return {
                color: 'red',
                fontWeight: 'bold',
                justifyContent: 'flex-end'
              };
            }
            if (params.data.tranAmount > 0) {
              return {
                color: 'green',
                fontWeight: 'bold',
                justifyContent: 'flex-end'
              };
            }
            else {
              return { justifyContent: 'flex-end' };
            }
          },
          valueFormatter: function (params: any) {
            if (typeof params.value === 'number' || typeof params.value === 'string') {
              const numericValue = parseFloat(params.value.toString());
              if (!isNaN(numericValue)) {
                const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
                return numericValue < 0 ? `${formattedValue}` : formattedValue;
              }
            }
            return null;
          },

        },

      ];
    }

  }
  refreshData() {
    this.PandLForm.valueChanges.subscribe(() => {
      if (this.PandLForm.controls.summary.dirty) {
        this.setColumnDefs();
        this.PandLForm.controls.summary.markAsPristine();
      }
      if (this.PandLForm.controls.reportType.dirty) {
        if (this.PandLForm.controls.reportType.value.toUpperCase() === Type.COMPANY) {
          this.branchList = [{ itemCode: "All", itemName: "All" }];
          this.PandLForm.controls.branch.patchValue("All", { emitEvent: false });
          return;
        }
        if (this.PandLForm.controls.reportType.value.toUpperCase() === Company.NPML) {
          this.branchList = [{ itemCode: "NPML", itemName: "NPML" }];
          this.PandLForm.controls.branch.patchValue("NPML", { emitEvent: false });
          return;
        }
        else {
          this.branchList = [];
          this.loadData("branch");
        }
        this.PandLForm.controls.reportType.markAsPristine();
      }
      this.rowData = [];
      this.clearMsg();
    });

  }

  onLnkClicked(event: any) {
    const currentState: PLReportState = {
      reportType: this.PandLForm.controls.reportType.value,
      branch: this.PandLForm.controls.branch.value,
      fromDate: this.PandLForm.controls.fromDate.value,
      toDate: this.PandLForm.controls.toDate.value,
      summary: this.PandLForm.controls.summary.value,
      data: this.rowData,
      pagination: {
        pageIndex: 0,
        pageSize: 25
      },

    };
    this.store.dispatch(savePLReportState({ state: currentState }));

    if (event.data.tranType.toUpperCase() === Type.INVOICE) {
      this.router.navigate(['property/invoice'], { state: { data: event.data } });
    }
    else if (event.data.tranType.toUpperCase() === TranType.PAYMENT || event.data.tranType.toUpperCase() === TranType.RECEIPT) {
      this.router.navigate(['property/receipts-payments'], { state: { data: event.data } });
    }

  }
  clearMsg() {
    this.displayMessage("", "");
  }

  onSubmit() {
    this.clearMsg();
    const fromDate = this.datepipe.transform(this.PandLForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
    const toDate = this.datepipe.transform(this.PandLForm.get('toDate')?.value, "yyyy-MM-dd") || "";
    if (fromDate && toDate && fromDate > toDate) {
      this.displayMessage("Error: From Date should be earlier than To Date!", "red");
      return;
    }
    if (this.PandLForm.invalid) {
      return;
    }
    else {
      const body = {
        ...this.commonParams(),
        ReportType: this.PandLForm.controls['reportType'].value,
        Summary: this.PandLForm.controls['summary'].value,
        FromDate: this.datepipe.transform(this.PandLForm.controls['fromDate'].value, "yyyy-MM-dd"),
        ToDate: this.datepipe.transform(this.PandLForm.controls['toDate'].value, "yyyy-MM-dd"),
        location: this.PandLForm.controls['branch'].value
      }
      try {
        this.loader.start();
        this.subsink.sink = this.reportService.GetReportProfitAndLoss(body).subscribe((res: any) => {
          this.loader.stop();
          if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.profitLossData = res.data;
            if (this.profitLossData) {
              this.processData();
              this.prepareChartData();
            }
            let modifiedData = [...res.data];
            const incomeRows = modifiedData.filter(item => item.mainHeader === Type.INCOME);
            const incomeTotal = incomeRows.reduce((total, item) => total + item.tranAmount, 0);

            const expensesRows = modifiedData.filter(item => item.mainHeader === Type.EXPENSES);
            const expenseTotal = expensesRows.reduce((total, item) => total + item.tranAmount, 0);

            const netTotal = incomeTotal + expenseTotal;

            const lastIncomeIndex = modifiedData.map((item, index) => item.mainHeader === Type.INCOME ? index : -1)
              .filter(index => index !== -1)
              .pop() || 0;
            modifiedData.splice(lastIncomeIndex + 1, 0, {
              mainHeader: Type.INCOME_TOTAL,
              tranAmount: incomeTotal,
            });

            if (expensesRows.length > 0) {
              const lastExpensesIndex = modifiedData.map((item, index) => item.mainHeader === Type.EXPENSES ? index : -1)
                .filter(index => index !== -1)
                .pop() || 0;

              modifiedData.splice(lastExpensesIndex + 1, 0, {
                mainHeader: Type.EXPENSES_TOTAL,
                tranAmount: expenseTotal,
              });

              const expensesTotalIndex = modifiedData.findIndex(item => item.mainHeader === Type.EXPENSES_TOTAL);
              modifiedData.splice(expensesTotalIndex + 1, 0, {
                mainHeader: Type.NET_PROFIT_LOSS,
                tranAmount: netTotal,
              });
            } else {
              const incomeTotalIndex = modifiedData.findIndex(item => item.mainHeader === Type.INCOME_TOTAL);
              modifiedData.splice(incomeTotalIndex + 1, 0, {
                mainHeader: Type.EXPENSES_TOTAL,
                tranAmount: expenseTotal,
              });

              const expensesTotalIndex = modifiedData.findIndex(item => item.mainHeader === Type.EXPENSES_TOTAL);
              modifiedData.splice(expensesTotalIndex + 1, 0, {
                mainHeader: Type.NET_PROFIT_LOSS,
                tranAmount: netTotal,
              });
            }
            this.rowData = modifiedData;
            if (this.rowData.length >= 1) {
              for (let i = 0; i < this.rowData.length; i++) {
                if (this.rowData[i].tranType != "" && this.rowData[i].tranType != undefined &&
                  this.rowData[i].tranType != null && this.rowData[i].tranType.toUpperCase() === TranType.SALE) {
                  this.rowData[i].tranType = Type.INVOICE;
                }
              }
            }
            this.displayMessage("Profit and loss report retrieved successfully.", "green");

          }

          else {
            this.displayMessage(res.message, "red");
            this.rowData = [];
            this.loader.stop();
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage("Exception " + ex.message, "red");
      }


    }
  }

  formInit() {
    return this.fb.group({
      reportType: ['', Validators.required],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), Validators.required],
      toDate: [new Date(), Validators.required],
      branch: ['', Validators.required],
      summary: [false]
    });
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      langId: this.userDataService.userData.langId
    }
  }
  processData() {
    this.incomeData = this.profitLossData.filter((item: any) => item.mainHeader === Type.INCOME);
    this.expenseData = this.profitLossData.filter((item: any) => item.mainHeader === Type.EXPENSES);

    this.totalIncome = this.incomeData.reduce((acc, item) => acc + item.tranAmount, 0);
    this.totalExpenses = Math.abs(this.expenseData.reduce((acc, item) => acc + item.tranAmount, 0));
    this.totalProfit = this.totalIncome - this.totalExpenses;
  }

  loadData(branch: string) {
    const branchbody: getPayload = {
      ...this.commonParams(),
      item: Items.BRANCHES
    };
    const service2 = this.adminService.GetMasterItemsList(branchbody);
    try {
      this.subsink.sink = forkJoin([service2]).subscribe(
        (results: any[]) => {
          const res2 = results[0];
          if (res2 && res2.data) {
            this.branchList = res2.data;
            if(branch != "branch") {
              this.branchList.unshift({ itemCode: "All", itemName: "All" });
              this.branchList.unshift({ itemCode: "NPML", itemName: "NPML" });
            }
            else {
              this.PandLForm.get('branch')?.patchValue("",{emitEvent: false});
            }

          }
          else {
            this.displayMessage("Error: Branch list not found.", "red");
          }
        },
        error => {
          this.loader.stop();
          this.displayMessage("Error: " + error.message, "red");

        }
      );
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage("Exception: " + ex.message, "red");
    }


  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }



  Close() {
    this.router.navigateByUrl('/home');
  }


  clear() {
    this.PandLForm = this.formInit();
    this.displayMessage("", "");
    this.rowData = [];
    this.refreshData();
    this.branchList.unshift({ itemCode: "All", itemName: "All" });
    this.branchList.unshift({ itemCode: "NPML", itemName: "NPML" });
  }

  prepareChartData() {
    this.incomeChartData = {
      labels: this.incomeData.map(item => item.subHeader),
      datasets: [
        {
          label: 'Income',
          data: this.incomeData.map(item => item.tranAmount),
          backgroundColor: '#42A5F5'
        }
      ]
    };

    this.expenseChartData = {
      labels: this.expenseData.map(item => item.subHeader),
      datasets: [
        {
          label: 'Expenses',
          data: this.expenseData.map(item => item.tranAmount),
          backgroundColor: '#FFA726'
        }
      ]
    };
    this.combinedChartData = {
      labels: this.incomeData.map(item => item.subHeader),
      datasets: [
        {
          label: 'Income',
          data: this.incomeData.map(item => item.tranAmount),
          backgroundColor: '#42A5F5'
        },
        {
          label: 'Expenses',
          data: this.expenseData.map(item => item.tranAmount),
          backgroundColor: '#FFA726'
        }
      ]
    };
  }


}
