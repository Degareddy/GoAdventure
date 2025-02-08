import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Mode, ScreenId, searchType, TextClr, Type } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
import { ActivityDiary } from '../utilities.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dairy',
  templateUrl: './dairy.component.html',
  styleUrls: ['./dairy.component.css']
})
export class DairyComponent implements OnInit, OnDestroy {
  dairyForm!: FormGroup;
  private subsink: SubSink = new SubSink();
  modes: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  tomorrow: Date = new Date();
  slNum: number = 0;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private actCls: ActivityDiary = new ActivityDiary();
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 100;
  statusList: Item[] = [
    { itemCode: "OPEN", itemName: "Open" },
    { itemCode: "CONFIRM", itemName: "Confirm" }
  ];
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "product", headerName: "Product", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "supplier", headerName: "Supplier", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "warehouse", headerName: "Warehouse", sortable: true, filter: true, resizable: true, width: 220 },
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  empCode!: string;
  dialogOpen: boolean = false;
  constructor(private fb: FormBuilder, protected router: Router, private loader: NgxUiLoaderService, private dialog: MatDialog,
    private userDataService: UserDataService, private datePipe: DatePipe,
    private masterService: MastersService, private utilService: UtilitiesService) {
    this.dairyForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  ngOnInit(): void {
    const currentTime = this.getCurrentTime();
    this.dairyForm.get('fromTime')?.patchValue(currentTime);
    this.dairyForm.get('toTime')?.patchValue(currentTime);
    // this.loadData();
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

  async onEmployeeSearch() {
    const body = this.createRequestDataForSearch(this.dairyForm.get('name')!.value || "", Type.EMPLOYEE);
    try {
      this.subsink.sink = await this.utilService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.dairyForm.get('name')!.patchValue(res.data.selName);
            this.empCode = res.data.selCode;
            this.getActivity();

          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.dairyForm.get('name')!.value, PartyType: Type.EMPLOYEE,
                  search: searchType.EMPLOYEE
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.dairyForm.get('name')!.patchValue(result.partyName);
                  this.empCode = result.code;
                  this.getActivity();

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
  prepareCls() {

    let asDate: any;
    const formControls = this.dairyForm.controls;
    asDate = this.formatDate(formControls.date.value);

    this.actCls.company = this.userDataService.userData.company;
    this.actCls.location = this.userDataService.userData.location;
    this.actCls.user = this.userDataService.userData.userID;
    this.actCls.refNo = this.userDataService.userData.sessionID;
    this.actCls.mode = Mode.Modify;

    this.actCls.activityDescription = this.dairyForm.controls.activity.value;

    this.actCls.activityStatus = this.dairyForm.controls.status.value;
    this.actCls.diaryDate = asDate;
    this.actCls.evalRating = this.dairyForm.controls.rating.value;

    const fromTimeValue = this.dairyForm.controls.fromTime.value;
    const toTimeValue = this.dairyForm.controls.toTime.value;

    if (fromTimeValue) {
      this.actCls.fromTime = this.datePipe.transform(`1970-01-01T${fromTimeValue}:00`, 'HH:mm:ss') || '';
    }

    if (toTimeValue) {
      this.actCls.toTime = this.datePipe.transform(`1970-01-01T${toTimeValue}:00`, 'HH:mm:ss') || '';
    }

    // const fromTimeValue = this.dairyForm.controls.fromTime.value;
    // const toTimeValue = this.dairyForm.controls.toTime.value;

    // this.actCls.fromTime = this.datePipe.transform(fromTimeValue, 'HH:mm:ss') || '';
    // this.actCls.toTime = this.datePipe.transform(toTimeValue, 'HH:mm:ss') || '';

    // this.actCls.fromTime = this.dairyForm.controls.fromTime.value;
    // this.actCls.toTime = this.dairyForm.controls.toTime.value;
    this.actCls.remarks = this.dairyForm.controls.remarks.value;

    this.actCls.empCode = this.empCode;
    this.actCls.slNo = this.slNum;

    // console.log(this.actCls);

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

  getActivity() {
    let asDate: any;
    const formControls = this.dairyForm.controls;
    asDate = this.formatDate(formControls.date.value);
    const body = {
      ...this.commonParams(),
      client: this.empCode || '',
      asOnDate: asDate
    }

    try {
      this.subsink.sink = this.utilService.GetDiaryDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      })
    }
    catch (ex: any) {
      debugger;
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }


  }
  onSubmit() {
    if (this.dairyForm.invalid) {
      this.displayMessage("Enter required fields!", TextClr.red);
      return;
    }
    else {
      try {
        this.prepareCls();
        this.loader.start();
        this.subsink.sink = this.utilService.UpdateDiaryDetails(this.actCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }

        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }


    }

  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  loadData() {
    const modeBody = {
      ...this.commonParams(),
      item: ScreenId.PURCHASE_REQUEST_SCRID
    };
    try {
      this.subsink.sink = this.masterService.getModesList(modeBody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res['data'];
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
  formInit() {
    return this.fb.group({
      name: ['', [Validators.required]],
      date: [new Date(), [Validators.required]],
      fromTime: ['', Validators.required],
      toTime: ['', Validators.required],
      activity: ['', Validators.required],
      status: ['', Validators.required],
      remarks: ['', Validators.required],
      rating: ['0']
    });


  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  modeChange(event: string) {

  }
  clear() {

  }
  close() {
    this.router.navigateByUrl('/home');
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(event: any) {
    // this.onRowClick(event);
  }
}
