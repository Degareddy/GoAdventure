import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { Location } from '@angular/common';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SalesService } from 'src/app/Services/sales.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
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
providers:Item[]=[]
providerTypes:Item[]=[]
bank:Item[]=[]
tranFor:Item[]=[]
statusList:Item[]=[]
private subSink!: SubSink;
  constructor(private fb: FormBuilder , private location: Location, private userDataService:UserDataService,  
      public dialog: MatDialog,

    private glService: GeneralLedgerService,
    private adminService: AdminService,
        private masterService: MastersService,
    
    private toaster: ToastrService,
  
    private loader: NgxUiLoaderService,
  

     private saleService: SalesService,
  ) { 
    this.receiptsForm=this.formInit()
        this.subSink = new SubSink();
    
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
  }
  onSubmit(){
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
        OtherRefDate:this.receiptsForm.get('holder')?.value,
        ClientTranStatus:this.receiptsForm.get('status')?.value,
        TxnBank:this.receiptsForm.get('accountProvider')?.value,
        TxnAccount:this.receiptsForm.get('accountNo')?.value,
        TxnDate:this.receiptsForm.get('tranDate')?.value,
        TxnStatus:'',
        TranFor:this.receiptsForm.get('tranFor')?.value,
        TranAmount:this.receiptsForm.get('rctAmount')?.value,
        TranBy:this.userDataService.userData.userID,
        TranAt:this.userDataService.userData.location,
        // AllottedAmount:this.receiptsForm.get()?.value,
        PaidCurrency:"INR",
        PaidExchRate:1.00,
        Charges:0.00,
        PaidAmt:this.receiptsForm.get('rctAmount')?.value,
        Remarks:'',
        User:this.userDataService.userData.userID,
        RefNo:this.userDataService.userData.sessionID
      }
      this.subSink.sink = this.saleService.UpdateReceiptsAndPayments(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
           
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
            this.providers = res.data.map((bank: any) => ({
              itemCode: bank.code,
              itemName: bank.bankName
            }));
            if(this.providers.length === 1){
              this.receiptsForm.get(name)!.patchValue(this.providers[0].itemCode);
              this.loadBankAccountNumber();
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
  loadProviderSubTypes() {
      const bankbody: getPayload = {
        ...this.commonParams(),
        item: "BANK",
        mode:this.receiptsForm.get('mode')?.value
      };
      
      const service1 = this.adminService.GetMasterItemsList(bankbody);
      this.subSink.sink = forkJoin([service1]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          this.providers = res1.data;
        },
        (error: any) => {
          this.loader.stop();
        }
      );
    }
  loadBankTypes(){
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
  modeChange(mode:string){}
  clear(){}
  close(){}
  PayModeChanged(){}
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
    if(this.receiptsForm.get('rctType')?.value!==''){
      return true
    }
    return false;
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
  
  onSearchCilcked(){}
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
  refDate: [''],
  otherRef1: [''],
  otherRefDate1: [''],
  otherRef2: [''],
  status: [''],
 holder:[''], 
accountNo:[''],
  accountProviderType: [''],
  accountProvider: [''],
  CustaccountNo: [''],
  charges:[0],
  total:[0]
    });
    }
  goBack(): void {
    this.location.back();
  }
  onSelectionChangeProviderType(){
    const body=  {
  company: this.userDataService.userData.company,
  location:  this.userDataService.userData.location,
  Type:this.receiptsForm.get('providerType')!.value,
  user:  this.userDataService.userData.userID,
  refNo:  this.userDataService.userData.sessionID,
  
  }
  this.subSink.sink = this.glService.GeBanksList(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.providers = res['data'];
          if (this.providers.length === 1) {
            this.receiptsForm.get('provider')!.patchValue(this.providers[0].itemCode);
            // this.onSelectedTypeChanged()
          }
        }
        else {
          this.displayMessage(res.message + " for types list!", TextClr.red);
        }
  
      });
  }
}
