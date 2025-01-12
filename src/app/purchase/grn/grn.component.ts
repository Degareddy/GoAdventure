import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, MinValidator, Validator, Validators } from '@angular/forms';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { GrnDetailsComponent } from './grn-details/grn-details.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { SubSink } from 'subsink';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { InventoryService } from 'src/app/Services/inventory.service';
import { forkJoin } from 'rxjs';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { grn } from '../purchase.class';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';

@Component({
  selector: 'app-grn',
  templateUrl: './grn.component.html',
  styleUrls: ['./grn.component.css']
})

export class GrnComponent implements OnInit, OnDestroy {
  @Input() max: any;
  grnStatus!: string;
  tomorrow = new Date();
  grnForm!: FormGroup;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  masterParams!: MasterParams;
  modes: Item[] = [];
  selMode!: string;
  newTranMsg!: string;
  currencyList: Item[] = [];
  private subSink!: SubSink;
  private grnCls!: grn;
  suppCode!: string;
  dialogOpen = false;
  programmaticModeChange: any;
  totalAmount: number = 0;
  itemCharges: number = 0;
  goodsCost: number = 0;
  commonCharges: number = 0
  constructor(protected route: ActivatedRoute, private userDataService: UserDataService,
    protected router: Router, private datePipe: DatePipe, private invService: InventoryService,
    public dialog: MatDialog, private utlService: UtilitiesService,
    private fb: FormBuilder, protected purchaseService: PurchaseService,
    private loader: NgxUiLoaderService) {
    this.masterParams = new MasterParams();
    this.grnForm = this.forminit();
    this.subSink = new SubSink();
    this.grnCls = new grn();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  forminit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      pONo: ['', [Validators.maxLength(30)]],
      supplier: ['', [Validators.required, Validators.maxLength(60)]],
      currency: ['', [Validators.required, Validators.maxLength(20)]],
      exchRate: ['1.0000'],
      isVatable: [false],
      delNoteNo: [''],
      suppInvNo: [''],
      proformaInvNo: [''],
      itemCategory: ['', Validators.required],
      remarks: [''],
      mode: ['View']
    });
  }

  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.grnForm.get('mode')!.valueChanges.subscribe((mode: string) => {
      if (mode === 'Add') {
        this.grnForm.get('tranNo')!.disable(); // Disable 'tranNo'
      } else {
        this.grnForm.get('tranNo')!.enable(); // Enable 'tranNo'
      }
    });
    this.loadData();

  }
  reset() {
    this.grnForm.reset();
    this.grnForm = this.forminit();
    // this.grnForm.reset();

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
      item: 'ST103'
    };
    const curbody = {
      ...this.commonParams(),
      Item: "CURRENCY",
      mode: this.grnForm.get('mode')?.value
    };
    const service1 = this.invService.getModesList(modebody);
    const service2 = this.invService.GetMasterItemsList(curbody);
    this.subSink.sink = forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        this.modes = res1.data;
        this.currencyList = res2.data;
      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }

  prepareGrnCls() {
    this.grnCls.company = this.userDataService.userData.company;
    this.grnCls.location = this.userDataService.userData.location;
    this.grnCls.langID = this.userDataService.userData.langId;
    this.grnCls.refNo = this.userDataService.userData.sessionID;
    this.grnCls.user = this.userDataService.userData.userID;
    this.grnCls.mode = this.grnForm.controls['mode'].value;
    this.grnCls.tranNo = this.grnForm.controls['tranNo'].value;
    const transformedDate = this.datePipe.transform(this.grnForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.grnCls.tranDate = transformedDate.toString();
    } else {
      this.grnCls.tranDate = ''; // or any default value you prefer
    }
    this.grnCls.pONo = this.grnForm.controls['pONo'].value || '';
    this.grnCls.currency = this.grnForm.controls['currency'].value;
    this.grnCls.exchRate = this.grnForm.controls['exchRate'].value;
    this.grnCls.isVatable = this.grnForm.controls['isVatable'].value;
    this.grnCls.delNoteNo = this.grnForm.controls['delNoteNo'].value;
    this.grnCls.suppInvNo = this.grnForm.controls['suppInvNo'].value;
    this.grnCls.proformaInvNo = this.grnForm.controls['proformaInvNo'].value;
    this.grnCls.itemCategory = this.grnForm.controls['itemCategory'].value;
    this.grnCls.tranStatus = "ANY";
    this.grnCls.remarks = this.grnForm.controls['remarks'].value;
  }
  onSubmit() {
    if (this.grnForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareGrnCls();
        this.loader.start();
        this.subSink.sink = this.purchaseService.updateGrn(this.grnCls).subscribe((res: any) => {
          this.loader.stop();

          if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR" || res.status.toUpperCase() === "FAILED") {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
          else {
            if (res.retVal > 100 && res.retVal < 200) {
              this.newTranMsg = res.message;
              this.grnForm.controls['tranNo'].patchValue(res.tranNoNew);
              if (this.grnForm.controls['mode'].value == "Add") {
                this.selMode = 'Add';
                this.modeChange("Modify");
              }
              this.masterParams.tranNo = res.tranNoNew;
              this.getGRNData(this.masterParams, this.grnForm.controls['mode'].value);
              // this.retMessage = res.message;
              this.textMessageClass = "green";
            }
            else {
              this.retMessage = res.message;
              this.textMessageClass = "red";
            }
          }
        });
      }
      catch (ex: any) {
        this.retMessage = "Exception " + ex.message;
        this.textMessageClass = 'red';
      }
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onSearchCilcked() {

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'GRN',
      TranNo: this.grnForm.controls['tranNo'].value,
      Party: "",
      FromDate: this.datePipe.transform(formattedFirstDayOfMonth, 'yyyy-MM-dd'),
      ToDate: this.datePipe.transform(formattedCurrentDate, 'yyyy-MM-dd'),
      TranStatus: "ANY"
    }
    this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR" && res.status.toUpperCase() != "FAILED") {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.getGRNData(this.masterParams, this.grnForm.controls['mode'].value);
        }
        else {
          if (!this.dialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: { tranNum: this.grnForm.controls['tranNo'].value, search: 'GRN Search', TranType: "GRN" }  // Pass any data you want to send to CustomerDetailsComponent
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true && result != undefined) {
                this.dialogOpen = false;
                this.masterParams.tranNo = result;
                this.getGRNData(this.masterParams, this.grnForm.controls['mode'].value);
              }
            });
          }

        }
      } else {
        if (!this.dialogOpen) {
          const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
            width: '90%',
            disableClose: true,
            data: { tranNum: this.grnForm.controls['tranNo'].value, search: 'GRN Search', TranType: "GRN" }  // Pass any data you want to send to CustomerDetailsComponent
          });
          dialogRef.afterClosed().subscribe(result => {
            if (result != true && result != undefined) {
              this.dialogOpen = false;
              this.masterParams.tranNo = result;
              this.getGRNData(this.masterParams, this.grnForm.controls['mode'].value);
            }
          });
        }
      }


    });
  }

  handleTranChange() {
    this.onSearchCilcked();
  }
  bindData(res: any) {
    this.grnForm.patchValue({
      tranNo: res['data'].tranNo,
      tranDate: res['data'].tranDate,
      pONo: res['data'].poNo,
      supplier: res['data'].suppName,
      currency: res['data'].currency,
      exchRate: res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      isVatable: res['data'].isVatable,
      delNoteNo: res['data'].delNoteNo,
      suppInvNo: res['data'].suppInvNo,
      proformaInvNo: res['data'].proformaInvNo,
      itemCategory: res['data'].itemCategory,
      remarks: res['data'].remarks
    });

    this.grnStatus = res['data'].tranStatus;
    this.grnCls.suppCode = res.data.supplier;
    this.grnCls.supplier = res.data.supplier;
    this.goodsCost = res.data.goodsCost;
    this.commonCharges = res.data.cmnCharges;
    this.itemCharges = res.data.charges;
    this.totalAmount = res.data.amount;
  }

  getGRNData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.purchaseService.getGrnData(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "FAIL" || res.status.toUpperCase() === "ERROR") {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        else {
          this.bindData(res);
          this.textMessageClass = "green";
          if (mode != 'View') {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = res.message;
          }
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = "red";

    }

  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<GrnDetailsComponent> = this.dialog.open(GrnDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: {
        mode: this.grnForm.controls['mode'].value, status: this.grnStatus, vat: this.grnForm.controls['isVatable'].value,
        tranNum: this.grnForm.controls['tranNo'].value, search: 'GRN Search', TranType: "GRN"
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.dialogOpen = false;
        this.masterParams.tranNo = this.grnForm.controls['tranNo'].value;
        this.newTranMsg = "Modified Successfully";
        this.getGRNData(this.masterParams, this.grnForm.controls['mode'].value);
      }
    });
  }

  onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: "SUPPLIER",
      item: this.grnForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() != "FAIL") {
          if (res && res.data && res.data.nameCount === 1) {
            this.grnForm.controls['supplier'].patchValue(res.data.selName);
            this.grnCls.suppCode = res.data.selCode;
            this.grnCls.supplier = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.grnForm.controls['supplier'].value, 'PartyType': "SUPPLIER",
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.grnForm.controls['supplier'].patchValue(result.partyName);
                  this.grnCls.suppCode = result.code;
                  this.grnCls.supplier = result.code;
                }
              });
            }

          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  handleSuppChange() {
    this.onSupplierSearch();
  }
  getPurchaseOrderData(masterParams: MasterParams) {
    this.loader.start();
    this.subSink.sink = this.purchaseService.getPurchaseHeaderData(masterParams).subscribe((res: any) => {
      this.loader.stop();
      if (res && res.data && res.status.toUpperCase() === "SUCCESS") {
        this.grnForm.patchValue({
          tranNo: res['data'].tranNo,
          tranDate: res['data'].tranDate,
          // pONo: res['data'].poNo,
          supplier: res['data'].suppName,
          currency: res['data'].currency,
          exchRate: res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
          isVatable: res['data'].isVatable,
          delNoteNo: res['data'].delNoteNo,
          suppInvNo: res['data'].suppInvNo,
          proformaInvNo: res['data'].proformaInvNo,
          itemCategory: res['data'].tranCategory,
          remarks: res['data'].remarks
        });
        this.grnCls.suppCode = res.data.supplier;
        this.grnCls.supplier = res.data.supplier;

      }
    })
  }
  onAuthorizedPOSearch() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'POAUTHORIZED',
      TranNo: this.grnForm.controls['tranNo'].value,
      Party: this.grnCls.suppCode || "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() != "FAIL") {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.grnForm.controls['pONo'].patchValue(res.data.selTranNo);
          this.getPurchaseOrderData(this.masterParams);
        }
        else {
          this.retMessage = '';
          if (!this.dialogOpen) {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                tranNum: this.grnForm.controls['pONo'].value, party: this.grnForm.controls['supplier'].value,
                search: 'Authorized PO Search', TranType: "POAUTHORIZED"
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true && result != undefined) {
                this.grnForm.controls['pONo'].patchValue(result);
                this.masterParams.tranNo = result;
                this.getPurchaseOrderData(this.masterParams);
                // this.getGRNData(this.masterParams);
              }
              this.dialogOpen = false;
            });
          }

        }
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = 'red';
      }
    });
  }


  clear() {
    this.grnForm = this.forminit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.goodsCost = 0;
    this.commonCharges = 0;
    this.totalAmount = 0;
    this.itemCharges = 0;
    this.grnStatus = "";
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.grnForm.controls['mode'].value, tranNo: this.grnForm.controls['tranNo'].value, search: 'GRN Docs', tranType: "GRN" }
    });

  }

  modeChange(event: string) {
    if (event === "Add") {
      // this.reset();
      //  this.grnForm = this.forminit();
      this.clear();
      this.grnForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.grnForm.get('tranNo')!.patchValue('');
      this.grnForm.get('tranNo')!.disable();
      this.grnForm.get('tranNo')!.clearValidators();
      this.grnForm.get('tranNo')!.updateValueAndValidity();
      this.grnForm.controls['tranDate'].patchValue(new Date());
      this.loadData();

    }
    else {
      this.grnForm.get('tranNo')!.enable();
      this.grnForm.get('tranNo')!.clearValidators();
      this.grnForm.get('tranNo')!.updateValueAndValidity();
      this.grnForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST103",
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
        'mode': this.grnForm.controls['mode'].value,
        'TranType': "GRN",
        'search': "GRN Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "GRN",
        'tranNo': tranNo,
        'search': 'GRN Log Details'
      }
    });
  }

}
