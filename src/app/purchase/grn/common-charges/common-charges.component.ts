import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SubSink } from 'subsink';
import { commonCharges } from '../../purchase.class';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { Item } from 'src/app/general/Interface/interface';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-common-charges',
  templateUrl: './common-charges.component.html',
  styleUrls: ['./common-charges.component.css']
})
export class CommonChargesComponent implements OnInit, OnDestroy {
  @Input() data!: { mode: string, tranNum: string, status: string, applyVat: boolean };
  grnccForm!: FormGroup;
  rowData: any = [];
  masterItemsList: Item[] = [];
  masterParams!: MasterParams;
  itemChargeCls: commonCharges;
  retMessage!: string;
  textMessageClass!: string;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  grnItems: any[] = [];
  grndata: any[] = [];
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subSink!: SubSink;
  public dialogOpen: boolean = false;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 90},
  { field: "chargeItemName", headerName: "Item", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "supplierName", headerName: "Supplier", sortable: true, filter: true, resizable: true, width: 220 },
  {
    field: "unitRate", headerName: "Unit Rate",  resizable: true, flex: 1, type: 'rightAligned',
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
    field: "vatRate", headerName: "Vat",  resizable: true, flex: 1, type: 'rightAligned',
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
    field: "netRate", headerName: "Net",  resizable: true, flex: 1, type: 'rightAligned',
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
    field: "quantity", headerName: "Quantity", resizable: true, flex: 1, type: 'rightAligned',
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
    field: "rowAmount", headerName: "Amount", resizable: true, flex: 1, type: 'rightAligned',
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
  }
  ];
  currencyList: Item[] = [];
  slNo: number = 0;
  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private purService: PurchaseService, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private utlService: UtilitiesService,
    private invService: InventoryService) {
    this.grnccForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.itemChargeCls = new commonCharges();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      supplier: ['', [Validators.required, Validators.maxLength(50)]],
      currency: ['', [Validators.required, Validators.maxLength(25)]],
      exchRate: ['1.0000', [Validators.required]],
      chargeItem: ['', [Validators.required, Validators.maxLength(25)]],
      unitRate: ['0.00', [Validators.required]],
      vatRate: [{ value: '0.00', disabled: true }],
      netRate: ['0.00', [Validators.required]],
      quantity: ['1', [Validators.required]],
      amount: ['0.00', [Validators.required]],
      remarks: ['']
    })
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(row: any) {
    this.slNo = row.data.slNo;
    this.itemChargeCls.supplier = row.data.supplier;
    this.grnccForm.patchValue({
      supplier: row.data.supplierName,
      currency: row.data.currency,
      exchRate: row.data.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      chargeItem: row.data.chargeItem,
      unitRate: row.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: row.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: row.data.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: row.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: row.data.rowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });

  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  ngOnInit(): void {
    this.masterParams.tranType = "GRN";
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.tranNo = this.data.tranNum;
    const curbody = {
      ...this.commonParams(),
      Item: "CURRENCY"
    };
    const body = {
      ...this.commonParams(),
      item: "CHARGES"
    }
    this.subSink.sink = this.purService.GetMasterItemsList(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.masterItemsList = res['data'];
      }
    })
    const service1 = this.purService.GetTranItemsList(this.masterParams);
    const service2 = this.invService.GetMasterItemsList(curbody);
    this.subSink.sink = forkJoin([service1, service2]).subscribe((results: any[]) => {
      this.loader.stop();
      const res1 = results[0];
      const res2 = results[1];
      if (res1.status.toUpperCase() === "SUCCESS") {
        this.grndata = res1.data;
        const responseArray = res1.data;
        const formattedObjectsArray = responseArray.map((item: any) => ({
          slNo: item.slNo,
          name: `${item.slNo}-${item.prodCode}-${item.prodName}`
        }));
        this.grnItems = formattedObjectsArray;
      }
      if (res2.status.toUpperCase() === "SUCCESS") {
        this.currencyList = res2.data;
      }
    },
      (error: any) => {
        this.loader.stop();
      }
    );
    this.getGrncommonCharges(this.data.tranNum);
  }
  getGrncommonCharges(tranNo: string) {
    this.rowData = [];
    const commnChargeBody = {
      ...this.commonParams(),
      tranNo: tranNo,
      langId: this.userDataService.userData.langId
    }
    this.subSink.sink = this.purService.GetGrnCommonCharges(commnChargeBody).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res['data'];
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  prepareChargeCls() {
    const formValue = this.grnccForm.value;
    this.itemChargeCls.company = this.userDataService.userData.company;
    this.itemChargeCls.location = this.userDataService.userData.location;
    this.itemChargeCls.langID = this.userDataService.userData.langId;
    this.itemChargeCls.chargeItem = formValue.chargeItem;
    this.itemChargeCls.currency = formValue.currency;
    this.itemChargeCls.exchRate = parseFloat(formValue.exchRate.replace(/,/g, ''));
    this.itemChargeCls.netRate = parseFloat(formValue.netRate.replace(/,/g, ''));
    this.itemChargeCls.quantity = parseFloat(formValue.quantity.replace(/,/g, ''));;
    this.itemChargeCls.remarks = formValue.remarks;
    this.itemChargeCls.slNo = this.slNo;
    this.itemChargeCls.tranNo = this.data.tranNum;
    this.itemChargeCls.tranType = "GRN";
    this.itemChargeCls.unitRate = parseFloat(formValue.unitRate.replace(/,/g, ''));;
    this.itemChargeCls.vatRate = formValue.vatRate;
    this.itemChargeCls.rowAmount = parseFloat(formValue.amount.replace(/,/g, ''));;
    this.itemChargeCls.refNo = this.userDataService.userData.sessionID;
    this.itemChargeCls.mode = this.data.mode;
    this.itemChargeCls.user = this.userDataService.userData.userID;
  }
  Submit() {
    if (this.grnccForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareChargeCls();
        this.loader.start();
        this.subSink.sink = this.purService.UpdateGRNCommonCharges(this.itemChargeCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.getGrncommonCharges(res.tranNoNew)
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }

    }
  }
  onUnitRateChanged() {
    let numUnitRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.grnccForm.controls['unitRate'].value.toString();
    let strQty = this.grnccForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    if (this.data.applyVat) {
      numNetRate = numUnitRate * (1 + this.grnccForm.controls['vatRate'].value / 100.0);
    }
    else {
      numNetRate = numUnitRate
    }

    numAmount = numNetRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.grnccForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.grnccForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.grnccForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  onNetRateChanged() {

  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.grnccForm.controls['netRate'].value.toString();
    let strQty = this.grnccForm.controls['quantity'].value.toString();
    if (strNetRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numNetRate = Number(strNetRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    let amount = numNetRate * numQty;
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.grnccForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.grnccForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }
  onAmountChanged() {

  }
  newCommonCharge() {

  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onSupplierSearch(itemType: string) {
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.grnccForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            if (itemType == 'SUPPLIER') {
              this.grnccForm.controls['supplier'].patchValue(res.data.selName);
              this.itemChargeCls.supplier = res.data.selCode;
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.grnccForm.controls['supplier'].value, 'PartyType': itemType,
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.grnccForm.controls['supplier'].setValue(result.partyName);
                this.itemChargeCls.supplier = result.code;
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }
}
