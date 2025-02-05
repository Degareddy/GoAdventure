import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AssetsService } from 'src/app/Services/assets.service';
import { SubSink } from 'subsink';
import { SearchPartyComponent } from '../search-party/search-party.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, Items, TextClr, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-search-asset',
  templateUrl: './search-asset.component.html',
  styleUrls: ['./search-asset.component.css']
})
export class SearchAssetComponent implements OnInit, OnDestroy {
  searchName!: string;
  textMessageClass!: string;
  retMessage!: string;
  dialogOpen = false;
  groupList!: any[];
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  assetSearchForm!: FormGroup;
  assetLocationList!: any[];
  private subSink: SubSink;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [
    { field: "assetId", headerName: "Asset Id", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "assignedSlNo", headerName: "AssignedSlNo", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "assetDesc", headerName: "AssetDesc", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "assetLocn", headerName: "Location", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "supplier", headerName: "Supplier", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "custodian", headerName: "Custodian", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "make", headerName: "Make", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "model", headerName: "Model", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "assetStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 }
  ];

  constructor(private fb: FormBuilder,
    private loader: NgxUiLoaderService,
    public dialog: MatDialog,
    private userDataService: UserDataService,
    protected assetsearchService: AssetsService,
    private dialogRef: MatDialogRef<SearchAssetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { search: string, tranNo: string, type: string, asset: string, supplier: string, custodian: string },
    protected assetdtService: AssetsService) {
    this.assetSearchForm = this.formInIt();
    this.subSink = new SubSink();

  }

  formInIt() {
    return this.fb.group({
      groupID: [''],
      assignedSlNo: [''],
      assetDesc: [''],
      assetLocn: [''],
      supplier: [''],
      custodian: [''],

    })
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async ngOnInit() {
    const groupbody = {
      ...this.commonParams(),
      Item: Items.ASSETGROUP
    }
    const locationbody = {
      ...this.commonParams(),
      Item: Items.BRANCHES
    };
    const service1 = this.assetdtService.GetMasterItemsList(groupbody);
    const service2 = this.assetdtService.GetMasterItemsList(locationbody);
    this.loader.start();
    this.subSink.sink = await forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        console.log(results);
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.groupList = res1.data;

        } else {
          this.displayMessage(displayMsg.ERROR + "Group list empty!", TextClr.red);
        }

        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.assetLocationList = res2.data;


        } else {
          this.displayMessage(displayMsg.ERROR + "Location list empty!", TextClr.red);
        }
      },

      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );
    this.searchName = this.data.search;
    this.search();
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
  async onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.USER,
      item: this.assetSearchForm.controls['custodian'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = await this.assetdtService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          if (res.data.nameCount === 1) {
            this.assetSearchForm.controls['custodian'].patchValue(res.data.selName);
          }
          else {
            this.openSearch();
          }
        }
        else {
          this.openSearch();
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  openSearch(){
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: this.assetSearchForm.controls['custodian'].value, PartyType: Type.USER,
          search: 'Employee Search'
        }
      });
      this.dialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        if (result != true && result != undefined) {
          this.assetSearchForm.controls['custodian'].setValue(result.partyName);
        }
        this.dialogOpen = false;
      });
    }
  }

  async onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.SUPPLIER,
      item: this.assetSearchForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = await this.assetdtService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          if (res.data.nameCount === 1) {
            this.assetSearchForm.controls['supplier'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  tranNum: this.assetSearchForm.controls['supplier'].value, PartyType: Type.SUPPLIER,
                  search: 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result !=true && result != undefined){
                  this.assetSearchForm.controls['supplier'].setValue(result.partyName);
                }
                this.dialogOpen = false;
              });
            }

          }
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

  async search() {
    const body = {
      ...this.commonParams(),
      AssignedSlNo: this.assetSearchForm.controls['assignedSlNo'].value,
      Party: Type.ASSET,
      supplier: this.data.supplier || "",
      custodian: this.data.custodian || "",
      AssetGroup: this.assetSearchForm.controls['groupID'].value,
      AssetDesc: this.assetSearchForm.controls['assetDesc'].value,
      AssetLocn: this.assetSearchForm.controls['assetLocn'].value

    }
    try {
      this.loader.start();
      this.subSink.sink = await this.assetsearchService.GetAssetSearch(body).subscribe((res: any) => {
        console.log(res['data']);
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
        else {
          this.rowData = res['data'];
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  clear() {
    this.assetSearchForm = this.formInIt();
    this.displayMessage("","");

  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowClick(row: any) {
    this.dialogRef.close(row);
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
}
