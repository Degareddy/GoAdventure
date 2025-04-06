import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';
import { financialPeriod } from '../gl.class';
import { FinancialDetailsComponent } from './financial-details/financial-details.component';

@Component({
  selector: 'app-fin-periods',
  templateUrl: './fin-periods.component.html',
  styleUrls: ['./fin-periods.component.css']
})
export class FinPeriodsComponent implements OnInit, OnDestroy {
  finPeriodsForm !: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  private subSink: SubSink;
  masterParams!: MasterParams;
  modes: Item[] = [];
  fineList: Item[] = [];
  @ViewChild('frmClear') public wrhFrm !: NgForm;
  retMessage: string = "";
  textMessageClass: string = "";
  status: string = "";
  tranNewMessage: string = "";
  private finCls: financialPeriod = new financialPeriod();
  constructor(private fb: FormBuilder,
    private loader: NgxUiLoaderService, 
    private datePipe: DatePipe,
    private glService: GeneralLedgerService,
    private masterService: MastersService, public dialog: MatDialog, private userDataService: UserDataService,
    protected router: Router) {
    this.finPeriodsForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      list: [''],
      yearCode: ['', Validators.required],
      description: ['', Validators.required],
      From: [new Date(), Validators.required],
      To: [new Date(), Validators.required],
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
  ngOnInit(): void {
   this.loadData();
  }
  loadData(){
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST110',
    };

    const periodBody: getPayload = {
      ...this.commonParams(),
      item: "FINYEAR",
      mode:this.finPeriodsForm.get('mode')?.value
    };

    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(periodBody);
      this.subSink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          this.modes = res1.data;
          this.fineList = res2.data;
        },
        (error: any) => {
          this.loader.stop();
          this.retMessage = error.message;
          this.textMessageClass = 'red';
        }
      );

    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  modeChange(event: string) {
    if (this.finPeriodsForm.get('mode')?.value === "Add") {
      this.clearMsg();
      this.finPeriodsForm = this.formInit();
      this.finPeriodsForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.finPeriodsForm.get('list')?.disable();
      this.loadData();

    }
    else {
      this.finPeriodsForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.finPeriodsForm.get('list')?.enable();

    }
  }
  getDetails() {
    this.getFinancialDetails(this.finPeriodsForm.get('mode')?.value, this.finPeriodsForm.get('list')?.value)
  }
  getFinancialDetails(mode: string, finCode: string) {
    const body = {
      ...this.commonParams(),
      item: finCode
    }
    this.subSink.sink = this.glService.GetFinancialYearsData(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.finPeriodsForm.patchValue({
          list: res.data.finYrCode,
          yearCode: res.data.finYrCode,
          description: res.data.finYrDesc,
          From: res.data.fromDate,
          To: res.data.toDate,
          notes: res.data.notes
        });
        this.status = res.data.yrStatus;
        if (mode != 'View' && this.tranNewMessage != "") {
          this.retMessage = this.tranNewMessage;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }

      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  prepareCls() {
    this.finCls.company = this.userDataService.userData.company;
    this.finCls.location = this.userDataService.userData.location;
    this.finCls.user = this.userDataService.userData.userID;
    this.finCls.refNo = this.userDataService.userData.sessionID;
    this.finCls.mode = this.finPeriodsForm.get('mode')?.value;
    this.finCls.finYrCode = this.finPeriodsForm.get('yearCode')?.value;
    this.finCls.finYrDesc = this.finPeriodsForm.get('description')?.value;
    // this.finCls.fromDate = this.finPeriodsForm.get('From')?.value;

    const transformedFromDate = this.datePipe.transform(this.finPeriodsForm.controls['From'].value, 'yyyy-MM-dd');
    if (transformedFromDate !== undefined && transformedFromDate !== null) {
      this.finCls.fromDate = transformedFromDate.toString();
    } else {
      this.finCls.fromDate = '';
    }

    // this.finCls.toDate = this.finPeriodsForm.get('To')?.value;
    const transformedToDate = this.datePipe.transform(this.finPeriodsForm.controls['To'].value, 'yyyy-MM-dd');
    if (transformedToDate !== undefined && transformedToDate !== null) {
      this.finCls.toDate = transformedToDate.toString();
    } else {
      this.finCls.toDate = '';
    }
    
    this.finCls.notes = this.finPeriodsForm.get('notes')?.value;
  }
  onSubmit() {
    if (this.finPeriodsForm.invalid) {
      return;
    }
    else {
      this.prepareCls();
      this.loader.start();
      this.subSink.sink = this.glService.UpdateFinancialYears(this.finCls).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.tranNewMessage = res.message;
          if (this.finPeriodsForm.get('mode')?.value === "Add") {
            this.modeChange('Modify');
            this.fineList.push({ itemCode: res.tranNoNew, itemName: res.tranNoNew });
            this.finPeriodsForm.get('yearCode')?.patchValue(res.tranNoNew);
          }
          this.getFinancialDetails(this.finPeriodsForm.get('mode')?.value, res.tranNoNew);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });

    }
  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<FinancialDetailsComponent> = this.dialog.open(FinancialDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'yearCode': this.finPeriodsForm.controls['list'].value, 'search': "Period Details",
        'mode': this.finPeriodsForm.controls['mode'].value, 'status': this.status
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        // this.saleData(this.masterParams, this.finPeriodsForm.get('mode')?.value);
      }
    });
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  Clear() {
    this.clearMsg();
    this.finPeriodsForm = this.formInit();
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  Reset() {
    this.finPeriodsForm = this.formInit();
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM405",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        // Page: "Financial Periods",
        // SlNo: 44,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
}
