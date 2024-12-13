import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AssetsService } from 'src/app/Services/assets.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserData } from 'src/app/admin/admin.module';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';

@Component({
  selector: 'app-asset-lease-details',
  templateUrl: './asset-lease-details.component.html',
  styleUrls: ['./asset-lease-details.component.css']
  // providers: [
  //   { provide: DateAdapter, useClass: AppDateAdapter },
  //   { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  // ]
})
export class AssetLeaseDetailsComponent implements OnInit {
  userData: any;
  masterParams!: MasterParams;
  retMessage!: string;
  textMessageClass!: string;
  assetLeasedtForm!: any;
  slNum!: string;
  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;

  constructor(protected assetservice: AssetsService, private fb: FormBuilder,
    private loader: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.assetLeasedtForm = this.formInit();
    this.displayColumns = ["slNo", "tranNo", "assetID", "traceNo", "returnDate", "retCondition",
      "leaseAmount", "damageCharges", "totalAmount", "paidAmount", "balAmount"];

  }

  formInit() {
    return this.fb.group({

      //company: ['', [Validators.required, Validators.maxLength(12)]],
      //location: ['', [Validators.required, Validators.maxLength(12)]],
      // langID: ['', [Validators.required]],
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      slNo: ['', [Validators.required]],
      assetID: ['', [Validators.required, Validators.maxLength(10)]],
      traceNo: ['', [Validators.required, Validators.maxLength(10)]],
      returnDate: ['', [Validators.required]],
      retCondition: ['', [Validators.required, Validators.maxLength(10)]],
      leaseAmount: [''],
      damageCharges: [''],
      totalAmount: [''],
      paidAmount: [''],
      balAmount: [''],
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
  get(tranNo: string) {

    this.masterParams.tranNo = tranNo;
    this.masterParams.langId = this.userData.langId;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    //console.log(this.masterParams);
    try {
      this.loader.start();
      this.assetservice.getassetleasedt(this.masterParams).subscribe((res: any) => {
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
    //console.log(this.assetLeasedtForm.value);
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
      ...this.assetLeasedtForm.value
    };

    //console.log(requestData); // This will contain both form and session data

    this.loader.start();
    try {
      this.assetservice.Updateassetleasedt(requestData).subscribe((res: any) => {
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
    this.assetLeasedtForm.patchValue(row);
  }
  reset(){
    this.assetLeasedtForm = this.formInit();
    this.assetLeasedtForm.reset();
  }
}
