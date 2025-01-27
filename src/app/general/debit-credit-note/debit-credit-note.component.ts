import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, ScreenId, searchType, TextClr, Type } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
// import { TransactionDetails } from '../purchase.class';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { DatePipe } from '@angular/common';
import { TransactionDetails } from 'src/app/purchase/purchase.class';

@Component({
  selector: 'app-debit-credit-note',
  templateUrl: './debit-credit-note.component.html',
  styleUrls: ['./debit-credit-note.component.css']
})
export class DebitCreditNoteComponent implements OnInit {
 creditNoteForm!: FormGroup;
  masterParams!: MasterParams;
  tranStatus: string = "";
  modes: Item[] = [];
  tranTypeList: Item[] = [
    { itemCode: "CREDIT", itemName: "Credit Note" },
    { itemCode: "DEBIT", itemName: "Debit Note" }
  ];
  currencyList: Item[] = [];
  private subSink = new SubSink();
  retMessage: string = "";
  textMessageClass: string = "";
  tomorrow = new Date();
  creditCls: TransactionDetails = new TransactionDetails();
  private dialogOpen: boolean = false;
  private custCode: string = "";
  constructor(private fb: FormBuilder, private dialog: MatDialog, private datePipe: DatePipe,
    private userDataService: UserDataService, private router: Router, private utlService: UtilitiesService,
    private masterService: MastersService, private purService: PurchaseService, private loader: NgxUiLoaderService) {
    this.creditNoteForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  async searchData() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'TENINV',
      TranNo: this.creditNoteForm.controls['tranNo'].value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "Open"
    }
    try {
      this.subSink.sink = await this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            // this.getInvoiceData(this.masterParams, this.creditNoteForm.controls.mode.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.creditNoteForm.controls['tranNo'].value, 'TranType': "TENINV",
                  'search': 'Tenant Invoice Search'
                }
              });
              this.tranStatus = "";
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true && result != undefined) {
                  this.creditNoteForm.controls["tranNo"].patchValue(result);
                  this.masterParams.tranNo = result;
                  try {
                    // this.getInvoiceData(this.masterParams, this.creditNoteForm.controls.mode.value);
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
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  async loadData() {
    const service1 = this.masterService.getModesList({ ...this.commonParams(), item: ScreenId.CREDIT_NOTE_SCRID });
    const service2 = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.CURRENCY, mode: this.creditNoteForm.get('mode')?.value });
    this.subSink.sink = await forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res1.data;
        } else {
          this.displayMessage(displayMsg.ERROR + "Modes List " + res1.message, TextClr.red);
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.currencyList = res2.data;
          if (this.currencyList.length === 1) {
            this.creditNoteForm.get('currency')!.patchValue(this.currencyList[0].itemCode);
          }

        } else {
          this.displayMessage(displayMsg.ERROR + "Currency List " + res1.message, TextClr.red);
        }

      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );

  }

  async onClientSearch() {
    const body = {
      ...this.commonParams(),
      Type: Type.TENANT,
      item: this.creditNoteForm.controls['client'].value || ""
    }
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.creditNoteForm.controls['client'].patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  PartyName: this.creditNoteForm.controls['client'].value || "", PartyType: Type.TENANT,
                  search: searchType.TENANT
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true && result != undefined) {
                  this.displayMessage("", "");
                  this.creditNoteForm.controls['client'].patchValue(result.partyName);
                  this.custCode = result.code;
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
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranType: ['', Validators.required],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      client: [''],
      currency: ['', Validators.required],
      exchRate: ['1.0000'],
      refTranNo: [''],
      remarks: ['']
    });
  }
  ngOnInit(): void {
    this.loadData();
  }
  modeChange(event: any) {

  }
  Clear() {
    this.displayMessage("", "");
    this.creditNoteForm = this.formInit();
    this.custCode = "";
  }

  Close() {
    this.router.navigateByUrl('/home');
  }
  Delete() {

  }
  prepareCls() {
    this.creditCls.company = this.userDataService.userData.company;
    this.creditCls.location = this.userDataService.userData.location;
    this.creditCls.user = this.userDataService.userData.userID;
    this.creditCls.refNo = this.userDataService.userData.sessionID;
    this.creditCls.currency = this.creditNoteForm.get('currency')?.value;
    this.creditCls.exchRate = this.creditNoteForm.get('exchRate')?.value;
    this.creditCls.mode = this.creditNoteForm.get('mode')?.value;
    this.creditCls.refTranNo = this.creditNoteForm.get('refTranNo')?.value;
    this.creditCls.tranDate = this.creditNoteForm.get('tranDate')?.value;
    this.creditCls.tranType = this.creditNoteForm.get('tranType')?.value;
    this.creditCls.client = this.custCode;
    this.creditCls.remarks = this.creditNoteForm.get('remarks')?.value;
  }
  onSubmit() {
    if (this.creditNoteForm.invalid) {
      return;
    }
    else {
      try {
        this.loader.start();
        this.prepareCls();
        this.subSink.sink = this.purService.UpdateCreditDebitNote(this.creditCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }

  }

}
