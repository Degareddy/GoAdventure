import { Component, OnDestroy, OnInit } from '@angular/core';
import {  FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  chPassForm!: FormGroup
  textMessageClass: string="";
  retMessage: string="";

  private subSink: SubSink;
  showPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService,public userDataService: UserDataService,
     private utilityService: UtilitiesService,private router:Router,private toaster: ToastrService,) {
    this.chPassForm = this.formInit();
    this.subSink = new SubSink();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  ngOnInit(): void {
  }

  formInit() {
    return this.fb.group({
      // oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      cnfrmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: this.passwordsMatchValidator.bind(this)
    });
  }
  Clear(){
    this.retMessage="";
    this.textMessageClass="";
    this.chPassForm = this.formInit();
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const passwordControl = formGroup.get('newPassword');
    const confirmPasswordControl = formGroup.get('cnfrmPassword');
    if (passwordControl && confirmPasswordControl) {
      const password = passwordControl.value;
      const confirmPassword = confirmPasswordControl.value;
      const minLength = 6;
      const isLengthValid = password.length >= minLength && confirmPassword.length >= minLength;
      const passwordsMatch = password === confirmPassword;
      if (!isLengthValid) {
        return { minLength: true };
      } else if (!passwordsMatch) {
        return { mismatch: true };
      }
    }
    return null;
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
 async onSubmit() {
   this.displayMessage("", "");
    if (this.chPassForm.invalid) {
      this.displayMessage("Please enter valid details", TextClr.red);
      return;
    }
    else {
      const body = {
        company: this.userDataService.userData.company,
        location: this.userDataService.userData.location,
        userId: this.userDataService.userData.userID,
        oldPassword: '',
        newPassword: this.chPassForm.controls['newPassword'].value,
        confirmPassword: this.chPassForm.controls['cnfrmPassword'].value,
        user: this.userDataService.userData.userID,
        refNo: this.userDataService.userData.sessionID
      }
      this.loader.start();
      this.subSink.sink =await this.utilityService.UpdatePassword(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          this.toaster.success("Password changed successfully,Login Again", "Success");
          this.router.navigateByUrl('/');
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });

    }

  }
  Close() {
     this.router.navigateByUrl('/home');
  }
}
