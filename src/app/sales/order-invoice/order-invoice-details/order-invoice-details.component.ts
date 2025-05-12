import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Router } from '@angular/router';


@Component({
  selector: 'app-order-invoice-details',
  templateUrl: './order-invoice-details.component.html',
  styleUrls: ['./order-invoice-details.component.css']
})
export class OrderInvoiceDetailsComponent implements OnInit, OnDestroy {
  oidDetForm!: FormGroup;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  private subSink!: SubSink;
  dialogOpen = false;
  SlNo:number=0
  

  constructor(private fb: FormBuilder, 
        protected router: Router,
       private loader: NgxUiLoaderService
    ,private userregisterService: UserDataService ,@Inject(MAT_DIALOG_DATA) public data: any, private dialog: MatDialog,private salesservice: SalesService) {
    this.oidDetForm = this.formInit();
    this.subSink=new SubSink();
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
  formInit() {
    return this.fb.group({
      mode: ['view'],
      company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      langID: ['', [Validators.required]],
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      saleNo: ['', [Validators.required, Validators.maxLength(18)]],
      slNo: ['', [Validators.required]],
      issueNo: ['', [Validators.required, Validators.maxLength(18)]],
      issueDate: ['', [Validators.required]],
      issueValue: [''],
      vATAmount: [''],
      totalAmount: [''],
    })
  }

  ngOnInit(): void {
    this.loaddata()
  }
  onUpdate() {
    const body={
      "Company":this.userregisterService.userData.company,
      "Location":this.userregisterService.userData.location,
      "LangId":this.userregisterService.userData.langId,
      "TranNo":this.data.tranNo,
      "User":this.userregisterService.userData.userID,
      "RefNo":this.userregisterService.userData.sessionID,
      "Mode":this.data.mode,
      "SlNo":this.SlNo,
      "IssueNo":this.oidDetForm.get('issueNo')?.value,
      "IssueDate":this.oidDetForm.get('issueDate')?.value,
      "IssueValue":this.oidDetForm.get('issueValue')?.value,
      "VATAmount":this.oidDetForm.get('vATAmount')?.value,
      "TotalAmount":this.oidDetForm.get('totalAmount')?.value,
    }
    try {
      this.loader.start();
          this.subSink.sink = this.salesservice.UpdateOrderInvoiceDetails(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              if (res && res.data && res.data.nameCount === 1) {
                this.retMessage=res.message
                this.textMessageClass = 'green';
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
  loaddata(){
    const body={
      "Company":this.userregisterService.userData.company,
      "Location":this.userregisterService.userData.location,
      "LangId":this.userregisterService.userData.langId,
      "TranNo":this.data.tranNo,
      "User":this.userregisterService.userData.userID,
      "RefNo":this.userregisterService.userData.sessionID
    }
    try {
      this.loader.start();
          this.subSink.sink = this.salesservice.GetOrderInvoiceDetails(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() === "SUCCESS") {
              if (res && res.data && res.data.nameCount === 1) {
                this.retMessage=res.message
                this.textMessageClass = 'green';
    
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
  reset() {
    this.oidDetForm.reset();
  }
  Close() {
    this.router.navigateByUrl('/home');

  }
  onViewClicked() {

  }
  onEditClicked() {

  }
  onDeleteClicked() {

  }
}
