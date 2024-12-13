import { InventoryService } from './../../Services/inventory.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockAdjustmentDetailsComponent } from './stock-adjustment-details/stock-adjustment-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SubSink } from 'subsink';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Router } from '@angular/router';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SaveApiResponse, getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { stockAdjustmenthdrClass } from '../inventory.class';

@Component({
  selector: 'app-stock-adjustment',
  templateUrl: './stock-adjustment.component.html',
  styleUrls: ['./stock-adjustment.component.css']
})
export class StockAdjustmentComponent implements OnInit, OnDestroy {
  stockAdjForm!: FormGroup;
  textMessageClass!: string;
  retMessage!: string;
  modes: Item[] = [];
  adjTypeList: any[] = [];
  adjOnList: any[] = [];
  masterParams!: MasterParams;
  dialogOpen = false;
  private subSink!: SubSink;
  tranStatus!: string;
  @Input() max: any;
  stkAdjCls: stockAdjustmenthdrClass;
  newMessage!: string;
  tomorrow = new Date();
  public disableDetail: boolean = true;
  public fetchStatus: boolean = true;

  constructor(private fb: FormBuilder,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private loader: NgxUiLoaderService,
    private invService: InventoryService) {
    this.stockAdjForm = this.formInit();
    this.masterParams = new MasterParams();
    this.stkAdjCls = new stockAdjustmenthdrClass();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      date: [new Date(), Validators.required],
      refTranNo: ['', Validators.required],
      adjustmentType: ['', Validators.required],
      tranType: ['', Validators.required],
      notes: [''],
    })
  }

  ngOnInit(): void {
    this.loadData();

  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'STOCKADJ',
        TranNo: this.stockAdjForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        console.log(res);
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.stockAdjForm.controls['tranNo'].patchValue(res.data.selTranNo);
            this.masterParams.tranNo = res.data.selTranNo;
              this.stockAdjData(this.masterParams, this.stockAdjForm.get('mode')?.value);

          }
          else {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.stockAdjForm.controls['tranNo'].value, 'TranType': "STOCKADJ",
                'search': 'Stock Adjustment Search'
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              console.log(result.data);
              if (result != true) {
                this.stockAdjForm.get('tranNo')!.patchValue(result);
                  this.masterParams.tranNo = result;

              this.stockAdjData(this.masterParams, this.stockAdjForm.get('mode')?.value);

              }
            });
          }
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  stockAdjData(masterParams: MasterParams,mode: string) {
    this.loader.start();
    try {
      this.subSink.sink = this.invService.GetStockAdj(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.tranStatus = res['data'].tranStatus;
          //this.stockAdjForm.controls['tranNo'].patchValue(res['data'].tranNo);
         // this.stockAdjForm.get('tranNo')!.patchValue(res.data.tranNo);
          this.stockAdjForm.controls['date'].patchValue(res['data'].tranDate);
          this.stockAdjForm.controls['tranType'].patchValue(res['data'].tranType)
          this.stockAdjForm.controls['adjustmentType'].patchValue(res['data'].adjType)
          this.stockAdjForm.controls['refTranNo'].patchValue(res['data'].refTranNo)
          this.stockAdjForm.controls['notes'].patchValue(res['data'].remarks)
          this.tranStatus = res['data'].tranStatus;


          if (mode != "View") {
            this.retMessage = this.newMessage;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage =   'Retriving data ' + res.message + ' has completed';
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

  //         this.textMessageClass = 'green';
  //         this.retMessage =
  //           'Retriving data ' + res.message + ' has completed';
  //         // this.disableDetail = false;
  //         // this.fetchStatus = false;
  //       }
  //       else {
  //         this.textMessageClass = 'red';
  //         this.retMessage = res.message;
  //       }
  //     });
  //   }
  //   catch (ex: any) {
  //     this.textMessageClass = 'red';
  //     this.retMessage = ex.message;
  //   }
   }

  modeChange(event: string) {
    if (event === "Add") {
       this.clear();
      this.stockAdjForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockAdjForm.get('tranNo')!.disable();
      this.stockAdjForm.get('tranNo')!.clearValidators();
      this.stockAdjForm.get('tranNo')!.updateValueAndValidity();
    }
    else {
      this.stockAdjForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.stockAdjForm.get('tranNo')!.enable();
    }
  }

  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    //this.masterParams.selLocation=this.userDataService.userData.location;

    const body: getPayload = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: 'ST309',
      refNo: this.userDataService.userData.sessionID
    };

    this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.modes = res['data'];
      }
    });
  }

  onDetailsCilcked(tranNo: any) {

    const dialogRef: MatDialogRef<StockAdjustmentDetailsComponent> = this.dialog.open(StockAdjustmentDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': this.stockAdjForm.get('tranNo')!.value,
        'mode': this.stockAdjForm.get('mode')!.value,
        'status': this.tranStatus,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered) {
        this.textMessageClass = "";
        this.masterParams.tranNo = this.stockAdjForm.get('tranNo')!.value;
        this.stockAdjData(this.masterParams, this.stockAdjForm.get('mode')!.value);
      }
    });
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  stkAdjustmentCls() {
    this.stkAdjCls.company = this.userDataService.userData.company;
    this.stkAdjCls.location = this.userDataService.userData.location;
    this.stkAdjCls.user = this.userDataService.userData.userID;
    this.stkAdjCls.refNo = this.userDataService.userData.sessionID;
    this.stkAdjCls.langID = this.userDataService.userData.langId;
    this.stkAdjCls.company = this.userDataService.userData.company;

    this.stkAdjCls.mode = this.stockAdjForm.get('mode')!.value;
    this.stkAdjCls.tranNo = this.stockAdjForm.get('tranNo')!.value;
    this.stkAdjCls.Remarks = this.stockAdjForm.get('notes')!.value;
    const transformedDate = this.datePipe.transform(this.stockAdjForm.controls['date'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.stkAdjCls.tranDate = transformedDate.toString();
    } else {
      this.stkAdjCls.tranDate = '';
    }
    this.stkAdjCls.adjType = this.stockAdjForm.get('adjustmentType')!.value;
    this.stkAdjCls.refTranNo = this.stockAdjForm.get('refTranNo')!.value;
    this.stkAdjCls.tranType = this.stockAdjForm.get('tranType')!.value;

  }

  onSubmit() {
    this.clearMsg();
    if (this.stockAdjForm.invalid) {
      return;
    }
    else {
      this.stkAdjustmentCls();
      try {
        this.loader.start();
        this.subSink.sink = this.invService.UpdateStockAdjustment(this.stkAdjCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newMessage = res.message;
            this.textMessageClass = "green";
            if (this.stockAdjForm.get('mode')!.value == "Add") {
              this.modeChange("Modify");
            }
            this.stockAdjForm.controls['tranNo'].patchValue(res.tranNoNew);
            this.stkAdjCls.tranNo = res.tranNoNew;
            if (res.tranNoNew) {
              this.masterParams.tranNo = res.tranNoNew;
              this.stockAdjData(this.masterParams, this.stockAdjForm.get('mode')?.value);
            }
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = "red";
      }
    }
  }

  clear() {
    this.stockAdjForm = this.formInit();
    this.textMessageClass = '';
    this.retMessage = '';
    this.tranStatus = "";
    this.newMessage = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  reset() {
    this.stockAdjForm.reset();
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.stockAdjForm.controls['mode'].value, tranNo: this.stockAdjForm.controls['tranNo'].value, search: 'Stock-Transfer Docs', tranType: "STOCKADJ" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST309",
        // Page: "Stock Adjustment",
        // SlNo: 36,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.stockAdjForm.controls['mode'].value,
        'note': this.stockAdjForm.controls['notes'].value,
        'TranType': "STOCKADJ",
      }  // Pass any data you want to send to CustomerDetailsComponent

    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: {
        'tranType': 'STOCKADJ',
        'tranNo': tranNo,
        'search': 'Stock Adjustment log Search'
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
