import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { SearchPartyComponent } from '../search-party/search-party.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import jsPDF from 'jspdf';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { forkJoin, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Item } from '../Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SalesService } from 'src/app/Services/sales.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { ReceiptDetailsDataComponent } from './receipt-details-data/receipt-details-data.component';
import { ProjectsService } from 'src/app/Services/projects.service';
import { Store } from '@ngrx/store';
import { selectReportData } from 'src/app/utils/location.selectors';
import { ReportState } from 'src/app/utils/location.reducer';
import { clearReportState, loadReportState, saveReportState } from 'src/app/utils/location.actions';
import { NavigationService } from 'src/app/Services/navigation.service';
import { debug } from 'console';
@Component({
  selector: 'app-reprots',
  templateUrl: './reprots.component.html',
  styleUrls: ['./reprots.component.css']
})
export class ReprotsComponent implements OnInit, OnDestroy {
  reportForm!: FormGroup;
  masterParams!: MasterParams;
  reportType: Item[] = [
    { itemCode: 'Statement', itemName: 'Statement' },
    { itemCode: 'Revenue', itemName: 'Revenue' },
    { itemCode: 'CASHTRF', itemName: 'Cashflow' },
    { itemCode: 'DEPOSIT', itemName: 'Deposit' },
    { itemCode: 'LOANSTATEMENT', itemName: 'Unit B/bf' },
  ];
  clientTypes: Item[] = [
    { itemCode: 'ACCOUNT', itemName: 'Bank Account' },
    { itemCode: 'LANDLORD', itemName: 'Landlord' },
    { itemCode: 'MANAGEMENT', itemName: 'Management' },
    { itemCode: 'PROPERTY', itemName: 'Property' },
    { itemCode: 'TENANT', itemName: 'Tenant' },
    { itemCode: 'STAFF', itemName: 'Staff' }

  ];
  reportTypeTemp: Item[] = [];

