import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { QuotationComponent } from '../quotation/quotation.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MastersService } from 'src/app/Services/masters.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  bookingForm!:FormGroup
  retMessage:string=""
  subSink!:SubSink
  textMessageClass:string=""
  packageTypes:Item[]=[]
  modes:Item[]=[
    {itemCode:'Add',itemName:'Add'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'},
    {itemCode:'Update',itemName:'Update'},
    {itemCode:'View',itemName:'View'},

  ]
    constructor(private fb:FormBuilder,private userDataService:UserDataService,
      private masterService:MastersService
    ) {
    this.bookingForm=this.formInit()
    this.subSink=new SubSink()
   }

  ngOnInit(): void {
    this.loadTripList()
  }
  onSubmit(){

  }
  loadTripList(){
        const body={
          Mode:'View',
          Company:this.userDataService.userData.company,
          Location:this.userDataService.userData.location,
          User:this.userDataService.userData.userID,
          RefNo:this.userDataService.userData.sessionID,
          item:"PACKAGE",
          itemFirstLevel: "",
          itemSecondLevel: "",
          password: "",
          selLocation: "",
          tranNo: "",
          tranType: "",
          type: ""
        }
        try {
              this.subSink.sink =this.masterService.getSpecificMasterItems(body).subscribe((res: any) => {
                this.packageTypes= res.data
              });
            }
            catch (ex: any) {
              this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            }
      }
      private displayMessage(message: string, cssClass: string) {
        this.retMessage = message;
        this.textMessageClass = cssClass;
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
