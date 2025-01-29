import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SupplierQuotaionDetailsComponent } from './supplier-quotaion-details/supplier-quotaion-details.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { DatePipe } from '@angular/common';
import { InventoryService } from 'src/app/Services/inventory.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { supplierQuotation } from 'src/app/purchase/purchase.class';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-supplier-quotation',
  templateUrl: './supplier-quotation.component.html',
  styleUrls: ['./supplier-quotation.component.css']
})
export class SupplierQuotationComponent implements OnInit, OnDestroy {
  sqhForm!: FormGroup;
  retMessage!: string;
  @Input() max: any;
  supplierCode: any;
  tomorrow = new Date();
  retNum!: number;
  textMessageClass!: string;
  modeIndex!: number;
  masterParams!: MasterParams;
  modes: Item[] = [];
  selMode!: string;
  newTranMsg!: string;
  currencyList: Item[] = [];
  payTermList: Item[] = [];
  billList: Item[] = [];
  suppCode!: string;
  billToCode!: string;
  private subSink!: SubSink;
  status!: string;
  tranAmount: number = 0;
  vatAmount: number = 0;
  totalAmount: number = 0;
  itemCount: number = 0;
  public disableDetail: boolean = true;
  public fetchStatus: boolean = true;
  public dialogOpen: boolean = false;
  public suppQuation!: supplierQuotation;
  programmaticModeChange: any;
  constructor(protected route: ActivatedRoute, public dialog: MatDialog, private userDataService: UserDataService,
    protected router: Router, protected purchreqservice: PurchaseService,
    private fb: FormBuilder, private loader: NgxUiLoaderService, private invService: InventoryService, private datePipe: DatePipe,
    private utlService: UtilitiesService) {
    this.masterParams = new MasterParams();
    this.sqhForm = this.forminit();
    this.suppQuation = new supplierQuotation()
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  reset() {
    this.sqhForm.reset();
    this.sqhForm = this.forminit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.fetchStatus = true;
    this.billList = [];
    this.disableDetail = true;
    this.tranAmount = 0;
    this.vatAmount = 0;
    this.totalAmount = 0;
    this.itemCount = 0;
    this.updateTranNoDisabledState();
  }
  prepareSupplierCls() {
    this.suppQuation.company = this.userDataService.userData.company;
    this.suppQuation.location = this.userDataService.userData.location;
    this.suppQuation.langID = this.userDataService.userData.langId;
    this.suppQuation.user = this.userDataService.userData.userID;
    this.suppQuation.applyVAT = this.sqhForm.controls['applyVat'].value;
    this.suppQuation.revisionNo = this.sqhForm.controls['revisionNo'].value;
    this.suppQuation.remarks = this.sqhForm.controls['remarks'].value;
    this.suppQuation.salesExec = this.sqhForm.controls['salesExec'].value;
    this.suppQuation.tranStatus = TranStatus.OPEN;
    this.suppQuation.payTerm = this.sqhForm.controls['payTerm'].value;
    this.suppQuation.exchRate = this.sqhForm.controls['exchRate'].value;
    this.suppQuation.currency = this.sqhForm.controls['currency'].value;
    this.suppQuation.validDays = this.sqhForm.controls['validDays'].value;
    this.suppQuation.tranDate = this.sqhForm.controls['tranDate'].value;
    this.suppQuation.mode = this.sqhForm.controls['mode'].value;
    this.suppQuation.refNo = this.userDataService.userData.sessionID;
    this.suppQuation.tranNo = this.sqhForm.controls['tranNo'].value;
    this.suppQuation.supplier = this.supplierCode;
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onSubmit() {

    this.displayMessage("", "");
    if (this.supplierCode === "" || this.supplierCode === undefined) {

      this.retMessage = "Please select Supplier";
      this.textMessageClass = "red";
      return;
    }
    if (this.sqhForm.invalid) {
      return;
    }
    else {
      this.prepareSupplierCls();
      try {
        this.loader.start();
        this.subSink.sink = this.purchreqservice.updateSupplierQuotation(this.suppQuation).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal < 100) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
          else if (res.retVal >= 100 && res.retVal <= 200) {
            this.newTranMsg = res.message;
            this.masterParams.tranNo = this.sqhForm.controls['tranNo'].value;
            if (this.sqhForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.modeChange("Modify");
              this.supplierQuotationData(this.masterParams, this.sqhForm.get('mode')?.value);
            }
            else {
              this.supplierQuotationData(this.masterParams, this.sqhForm.get('mode')?.value);
              this.retMessage = res.message;
            }
            this.textMessageClass = "green";
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }

  }

  forminit() {
    return this.fb.group({
      tranNo: [''],
      revisionNo: ['', [Validators.required]],
      tranDate: [new Date(), [Validators.required]],
      validDays: [0, [Validators.required]],
      supplier: ['', [Validators.required]],
      currency: ['', [Validators.required, Validators.maxLength(20)]],
      exchRate: ['1.0000', [Validators.required]],
      payTerm: ['', [Validators.required, Validators.maxLength(20)]],
      salesExec: ['', [Validators.required, Validators.maxLength(50)]],
      tranStatus: [''],
      applyVat: [false],
      remarks: [''],
      billToName: [''],
      mode: ['View']
    });
  }

  onDetailsCilcked(tranNo: any) {
    let applyVat = this.sqhForm.controls['applyVat'].value;
    const dialogRef: MatDialogRef<SupplierQuotaionDetailsComponent> = this.dialog.open(SupplierQuotaionDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.sqhForm.controls['mode'].value,
        tranNo: this.sqhForm.controls['tranNo'].value,
        applyVat: applyVat,
        status: this.status
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.supplierQuotationData(this.masterParams, this.sqhForm.get('mode')?.value);
      }
    });
  }

  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.updateTranNoDisabledState();
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
    const modebody = {
      ...this.commonParams(),
      item: ScreenId.SUPPLIER_QUOTATION_SCRID
    };
    const curbody = {
      ...this.commonParams(),
      Item: Items.CURRENCY,
      mode: this.sqhForm.get('mode')?.value
    };

    const payTerm = {
      ...this.commonParams(),
      Item: Items.PAYTERM,
      mode: this.sqhForm.get('mode')?.value
    };

    const service1 = this.invService.getModesList(modebody);
    const service2 = this.invService.GetMasterItemsList(curbody);
    const service3 = this.invService.GetMasterItemsList(payTerm);
    this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res1.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Modes list" + res1.message, TextClr.red);
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.currencyList = res2.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Currency list" + res1.message, TextClr.red);
        }
        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.payTermList = res3.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Payterm list" + res1.message, TextClr.red);
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );
  }

  bindData(res: any) {
    this.sqhForm.controls['tranNo'].setValue(res['data'].tranNo);
    this.sqhForm.controls['revisionNo'].setValue(res['data'].revisionNo);
    this.sqhForm.controls['tranDate'].setValue(res['data'].tranDate);
    this.sqhForm.controls['validDays'].setValue(res['data'].validDays);
    this.sqhForm.controls['supplier'].setValue(res['data'].supplierName);
    this.supplierCode = res['data'].supplier;
    this.sqhForm.controls['currency'].setValue(res['data'].currency);
    this.sqhForm.controls['exchRate'].setValue(res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
    this.sqhForm.controls['payTerm'].setValue(res['data'].payTerm);
    this.sqhForm.controls['salesExec'].setValue(res['data'].salesExec);
    this.sqhForm.controls['tranStatus'].setValue(res['data'].tranStatus);
    this.sqhForm.controls['applyVat'].setValue(res['data'].applyVAT);
    this.sqhForm.controls['remarks'].setValue(res['data'].remarks);
    this.sqhForm.controls['billToName'].setValue(res['data'].billToName);
    this.suppQuation.billTo = res['data'].billTo;
    this.status = res['data'].tranStatus;
    this.tranAmount = res['data'].tranAmount;
    this.vatAmount = res['data'].vatAmount;
    this.totalAmount = res['data'].totalAmount;
    this.itemCount = res['data'].itemCount;
  }
  supplierQuotationData(supp: MasterParams, mode: string): void {
    try {
      this.loader.start();
      this.purchreqservice.getsupplierQuotationData(supp).subscribe((res: any) => {
        this.bindData(res);
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (mode.toUpperCase() != Mode.view) {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
          this.textMessageClass = "green";
        } else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.reset();
      this.status = "";
      this.sqhForm.controls['mode'].setValue(event, { emitEvent: false });
      this.updateTranNoDisabledState();
      this.loadData();
    }
    else {
      this.sqhForm.controls['mode'].setValue(event, { emitEvent: false });
    }
  }




  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  handleBillToChange() {
    this.onSupplierSearch('BILLTO');
  }

  getBillToList(body: any) {
    try {
      this.subSink.sink = this.purchreqservice.GetBillToList(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.billList = res['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Bill list " + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  onSupplierSearch(itemType: string) {
    this.displayMessage("", "");
    this.suppQuation.supplier = "";
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.sqhForm.controls['supplier'].value,
      ItemFirstLevel: this.sqhForm.controls['billToName'].value,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {

        if (res.status.toUpperCase() != AccessSettings.ERROR && res.status.toUpperCase() != AccessSettings.FAIL) {

          if (res && res.data && res.data.nameCount === 1) {
            if (itemType == Items.SUPPLIER) {
              this.sqhForm.controls['supplier'].patchValue(res.data.selName);
              this.supplierCode = res.data.selCode;
              console.log(this.supplierCode);
            }
            else {
              this.sqhForm.controls['billToName'].patchValue(res.data.selName);
              this.suppQuation.billTo = res.data.selCode;
            }
          }
          else {

            if (!this.dialogOpen) {

              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  tranNum: this.sqhForm.controls['supplier'].value, PartyType: itemType,
                  search: 'Supplier Search', PartyName: this.supplierCode
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (itemType == Items.SUPPLIER) {
                  this.sqhForm.controls['supplier'].setValue(result.partyName);
                  this.supplierCode = result.code;
                }
                else {
                  this.sqhForm.controls['billToName'].setValue(result.partyName);
                  this.suppQuation.billToName = result.partyName;
                  this.suppQuation.billTo = result.code;
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  private updateTranNoDisabledState() {
    const isModeAdd = this.sqhForm.get('mode')?.value.toUpperCase() === Mode.Add;
    if (isModeAdd) {
      this.sqhForm.get('supplier')?.disable();
    } else {
      this.sqhForm.get('supplier')?.enable();
    }
  }

  onSearchCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: TranType.SUPQUOTATION,
      TranNo: this.sqhForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: TranStatus.ANY
    }
    try {
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.supplierQuotationData(this.masterParams, this.sqhForm.controls['mode'].value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  tranNum: this.sqhForm.controls['tranNo'].value, TranType: TranType.SUPQUOTATION,
                  search: 'Supplier Quotation Search'
                }
              });
              this.status = "";
              this.selMode = this.sqhForm.controls['mode'].value;
              this.sqhForm = this.forminit();
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.masterParams.tranNo = result;
                  try {
                    this.supplierQuotationData(this.masterParams, this.sqhForm.controls['mode'].value);
                    this.sqhForm.controls['mode'].setValue(this.selMode);
                  }
                  catch (ex: any) {
                    this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
                  }
                }

              });
            }

          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }

      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.sqhForm = this.forminit();
    this.displayMessage("", "");
    this.status = "";
    this.tranAmount = 0;
    this.vatAmount = 0;
    this.totalAmount = 0;
    this.itemCount = 0;
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.sqhForm.controls['mode'].value,
        tranNo: this.sqhForm.controls['tranNo'].value, search: 'Quotation Docs',
        tranType: TranType.SUPQUOTATION
      }
    });
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.SUPPLIER_QUOTATION_SCRID,
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
        tranNo: tranNo,
        mode: this.sqhForm.controls['mode'].value,
        TranType: TranType.SUPQUOTATION,
        search: "Supplier Quotaion Notes"
      }
    });
  }


  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: TranType.SUPQUOTATION,
        tranNo: tranNo,
        search: 'Supplier Quotation Log Details'
      }
    });
  }

}

