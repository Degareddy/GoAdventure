import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AuthService } from 'src/app/Services/authentication/auth.service';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit,OnDestroy {
  forgotPasswordForm!: FormGroup;
  private subSink: SubSink = new SubSink();
  retMessage: string = "";
  textMessageClass: string = "";
  constructor(private fb: FormBuilder, private authService: AuthService, private master: MastersService, private loader: NgxUiLoaderService) {
    this.forgotPasswordForm = this.fb.group({
      ToEmail: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^(?=[^@]*[a-zA-Z])[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
        ]
      ],

    });
  }
  ngOnDestroy(): void {
  this.subSink.unsubscribe();
  }

  ngOnInit() {
    this.authService.forgotLog();
  }
  async onSubmit() {
    this.retMessage = "";
    this.textMessageClass = "";
    // if (this.forgotPasswordForm.valid) {
    //   this.loader.start();
    //   this.subSink.sink = await this.master.ResetPassword(this.forgotPasswordForm.value).subscribe((res) => {
    //     this.loader.stop();
    //     if (res.status.toUpperCase() == "SUCCESS") {
    //       // this.retMessage = res.message;
    //       this.retMessage = "Mail has been sent. Please check your email at " + this.forgotPasswordForm.controls.ToEmail.value +" for your temporary password."
    //       this.textMessageClass = "green";
    //     }
    //     else {
    //       this.retMessage ="We encountered an issue while trying to send the email. Please try again or contact support if the problem persists.";
    //       this.textMessageClass = "red";
    //     }
    //   })

    // }
    if (this.forgotPasswordForm.valid) {
      this.loader.start();

      try {
        const res = await this.master.ResetPassword(this.forgotPasswordForm.value).toPromise();

        this.loader.stop();

        if (res.status.toUpperCase() === "SUCCESS") {
          this.retMessage = "Mail has been sent. Please check your email at " + this.forgotPasswordForm.controls.ToEmail.value + " for your temporary password.";
          this.textMessageClass = "green";
        } else {
          this.retMessage = "We encountered an issue while trying to send the email. Please try again or contact support if the problem persists.";
          this.textMessageClass = "red";
        }
      } catch (error) {
        this.loader.stop();
        this.retMessage = "An error occurred. Please try again later.";
        this.textMessageClass = "red";
      }
    }

  }
}
