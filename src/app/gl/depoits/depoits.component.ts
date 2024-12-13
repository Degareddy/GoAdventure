import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { BankDepositsDetailsComponent } from './bank-deposits-details/bank-deposits-details.component';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service'
import { BankDepositsHeader } from '../gl.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-depoits',
  templateUrl: './depoits.component.html',
  styleUrls: ['./depoits.component.css']
})
export class DepoitsComponent implements OnInit, OnDestroy {
  bankDeptForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  private subSink: SubSink;
  totalAmount: number = 0.00;
  tranStatus!: string;
  modes: Item[] = [];
  banksList: Item[] = [];
  currencyList: Item[] = [];
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  dialogOpen = false;
  newTranMsg: string = "";
  bankCode!: string;
  private bankHdrCls: BankDepositsHeader;

  depositsTypeList: Item[] = [
    { itemCode: "CASH", itemName: "Cash" },
    { itemCode: "CHEQUE", itemName: "Cheque" },
    { itemCode: "TRANSFER", itemName: "Transfer" }
  ]

  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    public dialog: MatDialog,
    private masterService: MastersService,
    private glService: GeneralLedgerService,
    private loader: NgxUiLoaderService,
    protected router: Router,
    private datePipe: DatePipe) {
    this.bankDeptForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.bankHdrCls = new BankDepositsHeader();
  }

  ngOnInit(): void {

    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    console.log(this.masterParams);
    this.loadData();
  }

  ngOnDestroy() {
    this.subSink.unsubscribe();
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

    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST405'
    };

    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY"
    };

    const banksbody: getPayload = {
      ...this.commonParams(),
      item: "BANK"
    };

    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(curbody);
      const service3 = this.masterService.GetMasterItemsList(banksbody);

      this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          this.modes = res1.data;
          this.currencyList = res2.data;
          this.banksList = res3.data;
        },
        (error: any) => {
          this.loader.stop();
          // this.toastr.info(error, "Exception");
        }
      );

    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      depositeType: [''],
      bank: [''],
      bankAccount: [''],
      currency: [''],
      tranDate: [new Date],
      totalAmount: [''],
      notes: ['']
    })
  }

  onSubmit() {

  }

  Close() {

  }

  Reset() {
    this.bankDeptForm.reset();

  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST405",
        // Page: "Bank Deposits",
        // SlNo: 50,
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
  onDetailsCilcked(tranNo: any) {
    //console.log(tranNo);
    // //console.log(code);
    // this.customerId = code;
    // const dialogRef = this.dialog.open(CustomerDetailsComponent);
    const dialogRef: MatDialogRef<BankDepositsDetailsComponent> = this.dialog.open(BankDepositsDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: tranNo  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  detDepositsData(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.glService.getBankDepositsHdr(masterParams).subscribe((res: any) => {
        this.loader.stop();
        console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.bankDeptForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.bankDeptForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.bankDeptForm.controls['bankName'].setValue(res['data'].bankName);
          this.bankHdrCls.bankCode = res['data'].tenant;
          this.bankDeptForm.controls['currency'].setValue(res['data'].currency);
          this.bankDeptForm.controls['remarks'].setValue(res['data'].remarks);
          this.tranStatus = res['data'].tranStatus;
          this.totalAmount = res['data'].totalCharges;
          this.textMessageClass = 'green';
          this.retMessage = this.newTranMsg;

          // return;
        }
        else {
          this.textMessageClass = 'green';
          this.retMessage = res.message;
        }
      });


    }
    catch (ex: any) {
      this.textMessageClass = 'green';
      this.retMessage = ex.message;
    }
  }

  searchData() {
    // //console.log(tranNo);
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'BANKDEPOSITS',
      TranNo: this.bankDeptForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        // //console.log(res);
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.detDepositsData(this.masterParams);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.bankDeptForm.controls['tranNo'].value, 'TranType': "BANKDEPOSITS",
                  'search': 'Deposits Search'
                }
              });
              this.tranStatus = "";
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.bankDeptForm.controls["tranNo"].setValue(result);
                  this.masterParams.tranNo = result;
                  try {
                    this.detDepositsData(this.masterParams);
                  }
                  catch (ex: any) {
                    this.retMessage = "Exception " + ex;
                    this.textMessageClass = 'red';
                  }
                }
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
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }

  }
}
