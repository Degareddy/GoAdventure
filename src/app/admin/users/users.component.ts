import { UserDetailsComponent } from './user-details/user-details.component';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AdminService } from 'src/app/Services/admin.service';
import { SubSink } from 'subsink';
import { Observable, forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { PropertiesComponent } from './properties/properties.component';
import { FormatdateService } from 'src/app/Services/formatdate.service';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from '../../general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse, userResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { CompaniesComponent } from './companies/companies.component';
import { displayMsg, Items, Log, Mode, ScreenId, searchDocs, searchNotes, searchType, TextClr, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
import { Location } from '@angular/common';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  userForm!: FormGroup;
  reAssignFlag = false;
  formName: string = "user registration "
  labelPosition: 'before' | 'after' = 'after';
  @Input() max: any;
  tomorrow = new Date();
  retMessage: string = "";
  newMessage: string = "";
  retNum!: number;
  textMessageClass: string = "";
  dialogOpen = false;
  modeIndex!: number;
  private subSink: SubSink;
  public usersListData: Item[] = [];
  modes: Item[] = [];
  selectedObjects!: any[];
  filteredOptions: Observable<any[]> | undefined;
  profileList: Item[] = [];
  companyList: Item[] = [];
  locationList: Item[] = [];
  status!: string
  userCode!: string;
  userType: Item[] = [
    { itemCode: "Employee", itemName: "Employee" },
    { itemCode: "User", itemName: "USER" },
    { itemCode: "Customer", itemName: "Customer" },
    { itemCode: "Supplier", itemName: "Supplier" },
    { itemCode: "Tenant", itemName: "Tenant" },
    { itemCode: "Landlord", itemName: "Landlord" },
  ]
  @ViewChild('frmClear') public sprFrm!: NgForm;
  imageBlob: string = "assets/img/user.jpg";
  constructor(protected route: ActivatedRoute, protected router: Router, private fb: FormBuilder,private location: Location,
    private adminService: AdminService, private loader: NgxUiLoaderService, public dialog: MatDialog,
    private utlService: UtilitiesService, private masterService: MastersService, private dateService: FormatdateService,
    private userDataService: UserDataService
  ) {
    this.userForm = this.formInit();
    this.subSink = new SubSink();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  Companies() {
    const dialogRef: MatDialogRef<CompaniesComponent> = this.dialog.open(CompaniesComponent, {
      width: '70%',
      disableClose: true,
      data: { mode: this.userForm.get('mode')!.value, userId: this.userForm.get('userID')!.value }
    });

  }

  async onSubmit() {
    this.clearMsgs();
    this.userForm.controls['company'].patchValue(this.userDataService.userData.company);
    this.userForm.controls['location'].patchValue(this.userDataService.userData.location);
    if (this.userForm.invalid) {
      this.displayMessage(displayMsg.ERROR + "Form ivalid enter all required fields!", TextClr.red);
      return;
    }
    else {
      try {
        this.userForm.get('maxAllowedFailAttempts')!.enable();
        this.userForm.removeControl('confirmPassword');
        this.userForm.removeControl('userStatus');
        const formData = this.userForm.value;
        formData.expiresOn = this.dateService.formatDate(formData.expiresOn);
        formData.joinDate = this.dateService.formatDate(formData.joinDate);
        formData.refNo = this.userDataService.userData.sessionID;
        formData.userID = this.userForm.controls['userID'].value;
        formData.user = this.userDataService.userData.userID;
        formData.reAssign = this.userForm.controls['reAssign'].value;
        formData.userName = this.userForm.controls['user'].value;
        this.userForm.get('maxAllowedFailAttempts')!.disable();
        this.loader.start();
        this.subSink.sink = await this.adminService.saveUserData(formData).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newMessage = res.message;
            if (this.userForm.controls['mode'].value === 'Add') {
              this.modeChange('Modify');
            }
            this.getUserData(res.tranNoNew)
          } else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        },
          (error: any) => {
            this.loader.stop();
            this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
          }
        );
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }

  }

  goBack(): void {
    this.location.back();
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      company: [''],
      location: [''],
      userName: [''],
      userID: [{ value: '', disabled: true }],
      user: ['', [Validators.required, Validators.maxLength(50)]],
      userPassword: ['', [Validators.required, Validators.maxLength(20)]],
      confirmPassword: [''],
      userProfile: ['', [Validators.required, Validators.maxLength(100)]],
      userCompany: ['', [Validators.required, Validators.maxLength(100)]],
      defaultCompany: ['', [Validators.required, Validators.maxLength(100)]],
      defaultLocn: ['', [Validators.required, Validators.maxLength(12)]],
      joinDate: [new Date(), [Validators.required]],
      expiresOn: [new Date(), [Validators.required]],
      userStatus: [''],
      lastLoginOn: [{ value: '', disabled: true }],
      lastLoginFailOn: [{ value: '', disabled: true }],
      failAttempts: [{ value: 0, disabled: true }],
      maxAllowedFailAttempts: [5],
      remarks: ['', [Validators.maxLength(512)]],
      reAssign: [false],
      email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      mobile: ['', Validators.required]
    }, {
      validators: this.passwordsMatchValidator.bind(this)
    });
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const passwordControl = formGroup.get('userPassword');
    const confirmPasswordControl = formGroup.get('confirmPassword');
    if (passwordControl && confirmPasswordControl && passwordControl.value && confirmPasswordControl.value) {
      const password = passwordControl.value;
      const confirmPassword = confirmPasswordControl.value;
      return password === confirmPassword ? null : { mismatch: true };
    }
    return null;
  }

  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.userForm = this.formInit();
      this.userForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.displayMessage("", "");
      this.loadData();
    }
    else {
      this.userForm.controls['user'].enable();
      this.userForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
  }

  manageAllowedIps() {
    const dialogRef: MatDialogRef<UserDetailsComponent> = this.dialog.open(UserDetailsComponent, {
      disableClose: true,
      data: { mode: this.userForm.controls['mode'].value, userId: this.userForm.controls['userID'].value }
    });

  }

  async ngOnInit() {
    localStorage.setItem('previousScreen','User Reg');
    this.loadData();
    const modeBody = this.createRequestData(ScreenId.USER_REGISTRATION_SCRID);
    try{
      this.subSink.sink = await this.masterService.getModesList(modeBody).subscribe((modeRes: getResponse) => {
        if (modeRes.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.modes = modeRes['data'];
          if (this.modes.length === 1) {
            this.userForm.controls['mode'].patchValue(this.modes[0].itemCode, { emitEvent: false })
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Modes list " + modeRes.message, TextClr.red);
        }
      });
    }
    catch(ex:any){
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

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
  onClearClick() {
    this.userForm.get('user')!.patchValue('');
  }
  async loadData() {
    const service1 = this.adminService.GetMasterItemsList({ ...this.createRequestData(Items.PROFILE), mode: this.userForm.get('mode')!.value });
    const service2 = this.adminService.GetMasterItemsList({ ...this.createRequestData(Items.COMPANY), mode: this.userForm.get('mode')!.value });
    const service3 = this.adminService.GetMasterItemsList({ ...this.createRequestData(Items.LOCATION), mode: this.userForm.get('mode')!.value });
    this.subSink.sink = await forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.profileList = res1.data;
          if (this.profileList.length === 1) {
            this.userForm.controls['userProfile'].patchValue(this.profileList[0].itemCode, { emitEvent: false });
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Profile list " + res1.message, TextClr.red);
        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.companyList = res2.data;
          if (this.companyList.length === 1) {
            this.userForm.controls['userCompany'].patchValue(this.companyList[0].itemCode, { emitEvent: false });
            this.userForm.controls['defaultCompany'].patchValue(this.companyList[0].itemCode, { emitEvent: false })
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Company list " + res2.message, TextClr.red);
        }
        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.locationList = res3.data;
          if (this.locationList.length === 1) {
            this.userForm.controls['defaultLocn'].patchValue(this.locationList[0].itemCode, { emitEvent: false });
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Location list " + res3.message, TextClr.red);
        }
      },
      (error: any) => {
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );
  }


  selectedUserChange(event: any) {
    this.userCode = event.value;
    if (this.userCode != undefined && this.userCode != "" && this.userCode != null) {
      this.getUserData(this.userCode);
    }
  }

  clearMsgs() {
    this.displayMessage("", "");
  }

  async getUserData(user: string) {
    this.clearMsgs();
    const body = this.createRequestData(user);
    try {
      this.loader.start();
      this.subSink.sink = await this.adminService.getUserDataByName(body).subscribe((res: userResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          this.populateUserData(res, this.userForm.get('mode')?.value);
        } else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  populateUserData(res: any, mode: string) {
    this.status = res['data'].userStatus
    const failedLog = res['data'].lastLoginFailOn.replace('T', ' ');
    const joinDate = res['data'].joinDate.split('T')[0];
    const lastLogin = res['data'].lastLoginOn.replace('T', ' ');
    const expiresOn = res['data'].expiresOn.split('T')[0];
    this.userForm.patchValue({
      joinDate: joinDate,
      lastLoginOn: lastLogin,
      lastLoginFailOn: failedLog,
      expiresOn: expiresOn,
      company: res['data'].company,
      location: res['data'].location,
      userName: res['data'].userName,
      userID: res['data'].userID,
      userPassword: res['data'].userPassword,
      confirmPassword: res['data'].confirmPassword,
      userProfile: res['data'].userProfile,
      userCompany: res['data'].userCompany,
      defaultCompany: res['data'].defaultCompany,
      defaultLocn: res['data'].defaultLocn,
      failAttempts: res['data'].failAttempts,
      maxAllowedFailAttempts: res['data'].maxAllowedFailAttempts,
      remarks: res['data'].remarks,
      email: res['data'].email,
      mobile: res['data'].mobile
    });

    if (mode.toUpperCase() != Mode.view) {
      this.displayMessage("Success: " + this.newMessage, "green");
    }
    else {
      this.displayMessage("User details retrived successfully", "green");
    }
    if (this.userForm.controls.remarks.value) {
      this.downloadSelectedFile(this.userForm.controls.remarks.value);
    }
    else {
      this.imageBlob = "assets/img/user.jpg";
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  reset() {
    if (this.userCode != undefined && this.userCode != "" && this.userCode != null) {
      this.getUserData(this.userCode);
    }
  }

  clear() {
    this.userForm = this.formInit();
    this.status = "";
    this.clearMsgs();
    this.userCode = "";
    this.imageBlob = "assets/img/user.jpg";
  }

  close() {
    this.router.navigateByUrl('/home');
  }
  async onUserSearch() {
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      Type: Type.USER,
      item: this.userForm.get('user')!.value,
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      User: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.userForm.controls['user'].patchValue(res.data.selName);
            this.userForm.controls['userName'].patchValue(res.data.selName);
            this.userForm.controls['userID'].patchValue(res.data.selCode);
            this.getUserData(res.data.selCode);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.userForm.controls['user'].value, 'PartyType': Type.USER,
                  'search': searchType.USER
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.userForm.controls['user'].patchValue(result.partyName);
                  this.userForm.controls['userName'].patchValue(result.partyName);
                  this.userForm.controls['userID'].patchValue(result.code);
                  this.getUserData(result.code);
                }
                this.dialogOpen = false;
              });
            }
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

  properties() {
    const dialogRef: MatDialogRef<PropertiesComponent> = this.dialog.open(PropertiesComponent, {
      width: '50%',
      disableClose: true,
      data: { mode: this.userForm.controls['mode'].value, userId: this.userForm.controls['userID'].value }
    });

  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.userForm.controls['mode'].value, tranNo: this.userForm.controls['userID'].value,
        search: searchDocs.USER_DOC, tranType: Type.USER}
    });
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.USER_REGISTRATION_SCRID,
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
      data: {
        'tranNo': tranNo,
        'mode': this.userForm.controls['mode'].value,
        'note': this.userForm.controls['remarks'].value,
        'TranType': Type.USER,
        'search': searchNotes.USER_NOTE
      }
    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': Type.USER,
        'tranNo': tranNo,
        'search': Log.USER_LOG
      }
    });
  }


  fileloadData() {
    const fileName = sessionStorage.getItem('fileName') as string;
    if (fileName) {
      this.downloadSelectedFile(fileName);
    }
  }
  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Convert the blob to base64
    });
  }
  async downloadSelectedFile(fileName: string) {
    this.subSink.sink = await this.masterService.downloadFile(fileName).subscribe((res: Blob) => {
      this.convertBlobToBase64(res).then((base64: string) => {
        if (this.isImageFile(fileName)) {
          this.imageBlob = base64;
        }
        // else {
        //   this.toaster.error("Unsupported file type", "ERROR");
        // }
      })
        .catch(() => {
          // this.toaster.error("Error converting file", "ERROR");
        });
    });
  }
  private isImageFile(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.png') || fileName.toLowerCase().endsWith('.jpeg');
  }
}
