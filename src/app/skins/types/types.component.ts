import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { AssetsService } from 'src/app/Services/assets.service';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-types',
  templateUrl: './types.component.html',
  styleUrls: ['./types.component.css']
})
export class TypesComponent implements OnInit {
  typesForm!:FormGroup;
  modes:Item[]=[];
  retMessage:string='';
  textMessageClass:string=''
  skinsList:Item[]=[];
  rowData: any = [];
  selectedSkinId:string='';
  UOMList: Item[] = [];
  columnDefs: any = [
    { field: "skinID", headerName: "Skin Id", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "skinName", headerName: "Skin Name", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "skinDesc", headerName: "Skin Desc", sortable: true, filter: true, resizable: true, flex: 1 },
    
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
    { field: "skinStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "notes", headerName: "Notes", sortable: true, filter: true, resizable: true, flex: 1 },
    
  ];
  tomorrow=new Date()
    private subSink!: SubSink;
  
  constructor(private fb:FormBuilder,private userDataService: UserDataService, private invService: InventoryService,private loader: NgxUiLoaderService,protected assetdtService: AssetsService) {
    this.typesForm=this.forminit()
        this.subSink = new SubSink();
    
   }

  ngOnInit(): void {
    this.loadData()
  }
  forminit() {
      return this.fb.group({
        mode: ['View'],
        skinsTypes:[''],
        SkinDesc:[''],
        effDate:[new Date()],
        notes:[''],
        UOM:['']
      });
    }
    
loadData() {
    const modebody = {
      ...this.commonParams(),
      item: 'ST103'
    };
    const skinBody = {
      ...this.commonParams(),
      // Item: "CURRENCY",
      mode: this.typesForm.get('mode')?.value
    };
    const uombody: getPayload = {
      ...this.commonParams(),
      item: "UOM"
    };
    const service1 = this.invService.getModesList(modebody);
    const service2 = this.invService.getSkinsTypes(skinBody);
    const service3 = this.assetdtService.GetMasterItemsList(uombody);
    this.subSink.sink = forkJoin([service1,service2,service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3=results[2];
        this.modes = res1.data;
        this.rowData = res2.data;
        this.UOMList=res3.data
      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }
   
  onRowSelected(event: any) {
    console.log(event);
    this.typesForm.patchValue({
      skinsTypes:event.data.skinName,
      SkinDesc:event.data.skinDesc,
      effDate:event.data.effDate,
      notes:event.data.notes,
      UOM:event.data.uom
      
    }, { emitEvent: false });
    this.selectedSkinId=event.data.skinID
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  update()
  {
    if(this.typesForm.get('mode')?.value.toUpperCase() === "MODIFY"){
      const body={
        "Mode":'Modify',
        "Company":this.userDataService.userData.company,
        "SkinID":this.selectedSkinId,
       "SkinName":this.typesForm.get('skinsTypes')?.value,
        "SkinDesc":this.typesForm.get('UOM')?.value,
        "EffDate":this.typesForm.get('effDate')?.value,
        "Notes":this.typesForm.get('notes')?.value,
        "User":this.userDataService.userData.userID,
        "RefNo":this.userDataService.userData.userName,
        "UOM":this.typesForm.get('UOM')?.value,
        "location":this.userDataService.userData.location,
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
}

  displayMessage(message:string , classColor:string){
    this.retMessage=message;
    this.textMessageClass=classColor;
  }

}
