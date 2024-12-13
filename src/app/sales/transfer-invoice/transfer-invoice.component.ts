import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-transfer-invoice',
  templateUrl: './transfer-invoice.component.html',
  styleUrls: ['./transfer-invoice.component.css']
})
export class TransferInvoiceComponent implements OnInit ,OnDestroy{
  transInvoiceForm!: FormGroup;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  constructor(private fb: FormBuilder) {
    this.transInvoiceForm = this.formInit()
  }
  ngOnDestroy(): void {
  }
  formInit() {
    return this.fb.group({
      mode: [''],
      invoiceNo: [''],
      toBranch: [''],
      invoiceDate: [''],
      itemCount: [''],
      applyVat: [''],
      IssuseStock: [''],
      currency: [''],
      deliveryMethod: [''],
      exchangeRate: [''],
      deliveryNo: [''],
      amountExclVat: [''],
      transporter: [''],
      charges: [''],
      truckNo: [''],
      vatAmount: [''],
      driverName: [''],
      totalAmount: [''],
      driverId: [''],
      totalWeight: [''],
      notes: [''],
      status: ['']

    });
  }
  ngOnInit(): void {
  }
  Close() {

  }
  reset() {
    this.transInvoiceForm.reset();
  }
  onSubmit() {

  }
}
