import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { directionsClass } from 'src/app/project/Project.class';
import { SubSink } from 'subsink';
import { ConfirmDialogComponent, ConfirmDialogModel } from '../confirm-dialog/confirm-dialog.component';
import { Item } from '../Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from '../Interface/admin/admin';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.css']
})
export class DirectionsComponent implements OnInit, OnDestroy {
  searchName!: string;
  directionForm!: FormGroup;
  lblType!: string;
  slNum: number = 0;
  textMessageClass: string = "";
  retMessage: string = "";
  private subSink!: SubSink;
  directionsList: Item[] = [];
  plotNum!: string;
  private dirCls!: directionsClass;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  columnDefs: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "longitude", headerName: "longitude", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "latitude", headerName: "latitude", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "direction", headerName: "directions", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "boundaryDesc", headerName: "boundery", sortable: true, filter: true, resizable: true, width: 220 },
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  returnMsg!: string;

  constructor(private fb: FormBuilder, private utilitiesService: UtilitiesService, public dialog: MatDialog, private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: { type: string, Trantype: string, TranNo: string, mode: string, status: string },
    private masterService: MastersService, private userDataService: UserDataService) {
    this.directionForm = this.formInit();
    this.subSink = new SubSink();
    this.dirCls = new directionsClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.searchName = this.data.type;
    this.lblType = this.data.type;
    this.plotNum = this.data.TranNo;
    this.loadData();
    this.getBounderiesList(this.data.TranNo, false);
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
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

 async loadData() {
    const dirBody: getPayload = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: 'DIRECTIONS',

    }
    this.subSink.sink =await this.masterService.GetMasterItemsList(dirBody).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.directionsList = res['data'];
      }
      else {
        this.retMessage = "Directions " + res.message;
      }
    });
  }
 async getBounderiesList(tran: string, loadFlag: boolean) {
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      LangId: this.userDataService.userData.langId,
      TranType: this.data.Trantype,
      TranNo: tran,
      User: this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID
    }
    this.subSink.sink =await this.utilitiesService.GetBoundaryDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.rowData = res['data'];
        if (loadFlag && this.data.mode != "Delete" && this.slNum === 0) {
          const maxSlNo = this.rowData.reduce((maxSlNo: any, currentItem: any) => {
            return Math.max(maxSlNo, currentItem.slNo);
          }, 0);
          this.slNum = maxSlNo;
        }
        else if (loadFlag && this.data.mode === "Delete" && this.slNum != 0) {
          this.clear();
          this.retMessage = this.returnMsg;
          this.textMessageClass = "green";
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    })
  }
  prepareCls() {
    this.dirCls.Company = this.userDataService.userData.company;
    this.dirCls.Location = this.userDataService.userData.location;
    this.dirCls.LangId = this.userDataService.userData.langId;
    this.dirCls.Mode = this.data.mode;
    this.dirCls.RefNo = this.userDataService.userData.sessionID;
    this.dirCls.User = this.userDataService.userData.userID;
    this.dirCls.RefType = this.data.type;
    this.dirCls.ReferenceNo = this.data.TranNo;
    this.dirCls.SlNo = this.slNum;
    this.dirCls.Latitude = this.directionForm.controls['latitude'].value;
    this.dirCls.Longitude = this.directionForm.controls['longitude'].value;
    this.dirCls.Direction = this.directionForm.controls['directions'].value;
    this.dirCls.Remarks = "";
    this.dirCls.BoundaryDesc = this.directionForm.controls['boundery'].value;
  }
 async apply() {
    this.prepareCls();
    try {
      this.loader.start();
      this.subSink.sink =await this.utilitiesService.UpdateBoundaryDetails(this.dirCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.returnMsg = res.message;
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.getBounderiesList(res.tranNoNew, true);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }
  clear() {
    this.directionForm = this.formInit();
    this.slNum = 0;
    this.textMessageClass = "";
    this.retMessage = "";
  }
  Delete() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      console.log(dialogResult);
      if (dialogResult) {
        this.apply();
      }
    });
  }
  onRowClick(row: any) {
    this.slNum = row.slNo;
    this.directionForm.controls['latitude'].patchValue(row.latitude);
    this.directionForm.controls['longitude'].patchValue(row.longitude);
    this.directionForm.controls['directions'].patchValue(row.direction);
    this.directionForm.controls['boundery'].patchValue(row.boundaryDesc);
  }

  formInit() {
    return this.fb.group({
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      directions: ['', Validators.required],
      boundery: ['']
    });

  }
}

