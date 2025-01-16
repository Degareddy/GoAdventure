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
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import * as XLSX from 'xlsx';
import { concatMap, forkJoin, from } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { SalesService } from 'src/app/Services/sales.service';
import { MastersService } from 'src/app/Services/masters.service';
// import { MasterParams } from 'src/app/modals/masters.modal';
import { ProjectsService } from 'src/app/Services/projects.service';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { flatApiResponse } from 'src/app/project/flats/flats.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MultiLandLordComponent } from './multi-land-lord/multi-land-lord.component';
// import { MasterParams } from 'src/app/sales/sales.class';

@Component({
  selector: 'app-opening-detail',
  templateUrl: './opening-detail.component.html',
  styleUrls: ['./opening-detail.component.css']
})
export class OpeningDetailComponent implements OnInit, OnDestroy {
  private subSink: SubSink = new SubSink();
  dataFlag: boolean = false;
  excelData!: any[];
  public flatCode!: string;
  openinBalDetForm!: FormGroup;
  dialogOpen: boolean = false;
  slNum: number = 0;
  rowData: any = [];
  tenantName!:string;
  tenantCode!:string;
  landlordName!:string;
  landlodCode!:string;
  landlordCount:number=0;
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
    // { field: "tranNo", headerName: "Tran No", resizable: true, flex: 1 },
    { field: "partyName", headerName: "Party Name", sortable: true, filter: true, resizable: true, width: 180, },
    { field: "propertyName", headerName: "Property", sortable: true, filter: true, resizable: true, width: 180, },
    { field: "unitName", headerName: "Unit", sortable: true, filter: true, resizable: true, width: 180, },
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
  blocks: Item[] = [];

  props: Item[] = [];
  masterParams!: MasterParams;


