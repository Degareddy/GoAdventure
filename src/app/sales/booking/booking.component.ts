import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Item } from 'src/app/general/Interface/interface';
import { QuotationComponent } from '../quotation/quotation.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MastersService } from 'src/app/Services/masters.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { InventoryService } from 'src/app/Services/inventory.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { EditorComponent } from './editor/editor.component';
import { Location } from '@angular/common';
import { SalesService } from 'src/app/Services/sales.service';


@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  bookingForm!:FormGroup
  retMessage:string=""
      screenName:string=localStorage.getItem('previousScreen')||''
    selectedClientId!:string
  subSink!:SubSink
  textMessageClass:string=""
  packageTypes:Item[]=[]
  dialogOpen = false;
  gst:boolean=false
  leadsources:Item[]=[]
  departuretypes:Item[]=[]
  selectdPackageNameId!:string;
  modes:Item[]=[
    {itemCode:'Add',itemName:'Add'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'},
    {itemCode:'Update',itemName:'Update'},
    {itemCode:'View',itemName:'View'},

  ]
    constructor(private fb:FormBuilder,private location: Location,private salesSerivce:SalesService,
      public dialog: MatDialog,private userDataService:UserDataService,private invService:InventoryService,
      private loader: NgxUiLoaderService, private datePipe: DatePipe,
      private masterService:MastersService
    ) {
    this.bookingForm=this.formInit()
    this.subSink=new SubSink()
   }
openInvoiceEditor() {
  const url = `${window.location.origin}/invoice-editor`;
  window.open(url, '_blank');
}
   goBack(): void {
    this.location.back();
  }
downloadPDF(){
  if (!this.dialogOpen) {
              this.dialogOpen = true;
              const dialogRef: MatDialogRef<EditorComponent> = this.dialog.open(EditorComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'clientName': this.bookingForm.get('clientName')?.value,
                  'tripName': this.bookingForm.get('packageName')?.value,
                  'travelDate':'',
                  'bookindId':this.bookingForm.get('batchNo')?.value,
                  
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                 
                }
              });
            }
}
onChatbotFormUpdate(data: any) {
  console.log('Chatbot filled form with:', data);
  // You can add additional processing here
  // For example, trigger validation, show success message, etc.
}
 ngOnDestroy(){
    this.subSink.unsubscribe();
     localStorage.setItem('previousScreen','Booking')
  }
  loadLeadsources(){
const body={
        "Mode": this.bookingForm.get('mode')?.value,
        "Company": this.userDataService.userData.company,
        "Location": this.userDataService.userData.location,
        "User": this.userDataService.userData.userID,
        "RefNo": this.userDataService.userData.sessionID,
        "item": "DEPTYPE",
        "itemFirstLevel": "",
        "itemSecondLevel": "",
        "password": "",
        "selLocation": "",
        "tranNo": "",
        "tranType": "",
        "type": ""
    }
    try {
            this.subSink.sink = this.masterService.getSpecificMasterItems(body).subscribe((reslt: any) => {
              if (reslt && reslt.data && reslt.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.departuretypes = reslt.data;
                if(this.departuretypes.length == 1){
                  this.bookingForm.get('departuretype')?.patchValue(this.departuretypes[0].itemCode) 
                }

              }
              else {
                this.leadsources = [];
                this.displayMessage(reslt.message, TextClr.red);
    
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION+ ex.message, TextClr.red);
          }
  }
  loadDeparturetypes(){
    const body={
        "Mode": this.bookingForm.get('mode')?.value,
        "Company": this.userDataService.userData.company,
        "Location": this.userDataService.userData.location,
        "User": this.userDataService.userData.userID,
        "RefNo": this.userDataService.userData.sessionID,
        "item": "LEADSOURCE",
        "itemFirstLevel": "",
        "itemSecondLevel": "",
        "password": "",
        "selLocation": "",
        "tranNo": "",
        "tranType": "",
        "type": ""
    }
    try {
            this.subSink.sink = this.masterService.getSpecificMasterItems(body).subscribe((reslt: any) => {
              if (reslt && reslt.data && reslt.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.leadsources = reslt.data;
                if(this.leadsources.length == 1){
                  this.bookingForm.get('leadsource')?.patchValue(this.leadsources[0].itemCode) 
                }

              }
              else {
                this.leadsources = [];
                this.displayMessage(reslt.message, TextClr.red);
    
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION+ ex.message, TextClr.red);
          }
    
  }
  ngOnInit(): void {
    this.loadLeadsources();
    this.loadDeparturetypes();
    this.loadTripList()
    this.bookingForm.get('regularAmount')?.valueChanges.subscribe((regularAmount: number) => {
    if (regularAmount != null) {
      const discount = this.bookingForm.get('discOffered')?.value; // 10% discount
      const quotedPrice = regularAmount - discount;

      this.bookingForm.patchValue({
        discOffered: discount,
        quotedPrice: quotedPrice
      });
    }
  });
  this.bookingForm.get('discOffered')?.valueChanges.subscribe((discOffered: number) => {
    if (discOffered != null) {
      const regPrice = this.bookingForm.get('regularAmount')?.value; // 10% discount
      const quotedPrice =regPrice - discOffered;

      this.bookingForm.patchValue({
        quotedPrice: quotedPrice
      });
    }
  });
  }
  
  onSubmit(){
    if(this.bookingForm.get('gstYes')?.value){
      this.gst=true
    }
    else{
      this.gst=false
    }
    const body={
      "Mode": this.bookingForm.get('mode')?.value,
      "Company":this.userDataService.userData.company,
      "Location": this.userDataService.userData.location,
      "TranNo": this.bookingForm.get('batchNo')?.value,
      "TranDate": this.bookingForm.get('tranDate')?.value,
      "PackageType": this.bookingForm.get('packageType')?.value,
      "TripId": this.bookingForm.get('tripId')?.value,
      "Client": this.bookingForm.get('clientName')?.value,
      "AdultsCnt": this.bookingForm.get('adults')?.value,
      "AgeUptoYrs5": this.bookingForm.get('zeroToFive')?.value,
      "AgeYrs6to12": this.bookingForm.get('fiveToTwelve')?.value,
      "ApplyGST": this.gst,
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
                this.loader.stop();
                if(res.status === "Success"){
                  this.displayMessage(res.message,'green');
                  this.bookingForm.get('batchNo')?.patchValue(res.tranNoNew);
                  this.bookingForm.get('mode')?.patchValue('Modify');
                }
                else{
                  this.displayMessage(res.message,'red');
                }
              });
            }
            catch (ex: any) {
              this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            }
  }
  formInit() {
    return this.fb.group({
      mode:['View'],
      batchNo:[''],
      packageType:['',Validators.required],
      tripId:['',Validators.required],
      packageName:['',Validators.required],
      clientName:['',Validators.required],
      contact:['',Validators.required],
      email:['',Validators.required],
      adults:['',Validators.required],
      zeroToFive:['0',Validators.required],
      fiveToTwelve:['0',Validators.required],
      gstYes:[false],
      gstNo:[true],
      remarks:[''],
      regularAmount:[0],
      discOffered:[0],
      quotedPrice:[0],
      addOns:[0],
      tranDate:[new Date()],
      departuretype:['',Validators.required],
      leadsource:['',Validators.required]
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
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  onBookingSearch(){
    try {
     
      
            if (!this.dialogOpen) {
              this.dialogOpen = true;
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum':'',
                  'search': 'Booking Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.selectdPackageNameId=result.package
                  this.bookingForm.get('batchNo')?.patchValue(result.tranNo);
                  this.searchBookingOnTran();
                }
              });
            }
    }       

    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  searchBookingOnTran(){
 const body={
          Company:this.userDataService.userData.company,
          Location:this.userDataService.userData.location,
          User:this.userDataService.userData.userID,
          RefNo:this.userDataService.userData.sessionID,
          TranNo:this.bookingForm.get('batchNo')?.value
         
        }
        try {
          this.loader.start();
              this.subSink.sink =this.salesSerivce.GetBookingDetails(body).subscribe((res: any) => {
                this.loader.stop();
                if(res.status === "Success"){
                  this.parchForm(res.data);
                }
              });
            }
            catch (ex: any) {
              this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            }
  }
  parchForm(data:any){
     
    this.bookingForm.get('mode')?.patchValue('Modify')
    this.bookingForm.get('packageType')?.patchValue(data.packageType)
    this.bookingForm.get('tripId')?.patchValue(data.tripId)
    this.bookingForm.get('packageName')?.patchValue('')
    this.bookingForm.get('clientName')?.patchValue(data.clientName)
    this.bookingForm.get('contact')?.patchValue(data.contact)
    this.bookingForm.get('email')?.patchValue(data.email)
    this.bookingForm.get('adults')?.patchValue(data.adultsCnt)
    this.bookingForm.get('zeroToFive')?.patchValue(data.ageUptoYrs5)
    this.bookingForm.get('fiveToTwelve')?.patchValue(data.ageYrs6to12)
    this.bookingForm.get('remarks')?.patchValue(data.remarks)
    this.bookingForm.get('regularAmount')?.patchValue(data.pkgValue)
    this.bookingForm.get('discOffered')?.patchValue(data.discount)
    this.bookingForm.get('quotedPrice')?.patchValue(data.netPayable)
    this.bookingForm.get('addOns')?.patchValue(data.addOns)
    this.bookingForm.get('tranDate')?.patchValue(this.formatDate(new Date(data.tranDate)))
    this.selectedClientId = data.client
    if(data.applyGST){
      this.bookingForm.get('gstYes')?.patchValue(true)
      this.bookingForm.get('gstYes')?.patchValue(false)
    }
    else{
         this.bookingForm.get('gstYes')?.patchValue(false)
      this.bookingForm.get('gstYes')?.patchValue(true)
    }
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
                  'search': 'Trip Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.selectdPackageNameId=result.package
                  this.bookingForm.get('tripId')?.patchValue(result.tripId)
                  this.bookingForm.get('packageName')?.patchValue(result.packageName)
                  this.bookingForm.get('packageType')?.patchValue(result.packageType)
                }
              });
            }
    }       

    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  modeChange(){
    if(this.bookingForm.get('mode')?.value === 'Add'){
      this.bookingForm.get('batchNo')?.disable();
    }
    else{
      this.bookingForm.get('batchNo')?.enable();
    }
  }
  
}
