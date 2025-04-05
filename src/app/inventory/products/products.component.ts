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
import { displayMsg, Items, Mode, ScreenId, TextClr, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
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
  prodList:string[]=[]
  productControl = new FormControl();
  filteredProductList!: Observable<params[]>;
  vatTypes: Item[] = [];
  UOMList: Item[] = [];
  groupList: Item[] = [];
  wareHouseList: Item[] = [];
  retMessage!: string;
  textMessageClass!: string;
  prodStatus!: string;
  filteredProdList: string[] = [];
  @Input() max: any;
  tomorrow = new Date();
  private dialogOpen: boolean = false;
  @ViewChild('frmClear') public sprFrm!: NgForm;
  constructor(private fb: FormBuilder, protected router: Router, private utlService: UtilitiesService,
    private invService: InventoryService, public dialog: MatDialog, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private toastr: ToastrService) {
    this.productForm = this.formInit();
    this.productCls = new Product();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadProducts()
    this.productForm.get('productGroup')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value || ''))
      )
      .subscribe(filtered => {
        this.filteredProdList = filtered;
      });
  
  }
  
  onProductInput(){

  }
  onProductSelected(){
    this.onProductSearch()
  }
  filterProducts(value: any) {
    const filterValue = value.toLowerCase();
    return this.productList.filter((product: params) => product.itemName.toLowerCase().includes(filterValue));
  }
  

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.prodList.filter(option => option.toLowerCase().includes(filterValue));
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
          item: Items.WAREHOUSE,
          mode: this.productForm.get('mode')?.value,
        }
        this.subSink.sink = this.invService.GetMasterItemsList(wrbody).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
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
    const service1 = this.invService.getModesList({ ...this.commonPrams(), item: ScreenId.PRODUCTS_SCRID });
    const service2 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: Items.PRODUCTS, mode: this.productForm.get('mode')?.value, });
    const service3 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: Items.VAT, mode: this.productForm.get('mode')?.value, });
    const service4 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: Items.UOM, mode: this.productForm.get('mode')?.value, });
    const service5 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: Items.WAREHOUSE, mode: this.productForm.get('mode')?.value, });
    const service6 = this.invService.GetMasterItemsList({ ...this.commonPrams(), item: Items.PRODUCTGROUP, mode: this.productForm.get('mode')?.value, });
    this.subSink.sink = forkJoin([service1, service2, service3, service4, service5, service6]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        const res4 = results[3];
        const res5 = results[4];
        const res6 = results[5];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res1.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
          return;
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.productList = res2.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Product list empty!", TextClr.red);
          return;
        }

        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.vatTypes = res3.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Vat list empty!", TextClr.red);
          return;
        }

        if (res4.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.UOMList = res4.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "UOM list empty!", TextClr.red);
          return;
        }

        if (res5.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.wareHouseList = res5.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Warehouse list empty!", TextClr.red);
          return;
        }

        if (res6.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.groupList = res6.data

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Group list empty!", TextClr.red);
          return;
        }
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
        this.displayMessage(displayMsg.EXCEPTION + error.message, TextClr.red);
      }
    );
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onProductSearch() {
    const body = {
      ...this.commonPrams(),
      Type: TranType.PRODUCT,
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
          this.openSearch();
        }
      }
      else {
        this.openSearch();
      }
    });
  }
  loadProducts(){
    const body={
          "Company"     : this.userDataService.userData.company,
          "Location"    : this.userDataService.userData.location,
          "GroupCode"   : "ANY",
          "ProdName"    : '',
          "ProdStatus"  : "ANY",
          "ProdType"    : "ANY",
          "UOM"         : "",
          "RefNo"       : this.userDataService.userData.sessionID,
          "User"        : this.userDataService.userData.userID,
    }
    try {
      this.subSink.sink =  this.utlService.GetProductSearchList(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          // this.rowData = [];
          
        }
        else {
          this.prodList = res.data.map((item: any) => item.prodName);
          console.log(this.prodList)
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

          
  }
  openSearch() {
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNum: this.productForm.controls['productGroup'].value, TranType: TranType.PRODUCT,
          search: 'Product Search'
        }

      });
      this.dialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        this.dialogOpen = false;
        if (result != true && result != undefined) {
          this.productForm.controls['productGroup'].patchValue(result.prodName);
          this.productForm.controls['code'].patchValue(result.prodCode);
          this.productChange(result.prodCode, this.productForm.get('mode')?.value);
        }
      });
    }
  }

  productChange(code: string, mode: string) {
    const body = {
      ...this.commonPrams(),
      Item: code
    }
    try {
      this.subSink.sink = this.invService.GetProductDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.productForm.patchValue({
            reOrderQuantity: res.data.reOrdQty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            code: res.data.prodCode,
            purchaseRate: res.data.stdPurRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            vatType: res.data.vatType,
            product: res.data.prodName,
            saleRateStd: res.data.stdSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            tranDate: res.data.effDate,
            uom: res.data.uom,
            saleRateMin: res.data.minSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            status: res.data.prodStatus,
            itemCount: res.data.reOrdQty,
            type: res.data.prodType,
            saleRateMax: res.data.maxSalesRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            notes: res.data.remarks,
            wareHouse: res.data.defWHNo.trim(),
            unitWeight: res.data.unitWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isPerishable: res.data.isPerishable,
            displayName: res.data.displayName,
            hsCode: res.data.hsCode,
            productGroups: res.data.groupName
          }, { emitEvent: false });
          if (mode.toUpperCase() != Mode.view) {
            this.displayMessage(displayMsg.SUCCESS + this.newTranMsg, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
    this.displayMessage("", "");
    if (this.productForm.valid) {
      this.prepareProductCls();
      this.loader.start();
      try {
        this.subSink.sink = this.invService.saveUpdateProducts(this.productCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            if (this.productForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.modeChanged("Modify");
            }
            this.newTranMsg = res.message;
            this.productChange(res.tranNoNew, this.productForm.get('mode')?.value)
          } else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      } catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
    this.displayMessage("", "");
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.PRODUCTS_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }

  modeChanged(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.productForm = this.formInit();
      this.productForm.controls['mode'].setValue(event, { emitEvent: false });
      this.productForm.controls['productGroup'].disable();
      this.loadData();
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
        tranNo: tranNo,
        mode: this.productForm.controls['mode'].value,
        note: this.productForm.controls['notes'].value,
        TranType: TranType.PRODUCT,
      }

    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: TranType.PRODUCT,
        tranNo: tranNo,
        search: 'Product log Details'
      }
    });
  }


}
