import { MaterialRequestDetailsComponent } from './material-request-details/material-request-details.component';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { materialRequestHdr, } from '../inventory.class';
import { DatePipe } from '@angular/common';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { Router } from '@angular/router';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { LogComponent } from 'src/app/general/log/log.component';
@Component({
  selector: 'app-material-request',
  templateUrl: './material-request.component.html',
  styleUrls: ['./material-request.component.css']
})
export class MaterialRequestComponent implements OnInit, OnDestroy {
  modes: Item[] = [];
  locationList: any[] = [];
  mrhForm!: FormGroup;
  status!: string;
  private subSink!: SubSink;
  textMessageClass: string = "";
  retMessage: string = "";
  newMessage: string = "";
  tranStatus: string = "";
  receivedOn!: Date;
  receivedBy!: string;
  issuedOn!: Date;
  issuedBy!: string;
  approvedOn!: Date;
  approvedBy!: string;
  @Input() max: any;
  tomorrow = new Date();
  public disableDetail: boolean = true;
  dialogOpen = false;
  public fetchStatus: boolean = true;
  //materialRequestDetailscls!: materialRequestDetails;
  materialReqHdrcls: materialRequestHdr;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private router: Router,
    private loader: NgxUiLoaderService, private userDataService: UserDataService,
    private masterService: MastersService, private invService: InventoryService,
    private datePipe: DatePipe) {
    this.mrhForm = this.formInit();
    this.subSink = new SubSink();
    // this.materialRequestDetailscls = new materialRequestDetails();
    this.materialReqHdrcls = new materialRequestHdr();
  }

  formInit() {
    return this.fb.group({
      tranNo: ['', Validators.maxLength(30)],
      tranDate: [new Date(), [Validators.required]],
      requestTo: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.maxLength(255)]],
      mode: ['View']
    });
  }

  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.mrhForm.controls['mode'].setValue(event, { emitEvent: false });
      this.mrhForm.get('tranNo')!.disable();
      this.mrhForm.get('tranNo')!.clearValidators();
      this.mrhForm.get('tranNo')!.updateValueAndValidity();
      this.loadData();
    }
    else {
      this.mrhForm.controls['mode'].setValue(event, { emitEvent: false });
      this.mrhForm.get('tranNo')!.enable();
    }
  }

  onDetailsCilcked() {
    const dialogRef: MatDialogRef<MaterialRequestDetailsComponent> = this.dialog.open(MaterialRequestDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNum: this.mrhForm.controls['tranNo'].value, TranType: "MATREQ",
        search: 'Material Search',
        mode: this.mrhForm.controls['mode'].value
      }
    });
  }

  ngOnInit(): void {
    this.approvedOn = new Date();
    this.receivedOn = new Date();
    this.issuedOn = new Date();
    this.approvedOn = new Date();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  loadData() {
    const body = {
      ...this.commonParams(),
      item: 'ST306'
    };
    this.subSink.sink = this.masterService.getModesList(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.modes = res['data'];
      }
    });

    this.getLocationsList();
    this.materialReqHdrcls.langID = this.userDataService.userData.langId;
    this.materialReqHdrcls.company = this.userDataService.userData.company;
    this.materialReqHdrcls.location = this.userDataService.userData.location;
    this.materialReqHdrcls.user = this.userDataService.userData.userID;
    this.materialReqHdrcls.refNo = this.userDataService.userData.sessionID;
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'MATREQ',
        TranNo: this.mrhForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY"
      }
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.materialReqHdrcls.tranNo = res.data.selTranNo;
            this.MaterialData(this.materialReqHdrcls, this.mrhForm.get('mode')?.value);
          }
          else {
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                'tranNum': this.mrhForm.controls['tranNo'].value, 'TranType': "MATREQ",
                'search': 'Material Search'
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result != true) {
                this.materialReqHdrcls.tranNo = result;
                try {
                  this.MaterialData(this.materialReqHdrcls, this.mrhForm.get('mode')?.value);
                }
                catch (ex: any) {
                  this.retMessage = ex;
                  this.textMessageClass = 'red';
                }
              }
            });
          }
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  MaterialData(mrDet: materialRequestHdr, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.invService.GetMaterialRequest(mrDet).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.mrhForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.mrhForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.mrhForm.controls['requestTo'].setValue(res['data'].requestToLocn);
          this.mrhForm.controls['purpose'].setValue(res['data'].purpose);
          this.receivedBy = res['data'].receivedBy;
          this.issuedBy = res['data'].issuedBy;
          this.approvedOn = res['data'].approvedOn.startsWith('0001-01-01') ? '' : res['data'].approvedOn;
          this.issuedOn = res['data'].issuedOn.startsWith('0001-01-01') ? '' : res['data'].issuedOn;
          this.receivedOn = res['data'].receivedOn.startsWith('0001-01-01') ? '' : res['data'].receivedOn;
          this.approvedBy = res['data'].approvedBy;
          this.tranStatus = res['data'].tranStatus;
          if (mode === "View") {
            this.textMessageClass = 'green';
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage = this.newMessage;
          }

        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex;
    }

  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  materialReqDetailscls() {
    this.materialReqHdrcls.company = this.userDataService.userData.company;
    this.materialReqHdrcls.location = this.userDataService.userData.location
    this.materialReqHdrcls.langID = this.userDataService.userData.langId
    this.materialReqHdrcls.tranNo = this.mrhForm.controls['tranNo'].value;
    this.materialReqHdrcls.requestToLocn = this.mrhForm.controls['requestTo'].value;
    this.materialReqHdrcls.tranDate = this.mrhForm.controls['tranDate'].value;
    this.materialReqHdrcls.tranStatus = this.tranStatus;
    this.materialReqHdrcls.purpose = this.mrhForm.controls['purpose'].value;
    this.materialReqHdrcls.approvedBy = this.approvedBy;
    this.materialReqHdrcls.approvedOn = new Date;
    this.materialReqHdrcls.issuedBy = this.issuedBy;
    this.materialReqHdrcls.issuedOn = new Date;
    this.materialReqHdrcls.receivedBy = this.receivedBy;
    this.materialReqHdrcls.receivedOn = new Date;
    this.materialReqHdrcls.mode = this.mrhForm.controls['mode'].value;
    this.materialReqHdrcls.user = this.userDataService.userData.userID;
    this.materialReqHdrcls.refNo = this.userDataService.userData.sessionID;
  }

  convertToDate(dateString: string | null): Date | null {
    if (!dateString) {
      return null;
    }
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return null;
    }
    const year = +parts[2];
    const month = +parts[1] - 1; // Months are 0-indexed in JavaScript Date
    const day = +parts[0];
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  onUpdate() {
    this.clearMsg();
    if (this.mrhForm.invalid) {
      return;
    }
    else {
      this.materialReqDetailscls();
      try {
        this.loader.start();
        this.subSink.sink = this.invService.updatematerialRequest(this.materialReqHdrcls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newMessage = res.message;
            this.textMessageClass = "green";
            this.modeChange("Modify");
            this.mrhForm.controls['tranNo'].setValue(res.tranNoNew);
            this.materialReqHdrcls.tranNo = res.tranNoNew;
            if (res.tranNoNew) {
              this.MaterialData(this.materialReqHdrcls, this.mrhForm.get('mode')?.value);
            }
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = "red";
      }
    }
  }

  insert() {

  }

  reset() {
    this.mrhForm.reset();
    this.mrhForm = this.formInit();
    this.status = '';
    this.tranStatus = '';
    this.retMessage = '';
    // this.receivedOn = "";
    // this.receivedBy = "";
    // this.issuedOn = "";
    // this.issuedBy = "";
    // this.approvedOn = "";
    // this.approvedBy = "";
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.mrhForm.controls['mode'].value, tranNo: this.mrhForm.controls['tranNo'].value, search: 'Material-Request Docs', tranType: "MATREQ" }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.MaterialData(this.materialReqHdrcls, this.mrhForm.get('mode')?.value);
      }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST306",
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.mrhForm.controls['mode'].value,
        //'note': this.mrhForm.controls['notes'].value,
        'TranType': "MATREQ",
        'search':"Material Request Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  getLocationsList() {
    this.locationList = [];
    const locationbody = {
      ...this.commonParams(),
      item: "LOCATION",
      mode:this.mrhForm.get('mode')?.value
    };
    try {
      this.subSink.sink = this.invService.GetMasterItemsList(locationbody).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.locationList = res['data'];
          if (this.locationList.length === 1) {
            this.mrhForm.controls['requestTo'].patchValue(this.locationList[0].itemCode, { emitEvent: false });
          }
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }

  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "MATREQ",
        'tranNo': tranNo,
        'search': 'Material Request log'
      }
    });
  }

}
