import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MastersService } from 'src/app/Services/masters.service';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { LogComponent } from 'src/app/general/log/log.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserData } from 'src/app/payroll/payroll/payroll.module';

@Component({
  selector: 'app-merge',
  templateUrl: './merge.component.html',
  styleUrls: ['./merge.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class MergeComponent implements OnInit {
  mergingForm!: FormGroup;
  modes!: any[];
  userData: any;
  @Input() max: any;
  tomorrow = new Date();

  retMessage!: string;
  tranStatus!: string;
  textMessageClass!: string;

  constructor(private fb: FormBuilder,public dialog: MatDialog,
    private masterService: MastersService,
    protected router: Router, ) {
    this.mergingForm = this.formInit();

  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      date: [new Date()],
      fromItem: [''],
      toItem: [''],
      notes: [''],
      status: ['']
    })
  }

  ngOnInit(): void {
    this.loadData();

  }
  loadData() {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    const body = {
      company: this.userData.company,
      location: this.userData.location,
      user: this.userData.userID,
      item: 'ST102',
      refNo: this.userData.sessionID
    };

    this.masterService.getModesList(body).subscribe((res: any) => {
      //console.log(res);
      this.modes = res['data'];
      // this.modeIndex = this.modes.findIndex(x => x.itemCode === "View");
      // this.mrhForm.controls['mode'].setValue(this.modes[this.modeIndex].itemCode);
    });
  }
  onSubmit() {

  }
  searchData() {

  }
  Close() {
this.router.navigateByUrl('/home');
  }
  reset() {
    this.mergingForm.reset();
  }
  clear() {
    this.mergingForm.reset();
    this.retMessage = "";
    this.tranStatus = "";
    this.textMessageClass = "";
  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST304",
        Page: "Stock Merging",
        SlNo: 42,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
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
      'mode': this.mergingForm.controls['mode'].value, 
      'note':this.mergingForm.controls['notes'].value ,
      'TranType': "STKMERGE",}  // Pass any data you want to send to CustomerDetailsComponent
      
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "STKMERGE",
        'tranNo': tranNo,
        'search': 'Stock Merginh Log'
      }
    });
  }
  
   
 
}
