import { Component, Input, NgModule, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { LogComponent } from 'src/app/general/log/log.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SubSink } from 'subsink';


@Component({
  selector: 'app-stock-openings',
  templateUrl: './stock-openings.component.html',
  styleUrls: ['./stock-openings.component.css']
})
export class StockOpeningsComponent implements OnInit, OnDestroy {
  StockopeningBalForm!: FormGroup;
  modes: Item[] = [];
  @Input() max: any;
  tomorrow = new Date();
  textMessageClass:string="";
  retMessage:string="";
  private subSink: SubSink = new SubSink();
  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private masterService: MastersService, private userDataService: UserDataService,
    protected router: Router,) {
    this.StockopeningBalForm = this.formInit();


  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      date: [new Date(),Validators.required],
      notes: ['',Validators.required],
    })
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
      item: 'ST303'
    }
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }
    catch (ex:any) {
      this.retMessage=ex.message;
      this.textMessageClass="res";

    }

  }
  onSubmit() {

  }
  Close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.StockopeningBalForm.reset();
  }
  reset() {
    this.StockopeningBalForm.reset();
  }
  onTranNoFocusOut() {

  }
  searchData() {

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST303",
        // Page: "Stock Opening",
        // SlNo: 41,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  NotesDetails(tranNo:any){
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo,
      'mode': this.StockopeningBalForm.controls['mode'].value,
     // 'note':this.StockopeningBalForm.controls['notes'].value ,
      'TranType': "STKOPEN",}  // Pass any data you want to send to CustomerDetailsComponent

    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "STKOPEN",
        'tranNo': tranNo,
        'search': 'Stock Opening Log'
      }
    });
  }


}
