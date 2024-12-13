import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { Item } from 'src/app/general/Interface/interface';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-relocate',
  templateUrl: './relocate.component.html',
  styleUrls: ['./relocate.component.css']
})
export class RelocateComponent implements OnInit, OnDestroy {
  assetInvoiceForm!: FormGroup;
  retMessage!: string;
  modes: Item[] = [];
  currencyList: Item[] = [];
  @Input() max: any;
  today = new Date();
  textMessageClass: string = "";

  tranStatus: string = "";
  masterParams!: MasterParams;
  dialogOpen = false;
  monthlist: any = [
    { itemCode: 1, itemName: "January" },
    { itemCode: 2, itemName: "February" },
    { itemCode: 3, itemName: "March" },
    { itemCode: 4, itemName: "April" },
    { itemCode: 5, itemName: "May" },
    { itemCode: 6, itemName: "June" },
    { itemCode: 7, itemName: "July" },
    { itemCode: 8, itemName: "August" },
    { itemCode: 9, itemName: "September" },
    { itemCode: 10, itemName: "October" },
    { itemCode: 11, itemName: "November" },
    { itemCode: 12, itemName: "December" }
  ]
  yearList: Item[] = [];
  newTranMsg: string = "";
  private subSink: SubSink;
  payTermList: Item[] = [];

  constructor(private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    private masterService: MastersService,
    protected router: Router,
    protected saleService: SalesService,
    private datePipe: DatePipe) {
    this.subSink = new SubSink();
    this.assetInvoiceForm = this.formInit();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: ['', [Validators.maxLength(18)]],
      saleDate: [new Date(), [Validators.required]],
      endDate: [new Date(), [Validators.required]],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      currency: ['', [Validators.required, Validators.maxLength(10)]],
      exchRate: ['1.0000', [Validators.required]],
      excutive: ['', [Validators.required, Validators.maxLength(50)]],
      lpoNo: ['', [Validators.required, Validators.maxLength(18)]],
      applyVAT: [false],
      isLimited: [false],
      remarks: [''],
      isRecurring: [false],
      dueDate: [new Date(), Validators.required],
      invDay: ['', Validators.required],
      invYear: ['', Validators.required],
      invMonth: ['', Validators.required],
      penaltyDay: ['', Validators.required]
    });
  }
  ngOnInit(): void {

    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
  }

  loadData() {

    const commonParams = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
    try {
      this.loader.start();
      const service1 = this.masterService.getModesList({ ...commonParams, item: 'ST206' });
      const service2 = this.masterService.GetMasterItemsList({ ...commonParams, item: 'CURRENCY' });
      const service3 = this.masterService.GetMasterItemsList({ ...commonParams, item: 'PAYTERM' });
      this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          const res3 = results[2];
          this.modes = res1.data;
          this.currencyList = res2.data;
          this.payTermList = res3.data;
        },
        (error: any) => {
          this.loader.stop();
          this.handleError(error);
          // this.toastr.info(error, "Exception");
        }
      );

    } catch (ex: any) {
      this.loader.stop();
      this.handleError(ex);
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }
  handleSuccess(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'green';
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
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'TENINV',
      TranNo: this.assetInvoiceForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.getInvoiceData(this.masterParams);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetInvoiceForm.controls['tranNo'].value, 'TranType': "TENINV",
                  'search': 'Invoice Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.assetInvoiceForm.controls["tranNo"].setValue(result);
                  this.masterParams.tranNo = result;
                  try {
                    this.getInvoiceData(this.masterParams);
                  }
                  catch (ex: any) {
                    this.handleError(ex);
                  }
                }
              });
            }
          }
        }
        else {
          this.handleError(res);
        }

      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }

  }
  getInvoiceData(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.subSink.sink = this.saleService.getTenantInvoiceHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.assetInvoiceForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.assetInvoiceForm.controls['saleDate'].setValue(res['data'].tranDate);
          this.assetInvoiceForm.controls['customer'].setValue(res['data'].tenantName);
          this.assetInvoiceForm.controls['currency'].setValue(res['data'].currency);
          this.assetInvoiceForm.controls['exchRate'].setValue(res['data'].exchRate);
          this.assetInvoiceForm.controls['excutive'].setValue(res['data'].exeName);
          this.assetInvoiceForm.controls['lpoNo'].setValue(res['data'].lpoNo);
          this.assetInvoiceForm.controls['invDay'].setValue(res['data'].invDay);
          this.assetInvoiceForm.controls['applyVAT'].setValue(res['data'].applyVAT);
          this.assetInvoiceForm.controls['isRecurring'].setValue(res['data'].isRecurring);
          this.assetInvoiceForm.controls['isLimited'].setValue(res['data'].isLtdPeriod);
          this.assetInvoiceForm.controls['remarks'].setValue(res['data'].remarks);
          this.assetInvoiceForm.controls['invMonth'].setValue(res['data'].rentMonth);
          this.assetInvoiceForm.controls['invYear'].setValue(res['data'].rentYear);
          this.assetInvoiceForm.controls['dueDate'].setValue(res['data'].dueDate);
          this.assetInvoiceForm.controls['endDate'].setValue(res['data'].endsOn);
          this.assetInvoiceForm.controls['penaltyDay'].setValue(res['data'].penaltyPerDay);
          this.tranStatus = res['data'].tranStatus;
          // this.amountExclVat = res['data'].rentalCharges;
          // this.charges = res['data'].othrCharges;
          // this.vatAmount = res['data'].vatAmount;
          //this.totalAmount = res['data'].totalCharges;


        }
        else {
          this.loader.stop();
          this.handleError(res);
        }
      });
    }
    catch (ex) {
      this.loader.stop();
      this.handleError(ex);
    }
  }

  onEmployeeSearch() {

  }

  Close() {

  }
  clear() {

  }
}
