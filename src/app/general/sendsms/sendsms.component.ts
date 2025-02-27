import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { SmsService } from 'src/app/Services/sms.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-sendsms',
  templateUrl: './sendsms.component.html',
  styleUrls: ['./sendsms.component.css']
})
export class SendsmsComponent implements OnInit, OnDestroy {
  smsForm!: FormGroup;
  retMessage: string = "";
  textMessageClass: string = "";
  private subSink!: SubSink;
  labelPosition: 'before' | 'after' = 'after';
  mobile: string = "";
  private respData: any
  private API_KEY: string = "";
  private PARTNER_ID: string = "";
  private SHORTCODE: string = "";
  private smsUrl: string = "";
  private bulkSmsUrl: string = "";
  constructor(private fb: FormBuilder,private snackBar: MatSnackBar, private smsService: SmsService, private toaster: ToastrService,private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { from: string, mode: string, Trantype: string, Property: string, Block: string, Flat: string, type: string, status: string,message:string }) {
    this.smsForm = this.formInit();
    this.subSink = new SubSink();
    // this.smsForm.get('message')?.patchValue(this.data.message);
    // console.log(this.data.message);
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    console.log(this.data.from)
    this.loadData();
    this.refreshData();
    this.smsForm.get('message')?.patchValue(this.data.message);

  }
  refreshData() {
    console.log("DEGA")
    if (this.data.from.toUpperCase() === "UNIT") {
      this.smsForm.get('tenant')?.disable({ emitEvent: false });
      this.smsForm.get('landlord')?.disable({ emitEvent: false });
      this.smsForm.get('tenant')?.setValue(false, { emitEvent: false });
      this.smsForm.get('landlord')?.setValue(false, { emitEvent: false });
      const body = {
        ...this.commonParams(),
        MessageType: "TENGREET",
        property: this.data.Property,
        block: this.data.Block,
        unit: this.data.Flat,
        client: ""

      }
      this.getMobileNumbers(body);
    }
    else if (this.data.from.toUpperCase() === "PROPERTY") {
      this.smsForm.get('tenant')?.enable({ emitEvent: false });
      this.smsForm.get('landlord')?.enable({ emitEvent: false });
      this.smsForm.get('tenant')?.setValue(false, { emitEvent: false });
      this.smsForm.get('landlord')?.setValue(false, { emitEvent: false });
      this.smsForm.get('tenant')?.valueChanges.subscribe((val: boolean) => {
        if (val) {
          this.smsForm.get('landlord')?.disable({ emitEvent: false });
          const body = {
            ...this.commonParams(),
            MessageType: "TENGREET",
            property: this.data.Property,
            block: "",
            unit: "",
            client: ""

          }
          this.getMobileNumbers(body);
        }
        else {
          this.smsForm.get('landlord')?.enable({ emitEvent: false });
          this.clearMsg();
        }

      });
      this.smsForm.get('landlord')?.valueChanges.subscribe((val: boolean) => {
        if (val) {
          this.smsForm.get('tenant')?.disable({ emitEvent: false });
          const body = {
            ...this.commonParams(),
            MessageType: "LLGREET",
            property: this.data.Property,
            block: "",
            unit: "",
            client: ""

          }
          this.getMobileNumbers(body);
        }
        else {
          this.smsForm.get('tenant')?.enable({ emitEvent: false });
          this.clearMsg();
        }
      });
    }


  }
  loadData() {
  const body = {
    ...this.commonParams(),
    serviceType: "SMS",
    MsgType: "SMS"
  }
  try {
    this.subSink.sink = this.smsService.getMessageCredentials(body).subscribe((res: any) => {
      //  console.log(res);
      if (res.status.toUpperCase() === "SUCCESS") {
        this.API_KEY = res.data.apI_KEY;
        this.PARTNER_ID = res.data.partneR_ID;
        this.SHORTCODE = res.data.shortcode;
        this.smsUrl = res.data.apI_SMS_URL;
        this.bulkSmsUrl = res.data.apI_BULK_SMS_URL;
      }
      else {
        // this.retMessage = "SMS credntials are not found!";
        // this.textMessageClass = "red";
      }


    });
  }
  catch (ex: any) {
    this.retMessage = ex.message;
    this.textMessageClass = "red";
  }
  }
  commonParams() {
    return {
      company:this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  getMobileNumbers(body: any) {
    this.mobile = "";
    this.respData = [];
    try {
      this.subSink.sink = this.smsService.getMessagingContacts(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (this.data.from.toUpperCase() === "UNIT") {
            this.mobile = res.data[0].mobile.replace(/[\s+]/g, '');
          }
          else if (this.data.from.toUpperCase() === "PROPERTY") {
            this.respData = res.data;
          }
        }
        else {
          // this.textMessageClass = "red";
          // this.retMessage = "Mobile numbers not available for greet!";
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = "red";
      this.retMessage = ex.message;
    }

  }

  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  noEmptyOrSpacesValidator(control: any) {
    if (!control.value || control.value.trim() === '') {
      return { 'noEmptyOrSpaces': true };
    }
    return null;
  }
  async onSubmit() {
    this.clearMsg();
    if (this.smsForm.valid) {

      if (this.data.from.toUpperCase() === "UNIT") {
        const message = this.smsForm.get('message')?.value.trim() + "\n" + this.userDataService.userData.defaultCompanyName;
        const mobile = this.mobile;
        if (this.mobile) {
          this.sendSMS(message, mobile);
        }
        else {
          this.retMessage = "Mobile number not found for this tenant!";
          this.textMessageClass = "red";
        }
      }
      else if (this.data.from.toUpperCase() === "PROPERTY") {
        

        let count=1
        if (this.respData) {
          const message = this.smsForm.get('message')?.value.trim() + "\n" + this.userDataService.userData.defaultCompanyName;
          for(let i=0;i<this.respData.length;i++) {
            

            count++;
            if(count==5){
              return;
            }
            try {
              await this.sendSMSForProp(message, this.respData[i].mobile);
            } catch (error) {
              console.error("Failed to send SMS to:", this.respData[i].mobile, error);
            }
        
        }
      }
        else {
          this.retMessage = "Mobile numbers are not found for this property!";
          this.textMessageClass = "red";
        }
      }

    }
    else {
      this.retMessage = "Form Invalid";
      this.textMessageClass = "red";
    }
  }
  async sendSMSForProp(message: string, mobile: string): Promise<void> {
    

    return new Promise((resolve, reject) => {
      try {
        if (mobile) {
          const body = {
            ...this.commonParams(),
            message: message,
            mobile: mobile,
            serviceType: "SMS",
            MsgType: "SMS"
          };
          this.subSink.sink = this.smsService.SendSingleSMS(body).subscribe(
            (res: any) => {
              console.log(res);
              if (res.status.toUpperCase() === "SUCCESS") {
                this.toaster.success(res.message, "SUCCESS");
                resolve(); // Resolve the promise when SMS is sent successfully
              } else {
                this.toaster.error('Invalid response format ', "ERROR");
                reject(new Error("Invalid response format"));
              }
            },
            (error) => {
              reject(error); // Reject if there is an error
            }
          );
        } else {
          this.retMessage = "SMS credentials are not found!";
          this.textMessageClass = "red";
          reject(new Error("SMS credentials are not found!"));
        }
      } catch (ex: any) {
        this.textMessageClass = "red";
        this.retMessage = ex.message;
        reject(ex);
      }
    });
  }
  
  sendSMS(message: string, mobile: string) {
    // console.log(this.smsUrl);
    try {
      if (this.mobile) {
        const body = {
          ...this.commonParams(),
          message: message,
          mobile: mobile,
          serviceType: "SMS",
          MsgType: "SMS"
        }
        this.subSink.sink = this.smsService.SendSingleSMS(body).subscribe((res: any) => {
          console.log(res);
          if (res.status.toUpperCase() === "SUCCESS") {
            this.toaster.success(res.message, "SUCCESS")
          } else {
            this.toaster.error('Invalid response format ', "ERROR");
          }
        });
      }
      else {
        this.retMessage = "SMS credentials are not found!";
        this.textMessageClass = "red";
      }
    }
    catch (ex: any) {
      this.textMessageClass = "red";
      this.retMessage = ex.message;
    }
  }
  sendBulkSMS(res: any) {
    if (this.respData) {
      const output: { count?: number; smslist: { [key: string]: any }[] } = {
        smslist: []
      };
      let count = 0;
      let reportData = res;
      for (const item of reportData) {
        const message = this.smsForm.get('message')?.value;
        if (item.mobile) {
          count++;
          const smsObject = {
            partnerID: this.PARTNER_ID,
            apikey: this.API_KEY,
            pass_type: "plain",
            mobile: '+254794465654',
            message: message,
            shortcode: this.SHORTCODE
          };
          output.smslist.push(smsObject);
        }

        if (count > 0) {
          output.count = count;
        }
      }
      // console.log(output);
      const bulkSMSBody={
        ...output,
        strUri:this.bulkSmsUrl
      }
      if (output.smslist.length > 0) {
        try {
          this.subSink.sink = this.smsService.sendBulkSMS(output, this.bulkSmsUrl).subscribe((res: any) => {
            // console.log(res);
            const responses = res.responses;
            const successCount = responses.filter((res: any) => res['response-code'] === 200).length;

            if (successCount > 0) {
              this.snackBar.open(`${successCount} message(s) sent successfully`, 'Close', {
                duration: 10000,
                panelClass: ['mat-toolbar', 'mat-primary'] // customize style here
              });
            } else {
              this.snackBar.open('Failed to send messages', 'Close', {
                duration: 10000,
                panelClass: ['mat-toolbar', 'mat-warn'] // customize style here
              });
            }
          },
          error => {
            this.snackBar.open('Error sending messages', 'Close', {
              duration: 10000,
              panelClass: ['mat-toolbar', 'mat-warn'] // customize style here
            });
            console.error('Error:', error);
          });

        }
        catch (ex: any) {
          this.textMessageClass = "red";
          this.retMessage = ex.message;
        }
      }
      else {
        this.textMessageClass = "red";
        this.retMessage = "Mobile numbers empty!";
      }
    }
    else {
      this.retMessage = "SMS credentials are not found!";
      this.textMessageClass = "red";
    }


  }
  formInit() {
    return this.fb.group({
      message: ['', [Validators.required, this.noEmptyOrSpacesValidator]],
      tenant: [{ value: false, disbled: true }],
      landlord: [{ value: false, disbled: true }]
    });
  }
  Clear() {
    this.smsForm = this.formInit();
    this.clearMsg();
    this.refreshData();
    this.respData = [];
  }
}
