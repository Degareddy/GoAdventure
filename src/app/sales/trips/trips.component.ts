import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { map, Observable, startWith } from 'rxjs';
import { nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
import { getTripIds } from '../sales.class';

interface autoComplete {
  itemCode: string
  itemName: string
  itemDetails:string

}
@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit {
  autoFilteredCustomer: autoComplete[] = [];
  tripIdList:autoComplete[]=[]

  title:string="Trips"
  tripForm!:FormGroup
  packageTypes:Item[]=[]
  tomorrow=new Date();
    private subSink!: SubSink;
    filteredOptions!: Observable<string[]>;
    getTripIds!:getTripIds[]
  retMessage:string='';
  textMessageClass:string=''
  modes:Item[]=[
    {itemCode:'Add',itemName:'Add'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'},
    {itemCode:'Update',itemName:'Update'},
    {itemCode:'View',itemName:'View'},

  ]


  constructor(private fb:FormBuilder,protected masterService: MastersService,
    private loader: NgxUiLoaderService,private invService: InventoryService,private userDataService: UserDataService,) { 
    this.tripForm=this.formInit();
    this.subSink = new SubSink();
  }

  ngOnInit(): void {
    this.loadTripList();
    this.loadTripsId()
    this.tripForm.get('tripId')!.valueChanges
    .pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.itemName || ''),
      map(name => this._filter(name))
    )
    .subscribe(filtered => {
      this.autoFilteredCustomer = filtered;
    });
  }
  private _filter(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.tripIdList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue) ||
      option.itemDetails.toLowerCase().includes(filterValue)
    );
  }
  onSubmit(){
    const body={
      Mode:this.tripForm.get('mode')?.value,
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID,
      PackageType:this.tripForm.get('packageType')?.value,
      TripId:this.tripForm.get('tripId')?.value,
      TripDesc:this.tripForm.get('tripDesc')?.value,
      TranDate:this.tripForm.get('tranDate')?.value,
      StartDate:this.tripForm.get('StartDate')?.value,
      EndDate:this.tripForm.get('endDate')?.value,
      Remarks:this.tripForm.get('remarks')?.value,
    }
    try {
      this.loader.start()
          this.subSink.sink = this.invService.UpdateTripDetails(body).subscribe((res: any) => {
            this.loader.stop()
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }
  formInit() {
      return this.fb.group({
        mode: ['View'],
        tripId:[''],
        tripDesc:[''],
        packageType:[''],
        tranDate:[new Date()],
        StartDate:[new Date()],
        endDate:[new Date()],
        remarks:['']
      });
    }
    tripIdSearch(){

    }
    clear(){

    }
    Close(){

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
    loadTripsId(){
      const body={
        Mode:'View',
        Company:this.userDataService.userData.company,
        Location:this.userDataService.userData.location,
        User:this.userDataService.userData.userID,
        RefNo:this.userDataService.userData.sessionID,
        
      }
      try {
            this.subSink.sink =this.invService.GetTripDefinitionsList(body).subscribe((res: any) => {
              if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
                this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
                // this.rowData = [];
                
              }
              else {
                this.tripIdList = res.data;
                console.log(this.tripIdList)
                this.tripIdList = res.data.map((item: any) => ({
                  itemCode: item.tripId,
                  itemName: item.packageName,
                  itemDetails: item.startDate || item.tripStatus || 'No startDate Or trip Status'  // Adjust as needed
                }));
                 this.autoFilteredCustomer = res.data.map((item: any) => ({
                  itemCode: item.prodCode,
                  itemName: item.prodName,
                  itemDetails: item.uom || item.stdSalesRate || 'No UOM Or Standard sale rate'  // Adjust as needed
                }));
                this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
          }
    }
    tripPatch(){
      console.log(this.getTripIds)
    }
}
