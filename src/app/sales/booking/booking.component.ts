import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { QuotationComponent } from '../quotation/quotation.component';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  bookingForm!:FormGroup
  retMessage:string=""
  textMessageClass:string=""
  modes:Item[]=[]
  constructor(private fb:FormBuilder) {
    this.bookingForm=this.formInit()
   }

  ngOnInit(): void {
  }
  onSubmit(){

  }
  clear(){

  }
  close(){

  }
  onHelpCilcked(){

  }
  onSearchCilcked(){

  }
  formInit() {
      return this.fb.group({
        mode:[''],
        batchNo:[''],
        packageType:[''],
        batchCode:[''],
        packageName:[''],
        clientName:[''],
        contact:[''],
        email:[''],
        adults:[''],
        zeroToFive:[''],
        fiveToTwelve:[''],
        gst:[''],
        remarks:[''],
        regularAmount:[0],
        discOffered:[0],
        quotedPrice:[0],
        addOns:[0],
      })
    }
}
