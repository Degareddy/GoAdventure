import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { SubSink } from 'subsink';
import { BlockClass } from '../Project.class';
import { DirectionsComponent } from 'src/app/general/directions/directions.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { Items, Log, Mode, ScreenId, searchDocs, searchNotes, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-blocks',
  templateUrl: './blocks.component.html',
  styleUrls: ['./blocks.component.css']
})
export class BlocksComponent implements OnInit, OnDestroy {
  blkHdrForm!: FormGroup;
  @Input() max: any;
  today = new Date();
  modes: Item[] = [];
  retMessage: string="";
  textMessageClass: string="";
  propertyList: Item[] = [];
  blockList: Item[] = [];
  private subSink: SubSink;
  masterParams!: MasterParams;
  blockcls!: BlockClass;
  blockCode!: string;
  blockStatus: string="";
  public disableDetail: boolean = true;
  dialogOpen = false;
  public fetchStatus: boolean = true;
  selMode!: string;
  newTranMsg!: string;
  currentYear!: number;
  unitCount: number = 0;
  blockTypeList: Item[] = [
    { itemCode: "Single", itemName: "Single" },
    { itemCode: "Multiple", itemName: "Multiple" }
  ]
  constructor(private fb: FormBuilder, private masterService: MastersService, private loader: NgxUiLoaderService,
    private projectService: ProjectsService, public dialog: MatDialog, private userDataService: UserDataService,
    protected route: Router) {
    this.masterParams = new MasterParams();
    this.blkHdrForm = this.formInit();
    this.subSink = new SubSink();
    this.blockcls = new BlockClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
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
  formInit() {
    this.currentYear = new Date().getFullYear();
    return this.fb.group({
      property: ['', [Validators.required, Validators.maxLength(50)]],
      block: ['',],
      blockID: ['', [Validators.required, Validators.maxLength(10), this.alphanumericValidator()]],
      blockName: ['', [Validators.required, Validators.maxLength(50)]],
      blockType: ['', [Validators.required, Validators.maxLength(50)]],
      blockDate: [new Date(), [Validators.required]],
      yearBuilt: ['',
        [
          Validators.required,
          Validators.pattern(/^[1-9]\d{3}$/), // Ensure it's a 4-digit number
          Validators.min(1950), // Minimum year
          Validators.max(this.currentYear) // Maximum current year
        ]
      ],
      floorCount: ['', [Validators.required]],
      latitude: [0],
      longitude: [0],
      notes: ['', [Validators.maxLength(256)]],
      mode: ['View']
    })
  }
  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
  }
 async loadData() {
    const modebody = this.buildRequestParams(ScreenId.BLOCKS_SCRID);
    const modes$ = this.masterService.getModesList(modebody);
    const propertybody = {
      ...this.buildRequestParams(Items.PROPERTY),
      mode: this.blkHdrForm.get('mode')!.value
    };
    const property$ = this.masterService.GetMasterItemsList(propertybody);

    try{
      this.subSink.sink = await forkJoin([modes$, property$]).subscribe(
        ([modesRes, propRes]: any) => {
          this.handleDataLoadSuccess(modesRes, propRes);
        },
        error => {
          this.handleDataLoadError(error);
        }
      );
    }
    catch(ex:any){
      this.retMessage="Exception: "+ex.message;
      this.textMessageClass = 'red';
    }

  }

