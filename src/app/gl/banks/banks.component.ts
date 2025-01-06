import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { AdminService } from 'src/app/Services/admin.service';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { MastersService } from 'src/app/Services/masters.service';
// import { UserData } from 'src/app/admin/admin.module';
import { SubSink } from 'subsink';
import { BankDepositsDetailsComponent } from '../depoits/bank-deposits-details/bank-deposits-details.component';
import { BankClass } from '../gl.class';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-banks',
  templateUrl: './banks.component.html',
  styleUrls: ['./banks.component.css']
})
export class BanksComponent implements OnInit, OnDestroy {
  bankForm!: FormGroup;
  @ViewChild('frmClear') public bnkFrm !: NgForm;
  // userData!: UserData;
  private subSink!: SubSink;
  modes: Item[] = [];
  bankList: Item[] = [];
  bankStatus!: string;
  private bankCls!: BankClass;
  retMessage: string = "";
  textMessageClass: string = "";
  @Input() max: any;
  tomorrow = new Date();
  newTranMsg !: string;

  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private userDataService: UserDataService,
    public dialog: MatDialog, private adminService: AdminService, private glService: GeneralLedgerService,
    private masterService: MastersService,private datePipe:DatePipe,
    protected router: Router) {
    this.bankForm = this.formInit();
    this.subSink = new SubSink();
    this.bankCls = new BankClass();

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
  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<BankDepositsDetailsComponent> = this.dialog.open(BankDepositsDetailsComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: tranNo  // Pass any data you want to send to CustomerDetailsComponent
    });
  }

  ngOnInit(): void {
    this.loadData();
  }
  loadData() {
    const bankbody: getPayload = {
      ...this.commonParams(),
      item: "BANK",
      mode:this.bankForm.get('mode')?.value
    };
    const Modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM401'
    };
    const service1 = this.masterService.getModesList(Modebody);
    const service2 = this.adminService.GetMasterItemsList(bankbody);
    this.subSink.sink = forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        this.modes = res1.data;
        this.bankList = res2.data;
      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }

  bankChange() {
    this.bankValue(this.bankForm.controls['mode'].value)
  }
  bankValue(mode: string) {
    const body: getPayload = {
      ...this.commonParams(),
      item: this.bankForm.get('list')!.value
    }
    this.loader.start();
    this.subSink.sink = this.glService.getBankDetails(body).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === 'SUCCESS') {
        this.bankForm.patchValue({
          code: res['data'].code,
          name: res['data'].bankName,
          Date: res['data'].effectiveDate,
          website: res['data'].website,
          notes: res['data'].notes,
          cashHandles: res['data'].cashHandles,
          notCashHandles: res['data'].notCashHandles
        });
        this.bankStatus = res['data'].bankStatus;
        if (mode != 'View' && this.newTranMsg != "") {
          this.retMessage = this.newTranMsg;
          this.textMessageClass = 'green';
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'green';
        }
      }
      else {
        this.handleError(res);
      }
    })
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      list: [''],
      code: [{ value: '', disabled: true }, Validators.required],
      name: ['', Validators.required],
      Date: [new Date(), Validators.required],
      website: [''],
      notes: [''],
      notCashHandles: [false],
      cashHandles: [false]
    });
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  Reset() {
    this.bankForm = this.formInit();
    this.bnkFrm.resetForm();
    this.newTranMsg = "";
    this.bankStatus = "";
    this.clearMsg();
  }
  prepareBankCls() {
    this.bankCls.company = this.userDataService.userData.company;
    this.bankCls.location = this.userDataService.userData.location;
    this.bankCls.refNo = this.userDataService.userData.sessionID;
    this.bankCls.user = this.userDataService.userData.userID;
    this.bankCls.mode = this.bankForm.get('mode')!.value;
    this.bankCls.bankName = this.bankForm.get('name')!.value;
    this.bankCls.cashHandles = this.bankForm.get('cashHandles')!.value;
    this.bankCls.notCashHandles = this.bankForm.get('notCashHandles')!.value;
    this.bankCls.code = this.bankForm.get('code')!.value;

    const transformedDate = this.datePipe.transform(this.bankForm.controls['Date'].value, 'yyyy-MM-dd');
		if (transformedDate !== undefined && transformedDate !== null) {
		  this.bankCls.effectiveDate = transformedDate.toString();
		} else {
		  this.bankCls.effectiveDate = ''; // or any default value you prefer
		}
    this.bankCls.effectiveDate = this.bankForm.get('Date')!.value;
    this.bankCls.website = this.bankForm.get('website')!.value;
    this.bankCls.notes = this.bankForm.get('notes')!.value;
    this.bankCls.bankStatus = this.bankStatus;
    this.bankCls.langID = this.userDataService.userData.langId;
  }
  onSubmit() {
    this.clearMsg();
    if (this.bankForm.invalid) {
      return;
    }
    else {
      this.prepareBankCls();
      this.loader.start();
      this.subSink.sink = this.glService.UpdateBankDetails(this.bankCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.newTranMsg = res.message;
          if (this.bankForm.get('mode')!.value == "Add") {
            this.modeChange("Modify");
            this.bankList.push({ itemCode: this.bankForm.get('code')!.value, itemName: this.bankForm.get('name')!.value })
            this.bankForm.controls['list'].patchValue(this.bankForm.get('code')!.value);
          }
          else {
            this.bankValue(this.bankForm.get('mode')!.value)
          }
        }
        else {
          this.handleError(res);
        }
      });
    }
  }
  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }
  accounts() {
    const dialogRef: MatDialogRef<BankAccountsComponent> = this.dialog.open(BankAccountsComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': this.bankForm.get('code')!.value, 'mode': this.bankForm.get('mode')!.value, 'status': this.bankStatus }  // Pass any data you want to send to CustomerDetailsComponent
    });
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.bankStatus = '';
      this.bankForm = this.formInit();
      this.bankForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bankForm.controls['list'].disable({ emitEvent: false });
      this.bankForm.controls['code'].enable({ emitEvent: false });
      this.clearMsg();
      this.loadData();

    } else {
      this.bankForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bankForm.controls['code'].disable({ emitEvent: false });
      this.bankForm.controls['list'].enable({ emitEvent: false });
    }
  }
  Clear() {
    this.bankForm = this.formInit();
    this.bankStatus = "";
    this.clearMsg();
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM401",
        // Page: "Bank",
        // SlNo: 43,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
