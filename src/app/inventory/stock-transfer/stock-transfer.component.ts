import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { Observable, forkJoin, map, startWith } from 'rxjs';
import { SubSink } from 'subsink';
import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { StockTransfer } from '../inventory.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
export interface TransactionDetails {
  company: string;
  location: string;
  langID: number;
  tranNo: string;
  fromLocn: string;
  toLocn: string;
  fromWarehouse: string;
  toWarehouse: string;
  tranDate: string; // Date as ISO string
  tranStatus: string;
  remarks: string;
  mode: string | null;
  user: any;
  refNo: any;
}

export interface getTransactionDetailsResp {
  status: string;
  message: string;
  retVal: number;
  data: TransactionDetails
}

export interface tranApiResponse {
  status: string;
  message: string;
  retVal: number;
  data: TransactionData;
}

export interface TransactionData {
  tranCount: number;
  selTranNo: string;
}

@Component({
  selector: 'app-stock-transfer',
  templateUrl: './stock-transfer.component.html',
  styleUrls: ['./stock-transfer.component.css']

})

export class StockTransferComponent implements OnInit, OnDestroy {
  options: string[] = [];
  filteredOptions!: Observable<string[]>;
  stockTransferForm!: FormGroup;
  retMessage!: string;
  newMessage!: string;
  tranStatus!: string;
  textMessageClass!: string;
  masterParams!: MasterParams;
  modes: Item[] = [];
  locations: Item[] = [];
  warehouse: Item[] = [];
  toWarehousesList: Item[] = [];
  private subSink!: SubSink;
  dialogOpen = false;
  toWarehouse: string = "";
  @Input() max: any;
  tomorrow = new Date();
  stockTranCls!: StockTransfer;