  private buildRequestParams(item: string): getPayload {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      refNo: this.userDataService.userData.sessionID
    };
  }

  private handleDataLoadSuccess(modesRes: getResponse, propRes: getResponse): void {
    if (modesRes.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.modes = modesRes['data'];
      if (this.modes.length === 1) {
        this.blkHdrForm.get('mode')!.patchValue(this.modes[0].itemCode);
      }
    }
    else{
      this.retMessage = "Modes list empty!";
      this.textMessageClass = 'red';
      return;
    }
    if (propRes.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.propertyList = propRes['data'];
      if (this.propertyList.length === 1) {
        this.blkHdrForm.get('property')!.patchValue(this.propertyList[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    }
    else{
      this.retMessage = "Properties list empty!";
      this.textMessageClass = 'red';
      return;
    }
  }

  private handleDataLoadError(error: any): void {
    this.retMessage = error.message;
    this.textMessageClass = 'red';
  }

  modeChange(event: string): void {
    this.resetMessages();
    if (event.toUpperCase() === Mode.Add) {
      this.resetForm();
      this.blkHdrForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.blkHdrForm.controls['block'].disable({ emitEvent: false });
      this.blkHdrForm.controls['blockID'].enable({ emitEvent: false });
      this.loadData();


    } else {
      this.blkHdrForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.blkHdrForm.controls['block'].enable({ emitEvent: false });
      this.blkHdrForm.controls['blockID'].disable({ emitEvent: false });
    }
  }



  private resetForm(): void {
    this.blkHdrForm = this.formInit();
    this.unitCount = 0;
    this.blockStatus = '';
    this.retMessage="";
    this.textMessageClass="";
  }

 async onSelectedPropertyChanged() {
    if(this.blkHdrForm.get('mode')?.value.toUpperCase() != Mode.view){
      this.resetMessages();
      const propertyValue = this.blkHdrForm.controls['property'].value;
      this.masterParams.type = Type.BLOCK;
      this.masterParams.item = propertyValue;
      this.blockCode = propertyValue;

      try {
        this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe(
          (result: getResponse) => {
            this.handlePropertyChangedResponse(result);
          },
          (error: any) => {
            this.handlePropertyChangedError(error);
          }
        );
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
  }

  private handlePropertyChangedResponse(result: getResponse) {
    if (result.message.toUpperCase() === AccessSettings.SUCCESS) {
      this.blockList = result.data;
      if (this.blockList.length === 1) {
        this.blkHdrForm.get('block')!.patchValue(this.blockList[0].itemCode);
        this.onSelectedBlockChanged(this.blockList[0].itemCode)
      }
    } else {
      this.retMessage = `${result.message} for this property`;
      this.textMessageClass = 'red';
    }
  }
  private handlePropertyChangedError(error: any): void {
    this.retMessage = error.message;
    this.textMessageClass = 'red';
  }
 async onSelectedBlockChanged(event: string) {
    this.resetMessages();
    this.masterParams.type = Type.BLOCK;
    this.masterParams.item = event;
    try {
      this.subSink.sink =await this.projectService.getBlockDetails(this.masterParams).subscribe(
        (result: getResponse) => {
          this.handleBlockDetailsResponse(result);
        },
        (error: any) => {
          this.handleBlockDetailsError(error);
        }
      );
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  private resetMessages(): void {
    this.retMessage = '';
    this.textMessageClass = '';
  }

  private handleBlockDetailsResponse(result: getResponse): void {
    if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.populateBlockDetails(result.data);
      this.retMessage = this.selMode === 'Add' ? this.newTranMsg : `Retrieving data ${result.message} has completed`;
      this.textMessageClass = 'green';
    } else {
      this.retMessage = result.message;
      this.textMessageClass = 'red';
    }
  }

  private populateBlockDetails(data: any): void {
    this.blkHdrForm.patchValue({
      property: data.property,
      blockID: data.blockID,
      blockName: data.blockName,
      blockType: data.blockType,
      blockDate: data.blockDate,
      yearBuilt: data.yearBuilt,
      floorCount: data.floorCount,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: data.notes
    });
    this.unitCount = data.unitCount;
    this.blockStatus = data.blockStatus;
  }

  private handleBlockDetailsError(error: any): void {
    this.retMessage = error.message;
    this.textMessageClass = 'red';
  }

 async onUpdate() {
    if (this.blkHdrForm.valid) {
      this.prepareBlockClass();
      try {
        this.loader.start();
        this.subSink.sink =await this.projectService.UpdateBlockDetails(this.blockcls).subscribe((res: SaveApiResponse) => {
            this.loader.stop();
            this.handleUpdateResponse(res);
          },
          (error: any) => {
            this.loader.stop();
            this.handleUpdateError(error);
          }
        );
      } catch (ex: any) {
        this.loader.stop();
        this.handleUpdateError(ex);
      }
    }
  }

  private prepareBlockClass() {
    this.blockcls.company = this.userDataService.userData?.company || '';
    this.blockcls.location = this.userDataService.userData?.location || '';
    this.blockcls.user = this.userDataService.userData?.userID || '';
    this.blockcls.refNo = this.userDataService.userData?.sessionID || '';
    this.blockcls.mode = this.blkHdrForm.controls['mode'].value || '';
    this.blockcls.property = this.blkHdrForm.controls['property'].value || '';
    this.blockcls.blockID = this.blkHdrForm.controls['blockID'].value || '';
    this.blockcls.blockName = this.blkHdrForm.controls['blockName'].value || '';
    this.blockcls.blockType = this.blkHdrForm.controls['blockType'].value || '';
    this.blockcls.blockDate = this.blkHdrForm.controls['blockDate'].value || '';
    this.blockcls.yearBuilt = this.blkHdrForm.controls['yearBuilt'].value || '';
    this.blockcls.floorCount = this.blkHdrForm.controls['floorCount'].value || 0;
    this.blockcls.unitCount = this.unitCount || 0;
    this.blockcls.latitude = this.blkHdrForm.controls['latitude'].value || 0;
    this.blockcls.longitude = this.blkHdrForm.controls['longitude'].value || 0;
    this.blockcls.notes = this.blkHdrForm.controls['notes'].value || '';
  }

  private handleUpdateResponse(res: SaveApiResponse): void {
    if (this.isUpdateSuccessful(res.retVal)) {
      this.handleSuccessfulUpdate(res);
    } else {
      this.handleFailedUpdate(res);
    }
  }

  private isUpdateSuccessful(retVal: number): boolean {
    return [101, 102, 103, 104, 105].includes(retVal);
  }

  private handleSuccessfulUpdate(res: SaveApiResponse) {
    this.newTranMsg = res.message;
    if (this.blkHdrForm.controls['mode'].value.toUpperCase() === Mode.Add) {
      this.handleSuccessfulAddMode();

    } else {
      this.retMessage = res.message;
      this.textMessageClass = 'green';
    }
  }

  private handleSuccessfulAddMode() {
    this.selMode = 'Add';
    this.blockList.push({ itemCode: this.blkHdrForm.controls['blockID'].value, itemName: this.blkHdrForm.controls['blockName'].value });
    this.modeChange('Modify');
    this.blkHdrForm.controls['block'].patchValue(this.blkHdrForm.controls['blockID'].value);
    this.retMessage = this.newTranMsg;
    this.textMessageClass = 'green';
  }

  private handleFailedUpdate(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }

  private handleUpdateError(error: any) {
    this.retMessage = error?.message || 'An error occurred during update.';
    this.textMessageClass = 'red';
  }

  onInputChange(controlName: string, event: any) {
    const value = parseInt(event.target.value, 10);
    if (value < 0) {
      this.blkHdrForm.controls[controlName].patchValue(0);
    }
  }

  direction() {
    const dialogRef: MatDialogRef<DirectionsComponent> = this.dialog.open(DirectionsComponent, {
      width: '90%',
      disableClose: true,
      data: { type: Type.BLOCK, Trantype: TranType.BOUNDARY, TranNo: this.blkHdrForm.controls['blockID'].value,
         mode: this.blkHdrForm.controls['mode'].value }
    });

  }

  clear() {
    this.blkHdrForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
    this.blockCode = "";
    this.blockStatus = "";
    this.selMode = "";
    this.unitCount = 0;
    this.blockList = [];
  }

  dateChanged(event: any, controlName: string) {
    const control = this.blkHdrForm.get(controlName);
    const inputValue = event.target.value;
    const [day, month, year] = inputValue.split('-').map((part: any) => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        control?.patchValue(date);
      } else {
        // console.error('Invalid date:', inputValue);
      }
    } else {
      // console.error('Invalid date format:', inputValue);
    }
  }

  reset() {
    const blockID = this.blkHdrForm.controls['blockID'].value;
    if (blockID) {
      this.onSelectedBlockChanged(blockID);
    } else {
    }
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.blkHdrForm.controls['mode'].value,
        tranNo: this.blkHdrForm.controls['blockID'].value, search: searchDocs.BLOCKS_DOC, tranType: Type.BLOCK }
    });
  }

  Close() {
    this.route.navigateByUrl('/home');
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.BLOCKS_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID

      }
    });
  }

  NotesDetails(tranNo:any){
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo,
      'mode': this.blkHdrForm.controls['mode'].value,
      'note':this.blkHdrForm.controls['notes'].value ,
      'TranType': TranType.BLOCKS,
      'search' :searchNotes.BLOCK_NOTE
    }
    });

  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': TranType.BLOCKS,
        'tranNo': tranNo,
        'search': Log.BLOCK_LOG
      }
    });
  }


}
