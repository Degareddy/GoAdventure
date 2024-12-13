import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-bank-deposits-details',
  templateUrl: './bank-deposits-details.component.html',
  styleUrls: ['./bank-deposits-details.component.css']
})
export class BankDepositsDetailsComponent implements OnInit,OnDestroy {
  depDetForm!: FormGroup;
  retMessage!: string;
  textMessageClass!: string;
  modeIndex!: number;
  modes: any = [];
  tblData: any;
  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  constructor(private fb: FormBuilder) {
    this.depDetForm = this.formInit();
    this.displayColumns = ["langID", "tranNo", "slNo", "tranType", "refTranNo", "party", "chequeNo", "chequeDate", "chequeAmount", "chequeStatus", "activityDate", "remarks", "actions"];

  }
  ngOnDestroy(): void {
  }
  formInit() {
    return this.fb.group({
      tranNo: ['', [Validators.required, Validators.maxLength(18)]],
      slNo: ['', [Validators.required]],
      tranType: ['', [Validators.required, Validators.maxLength(10)]],
      refTranNo: ['', [Validators.required, Validators.maxLength(18)]],
      party: ['', [Validators.required, Validators.maxLength(10)]],
      chequeNo: ['', [Validators.required, Validators.maxLength(18)]],
      chequeDate: ['', [Validators.required]],
      chequeAmount: [''],
      chequeStatus: ['', [Validators.required, Validators.maxLength(10)]],
      activityDate: ['', [Validators.required]],
      remarks: [''],
    })
  }
  ngOnInit(): void {
  }
  onUpdate() {

  }
  reset() {
    this.depDetForm.reset();
  }
  Close() {

  }
  onViewClicked() {

  }
  onEditClicked() {

  }
  onDeleteClicked() {

  }
}
