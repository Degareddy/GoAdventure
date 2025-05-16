import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Observable, startWith, map } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
import { autoComplete, dateFormat, getTripIds } from '../sales.class';
import { SalesService } from 'src/app/Services/sales.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-package-names',
  templateUrl: './package-names.component.html',
  styleUrls: ['./package-names.component.css']
})
export class PackageNamesComponent implements OnInit {
  autoFilteredCustomer: autoComplete[] = [];
    tripIdList:autoComplete[]=[]
  dateFormat!:dateFormat
    title:string="Packages"
    packageNamesForm!:FormGroup
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
    dialogOpen:boolean=false
      private columnApi!: ColumnApi;
      private gridApi!: GridApi;
      public gridOptions!: GridOptions;
  
    columnDefs: any = [
      { field: "packageTypeName", headerName: "Package Type", sortable: true, filter: true, resizable: true, flex: 2, },
  
      { field: "packageName", headerName: "Package Name", sortable: true, filter: true, resizable: true, flex: 1, },
      {field:"packageStatus",headerName:"Status",sortable:true,filter:true,resizable:true,flex:1},
    ];
    rowData:any=[]
    constructor(private fb:FormBuilder,
          protected router: Router, private datepipe: DatePipe,  public dialog: MatDialog,protected masterService: MastersService,private salesService:SalesService,
      private loader: NgxUiLoaderService,private invService: InventoryService,private userDataService: UserDataService,) { 
      this.packageNamesForm=this.formInit();
      this.subSink = new SubSink();
      this.dateFormat=new dateFormat(datepipe);
    }
  
    ngOnInit(): void {
      // this.loadPackages();
      this.loadTripList();
      // this.loadTripsId()
      // this.packageNamesForm.get('tripId')!.valueChanges
      // .pipe(
      //   startWith(''),
      //   map(value => typeof value === 'string' ? value : value?.itemName || ''),
      //   map(name => this._filter(name))
      // )
      // .subscribe(filtered => {
      //   this.autoFilteredCustomer = filtered;
      // });
    }
    private _filter(value: string): autoComplete[] {
      const filterValue = value.toLowerCase();
    
      return this.tripIdList.filter(option =>
        option.itemName.toLowerCase().includes(filterValue) ||
        option.itemCode.toLowerCase().includes(filterValue) ||
        option.itemDetails.toLowerCase().includes(filterValue)
      );
    }
    onGridReady(params: any) {
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
      this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
    }
    onRowSelected(event: any) {
      console.log(event.data);
      this.patchForm(event.data);
    } 
    
