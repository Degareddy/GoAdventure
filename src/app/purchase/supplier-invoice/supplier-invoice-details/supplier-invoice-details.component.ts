import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
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
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, Mode, TextClr, TranStatus } from 'src/app/utils/enums';

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
  isAltered:boolean=false;
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
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.rowData = res.data;
      }
      else {
        this.displayMessage(displayMsg.ERROR + "No pending GRN's found!", TextClr.red);
      }
    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  loadData() {
    try{
      const service1 = this.suppInvoiceService.GetMasterItemsList({ ...this.commonParams(), item: Items.CURRENCY });
      this.subSink.sink = forkJoin([service1]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.currencyList = res1.data;
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Currency list empty!", TextClr.red);
          }


        },
        (error: any) => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
          this.loader.stop();
        }
      );
    }
    catch(ex:any){
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

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
    this.supInvDetForm.get('grnAmt')?.valueChanges.subscribe((value: any) => {
      this.calculateNetAmount();
    });
    this.supInvDetForm.get('vatAmt')?.valueChanges.subscribe((value: any) => {
      this.calculateNetAmount();
    });
  }

  calculateNetAmount() {
    const grnAmt = this.supInvDetForm.get('grnAmt')?.value || '0';
    const vatAmt = this.supInvDetForm.get('vatAmt')?.value || '0';
    const grnAmtValue = parseFloat(grnAmt.toString().replace(/,/g, '')) || 0;
    const vatAmtValue = parseFloat(vatAmt.toString().replace(/,/g, '')) || 0;
    const totalAmount = grnAmtValue + vatAmtValue;
    this.supInvDetForm.get('amount')?.setValue(totalAmount.toLocaleString('en-US'));
  }

  addNew() {
    this.supInvDetForm = this.formInit();
    this.displayMessage("","");
    this.slNum = 0;
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
        if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
        }
        else {
          if (this.data.status.toUpperCase() == TranStatus.OPEN && this.data.mode.toUpperCase() === Mode.Modify) {
            this.getPensingGrns();
          } else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  onRowClick(row: any) {
    this.supInvDetForm.patchValue({
      grnNo: row.grnNo,
      grnDate: row.grnDate,
      currency: row.currency,
      exchRate: row.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      grnAmt: row.grnAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatAmt: row.vatAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount: row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },{emitEvent:false});
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  prepareCls(mode:string) {
    const formValues = this.supInvDetForm.value;
    this.supInvoiceDetCls.mode = mode;
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
    this.supInvoiceDetCls.amount = parseFloat(
      formValues.amount
        ? formValues.amount.toString().replace(/,/g, '')
        : '0'
    );

    this.supInvoiceDetCls.exchRate = parseFloat(formValues.exchRate ? formValues.exchRate.replace(/,/g, '') : '0');
    this.supInvoiceDetCls.grnAmt = parseFloat(formValues.grnAmt ? formValues.grnAmt.replace(/,/g, '') : '0');
    this.supInvoiceDetCls.vatAmt = parseFloat(formValues.vatAmt ? formValues.vatAmt.replace(/,/g, '') : '0');
  }
  onSubmit(mode:string) {
    this.displayMessage("","");
    if (this.supInvDetForm.invalid) {
      this.retMessage = "Form invalid enter all required fields!";
      this.textMessageClass = "red";
      return;
    }
    else {
      this.prepareCls(mode);
      try {
        this.loader.start();
        this.subSink.sink = this.suppInvoiceService.UpdateSuppInvoiceDetails(this.supInvoiceDetCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.get(res.tranNoNew);
            this.isAltered=true
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        })

      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }
}