  constructor(protected route: ActivatedRoute, private userDataService: UserDataService,
    protected router: Router, private loader: NgxUiLoaderService, private invService: InventoryService,
    private masterService: MastersService, public dialog: MatDialog, private fb: FormBuilder, private datePipe: DatePipe) {
    this.stockTransferForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.stockTranCls = new StockTransfer()
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      toLocn: ['', Validators.required],
      matReqNo: [''],
      remarks: [''],
    })
  }

  modeChange(event: string) {
    console.log(this.stockTransferForm)
    if (event === "Add") {
      this.clear();
      this.stockTransferForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockTransferForm.get('tranNo')!.disable({ emitEvent: false });
      this.stockTransferForm.get('tranNo')!.clearValidators();
      this.stockTransferForm.get('tranNo')!.updateValueAndValidity();
    }
    else {
      this.stockTransferForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockTransferForm.get('tranNo')!.enable({ emitEvent: false });
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

  ngOnInit(): void {
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST302'
    };
    try {
      this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
      this.masterParams.item = this.stockTransferForm.controls['tranNo'].value;
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
    this.loadData();
    // console.log(this.loadData);
    this.stockTransferForm.get('toLocn')!.valueChanges.subscribe((value) => {
      this.getSelectedLocationWarehousesList();
    });
    this.filteredOptions = this.stockTransferForm.get('matReqNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }


  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter((option: any) => option.toLowerCase().includes(filterValue));
  }

  prepareStockCls() {
    this.stockTranCls.company = this.userDataService.userData.company;
    this.stockTranCls.location = this.userDataService.userData.location;
    this.stockTranCls.langID = this.userDataService.userData.langId;;
    this.stockTranCls.user = this.userDataService.userData.userID;
    this.stockTranCls.refNo = this.userDataService.userData.sessionID;
    this.stockTranCls.mode = this.stockTransferForm.get('mode')!.value;
    this.stockTranCls.tranNo = this.stockTransferForm.get('tranNo')!.value;
    // this.stockTranCls.tranDate = this.stockTransferForm.get('tranDate')!.value;

    const transformedDate = this.datePipe.transform(this.stockTransferForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.stockTranCls.tranDate = transformedDate.toString();
    }
    else {
      this.stockTranCls.tranDate = ''; // or any default value you prefer
    }



    this.stockTranCls.ToLocnName = this.stockTransferForm.get('toLocn')!.value;
    this.stockTranCls.ToLocn = this.stockTransferForm.get('toLocn')!.value;
    this.stockTranCls.remarks = this.stockTransferForm.get('remarks')!.value;
    this.stockTranCls.matReqNo = this.stockTransferForm.get('matReqNo')!.value;
  }

  onSubmit() {
    if (this.stockTransferForm.valid) {
      this.prepareStockCls();
      try {
        this.loader.start();
        this.invService.UpdateStockTransfer(this.stockTranCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newMessage = res.message;
            if (this.stockTransferForm.get('mode')?.value === "Add") {
              this.modeChange("Modify");
            }
            this.stockTransferForm.controls['tranNo'].patchValue(res.tranNoNew);
            if (res.tranNoNew) {
              this.masterParams.tranNo = res.tranNoNew;
              this.stockTranferData(this.masterParams, this.stockTransferForm.get('mode')?.value);
            }
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
      }
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const locations = {
      ...this.commonParams(),
      Item: "LOCATION"
    };
    const wareHouses = {
      ...this.commonParams(),
      Item: "WAREHOUSE"
    };
    const requests = [
      this.invService.GetMasterItemsList(locations),
      this.invService.GetMasterItemsList(wareHouses),
    ];
    this.subSink.sink = forkJoin(requests).subscribe((results: any[]) => {
      if (results[0].status.toUpperCase() === "SUCCESS") {
        this.locations = results[0]['data'];
      }
      if (results[1].status.toUpperCase() === "SUCCESS") {
        this.warehouse = results[1]['data'];
      }
    },
      (error: any) => {
        console.error(error);
      }
    );

  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<TransferDetailsComponent> = this.dialog.open(TransferDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        'tranNo': tranNo, 'mode': this.stockTransferForm.controls['mode'].value,
        'status': this.tranStatus,
        'selLocation': this.stockTransferForm.controls['toLocn'].value
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.stockTranferData(this.masterParams, this.stockTransferForm.get('mode')?.value);
      }
    });

  }

  stockTranferData(masterParams: MasterParams, mode: string) {
    this.loader.start();
    try {
      this.subSink.sink = this.invService.GetStockTransfer(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.textMessageClass = 'green';
          this.stockTransferForm.controls['toLocn'].patchValue(res['data'].toLocn, { emitEvent: false });
          this.tranStatus = res['data'].tranStatus;
          this.stockTransferForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.stockTransferForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.toWarehouse = res['data'].toWarehouse;
          this.stockTransferForm.controls['remarks'].patchValue(res['data'].remarks);
          this.stockTransferForm.controls['matReqNo'].patchValue(res['data'].matReqNo);
          if (mode != "View") {
            this.retMessage = this.newMessage;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage =
              'Retriving data ' + res.message + ' has completed';
          }
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
          // this.clear();
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex;
    }
  }

  clear() {
    // this.stockTransferForm.reset();
    this.stockTransferForm = this.formInit();
    this.textMessageClass = '';
    this.retMessage = '';
    this.tranStatus = "";
    this.newMessage = "";
    this.options = [];
    this.stockTransferForm.get('toLocn')!.valueChanges.subscribe((value) => {
      this.getSelectedLocationWarehousesList();
    });
    this.filteredOptions = this.stockTransferForm.get('matReqNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.stockTransferForm.controls['mode'].value, tranNo: this.stockTransferForm.controls['tranNo'].value, search: 'Stock-Transfer Docs', tranType: "STOCKTRF" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'STOCKTRF',
        TranNo: this.stockTransferForm.controls['tranNo'].value || "",
        Party: "",
        FromDate: this.datePipe.transform(formattedFirstDayOfMonth, 'yyyy-MM-dd'),
        ToDate: this.datePipe.transform(formattedCurrentDate, 'yyyy-MM-dd'),
        TranStatus: "ANY"
      }
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: tranApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.stockTranferData(this.masterParams, this.stockTransferForm.get('mode')?.value);
          }
          else {
            this.tranStatus = '';
            this.retMessage = '';
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.stockTransferForm.controls['tranNo'].value, 'TranType': "STOCKTRF",
                'search': 'Stock-Transfer Search'
              }
            });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              this.dialogOpen = false;
              if (result != true) {
                this.masterParams.tranNo = result;
                this.stockTranferData(this.masterParams, this.stockTransferForm.get('mode')?.value);
              }
            });
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST302",
        // Page: "Transfers",
        // SlNo: 40,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  getSelectedLocationWarehousesList() {
    this.retMessage = "";
    this.textMessageClass = "";
    const whData = {
      ...this.commonParams(),
      refNo: this.userDataService.userData.sessionID,
      item: "WAREHOUSE",
      selLocation: this.stockTransferForm.controls['toLocn'].value
    }

    const authBody = {
      ...this.commonParams(),
      type: "MATREQ",
      SelLocation: this.stockTransferForm.get('toLocn')!.value
    };

    this.subSink.sink = this.invService.GetMasterItemsListSelLocation(whData).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.toWarehousesList = res.data;
        if (this.toWarehouse) {
          this.stockTransferForm.get('toWarehouse')?.patchValue(this.toWarehouse);
        }
      }
      else {
        this.retMessage = "To Warehouse list empty!";
        this.textMessageClass = "red";
      }
    });
    if (this.stockTransferForm.get('toLocn')!.value) {
      this.subSink.sink = this.invService.GetAuthorizedTransactions(authBody).subscribe((res: any) => {
        // console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.options = res.data.map((item: any) => item.tranNo);
          console.log(this.options);

        }
        else {
          this.retMessage = "Requested list empty!";
          this.textMessageClass = "red";
        }
      });
    }

  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.stockTransferForm.controls['mode'].value,
        //'note': this.mrhForm.controls['notes'].value,
        'TranType': "STOCKTRF",
        'search':"Stock Tranfer Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "STOCKTRF",
        'tranNo': tranNo,
        'search': 'Stock Transfer log'
      }
    });
  }


}
