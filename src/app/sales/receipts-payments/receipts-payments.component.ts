import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
textMessageClass:string="";
tomorrow=new Date()
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
    this.loadProviderSubTypes();
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
    private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
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
                    // console.log(result);
                    if (result != true) {
                      if (this.receiptsForm.controls['rctType'].value.toUpperCase() !== 'PAYMENT' && this.receiptsForm.controls['tranFor'].value.toUpperCase() !== 'EXPENSE') {
                        this.displayMessage("Error: You can't make payment to yourself.", "red");
                        this.dialogOpen = false;
                        return;
                      }
                      this.receiptsForm.controls['customer'].patchValue(result.clientName);
                      if (this.receiptsForm.controls['rctType'].value.toUpperCase() === "PAYMENT") {
                        if (result.balAmount < 0) {
                          const positiveBal = result.balAmount * -1;
                          this.receiptsForm.controls['rctAmount'].patchValue(positiveBal.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);
                        }
                        else {
                          this.receiptsForm.controls['rctAmount'].patchValue(result.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);
                        }
                      } else {
                        this.receiptsForm.controls['rctAmount'].patchValue(result.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, }) || 0.0);
    
                      }
                      // this.supCode = result.clientCode;
                      this.receiptsForm.controls['accname'].patchValue(result.clientName);
                      this.receiptsForm.controls['paidCurrency'].patchValue(result.currency);
                      this.receiptsForm.controls['currency'].patchValue(result.currency);
                      // this.receiptAmount = result.balAmount;
                    }
                    this.dialogOpen = false;
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

  accountProviderType: [''],
  accountProvider: [''],
  accountNo: ['']
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
