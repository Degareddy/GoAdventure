import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';

@Component({
  selector: 'app-receipts-payments',
  templateUrl: './receipts-payments.component.html',
  styleUrls: ['./receipts-payments.component.css']
})

export class ReceiptsPaymentsComponent implements OnInit {
title:string="Receipts - Payments";
receiptsForm!:FormGroup
tomorrow=new Date()
receiptmodes:Item[]=[]
modes:Item[]=[]
filteredItemsClientType:Item[]=[]
filteredItemsTranFor:Item[]=[]
rctTypeList:Item[]=[]
filteredpayMode:Item[]=[]
providers:Item[]=[]
providerTypes:Item[]=[]
statusList:Item[]=[]
  constructor(private fb: FormBuilder) { 
    this.receiptsForm=this.formInit()
  }

  ngOnInit(): void {
  }
  onSubmit(){

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

}
