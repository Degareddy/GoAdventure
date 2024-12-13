import { Component, Input, OnDestroy, OnInit, SimpleChange } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { forkJoin, Subscription } from 'rxjs';
import { ColumnApi, GridApi, GridOptions, RowClassParams } from 'ag-grid-community';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { TenantSearchComponent } from '../receipts/tenant-search/tenant-search.component';
import { DatePipe } from '@angular/common';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { Store } from '@ngrx/store';
import { clearSaleReportState, loadSaleReportState, saveSaleReportState } from 'src/app/utils/location.actions';
import { selectSaleReportData } from 'src/app/utils/location.selectors';
import { SaleReportState } from 'src/app/utils/location.reducer';
import { NavigationService } from 'src/app/Services/navigation.service';

@Component({
  selector: 'app-sales-reports',
  templateUrl: './sales-reports.component.html',
  styleUrls: ['./sales-reports.component.css']
})
export class SalesReportsComponent implements OnInit, OnDestroy {
  saleReportForm!: FormGroup;
  properytList: Item[] = [];
  blocksList: Item[] = [];
  flatsList: Item[] = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  private subSink: SubSink;
  rowData: any = [];
  gridData: any = [];
  balanceTmp: boolean = false;
  loanToal:boolean=false;
  public themeClass: string =
    "ag-theme-quartz";
  public totalAmount = 0;
  public balanceAmount = 0;
  public diffAmount = 0;
  public totalLoanAmt=0;
  private subscriptions: Subscription = new Subscription();
  clientTypes: Item[] = [
    { itemCode: 'LANDLORD', itemName: 'Landlord' },
    { itemCode: 'MANAGEMENT', itemName: 'Management' },
    { itemCode: 'PROPERTY', itemName: 'Property' },
    { itemCode: 'TENANT', itemName: 'Tenant' }

  ];
  columnDefs: any = [
    // { field: "propertyName", headerName: "Property Name", flex: 1, resizable: true, sortable: true, filter: true, },
    // { field: "unit", headerName: "Unit Name", sortable: true, filter: true, resizable: true, flex: 1 },
    // { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, flex: 1 },
    // {
    //   field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
    //     // Format date as dd-MM-yyyy
    //     if (params.value) {
    //       const date = new Date(params.value);
    //       const day = date.getDate().toString().padStart(2, '0');
    //       const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //       const year = date.getFullYear();
    //       return `${day}-${month}-${year}`;
    //     }
    //     return null;
    //   },
    // },
    // { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, flex: 1 },
    // {
    //   field: "balAmount",
    //   headerName: "Balance Amount",
    //   sortable: true,
    //   resizable: true,
    //   flex: 1,
    //   filter: 'agNumberColumnFilter',
    //   type: 'rightAligned',
    //   cellRenderer: 'agDtlRenderer',  // Uses the custom renderer
    //   cellStyle: { justifyContent: "flex-end" }  // Right-align the cell content
    // },
    // { field: "receipt", headerName: "Receipt / Payment", sortable: true, filter: true, resizable: true, flex: 1, cellRenderer: 'agLnkRenderer' },
  ];

  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  reoprttList: Item[] = [
    { itemCode: 'Unit Status', itemName: 'Unit Status' },
    { itemCode: 'Technician History', itemName: 'Technician History' }
  ];
  statusList: Item[] = [
    { itemCode: 'Allocated', itemName: 'Allocated' },
    { itemCode: 'Vacant', itemName: 'Vacant' },
    { itemCode: 'Occupied', itemName: 'Occupied' },
    { itemCode: 'Repair', itemName: 'Repair' },
    { itemCode: 'Renovate', itemName: 'Renovate' }
  ];
  @Input() max: any;
  today = new Date();
  dialogOpen: any;
  custCode: string = "";
  totals: string = "";
  totalLoan:string=""

