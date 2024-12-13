import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserData } from 'src/app/payroll/payroll/payroll.module';

@Component({
  selector: 'app-expense-analysis',
  templateUrl: './expense-analysis.component.html',
  styleUrls: ['./expense-analysis.component.css']
})
export class ExpenseAnalysisComponent implements OnInit {
  analysisForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  userData!:any;
  @ViewChild('frmClear') public analysisfrm !: NgForm;

  constructor(private fb: FormBuilder,public dialog :MatDialog) {
    this.analysisForm = this.formInit();

  }

  ngOnInit(): void {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData=JSON.parse(storedUserData) as UserData

    }
  }
  formInit() {
    return this.fb.group({
      report: [''],
      tranNo: [''],
      FromDate: [''],
      ToDate: [''],
      fromExpense: [''],
      ToExpense: [''],
      branch: ['']
    })
  }
  onSubmit() {

  }
  Close() {

  }
  Reset() {
    this.analysisForm = this.formInit();
    this.analysisfrm.resetForm();
  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SR401",
        // Page: "Expense Analysis",
        // SlNo: 52,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}

