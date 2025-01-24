import { AdminService } from 'src/app/Services/admin.service';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterParams } from 'src/app/modals/masters.modal';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SubSink } from 'subsink';
import { BranchClass } from '../../admin.class';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { BranchLocationsResponse, getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { animate, style, transition, trigger } from '@angular/animations';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, TextClr } from 'src/app/utils/enums';

@Component({
  selector: 'app-branches',
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.css'],
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }), // Start off-screen to the right
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })) // Slide in to center
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' })) // Slide out to the left
      ])
    ])
  ]
})
export class BranchesComponent implements OnInit, OnDestroy {
  retMessage: string = "";
  masterParams!: MasterParams;
  textMessageClass: string = "";
  bDetForm!: FormGroup;
  locations: Item[] = [];
  displayColumns: string[] = [];
  private subSink: SubSink;
  private branchCls!: BranchClass;
  public srNum: number = 0;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  submitted: boolean = false;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "locnName", headerName: "Property", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "branchLocn", headerName: "Location", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "address1", headerName: "Address1", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "address2", headerName: "Address2", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "pO_PIN_ZIP", headerName: "PO PIN", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "city", headerName: "City", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "country", headerName: "Country", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "phone1", headerName: "Phone", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "phone2", headerName: "Phone2", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "phone3", headerName: "Phone3", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "eMail", headerName: "email", sortable: true, filter: true, resizable: true, width: 150 },
  { field: "currStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 150 },

  { field: "fax", headerName: "Fax", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "pinNo", headerName: "Pin No", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "webSite", headerName: "Web Site", sortable: true, filter: true, resizable: true, width: 150, hide: true },
  { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, width: 150, hide: true }
  ];
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, company: string, title: string },
    private adminService: AdminService, private loader: NgxUiLoaderService) {
    this.bDetForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.branchCls = new BranchClass();

  }
  formInit() {
    return this.fb.group({
      branchLocn: ['', [Validators.required]],
      address1: ['', [Validators.required, Validators.maxLength(50)]],
      address2: ['', [Validators.required, Validators.maxLength(50)]],
      address3: [''],
      pO_PIN_ZIP: ['', [Validators.required, Validators.maxLength(15)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      province: ['', [Validators.required, Validators.maxLength(50)]],
      country: ['', [Validators.required, Validators.maxLength(50)]],
      phone1: ['', [Validators.required, Validators.maxLength(18)]],
      phone2: [''],
      phone3: [''],
      fax: [''],
      eMail: ['', [Validators.required, , Validators.email, Validators.maxLength(50),
      Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      currStatus: [{ value: "Open", disabled: true }],
      notes: [''],
      pinNo: ['', [Validators.maxLength(50)]],
      webSite: ['', [Validators.maxLength(100)]],
    });
  }
  ngOnDestroy() {
    this.subSink.unsubscribe();
  }
  ngOnInit() {
    this.loadData();
    if(this.data.company){
      this.getBranchListData(this.data.company);
    }
  }

  loadData() {
    const lcnbody:getPayload = {
      ...this.commonParams(),
      company:this.data.company,
      item: Items.LOCATION,
      mode:this.data.mode
    };
    try {
      this.subSink.sink = this.adminService.GetMasterItemsList(lcnbody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.locations = res.data;
          if (this.locations.length === 1) {
            this.bDetForm.controls['branchLocn'].patchValue(this.locations[0].itemCode, { emitEvent: false })
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  };
  hanldeError(res: any) {
    this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
  }
  get f() { return this.bDetForm.controls; }
  prepareBranchCls() {
    const formControls = this.bDetForm.controls;
    this.branchCls = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID,
      mode: this.data.mode,
      address1: formControls.address1.value,
      address2: formControls.address2.value,
      address3: formControls.address3.value,
      branchLocn: formControls.branchLocn.value,
      city: formControls.city.value,
      country: formControls.country.value,
      currStatus: formControls.currStatus.value,
      eMail: formControls.eMail.value,
      fax: formControls.fax.value,
      notes: formControls.notes.value,
      pO_PIN_ZIP: formControls.pO_PIN_ZIP.value,
      phone1: formControls.phone1.value,
      phone2: formControls.phone2.value,
      phone3: formControls.phone3.value,
      pinNo: formControls.pinNo.value,
      province: formControls.province.value,
      webSite: formControls.webSite.value,
      slNo: this.srNum
    };
  }
 async onSubmit() {
    this.clearMsgs();
    this.submitted = true;
    if (this.bDetForm.invalid) {
      this.displayMessage(displayMsg.ERROR + 'Enter Required Fields', TextClr.red);
      return;
    }
    else {
      this.prepareBranchCls();
      this.loader.start();
      this.subSink.sink = await this.adminService.UpdateBranchDetails(this.branchCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.retVal > 100 && res.retVal < 200) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          this.getBranchListData(this.data.company);
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async getBranchListData(companyID: string) {
    this.rowData =[];
    const body:getPayload = {
      ...this.commonParams(),
      item: companyID,
    };
    try {
      this.subSink.sink = await this.adminService.GetBranchList(body).subscribe((res: BranchLocationsResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  clearMsgs() {
   this.displayMessage('', '');
  }
  Add() {
    this.bDetForm.clearValidators();
    this.bDetForm.reset();
    this.bDetForm = this.formInit();
    this.clearMsgs();
    this.srNum = 0;
    this.submitted = false;
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
  onRowClick(row: any) {
    this.displayMessage('', '');
    this.bDetForm.patchValue(row);
    this.srNum = row.slNo;
  }
  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
}
