import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { addOneDay, dateFormat, getTripIds } from '../sales.class';
import { SalesService } from 'src/app/Services/sales.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';


interface autoComplete {
  itemCode: string
  itemName: string
  itemDetails:string

}
interface packageNames {
  packageId:string;
  packageName:string;
  days:number
}
@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit {
  autoFilteredCustomer: autoComplete[] = [];
    dateFormat!:dateFormat
    addOneDay!:addOneDay
    screenName:string=localStorage.getItem('previousScreen')||''
  tripIdList:autoComplete[]=[]
  autoFilteredPackageNames: autoComplete[] = [];
  packageNamesList:autoComplete[]=[]
  packageNames:packageNames[]=[]
  title:string="Trips"
  tripForm!:FormGroup
  packageTypes:Item[]=[]
  tomorrow=new Date();
  // this.tomorrow.setDate(tjhtomorrow.getDate() + 1);
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
  dialogOpen = false;


  constructor(private fb:FormBuilder,protected router: Router,private location: Location,
    public dialog: MatDialog,protected masterService: MastersService,
    private datepipe: DatePipe,private salesService:SalesService,
    private loader: NgxUiLoaderService,private invService: InventoryService,private userDataService: UserDataService,) { 
    this.tripForm=this.formInit();
    this.subSink = new SubSink();
        this.dateFormat=new dateFormat(datepipe);
        this.addOneDay=new addOneDay(datepipe);
  }
   goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadTripList();
    // this.loadTripsId()
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
  ngOnDestroy(){
    this.subSink.unsubscribe();
     localStorage.setItem('previousScreen','Trips')
  }
  private _filter(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.tripIdList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue) ||
      option.itemDetails.toLowerCase().includes(filterValue)
    );
  }
  getEndDate(){
    
    this.tripForm.get('endDate')?.patchValue(this.addOneDay.durationAdd((this.tripForm.get('StartDate')?.value),this.getDaysByPackageId(this.tripForm.get('packageName')?.value))) 
  }
  getDaysByPackageId(id: string): number {
    
  const result = this.packageNames.find((pkg: { packageId: string; }) => pkg.packageId === id);
  return result ? result.days : 0;
}
packageNameSelected(){
  this.getEndDate();
}
  onSubmit(){

    if(this.tripForm.get('StartDate')?.value > this.tripForm.get('endDate')?.value){
      alert("Please make sure the start date is before the end date");
      return;
    }
    const body={
      Mode:this.tripForm.get('mode')?.value,
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID,
      PackageType:this.tripForm.get('packageType')?.value,
      package:this.tripForm.get('packageName')?.value,
      TripId:this.tripForm.get('tripId')?.value,
      TripDesc:this.tripForm.get('tripDesc')?.value,
      TranDate: this.addOneDay.formatDate(this.tripForm.get('tranDate')?.value) ,
      StartDate:this.addOneDay.formatDate(this.tripForm.get('StartDate')?.value) ,
      EndDate: this.addOneDay.formatDate(this.tripForm.get('endDate')?.value) ,
      Remarks:this.tripForm.get('remarks')?.value,

   }
    try {
      this.displayMessage("","");
      this.loader.start()
          this.subSink.sink = this.invService.UpdateTripDetails(body).subscribe((res: any) => {
            this.loader.stop();
            if(res.status.toUpperCase() === "SUCCESS"){
              this.displayMessage(displayMsg.SUCCESS,TextClr.green);
              this.tripForm.get('mode')?.patchValue("Modify")
            }
            else{
              this.displayMessage(displayMsg.ERROR + res.message,TextClr.red);
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }
  getPackageNames(){
    const body={
      "Mode":"View",
      "Company":this.userDataService.userData.company,
      "Location":this.userDataService.userData.location,
      "User":this.userDataService.userData.userID,
      "RefNo":this.userDataService.userData.sessionID,
      "item":this.tripForm.get('packageType')?.value,
    }
    try {
      this.loader.start()
          this.subSink.sink = this.salesService.GetPackagesList(body).subscribe((res: any) => {
            this.loader.stop();
            if(res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR){
              this.displayMessage(res.message, TextClr.red);
            }
            else{
              this.packageNames=res.data;
              this.displayMessage(res.message, TextClr.green);
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }
  formInit() {
      return this.fb.group({
        mode: ['View'],
        tripId:['',Validators.required],
        tripDesc:['',Validators.required],
        packageType:['',Validators.required],
        tranDate:[new Date()],
        StartDate:[new Date()],
        endDate:[new Date()],
        remarks:[''],
        packageName:['',Validators.required]
      });
    }
    tripIdSearch(){
       try {
                  if (!this.dialogOpen) {
                    this.dialogOpen = true;
                    const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                      width: '90%',
                      disableClose: true,
                      data: {
                        'tranNum':'',
                        'search': 'Trip Searc'
                      }
                    });
      
                    dialogRef.afterClosed().subscribe(result => {
                      this.dialogOpen = false;
                      if (result != true) {
                        if(result.tripId){
                          this.getPackageNames()
                        this.displayMessage("Details for "+ result.tripId +"Has retrived ","green")
                        this.tripForm.get('mode')?.patchValue("Modify")
                        this.tripForm.get('tripId')?.patchValue(result.tripId)
                        this.tripForm.get('tripDesc')?.patchValue(result.tripDesc)
                        this.tripForm.get('packageType')?.patchValue(result.packageType)
                        // this.tripForm.get('tranDate')?.patchValue(result.)
                        this.tripForm.get('StartDate')?.patchValue(this.dateFormat.formatDate(result.startDate))
                        this.tripForm.get('endDate')?.patchValue(this.dateFormat.formatDate( result.endDate))
                        this.tripForm.get('packageName')?.patchValue(result.package)
                        // this.tripForm.get('remarks')?.patchValue(result.)
                        }     
                        else{
                          this.displayMessage("Please contact Admin","red")
                        }
                      }
                    });
                  }
          }       
      
          catch (ex: any) {
            this.retMessage = "Exception " + ex.message;
            this.textMessageClass = 'red';
          }
    }
    clear(){
       
        this.tripForm.get('mode')?.patchValue("View")
        this.tripForm.get('tripId')?.patchValue('')
        this.tripForm.get('tripDesc')?.patchValue('')
        this.tripForm.get('packageType')?.patchValue('')
        this.tripForm.get('tranDate')?.patchValue(new Date())
        this.tripForm.get('StartDate')?.patchValue(new Date())
        this.tripForm.get('endDate')?.patchValue(new Date())
        this.tripForm.get('packageName')?.patchValue('')
        this.tripForm.get('remarks')?.patchValue('')
        this.displayMessage("","");
    }
    Close(){
      this.router.navigateByUrl('/home');

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
                  itemDetails: item.uom || item.stdSalesRate || 'No startDate Or trip Status'  // Adjust as needed
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
      const selectedTrip = this.getTripIds.find((item: any) => item.tripId === this.tripForm.get('tripId')?.value);
      console.log(selectedTrip)
      this.tripForm.get('tripDesc')?.patchValue(selectedTrip?.tripDesc || '');

      this.tripForm.patchValue(this.getTripIds.filter((item: any) => item.itemCode === this.tripForm.get('tripId')?.value)[0])
    }
}
