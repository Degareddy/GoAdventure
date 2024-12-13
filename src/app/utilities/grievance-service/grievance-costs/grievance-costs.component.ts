import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { SubSink } from 'subsink';
import { GrievanceCostClass } from '../../utilities.class';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-grievance-costs',
  templateUrl: './grievance-costs.component.html',
  styleUrls: ['./grievance-costs.component.css']
})
export class GrievanceCostsComponent implements OnInit, OnDestroy {
  costDetForm!: FormGroup;
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  textMessageClass: string = "";
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80, resizable: true, },
  { field: "prodCode", headerName: "Code", sortable: true, filter: true, resizable: true, hide: true },
  { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, width: 200, },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, width: 100 },
  {
    field: "unitRate", headerName: "Rate", sortable: true, filter: true, resizable: true, width: 100, type: 'rightAligned',
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
    field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, width: 100, type: 'rightAligned',
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
    field: "cost", headerName: "Cost", sortable: true, filter: true, resizable: true, width: 100, type: 'rightAligned',
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
  { field: "costTo", headerName: "Cost To", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "costToParty", headerName: "Tenant/LL/Property", sortable: true, filter: true, resizable: true, width: 200 },
  { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, width: 250 },
  ];
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  retMessage: string = "";
  private subsink!: SubSink;
  private grCostCls!: GrievanceCostClass;
  uom: string = "";
  prodCode: any;
  returnMsg: string = "";

  dialogOpen = false;
  partyName!: string;
  dataFlag: boolean = false;
  costToList = [
    { itemCode: "PROPERTY", itemName: "Property" },
    { itemCode: "LANDLORD", itemName: "Landlord" },
    { itemCode: "TENANT", itemName: "Tenant" }
  ]
  constructor(private fb: FormBuilder, private utilityService: UtilitiesService, public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, tranNo: string, status: string,
      complaintType: string, unit: string, block: string, complaint: string,
      tenant: string, priority: string, complaintTypeName: string, property: string
    }, private userDataService: UserDataService) {
    this.costDetForm = this.formInit();
    this.subsink = new SubSink();
    this.grCostCls = new GrievanceCostClass();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.slNum = event.data.slNo;
    this.uom = event.data.uom;
    this.prodCode = event.data.prodCode;
    this.partyName = event.data.costToParty;
    this.costDetForm.patchValue({
      prodName: event.data.prodName,
      rate: event.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      quantity: event.data.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      amount: event.data.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      costTo: event.data.costTo,
    });
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  ngOnInit(): void {
    this.loadData(this.data.tranNo, false);
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  loadData(tarnNo: string, loadFlag: boolean) {
    const costBody = {
      ...this.commonParams(),
      tranNo:tarnNo,
      issueStatus: this.data.status
    }
    try {
      this.subsink.sink = this.utilityService.GetGrievanceCosts(costBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
          if (loadFlag && this.data.mode != "Delete" && this.slNum === 0) {
            const maxSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
              return Math.max(maxSlNo, currentItem.slNo);
            }, 0);
            console.log('Max slNo:', maxSlNo);
            this.slNum = maxSlNo;
          }
          else if (loadFlag && this.data.mode === "Delete" && this.slNum != 0) {
            this.addRecord();
            this.retMessage = this.returnMsg;
            this.textMessageClass = "green";
          }
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

  formInit() {
    return this.fb.group({
      prodName: ['', Validators.required],
      rate: [0.00, Validators.required],
      quantity: [0, Validators.required],
      amount: [0.00, Validators.required],
      costTo: ['', Validators.required],
    })
  }

  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: "PRODUCT",
      Item: this.costDetForm.controls['prodName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subsink.sink = this.utilityService.GetNameSearchCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != "FAIL") {
        if (res.data.nameCount === 1) {
          this.costDetForm.controls['prodName'].patchValue(res.data.selName);
          this.prodCode = res.data.selCode;
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.costDetForm.controls['prodName'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            this.prodCode = result.prodCode;
            this.costDetForm.controls['prodName'].patchValue(result.prodName);
            this.costDetForm.controls['rate'].patchValue(result.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            this.uom = result.uom;
          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }

  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  prepareGrvCls() {
    const formValues = this.costDetForm.value;
    this.grCostCls.company = this.userDataService.userData.company;
    this.grCostCls.location = this.userDataService.userData.location;
    this.grCostCls.refNo = this.userDataService.userData.sessionID;
    this.grCostCls.user = this.userDataService.userData.userID;
    this.grCostCls.langId = this.userDataService.userData.langId;
    this.grCostCls.tranNo = this.data.tranNo;
    this.grCostCls.slNo = this.slNum
    this.grCostCls.prodCode = this.prodCode;
    this.grCostCls.uom = this.uom;
    this.grCostCls.unitRate = parseFloat(this.costDetForm.controls['rate'].value.toString().replace(',', '')); //formValues.rate;
    this.grCostCls.quantity = parseFloat(this.costDetForm.controls['quantity'].value.toString().replace(',', '')); //formValues.quantity;
    this.grCostCls.cost = parseFloat(this.costDetForm.controls['amount'].value.toString().replace(',', '')); //formValues.amount;
    this.grCostCls.costTo = formValues.costTo;;
    this.grCostCls.notes = "";
    this.grCostCls.mode = this.data.mode;
  }
  update() {
    if (this.costDetForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareGrvCls();
        this.subsink.sink = this.utilityService.UpdateGrievanceCosts(this.grCostCls).subscribe((res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.dataFlag = true;
            this.loadData(res.tranNoNew, true);
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        })
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }

  addRecord() {
    this.costDetForm = this.formInit();
    this.slNum = 0;
    this.textMessageClass = "";
    this.retMessage = "";
  }
  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "EMPLOYEE",
      item: this.costDetForm.controls['party'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subsink.sink = this.utilityService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL") {
          if (res.data.nameCount === 1) {
            this.costDetForm.controls['party'].patchValue(res.data.selName);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.costDetForm.controls['party'].value, 'PartyType': "EMPLOYEE",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.costDetForm.controls['party'].patchValue(result.partyName);

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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  onUnitRateChanged() {
    let numQty: number;
    let numRate: number;
    let uRate = this.costDetForm.controls['rate'].value.toString();
    let strQty = this.costDetForm.controls['quantity'].value.toString();

    if (uRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }

    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));
    numRate = Number(uRate.replace(/,(?=\d*\.\d*)/g, ''));
    let amount = numRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.costDetForm.controls['rate'].patchValue(numRate.toLocaleString(undefined, options));
    this.costDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));

  }

  onQuantityChanged() {
    let numQty: number;
    let uRate = this.costDetForm.controls['rate'].value;
    if (uRate == '') {
      return;
    }
    let strQty: string = this.costDetForm.controls['quantity'].value;
    if (strQty == '') {
      return;
    }
    let lastLetter: string = strQty.charAt(strQty.length - 1);
    if (lastLetter == ".") {
      return;
    }
    else if (strQty.includes(".")) {
      strQty = strQty.replace(new RegExp(",", 'g'), '');
      numQty = Number(strQty);
    }
    else {
      numQty = Number(strQty.replace(/,/g, ''));
    }
    let amount = uRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.costDetForm.controls['quantity'].patchValue(numQty.toLocaleString());
    this.costDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }

  onAmountChanged() {
    let numAmount: number;
    let qty = this.costDetForm.controls['quantity'].value.toString();
    let strAmount = this.costDetForm.controls['amount'].value.toString();
    if (qty == "") {
      return;
    }
    if (strAmount == "") {
      return;
    }
    numAmount = Number(strAmount.replace(/,(?=\d*\.\d*)/g, ''));
    let numQty = Number(qty.replace(/,(?=\d*\.\d*)/g, ''));
    let uRate = numAmount / numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.costDetForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
    this.costDetForm.controls['rate'].patchValue(uRate.toLocaleString());

  }

  onQuantityFocusOut() {
    let numQty: number;
    let numRate: number;
    let uRate = this.costDetForm.controls['rate'].value.toString();
    let strQty = this.costDetForm.controls['quantity'].value.toString();
    if (uRate == "") {
      return;
    }
    if (strQty == "") {
      return;
    }
    numRate = Number(uRate.replace(/,(?=\d*\.\d*)/g, ''));
    numQty = Number(strQty.replace(/,(?=\d*\.\d*)/g, ''));
    let amount = numRate * numQty;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    let options1: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    this.costDetForm.controls['quantity'].patchValue(numQty.toLocaleString(undefined, options1));
    this.costDetForm.controls['amount'].patchValue(amount.toLocaleString(undefined, options));
  }

  add() {
    this.textMessageClass = "";
    this.retMessage = "";
    this.slNum = 0;
    this.costDetForm = this.formInit();
    this.uom = "";
  }

  Delete() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.update();
      }
    });
  }
}
