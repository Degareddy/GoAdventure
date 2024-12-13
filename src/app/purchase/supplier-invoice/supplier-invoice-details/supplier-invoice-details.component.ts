import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { forkJoin } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { supInvoiceDet } from '../../purchase.class';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-purchasedetails',
  templateUrl: './supplier-invoice-details.component.html',
  styleUrls: ['./supplier-invoice-details.component.css']
})
export class SupplierInvoiceDetailsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  retMessage!: string;
  textMessageClass!: string;
  supInvDetForm!: FormGroup;
  slNum: number = 0;
  dataFlag: boolean = false;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  private subSink!: SubSink;
  private supInvoiceDetCls!: supInvoiceDet
  grnList: Item[] = [];
  columnDefs: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "grnNo", headerName: "Grn No", sortable: true, filter: true, resizable: true, width: 120 },
  {
    field: "grnDate", headerName: "Grn Date", sortable: true, filter: true, resizable: true, width: 120, valueFormatter: function (params: any) {
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
  { field: "currency", headerName: "Currency", sortable: true, filter: true, resizable: true, width: 120 },
  {
    field: "exchRate", headerName: "Exch Rate", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned',
    cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(numericValue);
        }
      }
      return null;
    },
  },
  {
    field: "grnAmt", headerName: "Grn Amt", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned',
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
    field: "vatAmt", headerName: "Vat Amt", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned',
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
    field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, width: 120, type: 'rightAligned',
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
  ];
  currencyList: any = [];

  constructor(protected suppInvoiceService: PurchaseService, private fb: FormBuilder, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.supInvDetForm = this.formInit();
    this.subSink = new SubSink();
    this.supInvoiceDetCls = new supInvoiceDet();
  }
  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
  }
  getPensingGrns() {
    this.subSink.sink = this.suppInvoiceService.GetSupplierPendingGRNs({
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.data.tranNo, client: this.data.client, currency: this.data.currency, ApplyVat: this.data.vat === 1 ? true : false
    }).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        // this.grnList = res2.data;
        this.rowData = res.data;
      }
      else {
        this.retMessage = "No pending GRN's found!";
        this.textMessageClass = "red";
      }
    });
  }
  loadData() {
    const service1 = this.suppInvoiceService.GetMasterItemsList({ ...this.commonParams(), item: "CURRENCY" });
    this.subSink.sink = forkJoin([service1]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        // const res2 = results[1];
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.currencyList = res1.data;
        }
        else {
          this.retMessage = "Currency list empty!";
          this.textMessageClass = "red";
        }


      },
      (error: any) => {
        this.retMessage = error.message;
        this.textMessageClass = "red";
        this.loader.stop();
      }
    );
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID

    }
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    // console.log(event.rowIndex);
    this.slNum = event.rowIndex + 1;
    this.onRowClick(event.data);
    console.log(this.slNum);

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  formInit() {
    return this.fb.group({
      grnNo: ['', [Validators.required, Validators.maxLength(35)]],
      grnDate: [new Date(), [Validators.required]],
      currency: ['', [Validators.required, Validators.maxLength(50)]],
      exchRate: ['1.0000', [Validators.required]],
      grnAmt: ['0.00', [Validators.required]],
      vatAmt: ['0.00', [Validators.required]],
      amount: ['0.00', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.data.tranNo) {
      this.get(this.data.tranNo);
    }
    this.loadData();
    this.supInvDetForm.get('grnAmt')?.valueChanges.subscribe((value:any)=>{
      this.calculateNetAmount();
    });
    this.supInvDetForm.get('vatAmt')?.valueChanges.subscribe((value:any) =>{
      this.calculateNetAmount();
    });
  }

  calculateNetAmount() {
    const grnAmt = this.supInvDetForm.get('grnAmt')?.value || '0';
    const vatAmt = this.supInvDetForm.get('vatAmt')?.value || '0';
  
    // Remove commas and parse as float
    const grnAmtValue = parseFloat(grnAmt.toString().replace(/,/g, '')) || 0;
    const vatAmtValue = parseFloat(vatAmt.toString().replace(/,/g, '')) || 0;
  
    const totalAmount = grnAmtValue + vatAmtValue;
  
    // Update the 'amount' form control
    this.supInvDetForm.get('amount')?.setValue(totalAmount.toLocaleString('en-US'));
  }
  
  addNew() {
    this.supInvDetForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.slNum=0;
  }
  get(tarnNO: string) {
    this.masterParams.tranNo = tarnNO;
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    try {
      this.loader.start();
      this.subSink.sink = this.suppInvoiceService.GetSuppInvoiceDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          if (this.data.status.toUpperCase() == "OPEN" && this.data.mode.toUpperCase() === "MODIFY") {
            this.getPensingGrns();
          } else {
            this.retMessage = res.message
            this.textMessageClass = 'red';
          }


        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.retMessage = ex.message
      this.textMessageClass = 'red';
    }

  }

  onRowClick(row: any) {
    // this.slNum = row.slNo;
    this.supInvDetForm.patchValue({
      grnNo: row.grnNo,
      grnDate: row.grnDate,
      currency: row.currency,
      exchRate: row.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      grnAmt: row.grnAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatAmt: row.vatAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount: row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  prepareCls() {

    const formValues = this.supInvDetForm.value;

    this.supInvoiceDetCls.mode = this.data.mode;
    this.supInvoiceDetCls.company = this.userDataService.userData.company;
    this.supInvoiceDetCls.location = this.userDataService.userData.location;
    this.supInvoiceDetCls.langID = this.userDataService.userData.langId;
    this.supInvoiceDetCls.user = this.userDataService.userData.userID;
    this.supInvoiceDetCls.refNo = this.userDataService.userData.sessionID;
    this.supInvoiceDetCls.tranNo = this.data.tranNo;

    this.supInvoiceDetCls.grnDate = formValues.grnDate;
    this.supInvoiceDetCls.grnNo = formValues.grnNo;
    this.supInvoiceDetCls.slNo = this.slNum;
    this.supInvoiceDetCls.currency = formValues.currency;
    // this.supInvoiceDetCls.amount = parseFloat(formValues.amount.replace(/,/g, ''));
    // this.supInvoiceDetCls.exchRate = parseFloat(formValues.exchRate.replace(/,/g, ''));
    // this.supInvoiceDetCls.grnAmt = parseFloat(formValues.grnAmt.replace(/,/g, ''));
    // this.supInvoiceDetCls.vatAmt = parseFloat(formValues.vatAmt.replace(/,/g, ''));
    this.supInvoiceDetCls.amount = parseFloat(
      formValues.amount
        ? formValues.amount.toString().replace(/,/g, '')
        : '0'
    );
    
    this.supInvoiceDetCls.exchRate = parseFloat(formValues.exchRate ? formValues.exchRate.replace(/,/g, '') : '0');
    this.supInvoiceDetCls.grnAmt = parseFloat(formValues.grnAmt ? formValues.grnAmt.replace(/,/g, '') : '0');
    this.supInvoiceDetCls.vatAmt = parseFloat(formValues.vatAmt ? formValues.vatAmt.replace(/,/g, '') : '0');



  }
  onSubmit() {
    
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.supInvDetForm.invalid) {
      this.retMessage = "Form invalid enter all required fields!";
      this.textMessageClass = "red";
      return;
    }
    else {
      this.prepareCls();
      try {
        this.loader.start();
        this.subSink.sink = this.suppInvoiceService.UpdateSuppInvoiceDetails(this.supInvoiceDetCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          
          if (res.status.toUpperCase() === "SUCCESS") {
            
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.get(res.tranNoNew);
          }
          else {
            
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        })

      }
      catch (ex: any) {
        this.loader.stop();
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
      // console.log(this.supInvoiceDetCls);

    }
  }
}
