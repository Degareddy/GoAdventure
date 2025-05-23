import { DocumentNumberingDetailsComponent } from './document-numbering-details/document-numbering-details.component';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { InventoryService } from 'src/app/Services/inventory.service';
import { CompanyClass } from 'src/app/admin/admin.class';
import { SubSink } from 'subsink';
import { ChangeDetectorRef } from '@angular/core';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { displayMsg, Items, Log, ScreenId, TextClr, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-document-numbers',
  templateUrl: './document-numbers.component.html',
  styleUrls: ['./document-numbers.component.css']
})
export class DocumentNumbersComponent implements OnInit, OnDestroy {
  DocForm!: FormGroup;
  retMessage!: string;
  @ViewChild(DocumentNumberingDetailsComponent) childComponent: DocumentNumberingDetailsComponent | undefined;
  isDetailsVisible: boolean = false;
  @Input() data: { mode: string; company: string, location: string, transaction: string } | undefined
  retNum!: number;
  textMessageClass!: string;
  companyCls!: CompanyClass;
  modes: Item[] = [];
  companyLists: Item[] = [];
  tranLists: Item[] = [];
  selectedObjects!: any[];
  private subSink: SubSink;
  locationList: Item[] = [];
  isDisabled: boolean = false;
  constructor(private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private invService: InventoryService, private cdr: ChangeDetectorRef,
    protected router: Router,
    private loader: NgxUiLoaderService) {
    this.DocForm = this.formInit();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      company: [''],
      location: [''],
      transaction: ['']
    });
  }
  ngOnInit(): void {
    this.loadData();
    this.DocForm.get('mode')!.valueChanges.subscribe(value => {
      this.updateDataObject();
    });
    this.DocForm.get('transaction')!.valueChanges.subscribe(value => {
      this.childComponent?.Clear();
    });
    // Initialize data object
    this.updateDataObject();
  }
  updateDataObject() {
    this.data = {
      mode: this.DocForm.controls['mode'].value,
      company: this.DocForm.controls['company'].value,
      location: this.DocForm.controls['location'].value,
      transaction: this.DocForm.controls['transaction'].value
    };
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
  loadData() {
    const service1 = this.invService.getModesList({ ...this.commonParams(), item: ScreenId.DOCUMENT_NUMBER_SCRID });
    const service2 = this.invService.GetMasterItemsList({ ...this.commonParams(), item: Items.COMPANY });
    const service3 = this.invService.GetMasterItemsList({ ...this.commonParams(), item: Items.TRANS });
    this.subSink.sink = forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = res1.data;
        }
        else{
          this.displayMessage(displayMsg.ERROR+ "Modes list empty!", TextClr.red);
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.companyLists = res2.data;
          if (this.companyLists.length === 1) {
            this.DocForm.get('company')!.setValue(this.companyLists[0].itemCode);
            this.companyChange(this.companyLists[0].itemCode)
          }
        }
        else{
          this.displayMessage(displayMsg.ERROR+ "Company list empty!", TextClr.red);
        }
        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.tranLists = res3.data;
          if (this.tranLists.length === 1) {
            this.DocForm.get('transaction')!.setValue(this.tranLists[0].itemCode);
          }
        }
        else{
          this.displayMessage(displayMsg.ERROR+ "Transaction list empty!", TextClr.red);
        }

      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR+ error.message, TextClr.red);
      }
    );
  }
  locationChange(loc: string) {
    this.clearMsgs();
    this.DocForm.get('transaction')!.setValue("");
  }
  companyChange(companyCode: string) {
    this.clearMsgs();
    this.locationList = [];
    const lcnbody = {
      ...this.commonParams(),
      Item: Items.CMPUSERBRANCH
    };
    try {
      this.subSink.sink = this.invService.GetMasterItemsList(lcnbody).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.locationList = res.data;
          if (this.locationList.length === 1) {
            this.DocForm.get('location')!.setValue(this.locationList[0].itemCode);
          }
          this.clearMsgs();
        }
        else {
          this.locationList = [];
          this.displayMessage(displayMsg.ERROR+ "Locations not found", TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  // handleError(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = "red";
  // }

  Close() {
    this.router.navigateByUrl('/home');
  }
  reset() {
    this.DocForm.reset();
    this.DocForm = this.formInit();
    this.clearMsgs();
  }
  clearMsgs() {
   this.displayMessage("", "");
  }
  Details() {
    this.clearMsgs();
    this.data = { mode: this.DocForm.controls['mode'].value, company: this.DocForm.controls['company'].value,
       location: this.DocForm.controls['location'].value, transaction: this.DocForm.controls['transaction'].value }
    this.childComponent?.onDeleteClicked(this.data);
    this.cdr.detectChanges();

  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.DOCUMENT_NUMBER_SCRID,
        Page: "Document Number",
        SlNo: 63,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': TranType.DOCUMNENTNUMBER,
        'tranNo': tranNo,
        'search': Log.DOCUMNENTNUMBER
      }
    });
  }

}
