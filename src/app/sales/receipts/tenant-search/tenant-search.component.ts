import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatDialogRef } from '@angular/material/dialog';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { partySearchClass } from 'src/app/layouts/partySearch';
import { SalesService } from 'src/app/Services/sales.service';
import { MastersService } from 'src/app/Services/masters.service';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-tenant-search',
  templateUrl: './tenant-search.component.html',
  styleUrls: ['./tenant-search.component.css']
})
export class TenantSearchComponent implements OnInit, OnDestroy {
  SearchPartyForm!: FormGroup;
  textMessageClass!: string;
  retMessage!: string;
  tranStatus: any = ['Any', 'Closed', 'Authorized', 'Open', 'Deleted']
  masterParams!: MasterParams;
  partyCls!: partySearchClass;
  dataSource: any;
  tranNo!: any[];
  searchFor!:string;
  searchName!: string;
  private subSink!: SubSink;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [100, 250, 500];
  pageSize = 100;
  public exportTmp: boolean = true;
  public excelName: string = "";
  props: Item[] = [];
  blocks: Item[] = [];
  flats: Item[] = [];
  filteredItemsClientType:Item[]=[
  {itemCode:"Customer",itemName:"Customer"},
  {itemCode:"Vendor",itemName:"Vendor"},
  {itemCode:"Staff",itemName:"Staff"},
]
  columnDefs: any = [
    // { field: "propertyName", headerName: "Property", sortable: true, filter: true, resizable: true, width: 130 },
    // { field: "blockName", headerName: "Block", sortable: true, filter: true, resizable: true, width: 100 },
    // { field: "unit", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 90 },
    // { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, width: 200 },
    // {
    //   field: "balAmount", headerName: "Bal Amount", sortable: true, resizable: true, width: 150, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    //   valueFormatter: function (params: any) {
    //     if (typeof params.value === 'number' || typeof params.value === 'string') {
    //       const numericValue = parseFloat(params.value.toString());
    //       if (!isNaN(numericValue)) {
    //         return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
    //       }
    //     }
    //     return null;
    //   },
    // },
    // {
    //   field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 150, valueFormatter: function (params: any) {
    //     if (params.value) {
    //       const date = new Date(params.value);
    //       const day = date.getDate().toString().padStart(2, '0');
    //       const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //       const year = date.getFullYear();
    //       return `${day}-${month}-${year}`;
    //     }
    //     return null;
    //   },
    // },
    // // { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true,  width:150 },
    // { field: "currency", headerName: "Currency", sortable: true, filter: true, resizable: true, width: 100 },



  ];
  selectedRowIndex: number = -1;
  constructor(protected utlService: UtilitiesService, private saleService: SalesService, private masterService: MastersService,
    private fb: FormBuilder, private dialogRef: MatDialogRef<TenantSearchComponent>, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.partyCls = new partySearchClass();
    this.SearchPartyForm = this.formInit();
    this.subSink = new SubSink();

  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
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

  onRowClick(row: any) {
    this.dialogRef.close(row);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.searchName = this.data.search;
    this.SearchPartyForm.controls['name'].setValue(this.data.PartyName);
  
    // this.loadData();
    // this. search();
  }

  private createRequestData(item: string): any {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: item
    };
  }

  formInit() {
    return this.fb.group({
      name: [''],
      clientType: [''],
      mobile: [''],
      email: [''],
      isSummary: [false]
    });
  }
  loadData() {
    this.rowData = [];
    if (this.data.serData) {
      this.rowData = this.data.serData;
    }
  }
  search() {
    // console.log(this.data);
    const body = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      PartyName: this.SearchPartyForm.controls['name'].value,
      PartyType: this.SearchPartyForm.get('clientType')?.value,
      contact: this.SearchPartyForm.controls['mobile'].value,
      mail: this.SearchPartyForm.controls['email'].value
    }
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.GetPartySearchList(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
          this.rowData = [];
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
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }


  }

  clear() {
    this.SearchPartyForm.reset()
    this.SearchPartyForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
    this.rowData = "";
  }

  onSelectedPropertyChanged(): void {
    // this.clearMsgs();
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.SearchPartyForm.controls.property.value;
    this.masterParams.user = this.userDataService.userData.userID;
    // this.SearchPartyForm.controls.propCode.setValue(this.SearchPartyForm.controls.property.value);
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === 'SUCCESS') {
          this.blocks = result.data;
          if (this.blocks.length === 1) {
            this.SearchPartyForm.get('block')!.setValue(this.blocks[0].itemCode);
            this.onSelectedBlockChanged()
          }
        } else {
          this.handleError(result.message);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex.message);
    }

  }

  handleError(message: any) {
    this.retMessage = message.message;
    this.textMessageClass = "red";
  }

  onSelectedBlockChanged() {
    // this.clearMsgs();
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.SearchPartyForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.SearchPartyForm.controls['block'].value;
    // this.SearchPartyForm.controls['blockCode'].setValue(this.SearchPartyForm.controls['block'].value);
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.flats = result['data'];
        }
        else {
          this.handleError(result.message);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex.message);
    }

  }
}
