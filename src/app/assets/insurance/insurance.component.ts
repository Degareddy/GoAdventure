import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { SubSink } from 'subsink';
@Component({
  selector: 'app-insurance',
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.css']
})
export class InsuranceComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  tranNo!: any[];
  aihForm!: FormGroup;
  bonusCode!: any;
  textMessageClass: string = "";
  retMessage: string = "";
  tranStatus: string = "";
  insType: Item[] = [];
  subSink = new SubSink();
  @Input() max: any;
  tomorrow = new Date();
  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private masterService: MastersService, public dialog: MatDialog,
    private fb: FormBuilder, private userDataService: UserDataService,
    private loader: NgxUiLoaderService, private datePipe: DatePipe,
    protected assetService: AssetsService) {
    this.masterParams = new MasterParams();
    this.aihForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      insType: ['', [Validators.required, Validators.maxLength(32)]],
      tranDate: [new Date(), [Validators.required]],
      insCompany: ['', [Validators.required, Validators.maxLength(10)]],
      policyNo: ['', [Validators.required, Validators.maxLength(18)]],
      effectiveDate: [new Date(), [Validators.required]],
      expiryDate: [new Date(), [Validators.required]],
      annualPremium: ['0.00'],
      policyAmt: ['0.00'],
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
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST503'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }

    catch (ex) {
    }

  }
  reset() {
    this.assetInsData(this.masterParams);
  }
  get() {
    this.masterParams.tranNo = this.aihForm.controls['tranNo'].value;
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    //console.log(this.masterParams);
    try {

      this.loader.start();
      this.subSink.sink = this.assetService.getinsurancehdr(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.masterParams.item = this.aihForm.controls['tranNo'].value;
          this.aihForm.controls['mode'].setValue("View");
          this.aihForm.controls['insType'].setValue(res['data'].insType);
          this.aihForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.aihForm.controls['insCompany'].setValue(res['data'].insCompany);
          this.aihForm.controls['policyNo'].setValue(res['data'].policyNo);
          this.aihForm.controls['effectiveDate'].setValue(res['data'].effectiveDate);
          this.aihForm.controls['expiryDate'].setValue(res['data'].expiryDate);
          this.aihForm.controls['annualPremium'].setValue(res['data'].annualPremium);
          this.aihForm.controls['policyAmt'].setValue(res['data'].policyAmt);
          this.aihForm.controls['tranStatus'].setValue(res['data'].tranStatus);
          this.aihForm.controls['notes'].setValue(res['data'].notes);
          this.textMessageClass = 'green';
          this.retMessage = 'Retriving data ' + res.message + ' has completed';
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }


      })
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }
  onSubmit() {
    //console.log(this.aihForm.value);
    if (this.aihForm.valid) {
      const sessionData = {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        langId: this.userDataService.userData.langId,
        user: this.userDataService.userData.userID
      };
      const requestData = {
        ...sessionData,
        ...this.aihForm.value
      };
      this.loader.start();
      this.subSink.sink = this.assetService.updateinsurance(requestData).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal >= 100) {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
        else {
          this.textMessageClass = 'green';
          this.retMessage = res.message;
        }
      });
    }
  }
  close() {
    this.router.navigateByUrl('/home');
  }

  onUpdate() {

  }
  assetInsData(InsAssets: MasterParams) {

    this.loader.start();
    try {
      this.subSink.sink = this.assetService.getinsurancehdr(InsAssets).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.aihForm.controls['insType'].setValue(res['data'].insType);
          this.aihForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.aihForm.controls['insCompany'].setValue(res['data'].insCompany);
          this.aihForm.controls['policyNo'].setValue(res['data'].policyNo);
          this.aihForm.controls['effectiveDate'].setValue(res['data'].effectiveDate);
          this.aihForm.controls['expiryDate'].setValue(res['data'].expiryDate);
          this.aihForm.controls['annualPremium'].setValue(res['data'].annualPremium);
          this.aihForm.controls['policyAmt'].setValue(res['data'].policyAmt);
          this.aihForm.controls['tranStatus'].setValue(res['data'].tranStatus);
          this.aihForm.controls['notes'].setValue(res['data'].notes);
          this.textMessageClass = 'green';
          this.retMessage =
            'Retriving data ' + res.message + ' has completed';
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


  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {

    try {
      // Get the current date
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
      ...this.commonParams(),
        TranType: 'ASSETINS',
        TranNo: this.aihForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.subSink.sink = this.assetService.GetTranCount(body).subscribe((res: any) => {
        if (res.status != "fail") {
          if (res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.assetInsData(this.masterParams);
          }
          else {
            // this.reset
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.aihForm.controls['tranNo'].value, 'TranType': "ASSETINS",
                'search': 'Asset Insurance Search'
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.masterParams.item = result;
                try {
                  this.assetInsData(this.masterParams);
                }
                catch (ex: any) {
                  this.retMessage = ex.message;
                  this.textMessageClass = 'red';
                }
              }

            });
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST503",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
}


