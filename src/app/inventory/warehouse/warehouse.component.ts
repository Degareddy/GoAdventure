import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MastersService } from 'src/app/Services/masters.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MasterParams } from 'src/app/sales/sales.class';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { ToastrService } from 'ngx-toastr';
import { Warehouse } from '../warehouse/wareHouse.model'
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { displayMsg, Items, Mode, ScreenId, TextClr } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})

export class WarehouseComponent implements OnInit, OnDestroy {
  warehouseForm!: FormGroup;
  newTranMsg!: string;
  labelPosition: 'before' | 'after' = 'after';
  whStatus!: string;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  modeIndex!: number;
  private subSink: SubSink;
  masterParams!: MasterParams;
  modes: Item[] = [];
  wareHouseList: Item[] = [];
  selMode!: string;
  whousecls: Warehouse;
  @Input() max: any;
  tomorrow = new Date();
  @ViewChild('frmClear') public wrhFrm !: NgForm;
  constructor(private fb: FormBuilder,
    public dialog: MatDialog,
    protected router: Router, private userDataService: UserDataService,
    private loader: NgxUiLoaderService,
    protected invService: InventoryService) {
    this.warehouseForm = this.formInit();
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.whousecls = new Warehouse();
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
  formInit() {
    return this.fb.group({
      mode: ['View'],
      list: [''],
      whid: ['', Validators.required],
      whName: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      notes: ['', Validators.required],
      isDefault: [false],
    })
  }
  ngOnInit(): void {
    this.loadData();
    this.warehouseForm.get('list')!.valueChanges.subscribe((value) => {
      this.onWarehouseChanged(value, this.warehouseForm.get('mode')!.value);
    });
  }
  modeChange(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.reset();
      this.warehouseForm.controls['mode'].setValue(event, { emitEvent: false });
      this.warehouseForm.controls['whid'].enable();
      this.warehouseForm.get('list')!.disable({ emitEvent: false });
      this.loadData();
    }
    else {
      this.warehouseForm.controls['mode'].setValue(event, { emitEvent: false });
      this.warehouseForm.get('list')!.enable({ emitEvent: false });
      this.warehouseForm.controls['whid'].disable();
    }
  }

  reset() {
    this.warehouseForm.reset();
    this.warehouseForm = this.formInit();
    this.clearMsg();
    this.whStatus = '';
  }

  onWarehouseChanged(event: any, mode: string) {
    const body = {
      ...this.commonParams(),
      Type: Items.WAREHOUSE,
      Item: event
    }
    if (event) {
      try {
        this.loader.start();
        this.subSink.sink = this.invService.GetWarehouseDetails(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            this.warehouseForm.get('list')?.patchValue(res.data.whid, { emitEvent: false });
            this.warehouseForm.patchValue({
              whid: res.data.whid,
              whName: res.data.whName,
              effectiveDate: res.data.effectiveDate,
              notes: res.data.notes,
              isDefault: res.data.isDefault,
            }, { emitEvent: false });
            this.whStatus = res.data.whStatus;
            this.whousecls.whStatus = this.whStatus;
            if (mode.toUpperCase() != Mode.view) {

              this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
            }
            else {
              this.displayMessage(displayMsg.SUCCESS + "Retrived " + res.message, TextClr.green);
            }
          }

        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  loadData() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = ScreenId.WAREHOUSE_SCRID;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body = {
      ...this.commonParams(),
      Item: Items.WAREHOUSE,
      mode: this.warehouseForm.get('mode')?.value
    };
    try {
      const service1 = this.invService.getModesList(this.masterParams);
      const service2 = this.invService.GetMasterItemsList(body);
      this.subSink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];

          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.modes = res1.data;

          }
          else {
            this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
          }
          if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.wareHouseList = res2.data;

          }
          else {
            this.displayMessage(displayMsg.ERROR + "Warehouse list empty!", TextClr.red);
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

  getWarehousesList() {
    const body: getPayload = {
      ...this.commonParams(),
      item: Items.WAREHOUSE
    };
    const service = this.invService.GetMasterItemsList(body);
    this.subSink.sink = service.subscribe((results: any) => {
      this.loader.stop();
      const res = results[0];
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.wareHouseList = res.data;
      }
    },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
      }
    );

  }
  prepareCls() {
    this.whousecls.mode = this.warehouseForm.controls['mode'].value;
    this.whousecls.company = this.userDataService.userData.company;
    this.whousecls.location = this.userDataService.userData.location;
    this.whousecls.langID = this.userDataService.userData.langId;
    this.whousecls.whid = this.warehouseForm.controls['whid'].value;
    this.whousecls.whName = this.warehouseForm.controls['whName'].value;
    this.whousecls.effectiveDate = this.warehouseForm.controls['effectiveDate'].value;
    this.whousecls.isDefault = this.warehouseForm.controls['isDefault'].value;
    this.whousecls.notes = this.warehouseForm.controls['notes'].value;
    this.whousecls.whStatus = this.whStatus;
    this.whousecls.user = this.userDataService.userData.userID;
    this.whousecls.refNo = this.userDataService.userData.sessionID;
  }
  onSubmit() {
    this.clearMsg();
    if (this.warehouseForm.valid) {
      this.prepareCls();
      try {
        this.loader.start();
        this.subSink.sink = this.invService.saveWarehouse(this.whousecls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.wareHouseList.push({ itemCode: res.tranNoNew, itemName: this.warehouseForm.get('whName')!.value })
            if (this.warehouseForm.controls['mode'].value.toUpperCase() == Mode.Add) {
              this.warehouseForm.controls['mode'].patchValue('Modify');
              this.displayMessage(displayMsg.SUCCESS+res.message,TextClr.green)
            }
            this.newTranMsg = res.message;
            if (res.tranNoNew) {
              this.onWarehouseChanged(res.tranNoNew, this.warehouseForm.controls['mode'].value)
            }
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
  clearMsg() {
    this.warehouseForm.get('list')!.valueChanges.subscribe((value) => {
      this.onWarehouseChanged(value, this.warehouseForm.get('mode')!.value);
    });
    this.displayMessage("", "");
  }

  clear() {
    this.wrhFrm.resetForm();
    this.warehouseForm = this.formInit();
    this.clearMsg();
    this.whStatus = '';
  }

  close() {
    this.router.navigateByUrl('/home');
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.WAREHOUSE_SCRID,
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
        mode: this.warehouseForm.controls['mode'].value,
        TranType: Items.WAREHOUSE,
        search: "Warehouse Notes"
      }

    });
  }

  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: Items.WAREHOUSE,
        tranNo: tranNo,
        search: 'Material Request log'
      }
    });
  }
}

