import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { OpeningBalDetailCls } from '../../purchase.class';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import * as XLSX from 'xlsx';
import { concatMap, from } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { SalesService } from 'src/app/Services/sales.service';

@Component({
  selector: 'app-opening-detail',
  templateUrl: './opening-detail.component.html',
  styleUrls: ['./opening-detail.component.css']
})
export class OpeningDetailComponent implements OnInit, OnDestroy {
  private subSink: SubSink = new SubSink();
  dataFlag: boolean = false;
  excelData!: any[];
  openinBalDetForm!: FormGroup;
  dialogOpen: boolean = false;
  slNum: number = 0;
  rowData: any = [];
  retMessage: string = "";
  textMessageClass: string = "";
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  partyCode: string = "";
  private openingDetCls: OpeningBalDetailCls;
  columnDefs: any = [
    { field: "slNo", headerName: "S.No", width: 70 },
    { field: "tranNo", headerName: "Tran No", resizable: true, flex: 1 },
    { field: "partyName", headerName: "Party Name", sortable: true, filter: true, resizable: true, width: 180, },
    { field: "party", headerName: "Party", sortable: true, filter: true, resizable: true, width: 180, hide: true },
    {
      field: "balAmount", headerName: "Balance Amount", resizable: true, flex: 1, type: 'rightAligned',
      cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      },
    },
  ];
  currency: Item[] = [];
  constructor(private fb: FormBuilder, protected purchorddetervice: PurchaseService, private saleService: SalesService,
    public dialog: MatDialog, private userDataService: UserDataService, private utlService: UtilitiesService,
    private loader: NgxUiLoaderService, protected purchaseService: PurchaseService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string, balType: string }) {
    this.openinBalDetForm = this.formInit();
    this.openingDetCls = new OpeningBalDetailCls();
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
  loadData() {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.data.tranNo
    }
    const currency = {
      ...this.commonParams(),
      item: 'CURRENCY',
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    }
    try {
      this.subSink.sink = this.purchorddetervice.GetPartyOpeningBalanceDetails(body).subscribe((res: any) => {
        this.rowData = [];
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res.data;
          // if (this.rowData) {
          //   this.columnDefs = this.generateColumns(this.rowData);
          // }
        }
        else {
          this.displayMessage(res.message, "red");
        }
      })
      this.subSink.sink = this.saleService.GetMasterItemsList(currency).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.currency = res.data;
        }
        else {
          this.displayMessage(res.message, "red");
        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    //console.log(event.data);
    this.onRowClick(event.data);
  }
  generateColumns(data: any[]) {
    let columnDefinitions: any = [];
    const excludedKeys = ['company', 'location', 'mode', 'refNo', 'user', 'langID'];
    const excludedKeysSet = new Set(excludedKeys);

    data.forEach(object => {
      Object.keys(object).forEach(key => {
        // Only create column definitions for keys not in the excluded list
        if (!excludedKeysSet.has(key)) {
          let mappedColumn = {
            headerName: key.toUpperCase(),
            field: key
          };

          columnDefinitions.push(mappedColumn);
        }
      });
    });
    columnDefinitions = columnDefinitions.filter((column: any, index: number, self: any) =>
      index === self.findIndex((colAtIndex: any) => (
        colAtIndex.field === column.field
      ))
    )
    return columnDefinitions;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      this.excelData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      // console.log('Excel data:', this.excelData);
      this.rowData = this.excelData;
      // if(rhis)
      if (this.rowData) {
        this.columnDefs = this.generateColumns(this.rowData);
      }
    };
    reader.readAsBinaryString(file);
  }
  onRowClick(row: any) {
    this.openinBalDetForm.patchValue({
      partyName: row.partyName,
      balAmount: row.balAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      currency: row.currency
    });
    this.partyCode = row.party;
    this.slNum = row.slNo;
    this.openingDetCls.party = row.party;
    this.data.balType = row.balType;

  }
  // onSubmit() {
  //   if (this.openinBalDetForm.invalid) {
  //     this.openinBalDetForm.markAllAsTouched();
  //     this.displayMessage("Enter all required fields", 'red');
  //     return;
  //   }
  //   if (this.openingDetCls.party == "" || this.openingDetCls.party == undefined) {
  //     this.displayMessage("Select valid party name", 'red');
  //     return;
  //   }
  //   else {
  //     this.prepareCls();

  //     try {
  //       this.loader.start();
  //       this.subSink.sink = this.purchaseService.UpdatePartyOpeningBalanceDetails(this.openingDetCls).subscribe((res: SaveApiResponse) => {
  //         this.loader.stop();
  //         if (res.status.toUpperCase() === "SUCCESS") {
  //           this.displayMessage(res.message, "green");
  //           this.loadData();
  //         }
  //         else {
  //           this.displayMessage(res.message, "red");
  //         }
  //       })
  //     }
  //     catch (ex: any) {
  //       this.displayMessage("Exception: " + ex.message, "red");
  //     }
  //   }

  // }
  prepareCls(row: any) {
    this.openingDetCls.company = this.userDataService.userData.company;
    this.openingDetCls.location = this.userDataService.userData.location;
    this.openingDetCls.user = this.userDataService.userData.userID;
    this.openingDetCls.refNo = this.userDataService.userData.sessionID;
    this.openingDetCls.tranNo = this.data.tranNo;
    this.openingDetCls.slNo = row.SlNo; // Assuming slNo comes from the row data
    this.openingDetCls.partyName = row.PartyName || this.openinBalDetForm.controls['partyName'].value;
    this.openingDetCls.partyType = row.Partytype;
    this.openingDetCls.party = row.Party;
    this.openingDetCls.mode = this.data.mode;
    this.openingDetCls.currency = this.openinBalDetForm.controls['currency'].value;
    this.openingDetCls.balAmount = parseFloat(row.balAmount);
    this.openingDetCls.langId = this.userDataService.userData.langId;
    return this.openingDetCls
  }
  prepareOneCls() {
    this.openingDetCls.company = this.userDataService.userData.company;
    this.openingDetCls.location = this.userDataService.userData.location;
    this.openingDetCls.user = this.userDataService.userData.userID;
    this.openingDetCls.refNo = this.userDataService.userData.sessionID;
    this.openingDetCls.tranNo = this.data.tranNo;
    this.openingDetCls.slNo = this.slNum;
    this.openingDetCls.partyName = this.openinBalDetForm.controls['partyName'].value;
    this.openingDetCls.party = this.partyCode;
    this.openingDetCls.mode = this.data.mode;
    const balAmountValue = this.openinBalDetForm.get('balAmount')?.value;
    // Check if the value contains commas
    if (balAmountValue && typeof balAmountValue === 'string') {
      // Remove commas from the string and then parse it as a float
      this.openingDetCls.balAmount = parseFloat(balAmountValue.replace(/,/g, ''));
    } else {
      // If no commas, parse it directly as a float
      this.openingDetCls.balAmount = parseFloat(balAmountValue);
    }

    // this.openingDetCls.balAmount = parseFloat(this.openinBalDetForm.get('balAmount')?.value);
    this.openingDetCls.langId = this.userDataService.userData.langId;
    this.openingDetCls.currency = this.openinBalDetForm.controls['currency'].value;;
    return this.openingDetCls
  }
  onSubmit() {
    this.displayMessage("", "");
    if (this.openinBalDetForm.invalid) {
      this.openinBalDetForm.markAllAsTouched();
      this.displayMessage("Enter all required fields", 'red');
      return;
    }
    else {
      this.loader.start();
      const data = this.prepareOneCls();
      try {
        this.subSink.sink = this.purchaseService.UpdatePartyOpeningBalanceDetails(data).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage(res.message, "green");
            this.loadData();
          }
          else {
            this.displayMessage(res.message, "red");
            this.loader.stop();
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(ex.message, "red");
        this.loader.stop();
      }

    }

  }
  onfileSubmit() {
    // Validate form inputs
    if (this.openinBalDetForm.invalid) {
      this.openinBalDetForm.markAllAsTouched();
      this.displayMessage("Enter all required fields", 'red');
      return;
    }
    try {
      this.loader.start();

      const requests = this.rowData.map((row: any) => {
        const rowDataCls = this.prepareCls(row);
        return this.purchaseService.UpdatePartyOpeningBalanceDetails(rowDataCls);
      });

      this.loader.start();
      this.subSink.sink = from(this.rowData).pipe(
        concatMap((row: any) => {
          this.prepareCls(row);
          return this.purchaseService.UpdatePartyOpeningBalanceDetails(this.openingDetCls);
        })
      ).subscribe({
        next: (res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() !== 'SUCCESS') {
            this.displayMessage(res.message, 'red');
          }
        },
        complete: () => {
          this.loader.stop();
          this.displayMessage('All records updated successfully!', 'green');
          this.loadData();
        },
        error: (error: any) => {
          this.loader.stop();
          this.displayMessage('Error during updates: ' + error.message, 'red');
        }
      });
    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage("Exception: " + ex.message, 'red');
    }
  }
  newItem() {
    this.openinBalDetForm = this.formInit();
    this.slNum = 0;
    this.displayMessage("", "");
    // this.monitorFields();
    this.openingDetCls.party = "";
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  ngOnInit(): void {
    this.loadData();
    // this.monitorFields();
  }

  formInit() {
    return this.fb.group({
      // partyType: ['', Validators.required],
      partyName: ['', Validators.required],
      balAmount: ['0.00', Validators.required],
      currency: ['', Validators.required]
      // CrAmount: ['0.00', Validators.required],
    })

  }
  searchParty() {
    const body = {
      ...this.commonParams(),
      Type: "ALL",
      item: this.openinBalDetForm.controls['partyName'].value || "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
          if (res && res.data && res.data.nameCount === 1) {
            this.openinBalDetForm.controls['partyName'].patchValue(res.data.selName);
            this.partyCode = res.data.selCode;
            this.openingDetCls.party = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.openinBalDetForm.controls['partyName'].value,
                  'PartyType': "ALL",
                  'search': "Client " + ' Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.openinBalDetForm.controls['partyName'].patchValue(result.partyName);
                  this.partyCode = result.code;
                  this.openingDetCls.party = result.code;
                }

                this.dialogOpen = false;
              });
            }

          }
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
  // monitorFields(): void {
  //   this.openinBalDetForm.get('DrAmount')?.valueChanges.subscribe((drAmountValue: string) => {
  //     if (drAmountValue) {
  //       this.openinBalDetForm.get('CrAmount')?.disable({ emitEvent: false });
  //     } else {
  //       this.openinBalDetForm.get('CrAmount')?.enable({ emitEvent: false });
  //     }
  //   });

  //   this.openinBalDetForm.get('CrAmount')?.valueChanges.subscribe((crAmountValue: string) => {
  //     if (crAmountValue) {
  //       this.openinBalDetForm.get('DrAmount')?.disable({ emitEvent: false });
  //     } else {
  //       this.openinBalDetForm.get('DrAmount')?.enable({ emitEvent: false });
  //     }
  //   });
  // }
}
