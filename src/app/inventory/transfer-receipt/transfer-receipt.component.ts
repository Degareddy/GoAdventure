import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { forkJoin, map, Observable, startWith } from 'rxjs';
import { SubSink } from 'subsink';
// import { TransferDetailsComponent } from './transfer-details/transfer-details.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { stockTransferReceiptHeader } from '../inventory.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ReceiptDetailsComponent } from './receipt-details/receipt-details.component';
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
  selector: 'app-transfer-receipt',
  templateUrl: './transfer-receipt.component.html',
  styleUrls: ['./transfer-receipt.component.css']
})
export class TransferReceiptComponent implements OnInit, OnDestroy {
  options: string[] = [];
  stockRecptForm!: FormGroup;
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
  stockTranCls!: stockTransferReceiptHeader;
  filteredOptions!: Observable<string[]>;
  options1: string[] = [];
  filteredOptions1!: Observable<string[]>;
  constructor(protected route: ActivatedRoute, private userDataService: UserDataService,
    protected router: Router,
    private loader: NgxUiLoaderService,
    private invService: InventoryService,
    private masterService: MastersService,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private datePipe: DatePipe) {
    this.stockRecptForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.stockTranCls = new stockTransferReceiptHeader()

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
      transferNo: [''],
      remarks: [''],
    })
  }

  modeChange(event: string) {
    if (event === "Add") {
      this.clear();
      this.stockRecptForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockRecptForm.get('tranNo')!.disable({ emitEvent: false });
      this.stockRecptForm.get('tranNo')!.clearValidators();
      this.stockRecptForm.get('tranNo')!.updateValueAndValidity();
      this.loadData();
    }
    else {
      this.stockRecptForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockRecptForm.get('tranNo')!.enable({ emitEvent: false });
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
      this.masterParams.item = this.stockRecptForm.controls['tranNo'].value;
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
    this.loadData();
    // this.stockRecptForm.get('toLocn')!.valueChanges.subscribe((value) => {
    //   this.getSelectedLocationWarehousesList();
    // });

    this.filteredOptions = this.stockRecptForm.get('matReqNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    this.filteredOptions1 = this.stockRecptForm.get('transferNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter1(value || '')),
    );
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }


  private _filter1(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options1.filter(option => option.toLowerCase().includes(filterValue));
  }

  prepareStockRctCls() {
    this.stockTranCls.company = this.userDataService.userData.company;
    this.stockTranCls.location = this.userDataService.userData.location;
    this.stockTranCls.langID = this.userDataService.userData.langId;;
    this.stockTranCls.user = this.userDataService.userData.userID;
    this.stockTranCls.refNo = this.userDataService.userData.sessionID;
    this.stockTranCls.mode = this.stockRecptForm.get('mode')!.value;
    this.stockTranCls.tranNo = this.stockRecptForm.get('tranNo')!.value || "";
    this.stockTranCls.ReqLocation = this.stockRecptForm.get('toLocn')!.value;

    const transformedDate = this.datePipe.transform(this.stockRecptForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.stockTranCls.tranDate = transformedDate.toString();
    }
    else {
      this.stockTranCls.tranDate = ''; // or any default value you prefer
    }

    this.stockTranCls.remarks = this.stockRecptForm.get('remarks')!.value;
    this.stockTranCls.matReqNo = this.stockRecptForm.get('matReqNo')!.value;
    this.stockTranCls.transferNo = this.stockRecptForm.get('transferNo')!.value;
  }

  onSubmit() {
    if (this.stockRecptForm.valid) {
      this.prepareStockRctCls();
      try {
        this.loader.start();
        this.subSink.sink = this.invService.UpdateStockTransferReceiptHdr(this.stockTranCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newMessage = res.message;
            if (this.stockRecptForm.get('mode')?.value === "Add") {
              this.modeChange("Modify");
            }
            this.stockRecptForm.controls['tranNo'].patchValue(res.tranNoNew);
            if (res.tranNoNew) {
              this.masterParams.tranNo = res.tranNoNew;
              this.stockTranferData(this.masterParams, this.stockRecptForm.get('mode')?.value);
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
    const locations: getPayload = {
      ...this.commonParams(),
      item: "LOCATION",
      mode: this.stockRecptForm.get('mode')?.value
    };
    const wareHouses: getPayload = {
      ...this.commonParams(),
      item: "WAREHOUSE",
      mode: this.stockRecptForm.get('mode')?.value
    };


    const requests = [
      this.invService.GetMasterItemsList(locations),
      this.invService.GetMasterItemsList(wareHouses),
    ];
    this.subSink.sink = forkJoin(requests).subscribe((results: any[]) => {
      if (results[0].status.toUpperCase() === "SUCCESS") {
        this.locations = results[0]['data'];
      }
      else{
        this.retMessage="Locations list empty!";
        this.textMessageClass="red";
      }
      if (results[1].status.toUpperCase() === "SUCCESS") {
        this.warehouse = results[1]['data'];
      }
      else{
        this.retMessage="Warehouse list empty!";
        this.textMessageClass="red";
      }

    },
      (error: any) => {

          this.retMessage=error.message;
          this.textMessageClass="red";

      }
    );

  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<ReceiptDetailsComponent> = this.dialog.open(ReceiptDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo, 'mode': this.stockRecptForm.controls['mode'].value,
        'status': this.tranStatus,
        'selLocation': this.stockRecptForm.controls['toLocn'].value
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.stockTranferData(this.masterParams, this.stockRecptForm.get('mode')?.value);
      }
    });

  }

  stockTranferData(masterParams: MasterParams, mode: string) {
    this.loader.start();
    try {
      this.subSink.sink = this.invService.GetStockTransferReceipt(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.textMessageClass = 'green';
          this.stockRecptForm.controls['toLocn'].patchValue(res['data'].toLocn, { emitEvent: false });
          this.tranStatus = res['data'].tranStatus;
          this.stockRecptForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.stockRecptForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.toWarehouse = res['data'].toWarehouse;
          this.stockRecptForm.controls['remarks'].patchValue(res['data'].remarks);
          this.stockRecptForm.controls['matReqNo'].patchValue(res['data'].matReqNo);
          this.stockRecptForm.controls['transferNo'].patchValue(res['data'].transferNo);
          this.stockRecptForm.controls['toLocn'].patchValue(res['data'].reqLocation);
          if (mode != "View") {
            this.textMessageClass = 'green';
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
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex;
    }
  }
  getSelectedLocationWarehousesList() {
    this.retMessage = "";
    this.textMessageClass = "";
    const authBody = {
      ...this.commonParams(),
      type: "MATREQE",
      SelLocation: this.stockRecptForm.get('toLocn')!.value,
      langId: this.userDataService.userData.langId
    };

    if (this.stockRecptForm.get('toLocn')!.value) {
      this.subSink.sink = this.invService.GetAuthorizedTransactions(authBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.options = res.data.map((item: any) => item.tranNo);

        }
        else {
          this.retMessage = "Requested list empty!";
          this.textMessageClass = "red";
        }
      });
    }
  }
  clear() {
    this.stockRecptForm = this.formInit();
    this.textMessageClass = '';
    this.retMessage = '';
    this.tranStatus = "";
    this.newMessage = "";
    this.options = [];
    this.stockRecptForm.get('toLocn')!.valueChanges.subscribe((value) => {
      this.getSelectedLocationWarehousesList();
    });
    this.filteredOptions = this.stockRecptForm.get('matReqNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    this.filteredOptions1 = this.stockRecptForm.get('transferNo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter1(value || '')),
    );
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.stockRecptForm.controls['mode'].value, tranNo: this.stockRecptForm.controls['tranNo'].value, search: 'Stock-Transfer Docs', tranType: "STOCKTRF" }
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
        TranType: 'TRNRCT',
        TranNo: this.stockRecptForm.controls['tranNo'].value || "",
        Party: "",
        FromDate: this.datePipe.transform(formattedFirstDayOfMonth, 'yyyy-MM-dd'),
        ToDate: this.datePipe.transform(formattedCurrentDate, 'yyyy-MM-dd'),
        TranStatus: "ANY"
      }
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: tranApiResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.stockTranferData(this.masterParams, this.stockRecptForm.get('mode')?.value);
          }
          else {
            this.tranStatus = '';
            this.retMessage = '';
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.stockRecptForm.controls['tranNo'].value, 'TranType': "TRNRCT",
                'search': 'Transfer-Receipt Search'
              }
            });
            this.dialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              this.dialogOpen = false;
              if (result != true) {
                this.masterParams.tranNo = result;
                this.stockTranferData(this.masterParams, this.stockRecptForm.get('mode')?.value);
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
  reqChangeNum(event: any) {
    const authBody = {
      ...this.commonParams(),
      type: "STKTRF",
      SelLocation: this.stockRecptForm.get('toLocn')!.value,
      langId: this.userDataService.userData.langId,
      refTranNo: event.option.value
    };

    if (this.stockRecptForm.get('toLocn')!.value) {
      this.subSink.sink = this.invService.GetAuthorizedTransactions(authBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.options1 = res.data.map((item: any) => item.tranNo);

        }
        else {
          this.retMessage = "Requested list empty!";
          this.textMessageClass = "red";
        }
      });
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

  // getSelectedLocationWarehousesList() {
  //   const whData = {
  //     langId: this.userDataService.userData.langId,
  //     company: this.userDataService.userData.company,
  //     location: this.userDataService.userData.location,
  //     user: this.userDataService.userData.userID,
  //     refNo: this.userDataService.userData.sessionID,
  //     item: "WAREHOUSE",
  //     selLocation: this.stockRecptForm.controls['toLocn'].value
  //   }
  //   this.subSink.sink = this.invService.GetMasterItemsListSelLocation(whData).subscribe((res: any) => {
  //     if (res.status.toUpperCase() === "SUCCESS") {
  //       this.toWarehousesList = res.data;
  //       if (this.toWarehouse) {
  //         this.stockRecptForm.get('toWarehouse')?.patchValue(this.toWarehouse);
  //       }
  //     }
  //     else {
  //       this.retMessage = "To Warehouse list empty!";
  //       this.textMessageClass = "red";
  //     }
  //   });
  // }
  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.stockRecptForm.controls['mode'].value,
        //'note': this.mrhForm.controls['notes'].value,
        'TranType': "TRNRCT",
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
        'tranType': "TRNRCT",
        'tranNo': tranNo,
        'search': 'Trasfer Receipt Log'
      }
    });
  }



}
