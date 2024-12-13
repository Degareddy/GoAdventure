import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserData } from '../../payroll.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { MastersService } from 'src/app/Services/masters.service';
import { PurchaseService } from 'src/app/Services/purchase.service';

@Component({
  selector: 'app-ot-register-details',
  templateUrl: './ot-register-details.component.html',
  styleUrls: ['./ot-register-details.component.css']
})
export class OtRegisterDetailsComponent implements OnInit {

  userData: any;
  masterParams!: MasterParams;
  retMessage!: string;
  textMessageClass!: string;
  purReqHdrForm!: any;
  slNum!: string;

  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;

  constructor(protected purchreqservice: PurchaseService, private fb: FormBuilder, private payService: PayrollService,
    private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any,private masterService: MastersService) {
    this.masterParams = new MasterParams();
    this.purReqHdrForm = this.formInit();
    this.displayColumns = ["slNo", "tranNo", "employee", "fromDateTime", "toDateTime",
      "otHours", "otRate", "otAmount", "remarks"];
  }
  formInit() {
    return this.fb.group({
      // slNo: [''],
      employee: [''],
      fromDateTime: [''],
      toDateTime: [''],
      otHours: [''],
      otRate: [''],
      otAmount: [''],
      remarks: ['']
      // pendingQty: [''],
      // orderingQty: [''],
      // amount: [''],
      // remarks: ['']
    });
  }
  ngOnInit(): void {
    //console.log(this.data);
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    this.get(this.data);
  }
  get(tarnNO: string) {
    this.masterParams.tranNo = tarnNO;
    this.masterParams.langId = this.userData.langId;;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    // //console.log(this.masterParams);
    try {
      this.loader.start();
      this.payService.GetOTRegisterDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        this.dataSource = res['data'];
        this.dataSource = new MatTableDataSource(res['data']);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.matsort;
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }

  }
  onSubmit() {
    //console.log(this.purReqHdrForm.value);
    const sessionData = {
      company: this.userData.company,
      location: this.userData.location,
      langId: 1,
      tranNo: this.masterParams.tranNo,
      slNo: this.slNum,
      mode: "Modify",
      user: this.userData.userID
    };

    // Merge session data with form data
    const requestData = {
      ...sessionData,
      ...this.purReqHdrForm.value
    };

    //console.log(requestData); // This will contain both form and session data

    this.loader.start();
    try {
      this.purchreqservice.insertPurchaseDetails(requestData).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        if (res.retVal < 100) {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
        if (res.retVal >= 100 && res.retVal <= 200) {
          this.retMessage = res.message;
          this.textMessageClass = "green";
          this.get(this.masterParams.tranNo);
        }

      });
    } catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex;
      this.textMessageClass = "red";
    }

  }
  onRowClick(row: any, i: number) {
    //console.log(row, i);
    this.selectedRowIndex = i;
    this.slNum = row.slNo;
    this.purReqHdrForm.patchValue(row);
  }
}
