import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MasterParams } from 'src/app/modals/masters.modal';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-vat-details',
  templateUrl: './vat-details.component.html',
  styleUrls: ['./vat-details.component.css']
})
export class VatDetailsComponent implements OnInit, OnDestroy {
  modes: Item[]=[];
  vatForm!: FormGroup;
  textMessageClass: string="";
  retMessage: string="";
  private subSink: SubSink;
  masterParams!: MasterParams;
  constructor(private fb: FormBuilder, public dialog: MatDialog,
    private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    private masterService: MastersService,
  ) {
    this.vatForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],

      yearCode: ['', [Validators.required, Validators.maxLength(10)]],
      slNo: ['', [Validators.required]],
      tableType: ['', [Validators.required, Validators.maxLength(20)]],
      rateType: ['', [Validators.required, Validators.maxLength(20)]],
      fromAmt: ['0.00'],
      toAmt: ['0.00'],
      rate: ['0.00', [Validators.required, Validators.maxLength(24)]],
      note: [''],
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
      this.masterParams.item = this.vatForm.controls['list'].value;
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
          this.modes = res1.data;

        },
        (error: any) => {
          this.loader.stop();
        }
      );
    } catch (ex: any) {
      this.loader.stop();
    }

  }

  onUpdate() {

  }
  reset() {
    // this.vatForm.reset();
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      //this.vatForm.controls['whid'].enable();
      // this.vatForm.get('list')!.disable();
      // this.vatForm.get('list')!.clearValidators();
      // this.vatForm.get('list')!.updateValueAndValidity();
    }
    else {
      // this.vatForm.get('list')!.enable();
      //this.vatForm.controls['whid'].disable();
    }
    this.vatForm.controls['mode'].patchValue(event, { emitEvent: false });
  }


  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM402",
        // Page: "VAT Details",
        // SlNo: 44,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
}
