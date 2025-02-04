import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from 'src/app/Services/inventory.service';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/sales/sales.class';
import { ProductGroup } from '../inventory.class';
import { SubSink } from 'subsink';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LogComponent } from 'src/app/general/log/log.component';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, Mode, ScreenId, TextClr } from 'src/app/utils/enums';
@Component({
  selector: 'app-product-groups',
  templateUrl: './product-groups.component.html',
  styleUrls: ['./product-groups.component.css']
})
export class ProductGroupsComponent implements OnInit, OnDestroy {
  productGroupForm!: FormGroup;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  selected!: string;
  modes: Item[] = [];
  typeNamesList: Item[] = [];
  selTypeItemsList: Item[] = [];
  masterParams!: MasterParams;
  itemStatus!: string;
  @Input() max: any;
  tomorrow = new Date();
  private subSink!: SubSink;
  private newMsg: string = "";
  private prodGroupCls: ProductGroup;
  constructor(protected masterService: MastersService, private router: Router,
    public dialog: MatDialog, private loader: NgxUiLoaderService,
    protected fb: FormBuilder, private userDataService: UserDataService,
    protected invService: InventoryService) {
    this.masterParams = new MasterParams();
    this.productGroupForm = this.formInit();
    this.prodGroupCls = new ProductGroup();
    this.subSink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      typeName: [''],
      groupType: ['', Validators.required],
      groupCode: ['', Validators.required],
      groupName: ['', Validators.required],
      effectiveDate: [new Date(), Validators.required],
      notes: [''],
    });
  }
  ngOnInit() {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = 'SM302';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.subSink.sink = this.masterService.getModesList(this.masterParams).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.modes = res['data'];
      }
      else{
         this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
      }
    });
    this.masterParams.item = Items.PRODUCTGROUP;

    this.subSink.sink = this.masterService.GetMasterItemsList(this.masterParams).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.typeNamesList = res['data'];
      }
      else{

      } this.displayMessage(displayMsg.ERROR + "Types list empty!", TextClr.red);

    });
    this.productGroupForm.get('typeName')!.valueChanges.subscribe((value) => {
      this.onSelectedTypeChanged(value, this.productGroupForm.get('mode')!.value);
    });
  }
private displayMessage(message: string, cssClass: string) {
			this.retMessage = message;
			this.textMessageClass = cssClass;
		  }
  onSelectedTypeChanged(type: string, mode: string) {
    this.masterParams.item = type;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.subSink.sink = this.invService.getProductGroupDetails(this.masterParams).subscribe((res: any) => {
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.productGroupForm.controls['groupCode'].patchValue(res['data'].groupCode);
        this.productGroupForm.controls['groupName'].patchValue(res['data'].groupName);
        this.productGroupForm.controls['effectiveDate'].patchValue(res['data'].effectiveDate);
        this.itemStatus = res['data'].groupStatus;
        this.productGroupForm.controls['groupType'].patchValue(res['data'].groupType);
        this.productGroupForm.controls['notes'].patchValue(res['data'].notes);
        this.productGroupForm.get('typeName')?.patchValue(res.data.groupCode, { emitEvent: false });

        if (mode.toUpperCase() === Mode.view) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
        else {
          this.displayMessage(displayMsg.SUCCESS + this.newMsg, TextClr.green);
        }

      } else {
        this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
      }
    });
  }
  prepareProductGroupCls() {
    const prodGroupValue = this.productGroupForm.value;
    this.prodGroupCls.Company = this.userDataService.userData.company;
    this.prodGroupCls.Location = this.userDataService.userData.location;
    this.prodGroupCls.RefNo = this.userDataService.userData.sessionID;
    this.prodGroupCls.User = this.userDataService.userData.userID;
    this.prodGroupCls.Mode = prodGroupValue.mode;
    this.prodGroupCls.EffectiveDate = prodGroupValue.effectiveDate;
    this.prodGroupCls.GroupCode = prodGroupValue.groupCode;
    this.prodGroupCls.GroupName = prodGroupValue.groupName;
    this.prodGroupCls.GroupType = prodGroupValue.groupType;
    this.prodGroupCls.Notes = prodGroupValue.notes;
  }
  onUpdate() {
    if (this.productGroupForm.valid) {
      this.prepareProductGroupCls();
      this.loader.start();
      this.subSink.sink = this.invService.UpdateProductGroups(this.prodGroupCls).subscribe((result: SaveApiResponse) => {
        this.loader.stop();
        if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.newMsg = result.message;
          if (this.productGroupForm.get('mode')?.value.toUpperCase() === Mode.Add) {
            this.typeNamesList.push({ itemCode: this.productGroupForm.get('groupCode')?.value, itemName: this.productGroupForm.get('groupName')?.value })
            this.modeChanged('Modify');
          }
          this.onSelectedTypeChanged(result.tranNoNew, this.productGroupForm.get('mode')?.value);
        }


      });
    }
    else {
      this.displayMessage(displayMsg.ERROR + "Form Invalid", TextClr.red);
    }

  }
  Clear() {
    this.productGroupForm = this.formInit();
    this.itemStatus = "";
    this.displayMessage("","");
    this.productGroupForm.get('typeName')!.valueChanges.subscribe((value) => {
      this.onSelectedTypeChanged(value, this.productGroupForm.get('mode')!.value);
    });
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  modeChanged(event: string) {
    if (event.toUpperCase() === Mode.Add) {
      this.productGroupForm = this.formInit();
      this.productGroupForm.controls['mode'].setValue(event, { emitEvent: false });
      this.retMessage = "";
      this.itemStatus = "";
      this.productGroupForm.controls['typeName'].disable({ emitEvent: false });
    }
    else {
      this.productGroupForm.controls['typeName'].enable({ emitEvent: false });
      this.productGroupForm.controls['mode'].setValue(event, { emitEvent: false });
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.PRODUCT_GROUPS_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: {
        tranNo: tranNo,
        mode: this.productGroupForm.controls['mode'].value,
        note: this.productGroupForm.controls['notes'].value,
        TranType: Items.PRODUCTGROUP,
        search :"Product Group Notes"}
    });
    // dialogRef.afterClosed().subscribe(result => {

    // });
  }

  logDetails(tranNo:string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: Items.PRODUCTGROUP,
        tranNo: tranNo,
        search: 'Product Group log Details'
      }
    });
  }



}
