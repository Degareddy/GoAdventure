import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MastersService } from 'src/app/Services/masters.service';
import { UserData } from '../payroll.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { taxTable } from '../payroll.class';
import { DatePipe } from '@angular/common';
import { TaxTableDetailsComponent } from './tax-table-details/tax-table-details.component';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.css']
})
export class TablesComponent implements OnInit, OnDestroy {
  tthForm!: FormGroup;
  masterParams!: MasterParams;
  newTranMessage: string = "";
  modes: Item[] = [];
  taxTypesList: Item[] = [];
  taxList: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  tthCode!: string;
  taxTypeCode!: string;
  taxStatus!: string;
  private subSink: SubSink;
  @Input() max: any;
  tomorrow = new Date();
  newTranMsg!: string;
  private taxCls: taxTable = new taxTable();
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [
      { field: "tableType", headerName: "Table Type", sortable: true, filter: true, resizable: true, flex: 2},
      { field: "yearCode", headerName: "Year Code", sortable: true, filter: true, resizable: true, flex: 1},
      { field: "validFrom", headerName: "Valid From",valueFormatter:(params:any)=>{ return this.datePipe.transform(params.value)} ,sortable: true, filter: true, resizable: true, flex: 1},
      { field: "validTo", headerName: "Valid To",valueFormatter:(params:any)=>{ return this.datePipe.transform(params.value)} ,sortable: true, filter: true, resizable: true, flex: 1},
      { field: "taxStatus", headerName: "Tax Status", sortable: true, filter: true, resizable: true, flex: 1},
  ];

