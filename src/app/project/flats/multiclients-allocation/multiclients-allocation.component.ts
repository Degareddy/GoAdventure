import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { multiClients } from '../../Project.class';
import { displayMsg, Items, Mode, TextClr, TranStatus, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-multiclients-allocation',
  templateUrl: './multiclients-allocation.component.html',
  styleUrls: ['./multiclients-allocation.component.css']
})
export class MulticlientsAllocationComponent implements OnInit, OnDestroy {
  mulitClientsForm!: FormGroup;
  slNum = 0;
  retMessage: string = "";
  textMessageClass: string = "";
  today: Date = new Date();
  private subSink: SubSink = new SubSink();
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  isHundredPercent: number = 0;
  rowData: any = [];
  dialogOpen: boolean = false;
  landlordCode: string = "";
  private multiCls: multiClients = new multiClients();
  columnDefs: any = [
    { field: "slNo", headerName: "slNo", width: 70 },
    { field: "landlordName", headerName: "Landlord", sortable: true, filter: true, resizable: true, width: 180, },

    {
      field: "share", headerName: "Share", resizable: true, flex: 1, type: 'rightAligned',
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
      field: "dateJoined", headerName: "Joined Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },
    {
      field: "dateLeft", headerName: "Left Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },
    {
      field: "llStatus",
      headerName: "Status",
      sortable: true,
      filter: true,
      resizable: true,
      width: 180,
      cellStyle: (params: any) => {
        if (params.value === 'Deleted') {
          return { color: 'red' };
        }
        return { color: 'green' };
      }
    },

  ];
  constructor(protected router: Router,
    private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private projService: ProjectsService, private utlService: UtilitiesService,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, Trantype: string,
      Property: string, Block: string, Flat: string, type: string, status: string
    }) {
    this.mulitClientsForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      dateLeft: [new Date(), Validators.required],
      joinDate: [new Date(), Validators.required],
      share: ['0', Validators.required],
      landlord: ['']
    })
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.displayMessage('', '');
    this.landlordCode = event.data.landlord;
    this.mulitClientsForm.patchValue({
      landlord: event.data.landlordName,
      joinDate: event.data.dateJoined,
      dateLeft: event.data.dateLeft,
      share: event.data.share,
    }, { emitEvent: false });
    this.slNum = event.data.slNo;
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  ngOnDestroy(): void {

  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  private createRequestDataForSearch(item: string, type: string) {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }
  ngOnInit(): void {
    this.getmultiClientDate(this.data.Property, this.data.Block, this.data.Flat);
  }
  async searchParty() {
    const body = this.createRequestDataForSearch(this.mulitClientsForm.get('landlord')!.value || "", Items.LANDLORD);
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.mulitClientsForm.get('landlord')!.patchValue(res.data.selName);
            this.landlordCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.mulitClientsForm.get('landlord')!.value, PartyType: Items.LANDLORD,
                  search: 'Landlord Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.mulitClientsForm.get('landlord')!.patchValue(result.partyName);
                  this.landlordCode = result.code;
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
  _isHundredPercent() {
    if (this.isHundredPercent !== 100) {
      this.displayMessage("Please ensure the total share is exactly 100.", "red");
    } else {
      this.dialog.closeAll();
    }
  }
  onSubmit(mode: any): void {
    if (!this.landlordCode) {
      this.displayMessage("Enter Landlord", "red");
      return;
    }
    if (this.mulitClientsForm.invalid) {
      this.displayMessage("Enter required fields", "red");
      return;
    }
    this.prepareCls(mode);
    try {
      this.loader.start();
      let serviceCall$;
      if (this.data.mode.toUpperCase() === Mode.Modify) {
        serviceCall$ = this.projService.UpdateUnitLandlordDetails(this.multiCls);
      } else if (this.data.mode.toUpperCase() === Mode.Delete) {
        serviceCall$ = this.projService.UpdateUnitLandlordDetails(this.multiCls);
      } else {
        this.displayMessage("Invalid mode", "red");
        this.loader.stop();
        return;
      }
      this.subSink.sink = serviceCall$.subscribe({
        next: (res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            if (this.data.mode.toUpperCase() === Mode.Modify) {
              this.getmultiClientDate(this.data.Property, this.data.Block, this.data.Flat);
            }
          } else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        },
        error: (err: any) => {
          this.loader.stop();
          this.displayMessage(`Error: ${err.message || 'An unexpected error occurred'}`, "red");
        }
      });
    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  getmultiClientDate(property: string, block: string, flat: string) {
    const body = {
      ...this.commonParams(),
      PropCode: property,
      BlockCode: block,
      UnitCode: flat
    }
    try {
      this.loader.start();
      this.subSink.sink = this.projService.GetUnitLandlords(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          this.rowData = res['data'];
          this.isHundredPercent = 0;
          res.data.forEach((item: any) => {
            if (item.llStatus.toUpperCase() === TranStatus.OPEN) {
              this.isHundredPercent += parseFloat(item.share) || 0.0;
            }
          });

        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.ERROR + ex.message, TextClr.red);
    }
  }
  prepareCls(mode: any) {
    this.multiCls.property = this.data.Property;
    this.multiCls.block = this.data.Block;
    this.multiCls.unitId = this.data.Flat;
    this.multiCls.landlord = this.landlordCode;
    this.multiCls.share = this.mulitClientsForm.get('share')!.value;
    this.multiCls.mode = mode;
    this.multiCls.llStatus = "";
    if (this.data.mode.toUpperCase() === Mode.Delete) {
      this.multiCls.dateLeft = this.mulitClientsForm.get('dateLeft')!.value;
      this.multiCls.llStatus =Mode.Delete;
    }
    if (this.data.mode.toUpperCase() === Mode.Modify) {
      this.multiCls.dateJoined = this.mulitClientsForm.get('joinDate')!.value;
      this.multiCls.llStatus = TranStatus.OPEN;
    }
    this.multiCls.company = this.userDataService.userData.company;
    this.multiCls.location = this.userDataService.userData.location;
    this.multiCls.user = this.userDataService.userData.userID;
    this.multiCls.refNo = this.userDataService.userData.sessionID;
  }
  newItem() {
    this.mulitClientsForm = this.formInit();
    this.slNum = 0;
    this.landlordCode = "";
    this.displayMessage("", "");
  }
}
