import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { OtRegisterDetailsComponent } from './ot-register-details/ot-register-details.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { Router } from '@angular/router';
import { MasterParams } from 'src/app/modals/masters.modal';

@Component({
  selector: 'app-ot-register',
  templateUrl: './ot-register.component.html',
  styleUrls: ['./ot-register.component.css']
})
export class OtRegisterComponent implements OnInit, OnDestroy {
  otrForm!: FormGroup;
    masterParams!: MasterParams;

  modes: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  status!: string;
  private subSink!: SubSink;


  public disableDetail: boolean = true;
  dialogOpen = false;
  slNo:string=''
  @Input() max: any;
  tomorrow = new Date();
  public fetchStatus: boolean = true;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private masterService: MastersService,
     protected router: Router,
    private loader: NgxUiLoaderService, private payService: PayrollService, private userDataService: UserDataService) {
    this.otrForm = this.formInit();
    this.subSink = new SubSink();
        this.masterParams = new MasterParams();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      notes: [''],
      mode: ['View']
    })
  }
  ngOnInit(): void {
    this.loadData();
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  loadData() {

    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST602'
    };

    try {
      const service1 = this.masterService.getModesList(modebody);
      this.subSink.sink = forkJoin([service1]).subscribe((results: any[]) => {
        const res1 = results[0];
        this.modes = res1.data;
      });
    } catch (ex) {

    }
  }
  onUpdate() {
    if(this.otrForm.invalid){
      return;
    }
    const body={
      "Mode":this.otrForm.get('mode')?.value,
      "Company":this.userDataService.userData.company,
      "Location":this.userDataService.userData.location,
      "TranNo":this.otrForm.get('tranNo')?.value,
      "TranDate":this.otrForm.get('tranDate')?.value,
      "Notes":this.otrForm.get('notes')?.value,
      "User":this.userDataService.userData.userID,
      "RefNo":this.userDataService.userData.sessionID
    }
    try {
            this.loader.start();
            this.subSink.sink = this.payService.UpdateOTRegister(body).subscribe((res: any) => {
              this.loader.stop();
              if (res.status.toUpperCase() === "SUCCESS") {
                this.retMessage = res.message;
                if (this.otrForm.get('mode')?.value === "Add") {
                  this.otrForm.get('mode')?.patchValue('Modify');
                  this.otrForm.get('tranNo')?.patchValue('')
                  
                }
                this.getOtRegister(this.otrForm.get('tranNo')?.value, this.otrForm.get('mode')?.value);
    
                this.textMessageClass = 'green';
              } else {
                this.retMessage = res.message;
                this.textMessageClass = 'red';
              }
            });
          } catch (ex: any) {
            this.loader.stop();
            this.retMessage = ex.message;
            this.textMessageClass = 'red';
          }

  }
  getOtRegister(otCOde: string, mode: string) {
    const body={
     "item":otCOde,
     "tranType":"PAYROLLOTREG",
     "Company":this.userDataService.userData.company,
      "Location":this.userDataService.userData.location,
      "User":this.userDataService.userData.userID,
      "RefNo":this.userDataService.userData.sessionID

    }
   
    try {
      this.loader.start();
      this.subSink.sink = this.payService.GetOTRegister(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          
          if (mode != 'View' && this.retMessage != "") {
            this.textMessageClass = 'green';
            this.retMessage = res.message;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage = "Bonus type data is retrieved successfully for " + res['data'].bonusName;
          }

        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }

  get() {
    const body = {
      ...this.commonParams(),
      TranNo: this.otrForm.controls['tranNo'].value,
    };
    this.loader.start();
    this.subSink.sink = this.payService.GetOTRegister(body).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === "SUCCESS") {
        this.textMessageClass = "green";
        this.retMessage = res.message;
        this.otrForm.patchValue(res.data);
      }
      else{
        this.textMessageClass = "red";
        this.retMessage = res.message;
      }
    });
  }
  onDetailsCilcked(value: string) {

    const dialogRef: MatDialogRef<OtRegisterDetailsComponent> = this.dialog.open(OtRegisterDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: value
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  reset() {
    // this.otrForm.reset();
    this.otrForm = this.formInit();
    this.textMessageClass="";
    this.retMessage="";
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.otrForm.controls['mode'].value, tranNo: this.otrForm.controls['tranNo'].value, search: 'OT-Register Docs', tranType: "OTREGISTER" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST602",
        Page: "OT Register",
        SlNo: 65,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
}
