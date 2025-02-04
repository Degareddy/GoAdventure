import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchProductComponent } from 'src/app/general/search-product/search-product.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { physicalStockDetailsClass } from '../../inventory.class';
import * as XLSX from 'xlsx';
import { Type } from 'src/app/utils/enums';
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
  // rowData: any = [];
  slNum: number = 0;
  physicalStcokCls: physicalStockDetailsClass;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  rowData: any[] = [];
  acceptedFileTypes = ['.csv', '.xlsx'];

  columnDefs: any[] = [];
  constructor(private fb: FormBuilder, protected router: Router, protected utlService: UtilitiesService,
    private userDataService: UserDataService, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: { tranNo: string, mode: string }) {
    this.phyDetForm = this.formInit();
    this.physicalStcokCls = new physicalStockDetailsClass();

  }
  onRowClick(row: any) {
    // this.phyDetForm.patchValue({
    //   prodCode: row.product,
    //   uom: row.uom,
    //   quantity: row.quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    //   warehouse: row.whCode
    // });
    // this.slNum = row.slNo;
    // this.prodCode = row.prodCode;
    // this.stkTrfDtCls.product = row.prodCode;
  }
  onSubmit() {
    if (this.phyDetForm.invalid) {
      return;
    }
    else {
      const formValues = this.phyDetForm.value;
      this.physicalStcokCls.company = this.userDataService.userData.company;
      this.physicalStcokCls.location = this.userDataService.userData.location;
      this.physicalStcokCls.langID = this.userDataService.userData.langId;
      this.physicalStcokCls.user = this.userDataService.userData.userID;
      this.physicalStcokCls.refNo = this.userDataService.userData.sessionID;

      this.physicalStcokCls.product = formValues.item;
      this.physicalStcokCls.uom = formValues.uom;
      this.physicalStcokCls.quantity = formValues.quantity;

      this.physicalStcokCls.warehouse = "WR003";
      this.physicalStcokCls.mode = this.data.mode;
      this.physicalStcokCls.tranNo = this.data.tranNo;

      this.physicalStcokCls.remarks = "";

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
    })
  }
  ngOnInit(): void {

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
