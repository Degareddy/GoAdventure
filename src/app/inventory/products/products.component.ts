import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Observable, forkJoin, map, startWith } from 'rxjs';
import { InventoryService } from 'src/app/Services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { Product } from '../products/product.model';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { WarehouseComponent } from '../warehouse/warehouse.component';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { Item } from 'src/app/general/Interface/interface';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { LogComponent } from 'src/app/general/log/log.component';
import { SupplierProductsComponent } from './supplier-products/supplier-products.component';
interface params {
  itemCode: string
  itemName: string

}
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  productCls!: Product;
  private subSink: SubSink;
  modeIndex!: number;
  modes: Item[] = [];
  newTranMsg!: string;
  productList: any = [];
  productControl = new FormControl();
  filteredProductList!: Observable<params[]>;
  vatTypes: Item[] = [];
  UOMList: Item[] = [];
  groupList: Item[] = [];
  wareHouseList: Item[] = [];
  retMessage!: string;
  textMessageClass!: string;
  prodStatus!: string;
  @Input() max: any;
  tomorrow = new Date();

  @ViewChild('frmClear') public sprFrm!: NgForm;
  selectedObjects!: any[];
  constructor(private fb: FormBuilder, protected router: Router, private utlService: UtilitiesService,
    private invService: InventoryService, public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private toastr: ToastrService) {
    this.productForm = this.formInit();
    this.productCls = new Product();
    this.subSink = new SubSink();
    this.selectedObjects = [{ itemCode: 'View', itemName: 'View' }];
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  filterProducts(value: any) {
    const filterValue = value.toLowerCase();
    return this.productList.filter((product: params) => product.itemName.toLowerCase().includes(filterValue));
  }

  displayProduct(item: any): string {
    return item ? item.itemName : '';
  }
  warehouse(event: any) {
    const dialogRef: MatDialogRef<WarehouseComponent> = this.dialog.open(WarehouseComponent, {
      disableClose: true,
      width: '980px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const wrbody = {
          ...this.commonPrams(),
          item: 'WAREHOUSE'
        }
        this.subSink.sink = this.invService.GetMasterItemsList(wrbody).subscribe((res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.wareHouseList = res.data;
          }
        })
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
    const service1 = this.invService.getModesList({ ...this.commonPrams(), item: 'SM303' });
    const service2 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: 'PRODUCTS' });
    const service3 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: 'VAT' });
    const service4 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: 'UOM' });
    const service5 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: 'WAREHOUSE' });
    const service6 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: 'PRODUCTGROUP' });
    this.loader.start();
    this.subSink.sink = forkJoin([service1, service2, service3, service4, service5, service6]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        const res4 = results[3];
        const res5 = results[4];
        const res6 = results[5];
        this.modes = res1.data;
        this.productList = res2.data;
        this.vatTypes = res3.data;
        this.UOMList = res4.data;
        this.wareHouseList = res5.data;
        this.groupList = res6.data
        if (this.productList) {
          this.filteredProductList = this.productForm.get('productGroup')!.valueChanges.pipe(
            startWith(''),
            map((value: any) => {
              const name = typeof value === 'string' ? value : value?.itemName;
              return name ? this.filterProducts(name as string) : this.productList.slice();
            }),
          );
        }
      },
      (error: any) => {
        this.loader.stop();
        this.toastr.info(error, "Exception");
      }
    );
  }

  onProductSearch() {
    const body = {
      ...this.commonPrams(),
      Type: "PRODUCT",
      Item: this.productForm.controls['productGroup'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.nameCount === 1) {
          this.productForm.controls['productGroup'].patchValue(res.data.selName);
          this.productForm.controls['code'].patchValue(res.data.selCode);
          this.productChange(res.data.selCode, this.productForm.get('mode')?.value);
        }
        else {
          const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
            width: '90%',
            disableClose: true,
            data: {
              'tranNum': this.productForm.controls['productGroup'].value, 'TranType': "PRODUCT",
              'search': 'Product Search'
            }
          });
          dialogRef.afterClosed().subscribe(result => {
            this.productForm.controls['productGroup'].patchValue(result.prodName);
            this.productForm.controls['code'].patchValue(result.prodCode);
            this.productChange(result.prodCode, this.productForm.get('mode')?.value);
          });
        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }

  productChange(code: string, mode: string) {
    const body = {
      ...this.commonPrams(),
      Item: code
    }
    try {
      this.loader.start();
      this.subSink.sink = this.invService.GetProductDetails(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.productForm.patchValue({
            reOrderQuantity: res.data.reOrdQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            code: res.data.prodCode,
            purchaseRate: res.data.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            vatType: res.data.vatType,
            product: res.data.prodName,
            saleRateStd: res.data.stdSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            tranDate: res.data.effDate, // Set to null or any other value from the result object
            uom: res.data.uom,
            saleRateMin: res.data.minSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            status: res.data.prodStatus,
            itemCount: res.data.reOrdQty, // Set to null or any other value from the result object
            type: res.data.prodType, // Set to null or any other value from the result object
            saleRateMax: res.data.maxSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            notes: res.data.remarks,
            wareHouse: res.data.defWHNo.trim(),
            unitWeight: res.data.unitWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isPerishable: res.data.isPerishable,
            displayName: res.data.displayName,
            hsCode: res.data.hsCode,
            productGroups: res.data.groupName
          });
          if (mode != 'View') {
            this.retMessage = this.newTranMsg;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }

        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      productGroup: [''],
      reOrderQuantity: [0, Validators.required],
      code: ['', [Validators.required, Validators.maxLength(10), this.alphanumericValidator()]],
      purchaseRate: ['0', Validators.required],
      vatType: ['', Validators.required],
      product: ['', Validators.required],
      saleRateStd: ['', Validators.required],
      tranDate: [new Date(), Validators.required],
      uom: ['', Validators.required],
      saleRateMin: ["0", Validators.required],
      status: ['Open'],
      itemCount: ['0'],
      type: ['', Validators.required],
      saleRateMax: ["0", Validators.required],
      notes: [''],
      wareHouse: ['', Validators.required],
      unitWeight: ['0', Validators.required],
      isPerishable: [false],
      displayName: [''],
      hsCode: [''],
      productGroups: ['', Validators.required]
    })
  }

  private formatValue(value: string): string {
    let onlyNumsAndDot = value.replace(/[^\d.,]/g, '');
    let parts = onlyNumsAndDot.replace(/,/g, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts[1]) parts[1] = parts[1].slice(0, 2); // Limit to two decimal places

    return parts.join('.');
  }

  alphanumericValidator() {
    return (control: any) => {
      const value = control.value;
      const uppercaseValue = value.toUpperCase();

      if (value !== uppercaseValue) {
        control.setValue(uppercaseValue, { emitEvent: false });
      }
      const valid = /^[A-Z0-9]+$/.test(uppercaseValue);

      return valid ? null : { invalidAlphanumeric: true };
    };
  }

  prepareProductCls() {
    this.productCls.mode = this.productForm.get('mode')!.value;
    this.productCls.groupName = this.productForm.get('productGroup')!.value;
    const reorder = this.productForm.get('reOrderQuantity')!.value;
    if (typeof reorder === 'string') {
      this.productCls.reOrdQty = reorder.replace(/,/g, '');
    }
    // this.productCls.reOrdQty = reorder.replace(/,/g, '');
    this.productCls.prodCode = this.productForm.get('code')!.value;
    this.productCls.stdPurRate = this.productForm.get('purchaseRate')!.value.replace(/,/g, '');
    this.productCls.vatType = this.productForm.get('vatType')!.value;
    this.productCls.prodName = this.productForm.get('product')!.value;
    this.productCls.stdSalesRate = this.productForm.get('saleRateStd')!.value.replace(/,/g, '');
    this.productCls.effDate = this.productForm.get('tranDate')!.value;
    this.productCls.uom = this.productForm.get('uom')!.value;
    this.productCls.minSalesRate = this.productForm.get('saleRateMin')!.value.replace(/,/g, '');
    this.productCls.prodStatus = this.productForm.get('status')!.value;
    this.productCls.prodType = this.productForm.get('type')!.value;
    this.productCls.maxSalesRate = this.productForm.get('saleRateMax')!.value.replace(/,/g, '');
    this.productCls.remarks = this.productForm.get('notes')!.value;
    this.productCls.defWHNo = this.productForm.get('wareHouse')!.value;
    this.productCls.unitWeight = this.productForm.get('unitWeight')!.value;
    this.productCls.isPerishable = this.productForm.get('isPerishable')!.value;
    this.productCls.displayName = this.productForm.get('displayName')!.value;
    this.productCls.hsCode = this.productForm.get('hsCode')!.value;
    this.productCls.groupName = this.productForm.get('productGroups')!.value;
    this.productCls.user = this.userDataService.userData.userID;
    this.productCls.refNo = this.userDataService.userData.sessionID;
    this.productCls.company = this.userDataService.userData.company;
    this.productCls.location = this.userDataService.userData.location;
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.prepareProductCls();
      this.loader.start();
      try {
        this.subSink.sink = this.invService.saveUpdateProducts(this.productCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            if (this.productForm.controls['mode'].value == "Add") {
              this.modeChanged("Modify");
            }
            this.newTranMsg = res.message;
            this.textMessageClass = "green";
            this.productChange(res.tranNoNew, this.productForm.get('mode')?.value)
          } else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.toastr.info(ex, "Exception")
      }
    }
  }

  reset() {
    this.productForm = this.formInit();
    this.sprFrm.resetForm();
  }

  Print() {

  }

  clear() {
    this.productForm = this.formInit();
    this.clearMsgs();
  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM303",
        // Page: "Products",
        // SlNo: 63,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }

  modeChanged(event: string) {
    if (event === "Add") {
      this.productForm = this.formInit();
      this.productForm.controls['mode'].setValue(event, { emitEvent: false });
      this.productForm.controls['productGroup'].disable();
    }
    else {
      this.productForm.controls['mode'].setValue(event, { emitEvent: false });
      this.productForm.controls['productGroup'].enable();
    }
  }
  supplierProducts() {
    const dialogRef: MatDialogRef<SupplierProductsComponent> = this.dialog.open(SupplierProductsComponent, {
      width: '80%',
      disableClose: true,
      data: {
        mode: this.productForm.controls['mode'].value,
        product: this.productForm.controls['product'].value,
        code: this.productForm.controls['code'].value
      }
    });
  }
  AliasProductList() {
    const dialogRef: MatDialogRef<ProductDetailsComponent> = this.dialog.open(ProductDetailsComponent, {
      width: '80%',
      disableClose: true,
      data: {
        mode: this.productForm.controls['mode'].value,
        product: this.productForm.controls['product'].value,
        code: this.productForm.controls['code'].value
      }
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.productForm.controls['mode'].value,
        'note': this.productForm.controls['notes'].value,
        'TranType': "PRODUCT",
      }  // Pass any data you want to send to CustomerDetailsComponent

    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "PRODUCT",
        'tranNo': tranNo,
        'search': 'Product log Details'
      }
    });
  }


}
