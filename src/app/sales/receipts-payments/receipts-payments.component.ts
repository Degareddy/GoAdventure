import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { DatePipe, Location } from '@angular/common';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SalesService } from 'src/app/Services/sales.service';
import { SubSink } from 'subsink';
import { combineLatest, forkJoin, startWith } from 'rxjs';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ToastrService } from 'ngx-toastr';
import { MastersService } from 'src/app/Services/masters.service';
import { AccessSettings } from 'src/app/utils/access';
import { TextClr } from 'src/app/utils/enums';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { AdminService } from 'src/app/Services/admin.service';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TenantSearchComponent } from '../receipts/tenant-search/tenant-search.component';
import { Router } from '@angular/router';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { dateFormat } from '../sales.class';
import { AllocateComponent } from '../receipts/allocate/allocate.component';


@Component({
  selector: 'app-receipts-payments',
  templateUrl: './receipts-payments.component.html',
  styleUrls: ['./receipts-payments.component.css']
})

export class ReceiptsPaymentsComponent implements OnInit {
title:string="Receipts - Payments";
receiptsForm!:FormGroup;
retMessage:string="";
submitButton:boolean=false
balance:number=0
textMessageClass:string="";
tomorrow=new Date()
selecTedClient:String=''
allocStatus:string=''
accountNosCmp:Item[]=[]
// accountNosClient:Item[]=[]
receiptmodes:Item[]=[
  {itemCode:"rctForBooking",itemName:"Receipt for Booking"},
  {itemCode:"paymentForExp",itemName:"Payment for Expense"},
  {itemCode:"other",itemName:"...Other"},
]
dialogOpen:boolean=false
modes:Item[]=[]
filteredItemsClientType:Item[]=[
  {itemCode:"Customer",itemName:"Customer"},
  {itemCode:"Vendor",itemName:"Vendor"},
  {itemCode:"Staff",itemName:"Staff"},
]
filteredItemsTranFor:Item[]=[]
rctTypeList:Item[]=[
  {itemCode:"Receipt",itemName:"Receipt"},
  {itemCode:"Payment",itemName:"Payment"},
]
filteredpayMode:Item[]=[]
dateFormat!:dateFormat
clinentProviders:Item[]=[]
companyProviders:Item[]=[]
providerTypes:Item[]=[]
bank:Item[]=[]
tranFor:Item[]=[]
statusList:Item[]=[
  {itemCode:"Pending",itemName:"Pending"},
  {itemCode:"Paid",itemName:"Paid"},
]
private subSink!: SubSink;
  constructor(private fb: FormBuilder , private location: Location, private userDataService:UserDataService,protected router: Router  
     , public dialog: MatDialog,

    private glService: GeneralLedgerService,
    private adminService: AdminService,
        private masterService: MastersService,
    
    private toaster: ToastrService,
  private datePipe: DatePipe,
    private loader: NgxUiLoaderService,
  

     private saleService: SalesService,
  ) { 
    this.receiptsForm=this.formInit()
        this.subSink = new SubSink();
        this.dateFormat=new dateFormat(datePipe);  
    
  }

