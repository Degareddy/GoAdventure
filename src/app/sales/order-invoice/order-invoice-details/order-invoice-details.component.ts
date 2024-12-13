import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
    this.oidDetForm = this.formInit();

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
  }
  onUpdate() {

  }
  reset() {
    this.oidDetForm.reset();
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
