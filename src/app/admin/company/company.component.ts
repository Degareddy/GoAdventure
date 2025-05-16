import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { AdminService } from 'src/app/Services/admin.service';
import { CompanyClass } from '../admin.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatIcon } from '@angular/material/icon';

import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { BranchesComponent } from './branches/branches.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { CompanyResponse, getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogComponent } from 'src/app/general/log/log.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { displayMsg, Log, Mode, ScreenId, searchDocs, searchNotes, TextClr, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit, OnDestroy {
  companyForm!: FormGroup;
  retMessage: string = "";
  retNum!: number;
  textMessageClass: string = "";
  companyCls!: CompanyClass;
  modes: Item[] = [];
  companyList: Item[] = [];
  companyName: string = "";
  private subSink: SubSink;
  status!: string;
  isDisabled: boolean = false;
  @Input() max: any;
  tomorrow = new Date();
  @ViewChild('frmClear') public sprFrm!: NgForm;
  durationInSeconds = 5;
  newTranMsg: string = "";
  constructor(protected route: ActivatedRoute, private adminService: AdminService,
    private masterService: MastersService, public dialog: MatDialog, private snackBar: MatSnackBar,
    protected router: Router, private loader: NgxUiLoaderService, private userDataService: UserDataService,
    private fb: FormBuilder
  ) {
    this.companyForm = this.formInit();
    this.subSink = new SubSink();
    this.companyCls = new CompanyClass();
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.companyForm.controls['mode'].value, tranNo: this.companyForm.controls['companyID'].value,
        search: searchDocs.COMPANY_DOC, tranType: Type.COMPANY
      }
    });
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  openSnackBar(message: string, action: string, duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration: duration,
    });
  }
  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.status = '';
      this.companyForm = this.formInit();
      this.companyForm.controls['mode'].patchValue(event, { emitEvent: false, onlySelf: false });
      this.companyForm.controls['companyList'].disable({ emitEvent: false, onlySelf: false })
      this.enableFormControls();
      this.retMessage = "";
      this.isDisabled = false;
      this.loadData();
    } else {
      this.companyForm.controls['mode'].patchValue(event, { emitEvent: false, onlySelf: false });
      this.companyForm.controls['companyList'].enable({ emitEvent: false, onlySelf: false })
      this.isDisabled = true;
    }
  }

  enableFormControls() {
    this.companyForm.controls['companyID'].enable({ onlySelf: true });
  }

  ngOnInit(): void {
    this.loadData();
  }
  private createRequestData(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: item
    };
  }
  async loadData() {
    this.companyCls.company = this.userDataService.userData.company;
    this.companyCls.refNo = this.userDataService.userData.sessionID;
    this.companyCls.user = this.userDataService.userData.userID;
    this.companyCls.item = this.userDataService.userData.company;
    const modebody = this.createRequestData(ScreenId.COMPANY_SCRID);
    const companybody = { ...this.createRequestData(Type.COMPANY), mode: this.companyForm.get('mode')?.value };
    try {
      const modes$ = this.masterService.getModesList(modebody);
      const company$ = this.adminService.GetMasterItemsList(companybody);
      this.subSink.sink = await forkJoin([modes$, company$]).subscribe(([modesRes, companyRes]: any) => {
        if (modesRes.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = modesRes['data'];
          if (this.modes.length === 1) {
            this.companyForm.get('mode')!.patchValue(this.modes[0].itemCode);
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
        }
        if (companyRes.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.companyList = companyRes['data'];
          if (this.companyList.length === 1) {
            this.companyForm.get('companyList')!.patchValue(this.companyList[0].itemCode);
            this.companyChange(this.companyList[0].itemCode)
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Company list empty!", TextClr.red);
        }

      },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  async getCompanyData(body: CompanyClass, mode: string) {
    this.loader.start();
    this.subSink.sink = await this.adminService.getCompanyData(body).subscribe((res: CompanyResponse) => {
      this.loader.stop();
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.status = res.data.status,
          this.companyCls.ID = res.data.ID;
        this.populateData(res);
        this.companyForm.controls['companyID'].disable({ onlySelf: true });
        this.textMessageClass = TextClr.green;
        if (mode.toUpperCase() != Mode.view) {
          this.displayMessage(this.newTranMsg, TextClr.green);
        }
        else {
          this.displayMessage('Retriving data for company ' + res.data.name + ' has completed', TextClr.green);

        }
      }
      else {
        this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
      }
    });
  }
  populateData(res: any) {
    this.companyForm.patchValue({
      companyID: res.data.id,
      name: res.data.name,
      cmpDate: res.data.cmpDate,
      address1: res.data.address1,
      address2: res.data.address2,
      address3: res.data.address3,
      pO_PIN_ZIP: res.data.pO_PIN_ZIP,
      city: res.data.city,
      state: res.data.state,
      country: res.data.country,
      phone1: res.data.phone1,
      phone2: res.data.phone2,
      phone3: res.data.phone3,
      fax: res.data.fax,
      email: res.data.email,
      uRL: res.data.url,
      vATNo: res.data.vatNo,
      pINNo: res.data.pinNo,
      logoLocn: res.data.logoLocn,
      notes: res.data.notes,
      facebook: res.data.facebook,
      twitter: res.data.twitter,
      instagram: res.data.instagram,
      youtube: res.data.youtube,
      pinterest: res.data.pinterest
    }, { emitEvent: false });
  }
  companyChange(event: string) {
    this.displayMessage("", "");
    if (event != "" && event != undefined && event != null) {
      let companyName = this.companyList.find((o: any) => o.itemCode === event);
      this.companyName = companyName?.itemName || "";
      this.companyCls.item = event;
      this.getCompanyData(this.companyCls, this.companyForm.get('mode')?.value);
    }
    else {
      this.clear();
    }

  }

  formInit() {
    return this.fb.group({
      companyID: ['', [Validators.required, Validators.maxLength(25)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      cmpDate: [new Date(), [Validators.required]],
      address1: ['', [Validators.required, Validators.maxLength(233)]],
      address2: ['', [Validators.required, Validators.maxLength(32)]],
      address3: ['', Validators.maxLength(32)],
      pO_PIN_ZIP: ['', [Validators.required, Validators.maxLength(12)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      state: ['', Validators.maxLength(50)],
      country: ['', [Validators.required, Validators.maxLength(50)]],
      phone1: ['', [Validators.required, Validators.maxLength(15)]],
      phone2: ['', Validators.maxLength(15)],
      phone3: ['', Validators.maxLength(15)],
      fax: ['', Validators.maxLength(15)],
      email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      uRL: ['', Validators.maxLength(64)],
      vATNo: ['', [Validators.required, Validators.maxLength(18)]],
      pINNo: ['', [Validators.required, Validators.maxLength(18)]],
      notes: ['', [Validators.maxLength(512)]],
      mode: ['View'],
      companyList: [''],
      facebook: [''],
      twitter: [''],
      instagram: [''],
      youtube: [''],
      pinterest: ['']
    });
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  reset() {
    this.companyForm.controls['companyList'].patchValue(this.companyCls.company);
    this.getCompanyData(this.companyCls, this.companyForm.get('mode')?.value);
  }
  prepareComapnyCls() {

    try{
      this.companyCls.mode = this.companyForm.value.mode;
      this.companyCls.company = this.userDataService.userData.userID;
      this.companyCls.location = this.userDataService.userData.location;
      this.companyCls.ID = this.companyForm.controls['companyID'].value;
      this.companyCls.name = this.companyForm.value.name;
      this.companyCls.cmpDate = this.companyForm.value.cmpDate;
      this.companyCls.address1 = this.companyForm.value.address1;
      this.companyCls.address2 = this.companyForm.value.address2;
      this.companyCls.address3 = this.companyForm.value.address3;
      this.companyCls.pO_PIN_ZIP = this.companyForm.value.pO_PIN_ZIP;
      this.companyCls.city = this.companyForm.value.city;
      this.companyCls.state = this.companyForm.value.state;
      this.companyCls.country = this.companyForm.value.country;
      this.companyCls.phone1 = this.companyForm.value.phone1;
      this.companyCls.phone2 = this.companyForm.value.phone2;
      this.companyCls.phone3 = this.companyForm.value.phone3;
      this.companyCls.fax = this.companyForm.value.fax;
      this.companyCls.email = this.companyForm.value.email;
      this.companyCls.url = this.companyForm.value.uRL;
      this.companyCls.vatNo = this.companyForm.value.vATNo;
      this.companyCls.pinNo = this.companyForm.value.pINNo;
      this.companyCls.logoLocn = "NA";
      this.companyCls.notes = this.companyForm.value.notes;

      this.companyCls.youtube = this.companyForm.value.youtube;
      this.companyCls.twitter = this.companyForm.value.twitter;
      this.companyCls.instagram = this.companyForm.value.instagram;
      this.companyCls.facebook = this.companyForm.value.facebook;
      this.companyCls.pinterest = this.companyForm.value.pinterest;
    }
    catch(ex:any){
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  async onSubmit() {
    if (this.companyForm.valid) {
      this.prepareComapnyCls();
      try {
        this.loader.start();
        this.subSink.sink = await this.adminService.saveCompanyData(this.companyCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.textMessageClass = TextClr.green;
            this.newTranMsg = res.message;
            if (this.companyForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.companyList.push({ itemCode: this.companyForm.controls['companyID'].value, itemName: this.companyForm.controls['name'].value });
              this.modeChange("Modify");
              this.companyForm.controls['companyList'].patchValue(this.companyForm.controls['companyID'].value);
            }
            else {
              this.newTranMsg = res.message;
            }
            this.companyCls.item = res.tranNoNew;
            this.getCompanyData(this.companyCls, this.companyForm.get('mode')?.value);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      } catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    } else {
      this.displayMessage(displayMsg.ERROR + 'Form Invalid', TextClr.red);
    }
  }


  GetBranches(companyID: string) {
    const dialogRef: MatDialogRef<BranchesComponent> = this.dialog.open(BranchesComponent, {
      width: '90%',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      data: { mode: this.companyForm.controls['mode'].value, company: companyID, title: this.companyName }
    });

  }

  clear() {
    this.companyForm = this.formInit();
    this.displayMessage("", "");
    this.status = "";
    this.newTranMsg = "";
  }
  openOverlay(): void {
    // this.overlay.open(MasterItemsComponent);
    // if (this.overlay) {
    //   this.overlay.open(AppHelpComponent);
    // } else {
    //   console.error('Overlay component not initialized.');
    // }
  }
  onHelpCilcked() {
    // this.openOverlay();
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.COMPANY_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      panelClass: 'full-screen-dialog',
      data: {
        'tranNo': tranNo,
        'mode': this.companyForm.controls['mode'].value,
        'note': this.companyForm.controls['notes'].value,
        'TranType': Type.COMPANY,
        'search': searchNotes.COMPANY_NOTE
      }
    });

  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': Type.COMPANY,
        'tranNo': tranNo,
        'search': Log.COMPANY_LOG
      }
    });
  }
}
