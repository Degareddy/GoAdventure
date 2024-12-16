import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { vendorProducts } from 'src/app/sales/sales.class';
import { CustomerService } from 'src/app/Services/customer.service';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
interface Item{
  itemCode:string;
  itemName:string;
}
@Component({
  selector: 'app-supplier-products',
  templateUrl: './supplier-products.component.html',
  styleUrls: ['./supplier-products.component.css']
})
export class SupplierProductsComponent implements OnInit {
  subSink: SubSink;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  public gridOptions!: GridOptions;

  columnDefs: any  = [
    { field: "slNo", headerName: "slNo", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "prodName", headerName: "Product", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "prodStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "prodStatus", headerName: "Status", sortable: true, filter: true, resizable: true, flex: 1 },
   

    {
      headerName: "Price",
      field: "rate",
      sortable: true,
      resizable: true,
      filter: 'agNumberColumnFilter',
      type: 'rightAligned',
      flex: 1,

      valueFormatter: (params: { data: { rate: any; }; }) => {
        const amount = params.data.rate;
        if (amount !== undefined) {
          const formattedBalance=Math.abs(amount).toLocaleString();
          // const formattedBalance = amount < 0
          //   ? `(${Math.abs(amount).toLocaleString()})`
          //   : amount.toLocaleString();


          return `Ksh ${formattedBalance}`;
        }
        return '';
      },
    },
    {
      field: "validUntil", headerName: "Validity", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
  ]
  dialogOpen: boolean = false;
  retMessage: string = "";
  retNum:number=0;
  private columnApi!: ColumnApi;
    private gridApi!: GridApi;
  prodclass!:vendorProducts;
  modes:Item[]=[
    {itemCode:'Select',itemName:'Select'},
    {itemCode:'Open',itemName:'Open'},
    {itemCode:'Delete',itemName:'Delete'},
  ];
  rowData: any = [];

  textMessageClass: string = "";
  supplierProductsForm!:FormGroup;
  constructor(private fb: FormBuilder, private invService: InventoryService,protected custService: CustomerService,
      public dialog: MatDialog,private userDataService: UserDataService,private utlService: UtilitiesService,
      @Inject(MAT_DIALOG_DATA) public data: { mode: string, product: string, code: string }, private loader: NgxUiLoaderService
    ) {
      this.supplierProductsForm = this.formInit(),
        this.subSink = new SubSink();
      // this.prodCls = new productAliasNameDetails();
    }

  ngOnInit(): void {
    this.loadData();
  }
  
  formInit() {
    return this.fb.group({
      supplier: ['', [Validators.required, Validators.maxLength(50)]],
      effectiveDate: [new Date(), [Validators.required]],
       rate:[0,[Validators.required]],
       code:['',[Validators.required]],
       status:['Select',[Validators.required]]
    });
  }
  prepareclass(){
    this.prodclass=new vendorProducts();
    this.prodclass.Mode=this.data.mode;
    this.prodclass.company=this.userDataService.userData.company;
    this.prodclass.location=this.userDataService.userData.location;
    this.prodclass.Supplier=this.supplierProductsForm.controls['code'].value;
    this.prodclass.SlNo=0;
    this.prodclass.ProdCode=this.data.code;
    this.prodclass.Rate=this.supplierProductsForm.controls['rate'].value;
    this.prodclass.ValidUntil=this.supplierProductsForm.controls['effectiveDate'].value;
    this.prodclass.ProdStatus=this.supplierProductsForm.controls['status'].value;
    this.prodclass.User=this.userDataService.userData.userID;
    this.prodclass.RefNo=this.userDataService.userData.sessionID;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onSupplierSearch() {
      const body = {
        ...this.commonParams(),
        Type: "SUPPLIER",
        Item: this.supplierProductsForm.controls['supplier'].value,
        ItemFirstLevel: "",
        ItemSecondLevel: ""
      }
      try {
        this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
          if (res.retVal === 0) {
            if (res && res.data && res.data.nameCount === 1) {
              this.supplierProductsForm.controls['supplier'].patchValue(res.data.selName);
              this.supplierProductsForm.controls['code'].patchValue(res.data.code);
              // this.suppInvCls.supplier = res.data.selCode;
            }
            else {
              if (!this.dialogOpen) {
                const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                  width: '90%',
                  disableClose: true,
                  data: {
                    'tranNum': this.supplierProductsForm.controls['supplier'].value, 'PartyType': "SUPPLIER",
                    'search': 'Supplier Search', 'PartyName': this.supplierProductsForm.controls['supplier'].value
                  }
                });
                this.dialogOpen = true;
                dialogRef.afterClosed().subscribe(result => {
                  if (result != true) {
                    this.supplierProductsForm.controls['supplier'].patchValue(result.partyName);
                    this.supplierProductsForm.controls['code'].patchValue(result.code);
                    // this.suppInvCls.supplier = result.code;
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
        this.retMessage = "Exception: " + ex.message;
        this.textMessageClass = 'red';
      }
    }
    clear(){
      this.formInit();
    }
    onRowSelected(event:any){   
      console.log(event);
      this.supplierProductsForm.get('productGroup')?.patchValue(event.data.prodName);
      this.supplierProductsForm.get('rate')?.patchValue(event.data.rate);
      this.supplierProductsForm.get('code')?.patchValue(event.data.prodCode);
      this.supplierProductsForm.get('effectiveDate')?.patchValue(event.data.validUntil);
      this.supplierProductsForm.get('status')?.patchValue(event.data.prodStatus);
 
   }
   onGridReady(params: any) {
     this.gridApi = params.api;
     this.columnApi = params.columnApi;
     this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
   }
     submit(){
        this.prepareclass();
        this.loader.start();
            this.subSink.sink = this.custService.UpdateSupplierProducts(this.prodclass).subscribe((result: SaveApiResponse) => {
              this.loader.stop();
              this.retMessage = result.message;
              this.retNum = result.retVal;
              if (this.retNum === 101 || this.retNum === 102 || this.retNum === 103 || this.retNum === 104) {
                this.textMessageClass = "green"
                this.retMessage = result.message;
                
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
      commonPrams() {
        return {
          Company: this.userDataService.userData.company,
          Location: this.userDataService.userData.location,
          refNo: this.userDataService.userData.sessionID,
          user: this.userDataService.userData.userID
        }
      }
      
      loadData() {
    
        if (this.data.code) {
          const body={
            Company: this.userDataService.userData.company,
            Location: this.userDataService.userData.location,
            refNo: this.userDataService.userData.sessionID,
            user: this.userDataService.userData.userID,
            Item: this.data.code
          }
        
          try {
            this.loader.start();
            this.subSink.sink = this.custService.GetSupplierProducts(body).subscribe((res: any) => {
              this.loader.stop();
              if (res.status.toUpperCase() === "SUCCESS") {
                this.rowData=res['data'];
                // this.rowData = this.processRowPostCreate(res['data']);
                this.displayMessage("Success: " + res.message, "green");
              }
              else {
                this.displayMessage("Error: " + res.message, "red");
              }
            });
          }
          catch (ex: any) {
            this.displayMessage("Exception: " + ex.message, "red");
          }
    
        }
        else {
          this.displayMessage("No Customer ID", "red");
          return;
        }
      }
      private displayMessage(message: string, cssClass: string) {
        this.retMessage = message;
        this.textMessageClass = cssClass;
      }
}
