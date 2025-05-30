import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
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
import { Router } from '@angular/router';
import { purchaseRequestDetailsClass } from 'src/app/purchase/purchase.class';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { MasterParams } from '../sales.class';


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
  zeroToFiceCost:number=0;
  fiveToTwelevCost:number=0;
  retMessage:string=""
      screenName:string=localStorage.getItem('previousScreen')||''
    selectedClientId!:string
  subSink!:SubSink
  textMessageClass:string=""
  selectedPackageId!:string;
    masterParams!: MasterParams;
  
   selectedPackageName:string="";
    selectedPackageTypeId!:string;
     seletedPackageTypeName:string="";
  packageTypes:Item[]=[]
  status:string=""
  clientId:string='';
  dialogOpen = false;
  leadsources:Item[]=[]
  departuretypes:Item[]=[]
  stdCost:number=0;
  selectdPackageNameId!:string;
  tripIdList:autoComplete[]=[]
  autoFilteredTripIdList: autoComplete[] = [];
  hoveredField: string | null = null;
  modes:Item[]=[
    {itemCode:'Add',itemName:'Add'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'},
    {itemCode:'Update',itemName:'Update'},
    {itemCode:'View',itemName:'View'},

  ]
  formattedTotal: string='';
  formattedGst: string='';
  formattedPayable: string='';
  formattedDiscount: string='';
    constructor(private fb:FormBuilder,private location: Location,private salesSerivce:SalesService ,
      private purchaseService:PurchaseService, private router: Router,
      public dialog: MatDialog,private userDataService:UserDataService,private invService:InventoryService,
      private loader: NgxUiLoaderService, private datePipe: DatePipe,
      private masterService:MastersService,private saleService:SalesService
    ) {
    this.bookingForm=this.formInit()
    this.subSink=new SubSink()
        this.masterParams = new MasterParams();
    
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
            this.subSink.sink = this.masterService.getSpecificMasterItems(body).subscribe((res: any) => {
              if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.departuretypes = res.data;
                if(this.departuretypes.length == 1){
                  this.bookingForm.get('departuretype')?.patchValue(this.departuretypes[0].itemCode) 
                }

              }
              else {
                this.leadsources = [];
                this.displayMessage(res.message, TextClr.red);
    
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
            this.subSink.sink = this.masterService.getSpecificMasterItems(body).subscribe((res: any) => {
              if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.leadsources = res.data;
                if(this.leadsources.length == 1){
                  this.bookingForm.get('leadsource')?.patchValue(this.leadsources[0].itemCode) 
                }

              }
              else {
                this.leadsources = [];
                this.displayMessage(res.message, TextClr.red);
    
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
  return this.fb.group(
    {
      mode: ['View'],
      batchNo: [''],
      packageType: [{ value: '', disabled: true }],
      tripId: ['', Validators.required],
      packageName: [{ value: '', disabled: true }],
      clientName: ['', Validators.required],
      contact: [''],
      email: [''],
      adults: ['0', Validators.required],
      zeroToFive: ['0', Validators.required],
      fiveToTwelve: ['0', Validators.required],
      gst: [{ value: 0, disabled: true }],
      remarks: [''],
      payable: [{ value: 0, disabled: true }],
      regularAmount: [0],
      discOffered: [{ value: 0, disabled: true }],
      quotedPrice: [0],
      addOns: [0],
      total: [{ value: 0, disabled: true }],
      tranDate: [new Date()],
      departuretype: ['', Validators.required],
      leadsource: ['', Validators.required],
      websiteReferenceId: ['']
    },
    {
      validators: this.atLeastOneContactOrEmailValidator // ✅ add validators here
    }
  );
}

  atLeastOneContactOrEmailValidator(formGroup: FormGroup): ValidationErrors | null {
  const contact = formGroup.get('contact')?.value?.trim();
  const email = formGroup.get('email')?.value?.trim();
  return contact || email ? null : { atLeastOne: true };
}

  calculateAmounts(){
    
    if(this.bookingForm.get('departuretype')?.value === 'GD'){
      if(this.bookingForm.get('zeroToFive')?.value.trim !== ''){
          this.zeroToFiceCost = ((this.stdCost * 0.5))
      }
      else{
                this.zeroToFiceCost = 0

      }
      if( this.bookingForm.get('fiveToTwelve')?.value.trim !== ''){
        this.fiveToTwelevCost = ((this.stdCost * 0.8))
      }
      else{
        this.fiveToTwelevCost = 0
      }
     
     
      this.bookingForm.get('regularAmount')?.patchValue(this.getInrFormat((this.stdCost * this.bookingForm.get('adults')?.value) + ((this.zeroToFiceCost) *  parseFloat(this.bookingForm.get('zeroToFive')?.value)) +((this.fiveToTwelevCost) *  parseFloat(this.bookingForm.get('fiveToTwelve')?.value))));
      this.bookingForm.get('quotedPrice')?.patchValue(this.getInrFormat((this.stdCost * this.bookingForm.get('adults')?.value) + ((this.zeroToFiceCost) *  parseFloat(this.bookingForm.get('zeroToFive')?.value)) +((this.fiveToTwelevCost) *  parseFloat(this.bookingForm.get('fiveToTwelve')?.value))));
      this.bookingForm.get('total')?.patchValue(this.getInrFormat(parseFloat(this.removeInrFormat(this.bookingForm.get('quotedPrice')?.value))));
      // const quotedPrice = (this.bookingForm.get('quotedPrice')?.value).toFixed(2) || 0;
      const quotedPriceRaw = this.bookingForm.get('quotedPrice')?.value;
      const quotedPrice = parseFloat(this.removeInrFormat(quotedPriceRaw));
      const gst = Math.ceil(parseFloat((quotedPrice * 0.05).toFixed(2)));
      const payable = (parseFloat(this.bookingForm.get('quotedPrice')?.value) + parseFloat(this.removeInrFormat(this.bookingForm.get('quotedPrice')?.value)));
      this.bookingForm.get('gst')?.patchValue(this.getInrFormat(Math.ceil(gst)) );
      this.bookingForm.get('payable')?.patchValue(this.getInrFormat(payable));

    }
    

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
                  this.stdCost=res.data.stdCost
                  this.calculateAmounts();
                  
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
    this.autoFilteredTripIdList=this.tripIdList
  }
  close(){
    this.router.navigate(['/home']);

  }
  onHelpCilcked(){

  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  onClientSearch(){
    const body={
      ...this.commomParams(),
      ClientType:'Customer',
      Name:this.bookingForm.get('clientName')?.value, 
      Mobile:this.bookingForm.get('contact')?.value, 
      Email:this.bookingForm.get('email')?.value, 
    }
    this.loader.start();
    try{
    this.subSink.sink = this.masterService.GetSearchClients(body).subscribe((res: any) => {
      this.loader.stop();
              if (res && res.data && res.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.displayMessage(res.message, TextClr.green);
                this.bookingForm.get('clientName')?.patchValue(res.data[0].name)
                this.bookingForm.get('contact')?.patchValue(res.data[0].mobile)
                this.bookingForm.get('email')?.patchValue(res.data[0].email)
                this.bookingForm.get('leadsource')?.patchValue('OLDCLIENTS')
                this.clientId=res.data.code
              }
              else {
                this.displayMessage(res.message, TextClr.red);
    
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION+ ex.message, TextClr.red);
          }
  }
   commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  openBookingSearch(){
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
  onBookingSearch(){
    if(this.bookingForm.get('batchNo')?.value !== ''){
      const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
      ...this.commonParams(),
      TranType: 'RECEIPT',
      TranNo: this.bookingForm.controls['batchNo'].value || '',
      Party: '',
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: 'CLOSED',
    };
    this.subSink.sink =  this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != 'FAIL' && res.status.toUpperCase() != 'ERROR') {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.searchBookingOnTran();
        }
        else{
          this.openBookingSearch()
        }  
    }
    else{
      this.openBookingSearch()
    }
    })
  }
      
    else{
     this.openBookingSearch()
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
                 
                  this.bookingForm.get('mode')?.patchValue('Modify');
                  this.bookingForm.get('leadsource')?.patchValue(res.data.leadSource);
                  this.bookingForm.get('websiteReferenceId')?.patchValue(res.data.refBooking);
                  this.bookingForm.get('departuretype')?.patchValue(res.data.depType);
                   this.bookingForm.get('addOns')?.patchValue(this.getInrFormat(res.data.addOns));
                   this.bookingForm.get('discOffered')?.patchValue(this.getInrFormat(res.data.discount));
                   this.bookingForm.get('total')?.patchValue(this.getInrFormat(res.data.totalAmount));
                   this.bookingForm.get('gst')?.patchValue(this.getInrFormat(Math.ceil(res.data.taxAmount)));
                   this.bookingForm.get('payable')?.patchValue(this.getInrFormat(res.data.netPayable));
                  this.clientId = res.data.client;
                  this.status = res.data.bkgStatus;
                }
              });
            }
            catch (ex: any) {
              this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
            }
  }
  parchForm(data:any){
     
    this.bookingForm.get('mode')?.patchValue('Modify')
    this.bookingForm.get('packageType')?.patchValue(data.packageTypeDesc)
    this.bookingForm.get('tripId')?.patchValue(data.tripId)
    this.bookingForm.get('packageName')?.patchValue(data.packageName)
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
   
  }
 getInrFormat(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
      this.bookingForm.get('adults')?.patchValue(1)

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
  const getValue = (field: string): number => {
    const raw = this.bookingForm.get(field)?.value;
    const cleaned = this.removeInrFormat(raw);
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const regularAmount = getValue('regularAmount');
  const quotedPrice = getValue('quotedPrice');
  const discount = getValue('discOffered');
  const addOns = getValue('addOns');

  const discountedPrice = quotedPrice - discount;
  const total = quotedPrice + addOns;
  const gst = Math.ceil(parseFloat((total * 0.05).toFixed(2)));
  const payable = parseFloat((total + gst).toFixed(2));
  const discountAmount = parseFloat((regularAmount - quotedPrice).toFixed(2));

  // Set raw numeric values
  this.bookingForm.patchValue({
    total,
    gst,
    payable,
    discOffered: discountAmount,
    regularAmount,
    quotedPrice,
  });

  // Set formatted values for display only
  this.formattedTotal = this.getInrFormat(total);
  this.formattedGst = this.getInrFormat(Math.ceil(parseFloat(this.getInrFormat(gst))));
  this.formattedPayable = this.getInrFormat(payable);
  this.formattedDiscount = this.getInrFormat(discountAmount);
  
  this.discAmount = discountAmount;
}
// Call this method whenever any pricing field changes
onPriceFieldChange(fieldName?: string) {
  this.calculateTotals();
  if(fieldName === 'regularAmount'){
    let regamount=this.removeInrFormat(this.bookingForm.get('regularAmount')?.value)
    this.bookingForm.get('quotedPrice')?.patchValue(this.getInrFormat(parseFloat(regamount)) )
  }
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
formattedRegularAmount = '';
formattedQuotedPrice = '';

onInputFormat(event: Event, fieldName: string) {
  this.onPriceFieldChange()
  const input = event.target as HTMLInputElement;
  const rawValue = this.removeInrFormat(input.value);
  const numericValue = parseFloat(rawValue);

  // Update form with raw numeric value
  this.bookingForm.get(fieldName)?.setValue(isNaN(numericValue) ? 0 : numericValue);

  // Update formatted display value
  const formatted = this.formatNumberWithCommas(numericValue);
  if (fieldName === 'regularAmount') {
    this.formattedRegularAmount = formatted;
  } else if (fieldName === 'quotedPrice') {
    this.formattedQuotedPrice = formatted;
  }

  this.calculateTotals(); // Optional: recalculate on input
}



removeInrFormat(value: any): string {
  return (value || '').toString().replace(/[^0-9.]/g, '');
}
onBlurFormat(fieldName: string) {
  const value = this.bookingForm.get(fieldName)?.value || 0;
  const formatted = this.formatNumberWithCommas(value);

  if (fieldName === 'quotedPrice') {
    this.formattedQuotedPrice = formatted;
    this.onBlurFormat('regularAmount');
  }
  if(fieldName === 'regularAmount'){
    this.formattedRegularAmount = formatted;
    // this.onBlurFormat('quotedPrice')
  }
}

formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

}
