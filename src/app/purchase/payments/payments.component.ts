import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';
import { UserData } from 'src/app/admin/admin.module';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SalesService } from 'src/app/Services/sales.service';
import { forkJoin } from 'rxjs';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { paymentClass } from 'src/app/sales/sales.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
interface PaymentInterface {
  company: string;
  location: string;
  langID: number;
  payNo: string;
  payDate: Date;
  supplier: string;
  currency: string;
  payMode: string;
  bank: string;
  accNumber: string;
  instrumentNo: string;
  instrumentDate: Date;
  instrumentStatus: string;
  payStatus: string;
  supplierBank: string;
  supplierAccount: string;
  paidDate: Date;
  transferStatus: string;
  tranAmount: number;
  remarks: string;
  mode: string;
  User: string;
  RefNo: string;
}

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})

export class PaymentsComponent implements OnInit {
  paymentForm!: FormGroup;
  modes!: any[];
  modeIndex!: number;
  userData: any;
  masterParams!: MasterParams;
  payCls: paymentClass;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  private subSink!: SubSink;
  public fetchStatus: boolean = true;
  public disableDetail: boolean = true;
  dialogOpen = false;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  payMode: any = [];
  bank: any = [];
  currency: any = [];
  checkStatusList: any = [];
  payStatus!: string
  supCode: any;
  StatusList: any = [{ itemCode: "cleared", itemName: "Cleared" },
  { itemCode: "paid", itemName: "Paid" },
  { itemCode: "bounced", itemName: "Bounced" },
  { itemCode: "pending", itemName: "Pending" }]
  userDataService: any;
  constructor(protected route: ActivatedRoute,
    protected router: Router, private utlService: UtilitiesService,
    private datePipe: DatePipe,
    private masterService: MastersService,
    public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private purService: PurchaseService, private saleService: SalesService,
    private fb: FormBuilder) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.payCls = new paymentClass();

