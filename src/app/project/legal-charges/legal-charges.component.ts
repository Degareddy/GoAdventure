import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { debounceTime, forkJoin } from 'rxjs';
import { getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Router } from '@angular/router';

import { SubSink } from 'subsink';
import { GridApi } from 'ag-grid-community';
import { MasterParams } from 'src/app/modals/masters.modal';
import { DecimalPipe } from '@angular/common';
import { LogComponent } from 'src/app/general/log/log.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { displayMsg, Items, Mode, ScreenId, TextClr, TranType, Type } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-legal-charges',
  templateUrl: './legal-charges.component.html',
  styleUrls: ['./legal-charges.component.css'],
  providers: [DecimalPipe]
})
export class LegalChargesComponent implements OnInit, OnDestroy {
  legaChargeForm!: FormGroup;
  masterParams!: MasterParams;
  properytList: Item[] = [];
  currency: Item[] = [];
  blocksList: Item[] = [];
  private gridApi!: GridApi;
  subSink: SubSink = new SubSink();
  amountMessage: string = '';
  textMessageClass: string = "";
  legaCharges: Item[] = [];
  retMessage: string = "";
  modes: Item[] = [];
  vatList: Item[] = [];
  rowData: any = [];
  columnDefs: any = [
    { field: "chargeItemName", headerName: "Legal Charge", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "chargeMethod", headerName: "Charge Type", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "currencyName", headerName: "Currency", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "rate", headerName: "Rate", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
      cellStyle: { justifyContent: "flex-end" },
      valueFormatter: function (params: any) {
        if (typeof params.value === 'number' || typeof params.value === 'string') {
          const numericValue = parseFloat(params.value.toString());
          if (!isNaN(numericValue)) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
          }
        }
        return null;
      },
    },

  ];
  constructor(private decimalPipe: DecimalPipe, protected router: Router, private loader: NgxUiLoaderService, private projService: ProjectsService, private userDataService: UserDataService, public dialog: MatDialog, private fb: FormBuilder, private masterService: MastersService) {
    this.legaChargeForm = this.formInit();
    this.masterParams = new MasterParams();


  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.legalChargeChange();
    this.refresh();
  }
  refresh() {

    this.legaChargeForm.get('amount')?.valueChanges.subscribe(() => {
      this._amountMessage();
    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranType: TranType.LEGLCHARGE,
        tranNo: tranNo,
        search: 'Legal Charges Log Details'
      }
    });
  }
  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        tranNo: tranNo,
        mode: Mode.Modify,
        note: this.legaChargeForm.controls['notes'].value,
        TranType: TranType.LEGLCHARGETYPE,
        search: "Legal Charges Notes"
      }
    });

  }
  _amountMessage() {

    this.amountMessage = '';
    if (this.legaChargeForm.get('chargeType')?.value === Type.FLAT) {
      this.amountMessage = '';
      if (parseFloat(this.legaChargeForm.get('amount')?.value.toString()) <= 0) {
        this.amountMessage = '';
        this.amountMessage = 'Amount must be greater than 0';
      }
    }
    else if (this.legaChargeForm.get('chargeType')?.value === Type.PERCENTAGE) {
      this.amountMessage = '';
      if (parseFloat(this.legaChargeForm.get('amount')?.value.toString()) >= 100) {
        this.amountMessage = '';
        this.amountMessage = 'Percentage must be less than 100';
      }
      else if (parseFloat(this.legaChargeForm.get('amount')?.value.toString()) <= 0) {
        this.amountMessage = '';
        this.amountMessage = 'Percentage must be greater than 0';
      }
    }
    var format = /[a-zA-Z!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/;
    if (this.legaChargeForm.get('amount')?.value.toString().match(format)) {
      this.amountMessage = '';
      this.amountMessage = 'Special Characters are not allowed';
    }



  }
  formInit() {
    return this.fb.group({
      mode: ['View', [Validators.required]],
      currency: ['', [Validators.required]],
      chargeType: ['', [Validators.required]],
      legalChargetype: ['', [Validators.required]],
      amount: ['0.00', [Validators.required]],
      notes: [''],
    });
  }
  formatRateValue(event: any) {
    const formattedValue = this.decimalPipe.transform(event.target.value, '1.2-2');
    this.legaChargeForm.get('amount')?.patchValue(formattedValue);
  }
  onUpdate() {
    if (this.legaChargeForm.invalid) {
      this.handelError('Please enter all required fields', 'red');
      return;
    }
    const body = {
      ...this.commonParams(),
      mode: this.legaChargeForm.controls['mode'].value,
      ChargeItem: this.legaChargeForm.controls['legalChargetype'].value,
      Currency: this.legaChargeForm.controls['currency'].value,
      ChargeMethod: this.legaChargeForm.controls['chargeType'].value,
      Rate: this.legaChargeForm.controls['amount'].value,
      Notes: this.legaChargeForm.controls['notes'].value,
    };
    try {
      this.loader.start();
      this.subSink.sink = this.projService.updateLegalCharges(body).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.legalChargeChange();
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
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
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  async propertyChnaged() {
    this.blocksList = [];
    this.legaChargeForm.controls['legalChargetype'].patchValue('');
    this.masterParams.type = Type.BLOCK;
    this.masterParams.item = this.legaChargeForm.controls['propCode'].value;
    try {
      if (this.masterParams.item != 'All' && this.legaChargeForm.controls['propCode'].value != '') {
        this.subSink.sink = await this.masterService.GetCascadingMasterItemsList(this.masterParams)
          .pipe(
            debounceTime(300)
          )
          .subscribe((result: getResponse) => {
            if (result.status.toUpperCase() === AccessSettings.SUCCESS) {
              this.blocksList = result['data'];
              if (this.blocksList.length === 1) {
                this.legaChargeForm.get('blockCode')!.patchValue(this.blocksList[0].itemCode);
              }
            }
            else {
              this.displayMessage(displayMsg.ERROR + "Block list empty!", TextClr.red);
              return;
            }
          });
      }
    }
    catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  async legalChargeChange() {
    this.rowData = [];
    const body = {
      ...this.commonParams(),
      item: TranType.LEGLCHARGE,
    };
    try {
      this.loader.start();
      this.subSink.sink = await this.projService.getLegalCharges(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
          this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  onHelpClicked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: ScreenId.LEGAL_CHARGES_SCRID,
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
  Clear() {
    this.legaChargeForm = this.formInit();
    this.refresh();
    this.handelError('', '');
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }

  async loadData() {
    const mode$ = this.masterService.getModesList({ ...this.commonParams(), item: ScreenId.LEGAL_CHARGES_SCRID, mode: this.legaChargeForm.get('mode')?.value });
    const currency$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.CURRENCY, mode: this.legaChargeForm.get('mode')?.value })
    const vbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.VATRATE, mode: this.legaChargeForm.get('mode')?.value });
    const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: Items.PROPERTY, mode: this.legaChargeForm.get('mode')?.value });
    const legalfee$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: TranType.LEGLCHARGE, mode: this.legaChargeForm.get('mode')?.value });
    try {
      this.subSink.sink = await forkJoin([vbody$, property$, legalfee$, currency$, mode$]).subscribe(
        ([vatRes, propertyRes, chargeRes, currencyRes, mode]: any) => {
          this.handleloadRes(vatRes, propertyRes, chargeRes, currencyRes, mode)
        },
        error => {
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      this.loader.stop();
    }


  }

  onRowSelected(event: any) {
    this.legaChargeForm.patchValue({
      mode: 'View',
      legalChargetype: event.data.chargeItem,
      chargeType: event.data.chargeMethod,
      currency: event.data.currency,
      amount: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      notes: event.data.notes
    },{emitEvent:false});
  }
  modeChange(value: any) {
    if (value.toUpperCase() === Mode.Add) {
      this.legaChargeForm = this.formInit();
      this.Clear();
      this.legaChargeForm.get('mode')!.patchValue('Add', { emitEvent: false });
      this.loadData();
    }
  }
  handleloadRes(vatRes: getResponse, propertyRes: getResponse, legalfee: getResponse, currencyRes: getResponse, mode: getResponse) {

    if (mode.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.modes = mode['data'];
      if (this.modes.length === 1) {
        this.legaChargeForm.get('mode')!.patchValue(this.modes[0].itemCode);
      }
    }
    else {
      this.displayMessage(displayMsg.ERROR + "Modes list empty!", TextClr.red);
    }

    if (legalfee.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.legaCharges = legalfee['data'];
      if (this.legaCharges.length === 1) {
        this.legaChargeForm.get('legalChargetype')!.patchValue(this.legaCharges[0].itemCode);
      }
    } else {
      this.displayMessage(displayMsg.ERROR + "Legal charges list empty", TextClr.red);

    }
    if (currencyRes.status.toUpperCase() === AccessSettings.SUCCESS) {
      this.currency = currencyRes['data'];
      if (this.currency.length === 1) {
        this.legaChargeForm.get('currency')!.patchValue(this.currency[0].itemCode);
      }
    } else {
      this.displayMessage(displayMsg.ERROR + "Currency list empty", TextClr.red);

    }
  }

  handelError(res: any, colour: string) {
    this.retMessage = res.message;
    this.textMessageClass = colour;
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  Delete() {

  }

}
