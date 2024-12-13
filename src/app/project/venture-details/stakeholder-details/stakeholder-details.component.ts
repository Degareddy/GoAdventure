import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { multiClients, stakeHolder } from '../../Project.class';
import { Router } from '@angular/router';
import { UserDataService } from 'src/app/Services/user-data.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';

@Component({
  selector: 'app-stakeholder-details',
  templateUrl: './stakeholder-details.component.html',
  styleUrls: ['./stakeholder-details.component.css']
})
export class StakeholderDetailsComponent implements OnInit {

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
  rowData: any = [];
  dialogOpen: boolean = false;
  stakeHolderCode: string = "";
  private multiCls: multiClients = new multiClients();
  private stakeMulClass: stakeHolder = new stakeHolder();
  columnDefs: any = [
    { field: "slNo", headerName: "slNo", width: 70 },
    // { field: "tranNo", headerName: "Tran No", resizable: true, flex: 1 },
    { field: "name", headerName: "Stake Holder", sortable: true, filter: true, resizable: true, width: 180, },
    
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
    // {
    //   field: "dateLeft", headerName: "Left Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
    //     // Format date as dd-MM-yyyy
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
    {
      field: "stakeStatus",
      headerName: "Staker Status",
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
      Project: string, Code: string, Flat: string, type: string, status: string
    }) {
    this.mulitClientsForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      joinDate: [new Date(), Validators.required],
      position: ['', Validators.required],
      share: ['0', Validators.required],
      stakeHolder: ['',Validators.required],
      remarks:['']
    })
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
    onRowSelected(event: any) {
    this.displayMessage('','');
    this.stakeHolderCode=event.data.landlord;
    this.mulitClientsForm.patchValue({
      landlord:event.data.landlordName,
      
      joinDate:event.data.dateJoined,
      dateLeft:event.data.dateLeft,
      share: event.data.share,
    })
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
    
    this.getstakeHoldersData(this.data.Project, this.data.Code, this.data.Flat);
  }
  async searchParty() {
    
    const body = this.createRequestDataForSearch(this.mulitClientsForm.get('stakeHolder')!.value || "", "STAKER");
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.mulitClientsForm.get('stakeHolder')!.patchValue(res.data.selName);
            this.stakeHolderCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.mulitClientsForm.get('stakeHolder')!.value, 'PartyType': "STAKER",
                  'search': 'Stake Holder Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.mulitClientsForm.get('stakeHolder')!.patchValue(result.partyName);
                this.stakeHolderCode = result.code;
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
 
  
  onSubmit(mode:any) {
    if(this.data.mode === "Modify"){
      if (this.stakeHolderCode === null || this.stakeHolderCode === undefined || this.stakeHolderCode === '') {
        this.displayMessage("Enter Landlord", "red");
        return;
      }
      if (this.mulitClientsForm.invalid) {
        this.displayMessage("Enter required fields", "red");
        return;
      }
      else {
        this.prepareCls(mode);
        try {
          this.loader.start();
          this.subSink.sink = this.projService.UpdateProjectStakersDetails(this.stakeMulClass).subscribe((res: SaveApiResponse) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              this.displayMessage("Success: " + res.message, "green");
              this.getstakeHoldersData(this.data.Project, this.data.Code, this.data.Flat);
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
    }
    else if(this.data.mode === "Delete"){
      if (this.stakeHolderCode === null || this.stakeHolderCode === undefined || this.stakeHolderCode === '') {
        this.displayMessage("Enter Landlord", "red");
        return;
      }
      if (this.mulitClientsForm.invalid) {
        this.displayMessage("Enter required fields", "red");
        return;
      }
      else {
        this.prepareCls(mode);
        try {
          this.loader.start();
          this.subSink.sink = this.projService.UpdateUnitLandlordDetails(this.multiCls).subscribe((res: SaveApiResponse) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              this.displayMessage("Success: " + res.message, "green");
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
    }
    

  }
  getstakeHoldersData(Project: string, block: string, flat: string) {
    const body = {
      ...this.commonParams(),
     Item:this.data.Code
    }
    try {
      this.loader.start();
      this.subSink.sink = this.projService.GetProjectStakersDetails(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.displayMessage( res.message + " : Data Retrived " , "green");
          this.rowData=res['data'];  
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
    this.stakeMulClass.Mode=this.data.mode;
    this.stakeMulClass.Project=this.data.Code;
    this.stakeMulClass.Code='NHL102';
    this.stakeMulClass.Position='';
    this.stakeMulClass.Share=this.mulitClientsForm.get('share')?.value;
    this.stakeMulClass.Remarks='';
    // if(this.data.mode === "Delete"){
    // this.multiCls.dateLeft = this.mulitClientsForm.get('dateLeft')!.value;
    // this.multiCls.llStatus="Delete";
    // }
    if(this.data.mode === "Modify"){
      this.stakeMulClass.DateJoined = this.mulitClientsForm.get('joinDate')!.value;
      this.stakeMulClass.StakeStatus="Open";
    }
    this.stakeMulClass.Company = this.userDataService.userData.company;
    this.stakeMulClass.Location = this.userDataService.userData.location;
    this.stakeMulClass.User = this.userDataService.userData.userID;
    this.stakeMulClass.RefNo= this.userDataService.userData.sessionID;
  }
  newItem() {
   this.mulitClientsForm.get('landlord')?.patchValue('');
   this.mulitClientsForm.get('share')?.patchValue('');
   this.mulitClientsForm.get('joinDate')?.patchValue(new Date());
   this.mulitClientsForm.get('dateLeft')?.patchValue(new Date());
  }
}
