import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/general/Interface/interface';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.css']
})
export class PromotionsComponent implements OnInit,OnDestroy {
  prhForm!: FormGroup;
  modes: Item[]=[];
  textMessageClass: string="";
  retMessage: string="";
  @Input() max: any;
  tomorrow = new Date();
  private subsink: SubSink = new SubSink();
  constructor(private fb: FormBuilder,private userDataService: UserDataService,
     public dialog: MatDialog) {
    this.prhForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      payrollYear: ['', [Validators.required, Validators.maxLength(10)]],
      payrollMonth: ['', [Validators.required, Validators.maxLength(10)]],
      notes: [''],
      mode: ['View']
    })
  }

  ngOnInit(): void {

  }

  onUpdate() {

  }

  reset() {
    this.prhForm.reset();

  }
  onHelpCilcked(){
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "ST610",
        Page: "Promotions",
        SlNo: 73,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
