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
    private dialogRef: MatDialogRef<SearchProductComponent>,private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
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
    //console.log(event.data);
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  commonParams() {
    return {
      company:this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
 async laodData() {
  
    const groupbody = {
      ...this.commonParams(),
      Item: "PRODUCTGROUP"

    };

    const uombody = {
      ...this.commonParams(),
      Item: "UOM"
    };
    const service1 = this.invService.GetMasterItemsList(groupbody);
    const service2 = this.invService.GetMasterItemsList(uombody);
    this.subSink.sink =await forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        this.productGroupList = res1.data;
        this.UOMList = res2.data;
      },
      (error: any) => {
        this.loader.stop();
        // this.toastr.info(error, "Exception");
      }
    );

  }
  formInit() {
    return this.fb.group({
      name: [''],
      group: ['ANY'],
      type: ['ANY'],
      uom: [''],
      // email: ['']
    });
  }
async  search() {
  
    if (this.SearchProductForm.invalid) {
      return
    }
    else {
      this.productCls.Company = this.userDataService.userData.company;
      this.productCls.Location = this.userDataService.userData.location;
      this.productCls.GroupCode = this.SearchProductForm.controls['group'].value;
      this.productCls.ProdName = this.SearchProductForm.controls['name'].value;
      this.productCls.ProdStatus = "ANY";
      this.productCls.ProdType = this.SearchProductForm.controls['type'].value;
      this.productCls.UOM = this.SearchProductForm.controls['uom'].value;
      this.productCls.RefNo = this.userDataService.userData.sessionID;
      this.productCls.User = this.userDataService.userData.userID;
      try {
        this.loader.start();
        this.subSink.sink =await this.utlService.GetProductSearchList(this.productCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "FAIL") {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
            this.rowData =[];
          }
          else {
            this.rowData = res['data'];
            this.exportTmp = false;
            this.textMessageClass = 'green';
            this.retMessage = res.message;
          }
        });
      }
      catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = 'red';
      }
    }
  }
  // search(){

  // }

  onRowClick(row: any) {
    this.dialogRef.close(row);
  }
  clear() {
    this.SearchProductForm.reset()
    this.SearchProductForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
    this.rowData = "";
  }
}
