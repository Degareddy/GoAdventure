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
    private toastr: ToastrService, public dialog: MatDialog,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService,
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
    // const body = {
    //   ...this.commonParams(),
    //   item: 'ST301'
    // };
    // try {
    //   this.subSink.sink = this.masterService.getModesList(body).subscribe((res: any) => {
    //     if (res.status.toUpperCase() === "SUCCESS") {
    //       this.modes = res['data'];
    //     }
    //   });
    //   this.masterParams.item = this.warehouseForm.controls['list'].value;
    // }
    // catch (ex: any) {
    //   this.retMessage = ex.message;
    //   this.textMessageClass = "red";
    // }
    this.loadData();
    this.warehouseForm.get('list')!.valueChanges.subscribe((value) => {
      this.onWarehouseChanged(value, this.warehouseForm.get('mode')!.value);
    });
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.reset();
      this.warehouseForm.controls['mode'].setValue(event, { emitEvent: false });
      this.warehouseForm.controls['whid'].enable();
      this.warehouseForm.get('list')!.disable({ emitEvent: false });
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
      Type: "WAREHOUSE",
      Item: event
    }
    if (event) {
      try {
        this.loader.start();
        this.subSink.sink = this.invService.GetWarehouseDetails(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
             this.warehouseForm.get('list')?.patchValue(res.data.whid, { emitEvent: false });
            this.warehouseForm.patchValue({
              whid: res.data.whid,
              whName: res.data.whName,
              effectiveDate: res.data.effectiveDate,
              notes: res.data.notes,
              isDefault: res.data.isDefault,
            });
            this.whStatus = res.data.whStatus;
            this.whousecls.whStatus = this.whStatus;
            if (mode != 'View') {
              this.retMessage = this.newTranMsg;
              this.textMessageClass = "green";
            }
            else {
              this.retMessage = "Retrived " + res.message;
              this.textMessageClass = "green";
            }
          }

        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.toastr.info(ex.message, "Exception");
      }
    }

  }
  loadData() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = 'SM301';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const body = {
      ...this.commonParams(),
      Item: "WAREHOUSE"
    };
    try {
      const service1 = this.invService.getModesList(this.masterParams);
      const service2 = this.invService.GetMasterItemsList(body);
      this.subSink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          this.wareHouseList = res2.data;
          this.modes = res1.data;

        },
        (error: any) => {
          this.loader.stop();
          this.toastr.info(error.message, "Error");
        }
      );
    } catch (ex: any) {
      this.loader.stop();
      this.toastr.info(ex.message, "Exception");
    }

  }

  getWarehousesList() {
    const body: getPayload = {
      ...this.commonParams(),
      item: "WAREHOUSE"
    };
    const service = this.invService.GetMasterItemsList(body);
    this.subSink.sink = service.subscribe((results: any) => {
      this.loader.stop();
      const res = results[0];
      if (res.status.toUpperCase() === "SUCCESS") {
        this.wareHouseList = res.data;
      }
    },
      (error: any) => {
        this.loader.stop();
        this.toastr.info(error.message, "ERROR");
      }
    );

  }

  onSubmit() {
    this.clearMsg();
    if (this.warehouseForm.valid) {
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
      try {
        this.loader.start();
        this.subSink.sink = this.invService.saveWarehouse(this.whousecls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.wareHouseList.push({ itemCode: res.tranNoNew, itemName: this.warehouseForm.get('whName')!.value })
            if (this.warehouseForm.controls['mode'].value == "Add") {
              this.modeChange("Modify");
            }
            this.newTranMsg = res.message;
            this.textMessageClass = "green";
            if (res.tranNoNew) {
              this.onWarehouseChanged(res.tranNoNew, this.warehouseForm.controls['mode'].value)
            }
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex.message;
        this.textMessageClass = "red";
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
    this.retMessage = "";
    this.textMessageClass = '';
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
        ScrId: "SM301",
        // Page: "Warehouse",
        // SlNo: 36,
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
      'mode': this.warehouseForm.controls['mode'].value,
      //'note':this.warehouseForm.controls['notes'].value ,
      'TranType': "WAREHOUSE",
      'search' :"Warehouse Notes"}  // Pass any data you want to send to CustomerDetailsComponent

    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "WAREHOUSE",
        'tranNo': tranNo,
        'search': 'Material Request log'
      }
    });
  }



}

