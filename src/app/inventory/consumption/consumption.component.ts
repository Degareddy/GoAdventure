import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { ExcelReportsService } from 'src/app/FileGenerator/excel-reports.service';
import { ReportsService } from 'src/app/Services/reports.service'
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConsumptionDetailsComponent } from 'src/app/inventory/consumption/consumption-details/consumption-details.component'
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { StockIssueHdr } from 'src/app/inventory/inventory.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { Observable, forkJoin, map, startWith } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-consumption',
  templateUrl: './consumption.component.html',
  styleUrls: ['./consumption.component.css']
})

export class ConsumptionComponent implements OnInit, OnDestroy {
  options: string[] = [];
  selMode!: string;
  unitCode!: string;
  blockCode!: string;
  blockName!: string;
  propCode!: string;
  propName!: string;
  propertyList: Item[] = [];
  blockList: Item[] = [];
  filteredOptions!: Observable<string[]>;
  consumptionForm: FormGroup;
  stkIssueHdr!: StockIssueHdr;
  modes: Item[] = [];
  props: Item[] = [];
  propertyValue!: any;
  blockValue!: any;
  masterParams!: MasterParams;
  tranStatus: string = "";
  itemCount: number = 0;
  public disableDetail: boolean = true;
  public fetchStatus: boolean = true;
  private subSink!: SubSink;
  dialogOpen = false;
  @Input() max: any;
  tomorrow = new Date();
  newTranMsg: string = "";
  retMessage: string = "";
  retNum!: number;
  textMessageClass!: string;
  constructor(private fb: FormBuilder, protected utlService: UtilitiesService,
    protected router: Router, private userDataService: UserDataService,
    private datePipe: DatePipe,
    private invService: InventoryService,
    private masterService: MastersService,
    private excelService: ExcelReportsService,
    private repService: ReportsService,
    public dialog: MatDialog,
    private loader: NgxUiLoaderService) {
    this.consumptionForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.stkIssueHdr = new StockIssueHdr();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {

    this.loadData();

  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date()],
      remarks: [''],
      purpose: ['', Validators.required],
      // block: ['', Validators.required],
      // propertyName: ['', Validators.required]
    })
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

  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const propertyBody ={...this.createRequestData(Items.VENTPROP),mode:this.consumptionForm.get('mode')?.value};
    try {
      const service1 = this.masterService.getModesList({ ...this.commonParams(), item: ScreenId.CONSUMPTION_SCRID });
      const property$ = this.masterService.GetMasterItemsList(propertyBody);
      this.subSink.sink = forkJoin([service1, property$]).subscribe(
        (results: any[]) => {
          const res1 = results[0];
          const res2 = results[1];

          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.modes = res1.data;
          } else {
            this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
          }
          if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.propertyList = res2.data;
            if (this.props.length === 1) {
              this.consumptionForm.get('propertyName')!.patchValue(this.propertyList[0].itemName);
              this.propCode = this.propertyList[0].itemCode;
              this.onSelectedPropertyChanged();
            }
            this.filteredOptions = this.consumptionForm.get('block')!.valueChanges.pipe(
              startWith(''),
              map(value => this._filter(value || '')),
            );
          } else {
            this.displayMessage(displayMsg.ERROR + "Property list empty!", TextClr.red);
          }
        },
        (error: any) => {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );

    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  getStockConsumptionData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.invService.getStockConsumptionHeader(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
          this.consumptionForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.consumptionForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.consumptionForm.controls['purpose'].patchValue(res['data'].purpose);
          this.consumptionForm.controls['remarks'].patchValue(res['data'].remarks);
          this.consumptionForm.controls['propertyName'].patchValue(res['data'].property);
          this.propName = res['data'].propertyName;
          this.blockList.push({
            itemCode: res['data'].blockId,
            itemName: res['data'].blockName
          })
          this.consumptionForm.controls['block'].patchValue(res['data'].blockId);

          this.blockName = res['data'].blockName;
          this.stkIssueHdr.blockId = res.data.blockId;
          this.stkIssueHdr.property = res.data.property;
          this.itemCount = res['data'].itemCount;
          this.tranStatus = res['data'].tranStatus;
          if (mode.toUpperCase() != Mode.view && this.newTranMsg != "") {
            this.displayMessage(displayMsg.SUCCESS + this.newTranMsg, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.SUCCESS +  'Retriving data ' + res.message + ' has completed', TextClr.green);
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter((option: any) => option.toLowerCase().includes(filterValue));
  }

  prepareConsumptionCls() {
    this.stkIssueHdr.company = this.userDataService.userData.company;
    this.stkIssueHdr.location = this.userDataService.userData.location;
    this.stkIssueHdr.langID = this.userDataService.userData.langId;
    this.stkIssueHdr.tranNo = this.consumptionForm.get('tranNo')!.value;
    const transformedDate = this.datePipe.transform(this.consumptionForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.stkIssueHdr.tranDate = transformedDate.toString();
    } else {
      this.stkIssueHdr.tranDate = '';
    }
    this.stkIssueHdr.tranStatus = TranStatus.ANY;
    this.stkIssueHdr.remarks = this.consumptionForm.get('remarks')!.value;
    this.stkIssueHdr.mode = this.consumptionForm.get('mode')!.value;
    this.stkIssueHdr.purpose = this.consumptionForm.get('purpose')!.value;
    this.stkIssueHdr.blockId = this.consumptionForm.get('block')!.value;
    this.stkIssueHdr.property = this.consumptionForm.get('propertyName')!.value;
    this.stkIssueHdr.user = this.userDataService.userData.userID;
    this.stkIssueHdr.refNo = this.userDataService.userData.sessionID;
  }

  onSubmit() {
    if (this.consumptionForm.invalid) {
      return;
    }
    else {
      this.prepareConsumptionCls();
      try {
        this.loader.start();
        this.subSink.sink = this.invService.UpdateStockConsumptionHdr(this.stkIssueHdr).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.consumptionForm.get('mode')!.value.toUpperCase() == Mode.Add) {
              this.modeChange("Modify");
              this.masterParams.tranNo = res.tranNoNew;
              this.getStockConsumptionData(this.masterParams, this.consumptionForm.get('mode')!.value);
            }

            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      } catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.consumptionForm.reset();
    this.consumptionForm = this.formInit();
    this.itemCount = 0;
    this.displayMessage("","");
    this.newTranMsg = "";
    this.tranStatus="";
    this.filteredOptions = this.consumptionForm.get('block')!.valueChanges.pipe(startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  onSearchCilcked() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: TranType.STOCKCON,
      TranNo: this.consumptionForm.controls['tranNo'].value,
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: TranStatus.ANY
    }

    this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
      if (res.retVal === 0) {
        if (res && res.data && res.data.tranCount === 1) {
          this.masterParams.tranNo = res.data.selTranNo;
          this.consumptionForm.get('tranNo')!.patchValue(res.data.tranNo);
          this.getStockConsumptionData(this.masterParams, this.consumptionForm.get('mode')?.value);
        }
        else {
          this.searchOpen();
        }
      }
      else{
        this.searchOpen();
      }

    });
  }

  searchOpen(){
    if (!this.dialogOpen) {
      const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
        width: '90%',
        disableClose: true,
        data: {
          tranNo: this.consumptionForm.get('tranNo')!.value,
          search: 'Consumption Search',
          TranType: TranType.STOCKCON
        }
      });
      this.dialogOpen = true;
      dialogRef.afterClosed().subscribe(result => {
        this.dialogOpen = false;
        if (result != true && result != undefined) {
          this.masterParams.tranNo = result;
          this.getStockConsumptionData(this.masterParams, this.consumptionForm.get('mode')?.value);
        }
      });
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.consumptionForm.get('mode')!.value,
        tranNo: this.consumptionForm.get('tranNo')!.value, search: 'Consumption Docs', tranType:TranType.STOCKCON
      }
    });
    // dialogRef.afterClosed().subscribe(result => {
    // });
  }

  onDetailsCilcked() {
    const dialogRef: MatDialogRef<ConsumptionDetailsComponent> = this.dialog.open(ConsumptionDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: this.consumptionForm.get('tranNo')!.value,
        mode: this.consumptionForm.get('mode')!.value,
        property: this.consumptionForm.get('propertyName')!.value,
        propertyName: this.propName,
        blockName: this.blockName,
        block: this.consumptionForm.get('block')!.value,
        status: this.tranStatus,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered) {
        this.masterParams.tranNo = this.consumptionForm.get('tranNo')!.value;
        this.getStockConsumptionData(this.masterParams, this.consumptionForm.get('mode')!.value);
      }
    });
  }

  generateExcel() {
    if (this.consumptionForm.controls['tranNo'].value) {
      this.getConsumptionReport(this.consumptionForm.get('tranNo')!.value, "Excel");
    }
  }

  generatePDF() {
    if (this.consumptionForm.controls['tranNo'].value) {
      this.getConsumptionReport(this.consumptionForm.get('tranNo')!.value, "PDF");
    }
  }

  getConsumptionReport(tarnNum: any, type: string) {
    this.masterParams.tranNo = tarnNum;
    try {
      this.loader.start();
      this.subSink.sink = this.repService.getPurchaseOrderDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          if (type === "Excel") {
            this.excelService.generatePurchaseOrderExcel(res['data']);
          }
          else if (type === "PDF") {
            this.excelService.generatePurchaseOrderPDF(res['data']);
          }
        } else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.reset();
      this.consumptionForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.consumptionForm.get('tranNo')!.disable();
      this.consumptionForm.get('tranNo')!.clearValidators();
      this.consumptionForm.get('tranNo')!.updateValueAndValidity();
      this.loadData();
    }
    else {
      this.consumptionForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.consumptionForm.get('tranNo')!.enable();
    }
  }

  reset() {
    this.consumptionForm = this.formInit();
    this.displayMessage("","");
    this.tranStatus = "";
    this.fetchStatus = true;
    this.disableDetail = true;
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
    }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.CONSUMPTION_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  // handleError(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = 'red';
  // }

  // handleSuccess(res: any) {
  //   this.retMessage = res.message;
  //   this.textMessageClass = 'green';
  // }

  displayProperty = (propertyCode: any): string => {
    if (this.propertyList && this.propertyList.length > 0) {
      const selectedProperty = this.propertyList.find(property => property.itemCode === propertyCode);
      return selectedProperty ? selectedProperty.itemName : '';
    }
    return '';
  }

  displayBlock = (blockCode: any): string => {
    if (this.blockList && this.blockList.length > 0) {
      const selectedBlock = this.blockList.find(block => block.itemCode === blockCode);
      return selectedBlock ? selectedBlock.itemName : '';
    }
    return '';
  }

  onSelectedPropertyChanged(): void {
    this.stkIssueHdr.property = this.consumptionForm.get('propertyName')!.value;
    if (this.consumptionForm.controls.propertyName.value != "") {
      this.blockList = [];
      this.masterParams.type = Type.VENTBLOCK;
      this.masterParams.company = this.userDataService.userData.company;
      this.masterParams.location = this.userDataService.userData.location;
      this.masterParams.refNo = this.userDataService.userData.sessionID;
      this.masterParams.item = this.consumptionForm.controls.propertyName.value;
      this.masterParams.user = this.userDataService.userData.userID;
      this.masterParams.langId = this.userDataService.userData.langId;
      try {
        this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
          if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.blockList = result.data;
            if (this.blockList.length === 1) {
              this.consumptionForm.controls.block.patchValue(this.blockList[0].itemName);
              this.blockCode = this.blockList[0].itemCode;
            }
          } else {
            this.displayMessage(displayMsg.ERROR + result.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }


  }

  onSelectedBlockChanged(): void {
    this.stkIssueHdr.blockId = this.consumptionForm.get('block')!.value;
    this.resetMessages();
    this.masterParams.type = Type.BLOCK;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.masterParams.item = this.consumptionForm.controls.propertyName.value;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.langId = this.userDataService.userData.langId;
    try {
      this.subSink.sink = this.masterService.GetCascadingMasterItemsList(this.masterParams).subscribe((result: any) => {
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.blockList = result.data;
          if (this.blockList.length === 1) {
            this.consumptionForm.controls.block.patchValue(this.blockList[0].itemName);
            this.blockCode = this.blockList[0].itemCode;

          }
        } else {
          this.displayMessage(displayMsg.ERROR + result.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }

  private resetMessages(): void {
    this.retMessage = '';
    this.textMessageClass = '';
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: tranNo,
        mode: this.consumptionForm.controls['mode'].value,
        TranType: TranType.STOCKCON,
        'search':"Consumption Notes"
      }
    });
    // dialogRef.afterClosed().subscribe(result => {
    // });
  }

  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: {
        tranType: TranType.STOCKCON,
        tranNo: tranNo,
        'search': 'Consumption log Search'
      }
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

}
