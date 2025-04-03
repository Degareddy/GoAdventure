import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatDialogRef } from '@angular/material/dialog';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { InventoryService } from 'src/app/Services/inventory.service';
import { forkJoin } from 'rxjs';
import { productSearchClass } from '../../layouts/productSearch';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { Item } from '../Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, Items, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-search-product',
  templateUrl: './search-product.component.html',
  styleUrls: ['./search-product.component.css']
})
export class SearchProductComponent implements OnInit, OnDestroy {
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";

  columnDefs: any = [
    { field: "groupName", headerName: "Group Name", sortable: true, filter: true, resizable: true, width: 150 },
    { field: "prodCode", headerName: "Code", sortable: true, filter: true, resizable: true, width: 100 },
    { field: "prodName", headerName: "Name", sortable: true, filter: true, resizable: true, width: 250 },
    { field: "uom", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 80 },
    { field: "stdPurRate", headerName: "Unit Rate", sortable: true, filter: true, resizable: true, width: 120 },
    { field: "vatType", headerName: "VAT", sortable: true, filter: true, resizable: true, width: 80 },
    { field: "vatRate", headerName: "VAT Rate", sortable: true, filter: true, resizable: true, width: 100 },
    { field: "prodStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 120 },

  ];

  SearchProductForm!: FormGroup;
  textMessageClass!: string;
  retMessage!: string;
  modeIndex!: number;
  tranStatus: any = ['Any', 'Closed', 'Authorized', 'Open', 'Deleted']
  masterParams!: MasterParams;
  productCls!: productSearchClass;
  dataSource: any;
  //amcType!: any[];
  tranNo!: any[];
  searchName!: string;
  displayColumns: string[] = [];
  productGroupList: Item[] = [];
  UOMList: Item[] = [];
  private subSink!: SubSink;

  selectedRowIndex: number = -1;
  constructor(protected utlService: UtilitiesService, private fb: FormBuilder, private invService: InventoryService,
    private dialogRef: MatDialogRef<SearchProductComponent>, private userDataService: UserDataService,

    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.productCls = new productSearchClass();
    this.SearchProductForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.searchName = this.data.search;
    if (this.data.tranNum) {
      this.SearchProductForm.controls['name'].setValue(this.data.tranNum);
    }
    this.laodData();
    this.search();
  }
  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
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
  async laodData() {

    const groupbody = {
      ...this.commonParams(),
      Item: Items.PRODUCTGROUP

    };

    const uombody = {
      ...this.commonParams(),
      Item: Items.UOM
    };
    const service1 = this.invService.GetMasterItemsList(groupbody);
    const service2 = this.invService.GetMasterItemsList(uombody);
    this.subSink.sink = await forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.productGroupList = res1.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR + " Product group list empty!", TextClr.red);
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.UOMList = res2.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + " UOM list empty!", TextClr.red);
        }
      },
      (error: any) => {
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  formInit() {
    return this.fb.group({
      name: [''],
      group: ['ANY'],
      type: ['ANY'],
      uom: [''],
    });
  }
  async search() {

    if (this.SearchProductForm.invalid) {
      return
    }
    else {
      this.productCls.Company = this.userDataService.userData.company;
      this.productCls.Location = this.userDataService.userData.location;
      this.productCls.GroupCode = this.SearchProductForm.controls['group'].value;
      this.productCls.ProdName = this.SearchProductForm.controls['name'].value;
      this.productCls.ProdStatus = TranStatus.ANY;
      this.productCls.ProdType = this.SearchProductForm.controls['type'].value;
      this.productCls.UOM = this.SearchProductForm.controls['uom'].value;
      this.productCls.RefNo = this.userDataService.userData.sessionID;
      this.productCls.User = this.userDataService.userData.userID;
      try {
        this.subSink.sink = await this.utlService.GetProductSearchList(this.productCls).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else {
            this.rowData = res['data'];
            this.exportTmp = false;
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }


  onRowClick(row: any) {
    this.dialogRef.close(row);
    console.log(row)
  }
  clear() {
    this.SearchProductForm.reset()
    this.SearchProductForm = this.formInit();
    this.displayMessage("", "");
    this.rowData = [];
  }
}
