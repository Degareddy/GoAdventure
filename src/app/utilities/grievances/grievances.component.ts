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

  // handleError(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = "red";
  // }

  // handleSuccess(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = "green";


  // }

  getmobile() {
    this.mobile = "";
    if (this.flatCode) {
      const body = {
        ...this.commonParams(),
        MessageType: "GRIEVANCE",
        client: "",
        property: this.grievancesForm.get('property')?.value,
        block: this.grievancesForm.get('block')?.value,
        unit: this.flatCode
      }
      try {
        this.subSink.sink = this.smsService.getMessagingContacts(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
            this.mobile = res.data[0].mobile.replace(/[\s+]/g, '');
          }
          else {
            // this.textMessageClass = "red";
            // this.retMessage = res.message;
            this.displayMessage("Error: " + res.message, "red");
          }
        });
      }
      catch (ex: any) {
        // this.textMessageClass = "red";
        // this.retMessage = ex.message;
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }
    else {
      // this.textMessageClass = "red";
      // this.retMessage = "Select valid Flat!";
      this.displayMessage("Select valid Flat!", "red");
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
        serviceType: "SMS",
        MsgType: "SMS",
        mobile: this.mobile,
        message: messages
      }
      if (this.mobile) {
        this.subSink.sink = this.smsService.SendSingleSMS(body).subscribe((res: any) => {
          if (res.status.toUpperCase() === "SUCCESS") {
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
      const modes$ = this.masterService.getModesList({ ...this.commonParams(), item: 'ST912' });
      const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'PROPERTY' });
      const complaintList$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'GRIEVANCES' });
      this.subSink.sink = forkJoin([modes$, property$, complaintList$]).subscribe(
        ([modesRes, propRes, complainRes]: any) => {
          this.modes = modesRes['data'];
          this.props = propRes['data'];
          if (this.props.length === 1) {
            this.grievancesForm.get('property')!.setValue(this.props[0].itemCode);
            this.onSelectedPropertyChanged();
          }
          this.compalintList = complainRes['data'];
          if (this.compalintList.length === 1) {
            this.grievancesForm.get('complaintType')!.setValue(this.compalintList[0].itemCode);
          }
        },
        error => {
          // this.handleError(error);
          this.displayMessage("Error: " + error.message, "red");
        }
      );

    } catch (ex: any) {
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
    }
    const body = {
      ...this.commonParams(),
      erviceType: "SMS",
      msgType: "SMS"
    }
    try {
      this.subSink.sink = this.smsService.getMessageCredentials(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.API_KEY = res.data.apI_KEY;
          this.PARTNER_ID = res.data.partneR_ID;
          this.SHORTCODE = res.data.shortcode;
          // this.smsUrl = res.data.apI_SMS_URL;
          // this.bulkSmsUrl = res.data.apI_BULK_SMS_URL;
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
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
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.grievancesForm.controls['property'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.blocks = result['data'];
          if (this.blocks.length === 1) {
            this.grievancesForm.get('block')!.setValue(this.blocks[0].itemCode);
            this.onSelectedBlockChanged()
          }
        }
        else {
          // this.handleError(result);
          this.displayMessage("Error: " + result.message, "red");
          this.blocks = [];
        }
      });
    }
    catch (ex: any) {
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }

  onFlatSearch() {
    if (this.grievancesForm.controls['unit'].value == "") {
      this.flatCode = "";
    }
    const body = {
      ...this.commonParams(),
      Type: 'FLAT',
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
                  'flat': this.flatName, 'type': 'FLAT',
                  'search': 'Flat Search', property: this.grievancesForm.controls['property'].value, block: this.grievancesForm.controls['block'].value,
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
          // this.retMessage = res.message;
          // this.textMessageClass = 'red';
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      // this.retMessage = "Exception: " + ex.message;
      // this.textMessageClass = 'red';
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  onSelectedBlockChanged() {
    this.clearMsgs();
    this.masterParams.type = 'FLAT';
    this.masterParams.item = this.grievancesForm.controls['property'].value;
    this.masterParams.itemFirstLevel = this.grievancesForm.controls['block'].value;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === "SUCCESS") {
          this.flats = result['data'];
        }
        else {
          // this.handleError(result);
          this.displayMessage("Error: " + result.message, "red");
          this.flats = [];
        }
      });
    }
    catch (ex: any) {
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }

  prepareGrvCls() {
    const formValues = this.grievancesForm.value;
    this.grcls.mode = "Add";
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
    this.grcls.issueStatus = "Open";

    // const grvtDate: string | null = this.grievancesForm.get('grvtDate')?.value;

    // if (grvtDate !== null) {
    //   const transformedDate = this.datePipe.transform(grvtDate, "yyyy-MM-dd HH:mm");
    //   if (transformedDate !== null) {
    //     this.grcls.raisedDate = new Date(transformedDate as string);
    //   }
    // }
    // Get the local date input (from the form)
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
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.grievancesForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareGrvCls();
        this.loader.start();
        this.subSink.sink = this.utilityService.UpdateGrievance(this.grcls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            // this.handleSuccess(res);
            this.displayMessage(res.message, "green");
            this.refernceNo = res.tranNoNew;
            if (this.API_KEY != "" && this.API_KEY != undefined) {
              this.getmobile();
              const val = "SMS"
              this.getGrievanceDetails(val);
            }
            else {
              this.getGrievanceDetails("");
            }

          }
          else {
            // this.handleError(res);
            this.displayMessage("Error: " + res.message, "red");
          }
        })
      }
      catch (ex: any) {
        // this.handleError(ex);
        this.displayMessage("Exception: " + ex.message, "red");
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
      TranType: 'GRIEVANCE',
      TranNo: " ",
      Party: " ",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
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
                data: { 'tranNum': "  ", 'search': 'Grievance Search', 'TranType': "GRIEVANCE" }  // Pass any data you want to send to CustomerDetailsComponent
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
          // this.handleError(res);
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
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
    this.grParams.issueStatus = "ANY";
    this.grParams.fromDate = formattedFirstDayOfMonth;
    this.grParams.toDate = formattedCurrentDate;
    this.grParams.tranNo = this.refernceNo;
    this.grParams.tranType = "GRIEVANCE";
    try {
      this.loader.start();
      this.subSink.sink = this.utilityService.GetTenantSpecificGrievanceDetails(this.grParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.bindFormData(res);
          if (val === "SMS") {
            this.sendSMS(res);
          }
        }
        else {
          // this.handleError(res);
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      // this.handleError(ex);
      this.displayMessage("Exception: " + ex.message, "red");
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
      data: { mode: "Modify", tranNo: this.refernceNo, search: 'Grievance Pics', tranType: "Grievances" }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST912",
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
