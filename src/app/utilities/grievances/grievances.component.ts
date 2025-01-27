import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/sales/sales.class';
import { SubSink } from 'subsink';
import { GreivanceClass, GrievanceParams } from '../utilities.class'
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ActivatedRoute, Router } from '@angular/router';
import { FlatSearchComponent } from 'src/app/general/flat-search/flat-search.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { SmsService } from 'src/app/Services/sms.service';
import { ToastrService } from 'ngx-toastr';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { runInThisContext } from 'vm';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-grievances',
  templateUrl: './grievances.component.html',
  styleUrls: ['./grievances.component.css']
})

export class GrievancesComponent implements OnInit, OnDestroy {
  formTitle: string = "tenant grievance service"
  grievancesForm!: FormGroup
  textMessageClass: string = "";
  retMessage: string = "";
  @Input() max: any;
  tomorrow = new Date();
  modes: Item[] = []
  masterParams!: MasterParams;
  grParams!: GrievanceParams;
  currentSeconds: number = 0;
  private subSink: SubSink;
  props: Item[] = [];
  blocks: Item[] = [];
  flats: Item[] = [];
  issueStatus!: string;
  compalintList: Item[] = [];
  grcls: GreivanceClass;
  refernceNo: string = "";
  detdialogOpen = false;
  costToMgmt: number = 0;
  costToLandlord: number = 0;
  costToTenant: number = 0;
  block!: string;
  unit!: string
  ttDays!: string;
  ttHours!: string;
  ttMins!: string;
  raisedDate!: string;
  allocatedDate!: string;
  closedDate!: string;
  yearlyCount: number = 0;
  monthlyCount: number = 0;
  priorityList: any = [
    { itemCode: "Urgent", itemName: "Urgent" },
    { itemCode: "Emergency", itemName: "Emergency" },
    { itemCode: "Immediate", itemName: "Immediate" },
    { itemCode: "Not Immediate", itemName: "Not Immediate" }
  ];
  flatCode: string = '';
  dialogOpen: any;
  flatName: any;
  mobile: string = "";
  private API_KEY: string = "";
  private PARTNER_ID: string = "";
  private SHORTCODE: string = "";
  private smsUrl: string = "";
  bulkSmsUrl: any;
  constructor(private fb: FormBuilder, protected route: ActivatedRoute, public userDataService: UserDataService,
    protected router: Router, private smsService: SmsService, private toaster: ToastrService,
    private datePipe: DatePipe, protected purchaseService: PurchaseService,
    private loader: NgxUiLoaderService, private masterService: MastersService,
    private utilityService: UtilitiesService, public dialog: MatDialog) {
    this.grievancesForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.grcls = new GreivanceClass();
    this.grParams = new GrievanceParams();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit() {

    this.loadData();
  }

  getCurrentDateTime(): string {
    const now = new Date();
    const formattedDateTime = this.datePipe.transform(now, 'yyyy-MM-dd HH:mm');
    return formattedDateTime ? `${formattedDateTime}` : '';
  }

  getmobile() {
    this.mobile = "";
    if (this.flatCode) {
      const body = {
        ...this.commonParams(),
        MessageType: TranType.GRIEVANCE,
        client: "",
        property: this.grievancesForm.get('property')?.value,
        block: this.grievancesForm.get('block')?.value,
        unit: this.flatCode
      }
      try {
        this.subSink.sink = this.smsService.getMessagingContacts(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.mobile = res.data[0].mobile.replace(/[\s+]/g, '');
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
    else {
      this.displayMessage(displayMsg.ERROR + "Select valid Flat!", TextClr.red);
    }

  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  sendSMS(res: any) {
    if (this.mobile) {
      const dateObject = new Date(res.data.raisedDate);
      const receiptYear = this.datePipe.transform(dateObject, 'dd-MM-yyyy');
      const messages = "Dear " + res.data.tenantName + ", we acknowledge your complaint with Ref No. " + res.data.tranNo +
        " dated " + receiptYear + ". We try to resolve the issue earliest possible. Thank you.\n`" + this.userDataService.userData.defaultCompanyName;
      const body = {
        ...this.commonParams(),
        serviceType: Type.SMS,
        MsgType: Type.SMS,
        mobile: this.mobile,
        message: messages
      }
      if (this.mobile) {
        this.subSink.sink = this.smsService.SendSingleSMS(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.toaster.success(res.message, "SUCCESS")
          } else {
            this.toaster.error('Invalid response format for sending SMS', "ERROR");
          }
        });
      }
    }

  }

  loadData() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;

    try {
      const modes$ = this.masterService.getModesList({ ...this.commonParams(), item: ScreenId.GRIEVANCES_SCRID });
      const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.PROPERTY });
      const complaintList$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.GRIEVANCES });
      this.subSink.sink = forkJoin([modes$, property$, complaintList$]).subscribe(
        ([modesRes, propRes, complainRes]: any) => {

          if (modesRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.modes = modesRes['data'];
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Modes list not found", TextClr.red);
          }
          if (propRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.props = propRes['data'];
            if (this.props.length === 1) {
              this.grievancesForm.get('property')!.setValue(this.props[0].itemCode);
              this.onSelectedPropertyChanged();
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Property list not found", TextClr.red);
          }
          if (complainRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.compalintList = complainRes['data'];
            if (this.compalintList.length === 1) {
              this.grievancesForm.get('complaintType')!.setValue(this.compalintList[0].itemCode);
            }
          } else {
            this.displayMessage(displayMsg.ERROR + "Complaint list not found", TextClr.red);
          }

        },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
    const body = {
      ...this.commonParams(),
      erviceType: Type.SMS,
      msgType: Type.SMS
    }
    try {
      this.subSink.sink = this.smsService.getMessageCredentials(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.API_KEY = res.data.apI_KEY;
          this.PARTNER_ID = res.data.partneR_ID;
          this.SHORTCODE = res.data.shortcode;
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  formInit() {
    return this.fb.group({
      property: ['', Validators.required],
      block: ['', Validators.required],
      unit: ['', Validators.required],
      complaintType: ['', [Validators.required]],
      complaint: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      remarks: ['', Validators.required],
      grvtDate: [{ value: new Date(), disabled: true }]
    })
  }

  clearMsgs() {
    this.displayMessage("", "");
  }

  onSelectedPropertyChanged() {
    this.clearMsgs();
    this.masterParams.type = Type.BLOCK;
    this.masterParams.item = this.grievancesForm.controls['property'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.blocks = result['data'];
          if (this.blocks.length === 1) {
            this.grievancesForm.get('block')!.setValue(this.blocks[0].itemCode);
            this.onSelectedBlockChanged()
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Block list not found", TextClr.red);
          this.blocks = [];
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  onFlatSearch() {
    if (this.grievancesForm.controls['unit'].value == "") {
      this.flatCode = "";
    }
    const body = {
      ...this.commonParams(),
      Type: Type.FLAT,
      Item: this.grievancesForm.controls['unit'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utilityService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.grievancesForm.controls['unit'].patchValue(res.data.selName);
            this.masterParams.item = res.data.selCode;
            this.flatCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<FlatSearchComponent> = this.dialog.open(FlatSearchComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'flat': this.flatName, 'type': Type.FLAT,
                  'search': 'Flat Search', property: this.grievancesForm.controls['property'].value,
                  block: this.grievancesForm.controls['block'].value,
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.grievancesForm.controls['unit'].patchValue(result.unitName);
                  this.masterParams.item = result.unitId;
                  this.flatCode = result.unitId;
                }
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

  onSelectedBlockChanged() {
    this.clearMsgs();
    this.masterParams.type = Type.FLAT;
    this.masterParams.item = this.grievancesForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.grievancesForm.controls['block'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.flats = result['data'];
        }
        else {
          this.displayMessage(displayMsg.ERROR + result.message, TextClr.red);
          this.flats = [];
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  prepareGrvCls() {
    const formValues = this.grievancesForm.value;
    this.grcls.mode = Mode.Add;
    this.grcls.company = this.userDataService.userData.company;
    this.grcls.location = this.userDataService.userData.location;
    this.grcls.langId = this.userDataService.userData.langId;
    this.grcls.user = this.userDataService.userData.userID;
    this.grcls.refNo = this.userDataService.userData.sessionID;
    this.grcls.complaintType = formValues.complaintType;
    this.grcls.priority = formValues.priority;
    this.grcls.unit = this.flatCode
    this.grcls.block = formValues.block;
    this.grcls.property = formValues.property;
    this.grcls.complaint = formValues.complaint;
    this.grcls.remarks = formValues.remarks;
    this.grcls.tenant = this.userDataService.userData.userID;
    this.grcls.issueStatus = TranStatus.OPEN;
    const grvtDate: string | null = this.grievancesForm.get('grvtDate')?.value;
    if (grvtDate !== null) {
      const localDate = new Date(grvtDate);
      localDate.setHours(localDate.getHours() + 5, localDate.getMinutes() + 30);
      const utcDateString = localDate.toISOString();
      this.grcls.raisedDate = new Date(utcDateString);
    }
    this.grcls.tranNo = "";
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  onSubmit() {
    this.displayMessage("", "");
    if (this.grievancesForm.invalid) {
      this.displayMessage(displayMsg.ERROR + "Please fill all the required fields", TextClr.red);
      return;
    }
    else {
      try {
        this.prepareGrvCls();
        this.loader.start();
        this.subSink.sink = this.utilityService.UpdateGrievance(this.grcls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.refernceNo = res.tranNoNew;
            if (this.API_KEY != "" && this.API_KEY != undefined) {
              this.getmobile();
              const val = Type.SMS
              this.getGrievanceDetails(val);
            }
            else {
              this.getGrievanceDetails("");
            }

          }
          else {
            this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
          }
        })
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }

    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onSearchCilcked(val: string) {
    this.textMessageClass = "";
    this.retMessage = "";
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: TranType.GRIEVANCE,
      TranNo: " ",
      Party: " ",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus:TranStatus.ANY
    }
    try {
      this.subSink.sink = this.purchaseService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.refernceNo = res.data.selTranNo;
            this.getGrievanceDetails(val);
          }
          else {
            this.retMessage = '';
            if (!this.detdialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: { 'tranNum': " ", 'search': 'Grievance Search', 'TranType': TranType.GRIEVANCE }  // Pass any data you want to send to CustomerDetailsComponent
              });
              this.detdialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.detdialogOpen = false;
                if (result != true) {
                  this.refernceNo = result;
                  this.getGrievanceDetails(val);
                }

              });
            }
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  getGrievanceDetails(val: string) {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    this.grParams.company = this.userDataService.userData.company;
    this.grParams.location = this.userDataService.userData.location;
    this.grParams.refNo = this.userDataService.userData.sessionID;
    this.grParams.user = this.userDataService.userData.userID;
    this.grParams.langId = this.userDataService.userData.langId;
    this.grParams.issueStatus = TranStatus.ANY;
    this.grParams.fromDate = formattedFirstDayOfMonth;
    this.grParams.toDate = formattedCurrentDate;
    this.grParams.tranNo = this.refernceNo;
    this.grParams.tranType =TranType.GRIEVANCE;
    try {
      this.loader.start();
      this.subSink.sink = this.utilityService.GetTenantSpecificGrievanceDetails(this.grParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.bindFormData(res);
          if (val === Type.SMS) {
            this.sendSMS(res);
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }

  bindFormData(res: any) {
    this.issueStatus = res['data'].issueStatus;
    this.costToMgmt = res['data'].costToMgmt;
    this.costToLandlord = res['data'].costToLandlord;
    this.costToTenant = res['data'].costToTenant;
    this.block = res['data'].block;
    this.unit = res['data'].unit;
    this.yearlyCount = res['data'].yearlyCount;
    this.monthlyCount = res['data'].monthlyCount;
    this.raisedDate = res['data'].raisedDate;
    this.ttDays = res['data'].ttDays;
    this.ttHours = res['data'].ttHours;
    this.ttMins = res['data'].ttMins;
    this.allocatedDate = res['data'].allocatedDate;
    this.closedDate = res['data'].closedDate;
    this.flatCode = res['data'].unit;
    this.grievancesForm.patchValue({
      property: res['data'].property,
      complaintType: res['data'].complaintType,
      complaint: res['data'].complaint,
      remarks: res['data'].remarks,
      priority: res['data'].priority,
      unit: res['data'].unitName
    });
  }

  Reset() {
    this.clear();
    this.grievancesForm = this.formInit();
  }

  clear() {
    this.refernceNo = "";
    this.raisedDate = "";
    this.allocatedDate = "";
    this.closedDate = "";
    this.ttDays = '';
    this.ttHours = '';
    this.ttMins = '';
    this.yearlyCount = 0;
    this.monthlyCount = 0;
    this.costToMgmt = 0;
    this.costToLandlord = 0;
    this.costToTenant = 0;
    this.block = '';
    this.unit = '';
    this.issueStatus = '';
    this.grievancesForm = this.formInit();
    this.displayMessage("", "");
  }

  onDocsCilcked() {
    if (this.refernceNo == '') {
      this.displayMessage("Select reference number to upload picture.", "red")
      return;
    }
    else {
      this.displayMessage("", "");
    }
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: "Modify", tranNo: this.refernceNo, search: 'Grievance Docs', tranType:TranType.GRIEVANCES }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.GRIEVANCES_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }


  NotesDetails() {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': this.refernceNo,
        'mode': 'modify',
        'note': this.grievancesForm.controls['remarks'].value,
        'TranType': "GRIEVANCES",
        'search': "GRIEVANCES Notes"
      }
    });
  }

}
