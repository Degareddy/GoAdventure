import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { PropertyCls } from 'src/app/project/Project.class'
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DirectionsComponent } from 'src/app/general/directions/directions.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Router } from '@angular/router';
import { SearchProjectComponent } from 'src/app/general/search-project/search-project.component';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SendsmsComponent } from 'src/app/general/sendsms/sendsms.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { PropertyDetailsResponse } from '../property.interface';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { AccessSettings } from 'src/app/utils/access';
import { Items, Log, Mode, ScreenId, searchDocs, searchNotes, searchType, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})

export class ProjectComponent implements OnInit, OnDestroy {
  propForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  modes: Item[] = [];
  retMessage: string = "";
  propID: string = "";
  textMessageClass: string = "";
  private propCls!: PropertyCls;
  private subSink!: SubSink;
  blockCount: number = 0;
  unitCount: number = 0;
  propStatus!: string;
  landlord!: string;
  employee!: string;
  venture!: string;
  newTranMsg: string = "";
  masterParams!: MasterParams;
  dialogOpen = false;
  public disableDetail: boolean = true;
  public fetchStatus: boolean = true;
  empCode!: string;
  currentYear!: number;
  landlordCode!: string;
  propertyId!: string;
  discTypeList: Item[] = [
    { itemCode: "PERCENTAGE", itemName: "Percentage" },
    { itemCode: "FLAT", itemName: "Flat" },
  ]
  constructor(private fb: FormBuilder, private masterService: MastersService, private projectService: ProjectsService,
    private datePipe: DatePipe, public dialog: MatDialog, protected router: Router, protected utlService: UtilitiesService,
    private loader: NgxUiLoaderService, private userDataService: UserDataService) {
    this.propForm = this.formInit();
    this.propCls = new PropertyCls();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.currentYear = new Date().getFullYear();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  discRateValidator() {
    return (control: FormControl) => {
      if (this.propForm && this.propForm.controls.discType.value === 'PERCENTAGE') {
        const value = control.value;
        if (isNaN(value) || value < 0 || value > 100) {
          return { invalidPercentage: true };
        }
      }
      return null;
    };
  }
  sendGreetings() {
    const dialogRef: MatDialogRef<SendsmsComponent> = this.dialog.open(SendsmsComponent, {
      disableClose: true,
      data: {
        type: Type.FLAT,
        Trantype: TranType.PREBOOK,
        Property: this.propID,
        Block: "",
        Flat: "",
        mode: this.propForm.controls['mode'].value,
        from: Items.PROPERTY
      }
    });
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      propertyId: ['', [Validators.required, Validators.maxLength(10)]],
      propertyName: ['', [Validators.required, Validators.maxLength(50)]],
      ventureName: [''],
      acquiredDate: [new Date(), [Validators.required]],
      yearBuilt: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d{3}$/),
          Validators.min(1950),
          Validators.max(this.currentYear)
        ]
      ],
      latitude: [0],
      longitude: [0],
      altitude: [0],
      propAddress1: ['', [Validators.required]],
      propAddress2: [''],
      propAddress3: [''],
      city: ['', [Validators.required]],
      province: [''],
      employeeName: [''],
      lrNo: [''],
      notes: [''],
      waterDiscount: [false],
      discType: [{ value: '', }],
      discRate: [{ value: 0.00,  }, this.discRateValidator()],
      unitRate: [0.00]
    })
  }

  alphanumericValidator() {
    return (control: any) => {
      const value = control.value;
      const uppercaseValue = value.toUpperCase();

      if (value !== uppercaseValue) {
        control.patchValue(uppercaseValue, { emitEvent: false });
      }
      const valid = /^[A-Z0-9]+$/.test(uppercaseValue);

      return valid ? null : { invalidAlphanumeric: true };
    };
  }

  ngOnInit(): void {
    this.loadData();
    this.waterDisc();
   
      this.propForm.get('waterDiscount')?.valueChanges.subscribe(value => {
        if (value) {
          this.propForm.get('discType')?.disable();
        } else {
          this.propForm.get('discType')?.enable();
        }
      });
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  propertySearch() {
    const body = this.createRequestData(this.propForm.controls['propertyName'].value || '', Items.PROPERTY);
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (res && res.data && res.data.nameCount === 1) {
            this.propForm.controls['propertyName'].patchValue(res.data.selName);
            this.masterParams.item = res.data.selCode;
            this.propID = res.data.selCode;
            this.getPropertyData(this.masterParams, this.propForm.get('mode')?.value);
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
                disableClose: true,
                data: {
                  project: this.propForm.controls['propertyName'].value, type: Items.PROPERTY,
                  search: searchType.PROPERTY
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.masterParams.item = result.itemCode;
                  this.propID = result.itemCode;
                  try {
                    this.getPropertyData(this.masterParams, this.propForm.get('mode')?.value);
                  }
                  catch (ex: any) {
                    this.displayMessage("Exception: " + ex.message, "red");
                  }
                }
              });
            }
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }

  populateFormControls(data: any): void {
    this.propertyId = data.propertyID;
    this.venture = data.venture;
    this.propStatus = data.propStatus;
    this.landlord = data.landlord;
    this.empCode = data.employee;
    this.employee = data.employee;
    this.blockCount = data.blockCount;
    this.unitCount = data.unitCount;
    this.propStatus = data.propStatus;
    this.propForm.patchValue({
      propertyId: data.propertyID,
      propertyName: data.propertyName,
      acquiredDate: data.acquiredDate,
      yearBuilt: data.yearBuilt,
      ventureName: data.ventureName,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      propAddress1: data.propAddress1,
      propAddress2: data.propAddress2,
      propAddress3: data.propAddress3,
      city: data.city,
      province: data.province,
      employeeName: data.employeeName,
      lrNo: data.lrNo,
      notes: data.notes,
      waterDiscount: data.waterDiscount,
      discType: data.discType,
      discRate: data.discRate,
      unitRate: data.waterUnitRate
    }, { emitEvent: false });
  }

  getPropertyData(masterParams: MasterParams, mode: string) {
    try {
      this.subSink.sink = this.projectService.getPropertyDetails(masterParams).subscribe((res: PropertyDetailsResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.populateFormControls(res.data);
          this.handleSuccess(res, mode);
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");

    }
  }

  handleSuccess(res: any, mode: string) {
    this.textMessageClass = TextClr.green;
    if (mode.toUpperCase() != Mode.view && this.newTranMsg != "") {
      this.retMessage = this.newTranMsg;
    }
    else {
      this.retMessage = res.message;
    }
  }

  async loadData() {
    this.propertySearch();
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
      item: ScreenId.PROPERTY_SCRID,

    };
    this.subSink.sink = await this.masterService.getModesList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.modes = res['data'];
        if (this.modes.length === 1) {
          this.propForm.get('mode')!.patchValue(this.modes[0].itemCode);
        }
      }
      else {
        this.displayMessage("Modes list empty!", "red");
      }
    });
  }

  preparePropertyCls() {
    this.propCls.company = this.userDataService.userData.company;
    this.propCls.location = this.userDataService.userData.location;
    this.propCls.user = this.userDataService.userData.userID;
    this.propCls.refNo = this.userDataService.userData.sessionID;
    this.propCls.langId = this.userDataService.userData.langId;;
    this.propCls.propertyID = this.propertyId;
    this.propCls.WaterUnitRate = this.propForm.get('unitRate')?.value
    this.propCls = { ...this.propCls, ...this.propForm.value };
    this.propCls.venture = this.venture;
    this.propCls.landlord = this.landlordCode;
    const transformedDate = this.datePipe.transform(this.propForm.controls['acquiredDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.propCls.acquiredDate = transformedDate.toString();
    } else {
      this.propCls.acquiredDate = '';
    }
    if (this.propForm.controls['employeeName'].value != '') {
      this.propCls.employee = this.empCode;
    }
    else {
      this.propCls.employee = "";
    }
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onSubmit() {
    this.displayMessage("", "");
    if (this.propForm.invalid) {
      this.displayMessage("Enter all required fields!", "red");
      return;
    }
    else {
      const mode = this.propForm.controls.mode.value.toUpperCase();
      const tranNo = this.propForm.controls.propertyName.value;
      const tranStatus = this.propStatus.toUpperCase();
      if (mode === TranStatus.ACTIVATE && tranStatus != TranStatus.DELETED) {
        this.displayMessage(`Failed : Property with the given name ${tranNo} is not in deleted status to activate.`, "red");
        return;
      }
      this.preparePropertyCls();
      try {
        this.loader.start();
        this.subSink.sink = this.projectService.UpdatePropertyDetails(this.propCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.propForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.propForm.controls.mode.patchValue("Modify");
            }
            this.masterParams.type = Items.PROPERTY,
              this.masterParams.item = this.propForm.controls['propertyId'].value || '',
              this.masterParams.itemFirstLevel = "",
              this.masterParams.itemSecondLevel = "",
              this.getPropertyData(this.masterParams, this.propForm.get('mode')?.value);
            this.handleSuccess(res, this.propForm.get('mode')?.value);
          }
          else {
            this.displayMessage("Error: " + res.message, "red");
          }
        });
      } catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }
    }
  }

  modeChange(event: string) {
    this.waterDisc();
    if (event.toUpperCase() === Mode.Add) {
      this.propForm = this.formInit();
      this.propForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.propForm.controls['propertyId'].enable();
      this.propForm.controls['ventureName'].enable();
      this.retMessage = "";
      this.blockCount = 0;
      this.unitCount = 0;
      this.propStatus = "";
      this.propertyId = "";
      this.venture = "";
      this.empCode = "";
    }
    else {
      this.propForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.propForm.controls['propertyId'].disable();
      this.propForm.controls['ventureName'].disable();
    }
  }

  reset() {
    this.masterParams.item = this.propertyId;
    if (this.masterParams.item) {
      this.getPropertyData(this.masterParams, this.propForm.get('mode')?.value);
    }
    else {
      this.displayMessage("Select Property!", "red");
      return;
    }
  }

  direction() {
    const dialogRef: MatDialogRef<DirectionsComponent> = this.dialog.open(DirectionsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        status: this.propStatus, type: Items.PROPERTY, Trantype: TranType.BOUNDARY,
        TranNo: this.propForm.controls['propertyId'].value, mode: this.propForm.controls['mode'].value
      }
    });

  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.propForm.controls['mode'].value, tranNo: this.propForm.controls['propertyId'].value,
        search: searchDocs.PROPERTY_DOC, tranType: Items.PROPERTY
      }
    });

  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  onVentureSearch() {
    const body = this.createRequestData(this.propForm.controls['ventureName'].value || '', Items.VENTURE);
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (res && res.data && res.data.nameCount === 1) {
            this.propForm.controls['ventureName'].patchValue(res.data.selName);
            this.venture = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'project': this.propForm.controls['ventureName'].value, 'type': Items.VENTURE,
                  'search': searchType.VENTURE
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.venture = result.itemCode;
                  this.propForm.controls['ventureName'].patchValue(result.itemName);
                }
                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          // this.displayMessage("Error: " + res.message, "red");
          this.displayMessage("Error: " + res.message, "red");
          return;
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  private createRequestData(item: string, type: string,): any {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }
  dateChanged(event: any, controlName: string) {
    const control = this.propForm.get(controlName);
    const inputValue = event.target.value;
    const [day, month, year] = inputValue.split('-').map((part: any) => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        control?.patchValue(date);
      } else {
        this.displayMessage("Error: Invalid date " + inputValue, "red");
        return;
      }
    } else {
      this.displayMessage("Error: Invalid date format " + inputValue, "red");
      return;
    }
  }
  onEmployeeSearch() {
    const body = this.createRequestData(this.propForm.controls['employeeName'].value || '', Items.EMPLOYEE);
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.propForm.controls['employeeName'].patchValue(res.data.selName);
            this.empCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  tranNum: this.propForm.controls['employeeName'].value, PartyType: Items.EMPLOYEE,
                  search: 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.propForm.controls['employeeName'].patchValue(result.partyName);
                  this.empCode = result.code;
                }
                this.dialogOpen = false;
              });
            }

          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  clear() {
    this.propForm = this.formInit();
    this.blockCount = 0;
    this.unitCount = 0;
    this.propStatus = '';
    this.newTranMsg = "";
    this.dialogOpen = false;
    this.empCode = "";
    this.venture = "";
    this.waterDisc();
    this.displayMessage("", "");
  }


  waterDisc() {
    this.subSink.sink = this.propForm.controls.waterDiscount.valueChanges.subscribe((val: boolean) => {
      if (val) {
        this.propForm.controls.discType.enable();
        this.propForm.controls.discRate.enable();
        this.propForm.controls.discRate.patchValue(0);
        this.propForm.controls.discType.patchValue("");
      }
      else {
        this.propForm.controls.discType.disable();
        this.propForm.controls.discRate.disable();
        this.propForm.controls.discRate.patchValue(0);
        this.propForm.controls.discType.patchValue("");
      }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.PROJECT_SCRID,
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
        tranNo: tranNo,
        mode: this.propForm.controls['mode'].value,
        note: this.propForm.controls['notes'].value,
        TranType: Items.PROPERTY,
        search: searchNotes.PROPERTY_NOTE
      }
    });

  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: Items.PROPERTY,
        tranNo: tranNo,
        search: Log.PROPERTY_LOG
      }
    });
  }
}
