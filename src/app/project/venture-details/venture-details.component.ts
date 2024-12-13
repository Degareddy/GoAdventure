import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { venturnClass } from '../Project.class';
import { Router } from '@angular/router';
import { DirectionsComponent } from 'src/app/general/directions/directions.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { StakeholderDetailsComponent } from './stakeholder-details/stakeholder-details.component';

@Component({
  selector: 'app-venture-details',
  templateUrl: './venture-details.component.html',
  styleUrls: ['./venture-details.component.css']
})
export class VentureDetailsComponent implements OnInit, OnDestroy {
  vtrDetForm!: FormGroup;
  newTranMsg!: string;
  selMode!: string;
  tranNoNew!: string;
  modes: Item[] = [];
  ventureList: Item[] = [];
  retMessage: string="";
  textMessageClass: string="";
  masterParams!: MasterParams;
  private subSink: SubSink;
  private ventureCls!: venturnClass;
  public disableDetail: boolean = true;
  
  dialogOpen = false;
  public fetchStatus: boolean = true;
  ventureDetails!: string;
  vendorCode!: string;
  tranStatus!: string;
  @Input() max: any;
  today = new Date();
  constructor(private fb: FormBuilder,
    protected router: Router,
    private loader: NgxUiLoaderService,
    private utlService: UtilitiesService,
    private masterService: MastersService,
    private prjService: ProjectsService, private userDataService: UserDataService,
    private datePipe: DatePipe,
    public dialog: MatDialog) {
    this.vtrDetForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.ventureCls = new venturnClass();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  multiClient() {
    
    const dialogRef: MatDialogRef<StakeholderDetailsComponent> = this.dialog.open(StakeholderDetailsComponent, {
      width: '90%',
      disableClose: false,
      data: {
        type: '',
        Trantype: "",
        Project: this.vtrDetForm.get('ventureName')?.value,
        Code:this.vtrDetForm.get('code')!.value ,
        Flat: '',
        mode: this.vtrDetForm.get('mode')?.value,
        status: ''
      }
    });

  }

  formInit() {
    return this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(10)]],
      ventureName: ['', [Validators.required, Validators.maxLength(50)]],
      venture: [''],
      projLocation: ['', [Validators.required, Validators.maxLength(50)]],
      latitude: ['', [Validators.required]],
      longitude: ['', [Validators.required]],
      altitude_M: ['', [Validators.required]],
      acquiredOn: [new Date()],
      extent_M2: ['', [Validators.required]],
      vendor: ['', [Validators.required, Validators.maxLength(50)]],
      remarks: [''],
      mode: ['View']
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
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM801'
    };
    const venturebody: getPayload = {
      ...this.commonParams(),
      item: "VENTURE"
    };

    this.masterService.getModesList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.modes = res['data'];
      }
      else {
        this.retMessage = "Modes list empty!";
        this.textMessageClass = "red";
      }
    });

    this.masterService.GetMasterItemsList(venturebody).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.ventureList = res['data'];
      }
      else {
        this.retMessage = "Venture list empty!";
        this.textMessageClass = "red";
      }
    });

  }

  onSelectedItemChanged(event: any) {
    this.vtrDetForm.controls['venture'].patchValue(event.value);
    this.ventureDetails = event.value;
    this.getVentureData(this.ventureDetails, this.vtrDetForm.get('mode')?.value);
  }

  getVentureData(venturedt: string, mode: string) {
    try {
      this.masterParams.item = venturedt;
      this.masterParams.type = 'VENTURE';
      this.loader.start();
      this.subSink.sink = this.prjService.getVentureDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.vtrDetForm.controls['venture'].patchValue(res['data'].code);
          this.vtrDetForm.controls['code'].patchValue(res['data'].code);
          this.vtrDetForm.controls['ventureName'].patchValue(res['data'].ventureName);
          this.vtrDetForm.controls['projLocation'].patchValue(res['data'].projLocation);
          this.vtrDetForm.controls['latitude'].patchValue(res['data'].latitude);
          this.vtrDetForm.controls['longitude'].patchValue(res['data'].longitude);
          this.vtrDetForm.controls['altitude_M'].patchValue(res['data'].altitude_M);
          this.vtrDetForm.controls['acquiredOn'].patchValue(res['data'].acquiredOn);
          this.vtrDetForm.controls['extent_M2'].patchValue(res['data'].extent_M2);
          this.vtrDetForm.controls['vendor'].patchValue(res['data'].vendorNames);
          this.ventureCls.vendor = res['data'].vendor;
          this.tranStatus = res.data.venStatus;
          this.vtrDetForm.controls['remarks'].patchValue(res['data'].remarks);
          this.textMessageClass = 'green';
          if (mode != 'View') {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
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
      this.retMessage = "Exception " + ex.message;
    }
  }

  reset() {
    this.textMessageClass = '';
    this.retMessage = '';
  }

  clear() {
    this.vtrDetForm = this.formInit();
    this.retMessage = '';
    this.tranStatus = '';
    this.textMessageClass = '';
  }

  prepareSaveCls() {
    this.ventureCls.company = this.userDataService.userData.company;
    this.ventureCls.location = this.userDataService.userData.location;
    this.ventureCls.langId = this.userDataService.userData.langId;
    this.ventureCls.user = this.userDataService.userData.userID;
    this.ventureCls.refNo = this.userDataService.userData.sessionID;

    this.ventureCls.mode = this.vtrDetForm.get('mode')!.value;
    this.ventureCls.code = this.vtrDetForm.get('code')!.value;
    this.ventureCls.ventureName = this.vtrDetForm.get('ventureName')!.value;
    this.ventureCls.projLocation = this.vtrDetForm.get('projLocation')!.value;
    this.ventureCls.latitude = this.vtrDetForm.get('latitude')!.value;
    this.ventureCls.longitude = this.vtrDetForm.get('longitude')!.value;
    this.ventureCls.altitude_M = this.vtrDetForm.get('altitude_M')!.value;
    var acdate = this.datePipe.transform(new Date(this.vtrDetForm.get('acquiredOn')!.value), 'yyyy-MM-dd');
    this.ventureCls.acquiredOn = acdate;
    this.ventureCls.extent_M2 = this.vtrDetForm.get('extent_M2')!.value;
    // this.ventureCls.vendor = this.vtrDetForm.get('vendor')!.value;
    this.ventureCls.venStatus = this.tranStatus;
    this.ventureCls.remarks = this.vtrDetForm.get('remarks')!.value;

  }

  onSubmit() {
    if (this.vtrDetForm.invalid) {
      return;
    }
    else {
      try {
        this.prepareSaveCls();
        this.loader.start();
        this.subSink.sink = this.prjService.updateVentureDetails(this.ventureCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            this.ventureDetails = res.tranNoNew;
            if (this.vtrDetForm.controls['mode'].value == "Add") {
              this.modeChange("Modify");
              this.ventureList.push({ itemCode: this.vtrDetForm.get('code')?.value, itemName: this.vtrDetForm.get('ventureName')?.value })

            }
            this.getVentureData(this.ventureDetails, this.vtrDetForm.get('mode')?.value);
          } else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        },
          (error: any) => {
            this.loader.stop();
            this.retMessage = error.message;
            this.textMessageClass = 'red';
          }
        );
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }

  onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: "SUPPLIER",
      Item: this.vtrDetForm.get('vendor')!.value
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.vtrDetForm.get('vendor')!.patchValue(res.data.selName);
            this.ventureCls.vendor = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.vtrDetForm.controls['vendor'].value, 'PartyType': 'SUPPLIER',
                  'search': 'Vendor Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.vtrDetForm.get('vendor')!.patchValue(result.partyName);
                  this.ventureCls.vendor = result.code;
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.vtrDetForm = this.formInit();
      this.vtrDetForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.retMessage = "";
      this.textMessageClass = "";
      this.vtrDetForm.get('venture')!.disable();
    }
    else {
      this.vtrDetForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.vtrDetForm.get('venture')!.enable();
    }
  }

  close() {
    this.router.navigateByUrl('/home');
  }

  direction() {
    const dialogRef: MatDialogRef<DirectionsComponent> = this.dialog.open(DirectionsComponent, {
      width: '90%',
      disableClose: true,
      data: { type: 'VENTURE', Trantype: "BOUNDARY", TranNo: this.vtrDetForm.controls['venture'].value, mode: this.vtrDetForm.controls['mode'].value }
    });
    dialogRef.afterClosed().subscribe(result => {
      //console.log(`Dialog result: ${result}`);
    });
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%', // Set the width of the dialog
      disableClose: true,
      data: { mode: this.vtrDetForm.controls['mode'].value, tranNo: this.vtrDetForm.controls['venture'].value, search: 'Venture Docs', tranType: "VENTURE" }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM801",
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

  NotesDetails(tranNo:any){
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo,
      'mode': this.vtrDetForm.controls['mode'].value,
      'note':this.vtrDetForm.controls['remarks'].value ,
      'TranType': "VENTURE",  // Pass any data you want to send to CustomerDetailsComponent
      'search' :"Venture Notes"}
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "VENTURE",
        'tranNo': tranNo,
        'search': 'Venture Log'
      }
    });
  }


}