  clientTypeList: Item[] = [
    { itemCode: 'TENANT', itemName: 'Tenant' },
    // { itemCode: 'STAFF', itemName: 'Staff' },
    { itemCode: 'LANDLORD', itemName: 'Landlord' },
    // { itemCode: 'VENDOR', itemName: 'Vendor' },
    // { itemCode: 'CUSTOMER', itemName: 'Customer' },
    // { itemCode: 'SUPPLIER', itemName: 'Supplier' },
    // { itemCode: 'EMPLOYEE', itemName: 'Employee' },

  ];
  currency: Item[] = [];
  constructor(private fb: FormBuilder, protected purchorddetervice: PurchaseService, private projService: ProjectsService, private saleService: SalesService,private masterService: MastersService,
    public dialog: MatDialog, private userDataService: UserDataService, private utlService: UtilitiesService,
    private loader: NgxUiLoaderService, protected purchaseService: PurchaseService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, tranNo: string, status: string, balType: string }) {
    this.openinBalDetForm = this.formInit();
    this.masterParams = new MasterParams();
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
    this.getProperty();
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
  onClientTypeChnaged(){
    if(this.landlordCount >1 && this.openinBalDetForm.get('clientType')?.value === 'LANDLORD' ){
     this.displayMessage("Please select a landlord, as there is more than one landlord.",'green')
    }
    this.openinBalDetForm.get('partyName')?.patchValue('');
    this.openinBalDetForm.get('partyName')?.enable();
    if(this.openinBalDetForm.get('clientType')?.value === 'TENANT'){
      this.displayMessage("",'');
      this.partyCode=this.tenantCode;
      this.openinBalDetForm.get('partyName')?.patchValue(this.tenantName);
      this.openinBalDetForm.get('partyName')?.disable();
    }
    else if(this.openinBalDetForm.get('clientType')?.value === 'LANDLORD'){
      if(this.landlordCount === 1){
        this.displayMessage("",'');
        this.partyCode=this.landlodCode;
      this.openinBalDetForm.get('partyName')?.patchValue(this.landlordName);
      this.openinBalDetForm.get('partyName')?.disable();
      }
      }
  }
  getProperty(){
    const propertyBody ={...this.createRequestData('PROPERTY'),mode:this.data.mode};
      try {

        const property$ = this.masterService.GetMasterItemsList(propertyBody);

        this.subSink.sink = forkJoin([property$]).subscribe(
          ([ propertyRes]: any) => {

            if (propertyRes.status.toUpperCase() === "SUCCESS") {
              this.props = propertyRes.data;
              if (this.props.length === 1) {
                this.openinBalDetForm.controls['property'].patchValue(this.props[0].itemCode);
                this.onSelectedPropertyChanged();
              }
            }
            else {
              this.retMessage = "Properties list empty!";
              this.textMessageClass = "red";
            }
          },
          error => {
            this.displayMessage("Exception: " + error.message, "red");
          }
        );
      } catch (ex: any) {
        this.displayMessage("Exception: " + ex, "red");
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
    console.log(event.data);
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
  private createRequestData(item: string): getPayload {
      return {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID,
        item: item
      };
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
      currency: row.currency,
      property: row.propCode,
      block: row.blockCode,
      flat:row.unitName
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
  onSelectedPropertyChanged(): void {
      this.blocks = [];
      if (this.openinBalDetForm.controls.property.value != "") {
        this.masterParams.type = 'BLOCK';
        this.masterParams.item = this.openinBalDetForm.controls.property.value;
        try {
          this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: getResponse) => {
            if (result.status.toUpperCase() === 'SUCCESS') {
              this.blocks = result.data;
              if (this.blocks.length === 1) {
                this.openinBalDetForm.controls['block'].patchValue(this.blocks[0].itemCode);
              }
            } else {
              this.displayMessage(result.message,'red');
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(ex,'red');
        }

      }

    }
    async onSelectedFlatChanged(unitId: string, mode: string) {


        this.masterParams.type = 'UNIT';
        this.masterParams.item = unitId;
        this.subSink.sink = this.projService.getFlatDetails(this.masterParams).subscribe((result: flatApiResponse) => {

          if (result.status.toUpperCase() === 'SUCCESS') {
            // this.populateFlatData(result);
            // this.msgHandling(result, mode);
            // this.newTranMsg = "";
            this.tenantCode=result.data.currentTenant;
            this.tenantName=result.data.tenantName;
            this.landlordCount=result.data.llCount;
            if(result.data.llCount == 1){
              this.landlodCode=result.data.landLord;
            this.landlordName=result.data.landLordName;
            }
          } else {
            this.displayMessage(result.message, 'red');
          }
        }, (error: any) => {
          this.displayMessage(error.message, 'red');
        });

      }
    onFlatSearch() {
        const body = {
          ...this.commonParams(),
          Type: 'FLAT',
          Item: this.openinBalDetForm.controls['flat'].value || '',
          ItemFirstLevel: "",
          ItemSecondLevel: ""
        }
        try {
          this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
            if (res.retVal === 0) {
              if (res && res.data && res.data.nameCount === 1) {
                this.openinBalDetForm.controls['flat'].patchValue(res.data.selName);
                this.masterParams.item = res.data.selCode;
                this.flatCode = res.data.selCode;
                // this.onFlatChanged();
              }
              else {
                if (!this.dialogOpen) {
                  const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                    width: '90%',
                    disableClose: true,
                    data: {
                      'flat': this.openinBalDetForm.controls['flat'].value, 'type': 'FLAT',
                      'search': 'Flat Search', property: this.openinBalDetForm.controls['property'].value, block: this.openinBalDetForm.controls['block'].value,
                    }
                  });
                  this.dialogOpen = true;
                  dialogRef.afterClosed().subscribe(result => {
                    this.dialogOpen = false;
                    if (result != true) {
                      this.openinBalDetForm.controls['flat'].patchValue(result.unitName);
                      this.masterParams.item = result.unitId;
                      this.flatCode = result.unitId;
                      console.log(result.unitId)
                      try {
                        console.log(result.unitId)
                        this.onSelectedFlatChanged(result.unitId, this.data.mode);
                        // this.onFlatChanged();
                      }
                      catch (ex: any) {
                        this.retMessage = ex;
                        this.textMessageClass = 'red';
                      }
                    }
                  });
                }
              }
            }
            else {
              this.displayMessage(res.message,'red');
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(ex.message,'red');
        }
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
    this.openingDetCls.propcode=this.openinBalDetForm.get('property')?.value;
    this.openingDetCls.blockcode=this.openinBalDetForm.get('block')?.value;
    this.openingDetCls.unitcode=this.openinBalDetForm.get('flat')?.value;
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
    this.openingDetCls.party = "";
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  ngOnInit(): void {
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.loadData();
  }

  formInit() {
    return this.fb.group({
      // partyType: ['', Validators.required],
      property: ['', Validators.required],
      block: ['', Validators.required],
      flat: ['', Validators.required],
      partyName: ['', Validators.required],
      balAmount: ['0.00', Validators.required],
      currency: ['', Validators.required],
      clientType: [''],
      // CrAmount: ['0.00', Validators.required],
    })

  }
  searchParty() {
    console.log(this.openinBalDetForm.get('clientType')?.value.toUpperCase());
    console.log(this.landlordCount)
    if(this.openinBalDetForm.get('clientType')?.value.toUpperCase() === 'LANDLORD' && this.landlordCount > 1){
      if (!this.dialogOpen) {
        const dialogRef: MatDialogRef<MultiLandLordComponent> = this.dialog.open(MultiLandLordComponent, {
          width: '90%',
          disableClose: true,
          data: {
            'property': this.openinBalDetForm.controls['property'].value,
            'block': this.openinBalDetForm.get('block')?.value,
            'flat': this.flatCode
          }
        });
        this.dialogOpen = true;
        dialogRef.afterClosed().subscribe(result => {
          if (result != true) {
            this.openinBalDetForm.controls['partyName'].patchValue(result.landlordName);
            this.partyCode = result.landlord;
            this.landlodCode=result.landlord;
            this.openingDetCls.party = result.landlord;
          }

          this.dialogOpen = false;
        });
      }

    }
    else{
      if (this.openinBalDetForm.controls.clientType.value === "" || this.openinBalDetForm.controls.clientType.value === null || this.openinBalDetForm.controls.clientType.value === undefined) {
        this.displayMessage("Please Select Client Type", "red");
        return;
      }
      else{
        const body = {
          ...this.commonParams(),
          Type: this.openinBalDetForm.get('clientType')?.value,
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
                      'PartyType': this.openinBalDetForm.get('clientType')?.value,
                      'search': this.openinBalDetForm.get('clientType')?.value + " " + ' Search'
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
    }


  }

}
