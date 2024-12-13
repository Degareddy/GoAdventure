import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { plotClass } from '../Project.class';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DirectionsComponent } from 'src/app/general/directions/directions.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Router } from '@angular/router';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';

@Component({
  selector: 'app-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.css']
})
export class PlotComponent implements OnInit, OnDestroy {
  pltDetForm!: FormGroup;
  newTranMsg!: string;
  selMode!: string;
  plotCls !: plotClass;
  modes: Item[] = [];
  ventureList: Item[] = [];
  plotsList: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  masterParams!: MasterParams;
  saleDate!: string;
  regnDate!: string;
  plotStatus!: string;
  private subSink: SubSink;
  dialogOpen = false;
  plotsDt!: string;
  @Input() max: any;
  today = new Date();

  constructor(private fb: FormBuilder,
    private masterService: MastersService,
    private loader: NgxUiLoaderService, public dialog: MatDialog,
    private projectService: ProjectsService, private userDataService: UserDataService,
    private datePipe: DatePipe, protected router: Router) {
    this.pltDetForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.plotCls = new plotClass();
  }
  formInit() {
    return this.fb.group({
      // venture: ['', [Validators.required, Validators.maxLength(10)]],
      plotNo: ['', [Validators.required, Validators.maxLength(10)]],
      plotName: ['', [Validators.required, Validators.maxLength(50)]],
      latitude: [0],
      longitude: [0],
      extent_M2: ['', [Validators.required]],
      client: ['', [Validators.maxLength(50)]],
      availableFrom: [new Date(), [Validators.required]],
      // saleDate: [''],
      // regnDate: [''],
      plotStatus: ['', [Validators.maxLength(20)]],
      remarks: ['', [Validators.maxLength(255)]],
      mode: ['View'],
      venture: ['', [Validators.required, Validators.maxLength(255)]],
      plot: ['']
    })
  }
  ngOnInit(): void {
    this.loadData();
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.langId = this.userDataService.userData.langId;
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
    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM802'
    };
    const venturebody: getPayload = {
      ...this.commonParams(),
      item: "VENTURE"
    };
    try {
      const modes$ = this.masterService.getModesList(body);
      const ventbody$ = this.masterService.GetMasterItemsList(venturebody);
      this.subSink.sink = forkJoin([modes$, ventbody$]).subscribe(
        ([modesRes, ventRes]: any) => {
          if (modesRes.status.toUpperCase() === "SUCCESS") {
            this.modes = modesRes['data'];
          }
          if (ventRes.status.toUpperCase() === "SUCCESS") {
            this.ventureList = ventRes['data'];
            if (this.ventureList.length === 1) {
              this.pltDetForm.controls['venture'].patchValue(this.ventureList[0].itemCode);
              this.onSelectedVentureChanged();
            }
          }
        },
        error => {
          console.error(error);
        }
      );

    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }

  }
  modeChange(event: string) {
    if (event == "Add") {
      this.reset();
      this.pltDetForm.get('plot')!.disable();
      this.pltDetForm.get('plot')!.clearValidators();
      this.pltDetForm.get('plot')!.updateValueAndValidity();
    }
    else {
      this.pltDetForm.get('plot')!.enable();
    }
    this.pltDetForm.get('mode')!.patchValue(event, { emitEvent: false });
  }
  clear() {
    this.pltDetForm = this.formInit();
    this.retMessage = '';
    this.plotStatus = '';
    this.plotsList = [];
  }

  onSelectedVentureChanged() {
    if(this.pltDetForm.get('mode')?.value !='Add'){
      this.masterParams.type = 'PLOT';
      this.masterParams.item = this.pltDetForm.controls['venture'].value;
      // this.pltDetForm.controls['ventureCode'].patchValue(this.pltDetForm.controls['venture'].value);
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((reslt: any) => {
        if (reslt.status.toUpperCase() === "SUCCESS") {
          this.plotsList = reslt['data'];
          if (this.plotsList.length === 1) {
            this.pltDetForm.controls['plot'].patchValue(this.plotsList[0].itemCode);
            this.onSelectedPlotChanged(this.ventureList[0].itemCode);
          }
        }
        else {
          this.retMessage = reslt.message;
          this.textMessageClass = 'red';
        }
      });
    }

  }

  private resetMessages(): void {
    this.retMessage = '';
    this.textMessageClass = '';
  }
  onSelectedPlotChanged(event: string): void {
    this.resetMessages();
    // this.masterParams.type = 'BLOCK';
    this.masterParams.item = event;
    this.plotsData();

    // try {
    //   this.subSink.sink = this.masterService.GetMasterItemsList(this.masterParams).subscribe((res: any) => {
    //     if (res.status.toUpperCase() === "SUCCESS") {
    //     }
    //     else{
    //       this.retMessage = res.message;
    //       this.textMessageClass = 'red';
    //     }
    //   });

    // }
    // catch (ex: any) {
    //   this.retMessage = ex.message;
    //   this.textMessageClass = 'red';
    // }
  }

  plotsData() {
    this.masterParams.type = 'PLOT';
    this.masterParams.item = this.pltDetForm.controls['plot'].value;
    this.loader.start();
    this.subSink.sink = this.projectService.GetPlotDetails(this.masterParams).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === "SUCCESS") {
        this.pltDetForm.controls['plotNo'].patchValue(res['data'].plotNo);
        this.pltDetForm.controls['plotName'].patchValue(res['data'].plotName);
        this.pltDetForm.controls['latitude'].patchValue(res['data'].latitude);
        this.pltDetForm.controls['longitude'].patchValue(res['data'].longitude);
        this.pltDetForm.controls['extent_M2'].patchValue(res['data'].extent_M2);
        this.pltDetForm.controls['availableFrom'].patchValue(res['data'].availableFrom);
        this.saleDate = res['data'].saleDate;
        this.regnDate = res['data'].regnDate;
        this.plotStatus = res['data'].plotStatus;
        this.pltDetForm.controls['client'].patchValue(res['data'].client);
        this.pltDetForm.controls['plotStatus'].patchValue(res['data'].plotStatus);
        this.pltDetForm.controls['remarks'].patchValue(res['data'].remarks);
        if (this.regnDate.includes("0001-01-01")) {
          this.regnDate = "";
        }
        if (this.saleDate.includes("0001-01-01")) {
          this.saleDate = "";
        }
        if (this.selMode === 'Add') {
          this.retMessage = this.newTranMsg;
        }
        else {
          this.retMessage = 'Retriving data ' + res.message + ' has completed';
        }
        this.textMessageClass = 'green';
      }
      else {
        this.pltDetForm = this.formInit();
        this.textMessageClass = 'red';
        this.retMessage = res.message;
      }
    });
  }
  Close() {
    this.router.navigateByUrl('/home');
  }

  direction() {
    const dialogRef: MatDialogRef<DirectionsComponent> = this.dialog.open(DirectionsComponent, {
      width: '90%',
      disableClose: true,
      data: { type: 'Plot', Trantype: "BOUNDARY", TranNo: this.pltDetForm.controls['plotNo'].value, mode: this.pltDetForm.controls['mode'].value }  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }
  onUpdate() {
    if (this.pltDetForm.invalid) {
      return;
    }
    else {
      try {
        this.plotCls.company = this.userDataService.userData.company;
        this.plotCls.location = this.userDataService.userData.location;
        this.plotCls.langId = this.userDataService.userData.langId;
        this.plotCls.user = this.userDataService.userData.userID;
        this.plotCls.refNo = this.userDataService.userData.sessionID;
        this.plotCls.mode = this.pltDetForm.get('mode')!.value;
        this.plotCls.ventureCode = this.pltDetForm.get('venture')!.value;
        this.plotCls.venture = this.pltDetForm.get('venture')!.value;
        this.plotCls.plotNo = this.pltDetForm.get('plotNo')!.value;
        this.plotCls.plotName = this.pltDetForm.get('plotName')!.value;
        this.plotCls.latitude = this.pltDetForm.get('latitude')!.value;
        this.plotCls.longitude = this.pltDetForm.get('longitude')!.value;
        this.plotCls.extent_M2 = this.pltDetForm.get('extent_M2')!.value;
        var avblFromDate = this.datePipe.transform(new Date(this.pltDetForm.get('availableFrom')!.value), 'yyyy-MM-dd');
        this.plotCls.availableFrom = avblFromDate;
        this.plotCls.remarks = this.pltDetForm.get('remarks')!.value;
        this.loader.start();
        this.subSink.sink = this.projectService.updatePlotDetails(this.plotCls).subscribe((res: any) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.pltDetForm.controls['mode'].value == "Add") {
              this.selMode = 'Add';
              this.modeChange("Modify");
              this.plotsList.push({itemCode:this.pltDetForm.get('plotNo')?.value,itemName:this.pltDetForm.get('plotName')?.value});
              this.pltDetForm.get('plot')?.patchValue(this.pltDetForm.get('plotNo')?.value);
              this.masterParams.tranNo = res.tranNoNew;
            }
            this.retMessage = res.message;
            this.textMessageClass = 'green';
          } else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        },
          (error: any) => {
            this.loader.stop();
            console.error(error);
          }
        );
      }
      catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }
  reset() {

    // this.plotsData();
    this.pltDetForm = this.formInit();
    this.textMessageClass = '';
    this.plotStatus="";
    this.retMessage = '';
  }


  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.pltDetForm.controls['mode'].value, tranNo: this.pltDetForm.controls['plotNo'].value, search: 'Plot Docs', tranType: "PLOT" }
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM802",
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


  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.pltDetForm.controls['mode'].value,
        'note': this.pltDetForm.controls['remarks'].value,
        'TranType': "PLOT",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Plot Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "PLOT",
        'tranNo': tranNo,
        'search': 'Plot Log Details'
      }
    });
  }


}