    this.paymentForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      payNo: [''],
      payDate: [new Date(), [Validators.required]],
      supplier: ['', Validators.required],
      currency: ['', Validators.required],
      payMode: ['', Validators.required],
      bank: ['', Validators.required],
      accNumber: ['', Validators.required],
      instrumentNo: ['', Validators.required],
      instrumentDate: [new Date(), [Validators.required]],
      instrumentStatus: ['', Validators.required],
      // payStatus: ['',Validators.required],
      supplierBank: ['', Validators.required],
      supplierAccount: ['', Validators.required],
      paidDate: [new Date(), Validators.required],
      transferStatus: ['', Validators.required],
      tranAmount: ['', Validators.required],
      remarks: [''],
    });
  }
  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
    }
    const body = {
      company: this.userData.company,
      location: this.userData.location,
      user: this.userData.userID,
      item: 'ST107',
      refNo: this.userData.sessionID
    };
    this.masterParams.langId = this.userData.langId;;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    // this.masterParams.item = this.paymentForm.controls['payNo'].value;
    this.masterService.getModesList(body).subscribe((res: any) => {
      //console.log(res);
      this.modes = res['data'];
      this.modeIndex = this.modes.findIndex(x => x.itemCode === "View");
      this.paymentForm.controls['mode'].setValue(this.modes[this.modeIndex].itemCode);
    });
    this.loadData();

  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const formData: PaymentInterface = this.paymentForm.value;
      this.payCls.Mode = formData.mode;
      this.payCls.RefNo = this.userData.sessionID;
      this.payCls.User = this.userData.userID;
      this.payCls.company = this.userData.company;
      this.payCls.accNumber = formData.accNumber;
      this.payCls.bank = formData.bank;
      this.payCls.currency = formData.currency;
      this.payCls.instrumentDate = formData.instrumentDate;
      this.payCls.instrumentNo = formData.instrumentNo;
      this.payCls.instrumentStatus = formData.instrumentStatus;
      this.payCls.langID = 1;
      this.payCls.location = this.userData.location;
      this.payCls.paidDate = formData.paidDate;
      this.payCls.payDate = formData.payDate;
      this.payCls.payMode = formData.payMode;
      this.payCls.payNo = formData.payNo;
      this.payCls.payStatus = formData.payStatus;
      this.payCls.remarks = formData.remarks;
      this.payCls.supplier = this.supCode;
      this.payCls.supplierAccount = formData.supplierAccount;
      this.payCls.supplierBank = formData.supplierBank;
      this.payCls.tranAmount = formData.tranAmount;
      // this.payCls.tranStatus=formData.transferStatus;
      this.payCls.transferStatus = formData.transferStatus;

      this.loader.start();
      this.subSink.sink = this.saleService.updatePaymentDetails(this.payCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.paymentForm.controls['payNo'].setValue(res.tranNoNew);
          if (this.paymentForm.controls['mode'].value === "Add") {
            this.modeChange("Modify");
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })

    }
  }
  modeChange(mode: String) {
    if (mode === 'Add') {
      this.reset();
      this.paymentForm.controls['mode'].setValue(mode);
      this.paymentForm.controls['payNo'].disable();
    }
    else {
      this.paymentForm.controls['payNo'].enable();
      this.paymentForm.controls['mode'].setValue(mode);
    }
  }

  onSearchCustomer() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "SUPPLIER",
      Item: this.paymentForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        //console.log(res.data.selName);
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.paymentForm.controls['supplier'].patchValue(res.data.selName);
            this.supCode = res.data.code;
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.paymentForm.controls['supplier'].value, 'PartyType': "SUPPLIER",
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                //console.log(`Dialog result: ${result}`);
                this.paymentForm.controls['supplier'].setValue(result.partyName);
                this.supCode = result.code;
                this.dialogOpen = false;
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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }
  reset() {

    this.paymentForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
    this.payStatus = "";

  }
  refresh() {
    // this.paymentForm.reset();
  }
  loadData() {
    const paymodebody = {
      Company: this.userData.company,
      Location: this.userData.location,
      Item: "PAYMODE",
      refNo: this.userData.sessionID,
      user: this.userData.userID
    };

    const currbody = {
      Company: this.userData.company,
      Location: this.userData.location,
      Item: "CURRENCY",
      refNo: this.userData.sessionID,
      user: this.userData.userID
    };
    const bankbody = {
      Company: this.userData.company,
      Location: this.userData.location,
      Item: "BANK",
      refNo: this.userData.sessionID,
      user: this.userData.userID
    };
    const service = this.saleService.GetMasterItemsList(paymodebody);
    const service1 = this.saleService.GetMasterItemsList(currbody);
    const service2 = this.saleService.GetMasterItemsList(bankbody);

    this.loader.start();
    this.subSink.sink = forkJoin([service, service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        this.payMode = res1.data;
        this.currency = res2.data;
        this.bank = res3.data;

      },
      (error: any) => {
        this.loader.stop();
        // this.toastr.info(error, "Exception");
      }
    );
  }


  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onSearchCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      TranType: 'PAYMENT',
      TranNo: this.paymentForm.controls['payNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY",
      User: this.userData.userID,
      RefNo: this.userData.sessionID
    }
    this.subSink.sink = this.purService.GetTranCount(body).subscribe((res: any) => {
      if (res.status != "fail") {
        if (res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.getPaymentsData(this.masterParams);
        }
        else {
          this.retMessage = '';
          if (!this.dialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              height: '90%',
              disableClose: true,
              data: { tranNum: this.paymentForm.controls['payNo'].value, search: 'Payments Search', TranType: "PAYMENT" }  // Pass any data you want to send to CustomerDetailsComponent
            });
            dialogRef.afterClosed().subscribe(result => {
              //console.log(`Dialog result: ${result}`);
              if (result != true) {
                this.masterParams.tranNo = result;
                this.getPaymentsData(this.masterParams);
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

  getPaymentsData(masterParams: MasterParams) {
    try {
      this.loader.start();
      this.saleService.GetPaymentsDetails(masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        if (res.status.toUpperCase() === "FAIL") {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        else {
          this.paymentForm.patchValue(res['data']);
          this.paymentForm.controls['mode'].setValue('View');
          this.supCode = res['data'].supplier;
          this.payStatus = res['data'].tranStatus;
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
      });
    }
    catch (ex) {
      this.retMessage = "Exception " + ex;
      this.textMessageClass = "red";
    }

  }

  onDetailsCilcked(tranNo: any) {
    //console.log(tranNo);
    const dialogRef: MatDialogRef<PaymentDetailsComponent> = this.dialog.open(PaymentDetailsComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: tranNo  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }

  clear() {
    // this.paymentForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.paymentForm = this.formInit();
    this.payStatus = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }
  onDocsCilcked(value: string) {
    // //console.log(tranNo);
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: { mode: this.paymentForm.controls['mode'].value, tranNo: this.paymentForm.controls['payNo'].value, search: 'Payment Docs', tranType: "PAYMENT" }
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }

  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST107",
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userData.userID,
        RefNo: this.userData.sessionID

        // ScrId: "ST107",
        // Page: " Payment/Recipts",
        // SlNo: 17,
        // User: this.userData.userID,
        // RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  NotesDetails(tranNo:any){
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo,
      'mode': this.paymentForm.controls['mode'].value,
     // 'note':this.purReqHdrForm.controls['notes'].value ,
      'TranType': "PAYMENT",  // Pass any data you want to send to CustomerDetailsComponent
      'search' :"Payment Notes"}
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "PAYMENT",
        'tranNo': tranNo,
        'search': 'Payment Log Details'
      }
    });
  }

}
