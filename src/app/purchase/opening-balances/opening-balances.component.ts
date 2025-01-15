import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { Item } from 'src/app/general/Interface/interface';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { InventoryService } from 'src/app/Services/inventory.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { OpeningDetailComponent } from './opening-detail/opening-detail.component';
import { Router } from '@angular/router';
import { OpeningBalancesClass } from '../purchase.class';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
@Component({
  selector: 'app-opening-balances',
  templateUrl: './opening-balances.component.html',
  styleUrls: ['./opening-balances.component.css']
})
export class OpeningBalancesComponent implements OnInit, OnDestroy {
  openingBalForm!: FormGroup;
  private subSink: SubSink = new SubSink();
  modes: Item[] = [];
  tranLabel: string = "Last transactions";
  tomorrow: Date = new Date();
  detdialogOpen = false;
  status: string = "";
  patyTypeList: Item[] = [
    { itemCode: 'OPNBAL', itemName: 'Opening Balance' },
    { itemCode: 'LOANBAL', itemName: 'Loan Balance' },
    { itemCode: 'UTILITY', itemName: 'Utility' },
  ];
  rowData: any = [];
  masterParams!: MasterParams;
  retMessage: string = "";
  textMessageClass: string = "";
  private opBalCls: OpeningBalancesClass = new OpeningBalancesClass();
  columnDefs: any = [{ field: "tranNo", headerName: "Tran No", flex: 1, resizable: true, sortable: true, filter: true, cellRenderer: 'agLnkRenderer' },
  {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
      // Format date as dd-MM-yyyy
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
  { field: "partyName", headerName: "Party Name", sortable: true, filter: true, resizable: true, flex: 1, },
  { field: "tranType", headerName: "Tran Type", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "tranAmount", headerName: "Tran Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    }
  },
  {
    field: "totalAmount", headerName: "Total Amount", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
        }
      }
      return null;
    }
  },
  { field: "detail", headerName: "Details", flex: 1, resizable: true, sortable: true, filter: true, cellRenderer: 'agDtlRenderer' }
  ];
  tranStatus: string = "";
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    private datePipe: DatePipe, public dialog: MatDialog, private router: Router,
    private invService: InventoryService, private loader: NgxUiLoaderService, protected purchaseService: PurchaseService,) {
    this.openingBalForm = this.formInit();

  }
  onSubmit() {
    if (this.openingBalForm.invalid) {
      this.displayMessage("Enter required field", "red");
      return;
    }
    else {
      this.displayMessage("", "");
      try {
        this.prepareCls();
        this.loader.start();
        this.subSink.sink = this.purchaseService.UpdatePartyOpeningBalancesHeader(this.opBalCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage(res.message, "green");
            this.modeChange("Modify");
            this.openingBalForm.get('tranNo')?.patchValue(res.tranNoNew);
            this.getOpeningBalalceHdr(res.tranNoNew, "Modify");
          }
          else {
            this.displayMessage(res.message, "red");
          }
        });
      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }

  }
  getOpeningBalalceHdr(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    try {
      this.subSink.sink = this.purchaseService.GetPartyOpeningBalancesHdr(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.openingBalForm.patchValue({
            tranNo: res.data.tranNo,
            tranDate: res.data.tranDate,
            balType: res.data.balType,
            notes: res.data.notes

          });
          this.status = res.data.tranStatus;
          if (mode === "View") {
            this.displayMessage(res.message, 'green');
          }
        }
        else {
          this.displayMessage(res.message, 'red');
        }
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  prepareCls() {
    this.opBalCls.company = this.userDataService.userData.company;
    this.opBalCls.location = this.userDataService.userData.location;
    this.opBalCls.langID = this.userDataService.userData.langId;
    this.opBalCls.refNo = this.userDataService.userData.sessionID
    this.opBalCls.user = this.userDataService.userData.userID;
    this.opBalCls.mode = this.openingBalForm.get('mode')?.value;
    this.opBalCls.tranNo = this.openingBalForm.get('tranNo')?.value;
    this.opBalCls.tranDate = this.openingBalForm.get('tranDate')?.value;
    this.opBalCls.balType = this.openingBalForm.get('balType')?.value;
    this.opBalCls.notes = this.openingBalForm.get('notes')?.value;
  }

  onLnkClicked(event: any): void {

  }
  onColumnVisibilityChanged(event: any) {

  }
  onDtlClicked(event: any): void {
    // let applyVat = this.openingBalForm.controls['isVatable'].value;

  }
  onFilterData(event: any) {

  }
  clear() {
    this.openingBalForm = this.formInit();
    this.displayMessage("", "");
    this.status="";
  }
  close() {
    this.router.navigate(['/home']);
  }
  formInit() {

    return this.openingBalForm = this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      balType: ['', Validators.required],
      notes: ['']
    })
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
    const service1 = this.invService.getModesList({ ...this.commonParams(), item: 'ST201' });
    this.subSink.sink = forkJoin([service1]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        if(res1.status.toUpperCase()==="SUCCESS"){
          this.modes = res1.data;
        }
        else{
          this.displayMessage("Modes list empty!", "red");
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(error.message, "red");
      }
    );
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }


  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onSearchCilcked() {
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'PARTYOPNBAL',
      TranNo: this.openingBalForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.getOpeningBalalceHdr(res.data.selTranNo, this.openingBalForm.controls['mode'].value);

        }
        else {
          this.retMessage = '';
          if (!this.detdialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: { 'tranNum': this.openingBalForm.controls['tranNo'].value, 'search': 'Opening Balance Search', 'TranType': "PARTYOPNBAL" }  // Pass any data you want to send to CustomerDetailsComponent
            });
            this.detdialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              this.detdialogOpen = false;
              if (result != true && result != undefined) {
                this.getOpeningBalalceHdr(result, this.openingBalForm.controls['mode'].value);
              }

            });
          }
        }
      }
      else {
        this.displayMessage("Error: " + res.message, "red");
      }
    });
  }
  modeChange(event: string) {
    if (event === "Add") {
      // this.clear();
      this.openingBalForm.get('tranNo')!.patchValue('');
      this.openingBalForm.get('tranNo')!.disable();
      this.openingBalForm.controls['tranDate'].patchValue(new Date());
      this.openingBalForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
    else {
      this.openingBalForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.openingBalForm.get('tranNo')!.enable();
    }
  }
  onHelpCilcked() {

  }
  logDetails() {

  }
  NotesDetails() {

  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<OpeningDetailComponent> = this.dialog.open(OpeningDetailComponent, {
      width: '80%',
      disableClose: true,
      data: {
        'tranNo': this.openingBalForm.controls['tranNo'].value,
        'mode': this.openingBalForm.controls['mode'].value,
        'status': this.tranStatus,
        'balType': this.openingBalForm.get('balType')?.value
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        // this.purchaseOrderData(this.masterParams, this.openingBalForm.controls['mode'].value);
      }
    });
  }
}
