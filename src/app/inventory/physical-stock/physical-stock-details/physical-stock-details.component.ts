import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { physicalStockDetailsClass } from '../../inventory.class';
import * as XLSX from 'xlsx';
import { Type } from 'src/app/utils/enums';
import { InventoryService } from 'src/app/Services/inventory.service';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-physical-stock-details',
  templateUrl: './physical-stock-details.component.html',
  styleUrls: ['./physical-stock-details.component.css']
})
export class PhysicalStockDetailsComponent implements OnInit, OnDestroy {
  phyDetForm!: any;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  modes: Item[] = [];
  private subSink: SubSink = new SubSink();
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  dataFlag: boolean = false;
  public exportTmp: boolean = true;
  public excelName: string = "";
  SlNo:number=0
  // rowData: any = [];
  selProd:string=''
  slNum: number = 0;
  physicalStcokCls: physicalStockDetailsClass;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  rowData: any[] = [];
  acceptedFileTypes = ['.csv', '.xlsx'];
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
    { field: "slNo", headerName: "Sl No", sortable: true, filter: true, resizable: true, width: 90, hide: true },
    { field: "product", headerName: "Prod Code", sortable: true, filter: true, resizable: true, width: 190 },
    { field: "productName", headerName: "Product Name", sortable: true, filter: true, resizable: true, width: 190 },
    { field: "uom", headerName: "UOM", sortable: true, filter: true, resizable: true, width: 190, hide: true },
    { field: "quantity", headerName: "Quantity", sortable: true, filter: true, resizable: true, width: 190 },
    { field: "physicalStock", headerName: "Physical Stock", sortable: true, filter: true, resizable: true, width: 190 },]
  constructor(private fb: FormBuilder, protected router: Router, protected utlService: UtilitiesService,
    private userDataService: UserDataService, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: { tranNo: string, mode: string },private invService:InventoryService) {
    this.phyDetForm = this.formInit();
    this.physicalStcokCls = new physicalStockDetailsClass();

  }
  onRowClick(row: any) {
    console.log(row)
    this.phyDetForm.patchValue({
      prodCode: row.product,
      uom: row.uom,
      quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      warehouse: row.whCode,
      stock:row.physicalStock
    });
    this.slNum = row.slNo;
    this.selProd = row.prodCode;
    // this.stkTrfDtCls.product = row.prodCode;
  }
  onSubmit() {
    if (this.phyDetForm.invalid) {
      return;
    }
    else {
      const body = {
              ...this.commonParams(),
              tranNo: this.data.tranNo,
              Product:this.selProd,
              mode: this.data.mode,
              UOM: this.phyDetForm.get('uom')?.value,
              PhysicalStock:this.phyDetForm.get('stock')?.value,
              Quantity:this.phyDetForm.get('quantity')?.value,
              langId: this.userDataService.userData.langId,
             
              SlNo:this.SlNo
            }
            this.subSink.sink = this.invService.UpdatePhysicalStockDetails(body).subscribe((res: SaveApiResponse) => {
              if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
                this.retMessage =  res.message;
                this.textMessageClass = "green";
              }
              else {
                this.retMessage =  res.message;
                this.textMessageClass = "red";
              }
            });

    }
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    const extension = file.name.split('.').pop().toLowerCase();

    if (!this.acceptedFileTypes.includes(`.${extension}`)) {
      alert('Only CSV and Excel files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      if (extension === 'xlsx') {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        this.rowData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (this.rowData.length > 0) {
          this.columnDefs = Object.keys(this.rowData[1]).map(key => ({ headerName: key, field: key }));
        }
      } else if (extension === 'csv') {
        const text = new TextDecoder().decode(data);
        const rows = text.split('\n');
        if (rows.length > 0) {
          const headers = rows[0].split(',').map(header => header.trim());
          this.columnDefs = headers.map(header => ({ headerName: header, field: header }));
          this.rowData = rows.slice(1).map(row => {
            const columns = row.split(',');
            const rowData: { [key: string]: any } = {};
            headers.forEach((header, index) => {
              rowData[header] = columns[index].trim();
            });
            return rowData;
          });
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }
  loadData(){
    const body = {
      ...this.commonParams(),
      tranNo: this.data.tranNo,
      Product:this.selProd,
      mode: this.data.mode,
      UOM: this.phyDetForm.get('uom')?.value,
      PhysicalStock:this.phyDetForm.get('stock')?.value,
      Quantity:this.phyDetForm.get('quantity')?.value,
      langId: this.userDataService.userData.langId,
     
      SlNo:this.SlNo
    }
    this.subSink.sink = this.invService.GetPhysicalStockDetails(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.retMessage =  res.message;
        this.textMessageClass = "green";
        this.rowData=res.data
      }
      else {
        this.retMessage =  res.message;
        this.textMessageClass = "red";
      }
    });
  }
  // onFileChange(event: any) {
  //   const file = event.target.files[0];
  //   const extension = file.name.split('.').pop().toLowerCase();

  //   if (!this.acceptedFileTypes.includes(`.${extension}`)) {
  //     alert('Only CSV and Excel files are allowed.');
  //     return;
  //   }

  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     const data = new Uint8Array(e.target.result);
  //     if (extension === 'xlsx') {
  //       const workbook = XLSX.read(data, { type: 'array' });
  //       const firstSheetName = workbook.SheetNames[0];
  //       const worksheet = workbook.Sheets[firstSheetName];
  //       this.rowData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  //       console.log(this.rowData);
  //     } else if (extension === 'csv') {
  //       const text = new TextDecoder().decode(data);
  //       const rows = text.split('\n');
  //       this.rowData = rows.map(row => row.split(','));
  //     }
  //   };
  //   reader.readAsArrayBuffer(file);
  // }
  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  clear() {
    this.rowData = [];
    this.columnDefs=[];
  }
  searchProduct() {
    const body = {
      ...this.commonParams(),
      Type: Type.PRODUCT,
      Item: this.phyDetForm.controls['item'].value

    }
    this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
      if (res && res.data && res.data.nameCount === 1) {
        this.phyDetForm.controls['item'].patchValue(res.data.selName);
        this.physicalStcokCls.tranNo = res.data.selCode;
        this.selProd=res.data.selCode
      }
      else {
        const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
          width: '90%',
          disableClose: true,
          data: {
            tranNum: this.phyDetForm.controls['item'].value, TranType:  Type.PRODUCT,
            search: 'Product Search'
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result != true && result != undefined) {
            this.phyDetForm.controls['item'].patchValue(result.prodName);
            this.phyDetForm.controls['uom'].patchValue(result.uom);
            this.physicalStcokCls.tranNo = result.prodCode;
          }
        });
      }
    });
  }
  newStock() {
    this.reset();
  }
  formInit() {
    return this.fb.group({
      item: ['', [Validators.required, Validators.maxLength(50)]],
      uom: [{ value: '', disabled: true }],
      quantity: ['1', Validators.required],
      stock:['0']
    })
  }
  ngOnInit(): void {
    this.loadData()
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  reset() {
    this.phyDetForm = this.formInit();
    this.clearMsg();
    this.slNum = 0;

  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
}
