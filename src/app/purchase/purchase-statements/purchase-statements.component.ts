import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-purchase-statements',
  templateUrl: './purchase-statements.component.html',
  styleUrls: ['./purchase-statements.component.css']
})
export class PurchaseStatementsComponent implements OnInit {
  statementForm!: FormGroup;
  constructor(private fb: FormBuilder) {
    this.statementForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      partyType: [''],
      copyTo: [''],
      fromParty: [''],
      toParty: [''],
      fromDate: [''],
      toDate: ['']
    });
  }
  ngOnInit(): void {
  }
  refresh() {
    this.statementForm.reset();
  }
  onSubmit() {

  }
}
