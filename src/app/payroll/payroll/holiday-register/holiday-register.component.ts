import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/sales/sales.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-holiday-register',
  templateUrl: './holiday-register.component.html',
  styleUrls: ['./holiday-register.component.css']
})
export class HolidayRegisterComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  ahdForm!: FormGroup;
  modes: Item[] = [];
  bonusCode: string = "";
  textMessageClass: string = "";
  retMessage: string = "";
  @Input() max: any;
  tomorrow = new Date();
  private subSink: SubSink = new SubSink();
  tranStatus: string = "";
  YearNo: any = [];
  constructor(protected route: ActivatedRoute,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService, public dialog: MatDialog,
    private fb: FormBuilder) {
    this.ahdForm = this.formInit();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      yearNo: ['', [Validators.required, Validators.maxLength(10)]],
      trandate: [new Date(), [Validators.required]],
      optionalHolidays: ['', [Validators.required]],
      publicHolidays: ['', [Validators.required]],
      remarks: [''],
      mode: ['View']
    });
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
  reset() {
    this.ahdForm.reset();
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST612",
        Page: "Holiday Register",
        SlNo: 38,
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
