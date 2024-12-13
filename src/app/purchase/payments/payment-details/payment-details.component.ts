import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UserData } from 'src/app/admin/admin.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-payment-details',
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.css']
})
export class PaymentDetailsComponent implements OnInit, OnDestroy {
  userData: any;
  pmtDetailsForm!: FormGroup;
  masterParams!: MasterParams;
  slNo!: string;

  private subsink: SubSink = new SubSink();
  retMessage!: string;
  textMessageClass!: string;

  constructor(protected pmtService: PurchaseService, private fb: FormBuilder,
    private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.pmtDetailsForm = this.formInit();

  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({

      payNo: ['', [Validators.required, Validators.maxLength(18)]],
      // slNo: ['', [Validators.required]],
      refDocNo: ['', [Validators.required, Validators.maxLength(18)]],
      refDocDate: ['', [Validators.required]],
      payDueDate: ['', [Validators.required]],
      currency: ['', [Validators.required, Validators.maxLength(12)]],
      exchRate: [''],
      docAmt: [''],
      balAmt: [''],
      payAmt: [''],
      remarks: ['', [Validators.required, Validators.maxLength(255)]],
    })
  }
  ngOnInit(): void {
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
      this.subsink.sink = this.pmtService.GetPaymetsDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        // this.dataSource = res['data'];
        // this.dataSource = new MatTableDataSource(res['data']);
        // this.dataSource.paginator = this.paginator;
        // this.dataSource.sort = this.matsort;
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
    this.slNo = row.slNo;
    this.pmtDetailsForm.patchValue(row);
  }

}