    patchForm(event:any){
      this.packageNamesForm.get('mode')?.patchValue("Modify");
      this.packageNamesForm.get('packageCode')?.patchValue(event.packageId);
      this.packageNamesForm.get('packageName')?.patchValue(event.packageName);
      this.packageNamesForm.get('packageType')?.patchValue(event.packageId);
      this.packageNamesForm.get('remarks')?.patchValue(event.remarks);
      this.packageNamesForm.get('packageType')?.patchValue(event.packageType)
      this.packageNamesForm.get('tranDate')?.patchValue(this.dateFormat.formatDate(event.tranDate))

    }   
    loadPackages(){
      
      const body={
        "Mode":"View",
        "Company":this.userDataService.userData.company,
        "Location":this.userDataService.userData.location,
        "User":this.userDataService.userData.userID,
        "RefNo":this.userDataService.userData.sessionID,
        "item":this.packageNamesForm.get('packageType')?.value,
      }
      try {
        this.loader.start()
            this.subSink.sink = this.salesService.GetPackagesList(body).subscribe((res: any) => {
              this.loader.stop();
              if(res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR){
                this.displayMessage(res.message, TextClr.red);
                this.rowData=[]
              }
              else{
                this.rowData=res.data;
                this.displayMessage(res.message, TextClr.green);
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
          }
    }
    onSubmit(){
      const body={
        Mode:this.packageNamesForm.get('mode')?.value,
        Company:this.userDataService.userData.company,
        Location:this.userDataService.userData.location,
        User:this.userDataService.userData.userID,
        RefNo:this.userDataService.userData.sessionID,
        PackageType:this.packageNamesForm.get('packageType')?.value,
        PackageId:this.packageNamesForm.get('packageId')?.value,
        PackageName:this.packageNamesForm.get('packageName')?.value,
        TranDate:this.packageNamesForm.get('tranDate')?.value,
        Remarks:this.packageNamesForm.get('remarks')?.value,
        days:this.packageNamesForm.get('days')?.value
       //PackageDesc/TranDate/Remarks
      }
      try {
        this.loader.start()
            this.subSink.sink = this.salesService.UpdatePackageDetails(body).subscribe((res: any) => {
              this.loader.stop();
              if(res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR){
                this.displayMessage(res.message, TextClr.red);
              }
              else{
                this.displayMessage(res.message, TextClr.green);
                this.packageNamesForm.get('mode')?.patchValue("Modify");
                this.loadPackages()
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
          packageCode:['',Validators.required],
          packageName:['',Validators.required],
          packageType:['',Validators.required],
          tranDate:[new Date()],
          remarks:[''],
          days:[0]
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
                          'search': 'Package Name Search'
                        }
                      });
        
                      dialogRef.afterClosed().subscribe(result => {
                        this.dialogOpen = false;
                        if (result != true) {
                          
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
     this.packageNamesForm.get('mode')?.patchValue("View");
      this.packageNamesForm.get('packageCode')?.patchValue('');
      this.packageNamesForm.get('packageName')?.patchValue('');
      this.packageNamesForm.get('packageType')?.patchValue('');
      this.packageNamesForm.get('remarks')?.patchValue('');
      this.packageNamesForm.get('packageType')?.patchValue('')
      this.packageNamesForm.get('tranDate')?.patchValue(new Date())
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
                if(res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR){
                  this.displayMessage(res.message, TextClr.red);
                }
                else{
                  this.displayMessage(res.message, TextClr.green);
                  this.packageTypes= res.data
                }
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
      // loadTripsId(){
      //   const body={
      //     Mode:'View',
      //     Company:this.userDataService.userData.company,
      //     Location:this.userDataService.userData.location,
      //     User:this.userDataService.userData.userID,
      //     RefNo:this.userDataService.userData.sessionID,
          
      //   }
      //   try {
      //         this.subSink.sink =this.invService.GetTripDefinitionsList(body).subscribe((res: any) => {
      //           if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
      //             this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
      //             // this.rowData = [];
                  
      //           }
      //           else {
      //             this.tripIdList = res.data;
      //             console.log(this.tripIdList)
      //             this.tripIdList = res.data.map((item: any) => ({
      //               itemCode: item.tripId,
      //               itemName: item.packageName,
      //               itemDetails: item.startDate || item.tripStatus || 'No startDate Or trip Status'  // Adjust as needed
      //             }));
      //              this.autoFilteredCustomer = res.data.map((item: any) => ({
      //               itemCode: item.prodCode,
      //               itemName: item.prodName,
      //               itemDetails: item.uom || item.stdSalesRate || 'No startDate Or trip Status'  // Adjust as needed
      //             }));
      //             this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
      //           }
      //         });
      //       }
      //       catch (ex: any) {
      //         this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      //       }
      // }
      tripPatch(){
        console.log(this.getTripIds)
        const selectedTrip = this.getTripIds.find((item: any) => item.tripId === this.packageNamesForm.get('tripId')?.value);
        console.log(selectedTrip)
        this.packageNamesForm.get('tripDesc')?.patchValue(selectedTrip?.tripDesc || '');
  
        this.packageNamesForm.patchValue(this.getTripIds.filter((item: any) => item.itemCode === this.packageNamesForm.get('tripId')?.value)[0])
      }

}
