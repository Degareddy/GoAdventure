import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { QuotationComponent } from '../quotation/quotation.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MastersService } from 'src/app/Services/masters.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { InventoryService } from 'src/app/Services/inventory.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

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
    constructor(private fb:FormBuilder,private userDataService:UserDataService,private invService:InventoryService,
      private loader: NgxUiLoaderService,
      private masterService:MastersService
    ) {
    this.bookingForm=this.formInit()
    this.subSink=new SubSink()
   }

  ngOnInit(): void {
    this.loadTripList()
  }
  onSubmit(){
    const body={
      "Mode": this.bookingForm.get('mode')?.value,
      "Company":this.userDataService.userData.company,
      "Location": this.userDataService.userData.location,
      "TranNo": this.bookingForm.get('batchNo')?.value,
      "TranDate": this.bookingForm.get('tranDate')?.value,
      "PackageType": this.bookingForm.get('packageType')?.value,
      "TripId": this.bookingForm.get('batchCode')?.value,
      "Client": this.bookingForm.get('clientName')?.value,
      "AdultsCnt": this.bookingForm.get('adults')?.value,
      "AgeUptoYrs5": this.bookingForm.get('zeroToFive')?.value,
      "AgeYrs6to12": this.bookingForm.get('fiveToTwelve')?.value,
      "ApplyGST": this.bookingForm.get('gst')?.value,
      "PkgValue": this.bookingForm.get('regularAmount')?.value,
      "Discount": this.bookingForm.get('discOffered')?.value,
      "AddOns": this.bookingForm.get('addOns')?.value,
      "TaxAmount": 0,
      "NetPayable": this.bookingForm.get('quotedPrice')?.value,
      "Remarks": this.bookingForm.get('remarks')?.value,
      "User": this.userDataService.userData.userID,
      "RefNo": this.userDataService.userData.sessionID,
    }
    try {
          this.loader.start()
              this.subSink.sink = this.invService.UpdateBookingDetails(body).subscribe((res: any) => {
                this.loader.stop()
              });
            }
            catch (ex: any) {
              this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            }
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
      tranDate:[new Date()],
    })
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
  
}
