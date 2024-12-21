import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { data } from 'jquery';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { debounceTime, forkJoin } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';
import { getResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MasterParams } from 'src/app/modals/masters.modal';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
// import {
//   RowSelectionOptions,
// } from "@ag-grid-community";
@Component({
  selector: 'app-authorise-invoice',
  templateUrl: './authorise-invoice.component.html',
  styleUrls: ['./authorise-invoice.component.css']
})
export class AuthoriseInvoiceComponent implements OnInit {
  authoriseInvoiceForm!:FormGroup;
  invoiceType:Item[]=[
    {itemCode:'TENINV',itemName:'Tenant Invoice'},

  ];
  buttonEnable:boolean=true;
  isAllSelected:boolean=false;
  checkBoxEnable:boolean=true;
  subTrantype:Item[]=[
    {itemCode:'TNV',itemName:'Tenenat Invoice'},
  ];
   count=0;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  properytList:Item[]=[];
  blocksList:Item[]=[];
  retMessage: string = "";
  textMessageClass: string = "";
  subSink: SubSink = new SubSink();
  displayColumns = [ "mapped","slNo","tranNo", "tranDate", "tenantName"];
  dataSource:any = [];
  masterParams: MasterParams;
  
  // public rowSelection: 'single' | 'multiple' = {
  //   mode: "multiRow",
  // };;
  // public rowSelection: RowSelectionOptions | "single" | "multiple" = {
  //   mode: "multiRow",
  // };
  columnDefs:any=[
    { headerName: 'Property', field: 'propertyName', sortable: false, filter: true, resizable: true, flex: 1 },
    { headerName: 'Block', field: 'blockName', sortable: false, filter: true, resizable: true, flex: 1 },
  ];
  constructor(public dialog: MatDialog,private fb:FormBuilder,private masterService:MastersService,private loader: NgxUiLoaderService,private projService: ProjectsService,private userDataService:UserDataService) { this.authoriseInvoiceForm=this.forminit();   
    this.masterParams = new MasterParams();
    
  }
  toggleAllRows(isSelected: boolean) {
    this.isAllSelected = isSelected;
    this.buttonEnable = !isSelected;
    if(isSelected){
      this.count = this.dataSource.filteredData.length;
    }
    else{
      this.count = 0;
    }
    // this.count = this.dataSource.filteredData.length; 
    if (this.dataSource.data && Array.isArray(this.dataSource.data)) {
      this.dataSource.data.forEach((row: any) => (row.mapped = isSelected));
    }
  }
  
  

  // Update the status of a single row
  updateMapStatus(row: any, isSelected: boolean) {
    
    row.mapped = isSelected;
    if(this.isAllSelected && this.count>0){
      this.buttonEnable=false;
    }
    else{
      this.buttonEnable=!isSelected;
    }
    // this.buttonEnable=!isSelected;
    if(isSelected){
      this.count++;
      // this.authorisedDisable(this.count);
    }
    else{
      this.count--;
      // this.authorisedDisable(this.count);
    }
  }

  // Check if all rows are selected

  ngOnInit(): void {
        this.masterParams.company = this.userDataService.userData.company;
        this.masterParams.location = this.userDataService.userData.location;
        this.masterParams.user = this.userDataService.userData.userID;
        this.masterParams.refNo = this.userDataService.userData.sessionID;
        this.loadData();
        
  }
  // authorisedDisable(count:number){
  //   if(count>0){
  //     this.buttonEnable=false;
  //     return;
  //   }
  //   this.buttonEnable=true;

