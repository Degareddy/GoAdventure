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
import { forkJoin, map, startWith } from 'rxjs';


interface autoComplete {
  itemCode: string
  itemName: string

}
@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  bookingForm!:FormGroup
  discAmount:number=0;
  retMessage:string=""
      screenName:string=localStorage.getItem('previousScreen')||''
    selectedClientId!:string
  subSink!:SubSink
  textMessageClass:string=""
  selectedPackageId!:string;
   selectedPackageName:string="";
    selectedPackageTypeId!:string;
     seletedPackageTypeName:string="";
  packageTypes:Item[]=[]
  clientId:string='';
  dialogOpen = false;
  gst:boolean=false
  leadsources:Item[]=[]
  departuretypes:Item[]=[]
  selectdPackageNameId!:string;
  tripIdList:autoComplete[]=[]
  autoFilteredTripIdList: autoComplete[] = [];
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
      private masterService:MastersService,private saleService:SalesService
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
  this.onPriceFieldChange()
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
    this.bookingForm.get('packageType')?.disable();
    this.bookingForm.get('packageName')?.disable();
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
  this.bookingForm.get('tripId')!.valueChanges
    .pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.itemName || ''),
      map(name => this._filter(name))
    )
    .subscribe(filtered => {
      this.autoFilteredTripIdList = filtered;
    });
    this.loadTripIds();
  }
    private _filter(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.tripIdList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue)     );
  }
  displayTripName = (code: string): string => {
  const match = this.autoFilteredTripIdList.find(opt => opt.itemCode === code);
  return match ? match.itemName : '';
};

  onSubmit(){
    if(this.bookingForm.get('gstYes')?.value){
      this.gst=true
    }
    else{
      this.gst=false
    }
    const body={
      Mode: this.bookingForm.get('mode')?.value,
      Company:this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      TranNo: this.bookingForm.get('batchNo')?.value,
      TranDate: this.bookingForm.get('tranDate')?.value,
      PackageType: this.selectedPackageId,
      TripId: this.bookingForm.get('tripId')?.value,
      DepType:this.bookingForm.get('departuretype')?.value,
      LeadSource:this.bookingForm.get('leadsource')?.value,
      Client: this.clientId,
      ClientName: this.bookingForm.get('clientName')?.value,
      Contact: this.bookingForm.get('contact')?.value,
      Email: this.bookingForm.get('email')?.value,
      AdultsCnt: this.bookingForm.get('adults')?.value,
      AgeUptoYrs5: this.bookingForm.get('zeroToFive')?.value,
      AgeYrs6to12: this.bookingForm.get('fiveToTwelve')?.value,
      PkgValue:this.bookingForm.get('regularAmount')?.value,
      ActualPrice:this.bookingForm.get('quotedPrice')?.value,
      AddOns: this.bookingForm.get('addOns')?.value,
      Discount: this.bookingForm.get('discOffered')?.value,
      TotalAmount: this.bookingForm.get('total')?.value,
      TaxAmount:this.bookingForm.get('gst')?.value,
      NetPayable:this.bookingForm.get('payable')?.value,
      Remarks: this.bookingForm.get('remarks')?.value,
      RefBooking: this.bookingForm.get('websiteReferenceId')?.value,
      User:this.userDataService.userData.userID,
      RefNo: this.userDataService.userData.sessionID,
     
    }
    try {
          this.loader.start()
              this.subSink.sink = this.invService.UpdateBookingDetails(body).subscribe((res: any) => {
                this.loader.stop();
                if(res.status === "Success"){
                  this.displayMessage(res.message,'green');
                  this.bookingForm.get('batchNo')?.patchValue(res.tranNoNew);
                  this.bookingForm.get('mode')?.patchValue('Modify');
                  // this.clientId=res.tranNoNew;
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
   commomParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      langId: this.userDataService.userData.langId,
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID
    }
  }
  formInit() {
    return this.fb.group({
      mode:['View'],
      batchNo:[''],
      packageType:['',{disabled: true}],
      tripId:['',Validators.required],
      packageName:['',{disabled: true}],
      clientName:['',Validators.required],
      contact:['',Validators.required],
      email:['',Validators.required],
      adults:['0',Validators.required],
      zeroToFive:['0',Validators.required],
      fiveToTwelve:['0',Validators.required],
      gst:[0,{disabled: true}],
      remarks:[''],
      payable:[0,{disabled: true}],
      regularAmount:[0],
      discOffered:[0,{disabled: true}],
      quotedPrice:[0],
      addOns:[0],
      total:[0,{disabled: true}],
      tranDate:[new Date()],
      departuretype:['',Validators.required],
      leadsource:['',Validators.required],
      websiteReferenceId:['']
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
    getTripDetails(){
      const body={
        Mode:"ADD",
        Company:this.userDataService.userData.company,
        Location:this.userDataService.userData.location,
        ItemTypeTmp:"TRIPPKG",
        ItemFirstLevel:this.bookingForm.get('tripId')?.value,
        User:this.userDataService.userData.userID,
        RefNo:this.userDataService.userData.sessionID,
      }
      try {
          this.loader.start();
              this.subSink.sink =this.salesSerivce.GetTripDataToBooking(body).subscribe((res: any) => {
                this.loader.stop();
                if(res.status === "Success"){
                  this.displayMessage(res.message,'green');
                  this.selectedPackageId=res.data.package
                  this.selectedPackageName=res.data.packageName
                  this.selectedPackageTypeId=res.data.packageType
                  this.seletedPackageTypeName=res.data.packageTypeDesc

            
                  this.bookingForm.get('regularAmount')?.patchValue(this.getInrFormat((res.data.stdCost * this.bookingForm.get('adults')?.value).toFixed(2)));
                  this.bookingForm.get('quotedPrice')?.patchValue(this.getInrFormat((res.data.stdCost * this.bookingForm.get('adults')?.value).toFixed(2)));
                  this.bookingForm.get('total')?.patchValue(this.getInrFormat((this.removeInrFormat(this.bookingForm.get('quotedPrice')?.value))));
                  // const quotedPrice = (this.bookingForm.get('quotedPrice')?.value).toFixed(2) || 0;
                  const gst = (this.removeInrFormat(this.bookingForm.get('quotedPrice')?.value) * 0.05).toFixed(2);
                  const payable = (parseFloat(this.bookingForm.get('quotedPrice')?.value) + this.removeInrFormat(this.bookingForm.get('quotedPrice')?.value));
                  this.bookingForm.get('gst')?.patchValue(this.getInrFormat(gst));
                  this.bookingForm.get('payable')?.patchValue(this.getInrFormat((this.removeInrFormat(this.bookingForm.get('gst')?.value)  + this.removeInrFormat(this.bookingForm.get('total')?.value))));
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
    loadTripIds(){
      const body={ ...this.commomParams(), item: "UPCMGTRIPS" }
      try {
          this.loader.start();
              this.subSink.sink =this.salesSerivce.GetMasterItemsList(body).subscribe((res: any) => {
                this.loader.stop();
                this.tripIdList = res.data.map((item: any) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemDetails: "No Package Name please contact adminstrator"  // Adjust as needed
          }));
           this.autoFilteredTripIdList = res.data.map((item: any) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemDetails: "No Package Name please contact adminstrator"  // Adjust as needed
          }));
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
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
    this.bookingForm=this.formInit();
    this.selectedPackageId=''
    this.selectedPackageName=''
    this.selectedPackageTypeId=''
    this.seletedPackageTypeName=''
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
                  'tranNum':this.bookingForm.get('batchNo')?.value,
                  'search': 'Booking Search',
                  'name':this.bookingForm.get('clientName')?.value,
                  'clientId':this.clientId,
                  'contact':this.bookingForm.get('contact')?.value,
                  'email':this.bookingForm.get('email')?.value
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
                  this.clientId = res.data.client;
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
  getInrFormat(amount:any):any{
    const formatted = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
        return formatted;
  }
 removeInrFormat(amount: any): number {
  if (!amount) return 0;

  // Convert to string, remove ₹, commas, spaces, etc., then parse to float
  const cleaned = amount.toString().replace(/[^0-9.-]/g, '');
  console.log(cleaned)
  return parseFloat(cleaned);

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
        this.clear();
              this.bookingForm.get('mode')?.patchValue("Add")
              this.autoFilteredTripIdList=this.tripIdList

    }
    else{
      this.bookingForm.get('batchNo')?.enable();
    }
  }
  setInitialQuotedPrice() {
  const regular = this.bookingForm.get('regularAmount')?.value || 0;
  this.bookingForm.patchValue({ quotedPrice: regular });
}
  // Add this method to calculate totals
calculateTotals() {
  const regularAmount = this.bookingForm.get('regularAmount')?.value || 0;
  const quotedPrice = this.bookingForm.get('quotedPrice')?.value || 0;
  const discount = this.bookingForm.get('discOffered')?.value || 0;
  const addOns = this.bookingForm.get('addOns')?.value || 0;

  // Apply discount to quoted price (discount is between regular and quoted price)
  const discountedPrice = quotedPrice - discount;

  // Calculate total (discounted price + addons)
  const total = quotedPrice + addOns;

  // Calculate GST on quoted price (5% as per your current rate)
  const gst = total * 0.05;

  // Calculate payable amount (total + GST)
  const payable = total + gst;

  // Update form controls with values rounded to 2 decimal places
  this.bookingForm.patchValue({
    total: total.toFixed(2),
    gst: gst.toFixed(2),
    payable: payable.toFixed(2),
  });

  // Update discount and store in variable
  const discountAmount = regularAmount - quotedPrice;
  this.bookingForm.get('discOffered')?.patchValue(discountAmount);
  this.discAmount = discountAmount;
}



// Call this method whenever any pricing field changes
onPriceFieldChange() {
  this.calculateTotals();
}
onCountChnage() {
  const adults = this.bookingForm.get('adults')?.value;
  const zeroToFive = this.bookingForm.get('zeroToFive')?.value;
  const fiveToTwelve = this.bookingForm.get('fiveToTwelve')?.value;

  if (adults === null || adults === undefined || adults === '') {
    this.bookingForm.get('adults')?.patchValue(0);
  }

  if (zeroToFive === null || zeroToFive === undefined || zeroToFive === '') {
    this.bookingForm.get('zeroToFive')?.patchValue(0);
  }

  if (fiveToTwelve === null || fiveToTwelve === undefined || fiveToTwelve === '') {
    this.bookingForm.get('fiveToTwelve')?.patchValue(0);
  }
}
}
