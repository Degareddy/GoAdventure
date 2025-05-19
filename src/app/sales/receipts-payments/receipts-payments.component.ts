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
receiptmodes:Item[]=[]
modes:Item[]=[]
filteredItemsClientType:Item[]=[
  {itemCode:"Customer",itemName:"Customer"},
  {itemCode:"Vendor",itemName:"Vendor"},
  {itemCode:"Staff",itemName:"Staff"},
]
filteredItemsTranFor:Item[]=[]
rctTypeList:Item[]=[]
filteredpayMode:Item[]=[]
providers:Item[]=[]
providerTypes:Item[]=[]
bank:Item[]=[]
tranFor:Item[]=[]
statusList:Item[]=[]
private subSink!: SubSink;
  constructor(private fb: FormBuilder , private location: Location, private userDataService:UserDataService,
        private masterService: MastersService,
    
    private toaster: ToastrService,
  
    private loader: NgxUiLoaderService,
  

     private saleService: SalesService,
  ) { 
    this.receiptsForm=this.formInit()
        this.subSink = new SubSink();
    
  }

  ngOnInit(): void {
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

  }
  modeChange(mode:string){}
  clear(){}
  close(){}
  PayModeChanged(){}
  onSelectionChangeClientType(){}
  onSearchClientName(){{}}
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
}
