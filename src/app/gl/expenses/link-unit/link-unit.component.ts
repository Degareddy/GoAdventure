import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { lang } from 'moment';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-link-unit',
  templateUrl: './link-unit.component.html',
  styleUrls: ['./link-unit.component.css']
})
export class LinkUnitComponent implements OnInit, OnDestroy {
  linkUnitForm!: FormGroup;
  props!: any[];
  blocks!: any[];
  flats!: any[];
  retMessage!: string;
  textMessageClass!: string;
  private subSink: SubSink;
  masterParams!: MasterParams;
  columnDefs: any = [
    { field: "slNo", headerName: "S.No", width: 80 },
    { field: "item", headerName: "Item", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "itemDesc", headerName: "Item Desc", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "property", headerName: "PropertyId", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "block", headerName: "BlockId", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "unit", headerName: "unitId", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "propertyName", headerName: "Property", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, flex: 1, },
    { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, flex: 1, },
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
    { field: "allocStatus", headerName: "Status", sortable: true, resizable: true, flex: 1 }
  ];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  rowData: any = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  slNum: number = 0;
  constructor(private masterService: MastersService, private loader: NgxUiLoaderService, private fb: FormBuilder, private projService: ProjectsService,
    private userDataService: UserDataService, @Inject(MAT_DIALOG_DATA) public data: { tranNo: string, slNo: number, mode: string, tranType: string }) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.linkUnitForm = this.formInit();
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    // console.log(event.data);
    if(event.data.block){
      this.onSelectedBlockChanged();
    }
    this.slNum = event.data.slNo;
    this.linkUnitForm.patchValue({
      property: event.data.property || '',
      block: event.data.block || '',
      unit: event.data.unitName || '',
      item: event.data.item,
      itemDesc: event.data.itemDesc,
      amount: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    })
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      property: ['', Validators.required],
      block: ['', Validators.required],
      unit: ['', Validators.required],
      amount: ['0.00', Validators.required],
      remarks: [''],
      item: ['', Validators.required],
      itemDesc: ['', Validators.required],
    })
  }
  ngOnInit(): void {
    this.loadData();
    // console.log(this.data);
    if (this.data.tranNo) {
      this.GetExpenseUnitDetails(this.data.tranNo);
    }
  }
  GetExpenseUnitDetails(trano: string) {
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      tranNo: trano,
      refNo: this.userDataService.userData.sessionID,
      tranType: this.data.tranType,
      langId: this.userDataService.userData.langId
    }
    try {
      this.loader.start();
      this.subSink.sink = this.projService.GeLinkedTranUnits(body).subscribe((res: any) => {
        this.loader.stop();
        if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
          this.displayMessage("Success: " + res.message, "green");
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  onSubmit() {
    this.displayMessage("", "");
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      tranNo: this.data.tranNo,
      refNo: this.userDataService.userData.sessionID,
      SlNo: this.slNum,
      property: this.linkUnitForm.controls.property.value,
      block: this.linkUnitForm.controls.block.value,
      unit: this.linkUnitForm.controls.unit.value,
      mode: this.data.mode,
      item: this.linkUnitForm.controls.item.value,
      itemDesc: this.linkUnitForm.controls.itemDesc.value,
      amount: parseFloat(this.linkUnitForm.controls.amount.value ? this.linkUnitForm.controls.amount.value.replace(/,/g, '') : '0'),
      remarks: this.linkUnitForm.controls.remarks.value,
      langId: this.userDataService.userData.langId,
      tranType: this.data.tranType
    }
    // parseFloat(formValues.amount ? formValues.amount.replace(/,/g, '') : '0');
    try {
      this.loader.start();
      this.subSink.sink = this.projService.UpdateLinkUnitsAndTransactionsDetails(body).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.GetExpenseUnitDetails(this.data.tranNo);
          this.displayMessage("Success: " + res.message, "green");
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
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
      item: 'PROPERTY',
      refNo: this.userDataService.userData.sessionID
    };
    try {
      this.loader.start();
      const property$ = this.masterService.GetMasterItemsList(propertybody);
      this.subSink.sink = forkJoin([property$]).subscribe(
        ([propRes]: any) => {
          this.loader.stop();
         
        },
        error => {
          this.displayMessage("Error: " + error.message, "red");
        }
      );

    } catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  onSelectedPropertyChanged() {
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.linkUnitForm.controls['property'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.blocks = result['data'];
          if (this.blocks.length === 1) {
            // this.linkUnitForm.controls['block'].patchValue("ALL");
            this.onSelectedBlockChanged();
          }
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
  onSelectedBlockChanged() {
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.linkUnitForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.linkUnitForm.controls['block'].value;
    if (this.linkUnitForm.controls['block'].value != "ALL") {
      try {
        this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
          if (result.status.toUpperCase() === "SUCCESS") {
            this.flats = result['data'];
            if (this.flats.length === 1) {
              this.linkUnitForm.controls['unit'].patchValue(this.flats[0].itemCode);
            }
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

  }
}
