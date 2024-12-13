import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';

@Component({
  selector: 'app-tenant-enquiry',
  templateUrl: './tenant-enquiry.component.html',
  styleUrls: ['./tenant-enquiry.component.css']
})
export class TenantEnquiryComponent implements OnInit {
  tenantForm!:FormGroup;
  @Input() max: any;
  tomorrow = new Date();
textMessageClass: any;
retMessage: any;
  constructor(private fb:FormBuilder) {
    this.tenantForm = this.formInit();
  }

  ngOnInit(): void {
  }
  formInit(){
    return this.fb.group({
      reportType:['',Validators.required],
      fromDate:[new Date(),Validators.required],
      toDate:[new Date(),Validators.required]
    })
  }
  onSubmit() {

  }
  Close() {

  }
}
