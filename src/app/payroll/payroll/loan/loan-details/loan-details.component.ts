import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { UserData } from 'src/app/admin/admin.module';
import { LonesClass, loanDetails } from '../../payroll.class';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.css']
})
export class LoanDetailsComponent implements OnInit {
  pldetForm!: FormGroup
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  modeIndex!: number;
  modes: any = [];
  userData: any;
  tblData: any;
  displayColumns: string[] = [];
  dataSource: any;
  mode!: string;
  slNum!: number;
  loanDelCls!: loanDetails;
  private subSink!: SubSink;
  @Input() max: any;
  tomorrow = new Date();

  selectedRowIndex: number = -1;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any, private payService: PayrollService) {
    this.pldetForm = this.formInit();
    this.loanDelCls = new loanDetails();
    this.subSink = new SubSink();

    this.displayColumns = ["slNo", "tranNo", "instNo", "instMonth", "instYear", "instAmt", "adjustments", "paidAmt", "paidOn", "instStatus", "remarks", "actions"];

  }
  formInit() {
    return this.fb.group({
      //mode: ['View'],
      //company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      slNo: ['', [Validators.required]],
      instNo: ['', [Validators.required]],
      instMonth: ['', [Validators.required, Validators.maxLength(10)]],
      instYear: ['', [Validators.required]],
      instAmt: [''],
      adjustments: [''],
      paidAmt: [''],
      paidOn: ['', [Validators.required]],
      instStatus: ['',],
      remarks: ['',]
    })
  }
  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    //console.log(this.data);
    this.mode = this.data.mode;
    this.get();
  }
  get() {

    //this.pldetForm.tranno = ttranNo;
    //this.mrDet.langID = '1';
    // this.mrhReqForm.company = this.userData.company;
    // this.mrhReqForm.location = this.userData.location;
    //this.mrDet.user = this.userData.userID;
    //this.mrDet.refNo = this.userData.sessionID;
    // //console.log(this.masterParams);
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      User: this.userData.userID,
      TranNo: this.data.tranNum,
      refNo: this.userData.sessionID,
      LangId: 1
    };
    try {
      this.loader.start();
      this.payService.GetLoanDetails(body).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res.data);
        if (res.status === "fail" || res.status === "Error") {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
        else {
          this.dataSource = res['data'];
          this.dataSource = new MatTableDataSource(res['data']);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.matsort;
        }

        // this.mrhForm.setValue(res.data);
        // this.status = res.data.tranStatus;
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }

  }
  onRowClick(row: any, i: number) {
    //console.log(row, i);
    this.selectedRowIndex = i;
    this.slNum = row.slNo;
    this.pldetForm.patchValue(row);
    this.pldetForm.controls['tranNo'].setValue(row.tranNo);
    // this.loanDetails.instNo = row.instNo;
    // this.materialdetcls.prodName = row.prodName;
    // this.materialdetcls.whNo = row.whNo;
  }
  onUpdate() {

  }
  addRequest(){

  }
  onSubmit() {
    this.loanDelCls.company = this.userData.company;
    this.loanDelCls.location = this.userData.location;
    this.loanDelCls.langID = 1;
    this.loanDelCls.user = this.userData.userID;
    this.loanDelCls.refNo = this.userData.sessionID;
    this.loanDelCls.mode = this.mode;
    this.loanDelCls.slNo = this.slNum || 0;
    this.loanDelCls.tranNo = this.pldetForm.controls['tranNo'].value;
    this.loanDelCls.slNo = this.pldetForm.controls['slNo'].value;
    this.loanDelCls.instNo = this.pldetForm.controls['instNo'].value;
    this.loanDelCls.instMonth = this.pldetForm.controls['instMonth'].value;
    this.loanDelCls.instYear = this.pldetForm.controls['instYear'].value;
    this.loanDelCls.instAmt = this.pldetForm.controls['instAmt'].value;
    this.loanDelCls.adjustments = this.pldetForm.controls['adjustments'].value;
    this.loanDelCls.paidAmt = this.pldetForm.controls['paidAmt'].value;
    this.loanDelCls.paidOn = this.pldetForm.controls['paidOn'].value;
    this.loanDelCls.instStatus = this.pldetForm.controls['instStatus'].value;
    this.loanDelCls.remarks = this.pldetForm.controls['remarks'].value;
    // this.purchaseDetCls.remarks = this.mrhReqForm.controls['remarks'].value;
    //console.log(this.loanDelCls);
    this.loader.start();
    try {
      this.subSink.sink = this.payService.UpdateLoanDetails(this.loanDelCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.retVal >= 100 && res.retVal <= 200) {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.get();
          // this.slValue = true;
          // this.getpurchaseDetails(this.masterParams.tranNo);
        }

      });
    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = "red";
    }



  }
  onViewClicked() {

  }
  onEditClicked() {

  }
  onDeleteClicked() {

  }
}
