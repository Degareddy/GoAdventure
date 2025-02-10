import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { ExpenseDet } from 'src/app/gl/gl.class'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';
import { LinkUnitComponent } from '../link-unit/link-unit.component';
import { Item } from 'src/app/general/Interface/interface';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, TextClr, Type } from 'src/app/utils/enums';

@Component({
  selector: 'app-expense-details',
  templateUrl: './expense-details.component.html',
  styleUrls: ['./expense-details.component.css']
})
export class ExpenseDetailsComponent implements OnInit, OnDestroy {
  expDetForm!: FormGroup;
  retMessage!: string;
  textMessageClass!: string;
  masterParams!: MasterParams;
  selTranNo!: string;
  isAltered: boolean = false;
  expToList: Item[] = [
    { itemCode: "Management", itemName: "Management" },
    { itemCode: "Property", itemName: "Property" }
  ];
  tblData: any;
  props: Item[] = [];
  blocks: Item[] = [];
  flats: Item[] = [];
  itemsList: Item[] = [];
  tranData!: any[];
  private subSink: SubSink;
  slno!: number;
  expAccount!: string;
  expDetCls !: ExpenseDet;

  columnDefs: any = [
    { field: "slNo", headerName: "Sl No", width: 80 },
    { field: "expenseItem", headerName: "Item", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "expenseItemDesc", headerName: "Expense", sortable: true, filter: true, resizable: true, flex: 1 },
    // { field: "property", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    // { field: "block", headerName: "Block", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    // { field: "unit", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    {
      field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    { field: "expTo", headerName: "Expense To", sortable: true, resizable: true, flex: 1 },
    { field: "property", headerName: "Property Name", sortable: true, resizable: true, flex: 1 },
    { field: "expAccountName", headerName: "Account", sortable: true, resizable: true, flex: 1 },
    { field: "expRefNo", headerName: "Reference No", sortable: true, resizable: true, flex: 1 },
    { field: "remarks", headerName: "Remarks", sortable: true, hide: true, resizable: true, flex: 1 }
  ];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  rowData: any = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  slNum: number = 0;

  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  constructor(private fb: FormBuilder,
    private loader: NgxUiLoaderService, private userDataService: UserDataService,
    private masterService: MastersService,
    protected glService: GeneralLedgerService, public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string, name: string }) {
    this.expDetForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.expDetCls = new ExpenseDet();
    this.expDetForm = this.formInit();
    this.selTranNo = data.tranNo;
    this.slno = 0;
    // this.displayColumns = ["slno", "expenseItem", "amount", "remarks", "actions"];
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      expenseItem: ['', [Validators.required, Validators.maxLength(50)]],
      property: ['', [Validators.required, Validators.maxLength(50)]],
      amount: ['0.00', [Validators.required]],
      expTo: ['', [Validators.required, Validators.maxLength(10)]],
      expRefNo: [''],
      remarks: [''],
    })
  }
  onAddExpense() {

  }
  ngOnInit(): void {
    this.loadData();
    this.getExpenseDetails(this.selTranNo);
    this.refreshData();
  }
  refreshData() {
    this.expDetForm.get('expTo')?.valueChanges.subscribe(value => {
        this.updatePropertyValidation(value);
    });
  }
  updatePropertyValidation(expenseItem: string) {
    const propertyControl = this.expDetForm.get('property');

    if (expenseItem === 'Management') {
      propertyControl?.clearValidators();
    } else {
      propertyControl?.setValidators([Validators.required, Validators.maxLength(50)]);
    }
    propertyControl?.updateValueAndValidity();
  }
  loadData() {

    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const propertybody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: Items.PROPERTY,
      refNo: this.userDataService.userData.sessionID
    };

    const itemsbody = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: Items.OVERHEADS,
      refNo: this.userDataService.userData.sessionID
    };

    try {
      const property$ = this.masterService.GetMasterItemsList(propertybody);
      const ibody$ = this.masterService.GetMasterItemsList(itemsbody);
      this.subSink.sink = forkJoin([property$, ibody$]).subscribe(
        ([propRes, itemsRes]: any) => {
          if (propRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.props = propRes['data'];
          }
          else {
            this.displayMessage(displayMsg.ERROR + propRes.message, TextClr.red);
          }
          if (itemsRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.itemsList = itemsRes['data'];

          }
          else {
            this.displayMessage(displayMsg.ERROR + itemsRes.message, TextClr.red);
          }
        },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  prepareCls() {
    const formValues = this.expDetForm.value;
    this.expDetCls.mode = this.data.mode;
    this.expDetCls.company = this.userDataService.userData.company;
    this.expDetCls.location = this.userDataService.userData.location;
    this.expDetCls.langId = this.userDataService.userData.langId;
    this.expDetCls.tranNo = this.selTranNo;
    this.expDetCls.slNo = this.slno;

    this.expDetCls.property = this.expDetForm.controls['property'].value;
    this.expDetCls.block = Type.ALL;
    this.expDetCls.unit = Type.ALL;
    this.expDetCls.expenseItem = this.expDetForm.controls['expenseItem'].value;

    this.expDetCls.amount = Number(this.expDetForm.controls['amount'].value.toString().replace(/,(?=\d*\.\d*)/g, ''));
    this.expDetCls.expTo = formValues.expTo;
    this.expDetCls.expRefNo = formValues.expRefNo;
    this.expDetCls.remarks = formValues.remarks;

    this.expDetCls.user = this.userDataService.userData.userID;
    this.expDetCls.refNo = this.userDataService.userData.sessionID;
  }
  onUpdate() {
    if (this.expDetForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subSink.sink = this.glService.UpdateExpensesDet(this.expDetCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.isAltered = true
            this.getExpenseDetails(res.tranNoNew);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }

  getExpenseDetails(newTranNo: string) {
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      LangId: this.userDataService.userData.langId,
      tranNo: newTranNo,
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    try {
      this.loader.start();
      this.subSink.sink = this.glService.getExpensesDet(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  reset() {
    this.expDetForm.reset();
    this.slno = 0;
    this.refreshData();

  }
  Close() {

  }
  onSelectedPropertyChanged() {
    this.masterParams.type = Type.BLOCK;
    this.masterParams.item = this.expDetForm.controls['property'].value;
    try {
      this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.blocks = result['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + result.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  onSelectedBlockChanged() {
    this.masterParams.type = Type.FLAT;
    this.masterParams.item = this.expDetForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.expDetForm.controls['block'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.flats = result['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + result.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onSelectedFlatChanged() {

  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.slno = event.data.slNo;
    this.expAccount = event.data.expAccount;
    this.expDetForm.controls['amount'].setValue(event.data.amount.toLocaleString(undefined, options));
    if (event.data) {
      this.expDetForm.patchValue({
        slNo: event.data.slNo,
        expenseItem: event.data.expenseItem,
        expenseItemDesc: event.data.expenseItemDesc,
        property: event.data.property,
        block: event.data.block,
        unit: event.data.unit,
        amount: event.data.amount.toLocaleString(undefined, options),
        expTo: event.data.expTo,
        expAccount: event.data.expAccount,
        expRefNo: event.data.expRefNo,
        remarks: event.data.remarks
      }, { emitEvent: false });
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  newExepnse() {
    this.slno = 0;
    this.expDetForm = this.formInit();
    this.displayMessage('', '');
  }

  onAmountChanged() {
    let numAmount: number;
    let strAmount = this.expDetForm.controls['amount'].value.toString();
    if (strAmount == "") {
      return;
    }
    numAmount = Number(strAmount.replace(/,(?=\d*\.\d*)/g, ''));
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.expDetForm.controls['amount'].setValue(numAmount.toLocaleString(undefined, options));
  }
  linkUint() {
    const dialogRef: MatDialogRef<LinkUnitComponent> = this.dialog.open(LinkUnitComponent, {
      disableClose: true,
      width: '750px',
      data: {
        tranNo: this.data.tranNo,
        slNo: this.slno,
        mode: this.data.mode
      }
    });
  }
}
