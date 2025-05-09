import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, Items, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit {
  title:string="Trips"
  tripForm!:FormGroup
  packageTypes:Item[]=[]
  tomorrow=new Date();
    private subSink!: SubSink;
  
  retMessage:string='';
  textMessageClass:string=''
  modes:Item[]=[
    {itemCode:'Add',itemName:'Add'},
    {itemCode:'Modify',itemName:'Modify'},
    {itemCode:'Delete',itemName:'Delete'},
    {itemCode:'Update',itemName:'Update'},
    {itemCode:'View',itemName:'View'},

  ]
  constructor(private fb:FormBuilder,private invService: InventoryService,private userDataService: UserDataService,) { 
    this.tripForm=this.formInit();
    this.subSink = new SubSink();

  }

  ngOnInit(): void {
    this.loadTripList()
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
          this.subSink.sink = this.invService.UpdateTripDetails(body).subscribe((res: any) => {
            
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
        RefNo:this.userDataService.userData.sessionID
      }
      try {
            this.subSink.sink = this.invService.GetTripDefinitionsList(body).subscribe((res: any) => {
              
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
}
