import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { UserData } from 'src/app/admin/admin.module';
import { SubSink } from 'subsink';
import { assetTranferDetails } from '../../assets.class';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { DatePipe } from '@angular/common';
import { SearchAssetComponent } from 'src/app/general/search-asset/search-asset.component';

@Component({
  selector: 'app-asset-transfer-details',
  templateUrl: './asset-transfer-details.component.html',
  styleUrls: ['./asset-transfer-details.component.css']
})

export class AssetTransferDetailsComponent implements OnInit {
  masterParams: MasterParams;
  dialogOpen = false;
  modes!: any[];
  userData: any;
  dataFlag: boolean = false;
  assetTransferDetailsForm!: any;
  textMessageClass!: string;
  retMessage!: string;
  //loader: any;
  tranNo!: any[];
  slValue: boolean = false;
  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;
  slNo!: number;
  private subSink: SubSink;
  assetTDetCls!: assetTranferDetails;
 // selectedRowIndex: number = -1;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  rowData: any = [];
  mode!: string;
  status!:string;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs1: any = [{ field: "slNo", headerName: "S.No", flex: 1 },
  { field: "assignedSlNo", headerName: "AssignedSlNo", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "assetID", headerName: "AssetID", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "assetDesc", headerName: "AssetDesc", sortable: true, filter: true, resizable: true, width: 220 },
  { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, width: 220 },
];
  excelService: any;
  pdfService: any;