  constructor(private fb: FormBuilder,
    private router: Router, public dialog: MatDialog, private datePipe: DatePipe,
    private masterService: MastersService, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    private payService: PayrollService,) {
    this.tthForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      tableType: ['', [Validators.required, Validators.maxLength(30)]],
      taxType: [''],
      yearCode: ['', [Validators.required, Validators.maxLength(10)]],
      validFrom: [new Date(), [Validators.required]],
      validTo: [new Date(), [Validators.required]],
      notes: [''],
      mode: ['View']

    });
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    // this.getTableTypeData(event.data.yearCode,"View");
    const rowData = event.data;
    this.resetMessages();
    
    this.tthForm.patchValue({
      tableType: rowData.tableType,
      taxType: rowData.yearCode,
      yearCode: rowData.yearCode,
      validFrom: new Date(rowData.validFrom),
      validTo: new Date(rowData.validTo),
      notes: rowData.notes || ''
    });
    const found = this.taxList.find(x => x.itemCode === rowData.yearCode);
    if (!found && rowData.yearCode) {
      this.taxList.push({ itemCode: rowData.yearCode, itemName: rowData.yearCode });
    }
    this.taxStatus = rowData.taxStatus;
    
    this.textMessageClass = 'green';
    this.retMessage = "Tax table data loaded for " + rowData.tableType;

  }



  ngOnInit(): void {
   this.loadData();
   this.loadGridData();
  }
  loadGridData(){
    const data:getPayload={
      ...this.commonParams(),
      item:"TAXLIST",
      mode:this.tthForm.get('mode')?.value
    }
    const requests = [
      this.payService.GetTaxTableList(data)
    ];
    this.subSink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.rowData = results[0]['data'];
      },
      (error: any) => {
        this.textMessageClass = 'red';
        this.retMessage = error.message;

      }
    );  
  }
  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST614'
    };

    const taxbody: getPayload = {
      ...this.commonParams(),
      item: 'TAXTYPES',
      mode:this.tthForm.get('mode')?.value
    };
    try {
      this.loader.start();
      const modes$ = this.masterService.getModesList(modebody);
      const taxTypes$ = this.masterService.GetMasterItemsList(taxbody);
      this.subSink.sink = forkJoin([modes$, taxTypes$]).subscribe(
        ([modesRes, taxTypeRes]: any) => {
          this.loader.stop();
          if(modesRes.status.toUpperCase() === 'SUCCESS'){
            this.modes = modesRes['data'];
      
          }
          else{
            this.retMessage="Modes List empty!";
            this.textMessageClass="red";

          }
          if(taxTypeRes.status.toUpperCase() === 'SUCCESS'){
          this.taxTypesList = taxTypeRes['data'];
          }
          else{
            this.retMessage="Tax Types List empty!";
            this.textMessageClass="red";

          }
        },
        error => {
          this.retMessage= error.message;
          this.textMessageClass="red";
        }
      );
    }
    catch (ex: any) {
      this.textMessageClass = "red";
      this.retMessage = "Error! " + ex.message;
    }
  }

  // getTableTypeChange(event:any){
  //   this.getTableTypeData(event.value,this.tthForm.get('mode')?.value)
  // }
  getTableTypeChange(event: any) {
    // this.tthForm.

    if (this.tthForm.get('mode')?.value != "Add") {
      this.resetMessages();
      this.masterParams.type = 'TAXLIST';
      this.masterParams.item = event.value;
      this.taxTypeCode = event.value;

      try {
        this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe(
          (result: getResponse) => {
            this.handleTableTypeChangedResponse(result);
          },
          (error: any) => {
            this.handleChangedError(error);
          }
        );
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }


  private handleChangedError(error: any): void {
    this.retMessage = error.message;
    this.textMessageClass = 'red';
  }

  getTableTypeData(bonusCode: string, mode: string) {
    this.masterParams.item = bonusCode;
    // console.log(this.masterParams.item)
    try {
      this.loader.start();
      this.subSink.sink = this.payService.GetTaxTable(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        // console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.populateTaxDetails(res.data);
          if (mode != "View" && this.newTranMessage != "") {
            this.textMessageClass = 'green';
            this.retMessage = this.newTranMessage;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage = "Tax table type data is retrieved successfully for " + res['data'].tableType;
          }
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }
  prepareTaxClass() {
    this.taxCls.mode = this.tthForm.get('mode')?.value;
    this.taxCls.company = this.userDataService.userData.company;
    this.taxCls.location = this.userDataService.userData.location;
    this.taxCls.user = this.userDataService.userData.userID;
    this.taxCls.refNo = this.userDataService.userData.sessionID;
    this.taxCls.notes = this.tthForm.get('notes')?.value;
    this.taxCls.tableType = this.tthForm.get('tableType')?.value;

    const validFrom = this.datePipe.transform(this.tthForm.controls['validFrom'].value, 'yyyy-MM-dd');
    if (validFrom !== undefined && validFrom !== null) {
      this.taxCls.validFrom = validFrom.toString();
    } else {
      this.taxCls.validFrom = ''; // or any default value you prefer
    }

    const validTo = this.datePipe.transform(this.tthForm.controls['validTo'].value, 'yyyy-MM-dd');
    if (validTo !== undefined && validTo !== null) {
      this.taxCls.validTo = validTo.toString();
    } else {
      this.taxCls.validTo = ''; // or any default value you prefer
    }

    this.taxCls.yearCode = this.tthForm.get('yearCode')?.value;

  }
  modeChanged(event: string) {
    if (event.toUpperCase() === "ADD") {
      // this.tthForm.get('taxType')?.disable({ emitEvent: false });
      this.tthForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.loadData();
    }
    else {
      // this.tthForm.get('taxType')?.enable({ emitEvent: false });
      this.tthForm.get('mode')?.patchValue(event, { emitEvent: false });
    }
  }
  onUpdate() {
    if (this.tthForm.invalid) {
      return;
    }
    else {
      this.prepareTaxClass();
      try {
        this.loader.start();
        this.subSink.sink = this.payService.UpdateTaxTable(this.taxCls).subscribe((res: SaveApiResponse) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.newTranMessage = res.message;
            if (this.tthForm.get('mode')?.value === "Add") {
              this.modeChanged('Modify');
              this.taxTypesList.push({ itemCode: this.tthForm.get('yearCode')?.value, itemName: this.tthForm.get('yearCode')?.value });
              this.tthForm.get('taxType')?.patchValue(this.tthForm.get('yearCode')?.value);
            }
            this.getTableTypeData(res.tranNoNew, this.tthForm.get('mode')?.value);
            this.loadGridData();
          }
          else {
            this.handleChangedError(res);
          }
        });
      }
      catch (ex: any) {
        this.handleChangedError(ex);
      }

    }
  }
  private populateTaxDetails(data: any): void {
    this.tthForm.patchValue({
      // taxType:data.taxType,
      validFrom: data.validFrom,
      yearCode: data.yearCode,
      validTo: data.validTo,
      notes: data.notes
    });
    this.taxStatus = data.taxStatus;
  }


  private resetMessages(): void {
    this.retMessage = '';
    this.newTranMessage = "";
    this.textMessageClass = '';
    this.taxStatus = "";
  }

  private handleTableTypeChangedResponse(result: getResponse) {

    if (result.message.toUpperCase() === 'SUCCESS') {
      this.taxList = result.data;
      if (this.taxList.length === 1) {
        this.tthForm.get('taxType')!.patchValue(this.taxList[0].itemCode);
        this.onSelectedTaxTypeListChanged(this.taxList[0].itemCode)
      }
    } else {
      this.retMessage = `${result.message} for this Table Type`;
      this.textMessageClass = 'red';
    }
  }
  onDetailsClicked() {
    const dialogRef: MatDialogRef<TaxTableDetailsComponent> = this.dialog.open(TaxTableDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        search: "Tax Table Details",
        mode: this.tthForm.get('mode')!.value, status: this.taxStatus,
        yearCode: this.tthForm.get('taxType')!.value, tableType: this.tthForm.get('tableType')!.value,

      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        // this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
      }
    });
  }
  onSelectedTaxTypeListChanged(event: string): void {
    if (event != "" && event != undefined) {
      this.resetMessages();
      this.masterParams.type = '';
      this.masterParams.item = event;
      this.getTableTypeData(event, this.tthForm.get('mode')?.value);
    }
  }


  private handleTaxTypeResponse(result: getResponse): void {
    if (result.status.toUpperCase() === 'SUCCESS') {
      this.populateTaxDetails(result.data);
      // this.retMessage = this.selMode === 'Add' ? this.newTranMsg : `Retrieving data ${result.message} has completed`;
      // this.textMessageClass = 'green';
    } else {
      this.retMessage = result.message;
      this.textMessageClass = 'red';
    }
  }





  clear() {
    this.tthForm = this.formInit();
    this.taxStatus = "";
    this.resetMessages();
  }
  close() {
    this.router.navigateByUrl('/home');
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST614",
        Page: "Tax Table",
        SlNo: 77,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
