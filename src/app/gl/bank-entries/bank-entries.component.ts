import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-bank-entries',
  templateUrl: './bank-entries.component.html',
  styleUrls: ['./bank-entries.component.css']
})
export class BankEntriesComponent implements OnInit, OnDestroy {
  bankentryForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  userData!: any;
  private subSink: SubSink;
  masterParams!: MasterParams;
  modes!: any[];
  @ViewChild('frmClear') public bnkFrm !: NgForm;
  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    private masterService: MastersService,

  ) {
    this.bankentryForm = this.formInit();

    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  ngOnInit(): void {
    const body = {
      ...this.commonParams(),
      item: 'ST301'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
      this.masterParams.item = this.bankentryForm.controls['list'].value;
    }
    catch (ex) {
      //console.log(ex);
    }
    this.loadData();
  }

  loadData() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = 'ST110';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    try {
      const service1 = this.masterService.getModesList(this.masterParams);

      this.subSink.sink = forkJoin([service1]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          //const res2 = results[1];

          this.modes = res1.data;

        },
        (error: any) => {
          this.loader.stop();
          // this.toastr.info(error.message, "Error");
        }
      );
    } catch (ex: any) {
      this.loader.stop();
      //this.toastr.info(ex.message, "Exception");
    }

  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date],
      bank: [''],
      notes: [''],
      status: ['']
    })
  }
  Close() {

  }
  Reset() {
    this.bankentryForm = this.formInit();
    this.bnkFrm.resetForm();
  }
  onSubmit() {

  }
  // onHelpCilcked(){
  //   const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

  //     disableClose: true,
  //     data: {
  //       ScrId: "ST404",
  //       Page: "Bank Entries",
  //       SlNo: 49,
  //       User: this.userData.userID,
  //       RefNo: this.userData.sessionID
  //     }
  //   });
  //   dialogRef.afterClosed().subscribe(result => {

  //   });
  // }


  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST302",
        // Page: "Transfers",
        // SlNo: 40,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  modeChange(event: any) {

  }
}
