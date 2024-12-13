import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { UserData } from '../payroll.module';

@Component({
  selector: 'app-pay-slip',
  templateUrl: './pay-slip.component.html',
  styleUrls: ['./pay-slip.component.css']
})
export class PaySlipComponent implements OnInit {
  psdForm!: any;
  masterParams!: MasterParams;
  modes!: any[];
  userData: any;
  bonusCode!: any;
  modeIndex!: number;
  textMessageClass!: string;
  retMessage!: string;
  @Input() max: any;
  tomorrow = new Date();
  constructor(private fb: FormBuilder,public dialog: MatDialog) {
    this.psdForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      refNo: ['', [Validators.required, Validators.maxLength(18)]],
      employee: ['', [Validators.required, Validators.maxLength(10)]],
      department: ['', [Validators.required, Validators.maxLength(20)]],
      designation: ['', [Validators.required, Validators.maxLength(20)]],
      empType: ['', [Validators.required, Validators.maxLength(20)]],
      payID: ['', [Validators.required, Validators.maxLength(10)]],
      payType: ['', [Validators.required, Validators.maxLength(10)]],
      basicPay: [''],
      isTaxable: [''],
      flatOrPercent: ['', [Validators.required, Validators.maxLength(10)]],
      rate: [''],
      amount: [''],
      grossPay: [''],
      taxablePay: [''],
      taxAmount: [''],
      deductedAmt: [''],
      netPay: [''],
      mMonth: ['', [Validators.required, Validators.maxLength(10)]],
      mYear: ['', [Validators.required]],
      payDate: ['', [Validators.required]],
      payMode: ['', [Validators.required, Validators.maxLength(24)]],
      perAmount: [''],
      tranStatus: ['', [Validators.required, Validators.maxLength(10)]],
      tranDate: ['', [Validators.required]],
      mode: ['view']
    })
  }
  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
  }
  onUpdate() {

  }
  reset() {
    this.psdForm.reset();
  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST605",
        Page: "Pay Slip",
        SlNo: 68,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
}
