import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-pricing-details',
  templateUrl: './pricing-details.component.html',
  styleUrls: ['./pricing-details.component.css']
})
export class PricingDetailsComponent implements OnInit {
  prcDetForm!: FormGroup;
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
    this.prcDetForm = this.formInit();
    this.displayColumns = ["langID", "priceID", "prodCode", "rate", "actions"];

  }
  formInit() {
    return this.fb.group({
      mode: ['view'],
      company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      langID: ['', [Validators.required]],
      priceID: ['', [Validators.required, Validators.maxLength(10)]],
      prodCode: ['', [Validators.required, Validators.maxLength(10)]],
      rate: [''],
    })
  }
  ngOnInit(): void {
  }
  onUpdate() {

  }
  reset() {
    this.prcDetForm.reset();
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
