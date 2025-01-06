import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UserData } from 'src/app/admin/admin.module';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-gross-margin',
  templateUrl: './gross-margin.component.html',
  styleUrls: ['./gross-margin.component.css']
})
export class GrossMarginComponent implements OnInit {
  grossForm!: FormGroup;
  @Input() max: any;
  tomorrow = new Date();
  userData!:any;
  private subSink: SubSink;
  masterParams!: MasterParams;
  modes!:any[];

  @ViewChild('frmClear') public grsfrm !: NgForm;

  constructor(private fb: FormBuilder,public dialog:MatDialog,
    private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    private masterService: MastersService,
  ) {
    this.grossForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();}


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
        if(res.status.toUpperCase()==="SUCCESS"){
          this.modes = res['data'];
        }
      });
      this.masterParams.item = this.grossForm.controls['list'].value;
    }
    catch (ex) {
      //console.log(ex);
    }
    // this.loadData();
  }

  loadData(){
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
      report: [''],
      FromDate: [new Date()],
      ToDate: [new Date()]
    })
  }
  onSubmit() {

  }
  Close() {

  }
  Reset() {
    this.grossForm = this.formInit();
    this.grsfrm.resetForm();
  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SR402",
        // Page: "Gross Margin",
        // SlNo: 53,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  modeChange(event:any){

  }
}
