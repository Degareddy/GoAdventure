import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-pay-particular',
  templateUrl: './pay-particular.component.html',
  styleUrls: ['./pay-particular.component.css']
})
export class PayParticularComponent implements OnInit {
  ppartForm!: FormGroup;
  modes!: any[];
  textMessageClass!: string;
  retMessage!: string;
  @Input() max: any;
  tomorrow = new Date();
  constructor(private fb: FormBuilder) {
    this.ppartForm = this.formInit();
  }
  formInit() {
    return this.fb.group({
      company: ['', [Validators.required, Validators.maxLength(10)]],
      location: ['', [Validators.required, Validators.maxLength(10)]],
      payID: ['', [Validators.required, Validators.maxLength(10)]],
      payDesc: ['', [Validators.required, Validators.maxLength(50)]],
      payOn: ['', [Validators.required, Validators.maxLength(10)]],
      payType: ['', [Validators.required, Validators.maxLength(10)]],
      payBy: ['', [Validators.required, Validators.maxLength(10)]],
      taxable: [''],
      isMandatory: [''],
      payValue: [''],
      createdDate: ['', [Validators.required]],
      tranStatus: ['', [Validators.required, Validators.maxLength(10)]],
      notes: ['', [Validators.required, Validators.maxLength(512)]],
      mode: ['view']
    })
  }
  ngOnInit(): void {
  }

  onUpdate() {

  }
  insert() {

  }
  reset() {
    this.ppartForm.reset();
  }
}