  // }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
    async loadData() {
      const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'PROPERTY' });
      this.subSink.sink =await forkJoin([property$]).subscribe(
        ([propertyRes]: any) => {
          this.handleloadRes(propertyRes)
        },
        error => {
          this.handelError(error,'red');
        }
      );
    }
    
    handleloadRes(propertyRes: getResponse) {
      
      if (propertyRes.status.toUpperCase() === "SUCCESS") {
        this.properytList = propertyRes['data'];
        if (this.properytList.length === 1) {
          this.authoriseInvoiceForm.get('property')!.patchValue(this.properytList[0].itemCode);
          this.propertyChnaged();
        }
      } else {
        this.retMessage = "Property list empty!";
        this.textMessageClass = "red";
  
      }
    }
    clearMsgs(){
      this.handelError('','');
    }
    async propertyChnaged(){
      this.blocksList = [];
      this.clearMsgs();
      this.masterParams.type = 'BLOCK';
      this.masterParams.item = this.authoriseInvoiceForm.controls['property'].value;
      try {
        if (this.masterParams.item != 'All' && this.authoriseInvoiceForm.controls['property'].value != '') {
          this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams)
            .pipe(
              debounceTime(300) // Adjust the debounce time as needed (in milliseconds)
            )
            .subscribe((result: getResponse) => {
              if (result.status.toUpperCase() === "SUCCESS") {
                this.blocksList = result['data'];
                if (this.blocksList.length === 1) {
                  this.authoriseInvoiceForm.get('block')!.patchValue(this.blocksList[0].itemCode);
                }
              }
              else {
                this.retMessage = "Block list empty!";
                this.textMessageClass = 'red';
                return;
              }
            });
        }
      }
      catch (ex: any) {
        this.loader.stop();
        this.handelError(ex,'red');
      }
    }
    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
    async apply() {
      
      let response = 1;
    
      // Iterate over the dataSource and make async calls
      for (let i = 0; i < (this.dataSource.data.length && this.count > 0) ; i++) {
        
    
        if (this.dataSource.data[i].mapped && response && this.count > 0) {
          const body = {
            ...this.commonParams(),
            TranType: this.authoriseInvoiceForm.controls['tranType'].value,
            SubTranType: this.authoriseInvoiceForm.controls['subTranType'].value,
            TranNo: this.dataSource.data[i].tranNo,
          };
    
          try {
            this.loader.start();
            // Wait for the Observable to complete before continuing
            const res: any = await this.projService.authoriseSelectedData(body).toPromise();
    
            this.loader.stop();
            if (res['status'].toUpperCase() === 'SUCCESS') {
              this.handelError(res, 'green');
              response = 1;
              --this.count;
            } else {
              this.handelError(res, 'red');
              response = 0;
            }
          } catch (ex: any) {
            this.handelError(ex, 'red');
            response = 0;
          }
        }
      }
    
      // Call submit only after all requests have been processed
      this.submit();
    }
    
    authoriseSelectedInvoice(){
      
      const message = `You are about to Authorise   ${this.count} invoices. Are you sure you want to continue?`;
        const dialogData = new ConfirmDialogModel("Do you want to Authorise ?", message);
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: "400px",
          height: '210px',
          data: dialogData,
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(dialogResult => {
          
          if (dialogResult != true && dialogResult === "YES") {
            this.apply();
            // return;
          }
          else {
            return;
          }
        });
      
      
    }
  submit(){
    const body={
      ...this.commonParams(),
      TranType:this.authoriseInvoiceForm.controls['tranType'].value,
      SubTranType:this.authoriseInvoiceForm.controls['subTranType'].value,
      Property:this.authoriseInvoiceForm.controls['property'].value,
      Block:this.authoriseInvoiceForm.controls['block'].value,
      FromDate:this.authoriseInvoiceForm.controls['fromDate'].value,
      ToDate:this.authoriseInvoiceForm.controls['toDate'].value,
    };
    try{
      this.loader.start();
      this.subSink.sink = this.projService.getAuthoriseInvoicesData(body).subscribe((res: any) => {
        this.loader.stop(); 
        if(res['status'].toUpperCase() === "SUCCESS"){
        // this.dataSource=res.data;
        this.checkBoxEnable=false;
        this.dataSource = new MatTableDataSource(res['data']);

            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.matsort;
        this.handelError(res,'green');
        }
        else{
          this.handelError(res,'red');
        }
      });
    }
    catch(ex:any){
      this.handelError(ex,'red');
    }
  }
  handelError(res: any,colour:any) {
    this.retMessage = res.message;
    this.textMessageClass = colour;
  }
  forminit(){
    return this.fb.group({
      tranType:['',[Validators.required]],
      subTranType:['',[Validators.required]],
      property:['',[Validators.required]],
      block:['',[Validators.required]],
      fromDate:[new Date(new Date().getFullYear(), new Date().getMonth(), 1),[Validators.required]],
      toDate:[new Date(),[Validators.required]]
    })
  }
  
  update(row:any,i:number){

  }
  onRowClick(row:any,i:number){

  }
  Clear(){
    this.authoriseInvoiceForm=this.forminit();
    this.dataSource=[];
  }
}