  ngOnInit(): void {
    this.loadBankTypes();
    // this.loadProviderSubTypes();
    const modeBody = {
      ...this.commonParams(),
      item: 'ST210',
    };
    try {
      this.subSink.sink =  this.masterService.getModesList(modeBody).subscribe((res: any) => {
        if (res.status.toUpperCase() === 'SUCCESS') {
          this.modes = res['data'];
        } else {
          this.displayMessage("Modes list empty!", 'red');
        }
      });
    } catch (ex: any) {
      this.displayMessage("Error " + ex.message, 'red');
    }
    this.loadData();
   combineLatest([
      this.receiptsForm.get('rctAmount')!.valueChanges.pipe(startWith(0)),
      this.receiptsForm.get('charges')!.valueChanges.pipe(startWith(0))
    ]).subscribe(() => {
      this.calculateTotal();
    });

    this.calculateTotal();
  }
  onSubmit(){
    this.displayMessage('','');
      const body={

        Mode:this.receiptsForm.get('mode')?.value,
        Company:this.userDataService.userData.company,  
        Location:this.userDataService.userData.location,
        TranType:this.receiptsForm.get('rctType')?.value,
        TranNo:this.receiptsForm.get('tranNo')?.value,
        TranDate:this.receiptsForm.get('tranDate')?.value,
        ClientType:this.receiptsForm.get('clientType')?.value,
        Client:this.selecTedClient,
        IsRecurring:this.receiptsForm.get('recurring')?.value,
        PayMode:this.receiptsForm.get('rctMode')?.value,
        Currency:"INR",
        ExchRate:1.00,
        ClientBank:this.receiptsForm.get('provider')?.value,
        ClientAccount:this.receiptsForm.get('CustaccountNo')?.value,
        ClientAccName:this.receiptsForm.get('holder')?.value,
        ClientBankRefNo:this.receiptsForm.get('refNo')?.value,
        ClientBankRefDate:this.receiptsForm.get('refDate')?.value,
        OtherFirstRefNo:this.receiptsForm.get('otherRef1')?.value,
        OtherSecondRefNo:this.receiptsForm.get('otherRef2')?.value,
        OtherRefDate:new Date(),
        ClientTranStatus:this.receiptsForm.get('status')?.value,
        TxnBank:this.receiptsForm.get('accountProvider')?.value,
        TxnAccount:this.receiptsForm.get('cmpAccountNo')?.value,
        TxnDate:this.receiptsForm.get('tranDate')?.value,
        TxnStatus:'',
        TranFor:this.receiptsForm.get('tranFor')?.value,
        TranAmount:this.receiptsForm.get('rctAmount')?.value,
        TranBy:this.userDataService.userData.userID,
        TranAt:new Date(),
        // AllottedAmount:this.receiptsForm.get()?.value,
        PaidCurrency:"INR",
        PaidExchRate:1.00,
        Charges:0.00,
        PaidAmt:this.receiptsForm.get('rctAmount')?.value,
        Remarks:'',
        User:this.userDataService.userData.userID,
        RefNo:this.userDataService.userData.sessionID
      }
      this.loader.start();
      this.subSink.sink = this.saleService.UpdateReceiptsAndPayments(body).subscribe((res: any) => {
         this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
           this.receiptsForm.get('mode')?.patchValue('Modify');
           this.receiptsForm.get('tranNo')?.patchValue(res.tranNoNew);
           this.displayMessage(res.message,TextClr.green);
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
  }
  onngDestroy(){
    localStorage.setItem('previousScreen','Receipts - Payments');
  }
    commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    };
  }
  banktypeChange(name:any,name2:any){
    this.displayMessage('','');
  const body=  {
    company: this.userDataService.userData.company,
    location:  this.userDataService.userData.location,
    Type:this.receiptsForm.get(name2)!.value,
    user:  this.userDataService.userData.userID,
    refNo:  this.userDataService.userData.sessionID,
    
    }
    this.loader.start();
    this.subSink.sink = this.glService.GeBanksList(body).subscribe((res: any) => {
       this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(res.message,TextClr.green);
            if(name === 'provider' && name2 ==="providerType"){
              this.clinentProviders = res.data.map((bank: any) => ({
              itemCode: bank.code,
              itemName: bank.bankName
            }));
            if(this.clinentProviders.length === 2){
              this.receiptsForm.get(name)!.patchValue(this.clinentProviders[1].itemCode);
              // this.loadBankAccountNumber();
            }
            }
            else if(name === 'accountProvider' && name2 ==="accountProviderType" ){
              this.companyProviders = res.data.map((bank: any) => ({
              itemCode: bank.code,
              itemName: bank.bankName
            }));
            if(this.clinentProviders.length === 2){
              this.receiptsForm.get(name)!.patchValue(this.clinentProviders[1].itemCode);
              this.loadBankAccountNumber();
            }
            }
            
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
  }
    private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  loadBankAccountNumber(){
    this.displayMessage('','');
    const body={
      Mode:this.receiptsForm.get('mode')?.value,
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      Type:'BANKACCTS',
      Item:this.receiptsForm.get('accountProviderType')?.value,
      ItemFirstLevel:this.receiptsForm.get('accountProvider')?.value,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID
    }
    this.loader.start();
    this.subSink.sink = this.masterService.GetCascadingMasterItemsList(body).subscribe((res: any) => {
      this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(res.message,TextClr.green);
            this.accountNosCmp=res.data;
            // this.providerTypes = res['data'];
            // if (this.providerTypes.length === 1) {
            //   this.receiptsForm.get('typeName')!.patchValue(this.providerTypes[0].itemCode);
            //   // this.onSelectedTypeChanged()
            // }
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
  }

   async loadData() {
     const service = this.saleService.GetMasterItemsList({
       ...this.commonParams(),
       item: 'PAYMODE',
       mode:this.receiptsForm.get('mode')?.value
     });
     const service1 = this.saleService.GetMasterItemsList({
       ...this.commonParams(),
       item: 'CURRENCY',
       mode:this.receiptsForm.get('mode')?.value
     });
     const service2 = this.saleService.GetMasterItemsList({
       ...this.commonParams(),
       item: 'BANK',
       mode:this.receiptsForm.get('mode')?.value
     });
     const service3 = this.saleService.GetMasterItemsList({
       ...this.commonParams(),
       item: 'TRANFOR',
       mode:this.receiptsForm.get('mode')?.value
     });
     // this.loader.start();
     this.subSink.sink = await forkJoin([
       service,
       service1,
       service2,
       service3,
     ]).subscribe(
       (results: any[]) => {
         // this.loader.stop();
         const res1 = results[0];
         const res2 = results[1];
         const res3 = results[2];
         const res4 = results[3];
         if (res1.status.toUpperCase() === 'SUCCESS') {
           this.filteredpayMode = res1.data;
         } else {
           this.displayMessage('Error: Paymode list empty!', 'red');
         }
 
         if (res2.status.toUpperCase() === 'SUCCESS') {
          //  this.currency = res2.data;
         } else {
           this.displayMessage('Error: Currency list empty!', 'red');
         }
 
         if (res3.status.toUpperCase() === 'SUCCESS') {
           this.bank = res3.data;
         } else {
           this.displayMessage('Error: Bank list empty!', 'red');
         }
         if (res4.status.toUpperCase() === 'SUCCESS') {
           this.tranFor = res4.data;
           this.filteredItemsTranFor = res4.data;
         } else {
           this.displayMessage('Error: Transaction for list empty!', 'red');
         }
         // this.bank = res3.data;
         // this.overHeadsLsit = res4.data;
       },
       (error: any) => {
         this.loader.stop();
         this.toaster.info(error.message, 'Exception');
       }
     );
   }
  receiptTypeChange(mode:string){
      if(mode =='rctForBooking'){
         this.receiptsForm.get('mode')?.patchValue('Add');
         this.receiptsForm.get('clientType')?.patchValue('Customer');
         this.receiptsForm.get('tranFor')?.patchValue('BKG');
         this.receiptsForm.get('rctType')?.patchValue('Receipt');
         this.receiptsForm.get('rctMode')?.patchValue('OLTRF'
         );
      }
      else if(mode =='paymentForExp'){

      }
      else[

      ]
  }
  // loadProviderSubTypes() {
  //     const bankbody: getPayload = {
  //       ...this.commonParams(),
  //       item: "BANK",
  //       mode:this.receiptsForm.get('mode')?.value
  //     };
      
  //     const service1 = this.adminService.GetMasterItemsList(bankbody);
  //     this.subSink.sink = forkJoin([service1]).subscribe(
  //       (results: any[]) => {
  //         this.loader.stop();
  //         const res1 = results[0];
  //         this.providers = res1.data;
  //       },
  //       (error: any) => {
  //         this.loader.stop();
  //       }
  //     );
  //   }
  loadBankTypes(){
    this.displayMessage('','')
    const body=  {
    company: this.userDataService.userData.company,
    location:  this.userDataService.userData.location,
    selLocation: "",
    type: "",
    tranType: "",
    item: "BANKTYPE",
    itemFirstLevel: "",
    itemSecondLevel: "",
    user:  this.userDataService.userData.userID,
    password: "",
    refNo:  this.userDataService.userData.sessionID,
    tranNo: "",
    mode: ""
    }
    this.subSink.sink = this.masterService.GetMasterItemsList(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(res.message,TextClr.green);
            this.providerTypes = res['data'];
            if (this.providerTypes.length === 1) {
              this.receiptsForm.get('typeName')!.patchValue(this.providerTypes[0].itemCode);
              // this.onSelectedTypeChanged()
            }
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
    }
  modeChange(mode:string){
    if(this.receiptsForm.get('mode')?.value === 'Add'){
      this.receiptsForm=this.formInit();
      this.receiptsForm.get('tranNo')?.disable()
      this.receiptsForm.get('mode')?.patchValue('Add');
    }
    else{
      this.receiptsForm.get('tranNo')?.enable();
    }
  }
  clear(){
    this.receiptsForm = this.formInit()
  }
  close(){
        this.router.navigateByUrl('/home');

  }
  PayModeChanged(){
    if(this.receiptsForm.get('rctMode')?.value === 'CASH'){
    this.receiptsForm.get('providerType')?.disable();
    this.receiptsForm.get('holder')?.disable();
    this.receiptsForm.get('CustaccountNo')?.disable();
    this.receiptsForm.get('refNo')?.disable();
    this.receiptsForm.get('refDate')?.disable();
    this.receiptsForm.get('otherRef1')?.disable();
    this.receiptsForm.get('otherRef2')?.disable();
    this.receiptsForm.get('status')?.disable();
    this.receiptsForm.get('accountProviderType')?.disable();
    this.receiptsForm.get('accountProvider')?.disable();
    this.receiptsForm.get('CustaccountNo')?.disable();
    this.receiptsForm.get('provider')?.disable();
       this.receiptsForm.get('provider')?.disable();
}
else{
    this.receiptsForm.get('providerType')?.enable();
    this.receiptsForm.get('holder')?.enable();
    this.receiptsForm.get('CustaccountNo')?.enable();
    this.receiptsForm.get('refNo')?.enable();
    this.receiptsForm.get('refDate')?.enable();
    this.receiptsForm.get('otherRef1')?.enable();
    this.receiptsForm.get('otherRef2')?.enable();
    this.receiptsForm.get('status')?.enable();
    this.receiptsForm.get('accountProviderType')?.enable();
    this.receiptsForm.get('accountProvider')?.enable();
    this.receiptsForm.get('CustaccountNo')?.enable();
    this.receiptsForm.get('provider')?.enable();
       this.receiptsForm.get('provider')?.enable();
}
  }
  onSelectionChangetranType(){
    if(this.receiptsForm.get('rctType')?.value===''){
      this.submitButton=true
    }
      if(this.receiptsForm.get('mode')?.value==='View'){
      this.submitButton=true
    }
      if(this.receiptsForm.get('clientType')?.value===''){
      this.submitButton=true
    }
      if(this.selecTedClient == ''){
      this.submitButton=true
    }
      if(this.receiptsForm.get('tran')?.value===''){
      this.submitButton=true
    }
    else{
      this.submitButton=false
    }
  }
  isSubmitBtn():boolean{
    if(this.receiptsForm.get('rctType')?.value ===''){
      return true
    }
    if(this.receiptsForm.get('clientType')?.value ===''){
      return true
    }
    if(this.selecTedClient ===''){
      return true
    }
    if(this.receiptsForm.get('tranFor')?.value ===''){
      return true
    }
    if(this.receiptsForm.get('rctMode')?.value ===''){
      return true
    }
    if(this.receiptsForm.get('rctMode')?.value ===''){
      return true
    }
    return false;
  }
  // calculateTotal() {
  //   const amount = Number(this.receiptsForm.get('rctAmount')?.value) || 0;
  //   const charges = Number(this.receiptsForm.get('charges')?.value) || 0;
  //   const total = amount + charges;
    
  //   this.receiptsForm.get('total')?.setValue(total);
  // }

  // Format number for display only
  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }
  
  onSelectionChangeClientType(){}
  onSearchClientName(){
    
        this.displayMessage("", "");
        let clientTypeTemp = '';
        
        const body = {
          ...this.commonParams(),
          property: 'All',
          block: 'All',
          unit: 'All',
          Client: this.receiptsForm.controls['clientName'].value || '',
          ClientType: clientTypeTemp,
          txnFor: this.receiptsForm.controls['tranFor'].value || '',
          isSummary: false,
          Report: 'CLIENTBAL'
        };
        try {
          // this.subSink.sink =  this.saleService.GetClientBalances(body).subscribe((res: any) => {
            // if (res.status.toUpperCase() === 'SUCCESS') {
              // if (res && res.data && res.data.length === 1) {
              //   if (this.userDataService.userData.userID === res.data[0].clientCode && this.receiptsForm.controls['rctType'].value.toUpperCase() !== 'PAYMENT' && this.receiptsForm.controls['tranFor'].value.toUpperCase() !== 'EXPENSE') {
              //     this.displayMessage("Error: You can't make payment to yourself.", "red");
              //     return;
              //   }
              //   this.receiptsForm.controls['customer'].patchValue(res.data[0].clientName);
              //   // this.supCode = res.data[0].clientCode;
              //   this.receiptsForm.controls['accname'].patchValue(res.data[0].clientName);
              //   this.receiptsForm.controls['currency'].patchValue(res.data[0].currency);
              //   this.receiptsForm.controls['paidCurrency'].patchValue(res.data[0].currency);
              //   // this.receiptAmount = res.data[0].balAmount;
              //   const balAmount = res.data[0].balAmount;
              //   const positiveAmount = Math.abs(balAmount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    
              //   this.receiptsForm.controls['rctAmount'].patchValue(positiveAmount || '0.00');
    
              // }
              //  else {
                if (!this.dialogOpen) {
                      

                  const dialogRef: MatDialogRef<TenantSearchComponent> = this.dialog.open(TenantSearchComponent, {
                    width: '90%',
                    disableClose: true,
                    data: {

                      PartyName: this.receiptsForm.controls['clientName'].value,
                      PartyType: this.receiptsForm.controls['clientType'].value.toUpperCase(),
                      search: this.receiptsForm.controls['clientType'].value + ' Search',
                      // serData: res.data,
                      searchFor:'CLIENTBAL',
                      txnFor: this.receiptsForm.controls['tranFor'].value || '',
                      clientType: this.receiptsForm.controls['clientType'].value
                    },
                  });
                  this.dialogOpen = true;
                  dialogRef.afterClosed().subscribe((result) => {
                        

                    console.log(result);
                    this.selecTedClient = result.code;
                    this.receiptsForm.controls['clientName'].patchValue(result.partyName);
                    this.dialogOpen = false;
                    this.loadClientBal();
                  });
                }
              // }
            // } else {
            //   this.displayMessage('No client balances available for this location!', 'red');
            // }
          // });
        } catch (ex: any) {
          this.displayMessage('Exception: ' + ex.message, 'red');
        }
  }
  loadClientBal(){
    
    const body=  {
    company: this.userDataService.userData.company,
    location:  this.userDataService.userData.location,
   Client:this.selecTedClient,
    user:  this.userDataService.userData.userID,
    refNo:  this.userDataService.userData.sessionID,
   
    }
    this.subSink.sink = this.saleService.GetClientBalance(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.balance = res.data.balance;
           this.receiptsForm.get('rctAmount')?.patchValue(this.balance);
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
    }
  
  onSearchCilcked(){
    try {
         
          
                if (!this.dialogOpen) {
                  this.dialogOpen = true;
                  const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                    width: '90%',
                    disableClose: true,
                    data: {
                      'tranNum':'',
                      'search': 'Receipt/Payment Search'
                    }
                  });
    
                  dialogRef.afterClosed().subscribe(result => {
                    this.dialogOpen = false;
                    if (result != true) {
                      this.receiptsForm.get('tranNo')?.patchValue(result.tranNo);
                      this.selecTedClient=result.client
                      this.receiptsForm.get('clientName')?.patchValue(result.clientName);
                      this.receiptsForm.get('tranDate')?.patchValue(this.dateFormat.formatDate(result.tranDate));
                     this.getTranNoData(); 
                    }
                  });
                }
        }       
    
        catch (ex: any) {
          this.retMessage = "Exception " + ex.message;
          this.textMessageClass = 'red';
        }
  }
  getTranNoData(){
    const body={
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      TranNo:this.receiptsForm.get('tranNo')?.value,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID,
    }
    this.subSink.sink = this.saleService.GetReceiptPaymentsDetails(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(res.message,TextClr.green);
            this.patchForm(res.data);
          }
          else {
            this.displayMessage(res.message + " for types list!", TextClr.red);
          }
    
        });
    }
  getInrFormat(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
  patchForm(data:any){
    this.receiptsForm.get('mode')?.patchValue("Modify");
    // this.receiptsForm.get('receiptmode')?.patchValue(data.);
    this.receiptsForm.get('tranDate')?.patchValue(this.dateFormat.formatDate(data.tranDate));
    this.receiptsForm.get('tranNo')?.patchValue(data.tranNo);
    this.receiptsForm.get('clientType')?.patchValue(data.clientType);
    this.receiptsForm.get('clientName')?.patchValue(data.clientName);
    this.receiptsForm.get('tranFor')?.patchValue(data.tranFor);
    this.receiptsForm.get('rctType')?.patchValue(data.tranType);
    this.receiptsForm.get('rctMode')?.patchValue(data.payMode);
    this.receiptsForm.get('rctAmount')?.patchValue(this.getInrFormat(data.tranAmount));
    this.receiptsForm.get('recurring')?.patchValue(data.isRecurring);
    this.receiptsForm.get('providerType')?.patchValue(data.clientBankType);
    this.banktypeChange('provider','providerType')
    this.receiptsForm.get('provider')?.patchValue(data.clientBank);
    this.receiptsForm.get('provider')?.patchValue(data.clientBank);
    this.receiptsForm.get('refNo')?.patchValue(data.clientBankRefNo);
    this.receiptsForm.get('refDate')?.patchValue(this.dateFormat.formatDate(data.clientBankRefDate));
    this.receiptsForm.get('otherRef2')?.patchValue(data.otherFirstRefNo);
    this.receiptsForm.get('otherRef1')?.patchValue(data.otherSecondRefNo);
    this.receiptsForm.get('status')?.patchValue(data.clientTranStatus);
    this.receiptsForm.get('holder')?.patchValue(data.clientAccName);
    this.receiptsForm.get('accountNo')?.patchValue("Modify");
    this.receiptsForm.get('accountProviderType')?.patchValue(data.txnBankType);
    this.banktypeChange('accountProvider','accountProviderType');
    this.receiptsForm.get('accountProvider')?.patchValue(data.txnBank);
    this.loadBankAccountNumber()
     this.receiptsForm.get('cmpAccountNo')?.patchValue(data.txnAccount);
    this.receiptsForm.get('CustaccountNo')?.patchValue(data.clientAccount);
    this.receiptsForm.get('charges')?.patchValue(this.getInrFormat(data.charges));
    this.receiptsForm.get('total')?.patchValue(this.getInrFormat(data.paidAmt));
    // this.receiptsForm.get('mode')?.patchValue(data.charges);
    this.selecTedClient=data.client
    this.allocStatus=data.tranStatus
  }
  tranDateChanged(){}
  formInit() {
    return this.fb.group({
      receiptmode: [''],
      mode:['View'],
      tranDate:[new Date()],
      tranNo:[''],
      clientType:[''],
      clientName:[''],
      tranFor:[''],
      rctType:[''],
      rctMode:[''],
      rctAmount:[0],
      recurring:[false],
      providerType: [''],
      provider: [''],
      refNo: [''],
      refDate: [new Date()],
      otherRef1: [''],
      otherRefDate1: [''],
      otherRef2: [''],
      status: ['Paid'],
      holder:[''], 
      accountNo:[''],
      accountProviderType: [''],
      accountProvider: [''],
      CustaccountNo: [''],
      charges:[0],
      total:[0,{disabled: true}],
      cmpAccountNo:['']
    });
    }
  goBack(): void {
    this.location.back();
  }
  // onSelectionChangeProviderType(){
  //   const body=  {
  // company: this.userDataService.userData.company,
  // location:  this.userDataService.userData.location,
  // Type:this.receiptsForm.get('providerType')!.value,
  // user:  this.userDataService.userData.userID,
  // refNo:  this.userDataService.userData.sessionID,
  
  // }
  // this.subSink.sink = this.glService.GeBanksList(body).subscribe((res: any) => {
  //       if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
  //         this.providers = res['data'];
  //         if (this.providers.length === 1) {
  //           this.receiptsForm.get('provider')!.patchValue(this.providers[0].itemCode);
  //           // this.onSelectedTypeChanged()
  //         }
  //       }
  //       else {
  //         this.displayMessage(res.message + " for types list!", TextClr.red);
  //       }
  
  //     });
  // }

  allocate() {
    console.log(this.receiptsForm.controls['tranNo'].value);
      const dialogRef: MatDialogRef<AllocateComponent> = this.dialog.open(AllocateComponent,
        {
          width: '80%', // Set the width of the dialog
          disableClose: true,
          data: {
            mode: this.receiptsForm.controls['mode'].value,
            tranNo: this.receiptsForm.controls['tranNo'].value,
            search: 'Allocate',
            tranType: 'RECEIPT',
            tranAmount: this.receiptsForm.controls['rctAmount'].value,
            allocStatus: this.allocStatus,
            tranFor: this.receiptsForm.controls['tranFor'].value
          },
        }
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result.isAltered) {
          this.onSearchCilcked();
        }
      });
    }
   // Unified method for handling input changes
onNumberFieldChange(event: any, fieldName: string): void {
  const value = event.target.value;
  // Remove all commas and non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.]/g, '');
  
  // Update form control with raw numeric value
  this.receiptsForm.get(fieldName)?.setValue(numericValue, { emitEvent: false });
  
  // Format and display with commas
  const formattedValue = this.addCommasToNumber(numericValue);
  event.target.value = formattedValue;
  
  // Calculate total if rctAmount or charges changed
  if (fieldName === 'rctAmount' || fieldName === 'charges') {
    this.calculateTotal();
  }
}

// Unified method for handling focus (remove commas for editing)
onNumberFieldFocus(event: any): void {
  const value = event.target.value;
  // Remove commas to show raw number for editing
  const numericValue = value.replace(/,/g, '');
  event.target.value = numericValue;
}

// Unified method for handling blur (add commas back)
onNumberFieldBlur(event: any, fieldName: string): void {
  const value = event.target.value;
  
  if (value) {
    // Ensure it's a valid number
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    
    if (!isNaN(numericValue)) {
      // Update form control with clean numeric value
      this.receiptsForm.get(fieldName)?.setValue(numericValue.toString(), { emitEvent: false });
      
      // Format and display with commas
      const formattedValue = this.addCommasToNumber(numericValue.toString());
      event.target.value = formattedValue;
    }
  }
  
  // Calculate total after blur
  if (fieldName === 'rctAmount' || fieldName === 'charges') {
    this.calculateTotal();
  }
}

// Helper method to add commas to numbers
addCommasToNumber(value: string): string {
  if (!value) return '';
  
  const parts = value.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Return with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

// Method to calculate total
calculateTotal(): void {
  const rctAmount = parseFloat(this.receiptsForm.get('rctAmount')?.value || '0');
  const charges = parseFloat(this.receiptsForm.get('charges')?.value || '0');
  
  const total = rctAmount + charges;
  
  // Update total field with formatted value
  this.receiptsForm.get('total')?.setValue(total.toString(), { emitEvent: false });
  
  // Update the display value with commas
  const totalField = document.querySelector('input[formControlName="total"]') as HTMLInputElement;
  if (totalField) {
    totalField.value = this.addCommasToNumber(total.toFixed(2));
  }

}
}
