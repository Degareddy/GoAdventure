import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

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
      private subSink: SubSink = new SubSink();
  
  constructor(private fb: FormBuilder,private userDataService:UserDataService,  protected router: Router,
    private masterService:MastersService
  ) {
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
    const body: getPayload = {
                      ...this.commonParams(),
                      item: 'SM001'
                    };
                    try {
                      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
                        if (res.status.toUpperCase() === "SUCCESS") {
                          this.modes = res['data'];
                        }
                      });
                      // this.masterParams.item = this.ahdForm.controls['bonusCode'].value;
                    }
                
                    catch (ex: any) {
                      //console.log(ex);
                      this.retMessage = ex.message;
                      this.textMessageClass = "red";
                    }
           
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  onUpdate() {

  }
  Close() {
    this.router.navigateByUrl('/home');

  }
  reset() {
    this.ppartForm.reset();
  }
}
