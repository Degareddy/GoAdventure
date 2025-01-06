import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PurchaseorderdetailsComponent } from './purchase-order-details/purchase-order-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { InventoryService } from 'src/app/Services/inventory.service';
import { forkJoin } from 'rxjs';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { ExcelReportsService } from 'src/app/FileGenerator/excel-reports.service';
import { ReportsService } from 'src/app/Services/reports.service'
import { PurchaseOrder } from '../purchase.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  indeterminate = false;
  @Input() max: any;
  tomorrow = new Date();
  labelPosition: 'before' | 'after' = 'before';
  purhdrForm!: FormGroup;
  dialogOpen = false;
  detdialogOpen = false;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  masterParams!: MasterParams;
  modes: Item[] = [];
  supCode!: string;
  selMode!: string;
  newTranMsg!: string;
  disableQuoteSearch: boolean = true;
  isQtnBased: boolean = false;
  isVatable: boolean = true;
  tranAmount: number = 0;
  itemCount: number = 0;
  private subSink!: SubSink;
  tranStatus!: string;
  authorizedOn!: string;
  authorizedBy!: string;
  currencyList: Item[] = [];
  categoryList: Item[] = [];
  private purOrder!: PurchaseOrder;
  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private datePipe: DatePipe, private userDataService: UserDataService,
    private invService: InventoryService,
    private loader: NgxUiLoaderService,
    private utlService: UtilitiesService,
    public dialog: MatDialog,
    protected purchaseService: PurchaseService,
    private excelService: ExcelReportsService,
    private repService: ReportsService,
    private fb: FormBuilder) {
    this.masterParams = new MasterParams();
    this.purhdrForm = this.formInit();
    this.subSink = new SubSink();
    this.purOrder = new PurchaseOrder();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      tranNo: [''],
      isQtnBased: [false],
      quotationNo: [{ value: '', disabled: true }],
      tranType: ['', [Validators.required, Validators.maxLength(30)]],
      tranCategory: ['', [Validators.required, Validators.maxLength(20)]],
      supplier: ['', [Validators.required, Validators.maxLength(35)]],
      tranDate: [new Date(), [Validators.required]],
      currency: ['', [Validators.required, Validators.maxLength(20)]],
      exchRate: ['1.0000', [Validators.required]],
      isVatable: [false],
      suppRefNo: [''],
      notes: [''],
      mode: ['View']
    });
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.purhdrForm.get('quotationNo')!.disable();
    this.loadData();
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
    const service1 = this.invService.getModesList({ ...this.commonParams(), item: 'ST102' });
    const service2 = this.invService.GetMasterItemsList({ ...this.commonParams(), item: "CURRENCY",mode:this.purhdrForm.get('mode')?.value });
    this.subSink.sink = forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.modes = res1.data;
        }
        else {
          this.displayMessage("Modes list empty!", "red");
          return;
        }
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.currencyList = res2.data;
        }
        else {
          this.displayMessage("Currency list empty!", "red");
          return;
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(error.message, "red");
      }
    );
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  handleTranChange() {
    this.onSearchCilcked();
  }

  onDetailsCilcked() {
    let applyVat = this.purhdrForm.controls['isVatable'].value;
    const dialogRef: MatDialogRef<PurchaseorderdetailsComponent> = this.dialog.open(PurchaseorderdetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': this.purhdrForm.controls['tranNo'].value,
        'mode': this.purhdrForm.controls['mode'].value,
        'applyVat': applyVat,
        'status': this.tranStatus,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.purchaseOrderData(this.masterParams, this.purhdrForm.controls['mode'].value);
      }
    });
  }

  onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: "SUPPLIER",
      Item: this.purhdrForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
          if (res && res.data && res.data.nameCount === 1) {
            this.purhdrForm.controls['supplier'].patchValue(res.data.selName);
            this.supCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.purhdrForm.controls['supplier'].value, 'PartyType': "SUPPLIER",
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if(result != true && result != undefined){
                  this.purhdrForm.controls['supplier'].setValue(result.partyName);
                  this.supCode = result.code;
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

  reset() {
    this.purhdrForm = this.formInit();
    this.displayMessage("", "");
    this.tranStatus = "";
    this.authorizedBy = "";
    this.authorizedOn = "";
  }

  purchaseOrderData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.purchaseService.getPurchaseHeaderData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.purhdrForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.purhdrForm.controls['isQtnBased'].setValue(res['data'].isQtnBased);
          this.isQtnBased = res['data'].isQtnBased;
          this.purhdrForm.controls['quotationNo'].setValue(res['data'].quotationNo);
          this.purhdrForm.controls['tranType'].setValue(res['data'].tranType);
          this.purhdrForm.controls['tranCategory'].setValue(res['data'].tranCategory);
          this.purhdrForm.controls['supplier'].setValue(res['data'].suppName);
          this.supCode = res['data'].supplier;
          this.purhdrForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.purhdrForm.controls['currency'].setValue(res['data'].currency);
          this.purhdrForm.controls['exchRate'].setValue(res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
          this.purhdrForm.controls['isVatable'].setValue(res['data'].isVatable);
          this.purhdrForm.controls['suppRefNo'].setValue(res['data'].suppRefNo);
          this.purhdrForm.controls['notes'].setValue(res['data'].notes);
          this.authorizedBy = res['data'].authorizedBy;
          this.tranAmount = res['data'].amount;
          this.itemCount = res['data'].itemCount;

          if (res['data'].tranStatus == 'Authorized') {
            this.authorizedOn = res['data'].authorizedOn.startsWith('0001-01-01') ? '' : res['data'].authorizedOn;
          }
          else {
            this.authorizedOn = "";
          }
          this.tranStatus = res['data'].tranStatus;
          if (mode != 'View') {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
          this.textMessageClass = 'green';
        }
        else {
          this.purhdrForm = this.formInit();
          this.displayMessage("Error: " + res.message, "red");
        }

      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  onSearchCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'PURCHASE',
      TranNo: this.purhdrForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.purchaseOrderData(this.masterParams, this.purhdrForm.controls['mode'].value);

        }
        else {
          this.retMessage = '';
          if (!this.detdialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: { 'tranNum': this.purhdrForm.controls['tranNo'].value, 'search': 'Purchase-Order Search', 'TranType': "PURCHASE" }  // Pass any data you want to send to CustomerDetailsComponent
            });
            this.detdialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              this.detdialogOpen = false;
              if (result != true && result != undefined) {
                this.masterParams.tranNo = result;
                this.purchaseOrderData(this.masterParams, this.purhdrForm.controls['mode'].value);
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

  close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.purhdrForm = this.formInit();
    this.displayMessage("", "");
    this.tranStatus = "";
    this.itemCount = 0;
    this.tranAmount = 0;
    this.authorizedBy = "";
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.purhdrForm.controls['mode'].value, tranNo: this.purhdrForm.controls['tranNo'].value, search: 'Purchase Docs', tranType: "PURCHASE" }
    });

  }

  getPurchaseOrderReport(tarnNum: any, type: string) {
    this.masterParams.tranNo = tarnNum;
    try {
      this.loader.start();
      this.subSink.sink = this.repService.getPurchaseOrderDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != 'FAIL') {
          if (type === "Excel") {
            this.excelService.generatePurchaseOrderExcel(res['data']);
          }
          else if (type === "PDF") {
            this.excelService.generatePurchaseOrderPDF(res['data']);
          }
        } else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  generateExcel() {
    if (this.purhdrForm.controls['tranNo'].value) {
      this.getPurchaseOrderReport(this.purhdrForm.controls['tranNo'].value, "Excel");
    }
  }

  generatePDF() {
    if (this.purhdrForm.controls['tranNo'].value) {
      this.getPurchaseOrderReport(this.purhdrForm.controls['tranNo'].value, "PDF");
    }
  }
  poCls() {
    this.purOrder.company = this.userDataService.userData.company;
    this.purOrder.location = this.userDataService.userData.location;
    this.purOrder.langCode = this.userDataService.userData.langId;
    this.purOrder.mode = this.purhdrForm.controls['mode'].value;
    this.purOrder.user = this.userDataService.userData.userID;
    this.purOrder.refNo = this.userDataService.userData.sessionID;

    this.purOrder.tranNo = this.purhdrForm.controls['tranNo'].value;
    this.purOrder.isQtnBased = this.purhdrForm.controls['isQtnBased'].value;
    this.purOrder.quotationNo = this.purhdrForm.controls['quotationNo'].value;
    this.purOrder.tranType = this.purhdrForm.controls['tranType'].value;
    this.purOrder.tranCategory = this.purhdrForm.controls['tranCategory'].value;
    this.purOrder.supplier = this.supCode;
    const transformedDate = this.datePipe.transform(this.purhdrForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.purOrder.tranDate = transformedDate.toString();
    } else {
      this.purOrder.tranDate = ''; // or any default value you prefer
    }
    this.purOrder.currency = this.purhdrForm.controls['currency'].value;
    this.purOrder.exchRate = this.purhdrForm.controls['exchRate'].value.replace(/,/g, '');
    this.purOrder.isVatable = this.purhdrForm.controls['isVatable'].value;
    this.purOrder.suppRefNo = this.purhdrForm.controls['suppRefNo'].value;
    this.purOrder.notes = this.purhdrForm.controls['notes'].value;
  }
  onSubmit() {
    this.textMessageClass = "";
    this.retMessage = "";
    if (this.purhdrForm.invalid) {
      return;
    }
    else {
      this.poCls();
      if (this.purOrder.isQtnBased && this.purOrder.quotationNo === "") {
        this.displayMessage("Quotation required", "red");
        return;
      }
      try {
        this.loader.start();
        this.subSink.sink = this.purchaseService.updatePurchaseOrder(this.purOrder).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.masterParams.tranNo = res.tranNoNew;
            this.newTranMsg = res.message;
            this.textMessageClass = "green";
            if (this.purhdrForm.controls['mode'].value.toUpperCase() === "ADD") {
              this.modeChange("Modify");
            }
            this.purchaseOrderData(this.masterParams, this.purhdrForm.controls['mode'].value);
          }
          else {
            this.displayMessage(res.message, "red");
          }
        });
      } catch (ex: any) {
        this.displayMessage(ex.message, "red");
      }
    }
  }


  onSearchQtnCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'SUPQUOTEAUTH',
      TranNo: this.purhdrForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.purhdrForm.controls['quotationNo'].patchValue(res.data.selTranNo);
          this.masterParams.tranNo = res.data.selTranNo;
        }
        else {
          this.retMessage = '';
          if (!this.detdialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.purhdrForm.controls['tranNo'].value, 'search': 'Authorized Supplier Quotation Search',
                'TranType': "SUPQUOTEAUTH", 'supplier': this.purhdrForm.controls['supplier'].value
              }
            });
            this.detdialogOpen = true;
            dialogRef.afterClosed().subscribe(result => {
              this.detdialogOpen = false;
              if (result != true) {
                this.purhdrForm.controls['quotationNo'].patchValue(result);
              }

            });
          }
        }
      }
      else {
        this.displayMessage(res.message, "red");
      }
    });
  }

  modeChange(event: string) {
    if (event === "Add") {
      this.clear();
      this.purhdrForm.get('tranNo')!.setValue('');
      this.purhdrForm.get('tranNo')!.disable();
      this.purhdrForm.controls['tranDate'].setValue(new Date());
      this.purhdrForm.controls['mode'].setValue(event, { emitEvent: false });
    }
    else {
      this.purhdrForm.controls['mode'].setValue(event, { emitEvent: false });
      this.purhdrForm.get('tranNo')!.enable();
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {

        ScrId: "ST102",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.purhdrForm.controls['mode'].value,
        'TranType': "PURCHASE",
        'search': "Purchase Order Notes"
      }
    });
  }
}