  constructor(private fb: FormBuilder, private datepipe: DatePipe,
    private masterService: MastersService, protected router: Router,
    private projectService: ProjectsService, private store: Store,
    private utlService: UtilitiesService, private userDataService: UserDataService,
    public dialog: MatDialog, private navigationService: NavigationService,
    private loader: NgxUiLoaderService) {
    this.saleReportForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.gridOptions = {
      rowSelection: 'single',
      getRowStyle: this.getRowStyle.bind(this)
    };
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
    this.subscriptions.unsubscribe();
  }
  getRowStyle(params: RowClassParams): any {
    if (params.node.isSelected()) {
      return { background: '#50e88f' };
    }
    return null;
  }
  getTotalLoan(){
    if (!this.loanToal) {
      this.totalLoan = "Total Loan Amount: "+this.totalLoanAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    else {
      this.totalLoan = "";
    }
  }
  getTotal() {
    if (!this.balanceTmp) {
      this.totals = "Negetive Amount: " + this.balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "  Positive Amount: "
        + this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "  Net Amount: " +
        this.diffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +"Total Loan Amount: "+this.totalLoanAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    else {
      this.totals = "";
    }
  }
  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    if (field.toUpperCase() === 'BALAMOUNT') {
      this.balanceTmp = hide;
    }
    this.getTotal();
    if (field === 'loanBalAmount') {
      this.loanToal = hide;
    }
    this.getTotalLoan();
  }

  onClearClick() {
    this.saleReportForm.get('customer')!.setValue('');
    this.custCode = "";
  }
  onDtlClicked(event: any) {
    console.log(event.data);
    if (event.data.tranNo) {
      // if (event.data.tranType.toUpperCase() === "SALE") {
      this.router.navigate(['property/invoice'], { state: { data: event.data } });
      // }
    }

  }
  ngOnInit() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.refreshData();
    this.subscriptions.add(
      this.store.select(selectSaleReportData).subscribe((state: SaleReportState) => {
        if (state) {
          this.saleReportForm.patchValue({
            PropCode: state.PropCode,
            BlockCode: state.BlockCode,
            UnitID: state.UnitID,
            FromDate: state.FromDate,
          });
          this.rowData = state.data;
          // return;
        }
      })
    )
    const previousUrl = this.navigationService.getPreviousUrl();
    if (previousUrl === '/property/receipts-payments') {
      this.store.dispatch(loadSaleReportState());
    } else {
      this.store.dispatch(clearSaleReportState());
    }
  }
setColumnDefs()
{
  if(this.saleReportForm.controls.isSummary.value){
    this.columnDefs = [
      // { field: "propertyName", headerName: "Property Name", flex: 1, resizable: true, sortable: true, filter: true, },
      // { field: "unit", headerName: "Unit Name", sortable: true, filter: true, resizable: true, flex: 1 },
      // { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, flex: 1 },
      // {
      //   field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
      //     // Format date as dd-MM-yyyy
      //     if (params.value) {
      //       const date = new Date(params.value);
      //       const day = date.getDate().toString().padStart(2, '0');
      //       const month = (date.getMonth() + 1).toString().padStart(2, '0');
      //       const year = date.getFullYear();
      //       return `${day}-${month}-${year}`;
      //     }
      //     return null;
      //   },
      // },
      { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, flex: 1 },
      // {
      //   field: "loanBalAmount",
      //   headerName: "Loan Balance",
      //   sortable: true,
      //   resizable: true,
      //   flex: 1,
      //   filter: 'agNumberColumnFilter',
      //   type: 'rightAligned',
      //     // Uses the custom renderer
      //   cellStyle: { justifyContent: "flex-end" }  // Right-align the cell content
      // },
      // {
      //   field: "loanCurrency",
      //   headerName: "Loan Currency",
      //   sortable: true,
      //   resizable: true,
      //   flex: 1,
      //   filter: 'agNumberColumnFilter',
      //   type: 'rightAligned', // Uses the custom renderer
      //   cellStyle: { justifyContent: "flex-end" }  // Right-align the cell content
      // },
      
    
      {
        headerName: "Loan Balance",
        field: "loanBalAmount",
        sortable: true,
        resizable: true,
        flex: 1,
        filter: 'agNumberColumnFilter',
        type: 'rightAligned',
        cellStyle: (params: { value: number }) => {
          if (params.value < 0) {
              return { justifyContent: "flex-end", color: "red" };
          }
          return { justifyContent: "flex-end", color: "green" };
      },
        valueFormatter: (params: { data: { loanBalAmount: any; loanCurrency: any; }; }) => {
            const loanBalance = params.data.loanBalAmount;
            const currency = params.data.loanCurrency;
            if (loanBalance !== undefined && currency) {
                // Check if loan balance is negative
                const formattedBalance = loanBalance < 0 
                    ? `(${Math.abs(loanBalance).toLocaleString()})` 
                    : loanBalance.toLocaleString();
    
                // Format loan balance with commas and append the currency
                if (currency.toUpperCase() === "USD") {
                    return `$ ${formattedBalance}`;
                } else if (currency.toUpperCase() === "KES") {
                    return `Ksh ${formattedBalance}`;
                }
            }
            return '';
        },
        valueGetter: (params: { data: { loanBalAmount: any; loanCurrency: any; }; }) => {
          const loanBalance = params.data.loanBalAmount;
          const currency = params.data.loanCurrency;
          
          // Ensure loanBalance is a valid number
          if (loanBalance !== undefined && !isNaN(loanBalance) && currency) {
              const formattedBalance = loanBalance < 0
                  ? `(${Math.abs(loanBalance).toLocaleString()})`
                  : loanBalance.toLocaleString();
  
              // Format loan balance with currency
              if (currency.toUpperCase() === "USD") {
                  return `$ ${formattedBalance}`;
              } else if (currency.toUpperCase() === "KES") {
                  return `Ksh ${formattedBalance}`;
              }
          }
          return ''; // Return empty string if data is missing or invalid
      }
    },
    {
        field: "balAmount",
        headerName: "Balance Amount",
        sortable: true,
        resizable: true,
        flex: 1,
        filter: 'agNumberColumnFilter',
        type: 'rightAligned',
        // cellRenderer: 'agDtlRenderer',  // Uses the custom renderer
        // cellStyle: { justifyContent: "flex-end" },
        cellStyle: (params: { value: number }) => {
          if (params.value < 0) {
              return { justifyContent: "flex-end", color: "red" };
          }
          return { justifyContent: "flex-end", color: "green" };
      },
        valueFormatter: (params: { data: { balAmount: any; currency: any; }; }) => {
            const balAmount = params.data.balAmount;
            const balcurrency = params.data.currency;
            if (balAmount !== undefined ) {
                // Check if balance amount is negative
                const formattedBalance = balAmount < 0 
                    ? `(${(Math.abs(balAmount)).toLocaleString()})` 
                    : balAmount.toLocaleString();
    
                // Format balance amount with commas and append the currency
                if (balcurrency.toUpperCase() === "USD") {
                    return `$ ${formattedBalance}`;
                } else if (balcurrency.toUpperCase() === "KES") {
                    return `Ksh ${formattedBalance}`;
                }
                else if (balcurrency.toUpperCase() === ""){
                  return `Ksh ${formattedBalance}`;
                }
            }
            return '';
        },
        valueGetter: (params: { data: { balAmount: any; currency: any; }; }) => {
          const balAmount = params.data.balAmount;
          const balcurrency = params.data.currency;
          
          // Ensure balAmount is a valid number
          if (balAmount !== undefined ) {
              const formattedBalance = balAmount < 0
                  ? `(${Math.abs(balAmount).toLocaleString()})`  // Wrap negative balance in parentheses
                  : balAmount.toLocaleString();
  
              // Format balance amount with currency
              if (balcurrency.toUpperCase() === "USD") {
                  return `$ ${formattedBalance}`;  // Format for USD
              } else if (balcurrency.toUpperCase() === "KES") {
                  return `Ksh ${formattedBalance}`;  // Format for KES
              } else if (balcurrency.toUpperCase() === "") {
                  return `Ksh ${formattedBalance}`;  // Default format for empty currency
              }
          }
          return '';  // Return empty string if data is invalid
      }
    },
    
      // {
      //   field: "currency",
      //   headerName: "Balance Currency",
      //   sortable: true,
      //   resizable: true,
      //   flex: 1,
      //   filter: 'agNumberColumnFilter',
      //   type: 'rightAligned', // Uses the custom renderer
      //   cellStyle: { justifyContent: "flex-end" }  // Right-align the cell content
      // },
      { field: "receipt", headerName: "Receipt / Payment", sortable: true, filter: true, resizable: true, flex: 1, cellRenderer: 'agLnkRenderer' },
    ];
  }
  else{
    this.columnDefs = [
      { field: "propertyName", headerName: "Property Name", flex: 1, resizable: true, sortable: true, filter: true, },
      { field: "unit", headerName: "Unit Name", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, flex: 1 },
      {
        field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
      { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, flex: 1 },
      {
        field: "balAmount",
        headerName: "Balance Amount",
        sortable: true,
        resizable: true,
        flex: 1,
        filter: 'agNumberColumnFilter',
        type: 'rightAligned',
        cellRenderer: 'agDtlRenderer',  // Uses the custom renderer
        cellStyle: { justifyContent: "flex-end" }  // Right-align the cell content
      },
      { field: "receipt", headerName: "Receipt / Payment", sortable: true, filter: true, resizable: true, flex: 1, cellRenderer: 'agLnkRenderer' },
    ];

  }
}
refreshData() {
    this.saleReportForm.valueChanges.subscribe((changes: SimpleChange) => {
      if (changes) {
        if (this.rowData && this.textMessageClass && this.retMessage) {
          this.gridData = [];
          this.rowData = [];
          this.displayMessage("", "");
          this.totalAmount = 0;
          this.balanceAmount = 0;
          this.diffAmount = 0;
          this.totalLoanAmt=0;
        }
      }
    });

  }
  formInit() {
    return this.fb.group({
      PropCode: ['All', [Validators.required]],
      BlockCode: ['All', [Validators.required]],
      UnitID: ['All', [Validators.required]],
      FromDate: [new Date()],
      clientType: ['', [Validators.required]],
      isSummary: [true]
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onLnkClicked(event: any) {
    console.log(event);
    if (this.userDataService.userData.location.toUpperCase()) {
      const message = `You are about to process a ${event.data.receipt.toLowerCase()} for <b>${event.data.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
      for the unit <b>${event.data.unitName}</b> on behalf of <b>${event.data.clientName}</b>.
     Please confirm if you would like to proceed.`;
      const dialogData = new ConfirmDialogModel(`${event.data.receipt} Confirmation?`, message);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: "400px",
        height: '210px',
        data: dialogData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult != true && dialogResult === "YES") {
          const currentState: SaleReportState = {
            PropCode: this.saleReportForm.controls.PropCode.value,
            BlockCode: this.saleReportForm.controls.BlockCode.value,
            UnitID: this.saleReportForm.controls.UnitID.value,
            FromDate: this.saleReportForm.controls.FromDate.value,
            data: this.rowData,
            pagination: {
              pageIndex: 0,
              pageSize: 25
            }

          };
          this.store.dispatch(saveSaleReportState({ state: currentState }));
          this.router.navigate(['property/receipts-payments'], { state: { data: event.data } });
        }
        else {
          return;
        }
      });
    }
    else {
      const message = `You are currently in <b>${this.userDataService.userData.defaultLocnName}</b>. Access to raise a ${event.data.receipt.toLowerCase()} for <b>${event.data.propertyName}</b> is not permitted.`;
      const dialogData = new ConfirmDialogModel("Info!", message);
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: "400px",
        height: '210px',
        data: dialogData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe(dialogResult => {

      })
    }

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async loadData() {
    const propertybody = {
      ...this.commonParams(),
      item: 'USERPROPS'
    };
    const property$ = this.masterService.GetMasterItemsList(propertybody);
    this.subSink.sink =await forkJoin([property$]).subscribe(
      ([propRes]: any) => {
        this.loader.stop();
        this.properytList = propRes['data'];
        if (this.properytList.length === 1) {
          this.saleReportForm.get('PropCode')?.patchValue(this.properytList[0].itemCode);
          this.onSelectedPropertyChanged();
        }
      },
      error => {
        this.displayMessage("Error: " + error.message, "red");
      }
    );
  }
 async onSelectedPropertyChanged() {
    this.displayMessage("","");
    // this.blocksList = [];
    // this.flatsList = [];
    // this.rowData = [];
    this.masterParams.type = 'REPPROPBLOCKS';
    this.masterParams.item = this.saleReportForm.controls['PropCode'].value;
    if (this.masterParams.item != 'All') {
      this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result && result.data && result.status.toUpperCase() === "SUCCESS") {
          this.blocksList = result['data'];
          if (this.blocksList.length === 1) {
            this.saleReportForm.get('BlockCode')?.patchValue(this.blocksList[0].itemCode);
            this.onSelectedBlockChanged();
          }
        }
        else {
          this.displayMessage("Error: " + result.message, "red");

        }
      });
    }
    else {
      this.saleReportForm.get('BlockCode')?.patchValue("All");
      this.saleReportForm.controls['UnitID'].patchValue("All");
    }
  }

  // downloadPDF() {
  //   this.loader.start();
  //   let name: string = "Client Balances";

  //   const params = {
  //     orientation: 'landscape' as const,
  //   };
  //   const pdfDoc: any = new jsPDF(params);
  //   const content: any = this.gridApi.getDataAsCsv();
  //   const contentWithoutQuotes = content.replace(/"/g, '');
  //   const rows = contentWithoutQuotes.split('\n').map((row: any) => row.split(','));
  //   const columns = rows.shift() || [];
  //   const dateColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('date'));
  //   const balanceAmountColumnIndex = columns.findIndex((column: any) => column.toLowerCase().includes('balance'));

  //   if (dateColumnIndex !== -1) {
  //     for (let i = 0; i < rows.length; i++) {
  //       const row = rows[i];
  //       const dateValue = row[dateColumnIndex];
  //       if (dateValue) {
  //         // Parse the date with the specified format
  //         const formattedDate = moment(dateValue, 'DD-MM-YYYY').format('DD-MM-YYYY');
  //         // Update the date value in the row
  //         row[dateColumnIndex] = formattedDate;
  //       }
  //     }
  //   }
  //   if (content) {
  //     const currentDate = moment().format('DD-MM-YYYY'); // Format current date
  //     const options = {
  //       startY: 15, // Adjust startY to add space after the header
  //       head: [columns],
  //       body: rows,
  //       styles: {
  //         fontSize: 8, // Set the desired font size
  //         maxCellHeight: 3, // Set the desired row height
  //       },
  //       didDrawCell: (data: any) => {
  //         if (data.column.index === balanceAmountColumnIndex && data.row.index > 0) { // Exclude header row
  //           const cellValue = parseFloat(data.cell.value);
  //           if (cellValue < 0) {
  //             pdfDoc.setTextColor(255, 0, 0); // Set text color to red
  //           } else {
  //             pdfDoc.setTextColor(0, 0, 0); // Reset text color to black
  //           }
  //         }
  //       },
  //       didDrawPage: (data: any) => {
  //         // Decrease header height
  //         if (data.pageNumber === 1) {
  //           const text = name;
  //           const textFontSize = 11; // Set the desired font size for the text
  //           pdfDoc.setFontSize(textFontSize);
  //           const textWidth = pdfDoc.getStringUnitWidth(text) * 12 / pdfDoc.internal.scaleFactor;
  //           const centerPos = (pdfDoc.internal.pageSize.width / 2) - (textWidth / 2);
  //           pdfDoc.text(text, centerPos, 10);
  //           const underlinePos = 11;
  //           pdfDoc.setLineWidth(0.5);
  //           pdfDoc.line(centerPos, underlinePos, centerPos + textWidth, underlinePos);
  //           const dateText = `Report Date: ${currentDate}`;
  //           pdfDoc.setFontSize(9);
  //           const dateTextWidth = pdfDoc.getStringUnitWidth(dateText) * 12 / pdfDoc.internal.scaleFactor;
  //           const datePos = pdfDoc.internal.pageSize.width - dateTextWidth - 10;
  //           pdfDoc.text(dateText, datePos, 10);
  //         }
  //       },
  //     };
  //     pdfDoc.autoTable(options);
  //     pdfDoc.save('Report.pdf');
  //     this.loader.stop();
  //   }
  // }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }


  // downloadExcel() {
  //   if (this.gridApi) {
  //     this.loader.start();
  //     const allRowData = [];
  //     const rowCount = this.gridApi.getDisplayedRowCount();
  //     for (let i = 0; i < rowCount; i++) {
  //       const rowNode = this.gridApi.getDisplayedRowAtIndex(i);
  //       if (rowNode) {
  //         allRowData.push(rowNode.data);
  //       }
  //     }
  //     // const rowData = this.gridApi.getRenderedNodes().map(node => node.data);
  //     const filteredData = allRowData.map(row => ({
  //       propertyName: row.propertyName,
  //       blockName: row.blockName,
  //       unitName: row.unitName,
  //       joinDate: this.formatDate(row.joinDate), // Format date
  //       clientName: row.clientName,
  //       balAmount: this.formatNumber(row.balAmount), // Format debit
  //       phone: row.phone, // Format credit
  //       email: row.email
  //     }));

  //     // Create a new workbook
  //     const workbook = new ExcelJS.Workbook();
  //     const worksheet = workbook.addWorksheet('Sheet1');

  //     // Define column headers
  //     worksheet.columns = [
  //       { header: 'Property', key: 'propertyName' },
  //       { header: 'Block', key: 'blockName' },
  //       { header: 'Unit', key: 'unitName' },
  //       { header: 'Join Date', key: 'joinDate' },
  //       { header: 'Client', key: 'clientName' },
  //       { header: 'Balance Amount', key: 'balAmount' },
  //       { header: 'Mobile', key: 'phone' },
  //       { header: 'Email', key: 'email' }

  //     ];
  //     worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
  //       row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
  //         if (rowNumber === 1) {
  //           cell.fill = {
  //             type: 'pattern',
  //             pattern: 'solid',
  //             fgColor: { argb: 'FFFFCC00' } // Set header background color to ash
  //           };
  //           cell.font = { bold: true }; // Make text bold
  //         }
  //         cell.value = String(cell.value).toUpperCase(); // Convert text to uppercase
  //       });
  //     });
  //     // Add data to the worksheet
  //     worksheet.addRows(filteredData);

  //     worksheet.columns.forEach((column: any) => {
  //       let maxLength = 0;
  //       column.eachCell({ includeEmpty: false }, (cell: any) => {
  //         const length = String(cell.value).length;
  //         if (length > maxLength) {
  //           maxLength = length;
  //         }
  //       });
  //       column.width = maxLength < 10 ? 10 : maxLength + 3; // Minimum width of 10
  //     });
  //     workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
  //       const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //       saveAs(blob, 'Balance Report.xlsx'); // Use saveAs from file-saver
  //       this.loader.stop();
  //     });
  //   }

  // }
  close() {
    this.router.navigateByUrl('/home');
  }
 async onSelectedBlockChanged() {
    this.displayMessage("","");
    // this.flatsList = [];
    // this.rowData = [];
    this.masterParams.type = 'REPPROPUNITS';
    this.masterParams.item = this.saleReportForm.controls['PropCode'].value;
    this.masterParams.itemFirstLevel = this.saleReportForm.controls['BlockCode'].value;
    if (this.masterParams.item != 'All') {
      try {
        this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
          if (result.status.toUpperCase() === "SUCCESS") {
            this.flatsList = result['data'];
          }
          else {
            this.displayMessage("Error: " + result.message, "red");
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }
    else {
      this.saleReportForm.controls['UnitID'].patchValue("All");
    }
  }

  // clearMsgs() {
  //   this.retMessage = "";
  //   this.textMessageClass = "";
  // }


async  onSubmit() {
   this.displayMessage("","");
    this.rowData = [];
    if (this.saleReportForm.valid) {
      // if (this.custCode == undefined || this.custCode == null) {
      //   this.textMessageClass = "red";
      //   this.retMessage = "Select Valid Client!";
      //   return;
      // }
      const body = {
        ...this.commonParams(),
        client: this.custCode || "",
        ClientType: this.saleReportForm.controls['clientType'].value,
        dateAsOn: this.datepipe.transform(this.saleReportForm.controls['FromDate'].value, "yyyy-MM-dd"),
        Property: this.saleReportForm.controls['PropCode'].value,
        Block: this.saleReportForm.controls['BlockCode'].value,
        Unit: this.saleReportForm.controls['UnitID'].value,
        isSummary: this.saleReportForm.controls.isSummary.value
      }
      try {
        this.loader.start();
        this.subSink.sink =await this.projectService.ReportGetClientBalances(body).subscribe((res: any) => {
          this.loader.stop();
          if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
            // this.handleSuccess(res);
            // console.log(res.data);
            this.displayMessage("Success: Client balances retrived successfully.", "green");
            this.rowData = res.data;
            this.setColumnDefs();
            if (this.rowData.length > 0 && this.saleReportForm.controls.isSummary.value) {
              const receiptType = this.saleReportForm.controls.clientType.value.toUpperCase() === "TENANT" ? "Receipt" : "Payment";

              this.rowData.forEach((row: any) => {
                row.receipt = receiptType;
              });
              // const mergedData = this.rowData.reduce((acc: any, current: any) => {
              //   const existing = acc.find((item: any) => item.clientName === current.clientName
              //     && item.property === current.property);
              //   // const balAmount =
              //   if (existing) {
              //     existing.unit += `, ${current.unit}`;
              //     existing.balAmount += current.balAmount;
              //   } else {
              //     acc.push({ ...current });
              //   }

              //   return acc;
              // }, []);
              const mergedData = this.rowData.reduce((acc: any, current: any) => {
                const existing = acc.find((item: any) =>
                  item.clientName === current.clientName &&
                  item.property === current.property &&
                  item.unit === current.unit
                );

                if (existing) {
                  existing.balAmount += current.balAmount;

                  if (existing.balAmount === 0) {
                    acc = acc.filter((item: any) => item !== existing);
                  }
                } else {
                  // if (current.balAmount !== 0) {
                  acc.push({ ...current });
                  // }
                }
                return acc;
              }, []);

              this.gridData = mergedData;
              this.processRowPostCreate(this.gridData);
              this.calculateTotalLoan(this.gridData);
            }
            else {
              this.gridData = this.rowData;
              this.setColumnDefs();
              const receiptType = this.saleReportForm.controls.clientType.value.toUpperCase() === "TENANT" ? "Receipt" : "Payment";
              this.rowData.forEach((row: any) => {
                row.receipt = receiptType;
              });
              this.processRowPostCreate(this.gridData);
              this.calculateTotalLoan(this.gridData);
            }
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
            this.rowData = [];
            this.gridData=[];
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }

  }
  calculateTotalLoan(params: any){
    let total=0;
    for(let i =0;i<params.length;i++){
      const amount=parseFloat(params[i].loanBalAmount);
      total+=amount;
    }
    this.totalLoanAmt=total;
    this.getTotalLoan();
  }
  processRowPostCreate(params: any) {
    let positiveTotal = 0;
    let negetiveTotal = 0;
    for (let i = 0; i < params.length; i++) {
      const amount = parseFloat(params[i].balAmount);
      const tranType = params[i].tranType;
      if (tranType != "Statement Closing") {
        if (!isNaN(amount)) {
          if (amount > 0) {
            positiveTotal += amount;
          }
          else {
            negetiveTotal += amount
          }
        }
      }
    }
    this.totalAmount = positiveTotal;
    const formattedBalance = negetiveTotal < 0 
                    ? `(${Math.abs(negetiveTotal).toLocaleString()})` 
                    : negetiveTotal.toLocaleString();
    this.balanceAmount = negetiveTotal;
    this.diffAmount = positiveTotal + negetiveTotal;
    this.getTotal();
  }

  onFilterData(event: any) {
    this.processRowPostCreate(event);
    this.calculateTotalLoan(event);
  }


async  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      Item: this.saleReportForm.controls['customer'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
          if (res.data.nameCount === 1) {
            this.saleReportForm.controls['customer'].patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<TenantSearchComponent> = this.dialog.open(TenantSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.saleReportForm.controls['customer'].value, 'PartyType': "CUSTOMER",
                  'search': 'Client Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.saleReportForm.controls['customer'].setValue(result.clientName);
                  this.custCode = result.clientCode;
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
  generateColumns(data: any[]) {
    const desiredFields = [
      "tranNo",
      "tenantName",
      "propertyName",
      "blockName",
      "unitName",
      "techName",
      "startDate",
      "startTime",
      "givenDate",
      "givenTime",
      "endDate",
      "endTime",
      "extraDays",
      "extraHours",
      "extraMins"
    ];

    let columnDefinitions: any[] = [];
    desiredFields.forEach(field => {
      if (data[0].hasOwnProperty(field)) {
        let mappedColumn: any = {
          headerName: field.toUpperCase(),
          field: field
        };

        if (field.toLowerCase().includes('date')) {
          mappedColumn.valueFormatter = (params: any) => {
            return this.formatDate(params.value);
          };
        }

        columnDefinitions.push(mappedColumn);
      }
    });

    console.log(columnDefinitions);
    return columnDefinitions;
  }
  clear() {
    this.saleReportForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.rowData = [];
    this.blocksList = [];
    this.flatsList = [];
    this.custCode = "";
    this.refreshData();
    this.totalAmount = 0;
    this.gridData = [];
  }

  isDate(value: any) {
    return (new Date(value)).toString() !== 'Invalid Date' && !isNaN(new Date(value).getDate());
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  formatDate(date: any) {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0'); // +1 because months are zero based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
