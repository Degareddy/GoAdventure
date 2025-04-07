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
  selector: 'app-absent-register',
  templateUrl: './absent-register.component.html',
  styleUrls: ['./absent-register.component.css']
})
export class AbsentRegisterComponent implements OnInit, OnDestroy {
  masterParams: MasterParams;
  modes: Item[] = [];
  pabrForm!: FormGroup;
  bonusCode: string = "";
  textMessageClass: string = "";
  retMessage: string = "";
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();
  constructor(protected route: ActivatedRoute,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService, public dialog: MatDialog,
    private fb: FormBuilder,) {
    this.masterParams = new MasterParams();
    this.pabrForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  searchData(){

  }
  formInit() {
    return this.fb.group({
      tranNo: [''],
      trandate: [new Date(), [Validators.required]],
      payrollYear: ['', [Validators.required, Validators.maxLength(10)]],
      payrollMonth: ['', [Validators.required, Validators.maxLength(10)]],
      notes: [''],
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
      item: 'ST608'
    };
    try {
      this.subsink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if(res.status.toUpperCase()==="SUCCESS"){
          this.modes = res['data'];
        }
      });
      // this.masterParams.item = this.pabrForm.controls['bonusCode'].value;
    }

    catch (ex) {
      //console.log(ex);
    }

  }
  Close(){
    this.router.navigateByUrl('/home');
  }
  reset() {
    this.pabrForm = this.formInit();
    // this.pabrForm.resetForm();
    // this.tranStatus = '';
    this.retMessage = "";
    this.textMessageClass=""
  }
  get() {

  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST608",
        Page: "Absent",
        SlNo: 71,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }


  insert() {

  }
  onUpdate() {

  }
}
