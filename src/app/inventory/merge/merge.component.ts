import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { LogComponent } from 'src/app/general/log/log.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserData } from 'src/app/payroll/payroll/payroll.module';
import { displayMsg, Mode, TextClr, TranStatus, TranType } from 'src/app/utils/enums';
import { SubSink } from 'subsink';
import { mergingStock, PhysicalDeails } from '../inventory.class';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { AccessSettings } from 'src/app/utils/access';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

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
  private subSink!: SubSink;

  retMessage!: string;
  tranStatus!: string;
  textMessageClass!: string;
  mergingStock!: mergingStock;
  newMsg: string = "";


  constructor(private fb: FormBuilder,public dialog: MatDialog, private datePipe: DatePipe,
    private userDataService: UserDataService,
    private masterService: MastersService,
    private invService: InventoryService,
    private loader: NgxUiLoaderService,
    protected router: Router, ) {
    this.mergingForm = this.formInit();
    this.subSink = new SubSink();
    this.mergingStock=new mergingStock()

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
  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.clear();
      this.mergingForm.controls['mode'].setValue(event, { emitEvent: false });
      this.mergingForm.get('tranNo')!.disable();
      this.mergingForm.get('tranNo')!.clearValidators();
      this.mergingForm.get('tranNo')!.updateValueAndValidity();
      // this.loadData();
    }
    else {
      this.mergingForm.controls['mode'].setValue(event, { emitEvent: false });
      this.mergingForm.get('tranNo')!.enable();
    }
  }
  onSubmit() {
    this.displayMessage("", "");
        if (this.mergingForm.invalid) {
          return;
        }
        else {
          const body = {
            ...this.commonParams(),
            tranNo: this.mergingForm.get('tranNo')?.value,
            tranDate: this.mergingForm.get('tranDate')?.value,
            tranStatus: this.tranStatus,
            notes: this.mergingForm.get('notes')?.value,
            mode: this.mergingForm.get('mode')?.value,
            langId: this.userDataService.userData.langId,
          }
          this.subSink.sink = this.invService.UpdatePhysicalStock(body).subscribe((res: SaveApiResponse) => {
            if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
              this.newMsg = res.message;
              if (this.mergingForm.get('mode')?.value.toUpperCase() === Mode.Add) {
                this.modeChange("Modify");
              }
              this.mergingForm.get('tranNo')?.patchValue(res.tranNoNew);
              this.mergingStock.tranNo = res.tranNoNew
              this.getMergingTranData(this.mergingStock, this.mergingForm.get('mode')?.value)
            }
            else {
              this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            }
          });
        }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }


  searchData() {
    try {
          const currentDate = new Date();
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
          const formattedCurrentDate = this.formatDate(currentDate);
          const body = {
            ...this.commonParams(),
            TranType: TranType.PHYSTOCK,
            TranNo: this.mergingForm.controls['tranNo'].value,
            Party: "",
            FromDate: formattedFirstDayOfMonth,
            ToDate: formattedCurrentDate,
            TranStatus: TranStatus.ANY
          }
          this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
            if (res.retVal === 0) {
              if (res && res.data && res.data.tranCount === 1) {
                this.mergingStock.tranNo = res.data.selTranNo;
                this.getMergingTranData(this.mergingStock, this.mergingForm.get('mode')?.value);
              }
              else {
                const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                      width: '90%',
                      disableClose: true,
                      data: {
                        tranNum: this.mergingForm.controls['tranNo'].value,
                        TranType: TranType.PHYSTOCK,
                        search: 'Physical Stcock Search'
                      }
                    });
                    dialogRef.afterClosed().subscribe(result => {
                      if (result != true && result != undefined) {
                        this.mergingStock.tranNo = result;
                        this.getMergingTranData(this.mergingStock, this.mergingForm.get('mode')?.value);
                      }
                    });
              }
            }
            else {
             const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                   width: '90%',
                   disableClose: true,
                   data: {
                     tranNum: this.mergingForm.controls['tranNo'].value,
                     TranType: TranType.PHYSTOCK,
                     search: 'Physical Stcock Search'
                   }
                 });
                 dialogRef.afterClosed().subscribe(result => {
                   if (result != true && result != undefined) {
                     this.mergingStock.tranNo = result;
                     this.getMergingTranData(this.mergingStock, this.mergingForm.get('mode')?.value);
                   }
                 });
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }
  displayMessage(msg:string,cssClass:string){
    this.retMessage=msg;
    this.textMessageClass=cssClass;
  }
  getMergingTranData(mrg: mergingStock, mode: string){
try {
      this.loader.start();
      this.subSink.sink = this.invService.GetPhysicalStock(mrg).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
          this.mergingForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.mergingForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.mergingForm.controls['notes'].setValue(res['data'].notes);
          this.tranStatus = res['data'].tranStatus;
        

          if (mode.toUpperCase() != Mode.view) {
            this.displayMessage(displayMsg.SUCCESS + this.newMsg, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
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
