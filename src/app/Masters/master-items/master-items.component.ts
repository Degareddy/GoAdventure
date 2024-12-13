import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterItems, MasterParams } from '../Modules/masters.module';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-master-items',
  templateUrl: './master-items.component.html',
  styleUrls: ['./master-items.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class MasterItemsComponent implements OnInit, OnDestroy {
  mastForm!: FormGroup;
  mastCls!: MasterItems;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  retMessage: string = "";
  newMsg!: string;
  retNum!: number;
  textMessageClass: string = "";
  selected!: string;
  modes: Item[] = [];
  typeNamesList: Item[] = [];
  selTypeItemsList: Item[] = [];
  masterParams!: MasterParams;
  itemStatus: string = "";
  private subsink!: SubSink;
  @Input() max: any;
  tomorrow = new Date();
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [
    { field: "itemCode", headerName: "Code", sortable: true, filter: true, resizable: true, flex: 2, },

    { field: "itemName", headerName: "Name", sortable: true, filter: true, resizable: true, flex: 1, },
  ];
  constructor(protected masterService: MastersService, private loader: NgxUiLoaderService, protected router: Router,
    protected fb: FormBuilder,
    public dialog: MatDialog,
    private userDataService: UserDataService) {
    this.masterParams = new MasterParams();
    this.mastForm = this.formInit();
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.onSelectedItemChanged(event.data.itemCode, "View");
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      company: [''],
      location: [''],
      typeName: ['', Validators.required],
      selTypeItem: [''],
      itemCode: [, Validators.required, this.alphanumericValidator(),],
      itemName: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      itemStatus: [''],
      notes: [''],
      imgPath: ['NA'],
      user: [''],
      refNo: ['']
    });
  }
  ngOnInit() {
    this.loadData();
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  loadData() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.item = 'SM001';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.subsink.sink = this.masterService.getModesList(this.masterParams).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.modes = res['data'];
      }
      else {
        this.displayMessage("Modes list empty!", "red");
      }
    });

    this.subsink.sink = this.masterService.getMasterTypesList(this.masterParams).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.typeNamesList = res['data'];
        if (this.typeNamesList.length === 1) {
          this.mastForm.get('typeName')!.patchValue(this.typeNamesList[0].itemCode);
          this.onSelectedTypeChanged()
        }
      }
      else {
        this.displayMessage(res.message + " for types list!", "red");
      }

    });
  }

  alphanumericValidator() {
    return (control: any) => {
      const value = control.value;
      const uppercaseValue = value.toUpperCase();

      if (value !== uppercaseValue || value === "") {
        control.patchValue(uppercaseValue, { emitEvent: false });
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          const valid = /^[A-Z0-9]+$/.test(uppercaseValue);
          resolve(valid ? null : { invalidAlphanumeric: true });
        }, 0);
      });
    };
  }
  onSelectedTypeChanged() {
    this.displayMessage("", "");
    if (this.mastForm.controls['typeName'].value !== "") {
      this.masterParams.item = this.mastForm.controls['typeName'].value;
      try {
        this.subsink.sink = this.masterService.getSpecificMasterItems(this.masterParams).subscribe((reslt: any) => {
          if (reslt && reslt.data && reslt.status.toUpperCase() === "SUCCESS") {
            this.rowData = reslt.data;
          }
          else {
            this.rowData = [];
            this.displayMessage(reslt.message, "red");

          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }
  }

  onSelectedItemChanged(selitem: string, mode: string) {
    this.displayMessage("", "");
    if (selitem) {
      this.masterParams.type = this.mastForm.controls['typeName'].value;
      this.masterParams.item = selitem;
      try {
        this.subsink.sink = this.masterService.getSpecificMasterItemDetails(this.masterParams).subscribe((res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.mastForm.controls['itemCode'].patchValue(res['data'].itemCode);
            this.mastForm.controls['itemName'].patchValue(res['data'].itemName);
            this.mastForm.controls['effectiveDate'].patchValue(res['data'].effectiveDate);
            this.itemStatus = res['data'].itemStatus;
            this.mastForm.controls['imgPath'].patchValue(res['data'].imgPath);
            this.mastForm.controls['notes'].patchValue(res['data'].notes);
            if (mode === "View") {
              this.displayMessage("Success: " + res.message, "green");
            }
            else {
              this.displayMessage("Success: " + this.newMsg, "green");
            }

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

  onUpdate() {
    if (this.mastForm.invalid) {
      return;
    }
    else {
      this.displayMessage("", "");
      this.mastForm.controls['company'].patchValue(this.userDataService.userData.company);
      this.mastForm.controls['location'].patchValue(this.userDataService.userData.location);
      this.loader.start();
      this.subsink.sink = this.masterService.updateMasterItemDetails(this.mastForm.value).subscribe((result: SaveApiResponse) => {
        this.loader.stop();
        this.retNum = result.retVal;
        this.retMessage = result.message;
        if (result.status.toUpperCase() === "SUCCESS") {
          if (this.mastForm.get('mode')!.value === "Add") {
            this.modeChanged("Modify");
          }
          this.onSelectedTypeChanged();
          this.displayMessage("Success: " + result.message, "green");
        }
        else {
          this.displayMessage("Error: " + result.message, "red");
        }

      });
    }

  }
  reset() {
    this.mastForm = this.formInit();
    this.itemStatus = "";
    this.selTypeItemsList = [];
    this.rowData = [];
    this.displayMessage("", "");
  }
  close() {
    this.router.navigateByUrl('/home');
  }

  modeChanged(event: string) {
    if (event === 'Add') {
      this.mastForm = this.formInit();
      this.mastForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.mastForm.controls['effectiveDate'].patchValue(new Date());
      this.mastForm.controls['selTypeItem'].disable({ emitEvent: false });
      this.displayMessage("", "");
    }
    else {
      this.mastForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.mastForm.controls['selTypeItem'].enable({ emitEvent: false });
    }
  }
  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.mastForm.controls['mode'].value,
        'TranType': "MASTERITEM",
        'search': "Master Items Notes"
      }
    });

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM001",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "MASTERITEM",
        'tranNo': tranNo,
        'search': 'Master Items'
      }
    });
  }

}
