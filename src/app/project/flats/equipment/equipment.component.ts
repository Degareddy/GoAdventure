import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { equipmentClass } from '../../Project.class';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  styleUrls: ['./equipment.component.css']
})
export class EquipmentComponent implements OnInit, OnDestroy {
  equipmentForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  retMessage!: string;
  textMessageClass!: string;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  private subSink!: SubSink;
  public srNum: number = 0;
  public assSrnum: number = 0;
  public asset: string = "";
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80, resizable: true, },
  { field: "code", headerName: "Asset No", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "item", headerName: "Asset", sortable: true, filter: true, resizable: true, flex: 1 },
  { field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "rate", headerName: "Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
    field: "amount", headerName: "Value", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  public rowSelection: 'single' | 'multiple' = 'multiple';
  onRowClick: any;
  private invCls: equipmentClass;
  assetData: Item[] = [];

  constructor(private fb: FormBuilder, private masterService: MastersService,
    private projService: ProjectsService, private userDataService: UserDataService,
    protected router: Router, public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, Trantype: string, Property: string, Block: string, Flat: string, type: string, status: string }) {
    this.equipmentForm = this.formInit();
    this.subSink = new SubSink();
    this.invCls = new equipmentClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
    this.calculateValue();
    this.equipmentForm.get('quantity')!.valueChanges.subscribe(() => this.calculateValue());
    this.equipmentForm.get('unitRate')!.valueChanges.subscribe(() => this.calculateValue());
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  assetChange(event: any) {
    this.invCls.item = event.value.itemName;
    this.invCls.assetSlNo = event.value.itemCode;
    this.invCls.asset = event.value.itemCode;
    this.invCls.code = event.value.itemCode;
    this.equipmentForm.controls['assSrnum'].setValue(event.value.itemCode);
  }
  loadData() {
    const serbody = {
      ...this.commonParams(),
      item: 'ASSETS'
    };
    const Sbody$ = this.masterService.GetMasterItemsList(serbody);
    this.subSink.sink = forkJoin([Sbody$]).subscribe(
      ([serRes]: any) => {
        this.assetData = serRes['data'];
      },
      error => {
        this.retMessage = error.message;
        this.textMessageClass = 'red';
      }
    );
    this.getInventoryData(this.data.Flat);
  }
  getInventoryData(flat: string) {
    const body = {
      ...this.commonParams(),
      PropCode: this.data.Property,
      BlockCode: this.data.Block,
      UnitCode: flat,
      ItemType: "Equipment",

    }
    try {
      this.subSink.sink = this.projService.GetUnitEquipmentDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }
  prepareSaveCls() {
    const formValue = this.equipmentForm.value;
    this.invCls.notes = "";
    this.invCls.condition = "Good";
    this.invCls.fixedOn = formValue.fixedOn;
    this.invCls.removedOn = formValue.removedOn;
    this.invCls.expiresOn = formValue.expiresOn;
    this.invCls.propCode = this.data.Property;
    const amount = parseFloat(this.equipmentForm.get('value')!.value?.replace(/,/g, '') || '0');
    const quantity = parseFloat(formValue.quantity);
    const rate = parseFloat(formValue.unitRate.replace(/,/g, ''));
    this.invCls.amount = amount;
    this.invCls.quantity = quantity;
    this.invCls.rate = rate;
    this.invCls.slNo = this.srNum;
    this.invCls.user = this.userDataService.userData.userID;
    this.invCls.mode = this.data.mode;
    this.invCls.company = this.userDataService.userData.company;
    this.invCls.location = this.userDataService.userData.location;
    this.invCls.refNo = this.userDataService.userData.sessionID;
    this.invCls.blockCode = this.data.Block;
    this.invCls.unitCode = this.data.Flat;
    this.invCls.assetSlNo =formValue.assSrnum;
    this.invCls.item =formValue.asset.itemName;
    this.invCls.code =formValue.asset.itemCode;
  }
  onSubmit() {
    this.clearMsg();
    if (this.equipmentForm.invalid) {
      return;
    }
    else {
      this.prepareSaveCls();
      this.loader.start()
      this.subSink.sink = this.projService.UpdateUnitEquipment(this.invCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getInventoryData(res.tranNoNew);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });

    }
  }
  formInit() {
    return this.fb.group({
      assSrnum: [''],
      asset: ['', Validators.required],
      quantity: ['0', Validators.required],
      unitRate: ['0.00', Validators.required],
      value: [{ value: '0.00', disabled: true }],
      fixedOn: [new Date(), Validators.required],
      removedOn: [new Date(), Validators.required],
      expiresOn: [new Date(), Validators.required]
    })
  }
  formatNumber(value: number): string {
    return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
  calculateValue() {
    const quantity = this.equipmentForm.get('quantity')!.value;
    const unitRate = this.equipmentForm.get('unitRate')!.value;
    const result = quantity * unitRate;
    const formattedResult = this.formatNumber(result);
    this.equipmentForm.get('value')!.setValue(formattedResult, { emitEvent: false });
  }

  addNew() {
    this.Clear();
    // this.clearMsg();
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  Clear() {
    this.clearMsg();
    this.assSrnum = 0;
    this.srNum = 0;
    this.asset = "";
    this.equipmentForm = this.formInit();
    this.calculateValue();
    this.equipmentForm.get('quantity')!.valueChanges.subscribe(() => this.calculateValue());
    this.equipmentForm.get('unitRate')!.valueChanges.subscribe(() => this.calculateValue());
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  Close() {
    this.router.navigateByUrl('/home');
  }
  onRowSelected(event: any) {
    console.log(event.data);
    this.srNum = event.data.slNo;
    const selectedAsset = this.assetData.find((asset: any) => asset.itemCode === event.data.code);
    this.equipmentForm.patchValue({
      assSrnum: event.data.code,
      asset: selectedAsset,
      quantity: event.data.quantity,
      unitRate: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      value: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
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
      console.log(dialogResult);
      if (dialogResult) {
        this.onSubmit();
      }
    });
  }
}
