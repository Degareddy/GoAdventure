import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { SubSink } from 'subsink';
import { UserData } from '../payroll.module';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { InventoryService } from 'src/app/Services/inventory.service';
import { LonesClass, loanDetails } from '../payroll.class';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { LoanDetailsComponent } from './loan-details/loan-details.component';
import { GuranteersComponent } from './guranteers/guranteers.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loan',
  templateUrl: './loan.component.html',
  styleUrls: ['./loan.component.css']
})
export class LoanComponent implements OnInit,OnDestroy {
  lnHdrForm!: FormGroup;
  modes!: any[];
  textMessageClass!: string;
  retMessage!: string;
  tranStatus!: string;
  public disableDetail: boolean = true;
  dialogOpen = false;
  @Input() max: any;
  tomorrow = new Date();
  public fetchStatus: boolean = true;

  private subSink!: SubSink;
  userData: any;
  loanCls!: LonesClass;
  masterParams!: MasterParams;


  constructor(private fb: FormBuilder, public dialog: MatDialog, private masterService: MastersService,  protected router: Router,
    private loader: NgxUiLoaderService, private payService: PayrollService, private datePipe: DatePipe, private invService: InventoryService) {
    this.lnHdrForm = this.formInit();
    this.subSink = new SubSink();
    this.loanCls = new LonesClass();
    this.masterParams = new MasterParams();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      // company: [''],
      //location: [''],
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      employee: ['',],
      designation: ['',],
      department: ['',],
      empType: ['', [Validators.required, Validators.maxLength(10)]],
      tranDate: ['', [Validators.required]],
      appliedOn: ['', [Validators.required]],
      sanctionOn: ['', [Validators.required]],
      deductionFrom: ['', [Validators.required, Validators.maxLength(10)]],
      fromYear: ['', [Validators.required]],
      totalInstallments: ['', [Validators.required]],
      paidInstallments: ['', [Validators.required]],
      balInstallments: ['', [Validators.required]],
      loanAmount: [''],
      interestType: ['', [Validators.required, Validators.maxLength(18)]],
      interestRate: [''],
      totalToPay: [''],
      totalPaid: [''],
      balToPay: [''],
      tranStatus: [''],
      notes: [''],
      mode: ['View']

    })
  }
  loadData() {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    const modebody = {
      company: this.userData.company,
      location: this.userData.location,
      item: 'ST604',
      user: this.userData.userID,
      refNo: this.userData.sessionID,
    };

    try {
      const service1 = this.masterService.getModesList(modebody);
      // const service2 = this.masterService.GetMasterItemsList(empbody);
      this.subSink.sink = forkJoin([service1]).subscribe((results: any[]) => {
        const res1 = results[0];
        // const res2 = results[1];
        this.modes = res1.data;
        // //console.log(res2);
        // this.empList = res2.data;
        // if (this.empList) {
        //   this.filteredEMPList = this.plrHdrForm.get('employee').valueChanges.pipe(
        //     startWith(''),
        //     map((value: any) => {
        //       const name = typeof value === 'string' ? value : value?.itemName;
        //       return name ? this.filterEmployee(name as string) : this.empList.slice();
        //     }),
        //   );
        // }
      });

    } catch (ex) {

    }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  searchData() {
    this.masterParams.tranNo = this.lnHdrForm.controls['tranNo'].value;
    this.masterParams.langId = this.userData.langId;;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    try {
      this.loader.start();
      this.payService.GetLoans(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        if (res.status.toUpperCase() === "SUCCESS") {
          // this.stockTransferForm.setValue(res['data']);
          this.lnHdrForm.controls['employee'].setValue(res['data'].employee);
          this.lnHdrForm.controls['designation'].setValue(res['data'].designation);
          this.lnHdrForm.controls['department'].setValue(res['data'].department);
          this.lnHdrForm.controls['empType'].setValue(res['data'].empType);
          this.lnHdrForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.lnHdrForm.controls['appliedOn'].setValue(res['data'].appliedOn);
          this.lnHdrForm.controls['sanctionOn'].setValue(res['data'].sanctionOn);
          this.lnHdrForm.controls['deductionFrom'].setValue(res['data'].deductionFrom);
          this.lnHdrForm.controls['fromYear'].setValue(res['data'].fromYear);
          this.lnHdrForm.controls['totalInstallments'].setValue(res['data'].totalInstallments);
          this.lnHdrForm.controls['paidInstallments'].setValue(res['data'].paidInstallments);
          this.lnHdrForm.controls['balInstallments'].setValue(res['data'].balInstallments);
          this.lnHdrForm.controls['loanAmount'].setValue(res['data'].loanAmount);
          this.lnHdrForm.controls['interestType'].setValue(res['data'].interestType);
          this.lnHdrForm.controls['interestRate'].setValue(res['data'].interestRate);
          this.lnHdrForm.controls['totalToPay'].setValue(res['data'].totalToPay);
          this.lnHdrForm.controls['totalPaid'].setValue(res['data'].totalPaid);
          this.lnHdrForm.controls['balToPay'].setValue(res['data'].balToPay);
          this.lnHdrForm.controls['tranStatus'].setValue(res['data'].tranStatus);
          this.tranStatus = res['data'].tranStatus;
          this.lnHdrForm.controls['mode'].setValue('View');
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
      this.retMessage = ex;
    }

  }
  modeChange(event: string) {
    //console.log(event.value);
    if (event === "Add") {
      this.reset();
      this.lnHdrForm.controls['mode'].setValue(event);
      this.lnHdrForm.get('tranNo')!.disable();
      this.lnHdrForm.get('tranNo')!.clearValidators();
      this.lnHdrForm.get('tranNo')!.updateValueAndValidity();
    }
  }
  ngOnInit(): void {
    this.loadData();
  }

    Close() {
      this.router.navigateByUrl('/home');
  

  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST604",
        Page: "Loans",
        SlNo: 67,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  onDetailsCilcked() {
    //console.log();
    const dialogRef: MatDialogRef<LoanDetailsComponent> = this.dialog.open(LoanDetailsComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: {
        tranNum: this.lnHdrForm.controls['tranNo'].value, TranType: "loan",
        search: 'Loan Search',
        mode: this.lnHdrForm.controls['mode'].value
      }
      //data: tranNo  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });

  }

  GuranteersCilcked() {
    ////console.log(tranNo);
    const dialogRef: MatDialogRef<GuranteersComponent> = this.dialog.open(GuranteersComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: {
        tranNum: this.lnHdrForm.controls['tranNo'].value, TranType: "loan",
        search: 'Loan Search',
        mode: this.lnHdrForm.controls['mode'].value
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }

  onSubmit() {
    if (this.lnHdrForm.valid) {
      // this.WerehouseForm.patchValue(this.WerehouseForm.value);
      //console.log(this.lnHdrForm.value);
      this.loanCls.mode = this.lnHdrForm.controls['mode'].value;
      this.loanCls.company = this.userData.company;
      this.loanCls.location = this.userData.location;
      this.loanCls.tranNo = this.lnHdrForm.controls['tranNo'].value;
      this.loanCls.employee = this.lnHdrForm.controls['employee'].value;
      this.loanCls.designation = this.lnHdrForm.controls['designation'].value;
      this.loanCls.department = this.lnHdrForm.controls['department'].value;
      this.loanCls.empType = this.lnHdrForm.controls['empType'].value;
      this.loanCls.tranDate = this.lnHdrForm.controls['tranDate'].value;
      this.loanCls.appliedOn = this.lnHdrForm.controls['appliedOn'].value;
      this.loanCls.sanctionOn = this.lnHdrForm.controls['sanctionOn'].value;
      this.loanCls.deductionFrom = this.lnHdrForm.controls['deductionFrom'].value;
      this.loanCls.fromYear = this.lnHdrForm.controls['fromYear'].value;
      this.loanCls.totalInstallments = this.lnHdrForm.controls['totalInstallments'].value;
      this.loanCls.paidInstallments = this.lnHdrForm.controls['paidInstallments'].value;
      this.loanCls.balInstallments = this.lnHdrForm.controls['balInstallments'].value;
      this.loanCls.loanAmount = this.lnHdrForm.controls['loanAmount'].value;
      this.loanCls.interestType = this.lnHdrForm.controls['interestType'].value;
      this.loanCls.interestRate = this.lnHdrForm.controls['interestRate'].value;
      this.loanCls.totalToPay = this.lnHdrForm.controls['totalToPay'].value;
      this.loanCls.totalPaid = this.lnHdrForm.controls['totalPaid'].value;
      this.loanCls.balToPay = this.lnHdrForm.controls['balToPay'].value;
      this.loanCls.notes = this.lnHdrForm.controls['notes'].value;
      this.loanCls.user = this.userData.userID;
      this.loanCls.refNo = this.userData.sessionID;
      //console.log(this.loanCls);
      try {
        this.loader.start();
        this.payService.UpdateLoans(this.loanCls).subscribe((res: any) => {
          this.loader.stop();
          //console.log(res);
          if (res.retVal === 4) {
            this.retMessage = res.message;
            this.textMessageClass = 'green';
            // this.toastr.success(res.message, "SUCCESS")
          } else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
            // this.toastr.error(res.message, "ERROR")
          }
        });
      } catch (ex: any) {
        this.loader.stop();
        this.retMessage = ex;
        this.textMessageClass = 'red';
        // this.toastr.info(ex, "Execption")
      }
    }
  }
  get() {

  }
  insert() {

  }
  reset() {
    this.tranStatus = '';
    this.retMessage = '';
    this.lnHdrForm.reset();
  }

  onDocsCilcked(value:string){
    // //console.log(tranNo);
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      height: '90%', // Set the height of the dialog
      disableClose: true,
      data: { mode: this.lnHdrForm.controls['mode'].value, tranNo: this.lnHdrForm.controls['tranNo'].value, search: 'LOAN Docs', tranType: "LOANS" }
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
   }
}
