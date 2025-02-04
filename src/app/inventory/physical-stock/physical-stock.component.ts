import { DatePipe } from '@angular/common';
import { PhysicalStockDetailsComponent } from './physical-stock-details/physical-stock-details.component';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SubSink } from 'subsink';
import { PhysicalDeails } from '../inventory.class';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { Router } from '@angular/router';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { LogComponent } from 'src/app/general/log/log.component';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranStatus, TranType } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-physical-stock',
  templateUrl: './physical-stock.component.html',
  styleUrls: ['./physical-stock.component.css']
})
export class PhysicalStockComponent implements OnInit, OnDestroy {
  PhysicalStockForm!: FormGroup;
  modes: Item[] = [];
  private subSink!: SubSink;
  textMessageClass!: string;
  retMessage!: string;
  tranStatus!: string;
  PhysicalDeails!: PhysicalDeails;
  public disableDetail: boolean = true;
  dialogOpen = false;
  public fetchStatus: boolean = true;
  @Input() max: any;
  tomorrow = new Date();
  newMsg: string = "";
  warehouseList: Item[] = [];

  constructor(private fb: FormBuilder,
    public dialog: MatDialog, private userDataService: UserDataService,
    private masterService: MastersService,
    private loader: NgxUiLoaderService, protected router: Router,
    private invService: InventoryService, private datePipe: DatePipe) {
    this.PhysicalStockForm = this.formInit();
    this.subSink = new SubSink();
    this.PhysicalDeails = new PhysicalDeails();

  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  searchData() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: TranType.PHYSTOCK,
        TranNo: this.PhysicalStockForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: TranStatus.ANY
      }
      this.subSink.sink = this.invService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.PhysicalDeails.tranNo = res.data.selTranNo;
            this.getPhyStockData(this.PhysicalDeails, this.PhysicalStockForm.get('mode')?.value);
          }
          else {
            this.openSearch();
          }
        }
        else {
          this.openSearch();
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  openSearch() {
    const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNum: this.PhysicalStockForm.controls['tranNo'].value,
        TranType: TranType.PHYSTOCK,
        search: 'Physical Stcock Search'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result != true && result != undefined) {
        this.PhysicalDeails.tranNo = result;
        this.getPhyStockData(this.PhysicalDeails, this.PhysicalStockForm.get('mode')?.value);
      }
    });
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  getPhyStockData(phyCls: PhysicalDeails, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.invService.GetPhysicalStock(phyCls).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == AccessSettings.SUCCESS) {
          this.PhysicalStockForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.PhysicalStockForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.PhysicalStockForm.controls['notes'].setValue(res['data'].notes);
          this.tranStatus = res['data'].tranStatus;
          this.PhysicalStockForm.controls['warehouse'].setValue(res['data'].warehouse);

          if (mode.toUpperCase() != Mode.view) {
            this.displayMessage(displayMsg.SUCCESS + this.newMsg, TextClr.green);
          }
          else {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
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

  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.clear();
      this.PhysicalStockForm.controls['mode'].setValue(event, { emitEvent: false });
      this.PhysicalStockForm.get('tranNo')!.disable();
      this.PhysicalStockForm.get('tranNo')!.clearValidators();
      this.PhysicalStockForm.get('tranNo')!.updateValueAndValidity();
      // this.loadData();
    }
    else {
      this.PhysicalStockForm.controls['mode'].setValue(event, { emitEvent: false });
      this.PhysicalStockForm.get('tranNo')!.enable();
    }
  }

  loadData() {
    this.PhysicalDeails.langID = this.userDataService.userData.langId;;
    this.PhysicalDeails.company = this.userDataService.userData.company;
    this.PhysicalDeails.location = this.userDataService.userData.location;
    this.PhysicalDeails.user = this.userDataService.userData.userID;
    this.PhysicalDeails.refNo = this.userDataService.userData.sessionID;
    const body: getPayload = {
      ...this.commonParams(),
      item: ScreenId.PHYSICAL_STOCK_SCRID,
    };
    // ST307
    const warehouseBody = {
      ...this.commonParams(),
      item: Items.WAREHOUSE,
      SelLocation: this.userDataService.userData.location,
      mode: this.PhysicalStockForm.get('mode')?.value
    };
    this.subSink.sink = this.invService.GetMasterItemsListSelLocation(warehouseBody).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.warehouseList = res['data'];
      }
      else {
        this.displayMessage(displayMsg.ERROR + "Warehouse list empty!", TextClr.red);
      }
    });
    this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.modes = res['data'];
      }
      else {
        this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
      }
    });
  }

  onDetailsCilcked() {
    // console.log(tranNo);
    const dialogRef: MatDialogRef<PhysicalStockDetailsComponent> = this.dialog.open(PhysicalStockDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { tranNo: this.PhysicalStockForm.get('tranNo')?.value, mode: this.PhysicalStockForm.get('mode')?.value }
    });
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log(`Dialog result: ${result}`);
    // });
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      notes: [''],
      warehouse: ['', Validators.required]
    });
  }

  onSubmit() {
    this.displayMessage("", "");
    if (this.PhysicalStockForm.invalid) {
      return;
    }
    else {
      const body = {
        ...this.commonParams(),
        tranNo: this.PhysicalStockForm.get('tranNo')?.value,
        tranDate: this.PhysicalStockForm.get('tranDate')?.value,
        tranStatus: this.tranStatus,
        notes: this.PhysicalStockForm.get('notes')?.value,
        mode: this.PhysicalStockForm.get('mode')?.value,
        langId: this.userDataService.userData.langId,
        warehouse: this.PhysicalStockForm.get('warehouse')?.value,
      }
      this.subSink.sink = this.invService.UpdatePhysicalStock(body).subscribe((res: SaveApiResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.newMsg = res.message;
          if (this.PhysicalStockForm.get('mode')?.value.toUpperCase() === Mode.Add) {
            this.modeChange("Modify");
          }
          this.PhysicalStockForm.get('tranNo')?.patchValue(res.tranNoNew);
          this.PhysicalDeails.tranNo = res.tranNoNew
          this.getPhyStockData(this.PhysicalDeails, this.PhysicalStockForm.get('mode')?.value)
        }
        else {
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  clear() {
    this.PhysicalStockForm = this.formInit();
    this.displayMessage("", "");
    this.tranStatus = "";
  }

  reset() {
    this.PhysicalStockForm.reset();
  }

  onDocsCilcked(value: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.PhysicalStockForm.controls['mode'].value,
        tranNo: this.PhysicalStockForm.controls['tranNo'].value, search: 'Physical-Stock Docs',
        tranType: TranType.PHYSTOCK
      }
    });
    // dialogRef.afterClosed().subscribe(result => {
    // });

  }

  // @HostListener('document:keydown.escape', ['$event']) // Listen for 'Escape' key press
  // onEscape(event: KeyboardEvent) {
  //   // Close the dialog if it's open
  //   this.dialog.closeAll();
  // }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.PHYSICAL_STOCK_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: tranNo,
        mode: this.PhysicalStockForm.controls['mode'].value,
        note: this.PhysicalStockForm.controls['notes'].value,
        TranType: TranType.PHYSTOCK,
      }

    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

  logDetails(tranNo: any) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '90%',

      disableClose: true,
      data: {
        tranType: TranType.PHYSTOCK,
        tranNo: tranNo,
        search: 'Physical Stock log Search'
      }
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }


}
