import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AdminService } from 'src/app/Services/admin.service';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { MastersService } from 'src/app/Services/masters.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';

@Component({
  selector: 'app-reconciliation',
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit, OnDestroy {
  reconForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  private subSink!: SubSink;
  modes: Item[] = [];
  bankList: Item[] = [];
  currencyList: Item[] = [];
  totalEntries: number = 0;
  status: string = '';
  tctBankCode: string = "";
  retMessage: string = "";
  textMessageClass: string = "";
  dialogOpen: boolean = false;
  masterParams!: MasterParams;
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private userDataService: UserDataService,
    public dialog: MatDialog, private adminService: AdminService, private glService: GeneralLedgerService,
    private datePipe: DatePipe,
    private masterService: MastersService,
    protected router: Router) {
    this.reconForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  modeChange(mode: string) {
    if (mode === "Add") {
      // this.reset();
      this.reconForm.get('mode')!.patchValue(mode, { emitEvent: false });
      this.reconForm.get('tranNo')!.patchValue('');
      this.reconForm.get('tranNo')!.disable();
      this.reconForm.get('tranNo')!.clearValidators();
      this.loadData();
    }
    else {
      this.reconForm.get('mode')!.patchValue(mode, { emitEvent: false });
      this.reconForm.get('tranNo')!.enable();
    }
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      bank: ['', Validators.required],
      bankAccountNo: ['', Validators.required],
      currency: ['', Validators.required],
      tranDate: [new Date(), Validators.required],
      totalEntries: [''],
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
    const bankbody: getPayload = {
      ...this.commonParams(),
      item: "BANK",
      mode:this.reconForm.get('mode')?.value
    };
    const Modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM401'
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY",
      mode:this.reconForm.get('mode')?.value
    };
    const service3 = this.adminService.GetMasterItemsList(curbody)
    const service1 = this.masterService.getModesList(Modebody);
    const service2 = this.adminService.GetMasterItemsList(bankbody);
    this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        this.modes = res1.data;
        this.bankList = res2.data;
        this.currencyList = res3.data;
      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }
  ngOnInit(): void {

    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  onAccountSearch() {
    const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'PartyName': this.reconForm.get('bank')!.value, 'PartyType': "ACCOUNT",
        'search': 'Account Search'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != true) {
        this.reconForm.get('bankAccountNo')!.patchValue(result.partyName);
        this.tctBankCode = result.code;
      }
    });
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  onTranSearch() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'RECONCILE',
      TranNo: this.reconForm.get('tranNo')!.value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        // //console.log(res);
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.getReconcileData(this.masterParams, this.reconForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.reconForm.get('tranNo')!.value, 'TranType': "RECONCILE",
                  'search': 'RECONCILE Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.reconForm.get("tranNo")!.patchValue(result);
                  this.masterParams.tranNo = result;
                  try {
                    this.getReconcileData(this.masterParams, this.reconForm.get('mode')?.value);
                  }
                  catch (ex: any) {
                    this.retMessage = "Exception " + ex.message;
                    this.textMessageClass = 'red';
                  }
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
  getReconcileData(masterParams: MasterParams, mode: string) {
    try {
      this.subSink.sink = this.glService.GetBankReconcilliationHeader(masterParams).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.textMessageClass = "green";
          this.retMessage = res.message;
        }
        else {
          this.textMessageClass = "res";
          this.retMessage = res.message;
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = "res";
      this.retMessage = ex.message;
    }


  }
  Clear() {
    this.reconForm.reset();
    this.reconForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
  }
  onSubmit() {
    if (this.reconForm.invalid) {
      return;
    }
    else {
      const body = {
        ...this.commonParams(),
        TranNo: this.reconForm.get('tranNo')!.value,
        TranDate:this.formatDate(this.reconForm.get('tranDate')!.value),
        BankCode: this.reconForm.get('bank')!.value,
        AccountNo: this.tctBankCode,
        Currency: this.reconForm.get('currency')!.value,
        Remarks: this.reconForm.get('notes')!.value,
        Mode: this.reconForm.get('mode')!.value
      }
      this.loader.start();
      this.subSink.sink = this.glService.UpdateBankReconcilliationHdr(body).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }

      });
    }

  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST403",
        // Page: "Reconciliation",
        // SlNo: 48,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