  constructor(protected route: ActivatedRoute,
    protected router: Router,private datePipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private masterService: MastersService, public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder, private notifyService: NotificationService,
    protected assetservice: AssetsService) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.assetTransferDetailsForm = this.formInit();
    // this.displayColumns = ["slNo", "tranNo", "assetID",  "assetDesc", "remarks"];
    this.assetTDetCls = new assetTranferDetails();
  }

  formInit() {
    return this.fb.group({
      assignedSlNo: ['', [Validators.required]],
      tranNo: [''],
      slNo: [''],
      assetID: [''],
      assetDesc: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    //console.log(this.data);
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    this.masterParams.tranNo = this.data.tranNo;
    this.masterParams.langId = this.userData.langId;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    if (this.data.tranNo) {
      this.getAssetTransferDetails(this.data);
     // this.getpurchaseDetails(this.data);
    }
    this.mode = this.data.mode;
    this.status = this.data.status;
    //this.get(this.data);

  }

  get(tranNo: string) {

    this.masterParams.tranNo = tranNo;
    // this.masterParams.langId = this.userData.langId;
    // this.masterParams.company = this.userData.company;
    // this.masterParams.location = this.userData.location;
    // this.masterParams.user = this.userData.userID;
    // this.masterParams.refNo = this.userData.sessionID;
    //console.log(this.masterParams);
    try {
      this.loader.start();

      this.assetservice.getATDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        this.dataSource = res['data'];
        this.dataSource = new MatTableDataSource(res['data']);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.matsort;
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd-MM-yyyy') || ''
  }

  searchData() {
    try {
      // Get the current date
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);

      const body = {
        Company: this.userData.company,
        Location: this.userData.location,
        TranType: 'ASSET',
        TranNo: this.assetTransferDetailsForm.controls['assetID'].value,
        Party: "",
        // FromDate: formattedFirstDayOfMonth,
        // ToDate: formattedCurrentDate,
        TranStatus: "ANY",
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
      //console.log(body);

      this.subSink.sink = this.assetservice.GetTranCount(body).subscribe((res: any) => {
        console.log(res);
        if (res.status != "fail") {
          if (res.data.tranCount === 1) {
          //  this.masterParams.item = res.data.selTranNo;
            this.assetTransferDetailsForm.controls['assetID'].patchValue(res.data.selName);
            this.assetTDetCls.assetID = res.data.selName;
           // this.assetTDetCls.assetDesc = res.data.selName;
            console.log(this.masterParams);
            //   this.assetForm.controls['assignedSlNo'].value = res.data.selTranNo;

           // this.getAssetTransferDetails(this.masterParams);
          }
          else {
            // this.reset
            const dialogRef: MatDialogRef<SearchAssetComponent> = this.dialog.open(SearchAssetComponent, {
              width: '90%',
              height: '90%',
              disableClose: true,
              data: {
                'tranNum': this.assetTransferDetailsForm.controls['assetID'].value, 'TranType': "ASSET",
                'search': 'Asset Search'
              }
            });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              console.log(result);
              this.dialogOpen = false;
              if (result != true) {

              //  this.masterParams.item = result.assignedSlNo;
                this.assetTransferDetailsForm.controls['assetID'].setValue(result.assetId);
                this.assetTransferDetailsForm.controls['assignedSlNo'].setValue(result.assignedSlNo);
                this.assetTransferDetailsForm.controls['assetDesc'].setValue(result.assetDesc);

               // this.getAssetTransferDetails(this.masterParams)
              }
            });
          }
        }
        else {
          this.reset();
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }
  getAssetTransferDetails(data: any) {

    if (data.tranNo) {
      this.masterParams.tranNo = data.tranNo;
    }
    else {
      this.masterParams.tranNo = data;
    }
    this.masterParams.langId = this.userData.langId;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    try {
      this.loader.start();
      this.subSink.sink = this.assetservice.getATDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status != 'fail') {
          this.exportTmp = false;
          this.rowData = res['data'];
        } else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }

  }

  onSubmit() {
    this.assetTDetCls.company = this.userData.company;
    this.assetTDetCls.location = this.userData.location;
    this.assetTDetCls.langId = 1;
    this.assetTDetCls.user = this.userData.userID;
    this.assetTDetCls.refNo = this.userData.sessionID;
    this.assetTDetCls.mode = this.mode;
    this.assetTDetCls.slNo = this.slNo;
    this.assetTDetCls.tranNo = this.masterParams.tranNo;
    this.assetTDetCls.assetID = this.assetTransferDetailsForm.controls['assetID'].value;
    this.assetTDetCls.assetDesc = this.assetTransferDetailsForm.controls['assetDesc'].value;
    this.assetTDetCls.assignedSlNo = this.assetTransferDetailsForm.controls['assignedSlNo'].value;
    this.assetTDetCls.remarks = this.assetTransferDetailsForm.controls['remarks'].value;
    console.log(this.assetTDetCls);
    this.loader.start();
    try {
      this.subSink.sink = this.assetservice.UpdateATDetails(this.assetTDetCls).subscribe((res: any) => {
        this.loader.stop();
        // if (res.status.toUpperCase() === "SUCCESS") {
        //   this.dataFlag = true;
        // // if (res.retVal < 100) {
        //   this.retMessage = res.message;
        //   this.textMessageClass = "red";
        // }
        // if (res.retVal >= 100 && res.retVal <= 200) {
        //   this.retMessage = res.message;
        //   this.textMessageClass = "green";
        //   this.slValue = true;
        //  this.getAssetTransferDetails(this.masterParams.tranNo);
        // }
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataFlag = true;
          this.getAssetTransferDetails(res.tranNoNew);
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
      });
    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = "red";
    }

  }

  reset() {

  }

  onRowClick(row: any) {
    this.slNo = row.data.slNo;
    this.assetTransferDetailsForm.controls['assignedSlNo'].setValue(row.data.assignedSlNo);
    this.assetTransferDetailsForm.controls['assetID'].setValue(row.data.assetID);
    this.assetTransferDetailsForm.controls['assetDesc'].setValue(row.data.assetDesc);
    this.assetTransferDetailsForm.controls['remarks'].setValue(row.data.remarks);
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    //console.log(event.data);
    this.retMessage = "";
    this.textMessageClass = "";
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }

  addNewAsset(){
    this.assetTransferDetailsForm.reset();
    this.assetTransferDetailsForm = this.formInit();
    this.slNo = 0;
    this.slValue = true;
    this.textMessageClass = "";
    this.retMessage = "";
  }

  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + "-" + this.data.tranNo + '.csv' });
    }
  }
}
