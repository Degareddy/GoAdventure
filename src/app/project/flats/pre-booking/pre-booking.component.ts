import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr, Type } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
export interface preBooking {
  status: string,
  message: string,
  retVal: number,
  data: []
}
@Component({
  selector: 'app-pre-booking',
  templateUrl: './pre-booking.component.html',
  styleUrls: ['./pre-booking.component.css']

})
export class PreBookingComponent implements OnInit, OnDestroy {
  preBookingForm!: FormGroup;
  tenantCode: any;
  private subSink!: SubSink;
  dialogOpen: boolean = false;
  retMessage: string = "";
  @Input() max: any;
  today = new Date();
  textMessageClass: string = "";
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  columnDefs: any = [
    { field: "propertyName", headerName: "Property Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "blockName", headerName: "Block Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "unitName", headerName: "Unit Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "tenantName", headerName: "Tenant Name", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "bookingDate", headerName: "Booking Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
      field: "joiningDate", headerName: "Joining Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
    { field: "bookingStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
  ];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  rowData: any = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: { mode: string, Trantype: string, Property: string, Block: string, Flat: string, type: string, status: string },
    private utlService: UtilitiesService, private userDataService: UserDataService, private loader: NgxUiLoaderService,
    public dialog: MatDialog, private fb: FormBuilder, private projectService: ProjectsService,) {
    this.subSink = new SubSink();
    this.preBookingForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.getUnitHistory();
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  formInit() {
    return this.fb.group({
      tenantName: ['', Validators.required],
      bookingDate: [new Date(), Validators.required],
      joinDate: [new Date(), Validators.required],
      status: ['', Validators.required],
      notes: ['']
    });
  }
  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }
  onSubmit() {
    this.clearMsg();
    if (this.tenantCode) {
      const body = {
        ...this.commonParams(),
        Property: this.data.Property,
        Block: this.data.Block,
        UnitId: this.data.Flat,
        BookingDate: this.formatDate(this.preBookingForm.value.bookingDate),
        JoiningDate: this.formatDate(this.preBookingForm.value.joinDate),
        notes: this.preBookingForm.value.notes,
        BookingStatus: this.preBookingForm.value.status,
        Tenant: this.tenantCode,
        mode: this.data.mode
      }
      try {
        this.loader.start();
        this.subSink.sink = this.projectService.UpdateUnitPreBooking(body).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.handleSuccessMsg(res);
            this.getUnitHistory();
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
    else {
      this.retMessage = "Select Valid Tenant!";
      this.textMessageClass = 'red';
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
  getUnitHistory() {
    const body = {
      ...this.commonParams(),
      PropCode: this.data.Property,
      BlockCode: this.data.Block,
      UnitCode: this.data.Flat,
    }
    try {
      this.subSink.sink = this.projectService.GetUnitPreBookings(body).subscribe((res: preBooking) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
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
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.tenantCode = event.data.tenant,
      this.preBookingForm.patchValue({
        tenantName: event.data.tenantName,
        bookingDate: event.data.bookingDate,
        joinDate: event.data.joiningDate,
        status: event.data.bookingStatus,
        notes: event.data.notes,
      }, { emitEvent: false })
  }
  onTenantSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.TENANT,
      item: this.preBookingForm.controls['tenantName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.preBookingForm.controls['tenantName'].patchValue(res.data.selName);
            this.tenantCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.preBookingForm.controls['tenantName'].value, PartyType: Type.TENANT,
                  search: 'Tenant Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != true && result != undefined){
                  this.preBookingForm.controls['tenantName'].setValue(result.partyName);
                  this.tenantCode = result.code;
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
  handleErrorMsg(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }
  handleSuccessMsg(res: SaveApiResponse) {
    this.retMessage = res.message;
    this.textMessageClass = 'green';
  }
  clearMsg() {
    this.displayMessage('', '');
  }
}


