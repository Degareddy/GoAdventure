import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AdminService } from 'src/app/Services/admin.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SubSink } from 'subsink';
import { forkJoin, Subscription } from 'rxjs';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { ReceiptDetailsDataComponent } from 'src/app/general/reprots/receipt-details-data/receipt-details-data.component';
import { SalesService } from 'src/app/Services/sales.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { GrievanceParams } from 'src/app/utilities/utilities.class';
import { Store } from '@ngrx/store';
import { NavigationService } from 'src/app/Services/navigation.service';
import { selectTransactionReportData } from 'src/app/utils/location.selectors';
import { TransactionReportState } from 'src/app/utils/location.reducer';
import { clearTransctionReportState, loadTransctionReportState, saveTransctionReportState } from 'src/app/utils/location.actions';
import { displayMsg, Items, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-tran-register',
  templateUrl: './tran-register.component.html',
  styleUrls: ['./tran-register.component.css']
})
export class TranRegisterComponent implements OnInit, OnDestroy {
  Itemlist: Item[] = [];
  branchList: Item[] = [];
  grParams!: GrievanceParams;
  TransactionreciptForm!: FormGroup;
  modes: Item[] = [];
  masterParams!: MasterParams;
  private subSink: SubSink;
  textMessageClass!: string;
  retMessage!: string;
  dialogOpen = false;
  itemCode: string = 'ALL';
  reportList: Item[] = [];
  rowData: any = [];
  totalTmp: boolean = false;
  tranTmp: boolean = false;
  @Input() max: any;
  tomorrow = new Date();
  private subscriptions: Subscription = new Subscription();
  columnDefs: any = [{ field: "tranNo", headerName: "Tran No", flex: 1, resizable: true, sortable: true, filter: true, cellRenderer: 'agLnkRenderer' },
  {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
  { field: "partyName", headerName: "Party Name", sortable: true, filter: true, resizable: true, flex: 1, },
  { field: "tranType", headerName: "Tran Type", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "tranAmount", headerName: "Tran Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "totalAmount", headerName: "Total Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  { field: "detail", headerName: "Details", flex: 1, resizable: true, sortable: true, filter: true, cellRenderer: 'agDtlRenderer' }
  ];
  today = new Date();
  totalAmount: number = 0;
  tranAmount: number = 0;
  context = { componentParent: this };
  totals: string = "";
  constructor(private fb: FormBuilder, private datepipe: DatePipe, private userDataService: UserDataService, private store: Store, private navigationService: NavigationService,
    protected router: Router, private adminService: AdminService, public dialog: MatDialog, private saleService: SalesService,
    private loader: NgxUiLoaderService, private utilityService: UtilitiesService, private datePipe: DatePipe,) {
    this.TransactionreciptForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.grParams = new GrievanceParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
    this.subscriptions.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      reportType: ['', Validators.required],
      item: ['All'],
      branch: ['', Validators.required],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), Validators.required],
      toDate: [new Date(), Validators.required]
    });
  }
  onColumnVisibilityChanged(event: any) {
    const { field, hide } = event;
    if (field.toUpperCase() === 'TRANAMOUNT') {
      this.tranTmp = hide;
    }
    else if (field.toUpperCase() === 'TOTALAMOUNT') {
      this.totalTmp = hide;
    }
    this.getTotal();
  }
  getTotal() {
    if (!this.tranTmp && !this.totalTmp) {
      this.totals = "Tran Amount: " + this.tranAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        + " Total Amount: " + this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else if (!this.tranTmp) {
      this.totals = "Tran Amount: " + this.tranAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else if (!this.totalTmp) {
      this.totals = "Total Amount: " + this.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    else {
      this.totals = "";
    }
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;

    this.grParams.company = this.userDataService.userData.company;
    this.grParams.location = this.userDataService.userData.location;
    this.grParams.refNo = this.userDataService.userData.sessionID;
    this.grParams.user = this.userDataService.userData.userID;
    this.grParams.langId = this.userDataService.userData.langId;
    this.loadData();
    this.refreshData();
    this.subscriptions.add(
      this.store.select(selectTransactionReportData).subscribe((state: TransactionReportState) => {
        if (state) {
          this.TransactionreciptForm.patchValue({
            reportType: state.reportType,
            fromDate: state.fromDate,
            toDate: state.toDate,
            branch: state.branch,
            item: state.item
          }, { emitEvent: false });
          this.tranAmount = state.tranAmount;
          this.totalAmount = state.totalAmount;
          this.rowData = state.data;
        }
      })
    );

    const previousUrl = this.navigationService.getPreviousUrl();
    if (previousUrl === '/property/receipts-payments' || previousUrl === '/property/invoice' || previousUrl === '/property/grievance-service') {
      this.store.dispatch(loadTransctionReportState());

    } else {

      this.store.dispatch(clearTransctionReportState());
    }
  }
  refreshData() {
    this.TransactionreciptForm.valueChanges.subscribe(changes => {
      this.rowData = [];
      this.textMessageClass = "";
      this.retMessage = "";
      this.totalAmount = 0;
      this.tranAmount = 0;
      if (changes.branch.toUpperCase() != "") {
        if (changes.branch.toUpperCase() != this.userDataService.userData.location.toUpperCase()) {
          this.retMessage = "Access to " + changes.branch.toUpperCase() + " is restricted. Please change your location to fetch transactions.";
          this.textMessageClass = "red";
          return;
        }
      }
    });
  }

  onDtlClicked(event: any): void {
    if (event.data.tranType.toUpperCase() === 'INVOICE') {
      this.masterParams.tranNo = event.data.tranNo;
      this.getInvoiceData(this.masterParams);
    }
    else if (event.data.tranType.toUpperCase() === 'GRIEVANCE') {
      this.getGrievanceDetails(event.data.tranNo);
    }
  }

  onLnkClicked(event: any): void {
    const currentState: TransactionReportState = {
      reportType: this.TransactionreciptForm.controls.reportType.value,
      branch: this.TransactionreciptForm.controls.branch.value,
      fromDate: this.TransactionreciptForm.controls.fromDate.value,
      toDate: this.TransactionreciptForm.controls.toDate.value,
      item: this.TransactionreciptForm.controls.item.value,
      data: this.rowData,
      pagination: {
        pageIndex: 0,
        pageSize: 25
      },
      totalAmount: this.totalAmount,
      tranAmount: this.tranAmount

    };
    this.store.dispatch(saveTransctionReportState({ state: currentState }));

    if (event.data.tranType.toUpperCase() === Type.INVOICE) {
      this.router.navigate(['property/invoice'], { state: { data: event.data } });
    }
    else if (event.data.tranType.toUpperCase() === TranType.GRIEVANCE) {
      this.router.navigate(['property/grievance-service'], { state: { data: event.data } });
    }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  getGrievanceDetails(tranNo: string) {
    this.retMessage = "";
    this.textMessageClass = "";
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    this.grParams.issueStatus = TranStatus.ANY;
    this.grParams.fromDate = formattedFirstDayOfMonth;
    this.grParams.toDate = formattedCurrentDate;
    this.grParams.tranNo = tranNo;
    this.grParams.tranType = TranType.GRIEVANCE;
    try {
      this.loader.start();
      this.subSink.sink = this.utilityService.GetTenantSpecificGrievanceDetails(this.grParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.dialog.open(ReceiptDetailsDataComponent, {
            width: '85%',
            data: {
              data: res.data, name: "Grievance Details",
              type: TranType.GRIEVANCE
            },
            disableClose: true
          });

        }
        else {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }


  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onLinkClicked(event: any) {
  }
  onFilterData(event: any) {
    this.processRowPostCreate(event);
  }
  getInvoiceData(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.getTenantInvoiceHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.dialog.open(ReceiptDetailsDataComponent, {
            width: '80%',
            data: {
              data: res.data,
              name: "Invoice Details",
              type: Type.INVOICE
            },
            disableClose: true
          });
        }
        else {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  processRowPostCreate(params: Array<{ tranAmount: string, totalAmount: string }>): void {
    let tranTotal = 0;
    let totalAmt = 0;
    params.forEach(param => {
      const amount = parseFloat(param.tranAmount);
      const tamount = parseFloat(param.totalAmount);

      if (!isNaN(amount) && !isNaN(tamount) && amount > 0) {
        tranTotal += amount;
        totalAmt += tamount;
      }
    });
    this.tranAmount = tranTotal;
    this.totalAmount = totalAmt;
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
  loadData() {
    const branchbody: getPayload = {
      ...this.commonParams(),
      item: Items.BRANCHES
    };
    const reportbody: getPayload = {
      ...this.commonParams(),
      item: Items.REPORTS,
    };
    const service1 = this.adminService.GetMasterItemsList(branchbody);
    const service2 = this.adminService.GetMasterItemsList(reportbody);
    try {
      this.loader.start();
      this.subSink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          if (res1.status.toUpperCase() !== AccessSettings.SUCCESS) {
            this.branchList = res1.data;

          } else {
            this.displayMessage(displayMsg.ERROR + "Branch list empty!", TextClr.red);
          }
          if (res2.status.toUpperCase() !== AccessSettings.SUCCESS) {
            this.reportList = res2.data;

          } else {
            this.displayMessage(displayMsg.ERROR + "Branch list empty!", TextClr.red);
          }
        },
        error => {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }


  onSubmit() {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.TransactionreciptForm.valid) {
      const fromDate = this.datepipe.transform(this.TransactionreciptForm.get('fromDate')?.value, "yyyy-MM-dd") || "";
      const toDate = this.datepipe.transform(this.TransactionreciptForm.get('toDate')?.value, "yyyy-MM-dd") || "";

      if (fromDate && toDate && fromDate > toDate) {
        this.retMessage = "Error: From Date should be lessthan To Date!";
        this.textMessageClass = "red";
        return;
      }
      const body = {
        ...this.commonParams(),
        ReportType: this.TransactionreciptForm.controls['reportType'].value,
        FromDate: this.datepipe.transform(this.TransactionreciptForm.controls['fromDate'].value, "yyyy-MM-dd"),
        ToDate: this.datepipe.transform(this.TransactionreciptForm.controls['toDate'].value, "yyyy-MM-dd"),
        item: this.itemCode,
        location: this.TransactionreciptForm.controls['branch'].value
      }
      try {
        this.loader.start();
        this.subSink.sink = this.adminService.GetTransactionRecipt(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.rowData = res.data;
            this.calculateTotals(this.rowData);
            if (this.rowData.length >= 1) {
              for (var i = 0; i < this.rowData.length; i++) {
                this.rowData[i].detail = 'Details';
              }
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = []
            this.loader.stop();
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }

  calculateTotals(data: any[]) {
    let totalAmt = 0;
    let tranAmt = 0;
    data.forEach(row => {
      const totalAmount = parseFloat(row.totalAmount);
      const tranAmount = parseFloat(row.tranAmount);

      if (!isNaN(totalAmount)) {
        totalAmt += totalAmount;
      }

      if (!isNaN(tranAmount)) {
        tranAmt += tranAmount;
      }
    });
    this.totalAmount = totalAmt;
    this.tranAmount = tranAmt;
    this.getTotal();
  }

  searchData() {
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      Type: Type.TENANT,
      PartyName: this.TransactionreciptForm.controls['item'].value || "",
      User: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
    try {
      this.subSink.sink = this.adminService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res && res.data && res.data.nameCount === 1) {
          this.TransactionreciptForm.controls['item'].patchValue(res.data.selName);
          this.itemCode = res.data.selCode;
        }
        else {
          if (!this.dialogOpen) {
            const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
              width: '90%',
              disableClose: true,
              data: {
                PartyName: this.TransactionreciptForm.controls['item'].value || "",
                PartyType: Type.CUSTOMER,
                search: 'Client Search'
              }
            });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              if (result != true && result != undefined) {
                this.TransactionreciptForm.controls['item'].setValue(result.partyName);
                this.itemCode = result.code;
              }

              this.dialogOpen = false;
            });
          }

        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  reset() {
    this.TransactionreciptForm = this.formInit();
    this.displayMessage("", "");
  }

  clear() {
    this.TransactionreciptForm = this.formInit();
    this.displayMessage("", "");
    this.rowData = [];
    this.itemCode = "All";
    this.totalAmount = 0;
    this.tranAmount = 0;
    this.refreshData();
  }

}
