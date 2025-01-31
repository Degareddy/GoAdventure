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
import { Item } from 'src/app/general/Interface/interface';

@Component({
  selector: 'app-multiclients-allocation',
  templateUrl: './multiclients-allocation.component.html',
  styleUrls: ['./multiclients-allocation.component.css']
})
export class MulticlientsAllocationComponent implements OnInit, OnDestroy {
  mulitClientsForm!: FormGroup;
  slNum = 0;
  retMessage: string = "";
  modes: Item[] = [];
  textMessageClass: string = "";
  today: Date = new Date();
  private subSink: SubSink = new SubSink();
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  isHundredPercent:number=0;
  rowData: any = [];
  dialogOpen: boolean = false;
  landlordCode: string = "";
  private multiCls: multiClients = new multiClients();
  columnDefs: any = [
    { field: "slNo", headerName: "slNo", width: 70 },
    // { field: "tranNo", headerName: "Tran No", resizable: true, flex: 1 },
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
        // Format date as dd-MM-yyyy
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
        // Format date as dd-MM-yyyy
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
      cellStyle: (params:any) => {
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
    this.displayMessage('','');
    this.landlordCode=event.data.landlord;
    this.mulitClientsForm.patchValue({
      landlord:event.data.landlordName,
      joinDate:event.data.dateJoined,
      dateLeft:event.data.dateLeft,
      share: event.data.share,
    });
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
    const body = this.createRequestDataForSearch(this.mulitClientsForm.get('landlord')!.value || "", "LANDLORD");
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
                  'PartyName': this.mulitClientsForm.get('landlord')!.value, 'PartyType': "Landlord",
                  'search': 'Landlord Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.mulitClientsForm.get('landlord')!.patchValue(result.partyName);
                this.landlordCode = result.code;
                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          // this.retMessage = res.message;
          // this.textMessageClass = 'red';
          this.displayMessage(res.message,"red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(ex.message,"red");
    }
  }
  _isHundredPercent() {
    if (this.isHundredPercent !== 100) {
      this.displayMessage("Please ensure the total share is exactly 100.", "red");
    } else {
      this.dialog.closeAll(); // Close the dialog explicitly
    }
  }

  // onSubmit(mode:any) {
  //   if(this.data.mode === "Modify"){
  //     if (this.landlordCode === null || this.landlordCode === undefined || this.landlordCode === '') {
  //       this.displayMessage("Enter Landlord", "red");
  //       return;
  //     }
  //     if (this.mulitClientsForm.invalid) {
  //       this.displayMessage("Enter required fields", "red");
  //       return;
  //     }
  //     else {
  //       this.prepareCls(mode);
  //       try {
  //         this.loader.start();
  //         this.subSink.sink = this.projService.UpdateUnitLandlordDetails(this.multiCls).subscribe((res: SaveApiResponse) => {
  //           this.loader.stop();
  //           if (res.status.toUpperCase() === "SUCCESS") {
  //             this.displayMessage("Success: " + res.message, "green");
  //             this.getmultiClientDate(this.data.Property, this.data.Block, this.data.Flat);
  //           }
  //           else {
  //             this.displayMessage("Error: " + res.message, "red");
  //           }
  //         });
  //       }
  //       catch (ex: any) {
  //         this.displayMessage("Exception: " + ex.message, "red");
  //       }
  //     }
  //   }
  //   else if(this.data.mode === "Delete"){
  //     if (this.landlordCode === null || this.landlordCode === undefined || this.landlordCode === '') {
  //       this.displayMessage("Enter Landlord", "red");
  //       return;
  //     }
  //     if (this.mulitClientsForm.invalid) {
  //       this.displayMessage("Enter required fields", "red");
  //       return;
  //     }
  //     else {
  //       this.prepareCls(mode);
  //       try {
  //         this.loader.start();
  //         this.subSink.sink = this.projService.UpdateUnitLandlordDetails(this.multiCls).subscribe((res: SaveApiResponse) => {
  //           this.loader.stop();
  //           if (res.status.toUpperCase() === "SUCCESS") {
  //             this.displayMessage("Success: " + res.message, "green");
  //           }
  //           else {
  //             this.displayMessage("Error: " + res.message, "red");
  //           }
  //         });
  //       }
  //       catch (ex: any) {
  //         this.displayMessage("Exception: " + ex.message, "red");
  //       }
  //     }
  //   }


  // }
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
      if (this.data.mode === "Modify") {
        serviceCall$ = this.projService.UpdateUnitLandlordDetails(this.multiCls);
      } else if (this.data.mode === "Delete") {
        serviceCall$ = this.projService.UpdateUnitLandlordDetails(this.multiCls);
      } else {
        this.displayMessage("Invalid mode", "red");
        this.loader.stop();
        return;
      }
      this.subSink.sink = serviceCall$.subscribe({
        next: (res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage(`Success: ${res.message}`, "green");

            if (this.data.mode === "Modify") {
              this.getmultiClientDate(this.data.Property, this.data.Block, this.data.Flat);
            }
          } else {
            this.displayMessage(`Error: ${res.message}`, "red");
          }
        },
        error: (err: any) => {
          this.loader.stop();
          this.displayMessage(`Error: ${err.message || 'An unexpected error occurred'}`, "red");
        }
      });
    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage(`Exception: ${ex.message}`, "red");
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
        if (res.status.toUpperCase() === "SUCCESS") {
          this.displayMessage( res.message + " : Data Retrived " , "green");
          this.rowData=res['data'];
          this.isHundredPercent=0;
          res.data.forEach((item :any) => {
            if(item.llStatus === 'Open'){
              this.isHundredPercent += parseFloat(item.share) || 0.0;
            }
          });

        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  prepareCls(mode:any) {
    this.multiCls.property = this.data.Property;
    this.multiCls.block = this.data.Block;
    this.multiCls.unitId = this.data.Flat;
    this.multiCls.landlord = this.landlordCode;
    this.multiCls.share = this.mulitClientsForm.get('share')!.value;
    this.multiCls.mode = mode;
    this.multiCls.llStatus = "";
    if(this.data.mode === "Delete"){
    this.multiCls.dateLeft = this.mulitClientsForm.get('dateLeft')!.value;
    this.multiCls.llStatus="Delete";
    }
    if(this.data.mode === "Modify"){
      this.multiCls.dateJoined = this.mulitClientsForm.get('joinDate')!.value;
      this.multiCls.llStatus="Open";
    }
    this.multiCls.company = this.userDataService.userData.company;
    this.multiCls.location = this.userDataService.userData.location;
    this.multiCls.user = this.userDataService.userData.userID;
    this.multiCls.refNo = this.userDataService.userData.sessionID;
  }
  newItem() {
  //  this.mulitClientsForm.get('landlord')?.patchValue('');
  //  this.mulitClientsForm.get('share')?.patchValue('');
  //  this.mulitClientsForm.get('joinDate')?.patchValue(new Date());
  //  this.mulitClientsForm.get('dateLeft')?.patchValue(new Date());
  this.mulitClientsForm = this.formInit();
  this.slNum=0;
  this.landlordCode="";
  }
}
