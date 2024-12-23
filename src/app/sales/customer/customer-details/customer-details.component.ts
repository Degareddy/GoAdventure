import { Component, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from 'src/app/Services/customer.service';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { CustomerAddressesComponent } from '../customer-addresses/customer-addresses.component';
import { CustomerContactsComponent } from '../customer-contacts/customer-contacts.component';
import { Customer } from '../../sales.class';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, map, Observable, startWith } from 'rxjs';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { MatOptionSelectionChange } from '@angular/material/core';
import { event } from 'jquery';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { CustomerUnitsComponent } from '../customer-units/customer-units.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { VendorProductsComponent } from '../vendor-products/vendor-products.component';
@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.css']
})
export class CustomerDetailsComponent implements OnInit, OnDestroy {

  @ViewChild('address') address!: CustomerAddressesComponent;
  @ViewChild('contacts') contacts!: CustomerContactsComponent;
  @ViewChild('units') units!: CustomerUnitsComponent;
  @ViewChild('Products') Products!: VendorProductsComponent;
  @ViewChild('frmClear') public cstFrm!: NgForm;
  @Input() max: any;
  tomorrow = new Date();
  repCode!:any;
  code!: string;
  customer!: Customer;
  type:string;

  custForm!: FormGroup;
  itemStatus!: string;
  retMessage: string = '';
  retNum!: number;
  textMessageClass: string = '';
  custStatus!: string;
  countryList:Item[]=[];
  groupIndex!: number;
  //groupName!: any;
  public custId!: string;
  custGroups: Item[]=[];
  masterParams!: MasterParams;
  filteredCountryNames!:Observable<Item[]>;
  modes: Item[]=[];
  public selectedTabIndex: number = 0;
  public serialNum!: number;
  public isSlNum!: boolean;
  selectedObjects!: any[];
  dialogOpen = false;
  paytermList: Item[]=[];
  custName!:any;
  pricesList: Item[]=[];
  saleList: Item[]=[];
  currencyList: Item[]=[];
  private subsink!: SubSink;
  previousTabIndex!: number;
  userProfile:string="";
  tenantlnld: boolean=true;
  constructor(protected route: ActivatedRoute,    public dialog: MatDialog,private utlService: UtilitiesService,
    protected router: Router, @Inject(MAT_DIALOG_DATA) public data: { mode: string, customerId: string, customerName: string,type:string },
    private masterService: MastersService, private userDataService: UserDataService,
    protected custService: CustomerService, private loader: NgxUiLoaderService,
    private fb: FormBuilder) {
    this.isSlNum = false;
    this.customer = new Customer();
    this.masterParams = new MasterParams();
    this.subsink = new SubSink();
    this.custForm = this.formInit();
    this.userProfile = this.userDataService.userData.userProfile;
    this.type=this.data.type;
  }
  ngOnDestroy() {
    this.subsink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      code: [{ value: '', disabled: true }],
      custName: ['', [Validators.required, Validators.maxLength(50)]],
      groupName: ['GEN', [Validators.required]],
      effectiveDate: [new Date(), [Validators.required]],
      //custStatus: [''],
      vATPINNo: ['0', [Validators.required]],
      name:[''],
      currency: ['KES', [Validators.required]],
      payTerm: ['NA', [Validators.required]],
      pricing: ['NA', [Validators.required]],
      maxCrLimit: [0, [Validators.required]],
      secuItemDesc: ['NA', [Validators.required]],
      salesExecutive: ['NA', [Validators.required]],
      countryName:['',Validators.required],
      countryCode: [
        {
          value: '',
          disabled: true,
        },
        Validators.required,
    ],
      phone1: ['', [Validators.required,Validators.maxLength(10),Validators.pattern(/^\d+$/)]],
      email: ['', [Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      notes: [''],
      isVendor: [false, [Validators.required]],
      isCustomer: [false, [Validators.required]],
      isEmployee: [false, [Validators.required]],
      isLandlord: [false, [Validators.required]],
      isTenant: [false, [Validators.required]],
      isStaker: [false,[Validators.required]],
      isCareTaker: [false,[Validators.required]]
    }, {
      validators: this.atLeastOneCheckboxSelectedValidator('isCustomer', 'isVendor', 'isEmployee', 'isLandlord', 'isTenant','isCareTaker')
    });
  }

