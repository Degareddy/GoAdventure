import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { UserData } from 'src/app/admin/admin.module';
import { Guranteers } from '../../payroll.class';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-guranteers',
  templateUrl: './guranteers.component.html',
  styleUrls: ['./guranteers.component.css']
})
export class GuranteersComponent implements OnInit {
  plgdetForm!: FormGroup
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
  selectedRowIndex: number = -1;
  slNum!: number;
  GuranteersCls!: Guranteers;
  @Input() max: any;
  tomorrow = new Date();
  private subSink!: SubSink;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any, private payService: PayrollService) {
    this.plgdetForm = this.formInit();
    this.GuranteersCls = new Guranteers();
    this.subSink = new SubSink();
    this.displayColumns = ["tranNo", "slNo", "employee", "joinDate", "basic", "lastPay", "remarks", "rowStatus", "rowStatus"];

  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      //company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      slNo: ['', [Validators.required]],
      employee: ['', [Validators.required, Validators.maxLength(10)]],
      joinDate: ['', [Validators.required]],
      basic: [''],
      lastPay: [''],
      remarks: ['',],
      rowStatus: ['',],
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
      this.payService.GetLoanGuaranteers(body).subscribe((res: any) => {
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
  onSubmit() {
    this.GuranteersCls.company = this.userData.company;
    this.GuranteersCls.location = this.userData.location;
    this.GuranteersCls.langID = 1;
    this.GuranteersCls.user = this.userData.userID;
    this.GuranteersCls.refNo = this.userData.sessionID;
    this.GuranteersCls.mode = this.mode;
    this.GuranteersCls.slNo = this.slNum || 0;
    this.GuranteersCls.tranNo = this.plgdetForm.controls['tranNo'].value;
    this.GuranteersCls.slNo = this.plgdetForm.controls['slNo'].value;
    this.GuranteersCls.employee = this.plgdetForm.controls['employee'].value;
    this.GuranteersCls.joinDate = this.plgdetForm.controls['joinDate'].value;
    this.GuranteersCls.basic = this.plgdetForm.controls['basic'].value;
    this.GuranteersCls.lastPay = this.plgdetForm.controls['lastPay'].value;
    this.GuranteersCls.remarks = this.plgdetForm.controls['remarks'].value;
    //this.GuranteersCls.rowStatus = this.plgdetForm.controls['rowStatus'].value;
    //console.log(this.GuranteersCls);
    this.loader.start();
    try {
      this.subSink.sink = this.payService.UpdateLoanGuaranteers(this.GuranteersCls).subscribe((res: any) => {
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
  onRowClick(row: any, i: number) {
    //console.log(row, i);
    this.selectedRowIndex = i;
    this.slNum = row.slNo;
    this.plgdetForm.patchValue(row);
    this.plgdetForm.controls['tranNo'].setValue(row.tranNo);
    // this.loanDetails.instNo = row.instNo;
    // this.materialdetcls.prodName = row.prodName;
    // this.materialdetcls.whNo = row.whNo;
  }
}
