import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { vendorProducts } from '../../sales.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CustomerService } from 'src/app/Services/customer.service';
import { min } from 'moment';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
interface Item {
  itemCode: string;
  itemName: string;
}
@Component({
  selector: 'app-vendor-products',
  templateUrl: './vendor-products.component.html',
  styleUrls: ['./vendor-products.component.css']
})
export class VendorProductsComponent implements OnInit,OnDestroy {
  @Input() Mode!: string;
  @Input() custID!: string;
  retMessage: string = '';
  public rowSelection: 'single' | 'multiple' = 'multiple';
  public gridOptions!: GridOptions;

  previousTabIndex!: number;
  public selectedTabIndex: number = 0;
  retNum!: number;

  public serialNum!: number;
  public custId!: string;
  public prodCode!:string;
  rowData: any = [];
  @Input() custName!: string;
  textMessageClass!: string;
 private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  prodclass!:vendorProducts;

  columnDefs: any = [];
  modes:Item[]=[
    {itemCode:'Select',itemName:'Select'},
    {itemCode:'Open',itemName:'Open'},
    {itemCode:'Delete',itemName:'Delete'},
  ];
  vendorProductForm!: FormGroup;
  subSink: SubSink;

  constructor(private fb: FormBuilder,protected custService: CustomerService, private userDataService: UserDataService,private loader: NgxUiLoaderService, private utlService: UtilitiesService,public dialog: MatDialog,) {
        this.subSink = new SubSink();
        this.vendorProductForm = this.formInit();
    
   }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }
  formInit() {
    return this.fb.group({
      productGroup: [''],
       effectiveDate: [new Date(), [Validators.required]],
       rate:[0,[Validators.required,]],
       code:['',[Validators.required]],
       status:['Select',[Validators.required]]
    });
  }
  clear(){
    this.formInit();
  }
  ngAfterViewInit(): void {
    this.columnDefs = [
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
  }
//  onTabChanged(event: any) {
//     const currentIndex = event.index;
//     this.selectedTabIndex = currentIndex;
//     if (currentIndex === 1 && this.previousTabIndex === 2) {
//     } else if (currentIndex === 0 && this.previousTabIndex === 1) {
//     } else {

//       if (currentIndex === 1 && (this.serialNum != 0 && this.serialNum != undefined) && (this.custId != undefined && this.custId != null)) {
//         // this.contacts.refresh(this.custId, this.serialNum, this.custForm.controls['mode'].value);
//       }
//     }
//     this.previousTabIndex = currentIndex;
//   }
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
            this.loadData();
            
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
  onRowSelected(event:any){   
     console.log(event);
     this.vendorProductForm.get('productGroup')?.patchValue(event.data.prodName);
     this.vendorProductForm.get('rate')?.patchValue(event.data.rate);
     this.vendorProductForm.get('code')?.patchValue(event.data.prodCode);
     this.vendorProductForm.get('effectiveDate')?.patchValue(event.data.validUntil);
     this.vendorProductForm.get('status')?.patchValue(event.data.prodStatus);

  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  
  prepareclass(){
    this.prodclass=new vendorProducts();
    this.prodclass.Mode=this.Mode;
    this.prodclass.company=this.userDataService.userData.company;
    this.prodclass.location=this.userDataService.userData.location;
    this.prodclass.Supplier=this.custID;
    this.prodclass.SlNo=0;
    this.prodclass.ProdCode=this.vendorProductForm.controls['code'].value;
    this.prodclass.Rate=this.vendorProductForm.controls['rate'].value;
    this.prodclass.ValidUntil=this.vendorProductForm.controls['effectiveDate'].value;
    this.prodclass.ProdStatus=this.vendorProductForm.controls['status'].value;
    this.prodclass.User=this.userDataService.userData.userID;
    this.prodclass.RefNo=this.userDataService.userData.sessionID;
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

    if (this.custID) {
      const body={
        Company: this.userDataService.userData.company,
        Location: this.userDataService.userData.location,
        refNo: this.userDataService.userData.sessionID,
        user: this.userDataService.userData.userID,
        Item: this.custID
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
onProductSearch() {
    const body = {
      ...this.commonPrams(),
      Type: "PRODUCT",
      Item: this.vendorProductForm.controls['productGroup'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.nameCount === 1) {
          this.vendorProductForm.controls['productGroup'].patchValue(res.data.selName);
          this.vendorProductForm.controls['code'].patchValue(res.data.selCode);
          // this.productChange(res.data.selCode, this.productForm.get('mode')?.value);
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.vendorProductForm.controls['productGroup'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            this.vendorProductForm.controls['productGroup'].patchValue(result.prodName);
            this.vendorProductForm.controls['code'].patchValue(result.prodCode);
            // this.vendorProductForm(result.prodCode, this.productForm.get('mode')?.value);
          });
        }
      }
      else {
        // this.retMessage = res.message;
        // this.textMessageClass = "red";
      }
    });
      }
}
