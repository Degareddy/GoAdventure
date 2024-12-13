import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-customer-opening',
  templateUrl: './customer-opening.component.html',
  styleUrls: ['./customer-opening.component.css']
})
export class CustomerOpeningComponent implements OnInit {
  customerOpeningForm!: FormGroup;
  @Input() max: any;
  @Input() min: any;
  mindate = new Date('2024-01-10');
  today = new Date();
  tomorrow = new Date();
  constructor(private fb: FormBuilder) {
    this.customerOpeningForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      mode: ['', Validators.required],
      tranNo: ['', Validators.required],
      date: [''],
      notes: [''],
      status: ['']
    });
  }
  ngOnInit(): void {
  }
  onSubmit() {

  }
  refresh() {
    this.customerOpeningForm.reset();
  }
  Reset() {
    this.customerOpeningForm.reset();
  }
}
