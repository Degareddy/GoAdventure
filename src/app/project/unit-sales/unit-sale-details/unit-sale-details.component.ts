import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community/dist/lib/main';
import { forkJoin } from 'rxjs';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { unitSalesDetailsClass } from '../../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-unit-sale-details',
  templateUrl: './unit-sale-details.component.html',
  styleUrls: ['./unit-sale-details.component.css']
})
export class UnitSaleDetailsComponent implements OnInit, OnDestroy {
  dataFlag: boolean = false;
  unitSalesForm!: FormGroup;
  props: Item[] = [];
  blocks: Item[] = [];
  masterParams: MasterParams = new MasterParams();
  retMessage: string = "";
  textMessageClass: string = "";
  dialogOpen: boolean = false;
  public slNum: number = 0;
  private subSink: SubSink = new SubSink();
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private unitCls: unitSalesDetailsClass = new unitSalesDetailsClass();
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "prop_VentName", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "flat_PlotName", headerName: "Flat", sortable: true, filter: true, resizable: true, flex: 1, },
  {
    field: "unitRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "discRate", headerName: "Disc Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  { field: "vatRate", headerName: "Vat Rate", sortable: true, filter: true, resizable: true, type: 'rightAligned', flex: 1, hide: true },
  {
    field: "netAmount", headerName: "Net Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  onRowClick: any;
  constructor(private masterService: MastersService, private dialog: MatDialog, private fb: FormBuilder, private loader: NgxUiLoaderService,
    private projectService: ProjectsService, @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNum: string, status: string, search: string },
    private utlService: UtilitiesService, private userDataService: UserDataService) {
    this.unitSalesForm = this.formInit();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  Clear() {
    this.unitSalesForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.refreshData();
  }
  private createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      refNo: this.userDataService.userData.sessionID
    };
  }

  search(tranNo: string) {
    const body = {
      ...this.commonParams(),
      LangId: this.userDataService.userData.langId,
      TranNo: tranNo
    }
    this.subSink.sink = this.projectService.GetFlatPlotSaleDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res['data'];
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.slNum = event.data.slNo;
    this.unitSalesForm.patchValue({
      property: event.data.prop_Vent,
      block: event.data.blockId,
      flat: event.data.flat_Plot,
      unitRate: event.data.unitRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      discRate: event.data.discRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: event.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netRate: event.data.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  formInit() {
    return this.fb.group({
      property: ['', Validators.required],
      block: ['', Validators.required],
      flat: ['', Validators.required],
      unitRate: ['0.00', Validators.required],
      discRate: ['0.00', Validators.required],
      vatRate: ['0.00', Validators.required],
      netRate: ['0.00', Validators.required],
    })
  }
  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const propertyBody = {...this.createRequestData('PROPERTY'),mode:this.data.mode};
    const property$ = this.masterService.GetMasterItemsList(propertyBody);
    this.subSink.sink = forkJoin([property$]).subscribe(([propRes]: any) => {
      this.props = propRes.data;
      if (this.props.length === 1) {
        this.unitSalesForm.get('property')!.setValue(this.props[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    },
      error => {
      }
    );
    this.search(this.data.tranNum);
    this.refreshData();
  }
  prepareUnitDetCls() {
    const formValues = this.unitSalesForm.value;
    this.unitCls.Mode = this.data.mode;
    this.unitCls.SlNo = this.slNum;
    this.unitCls.Company = this.userDataService.userData.company;
    this.unitCls.Location = this.userDataService.userData.location;
    this.unitCls.LangId = this.userDataService.userData.langId;
    this.unitCls.User = this.userDataService.userData.userID;
    this.unitCls.RefNo = this.userDataService.userData.sessionID;
    this.unitCls.Prop_Vent = formValues.property;
    this.unitCls.BlockId = formValues.block;
    this.unitCls.TranNo = this.data.tranNum || "";
    this.unitCls.UnitRate = parseFloat(formValues.unitRate.replace(/,/, ''));
    this.unitCls.DiscRate = parseFloat(formValues.discRate.replace(/,/, ''));
    this.unitCls.VatRate = parseFloat(formValues.vatRate.replace(/,/, ''));
    this.unitCls.NetAmount = parseFloat(formValues.netRate.replace(/,/, ''));
  }
  onSubmit() {
    if (this.unitSalesForm.invalid) {
      return;
    }
    else {
      this.prepareUnitDetCls();
      try {
        this.loader.start();
        this.subSink.sink = this.projectService.UpdateFlatPlotSaleDetails(this.unitCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.retMessage = res.message;
            this.textMessageClass = "green";
            this.search(res.tranNoNew);
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
  refreshData() {
    this.unitSalesForm.get('property')?.valueChanges.subscribe((val: any) => {
      // console.log(val);
      this.onSelectedPropertyChanged();
    });
  }
  onSelectedPropertyChanged() {
    const propertyValue = this.unitSalesForm.controls['property'].value;
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = propertyValue;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe(
        (result: getResponse) => {
          this.blocks = result.data;
          if (this.blocks.length === 1) {
            this.unitSalesForm.get('block')!.setValue(this.blocks[0].itemCode);
          }
        },
        (error: any) => {
        }
      );
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = '';
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onFlatSearch() {
    this.clearMsgs();
    if (this.unitSalesForm.get('flat')!.value == "") {
      // this.flatCode = "";
    }
    const body = {
      ...this.commonParams(),
      Type: 'FLAT',
      Item: this.unitSalesForm.controls['flat'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.unitSalesForm.get('flat')!.patchValue(res.data.selName);
            // this.flatCode = res.data.selCode;
            this.unitCls.Flat_Plot = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'flat': this.unitSalesForm.get('flat')!.value, 'type': 'FLAT',
                  'search': 'Flat Search', property: this.unitSalesForm.get('property')!.value,
                  block: this.unitSalesForm.get('block')!.value,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.unitSalesForm.get('flat')!.patchValue(result.unitName);
                  // this.flatCode = result.unitId;
                  this.unitCls.Flat_Plot = result.unitId;

                }
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
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  onAmountChanged() {
    this.doCalculation();
  }
  doCalculation() {
    console.log('From do calculation');
    let numAmount: number;
    let numDiscRate: number;
    let numDiscAmount: number;
    let numVatRate: number;
    let numVatAmount: number;
    let numNetAmount: number;
    let strAmount = this.unitSalesForm.controls['unitRate'].value.toString();
    let strDiscRate = this.unitSalesForm.controls['discRate'].value.toString();
    let strVatRate = this.unitSalesForm.controls['vatRate'].value.toString();

    if (strAmount == "") {
      return;
    }

    if (strVatRate == "") {
      return;
    }

    if (strDiscRate == "") {
      strDiscRate = '0';
    }

    numAmount = Number(strAmount.replace(',', ''));
    numDiscRate = Number(strDiscRate.replace(',', ''));
    numVatRate = Number(strVatRate.replace(',', ''));

    // if (this.unitSalesForm.controls['discType'].value.toUpperCase() == 'PERCENTAGE') {
    //   numDiscAmount = numAmount * numDiscRate / 100.0;
    // }
    // else {
    //   numDiscAmount = numDiscRate;
    // }

    numVatAmount = (numAmount - strDiscRate) * numVatRate / 100.00;
    numNetAmount = numAmount - strDiscRate + numVatAmount;

    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    this.unitSalesForm.get('unitRate')!.patchValue(numAmount.toLocaleString(undefined, options));
    this.unitSalesForm.get('discRate')!.patchValue(numDiscRate.toLocaleString(undefined, options));
    // this.unitSalesForm.controls['discAmount'].setValue(numDiscAmount.toLocaleString(undefined, options));
    this.unitSalesForm.get('vatRate')!.patchValue(numVatAmount.toLocaleString(undefined, options));
    this.unitSalesForm.get('netRate')!.patchValue(numNetAmount.toLocaleString(undefined, options));
  }
}