  alphanumericValidator() {
    return (control: any) => {
      const value = control.value;
      const uppercaseValue = value.toUpperCase();
      if (value !== uppercaseValue) {
        control.patchValue(uppercaseValue, { emitEvent: false });
      }
      const valid = /^[A-Z0-9]+$/.test(uppercaseValue);
      return valid ? null : { invalidAlphanumeric: true };
    };
  }

  atLeastOneCheckboxSelectedValidator(...controls: string[]) {
    return (formGroup: FormGroup) => {
      const atLeastOneSelected = controls.some(control => formGroup.get(control)?.value === true);
      if (!atLeastOneSelected) {
        controls.forEach(control => {
          formGroup.get(control)?.setErrors({ 'atLeastOneSelected': true });
        });
      } else {
        controls.forEach(control => {
          formGroup.get(control)?.setErrors(null);
        });
      }
    };
  }
  Clear() {
    this.custForm = this.formInit();
    this.custStatus = "";
    this.customer.Type = "";
    this.textMessageClass = "";
    this.retMessage = "";
  }
  reset() {
    if (this.customer == undefined || this.customer.Type == undefined || this.customer.Type == '') {
      return;
    }
    else {
      this.getCustomeDetails();
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

  refresh() {    this.custForm.controls['mode'].patchValue(this.data.mode);
    this.customer.company = this.userDataService.userData.company;
    this.customer.location = this.userDataService.userData.location;
    this.customer.refNo = this.userDataService.userData.sessionID;
    this.customer.Type = this.data.customerId;
    this.customer.Item = this.data.customerName;
    this.customer.user = this.userDataService.userData.userID;

    this.masterParams.company = this.userDataService.userData.company;;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = 'SM201';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.item = 'PARTYGROUP';

    const modesObservable = this.masterService.getModesList({ ...this.commonParams(), item: 'SM201' });
    const custGroupsObservable = this.masterService.getSpecificMasterItems(this.masterParams);
    const paytermListObservable = this.masterService.getSpecificMasterItems({ ...this.commonParams(), item: 'PAYTERM' });
    const saleListObservable = this.masterService.getSpecificMasterItems({ ...this.commonParams(), item: 'EMPLOYEE' });
    const currencyListObservable = this.masterService.getSpecificMasterItems({ ...this.commonParams(), item: 'CURRENCY' });
    const priceListObservable = this.masterService.getSpecificMasterItems({ ...this.commonParams(), item: 'PRICING' });
    this.subsink.sink = forkJoin({
      modes: modesObservable,
      custGroups: custGroupsObservable,
      paytermList: paytermListObservable,
      saleList: saleListObservable,
      currencyList: currencyListObservable,
      priceList: priceListObservable
    }).subscribe((results: any) => {
      const { modes, custGroups, paytermList, saleList, currencyList, priceList } = results;
      this.modes = modes['data'];
      this.custGroups = custGroups['data'];
      this.paytermList = paytermList['data'];
      this.saleList = saleList['data'];
      this.currencyList = currencyList['data'];
      this.pricesList = priceList['data'];
    });
    if (this.customer == undefined || this.customer.Type == undefined || this.customer.Type == '') {
      return;
    }
    else {
      this.getCustomeDetails();
    }
  }
  onPhone1Change(value:any){
    const input = value.target.value.replace(/[^0-9]/g, '');
    this.custForm.controls['phone1'].patchValue(input);
  }
  getCustomeDetails() {
    this.loader.start();
    this.subsink.sink = this.custService.getCustomerDet(this.customer).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
        const formValues = {
          'code': res['data'].code,
          'custName': res['data'].name,
          'effectiveDate': res['data'].effectiveDate,
          'vATPINNo': res['data'].vatpinNo,
          'currency': res['data'].currency,
          'payTerm': res['data'].payTerm,
          'pricing': res['data'].pricing,
          'groupName': res['data'].groupCode,
          'maxCrLimit': res['data'].maxCrLimit,
          'secuItemDesc': res['data'].secuItemDesc,
          'salesExecutive': res['data'].salesExecutive,
          'notes': res['data'].notes,
          'isCustomer': res['data'].isCustomer,
          'isVendor': res['data'].isVendor,
          'isEmployee': res['data'].isEmployee,
          'isLandlord': res['data'].isLandlord,
          'isTenant': res['data'].isTenant,
          'isStaker':res['data'].isStaker,
          'isCareTaker':res['data'].isCareTaker,
          'phone1':res['data'].phone,
          'email':res['data'].email,
          'name':res['data'].repName,

        };
        this.custName=res['data'].name;
        this.repCode=res['data'].repCode;
        this.custStatus = res['data'].status;
        this.custForm.patchValue(formValues);
        this.address.refresh(this.data.customerId, this.custForm.controls['mode'].value);
      }
      else {
        this.textMessageClass = "red";
        this.retMessage = "ERROR: " + res.message;
      }
    });
  }
  ngOnInit(): void {
    this.custId = this.data.customerId;
    if (this.userProfile === 'cmpuser') {
      this.tenantlnld = false;
    }
    this.refresh();
    this.getCountryList();
    this.custForm.get('countryCode')?.addValidators(Validators.required);
  }
  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.custForm.controls['mode'].value, tranNo: this.custForm.controls['code'].value, search: 'Customer Docs', tranType: "CLIENT" }
    });

  }
  prepareCustCls() {
    
    this.customer.mode = this.custForm.controls['mode'].value;
    this.customer.company = this.userDataService.userData.company;
    this.customer.location = this.userDataService.userData.location;
    this.customer.user = this.userDataService.userData.userID;
    this.customer.refNo = this.userDataService.userData.sessionID;
    this.customer.Type = this.data.customerId;
    this.customer.Item = this.data.customerName;
    this.customer.code = this.custForm.controls['code'].value;
    this.customer.name = this.custForm.controls['custName'].value;
    this.customer.effectiveDate = this.custForm.controls['effectiveDate'].value;
    this.customer.vATPINNo = this.custForm.controls['vATPINNo'].value;
    this.customer.currency = this.custForm.controls['currency'].value;
    this.customer.payTerm = this.custForm.controls['payTerm'].value;
    this.customer.pricing = this.custForm.controls['pricing'].value;
    this.customer.groupCode = this.custForm.controls['groupName'].value;
    this.customer.maxCrLimit = this.custForm.controls['maxCrLimit'].value;
    this.customer.secuItemDesc = this.custForm.controls['secuItemDesc'].value;
    this.customer.salesExecutive = this.custForm.controls['salesExecutive'].value;
    this.customer.notes = this.custForm.controls['notes'].value;
    this.customer.phone= '+' + this.custForm.controls['countryCode'].value + this.custForm.controls['phone1'].value.trim();
        this.customer.eMail=this.custForm.controls['email'].value;
    this.customer.isCustomer = this.custForm.controls['isCustomer'].value;
    this.customer.isVendor = this.custForm.controls['isVendor'].value;
    this.customer.isEmployee = this.custForm.controls['isEmployee'].value;
    this.customer.isLandlord = this.custForm.controls['isLandlord'].value;
    this.customer.isTenant = this.custForm.controls['isTenant'].value;
    this.customer.isStaker = this.custForm.controls['isStaker'].value;
    this.customer.IsCareTaker  = this.custForm.controls['isCareTaker'].value;
    this.customer.repCode=this.repCode;
    this.customer.repName=this.custForm.controls['name'].value;

  }



  checkMobileNumber() {
    
    this.custForm.controls['phone1'].value.trim();
    this.onUpdate();
    // if(this.custForm.controls['phone1'].value.startsWith(this.custForm.controls['countryCode'].value)){
    //   const message = `It seems that the entered phone number ${this.custForm.controls['phone1'].value} appears to start with the country code ${this.custForm.controls['countryCode'].value}.`
    //   const dialogData = new ConfirmDialogModel(
    //     `Confirm ${this.custForm.controls['phone1'].value}`,
    //     message
    //   );
    //   const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    //     maxWidth: '400px',
    //     height: '210px',
    //     data: dialogData,
    //     disableClose: true,
    //   });

    //   dialogRef.afterClosed().subscribe((dialogResult) => {
    //     if (dialogResult != true && dialogResult === 'YES') {
    //       this.onUpdate();
    //     } else {
    //       return;
    //     }
    //   });
    // }
  }
  private createRequestDataForSearch(item: string, type: string) {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }
  async onnameSearch() {
    const body = this.createRequestDataForSearch(this.custForm.get('name')!.value || "", "CARETAKER");
    try {
      this.subsink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.custForm.get('name')!.patchValue(res.data.selName);
            // this.tenantCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.custForm.get('name')!.value, 'PartyType': "CARETAKER",
                  'search': 'Care Taker Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.custForm.get('name')!.patchValue(result.partyName);
                  this.repCode=result.code;
                  // this.tenantCode = result.code;
                }

                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  onUpdate() {
    
    this.prepareCustCls();
    this.loader.start();
    this.subsink.sink = this.custService.updateCustomer(this.customer).subscribe((result: SaveApiResponse) => {
      this.loader.stop();
      this.retMessage = result.message;
      this.retNum = result.retVal;
      if (this.retNum === 101 || this.retNum === 102 || this.retNum === 103 || this.retNum === 104) {
        this.textMessageClass = "green"
        this.retMessage = result.message;
        if (this.custForm.controls['mode'].value === "Add") {
          this.custForm.controls['mode'].patchValue('Modify');
          this.data.customerId = result.tranNoNew;
        }
        this.custForm.controls['code'].patchValue(result.tranNoNew);
      }

      else if (this.retNum < 100) {
        this.textMessageClass = "red"
        this.retMessage = result.message;
      }
      else if (this.retNum > 200) {
        this.textMessageClass = "red"
        this.retMessage = result.message;
      }
      else {
        this.textMessageClass = "red"
        this.retMessage = result.message;
      }
    });
  }

  countryChanged(event: any) {
    const body = {
      ...this.commonParams(),
      item: event.source.value,
      type:'COUNTRY'
    };
    try{
      this.loader.start();
      this.subsink.sink=this.masterService.getCountryDetails(body).subscribe((res:any)=>{
        this.loader.stop();
      if(res.status.toUpperCase()==="SUCCESS"){
        this.custForm.controls['countryCode'].patchValue(res.data.isD_Code);
        this.custForm.controls['countryCode'].disable();
      }
      else{
        this.retMessage=res.message;
        this.textMessageClass='red';
      }
    })
    }
    catch(ex:any){
      this.retMessage=ex.message;
      this.textMessageClass='red';
    }
  }

  getCountryList(){
    const body = {
      ...this.commonParams(),
      item: 'COUNTRY'
    };
    try{
      this.loader.start();
    this.subsink.sink=this.masterService.getCountriesList(body).subscribe((res:getResponse)=>{
      this.loader.stop();
      if(res.status.toUpperCase()==="SUCCESS"){
        this.countryList = res['data'];
        this.filteredCountryNames = this.custForm.controls['countryName'].valueChanges.pipe(
          startWith(''),
          map((value:any) => this._filteredCountryNames(value))
        );

      }
      else{
        this.retMessage=res.message;
        this.textMessageClass='red';
      }
    })
    }
    catch(ex:any){
      this.retMessage=ex.message;
      this.textMessageClass='red';
    }
  }
  private _filteredCountryNames(value: any): Item[] {
    const filterValue =value.toLowerCase();
    return this.countryList.filter((country:any) =>
      country.itemName.toLowerCase().includes(filterValue)
    );
  }
  getSlNum(event: any) {
    this.serialNum = event.slNo;
  }
  onTabChanged(event: any) {
    const currentIndex = event.index;
    this.selectedTabIndex = currentIndex;
    if (currentIndex === 1 && this.previousTabIndex === 2) {
    } else if (currentIndex === 0 && this.previousTabIndex === 1) {
    } else {

      if (currentIndex === 1 && (this.serialNum != 0 && this.serialNum != undefined) && (this.custId != undefined && this.custId != null)) {
        this.contacts.refresh(this.custId, this.serialNum, this.custForm.controls['mode'].value);
      }
    }
    this.previousTabIndex = currentIndex;
  }

  modeChanged(event: any) {
    if (event.value === 'Add') {
      this.custForm = this.formInit();
      this.custForm.controls['mode'].patchValue(event.value, { emitEvent: false });
    }
    else {
      this.custForm.controls['mode'].patchValue(event.value, { emitEvent: false });
    }
  }
  displayCountryName(itemCode: string): string {
    if (!this.countryList) {
      return '';
    }
    const country = this.countryList.find((c: any) => c.itemCode === itemCode);
    return country ? country.itemName : '';
  }

}

