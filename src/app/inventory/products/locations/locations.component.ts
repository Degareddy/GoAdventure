import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { Item } from 'src/app/general/Interface/interface';
import { ColumnApi, GridApi } from 'ag-grid-community';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { AccessSettings } from 'src/app/utils/access';
import { Items, displayMsg, TextClr } from 'src/app/utils/enums';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit {
  locationsForm!:FormGroup
  branches:Item[]=[]
  modes:Item[]=[];
    private subSink: SubSink;
    tomorrow=new Date()
    retMessage:string='';
    textMessageClass:string='';
    status:string='';
        private gridApi!: GridApi;
    private columnApi!: ColumnApi;
    public rowSelection: 'single' | 'multiple' = 'multiple';
    pageSizes = [25, 50, 100, 250, 500];
    pageSize = 25;
    columnDefs: any  = [
      { field: "locnName", headerName: "Branch", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "prodDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "prodStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
      { field: "remarks", headerName: "Remarks", sortable: true, filter: true, resizable: true, flex: 1 },
    ]
    rowData=[]  
  ngOnInit(): void {
    const lcnbody:getPayload = {
          ...this.commonParams(),
          company:this.data.company,
          item: Items.BRANCHES,
          mode:this.data.mode
        };
        try {
          this.subSink.sink = this.invService.GetMasterItemsList(lcnbody).subscribe((res: getResponse) => {
            if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
              this.branches = res.data;
              // if (this.branches.length === 1) {
              //   this.locationsForm.controls['branch'].patchValue(this.branches[0].itemCode, { emitEvent: false })
              // }
            }
            else {
              this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
      
    this.loadBranches()
    this.modes=this.data.modes
  }
  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
   constructor(private fb: FormBuilder, private invService: InventoryService,
      public dialog: MatDialog, private userDataService: UserDataService,
      
      @Inject(MAT_DIALOG_DATA) public data: { mode: string, product: string, code: string,company:string,modes:Item[] }, private loader: NgxUiLoaderService
    ) {
      this.locationsForm = this.formInit(),
        this.subSink = new SubSink();
    }
     formInit() {
        return this.fb.group({
          branch:['',Validators.required],
          remarks:[''],
          tranDate:[new Date() ],
          mode:[this.data.mode]
        })
      }
      loadBranches(){
        const body={
          ...this.commonParams(),
          item:this.data.code
        }
        try{
          this.loader.start();
          this.subSink.sink=this.invService.GetProductLocations(body).subscribe((res:any)=>{
            this.loader.stop();
            if(res.status.toUpperCase()=='SUCCESS'){
              this.rowData=res.data
              this.status=res.data[0].prodStatus
              this.retMessage=res.message;
              this.textMessageClass='green';
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
      onUpdate(){
        const body={
          ...this.commonParams(),
          mode:this.data.mode,
          prodcode:this.data.code,
          proddate:this.locationsForm.get('tranDate')?.value,
          prodsattus:this.status,
          remarks:this.locationsForm.get('remarks')?.value,
          branch:this.locationsForm.get('branch')?.value,
          item:this.data.code
        }
        try{
          this.loader.start();
          this.subSink.sink=this.invService.updateProductLocations(body).subscribe((res:any)=>{
            this.loader.stop();
            if(res.status.toUpperCase()=='SUCCESS'){
              this.retMessage=res.message;
              this.textMessageClass='green';
              this.loadBranches()
            }
          })
        }
        catch(ex){
          
        }
      }
      addNew(){
        this.locationsForm=this.formInit()
      }
      clear(){
        this.locationsForm=this.formInit()
      }
      commonParams() {
        return {
          company: this.userDataService.userData.company,
          location: this.userDataService.userData.location,
          user: this.userDataService.userData.userID,
          refNo: this.userDataService.userData.sessionID
        }
      }
      onGridReady(params: any) {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
        this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
      }
      onRowSelected(event:any){   
        console.log(event);
        this.locationsForm.get('branch')?.patchValue(event.data.location);
        this.locationsForm.get('remarks')?.patchValue(event.data.remarks);
        this.locationsForm.get('tranDate')?.patchValue( this.formatDate(event.data.prodDate));
        this.status=event.data.prodStatus;
     }
}
