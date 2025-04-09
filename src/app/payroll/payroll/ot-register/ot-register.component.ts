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
import { DatePipe } from '@angular/common';
import { displayMsg, Mode, TextClr, TranStatus, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';

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
  detdialogOpen = false;


  public disableDetail: boolean = true;
  dialogOpen = false;
  slNo:string=''
  @Input() max: any;
  tomorrow = new Date();
  tranStatus!: string;
  public fetchStatus: boolean = true;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private masterService: MastersService,
     protected router: Router,private datePipe: DatePipe,
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
    this.displayMessage("", "");
        // this.OTREGISTERForm = this.formInit();
        
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
        const formattedCurrentDate = this.formatDate(currentDate);
        const body = {
          Company: this.userDataService.userData.company,
          Location: this.userDataService.userData.location,
          TranType: Type.OTREGISTER,
          TranNo: this.otrForm.controls['tranNo'].value,
          Party: "",
          FromDate: formattedFirstDayOfMonth,
          ToDate: formattedCurrentDate,
          TranStatus: TranStatus.ANY,
          User: this.userDataService.userData.userID,
          RefNo: this.userDataService.userData.sessionID
        }
        this.subSink.sink = this.payService.GetTranCount(body).subscribe((res: any) => {
          if (res.retVal === 0) {
            if (res && res.data && res.data.tranCount === 1) {
              this.masterParams.tranNo = res.data.selTranNo;
              this.getOtRegData(this.masterParams, this.otrForm.controls['mode'].value);
            }
            else {
              this.openSearch();
            }
          }
          else {
            this.openSearch();
          }
        });
  }
  getOtRegData(masterParams: MasterParams, mode: string) {
      this.loader.start();
      try {
        this.subSink.sink = this.payService.GetOTRegister(masterParams).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
            // this.expCls = res['data'];
            this.tranStatus = res['data'].tranStatus;
            this.otrForm.controls['tranNo'].patchValue(res['data'].tranNo);
            
            this.textMessageClass = 'green';
            if (mode.toUpperCase() != Mode.view) {
              this.retMessage = res.message;
            }
            else {
              this.retMessage = 'Retriving data ' + res.message + ' has completed';
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    openSearch() {
        if (!this.detdialogOpen) {
          const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
            width: '90%',
            disableClose: true,
            data: {
              tranNum: this.otrForm.get('tranNo')?.value,
              search: 'OTREGISTER Search', TranType: Type.OTREGISTER
            }
          });
          this.detdialogOpen = true;
          dialogRef.afterClosed().subscribe(result => {
            this.detdialogOpen = false;
            if (result != true && result != undefined) {
              // console.log(result);
              this.masterParams.tranNo = result;
              this.getOtRegData(this.masterParams, this.otrForm.controls['mode'].value);
            }
    
          });
        }
      }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
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
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
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