  // branchList: any = [];
  chargeList: Item[] = [];
  @Input() max: any;
  rprtName: string = "";
  today = new Date();
  totals: string = "";
  fromDate!: Date;
  toDate!: Date;
  retMessage: string = "";
  textMessageClass: string = "";
  private subsink!: SubSink;
  landlordCode: any;
  dialogOpen: boolean = false;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [100, 250, 500];
  pageSize = 100;
  columnDefs: any;
  debitAmount: number = 0;
  creditAmount: number = 0;
  balAmount: number = 0;
  creditTmp: boolean = false;
  debitTmp: boolean = false;
  balanceTmp: boolean = false;
  amountTmp: boolean = false;
  totalAmount: number = 0;
  totalDepositAmt: number = 0;
  custName: string = "";
  totalDepositPaid: number = 0;
  totalDepositBal: number = 0;
  totalProperty: number = 0;
  totalLandLord: number = 0;
  selectDate: string = 'TO Date';
  loanBalAmount: number = 0;
  totLoanAmt: number = 0;
  firstDayOfMonth:any = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  formattedFirstDayOfMonth : any = this.formatDated(this.firstDayOfMonth);
  totLoanPaid: number = 0;
  totLoanBal: number = 0;
  private subscriptions: Subscription = new Subscription();
  constructor(private fb: FormBuilder, protected router: Router, private userDataService: UserDataService, protected projService: ProjectsService,
    private datePipe: DatePipe,private masterService: MastersService, private datepipe: DatePipe, private saleService: SalesService, private store: Store, private navigationService: NavigationService,
    private utlService: UtilitiesService, private loader: NgxUiLoaderService, public dialog: MatDialog) {
    this.reportForm = this.formInit();
    this.subsink = new SubSink();
    this.setColumnDefs();
    this.masterParams = new MasterParams();

  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
    this.subscriptions.unsubscribe();
  }
  setDepositCols() {
    {
      this.columnDefs = [
        { headerName: 'Property', field: 'propertyName', sortable: false, filter: true, resizable: true, flex: 1 },
        { headerName: 'Block', field: 'blockName', sortable: false, filter: true, resizable: true, flex: 1 },
        { headerName: 'Unit', field: 'unitName', sortable: false, filter: true, resizable: true, flex: 1 },
        { headerName: 'Tenant', field: 'tenantName', sortable: false, filter: true, resizable: true, flex: 1 },
        {
          headerName: 'Deposit', field: 'unitDepositAmount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
          valueFormatter: (params: { data: { unitDepositAmount: any }; }) => {
            const unitDepositAmount = parseFloat(params.data.unitDepositAmount.toString());
            if (unitDepositAmount !== undefined) {
              return `${unitDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return '';
          }
        },
        {
          headerName: 'Paid', field: 'tenantAmount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
          valueFormatter: (params: { data: { tenantAmount: any }; }) => {
            const tenantAmount = parseFloat(params.data.tenantAmount.toString());
            if (tenantAmount !== undefined) {
              return `${tenantAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return '';
          }
        },
        {
          headerName: 'Balance', field: 'balDepAmount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
          valueFormatter: (params: { data: { balDepAmount: any }; }) => {
            const balDepAmount = parseFloat(params.data.balDepAmount.toString());
            if (balDepAmount !== undefined) {
              return `${balDepAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return '';
          }
        },
      ]


      if (this.reportForm.controls['PropertyHoldings'].value && !this.reportForm.controls['LandLordHoldings'].value) {
        this.columnDefs.push({
          headerName: 'Property Holdings',
          field: 'propertyAmount',
          filter: 'agNumberColumnFilter',
          resizable: true,
          flex: 1,
          type: 'rightAligned',
          cellStyle: { justifyContent: "flex-end" },
          valueFormatter: (params: { data: { propertyAmount: any }; }) => {
            const propertyAmount = parseFloat(params.data.propertyAmount.toString());
            if (propertyAmount !== undefined) {
              return `${propertyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return '';
          }
        });
        this.gridApi.setColumnDefs(this.columnDefs);
      }
      if (this.reportForm.controls['LandLordHoldings'].value && !this.reportForm.controls['PropertyHoldings'].value) {
        this.columnDefs.push(
          { headerName: 'LandLord', field: 'landlordName', sortable: false, filter: false, autoHeight: true, resizable: true, flex: 1 },
          {
            headerName: 'Landlord Holdings',
            field: 'landlordAmount',
            filter: 'agNumberColumnFilter',
            resizable: true,
            flex: 1,
            type: 'rightAligned',
            cellStyle: { justifyContent: "flex-end" },
            valueFormatter: (params: { data: { landlordAmount: any }; }) => {
              const landlordAmount = parseFloat(params.data.landlordAmount.toString());
              if (landlordAmount !== undefined) {
                return `${landlordAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
              return '';
            }
          });
        this.gridApi.setColumnDefs(this.columnDefs);
      }
      else if (this.reportForm.controls['LandLordHoldings'].value && this.reportForm.controls['PropertyHoldings'].value) {
        this.columnDefs.push(
          { headerName: 'LandLord', field: 'landlordName', sortable: false, filter: false, autoHeight: true, resizable: true, flex: 1 },
          {
            headerName: 'Landlord Holdings',
            field: 'landlordAmount',
            filter: 'agNumberColumnFilter',
            resizable: true,
            flex: 1,
            type: 'rightAligned',
            cellStyle: { justifyContent: "flex-end" },
            valueFormatter: (params: { data: { landlordAmount: any }; }) => {
              const landlordAmount = parseFloat(params.data.landlordAmount.toString());
              if (landlordAmount !== undefined) {
                return `${landlordAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
              return '';
            }
          },
          {
            headerName: 'Preperty Holdings',
            field: 'propertyAmount',
            filter: 'agNumberColumnFilter',
            resizable: true,
            flex: 1,
            type: 'rightAligned',
            cellStyle: { justifyContent: "flex-end" },
            valueFormatter: (params: { data: { propertyAmount: any }; }) => {
              const propertyAmount = parseFloat(params.data.propertyAmount.toString());
              if (propertyAmount !== undefined) {
                return `${propertyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
              return '';
            }
          }
        );
        this.gridApi.setColumnDefs(this.columnDefs);

      }
    }
  }
  setLoanCols() {
    this.columnDefs = [
      { headerName: 'S.No', field: 'slNo', sortable: false, filter: false, resizable: true, flex: 1 },
      { headerName: 'Tran Date', field: 'tranDate', sortable: false, filter: false, resizable: true, flex: 1 },
      {
        headerName: 'Loan Amount', field: 'loanAmount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
        valueFormatter: (params: { data: { loanAmount: any; currency: any; }; }) => {
          const loanAmount = params.data.loanAmount;
          const currency = params.data.currency;
          if (loanAmount !== undefined && currency) {
            // Format loan balance with commas and append the currency
            return `${loanAmount.toLocaleString()} ${currency}`;
          }
          return '';
        }
      },

      {
        headerName: 'Paid Amount', field: 'paidAmount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
        valueFormatter: (params: { data: { paidAmount: any; currency: any; }; }) => {
          const paidAmount = params.data.paidAmount;
          const currency = params.data.currency;
          if (paidAmount !== undefined && currency) {
            // Format loan balance with commas and append the currency
            return `${paidAmount.toLocaleString()} ${currency}`;
          }
          return '';
        }
      },
      {
        headerName: 'Balance Amount', field: 'balLoanAmt', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
        valueFormatter: (params: { data: { balLoanAmt: any; currency: any; }; }) => {
          const balLoanAmt = params.data.balLoanAmt;
          const currency = params.data.currency;
          if (balLoanAmt !== undefined && currency) {
            // Format loan balance with commas and append the currency
            return `${balLoanAmt.toLocaleString()} ${currency}`;
          }
          return '';
          valueGetter: (params: { node: { rowIndex: number; }; api: { getDisplayedRowCount: () => number; }; }) => {
            const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
            if (isLastRow) {
              // Calculate totals based on your data fields
              const loanAmountTotal = this.totLoanAmt; // Replace 'loanAmount' with actual field names
              const paidAmountTotal = this.totLoanPaid;
              const balLoanAmtTotal = this.totLoanBal;

            }
            return ''; // Empty value for non-last rows
          }
        }
      },
    ]
  }
  setColumnDefs() {
    if (this.reportForm.controls['reportType'].value.toUpperCase() === "DEPOSIT") {
      this.setDepositCols();
    }
    else if (this.reportForm.controls['reportType'].value.toUpperCase() === "LOANSTATEMENT") {
      this.setLoanCols();
    }
    else if (this.reportForm.controls['reportType'].value === "Statement") {
      if (this.reportForm.controls['summary'].value) {
        this.columnDefs = [
          { headerName: 'Tran Type', field: 'tranType', sortable: false, filter: false, resizable: true, flex: 1 },
          {
            headerName: 'Branch Name', field: 'branchName', filter: true, resizable: true, width: 220, cellStyle: function (params: any) {
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
          // {
          //   headerName: 'Party Name', field: 'partyName', filter: true, resizable: true, width: 220, cellStyle: function (params: any) {
          //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //     const isNegative = params.value < 0;
          //     return {
          //       color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          //       fontSize: isLastRow ? '12px' : 'inherit',
          //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
          //     };
          //   },
          // },
          {
            headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', resizable: true, width: 220, type: 'rightAligned',
            cellStyle: function (params: any) {
              const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
              const isNegative = params.value < 0;
              return {
                justifyContent: "flex-end",
                color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
                fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
                fontSize: isLastRow ? '12px' : 'inherit',
                backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  // Format value with parentheses for negative numbers
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(numericValue));
                  return params.value < 0 ? `(${formattedValue})` : formattedValue;
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
            field: "tranNo", headerName: "Tran No", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true, cellStyle: function (params: any) {
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
            field: "detail", headerName: "Details", flex: 1, resizable: true, cellRenderer: 'agDtlRenderer', cellStyle: function (params: any) {
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
            field: "tranType", headerName: "Tran Type", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
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
            field: "unitName", headerName: "Unit", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
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
            field: "txnClientName", headerName: "Client", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
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
            field: "branchName", headerName: "Branch", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
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
            field: "tranDate", headerName: "Tran Date", filter: true, resizable: true, flex: 1,
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
            }, cellStyle: function (params: any) {
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
          // {
          //   field: "partyName", headerName: "Party Name", filter: true, resizable: true, width: 180, cellStyle: function (params: any) {
          //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //     const isNegative = params.value < 0;
          //     return {
          //       color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          //       fontSize: isLastRow ? '12px' : 'inherit',
          //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
          //     };
          //   },
          // },
          {
            headerName: 'Credit', field: 'credit', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
            cellStyle: function (params: any) {
              const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
              const isNegative = params.value > 0;
              return {
                justifyContent: "flex-end",
                // color: isLastRow ? 'green' : isNegative ? 'green' : 'inherit', // set color based on value
                fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
                fontSize: isLastRow ? '12px' : 'inherit',
                backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(numericValue));
                  return params.value < 0 ? `${formattedValue}` : formattedValue;
                }
              }
              return null;
            }
          },
          {
            headerName: 'Debit', field: 'debit', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
            cellStyle: function (params: any) {
              const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
              const isNegative = params.value < 0;
              return {
                justifyContent: "flex-end",
                // color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
                fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
                fontSize: isLastRow ? '12px' : 'inherit',
                backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
                  return params.value < 0 ? `${formattedValue}` : formattedValue;
                }
              }
              return null;
            }
          },

          {
            headerName: 'Balance', field: 'balance', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
            cellStyle: function (params: any) {
              const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
              const isNegative = params.value < 0;
              // const tranNo = params.data.tranNo ? params.data.tranNo.toLowerCase() : '';
              // const isExcludedRow = tranNo === 'opening' || tranNo === 'closing';

              // if (isExcludedRow) {
              //   // Return default styles if it's an "opening" or "closing" row
              //   return {};
              // }
              return {
                justifyContent: "flex-end",
                // color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
                // color: 'blue', // Text color for the link
                // textDecoration: 'underline',
                fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
                fontSize: isLastRow ? '12px' : 'inherit',
                backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
                  return params.value < 0 ? `${formattedValue}` : formattedValue;
                }
              }
              return null;
            }
          },
          // {
          //   field: "payment", headerName: "Payment / Receipt", flex: 1, cellStyle: function (params: any) {
          //     // const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //     // const isNegative = params.value < 0;
          //     return {
          //       // justifyContent: "flex-end",
          //       color: 'blue', // Text color for the link
          //       textDecoration: 'underline', // Underline text
          //       cursor: 'pointer', // Pointer cursor to indicate it's clickable
          //       // backgroundColor: 'yellow'
          //     };
          //   },
          // },

        ];
      }
    }
    else if (this.reportForm.controls['reportType'].value === "Revenue") {
      if (this.reportForm.controls['summary'].value) {
        this.columnDefs = [
          // Define your column definitions for summary true
          // Example:
          { headerName: 'Branch Name', field: 'branchName', filter: true, resizable: true, flex: 1 },
          { headerName: 'Item Type', field: 'itemType', filter: true, resizable: true, flex: 1 },
          { headerName: 'Item Name', field: 'itemName', filter: true, resizable: true, flex: 1 },
          {
            headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
            cellStyle: function (params: any) {
              return {
                justifyContent: "flex-end",
                color: params.value > 0 ? 'green' : params.value < 0 ? 'red' : 'inherit', // set color based on value
                fontWeight: params.value ? 'bold' : 'normal' // set font weight based on value
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  // Format value with parentheses for negative numbers
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(numericValue));
                  return params.value < 0 ? `(${formattedValue})` : formattedValue;
                }
              }
              return null;
            }
          }
          // Add more columns as needed
        ];
      }
      else {
        this.columnDefs = [

          { field: "tranNo", headerName: "Tran No", flex: 1, cellRenderer: 'agLnkRenderer', },
          // { field: "reportName", headerName: "Report Name",  filter: true, resizable: true, flex: 1 },
          { field: "branchName", headerName: "Branch", filter: true, resizable: true, flex: 1 },
          {
            field: "tranDate", headerName: "Tran Date", filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
          { field: "itemType", headerName: "Item Type", filter: true, resizable: true, flex: 1 },
          { field: "itemName", headerName: "Item Name", filter: true, resizable: true, width: 180 },
          {
            headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
            cellStyle: function (params: any) {
              return {
                justifyContent: "flex-end",
                color: params.value > 0 ? 'green' : params.value < 0 ? 'red' : 'inherit', // set color based on value
                fontWeight: params.value ? 'bold' : 'normal' // set font weight based on value
              };
            },
            valueFormatter: function (params: any) {
              if (typeof params.value === 'number' || typeof params.value === 'string') {
                const numericValue = parseFloat(params.value.toString());
                if (!isNaN(numericValue)) {
                  // Format value with parentheses for negative numbers
                  const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(numericValue));
                  return params.value < 0 ? `(${formattedValue})` : formattedValue;
                }
              }
              return null;
            }
          }
        ];
      }
    }
    else {
      this.columnDefs = [
        {
          field: "tranNo", headerName: "Tran No", flex: 1, cellRenderer: 'agLnkRenderer', resizable: true,
          // cellStyle: function (params: any) {
          //   const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //   const isNegative = params.value < 0;
          //   return {
          //     color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          //     fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          //     fontSize: isLastRow ? '12px' : 'inherit',
          //     backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
          //   };
          // },
        },
        // { field: "detail", headerName: "Details", flex: 1, resizable: true, cellRenderer: 'agDtlRenderer' },
        // {
        //   field: "tranType", headerName: "Tran Type", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
        //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        //     const isNegative = params.value < 0;
        //     return {
        //       color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
        //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
        //       fontSize: isLastRow ? '12px' : 'inherit',
        //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        //     };
        //   },
        // },
        // { field: "reportName", headerName: "Report Name",  filter: true, resizable: true, flex: 1 },
        // {
        //   field: "branchName", headerName: "Branch", filter: true, resizable: true, flex: 1, cellStyle: function (params: any) {
        //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        //     const isNegative = params.value < 0;
        //     return {
        //       color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
        //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
        //       fontSize: isLastRow ? '12px' : 'inherit',
        //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        //     };
        //   },
        // },
        {
          field: "tranDate", headerName: "Tran Date", filter: true, resizable: true, flex: 1,
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
          //  cellStyle: function (params: any) {
          //   const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //   const isNegative = params.value < 0;
          //   return {
          //     color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          //     fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          //     fontSize: isLastRow ? '12px' : 'inherit',
          //     backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
          //   };
          // },
        },
        // {
        //   field: "partyName", headerName: "Sender", filter: true, resizable: true, width: 180, cellStyle: function (params: any) {
        //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        //     const isNegative = params.value < 0;
        //     return {
        //       color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
        //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
        //       fontSize: isLastRow ? '12px' : 'inherit',
        //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        //     };
        //   },
        // },
        {
          field: "tranClientName", headerName: "Party", filter: true, resizable: true, width: 180,
          //  cellStyle: function (params: any) {
          //   const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
          //   const isNegative = params.value < 0;
          //   return {
          //     color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
          //     fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
          //     fontSize: isLastRow ? '12px' : 'inherit',
          //     backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
          //   };
          // },
        },
        {
          field: "tranStatus", headerName: "Status", flex: 1, resizable: true,
          cellStyle: (params: any) => {
            const cellValue = params.value;

            if (cellValue === 'Pending') {
              return { color: 'red' };
            }
            else if (cellValue === 'Confirmed') {
              return { color: 'green' };
            }
            // else if (cellValue === 'Closed') {
            //   return { backgroundColor: 'green', color: 'White' };
            // }
            else if (cellValue === 'Cancelled') {
              return { color: 'gray' };
            }
            else {
              return null;
            }
          }
        },
        {
          headerName: 'Amount', field: 'amount', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
          cellStyle: function (params: any) {
            const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
            const isNegative = params.value > 0;
            return {
              justifyContent: "flex-end",
              color: isNegative ? 'inherit' : 'red', // set color based on value
              fontWeight: isNegative ? 'bold' : 'bold', // set font weight based on value
              // fontSize: isLastRow ? '12px' : 'inherit',
              // backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
            };
          },
          valueFormatter: function (params: any) {
            if (typeof params.value === 'number' || typeof params.value === 'string') {
              const numericValue = parseFloat(params.value.toString());
              if (!isNaN(numericValue)) {
                const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((numericValue));
                return formattedValue;
              }
            }
            return null;
          }
        },

        // {
        //   headerName: 'Debit', field: 'debit', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
        //   cellStyle: function (params: any) {
        //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        //     const isNegative = params.value < 0;
        //     return {
        //       justifyContent: "flex-end",
        //       // color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
        //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
        //       fontSize: isLastRow ? '12px' : 'inherit',
        //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        //     };
        //   },
        //   valueFormatter: function (params: any) {
        //     if (typeof params.value === 'number' || typeof params.value === 'string') {
        //       const numericValue = parseFloat(params.value.toString());
        //       if (!isNaN(numericValue)) {
        //         const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        //         return params.value < 0 ? `${formattedValue}` : formattedValue;
        //       }
        //     }
        //     return null;
        //   }
        // },
        // {
        //   headerName: 'Balance', field: 'balance', filter: 'agNumberColumnFilter', resizable: true, flex: 1, type: 'rightAligned',
        //   cellStyle: function (params: any) {
        //     const isLastRow = params.node.rowIndex === params.api.getDisplayedRowCount() - 1;
        //     const isNegative = params.value < 0;
        //     // const tranNo = params.data.tranNo ? params.data.tranNo.toLowerCase() : '';
        //     // const isExcludedRow = tranNo === 'opening' || tranNo === 'closing';

        //     // if (isExcludedRow) {
        //     //   // Return default styles if it's an "opening" or "closing" row
        //     //   return {};
        //     // }
        //     return {
        //       justifyContent: "flex-end",
        //       // color: isLastRow ? 'green' : isNegative ? 'red' : 'inherit', // set color based on value
        //       // color: 'blue', // Text color for the link
        //       // textDecoration: 'underline',
        //       fontWeight: isLastRow ? 'bold' : isNegative ? 'bold' : 'normal', // set font weight based on value
        //       fontSize: isLastRow ? '12px' : 'inherit',
        //       backgroundColor: isLastRow ? 'lightyellow' : 'inherit'
        //     };
        //   },
        //   valueFormatter: function (params: any) {
        //     if (typeof params.value === 'number' || typeof params.value === 'string') {
        //       const numericValue = parseFloat(params.value.toString());
        //       if (!isNaN(numericValue)) {
        //         const formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        //         return params.value < 0 ? `${formattedValue}` : formattedValue;
        //       }
        //     }
        //     return null;
        //   }
        // }

      ];
    }
  }
  async ngOnInit() {
    
    // this.getTotalRow();
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const chargeBody = {
      ...this.commonParams(),
      item: 'RENTCHARGE'
    };

    const charges$ = this.masterService.GetMasterItemsList(chargeBody);
    this.subsink.sink = await forkJoin([charges$]).subscribe(
      ([chargesRes]: any) => {
        this.loader.stop();
        this.chargeList = chargesRes.data;
        if (this.reportType.length === 1) {
          this.reportForm.get('reportType')!.patchValue(this.reportType[0].itemCode);
        }
        if (chargesRes.status.toUpperCase() === "SUCCESS") {
          if (this.chargeList.length === 1) {
            this.reportForm.get('chargeType')!.patchValue(this.chargeList[0].itemCode);
          }
        }
        else {
          this.displayMessage("Error: " + chargesRes.message, "red");
        }
      },
      error => {
        this.displayMessage("Error: " + error.message, "red");
      }
    );
    this.refreshData();
    this.subscriptions.add(
      this.store.select(selectReportData).subscribe((state: ReportState) => {
        if (state.data) {
          this.reportForm.controls['reportType'].patchValue(state.reportType);
          this.reportForm.controls['clientType'].patchValue(state.clientType);
          this.reportForm.controls['client'].patchValue(state.client);
          this.reportForm.controls['chargeType'].patchValue(state.chargeType);
          this.reportForm.controls['fromDate'].patchValue(state.fromDate);
          this.reportForm.controls['toDate'].patchValue(state.toDate);
          this.reportForm.controls['summary'].patchValue(state.summary);
          this.rowData = state.data;
          this.creditAmount = state.creditAmount;
          this.debitAmount = state.debitAmount;
          this.balAmount = state.balAmount;
          this.landlordCode = state.landlordCode;
          this.totalDepositAmt = 0;
          this.totalDepositBal = 0;
          this.totalDepositPaid = 0;
          this.totalLandLord = 0;
          this.totalProperty = 0;
          // Restore pagination and other states if needed
        }
      })
    );

    // Load the state when the component initializes
    const previousUrl = this.navigationService.getPreviousUrl();
    if (previousUrl === '/property/receipts-payments' || previousUrl === '/property/invoice') {
      this.store.dispatch(loadReportState());

    } else {

      this.store.dispatch(clearReportState());
    }
    this.customerType();
    console.log(this.formattedFirstDayOfMonth)
    this.reportForm.get('fromDate')?.patchValue(this.formattedFirstDayOfMonth);
  }
  refreshData() {
    this.reportForm.controls['summary'].valueChanges.subscribe(() => {
      this.rowData = [];
      this.setColumnDefs();
    });
    this.reportForm.controls['LandLordHoldings'].valueChanges.subscribe(() => {
      this.rowData = [];
      this.setColumnDefs();
    });
    this.reportForm.controls['PropertyHoldings'].valueChanges.subscribe(() => {
      this.rowData = [];
      this.setColumnDefs();
    });
    this.subsink.sink = this.reportForm.controls['reportType'].valueChanges.subscribe((type: any) => {
      this.landlordCode = "";
      if (type.toUpperCase() === "REVENUE") {
        this.reportForm.controls['client'].disable();
        this.reportForm.controls['clieType'].enable();
        this.selectDate = "To Date";

      }
      else if (type.toUpperCase() === "CASHTRF") {
        // this.reportForm.controls['clientType'].patchValue('STAFF', { disable: true });
        this.reportForm.controls['clientType'].patchValue('STAFF');
        this.reportForm.controls['clientType'].disable();
        this.selectDate = "To Date";

      }
      else if (type.toUpperCase() === "DEPOSIT") {
        this.reportForm.controls['clientType'].patchValue('TENANT');
        this.reportForm.controls['clientType'].disable();
        this.selectDate = "As On Date";

      }
      else if (type.toUpperCase() === "STATEMENT") {
        this.reportForm.controls['client'].enable();
        this.reportForm.controls['clientType'].enable();
      }
      else if (type.toUpperCase() === "LOANSTATEMENT") {
        this.reportForm.controls['clientType'].enable();
      }
      else {
        this.reportForm.controls['client'].enable();
        this.reportForm.controls['chargeType'].disable();
        this.selectDate = "To Date";

      }
      this.rowData = [];
      this.setColumnDefs();

    });
    this.reportForm.valueChanges.subscribe(changes => {
      this.creditAmount = 0;
      this.debitAmount = 0;
      this.rowData = [];
      this.displayMessage("", "");
      if (changes.clientType === "PROPERTY" && changes.reportType.toUpperCase() === "STATEMENT") {
        this.displayMessage("Statements are not available for property. Please select 'Revenue' as the report type.", "red");
      }

    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    if (this.reportForm.controls['reportType'].value === "Statement") {
      if (field.toUpperCase() === 'BALANCE') {
        this.balanceTmp = hide;
      }
      else if (field.toUpperCase() === 'DEBIT') {
        this.debitTmp = hide;
      }
      else if (field.toUpperCase() === 'CREDIT') {
        this.creditTmp = hide;
      }
      this.getTotalRow();

    }
    else if (field.toUpperCase() === 'AMOUNT') {
      this.amountTmp = hide;
      this.getTotalRevenue();
    }
    // else{
    //   // this.amountTmp = hide;
    //   this.getTotalRevenue();
    // }
  }
  getTotalRevenue() {
    this.rprtName = this.reportForm.controls.client.value + " " + this.reportForm.controls['reportType'].value;
    if (!this.amountTmp) {
      this.totals = "Total Amount: " + this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else {
      this.totals = "";
    }
  }
  isFormValid(): boolean {
    if (this.userDataService.userData.userProfile.toUpperCase() === "TENANT") {
      return true;
    }
    if (this.userDataService.userData.userProfile.toUpperCase() === "LANDLORD") {
      return true;
    }
    if (this.reportForm.get('reportType')!.value.toUpperCase() === 'DEPOSIT') {
      return true;
    }
    // else if(this.reportForm.get('reportType')!.value.toUpperCase()==='LOANSTATEMENT'){
    //   if(this.reportForm.get('clientType')!.value.toUpperCase()!=='SELECT'){
    //     if(this.reportForsm.get('cleint')!.value.toUpperCase()!==''){
    //       return true;
    //     }
    //     return false
    //   }
    // }
    else {
      if (this.reportForm.valid) {
        return true;
      }
      else {
        return false;
      }
    }
    return false;
  }

  onFilterData(event: any) {
    // console.log(event);
    this.processRowPostCreate(event);
  }
  getTotalRow() {
    this.rprtName = this.reportForm.controls.client.value + " " + " Statement";
    if (!this.creditTmp && !this.debitTmp && !this.balanceTmp) {
      this.totals = "Credit: " + this.creditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " Debit: " + this.debitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " Balance: " + this.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.creditTmp && !this.debitTmp) {
      this.totals = "Credit: " + this.creditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " Debit: " + this.debitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.creditTmp && !this.balanceTmp) {
      this.totals = "Credit: " + this.creditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " Balance: " + this.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.debitTmp && !this.balanceTmp) {
      this.totals = "Debit: " + this.debitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " Balance: " + this.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.creditTmp) {
      this.totals = "Credit: " + this.creditAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.debitTmp) {
      this.totals = "Debit: " + this.debitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (!this.balanceTmp) {
      this.totals = "Balance: " + this.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else {
      this.totals = "";
    }
  }
  customerType() {
    if (this.userDataService.userData.userProfile.toUpperCase() === "TENANT") {
      this.reportTypeTemp = [];
      this.reportTypeTemp = this.reportType.filter(item => item.itemCode === "Statement");
      this.reportForm.get('reportType')?.patchValue('Statement');
      this.reportForm.controls['reportType'].disable();
    }
    else if (this.userDataService.userData.userProfile.toUpperCase() === "LANDLORD") {
      this.reportTypeTemp = [];
      this.reportTypeTemp = this.reportType.filter(item => item.itemCode === "Statement" || item.itemCode === 'LOANSTATEMENT');
    }
    else {
      this.reportTypeTemp = this.reportType;
    }
  }
  isClientEnable(): boolean {
    if (this.userDataService.userData.userProfile.toUpperCase() === "TENANT" || this.userDataService.userData.userProfile.toUpperCase() === "LANDLORD") {
      // this.reportForm.get('client')?.patchValue(this.userDataService.userData.userProfile.userID);
      return false;
    }
    else {
      if (this.reportForm.get('reportType')!.value == 'Revenue') {
        return false
      }
      else if (this.reportForm.get('clientType')!.value == 'PROPERTY') {
        return false;
      }
      else if (this.reportForm.get('reportType')!.value.toUpperCase() == 'DEPOSIT') {
        return false;
      }
    }
    return true;
  }
  isClientTypeEnable(): boolean {
    if (this.userDataService.userData.userProfile.toUpperCase() === "TENANT" || this.userDataService.userData.userProfile.toUpperCase() === "LANDLORD") {
      this.reportForm.get('clientType')!.patchValue(this.userDataService.userData.userProfile);
      return false;
    }
    return true;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userProfile,
      refNo: this.userDataService.userData.sessionID,
      langId: this.userDataService.userData.langId
    }
  }
  downloadPDF() {
    this.loader.start();
    let name: string = "Report";
    const params = {
      orientation: 'landscape' as const,
    };
    const pdfDoc: any = new jsPDF(params);
    const content: any = this.gridApi.getDataAsCsv();
    const contentWithoutQuotes = content.replace(/"/g, '');
    const rows = contentWithoutQuotes.split('\n').map((row: any) => row.split(','));
    const columns = rows.shift() || [];
    const dateColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('date'));
    const debitColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('debit'));
    const creditColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('credit'));

    if (dateColumnIndex !== -1) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const dateValue = row[dateColumnIndex];
        if (dateValue) {
          // Parse the date with the specified format
          const formattedDate = moment(dateValue, 'DD-MM-YYYY').format('DD-MM-YYYY');
          // Update the date value in the row
          row[dateColumnIndex] = formattedDate;
        }
      }
    }
    if (content) {
      const currentDate = moment().format('DD-MM-YYYY'); // Format current date
      const options = {
        startY: 15, // Adjust startY to add space after the header
        head: [columns],
        body: rows,
        styles: {
          fontSize: 8, // Set the desired font size
          maxCellHeight: 3, // Set the desired row height
        },
        didDrawCell: (data: any) => {
          if ((data.column.index === debitColumnIndex || data.column.index === creditColumnIndex) && data.row.index > 0) { // Exclude header row
            const cellValue = parseFloat(data.cell.value);
            if (cellValue < 0) {
              pdfDoc.setTextColor(255, 0, 0); // Set text color to red
            } else {
              pdfDoc.setTextColor(0, 0, 0); // Reset text color to black
            }
          }
        },
        didDrawPage: (data: any) => {
          // Decrease header height
          if (data.pageNumber === 1) {
            const text = name;
            const textFontSize = 11; // Set the desired font size for the text
            pdfDoc.setFontSize(textFontSize);
            const textWidth = pdfDoc.getStringUnitWidth(text) * 12 / pdfDoc.internal.scaleFactor;
            const centerPos = (pdfDoc.internal.pageSize.width / 2) - (textWidth / 2);
            pdfDoc.text(text, centerPos, 10);
            const underlinePos = 11;
            pdfDoc.setLineWidth(0.5);
            pdfDoc.line(centerPos, underlinePos, centerPos + textWidth, underlinePos);
            const dateText = `Report Date: ${currentDate}`;
            pdfDoc.setFontSize(9);
            const dateTextWidth = pdfDoc.getStringUnitWidth(dateText) * 12 / pdfDoc.internal.scaleFactor;
            const datePos = pdfDoc.internal.pageSize.width - dateTextWidth - 10;
            pdfDoc.text(dateText, datePos, 10);
          }
        },
      };

      // Format debit and credit columns with comma separation and two decimal places
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > debitColumnIndex) {
          const debit = parseFloat(row[debitColumnIndex]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          row[debitColumnIndex] = debit;
        }
        if (row.length > creditColumnIndex) {
          const credit = parseFloat(row[creditColumnIndex]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          row[creditColumnIndex] = credit;
        }
      }

      pdfDoc.autoTable(options);
      pdfDoc.save('Report.pdf');
      this.loader.stop();
    }
  }

  downloadExcel() {
    if (this.gridApi) {
      this.loader.start();
      const rowData = this.gridApi.getRenderedNodes().map(node => node.data);
      const filteredData = rowData.map(row => ({
        branch: row.branch,
        branchName: row.branchName,
        tranType: row.tranType,
        tranDate: this.formatDate(row.tranDate), // Format date
        party: row.party,
        partyName: row.partyName,
        debit: this.formatNumber(row.debit), // Format debit
        credit: this.formatNumber(row.credit), // Format credit
        fromDate: this.formatDate(row.fromDate), // Format fromDate
        toDate: this.formatDate(row.toDate) // Format toDate
      }));

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      // Define column headers
      worksheet.columns = [
        { header: 'Branch', key: 'branch' },
        { header: 'Branch Name', key: 'branchName' },
        { header: 'Transaction Type', key: 'tranType' },
        { header: 'Transaction Date', key: 'tranDate' },
        { header: 'Party', key: 'party' },
        { header: 'Party Name', key: 'partyName' },
        { header: 'From Date', key: 'fromDate' },
        { header: 'To Date', key: 'toDate' },
        { header: 'Credit', key: 'credit' },
        { header: 'Debit', key: 'debit' }
      ];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (rowNumber === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFCC00' } // Set header background color to ash
            };
            cell.font = { bold: true }; // Make text bold
          }
          cell.value = String(cell.value).toUpperCase(); // Convert text to uppercase
        });
      });
      // Add data to the worksheet
      worksheet.addRows(filteredData);

      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell: any) => {
          const length = String(cell.value).length;
          if (length > maxLength) {
            maxLength = length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2; // Minimum width of 10
      });
      workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Report.xlsx'); // Use saveAs from file-saver
        this.loader.stop();
      });
    }

  }
  formatNumber(num: number): string {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: any): string {
    if (!date) return '';

    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  onRowSelected(event: any) {
    if (!this.reportForm.controls.summary.value) {
      this.displayMessage("", "");
      this.masterParams.tranNo = event.data.tranNo;
      this.masterParams.tranType = event.data.tranType;
      if (this.masterParams.tranNo.toUpperCase() != "CLOSING" && this.masterParams.tranNo.toUpperCase() != "OPENING") {
        if (this.masterParams.tranType.toUpperCase() != "SALE") {
          this.getReceiptDetails(this.masterParams);
        }
        else {
          this.getInvoiceData(this.masterParams);
        }
      }
    }
    else {
      this.displayMessage("Error: In summary don't have permissions to see details!", "red");
      return;
    }
  }
  currentState() {
    const currentState: ReportState = {
      reportType: this.reportForm.controls['reportType'].value,
      client: this.reportForm.controls['client'].value,
      clientType: this.reportForm.controls['clientType'].value,
      chargeType: this.reportForm.controls['chargeType'].value,
      fromDate: this.reportForm.controls['fromDate'].value,
      toDate: this.reportForm.controls['toDate'].value,
      summary: this.reportForm.controls['summary'].value,
      data: this.rowData,
      pagination: {
        pageIndex: 0, // Set to current page index
        pageSize: 25 // Set to current page size
      },
      creditAmount: this.creditAmount,
      debitAmount: this.debitAmount,
      balAmount: this.balAmount,
      landlordCode: this.landlordCode

    };
    this.store.dispatch(saveReportState({ state: currentState }));
  }
  onLnkClicked(event: any) {
    if (event.data.property != this.userDataService.userData.location  && event.data.tranType != "PAYMENT") {
      this.displayMessage("Error: This transcation in " + event.data.propertyName + " Change loaction to see details!", "red");
      return;
    }
    if (this.reportForm.controls['reportType'].value === "Statement") {
      this.currentState();
      if (event.data.tranNo.toUpperCase() != "CLOSING" && event.data.tranNo.toUpperCase() != "OPENING") {
        if (event.data.tranType.toUpperCase() === "SALE") {
          this.router.navigate(['property/invoice'], { state: { data: event.data } });
        }
        else if (event.data.tranType.toUpperCase() === "PAYMENT" || event.data.tranType.toUpperCase() === "RECEIPT") {
          this.router.navigate(['property/receipts-payments'], { state: { data: event.data } });
        }
        else if (event.data.tranType.toUpperCase() === "GRIEVANCE") {
          this.router.navigate(['property/grievance-service'], { state: { data: event.data } });
        }
      }
    }
    else {
      // if (event.data.tranNo.toUpperCase() != "CLOSING" && event.data.tranNo.toUpperCase() != "OPENING") {
      if (event.data.itemType.toUpperCase() === "RENT" || event.data.itemType.toUpperCase() === "GENC" || event.data.itemType.toUpperCase() === "SERVICE") {
        this.router.navigate(['property/invoice'], { state: { data: event.data } });
      }
      // }
    }

  }
  onPayment(event: any): void {
    const tranNo = event.data.tranNo?.toLowerCase();

    if (event.value === "Payment") {
      if (tranNo !== 'opening' && tranNo !== 'closing') {
        this.navigateToReceiptsPayments(event.data, 'Payment');
      }
    } else if (event.value === "Receipt") {
      if (tranNo !== 'opening' && tranNo !== 'closing') {
        this.navigateToReceiptsPayments(event.data, 'Receipt');
      }
    }
  }

  private navigateToReceiptsPayments(data: any, type: string): void {
    this.currentState();
    this.router.navigate(['property/receipts-payments'], { state: { data, type } });
  }
  onDtlClicked(event: any) {
    console.log(event.data);
    // console.log(this.userDataService.userData.location);
    if (event.data.property != this.userDataService.userData.location) {
      this.displayMessage("Error: This transcation in " + event.data.propertyName + " Change loaction to see details!", "red");
      return;
    }
    if (!this.reportForm.controls.summary.value) {
      this.displayMessage("", "");
      this.masterParams.tranNo = event.data.tranNo;
      this.masterParams.tranType = event.data.tranType;
      if (this.masterParams.tranNo.toUpperCase() != "CLOSING" && this.masterParams.tranNo.toUpperCase() != "OPENING") {
        if (this.masterParams.tranType.toUpperCase() != "SALE") {
          this.getReceiptDetails(this.masterParams);
        }
        else {
          this.getInvoiceData(this.masterParams);
        }
      }
    }
    else {
      this.displayMessage("Error: In summary don't have permissions to see details!", "red");
      return;
    }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  async getInvoiceData(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.subsink.sink = await this.saleService.getTenantInvoiceHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();

        if (res.status.toUpperCase() === "SUCCESS") {
          console.log(res.data);
          this.dialog.open(ReceiptDetailsDataComponent, {
            width: '75%',
            data: { data: res.data, name: "Invoice Details", type: "INVOICE" },
            disableClose: true
          });
        }
        else {
          this.loader.stop();
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  async getReceiptDetails(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.subsink.sink = await this.saleService.GetReceiptDetails(masterParams).subscribe((res: any) => {
        this.loader.stop()
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dialog.open(ReceiptDetailsDataComponent, {
            width: '75%',
            data: { data: res.data, name: "Receipt Details", type: this.masterParams.tranType, tranNo: res.data['receiptNo'] },
            disableClose: true
          });
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.loader.stop()
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  async onSubmit() {
    this.displayMessage("", "");
    this.custName = this.reportForm.get('client')?.value;
    this.fromDate = this.reportForm.get('fromDate')?.value;
    this.toDate = this.reportForm.get('toDate')?.value;
    this.rowData = '';
    if (this.userDataService.userData.userProfile.toUpperCase() === "TENANT" || this.userDataService.userData.userProfile.toUpperCase() === "LANDLORD") {
      const fromDate = this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
      const toDate = this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "";

      if (fromDate && toDate && fromDate > toDate) {
        this.displayMessage("Error: From date should be lessthan todate!", "red");
        return;
      }
      const body = {
        ...this.commonParams(),
        ReportType: this.reportForm.get('reportType')?.value || "",
        Branch: this.userDataService.userData.location,
        FromDate: this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "",
        ToDate: this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "",
        ClientType: this.userDataService.userData.userProfile || "",
        Client: this.userDataService.userData.userID || "",
        summary: this.reportForm.get('summary')?.value || false,
        item: this.reportForm.get('chargeType')?.value || "",
      }
      this.loader.start()
      if (this.reportForm.get('reportType')?.value != "CASHTRF") {
        this.subsink.sink = await this.utlService.GetReportStatement(body).subscribe((res: any) => {
          this.loader.stop();
          if (res && res.data && res.status.toUpperCase() === "SUCCESS") {

            this.rowData = this.processRowPostCreate(res['data']);
            for (const row of this.rowData) {
              const clientType = this.reportForm.get('clientType')?.value;

              if (clientType === "LANDLORD") {
                row.payment = "Payment";
              } else if (clientType === "TENANT") {
                row.payment = "Receipt";
              }
            }
            this.loanBalAmount = this.rowData[0].loanBalAmount;

            const lastRow = this.rowData[this.rowData.length - 1];
            if (lastRow.tranNo === "Closing") {
              lastRow.credit = this.creditAmount;
              lastRow.debit = this.debitAmount;
              lastRow.balance = this.balAmount;
            }


            this.displayMessage("Success: Statement retrived successfully", "green");
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
            this.rowData = [];
          }
        })
      }
    }
    else {
      if (this.reportForm.controls['reportType'].value.toUpperCase() === "DEPOSIT") {
        const depositBody = {
          ...this.commonParams(),
          DateAsOn: this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "",
          IsSummary: this.reportForm.get('summary')?.value || false,
          ClientType: 'TENANT'
        }
        try {
          this.loader.start();
          this.subsink.sink = await this.utlService.GetReportDeposit(depositBody).subscribe((res: any) => {
            this.loader.stop();
            this.loader.stop();
            if (res && res.data && res.status.toUpperCase() === "SUCCESS") {

              this.rowData = this.processRowPostCreate(res['data']);
              for (const row of this.rowData) {
                row.balDepAmount = row.unitDepositAmount - row.tenantAmount;
                //   const clientType = this.reportForm.get('clientType')?.value;
                //   if (clientType === "TENANT") {
                //     row.payment = "Receipt";
                //   }
              }

              // const lastRow = this.rowData[this.rowData.length - 1];
              // if (lastRow.tranNo === "Closing") {
              //   lastRow.credit = this.creditAmount;
              //   lastRow.debit = this.debitAmount;
              //   lastRow.balance = this.balAmount;
              //}

              // console.log(this.rowData)
              this.displayMessage("Success: Statement retrived successfully", "green");
            }
            else {
              this.displayMessage("Error: " + res.message, "red");
              this.rowData = [];
            }
          })
        }
        catch (ex: any) {
          this.displayMessage("Exception: " + ex.message, "red");
        }
      }
      else if (this.reportForm.controls['reportType'].value.toUpperCase() === "LOANSTATEMENT") {
        const loanbody = {
          ...this.commonParams(),
          Client: this.landlordCode,
        }
        try {
          this.loader.start();
          this.subsink.sink = await this.saleService.GetLoanBalances(loanbody).subscribe((res: any) => {
            this.loader.stop();
            if (res && res.data && res.status.toUpperCase() === "SUCCESS") {

              this.rowData = res.data;
              let loanAmtExisting = 0;
              let currentpaid: number = 0;
              let currentBal: number = 0;
              for (const row of this.rowData) {
                if (row.loanAmount > 0) {
                  currentBal += row.loanAmount;
                }
                currentpaid = row.paidAmount;
                row.balLoanAmt = currentBal - currentpaid;
                currentBal = currentBal - currentpaid;
              }
              this.rowData = this.processRowPostCreate(res['data']);

            }
            else {
              this.displayMessage("Error: " + res.message, "red");
              this.rowData = [];

            }
          })
        }
        catch (ex: any) {
          this.displayMessage("Exception: " + ex.message, "red");
        }

      }
      else if (this.reportForm.valid && this.reportForm.get('reportType')?.value == "Statement") {

        if (this.reportForm.get('reportType')?.value == "Statement") {
          if (this.landlordCode === "" || this.landlordCode === null || this.landlordCode === undefined) {
            this.displayMessage("Error: Select valid Client!", "red");
            return;
          }
        }
        const fromDate = this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
        const toDate = this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "";

        if (fromDate && toDate && fromDate > toDate) {
          this.displayMessage("Error: From date should be lessthan todate!", "red");
          return;
        }
        const body = {
          ...this.commonParams(),
          ReportType: this.reportForm.get('reportType')?.value || "",
          Branch: this.userDataService.userData.location,
          FromDate: this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "",
          ToDate: this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "",
          ClientType: this.reportForm.get('clientType')?.value || "",
          Client: this.landlordCode || "",
          summary: this.reportForm.get('summary')?.value || false,
          item: this.reportForm.get('chargeType')?.value || "",
        }
        this.loader.start()
        if (this.reportForm.get('reportType')?.value != "CASHTRF") {
          this.subsink.sink = await this.utlService.GetReportStatement(body).subscribe((res: any) => {
            this.loader.stop();
            if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
              this.rowData = this.processRowPostCreate(res['data']);
              for (const row of this.rowData) {
                const clientType = this.reportForm.get('clientType')?.value;

                if (clientType === "LANDLORD") {
                  row.payment = "Payment";
                } else if (clientType === "TENANT") {
                  row.payment = "Receipt";
                }
              }
              this.loanBalAmount = this.rowData[0].loanBalAmount;

              const lastRow = this.rowData[this.rowData.length - 1];
              if (lastRow.tranNo === "Closing") {
                lastRow.credit = this.creditAmount;
                lastRow.debit = this.debitAmount;
                lastRow.balance = this.balAmount;
              }


              this.displayMessage("Success: Statement retrived successfully", "green");
            }
            else {
              this.displayMessage("Error: " + res.message, "red");
              this.rowData = [];
            }
          })
        }
        else {
          // try{
          //   this.subsink.sink =this.utlService.GetReportCashflowStatement(body).subscribe((res: any) => {
          //     // console.log(res);
          //     if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          //       this.rowData = this.processRowPostCreate(res['data']);
          //       this.displayMessage("Success: Statement retrived successfully", "green");
          //     }
          //     else {
          //       this.displayMessage("Error: " + res.message, "red");
          //     }
          //   });
          // }
          // catch(ex:any){
          //   this.displayMessage("Exception: "+ex.message,"red");
          // }
        }

      }
      else if (this.reportForm.get('reportType')?.value == "CASHTRF") {
        if (this.reportForm.get('reportType')?.value == "Statement") {
          if (this.landlordCode === "" || this.landlordCode === null || this.landlordCode === undefined) {
            this.displayMessage("Error: Select valid Client!", "red");
            return;
          }
        }
        const fromDate = this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
        const toDate = this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "";

        if (fromDate && toDate && fromDate > toDate) {
          this.displayMessage("Error: From date should be lessthan todate!", "red");
          return;
        }
        const body = {
          ...this.commonParams(),
          ReportType: this.reportForm.get('reportType')?.value || "",
          Branch: this.userDataService.userData.location,
          FromDate: this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "",
          ToDate: this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "",
          ClientType: this.reportForm.get('clientType')?.value || "",
          Client: this.landlordCode || "",
          summary: this.reportForm.get('summary')?.value || false,
          item: this.reportForm.get('chargeType')?.value || "",
        }
        this.subsink.sink = await this.utlService.GetReportCashflowStatement(body).subscribe((res: any) => {
          this.loader.stop();
          if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
            this.rowData = this.processRowPostCreate(res['data']);
            for (const row of this.rowData) {
              const clientType = this.reportForm.get('clientType')?.value;

              if (clientType === "LANDLORD") {
                row.payment = "Payment";
              } else if (clientType === "TENANT") {
                row.payment = "Receipt";
              }
            }
            this.loanBalAmount = this.rowData[0].loanBalAmount;

            const lastRow = this.rowData[this.rowData.length - 1];
            if (lastRow.tranNo === "Closing") {
              lastRow.credit = this.creditAmount;
              lastRow.debit = this.debitAmount;
              lastRow.balance = this.balAmount;
            }


            this.displayMessage("Success: Statement retrived successfully", "green");
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
            this.rowData = [];
          }
        })
      }
      // else if(this.reportForm.valid && this.reportForm.get('reportType')?.value == "CASHTRF"){
      //   if (this.reportForm.get('reportType')?.value == "Statement") {
      //     if (this.landlordCode === "" || this.landlordCode === null || this.landlordCode === undefined) {
      //       this.displayMessage("Error: Select valid Client!", "red");
      //       return;
      //     }
      //   }
      //   const fromDate = this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
      //   const toDate = this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "";

      //   if (fromDate && toDate && fromDate > toDate) {
      //     this.displayMessage("Error: From date should be lessthan todate!", "red");
      //     return;
      //   }
      //   const body = {
      //     ...this.commonParams(),
      //     ReportType: this.reportForm.get('reportType')?.value || "",
      //     Branch: this.userDataService.userData.location,
      //     FromDate: this.datepipe.transform(this.reportForm.get('fromDate')?.value, "yyyy-MM-dd") || "",
      //     ToDate: this.datepipe.transform(this.reportForm.get('toDate')?.value, "yyyy-MM-dd") || "",
      //     ClientType: this.reportForm.get('clientType')?.value || "",
      //     Client: this.landlordCode || "",
      //     summary: this.reportForm.get('summary')?.value || false,
      //     item: this.reportForm.get('chargeType')?.value || "",
      //   }
      //   try{
      //     this.subsink.sink =this.utlService.GetReportCashflowStatement(body).subscribe((res: any) => {
      //       // console.log(res);
      //       if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
      //         this.rowData = this.processRowPostCreate(res['data']);
      //         this.displayMessage("Success: Statement retrived successfully", "green");
      //       }
      //       else {
      //         this.displayMessage("Error: " + res.message, "red");
      //       }
      //     });
      //   }
      //   catch(ex:any){
      //     this.displayMessage("Exception: "+ex.message,"red");
      //   }

      // }
      else {
        return;
      }
    }

  }
  formatDated(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  processRowPostCreate(rowData: any[]) {
    if (this.reportForm.controls['reportType']!.value.toUpperCase() === 'DEPOSIT') {
      let totDep = 0;
      let paidDep = 0;
      let balDep = 0;
      let landdep = 0;
      let propdep = 0;
      const processedData = rowData.map(row => {
        if (this.reportForm.get('PropertyHoldings')!.value) {
          propdep += row.propertyAmount;
        }
        if (this.reportForm.get('LandLordHoldings')!.value) {
          landdep += row.landlordAmount;
        }
        totDep += row.unitDepositAmount;
        paidDep += row.tenantAmount;
        return {
          ...row,
          totDep,
          paidDep,
          balDep,
          landdep,
          propdep
        }

      });
      balDep = totDep - paidDep;
      this.totalDepositAmt = totDep;
      this.totalDepositBal = balDep;
      this.totalDepositPaid = paidDep;
      this.totalProperty = propdep;
      this.totalLandLord = landdep;
      processedData.push({
        tenantName: 'Total',  // Displaying 'Total' in the date column
        unitDepositAmount: totDep,
        tenantAmount: paidDep,
        balAmountField: balDep,
        landlordAmount: landdep,
        propertyAmount: propdep,

        // detail: 'Summary'
      });

      return processedData;
    }
    else if (this.reportForm.controls['reportType']!.value.toUpperCase() === 'LOANSTATEMENT') {
      let totPaid = 0;
      let totLoan = 0;
      let totBal = 0;
      const processedData = rowData.map(row => {
        totPaid += row.paidAmount;
        totLoan += row.loanAmount;
        totBal = row.balLoanAmt;
        return {
          ...row,
          totPaid,
          totLoan,
          totBal,
        };
      });
      processedData.push({
        slNo: "Total",
        paidAmount: totPaid,
        loanAmount: totLoan,
        balLoanAmt: totBal,
      });
      this.totLoanAmt = totLoan
      this.totLoanBal = totBal
      this.totLoanPaid = totPaid
      return processedData;
    }
    else if (this.reportForm.get('reportType')!.value === 'Statement' && !this.reportForm.get('summary')!.value) {
      let balance = 0;
      let totalDebit = 0;
      let totalCredit = 0;
      rowData.sort((a, b) => new Date(a.tranDate).getTime() - new Date(b.tranDate).getTime());
      const processedData = rowData.map(row => {
        let credit = 0;
        let debit = 0;
        if (this.reportForm.get('clientType')!.value.toUpperCase() === 'TENANT') {
          if (row.amount > 0 && (row.tranNo.toUpperCase() != "CLOSING" && row.tranNo.toUpperCase() != "OPENING" && row.tranType.toUpperCase() == "SALE"  || row.tranType.toUpperCase() == "OPENING" )) {
            credit = row.amount; // Positive amounts are now considered as credit
            balance += credit;
            totalCredit += credit;
          }
           else if (row.amount < 0 && (row.tranNo.toUpperCase() != "CLOSING" && row.tranNo.toUpperCase() != "OPENING" && row.tranType.toUpperCase() == "RECEIPT" || row.tranType.toUpperCase() == "OPENING")) {
            debit = -row.amount; // Negative amounts are now considered as debit
            balance -= debit; // Subtract debit from balance
            totalDebit += debit;
          }
          return {
            ...row,
            credit,
            debit,
            balance,
            detail: 'Details'
          };

        }
        else if(this.reportForm.get('clientType')!.value.toUpperCase() === 'STAFF') {
          if (row.amount < 0 && (row.tranNo.toUpperCase() == "CLOSING" && row.tranNo.toUpperCase() != "OPENING" && row.tranType.toUpperCase() == "PAYMENT"  || row.tranType.toUpperCase() == "OPENING" )) {
             debit = row.amount; // Positive amounts are now considered as credit
            balance += debit;
            totalDebit += debit;
          }
           else if (row.amount > 0 && (row.tranNo.toUpperCase() != "CLOSING" && row.tranNo.toUpperCase() == "OPENING" && row.tranType.toUpperCase() == "RECEIPT" || row.tranType.toUpperCase() == "OPENING")) {
            credit = -row.amount; // Negative amounts are now considered as debit
            balance -= credit; // Subtract debit from balance
             totalCredit += credit;
          }

          return {
            ...row,
            credit,
            debit,
            balance,
            detail: 'Details'
          };

        }
        else {
          if (row.amount > 0 && (row.tranNo.toUpperCase() != "CLOSING" && row.tranNo.toUpperCase() != "OPENING")) {
            debit = -row.amount;
            balance += debit;
            totalDebit += debit;
          } else if (row.amount < 0 && (row.tranNo.toUpperCase() != "CLOSING" && row.tranNo.toUpperCase() != "OPENING")) {
            credit = Math.abs(row.amount);
            balance += credit;
            totalCredit += credit;
          }
          return {
            ...row,
            credit,
            debit,
            balance,
            detail: 'Details'
          };
        }

      });
      processedData.push({
        partyName: 'Total',  // Displaying 'Total' in the date column
        credit: totalCredit,
        debit: totalDebit,
        balance: balance,
        // detail: 'Summary'
      });

      this.debitAmount = totalDebit;
      this.creditAmount = totalCredit;
      this.balAmount = balance;
      this.getTotalRow();
      return processedData;
    }
    else {
      this.totals = "";
      // let total = 0;
      let credit = 0;
      let debit = 0;
      rowData.sort((a, b) => new Date(a.tranDate).getTime() - new Date(b.tranDate).getTime());
      const processedData = rowData.map(row => {
        if (row.amount > 0) {
          credit += row.amount;
        }
        if (row.amount < 0) {
          debit += row.amount;
        }
        return {
          ...row
        };
      });
      this.creditAmount = credit;
      this.debitAmount = debit;
      // console.log(this.totalAmount);
      this.getTotalRevenue();
      return processedData
    }

  }
  // Inside your component class
  shouldShowSummaryCheckbox(): boolean {
    const reportType = this.reportForm.get('reportType')!.value;
    const clientType = this.reportForm.get('clientType')!.value;

    return reportType !== 'Revenue' && reportType !== 'CASHTRF' && reportType !== '' && reportType !== 'PROPERTY' && reportType === 'Statement';
  }

  shouldShowLandLordHoldingsCheckbox(): boolean {
    const reportType = this.reportForm.get('reportType')!.value;
    return reportType === 'DEPOSIT';
  }

  isLandLordHoldingsDisabled(): boolean {
    const reportType = this.reportForm.get('reportType')!.value;
    return reportType !== 'DEPOSIT';
  }

  shouldShowPropertyHoldingsCheckbox(): boolean {
    const reportType = this.reportForm.get('reportType')!.value;
    const clientType = this.reportForm.get('clientType')!.value;

    return reportType === 'DEPOSIT';
  }

  isPropertyHoldingsDisabled(): boolean {
    const clientType = this.reportForm.get('clientType')!.value;
    return clientType === 'DEPOSIT';
  }

  formInit() {
    const form = this.fb.group({
      reportType: ['Statement', Validators.required],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), [Validators.required]],
      toDate: [new Date(), Validators.required],
      client: ['', Validators.required],
      chargeType: [{ value: "", disabled: true }],
      summary: [false],
      clientType: [''],
      LandLordHoldings: [false],
      PropertyHoldings: [false],
    });
    this.setupConditionalValidators(form);

    return form;
  }
  setupConditionalValidators(form: FormGroup) {
    const reportTypeControl = form.get('reportType');
    const chargeTypeControl = form.get('chargeType');

    reportTypeControl?.valueChanges.subscribe(reportType => {
      if (reportType.toUpperCase() === 'REVENUE') {
        chargeTypeControl?.enable();
        chargeTypeControl?.setValidators([Validators.required]);
      } else {
        chargeTypeControl?.disable();
        chargeTypeControl?.clearValidators();
      }
      chargeTypeControl?.updateValueAndValidity();
    });
  }

  Clear() {
    this.reportForm = this.formInit();
    this.setColumnDefs();
    this.displayMessage("", "");
    this.landlordCode = "";
    this.rowData = [];
    this.refreshData();
    this.store.dispatch(clearReportState());
    this.totalAmount = 0;
    this.creditAmount = 0;
    this.balAmount = 0;
    this.totalDepositAmt = 0;
    this.totalDepositBal = 0;
    this.totalDepositPaid = 0;
    this.totalLandLord = 0;
    this.totalProperty = 0;
    this.totLoanAmt = 0;
    this.totLoanBal = 0;
    this.totLoanPaid = 0;
    this.custName = "";
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  async onClientSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CLIENT",
      item: this.reportForm.controls['client'].value || "",
      ItemSecondLevel: ""
    }
    try {
      this.subsink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
          if (res && res.data && res.data.nameCount === 1) {
            this.reportForm.controls['client'].patchValue(res.data.selName);
            this.landlordCode = res.data.selCode;
            this.custName = res.data.selName;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.reportForm.controls['client'].value,
                  'PartyType': this.reportForm.controls['clientType'].value,
                  'search': 'Client Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.reportForm.controls['client'].patchValue(result.partyName);
                  this.landlordCode = result.code;
                  this.custName = result.partyName;
                }

                this.dialogOpen = false;
              });
            }

          }
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

}
