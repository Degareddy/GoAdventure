import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { itemCharges } from '../../purchase.class';
import { InventoryService } from 'src/app/Services/inventory.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
@Component({
  selector: 'app-item-charges',
  templateUrl: './item-charges.component.html',
  styleUrls: ['./item-charges.component.css']
})
export class ItemChargesComponent implements OnInit, OnDestroy {
  @Input() data!: { mode: string, tranNum: string, status: string, vat: boolean };
  itemChargeForm!: FormGroup;
  public dialogOpen: boolean = false;
  rowData: any = [];
  retMessage!: string;
  textMessageClass!: string;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  masterParams!: MasterParams;
  itemChargeCls: itemCharges;
  masterItemsList: Item[] = [];
  grnItems: any[] = [];
  grndata: any[] = [];
  public slNo!: number
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  currencyList: Item[] = []
  mode!: string;
  grnItem: string = "";
  private subSink!: SubSink;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "supplierName", headerName: "Supplier", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "chargeItemName", headerName: "Charge", sortable: true, filter: true, resizable: true, width: 180 },
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
    field: "netRate", headerName: "Net",resizable: true, flex: 1, type: 'rightAligned',
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
    field: "quantity", headerName: "Quantity",  resizable: true, flex: 1, type: 'rightAligned',
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
  },
    // { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, flex: 1 },
  ];
  constructor(private fb: FormBuilder, private purService: PurchaseService, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, public dialog: MatDialog, private utlService: UtilitiesService,
    private invService: InventoryService) {
    this.itemChargeForm = this.formInit();
    this.masterParams = new MasterParams();
    this.itemChargeCls = new itemCharges();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      gRNSlNo: [{ value: '', disabled: true }],
      prodCode: [{ value: '', disabled: true }],
      supplier: ['', [Validators.required,]],
      currency: ['', [Validators.required,]],
      exchRate: ['1.0000', [Validators.required]],
      chargeItem: ['', [Validators.required,]],
      unitRate: ['0.00', [Validators.required,]],
      vatRate: [0],
      netRate: ['0.00', [Validators.required,]],
      quantity: ['1', [Validators.required,]],
      amount: ['0.00', [Validators.required,]],
      applyVat: [false],
      remarks: [''],
    });
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);

  }
  onRowClick(row: any) {
    this.slNo = row.slNo;
    this.itemChargeCls.prodCode = row.prodCode;
    this.itemChargeCls.supplier = row.supplier;
    this.itemChargeForm.patchValue({
      tranType: row.tranType,
      tranNo: row.tranNo,
      slNo: row.slNo,
      prodCode: row.prodName,
      supplier: row.supplierName,
      currency: row.currency,
      exchRate: row.exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      chargeItem: row.chargeItem,
      unitRate: row.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: row.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: row.netRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: row.rowAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      remarks: row.remarks
    })
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
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
      Item: "CURRENCY",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };
    const body = {
      ...this.commonParams(),
      item: "CHARGES",
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
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
  }
  prepareChargeCls() {
    const formValue = this.itemChargeForm.value;
    this.itemChargeCls.company = this.userDataService.userData.company;
    this.itemChargeCls.location = this.userDataService.userData.location;
    this.itemChargeCls.langID = this.userDataService.userData.langId;
    this.itemChargeCls.chargeItem = formValue.chargeItem;
    this.itemChargeCls.currency = formValue.currency;
    this.itemChargeCls.exchRate = parseFloat(formValue.exchRate.replace(/,/g, ''));
    this.itemChargeCls.gRNSlNo = this.itemChargeForm.get('gRNSlNo')?.value;
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
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.itemChargeForm.invalid) {
      return;
    }
    else {
      this.prepareChargeCls();
      this.loader.start();
      this.subSink.sink = this.purService.UpdateGRNProductSpecificCharges(this.itemChargeCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAILED" || res.status.toUpperCase() === "ERROR") {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.grnItemChange(this.itemChargeForm.controls['gRNSlNo'].value);
        }

      });
    }
  }
  grnItemChange(event: any) {
    this.retMessage="";
    this.textMessageClass="";
    this.rowData=[];
    const foundItem = this.grndata.find(item => item.slNo === event);
    this.itemChargeForm.controls['gRNSlNo'].patchValue(foundItem.slNo);
    this.itemChargeForm.controls['prodCode'].patchValue(foundItem.prodName);
    this.itemChargeCls.prodCode = foundItem.prodCode;
    const body = {
      rowNo: event,
      ...this.commonParams(),
      tranNo: this.data.tranNum,
      langId: this.userDataService.userData.langId,
    }
    this.subSink.sink = this.purService.GetGrnItemSpecificCharges(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "FAIL") {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
      else {
        this.rowData = res['data'];
      }
    });

  }
  onSupplierSearch(itemType: string) {
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.itemChargeForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL") {
          if (res.data.nameCount === 1) {
            if (itemType == 'SUPPLIER') {
              this.itemChargeForm.controls['supplier'].patchValue(res.data.selName);
              this.itemChargeCls.supplier = res.data.selCode;
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.itemChargeForm.controls['supplier'].value, 'PartyType': itemType,
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (itemType == 'SUPPLIER') {
                  this.itemChargeForm.controls['supplier'].setValue(result.partyName);
                  this.itemChargeCls.supplier = result.code;
                }
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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  onUnitRateChanged() {
    let numUnitRate: number;
    let numQty: number;
    let numNetRate: number;
    let numAmount: number;

    let strUnitRate = this.itemChargeForm.controls['unitRate'].value.toString();
    let strQty = this.itemChargeForm.controls['quantity'].value.toString();

    if (strUnitRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numUnitRate = Number(strUnitRate.replace(/,/g, ''));
    numQty = Number(strQty.replace(/,/g, ''));
    if (this.data.vat) {
      numNetRate = numUnitRate * (1 + this.itemChargeForm.controls['vatRate'].value / 100.0);
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

    this.itemChargeForm.controls['unitRate'].patchValue(numUnitRate.toLocaleString(undefined, options));
    this.itemChargeForm.controls['netRate'].patchValue(numNetRate.toLocaleString(undefined, options));
    this.itemChargeForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  onNetRateChanged() {

  }
  onQuantityChanged() {
    let numQty: number;
    let numNetRate: number;
    let strNetRate = this.itemChargeForm.controls['netRate'].value.toString();
    let strQty = this.itemChargeForm.controls['quantity'].value.toString();
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

    this.itemChargeForm.controls['quantity'].patchValue(numQty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    this.itemChargeForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }
  onAmountChanged() {

  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  newItemCharge() {
    // this.itemChargeForm = this.formInit();
    this.itemChargeForm.patchValue({
      supplier: '',
      currency: '',
      exchRate: '1.0000',
      chargeItem: '',
      unitRate: '0.00',
      vatRate: 0,
      netRate: '0.00',
      quantity: '0',
      amount: '0.00',
      applyVat: false,
      remarks: ''
  });
    this.data.mode = "Modify";
    this.slNo = 0;
  }
}
