import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-sub-types',
  templateUrl: './sub-types.component.html',
  styleUrls: ['./sub-types.component.css']
})
export class SubTypesComponent implements OnInit {
  subTypesForm!:FormGroup
  modes:Item[]=[]
  tomorrow=new Date()
  retMessage:string='';
  textMessageClass:string='';
  selectedSkinId:string='';
  selectedSubSkinId:string=''
  columnDefs: any = [
    // { field: "skinID", headerName: "Skin Id", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "skinName", headerName: "Skin Name", flex: 1, resizable: true, sortable: true, filter: true, },
    // { field: "subTypeID", headerName: "Sub Type Id", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "subTypeName", headerName: "Sub Type Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "subTypeDesc", headerName: "Sub Type Desc", sortable: true, filter: true, resizable: true, flex: 1 },
    
    {
      field: "effDate", headerName: "Effective Date", sortable: true, resizable: true, flex: 1, filter: true
      , valueFormatter: function (params: any) {
        // Format date as dd-MM-yyyy
        if (params.value) {
          const date = new Date(params.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return null;
      },
    },
    { field: "typeStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "matType", headerName: "Mat Type", sortable: true, filter: true, resizable: true, flex: 1 },
    // { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, flex: 1 },
    
  ];
  rowData:any=[]
      private subSink!: SubSink;
  

  constructor(private fb:FormBuilder,private userDataService: UserDataService,private invService: InventoryService,private loader: NgxUiLoaderService,) { 
    this.subTypesForm=this.forminit()
    this.subSink = new SubSink();

  }

  ngOnInit(): void {
    this.loadData()
  }
  loadData() {
      const modebody = {
        ...this.commonParams(),
        item: 'ST103'
      };
      const skinSubTypeBody = {
        ...this.commonParams(),
        // Item: "CURRENCY",
        mode: this.subTypesForm.get('mode')?.value
      };
      // const uombody: getPayload = {
      //   ...this.commonParams(),
      //   item: "UOM"
      // };
      const service1 = this.invService.getModesList(modebody);
      const service2 = this.invService.getSkinsSubTypes(skinSubTypeBody);
      // const service3 = this.assetdtService.GetMasterItemsList(uombody);
      this.subSink.sink = forkJoin([service1,service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          // const res3=results[2];
          this.modes = res1.data;
          this.rowData = res2.data;
          // this.UOMList=res3.data
        },
        (error: any) => {
          this.loader.stop();
        }
      );
    }
    commonParams() {
      return {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID
      }
    }
  forminit() {
    return this.fb.group({
      mode: ['View'],
      skinId:[''],
      subTypeId:[''],
      subTypeDesc:[''],
      effDate:[new Date()],
      notes:[''],
      skinName:[''],
      subTypeName:[''],
      matType:['']
    });
  }
  update(){
    const body={
    "Mode":this.subTypesForm.get('mode')?.value,
     "Company":this.userDataService.userData.company,
     "Location":this.userDataService.userData.location,
     "SkinID":this.selectedSkinId,
     "SubTypeID":this.selectedSubSkinId,
     "SubTypeName":this.subTypesForm.get('subTypeName')?.value,
     "SubTypeDesc":this.subTypesForm.get('subTypeDesc')?.value,
     "EffDate":this.subTypesForm.get('effDate')?.value,
     "Notes":this.subTypesForm.get('notes')?.value,
     "MatType":this.subTypesForm.get('matType')?.value,
     "User":this.userDataService.userData.userID,
     "RefNo":this.userDataService.userData.userID,

    }
    try {
      this.loader.start();
      this.subSink.sink = this.invService.updateSkinsTypes(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR" || res.status.toUpperCase() === "FAILED") {
         this.displayMessage(res.message,'red')
        }
        else{
          this.displayMessage(res.message,'green')
        }
      });

  }
  catch(ex:any){
    this.displayMessage(ex.message,'red')
  }
    
  }

onRowSelected(event:any){
// const body={
//   "Company":this.userDataService.userData.company,
//   "Location":this.userDataService.userData.location,
//   "Item":event.data.subTypeID,
//   "User":this.userDataService.userData.userID,
//   "RefNo":this.userDataService.userData.userID,
// }
// try {
//   this.loader.start();
//   this.subSink.sink = this.invService.GetSelSkinSubTypeDetails(body).subscribe((res: any) => {
//     this.loader.stop();
//     if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR" || res.status.toUpperCase() === "FAILED") {
//      this.displayMessage(res.message,'red')
//     }
//     else{
//       this.displayMessage(res.message,'green')
//     }
//   });

// }
// catch(ex:any){
// this.displayMessage(ex.message,'red')
// }
this.subTypesForm.patchValue({
  skinId:event.data.skinID,
  subTypeId:event.data.subTypeID,
  subTypeDesc:event.data.subTypeDesc,
  effDate:event.data.effDate,
  notes:event.data.notes,
  skinName:event.data.skinName,
  subTypeName:event.data.subTypeName,
  matType:event.data.matType,
}, { emitEvent: false });
this.selectedSkinId=event.data.skinId
this.selectedSubSkinId=event.data.subTypeID

}
displayMessage(message:string , classColor:string){
  this.retMessage=message;
  this.textMessageClass=classColor;
}

}
