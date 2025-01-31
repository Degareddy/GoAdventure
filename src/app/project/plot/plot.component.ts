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
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

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
  private readonly SQ_M_TO_SQ_YD = 1.1959896;
  private readonly SQ_YD_TO_SQ_M = 0.836127;
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
      plotNo: ['', [Validators.required, Validators.maxLength(10)]],
      plotName: ['', [Validators.required, Validators.maxLength(50)]],
      latitude: [0],
      longitude: [0],
      extent_M2: ['0.00', [Validators.required]],
      client: ['', [Validators.maxLength(50)]],
      availableFrom: [new Date(), [Validators.required]],
      extent_Y2: ['0.00', [Validators.required]],
      plotStatus: ['', [Validators.maxLength(20)]],
      remarks: ['', [Validators.maxLength(255)]],
      mode: ['View'],
      venture: ['', [Validators.required, Validators.maxLength(255)]],
      plot: ['']
    })
  }

  private subscribeToChanges(): void {
    this.pltDetForm.get('extent_M2')?.valueChanges.subscribe((value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const convertedValue = (numValue * this.SQ_M_TO_SQ_YD).toFixed(2);
        this.pltDetForm.get('extent_Y2')?.setValue(convertedValue, { emitEvent: false });
      }
    });

    this.pltDetForm.get('extent_Y2')?.valueChanges.subscribe((value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const convertedValue = (numValue * this.SQ_YD_TO_SQ_M).toFixed(2);
        this.pltDetForm.get('extent_M2')?.setValue(convertedValue, { emitEvent: false });
      }
    });
  }
  ngOnInit(): void {
    this.loadData();
    this.subscribeToChanges();
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
      item: ScreenId.PLOTS_SCRID,
      mode: this.pltDetForm.get('mode')?.value
    };
    const venturebody: getPayload = {
      ...this.commonParams(),
      item: Items.VENTURE,
      mode: this.pltDetForm.get('mode')?.value
    };
    try {
      const modes$ = this.masterService.getModesList(body);
      const ventbody$ = this.masterService.GetMasterItemsList(venturebody);
      this.subSink.sink = forkJoin([modes$, ventbody$]).subscribe(
        ([modesRes, ventRes]: any) => {
          if (modesRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.modes = modesRes['data'];
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
          }
          if (ventRes.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.ventureList = ventRes['data'];
            if (this.ventureList.length === 1) {
              this.pltDetForm.controls['venture'].patchValue(this.ventureList[0].itemCode);
              this.onSelectedVentureChanged();
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Venture list empty!", TextClr.red);
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
  modeChange(event: string) {
    if (event.toUpperCase() == Mode.Add) {
      this.reset();
      this.pltDetForm.get('plot')!.disable();
      this.pltDetForm.get('plot')!.clearValidators();
      this.pltDetForm.get('plot')!.updateValueAndValidity();
      this.pltDetForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.loadData();
    }
    else {
      this.pltDetForm.get('plot')!.enable();
      this.pltDetForm.get('mode')!.patchValue(event, { emitEvent: false });

    }
  }
  clear() {
    this.pltDetForm = this.formInit();
    this.plotStatus = '';
    this.plotsList = [];
    this.subscribeToChanges();
    this.displayMessage("","");
  }

  onSelectedVentureChanged() {
    if (this.pltDetForm.get('mode')?.value.toUpperCase() != Mode.Add) {
      this.masterParams.type = Type.PLOT;
      this.masterParams.item = this.pltDetForm.controls['venture'].value;
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((reslt: any) => {
        if (reslt.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.plotsList = reslt['data'];
          if (this.plotsList.length === 1) {
            this.pltDetForm.controls['plot'].patchValue(this.plotsList[0].itemCode);
            this.onSelectedPlotChanged(this.ventureList[0].itemCode);
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + reslt.message, TextClr.red);
        }
      });
    }

  }

  private resetMessages(): void {
    this.displayMessage("", "");
  }
  onSelectedPlotChanged(event: string): void {
    this.resetMessages();
    this.masterParams.item = event;
    this.plotsData();
  }

  plotsData() {
    this.masterParams.type = Type.PLOT;
    this.masterParams.item = this.pltDetForm.controls['plot'].value;
    this.loader.start();
    this.subSink.sink = this.projectService.GetPlotDetails(this.masterParams).subscribe((res: any) => {
      this.loader.stop();
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.pltDetForm.controls['plotNo'].patchValue(res['data'].plotNo);
        this.pltDetForm.controls['plotName'].patchValue(res['data'].plotName);
        this.pltDetForm.controls['latitude'].patchValue(res['data'].latitude);
        this.pltDetForm.controls['longitude'].patchValue(res['data'].longitude);
        this.pltDetForm.controls['extent_M2'].patchValue(res['data'].extent_M2);
        this.pltDetForm.controls['extent_Y2'].patchValue(res['data'].extent_Y2);
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
        if (this.selMode.toUpperCase() === Mode.Add) {
          this.retMessage = this.newTranMsg;
        }
        else {
          this.retMessage = 'Retriving data ' + res.message + ' has completed';
        }
        this.textMessageClass = 'green';
      }
      else {
        this.pltDetForm = this.formInit();
        this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
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
      data: {
        type: Type.PLOT,
        Trantype: TranType.BOUNDARY, TranNo: this.pltDetForm.controls['plotNo'].value,
        mode: this.pltDetForm.controls['mode'].value
      }
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
        this.plotCls.extent_M2 = parseFloat(this.pltDetForm.get('extent_M2')!.value.replace(/,/g, ''));
        this.plotCls.extent_Y2 = parseFloat(this.pltDetForm.get('extent_Y2')!.value.replace(/,/g, ''));
        var avblFromDate = this.datePipe.transform(new Date(this.pltDetForm.get('availableFrom')!.value), 'yyyy-MM-dd');
        this.plotCls.availableFrom = avblFromDate;
        this.plotCls.remarks = this.pltDetForm.get('remarks')!.value;
        this.loader.start();
        this.subSink.sink = this.projectService.updatePlotDetails(this.plotCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.pltDetForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.selMode = 'Add';
              this.modeChange("Modify");
              this.plotsList.push({ itemCode: this.pltDetForm.get('plotNo')?.value, itemName: this.pltDetForm.get('plotName')?.value });
              this.pltDetForm.get('plot')?.patchValue(this.pltDetForm.get('plotNo')?.value);
              this.masterParams.tranNo = res.tranNoNew;
            }
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
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
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }
  reset() {
    this.pltDetForm = this.formInit();
    this.plotStatus = "";
    this.displayMessage("", "");
  }


  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.pltDetForm.controls['mode'].value,
        tranNo: this.pltDetForm.controls['plotNo'].value, search: 'Plot Docs',
        tranType: Type.PLOT
      }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.PLOTS_SCRID,
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
        mode: this.pltDetForm.controls['mode'].value,
        note: this.pltDetForm.controls['remarks'].value,
        TranType: Type.PLOT,
        search: "Plot Notes"
      }
    });

  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: Type.PLOT,
        tranNo: tranNo,
        search: 'Plot Log Details'
      }
    });
  }


}
