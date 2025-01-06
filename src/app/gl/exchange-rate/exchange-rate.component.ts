import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { UserData } from 'src/app/admin/admin.module';
import { Item } from 'src/app/general/Interface/interface';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { InventoryService } from 'src/app/Services/inventory.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { ExcRateClass } from '../gl.class';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.css']
})
export class ExchangeRateComponent implements OnInit, OnDestroy {
  exrtForm!: FormGroup;
  modes: Item[] = [];
  retMessage!: string;
  textMessageClass!: string;
  private subSink: SubSink = new SubSink();
  private exchangeCls: ExcRateClass = new ExcRateClass();
  status: string = "";
  currencyList: Item[] = [];
  rowData: any = [];
  statusList: Item[] = [
    { itemCode: "Open", itemName: "Open" },
    { itemCode: "Confirmed", itemName: "Confirmed" }
  ];
  today: Date = new Date();
  columnDefs: any = [{ field: "baseCurrency", headerName: "Base Currency", flex: 1, resizable: true, sortable: true, filter: true, },
  { field: "convCurrency", headerName: "Conversion Currency", flex: 1, resizable: true, sortable: true, filter: true, cellRenderer: 'agLnkRenderer' },

  {
    field: "convDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
      // Format date as dd-MM-yyyy
      if (params.value) {
        const date = new Date(params.value);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      return null;
    },
  },
  {
    field: "rate", headerName: "Rate", sortable: true, resizable: true, flex: 1, filter: 'agNumberColumnFilter', type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
    valueFormatter: function (params: any) {
      if (typeof params.value === 'number' || typeof params.value === 'string') {
        const numericValue = parseFloat(params.value.toString());
        if (!isNaN(numericValue)) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(numericValue);
        }
      }
      return null;
    }
  },
  { field: "convStatus", headerName: "Status", flex: 1, resizable: true, sortable: true, filter: true, }
  ];
  constructor(private fb: FormBuilder, public dialog: MatDialog, private userDataService: UserDataService,
    private invService: InventoryService, private loader: NgxUiLoaderService, private glService: GeneralLedgerService,
  ) {
    this.exrtForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  onLnkClicked(event: any) {
    // console.log(event);
    this.exrtForm.patchValue({
      baseCurrency: event.data.baseCurrency,
      conversionCurrency: event.data.convCurrency,
      status: event.data.convStatus,
      rate: event.data.rate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      Date: event.data.convDate,
    }, { emitEvent: false })
  }
  GetExchangeDetails() {
    // this.displayMessage("", "");
    this.rowData=[];
    const body = {
      ...this.commonParams(),
      mode: this.exrtForm.get('mode')?.value,
      BaseCurrency: this.exrtForm.get('baseCurrency')?.value,
      ConvDate: this.exrtForm.get('Date')?.value
    }
    try {
      this.subSink.sink = this.glService.GetExchangeDetails(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          // this.displayMessage(res.message, "green");
          this.rowData = res.data;
        }
        else {
          this.displayMessage(res.message, "red");
        }
      })

    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }

  formInit() {
    return this.fb.group({
      mode: ['View'],
      baseCurrency: ['KES', [Validators.required, Validators.maxLength(30)]],
      conversionCurrency: ['', [Validators.required, Validators.maxLength(30)]],
      status: ['', Validators.required],
      rate: ['0.0000', Validators.required],
      Date: [new Date(), [Validators.required]]
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
    this.loadData();
    this.refreshData();
    this.GetExchangeDetails();
  }
  refreshData() {

    this.exrtForm.controls.Date.valueChanges.subscribe((res) => {
      this.GetExchangeDetails();
    })
  }
  loadData() {
    const service1 = this.invService.getModesList({ ...this.commonParams(), item: 'SM406' });
    const service2 = this.invService.GetMasterItemsList({ ...this.commonParams(), item: "CURRENCY",mode:this.exrtForm.get('mode')?.value });
    this.subSink.sink = forkJoin([service1, service2]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.modes = res1.data;
        }
        else {
          this.displayMessage("Error: Modes list empty!", "red");
        }
        const res2 = results[1];
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.currencyList = res2.data;
        }
        else {
          this.displayMessage("Error: Currency list empty!", "red");
        }
      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage("Error: " + error.message, "red");
      }
    );
  }

  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  prepareCls() {
    this.exchangeCls.ConvCurrency = this.exrtForm.get('conversionCurrency')?.value;
    this.exchangeCls.ConvDate = this.exrtForm.get('Date')?.value;
    this.exchangeCls.baseCurrency = this.exrtForm.get('baseCurrency')?.value;
    this.exchangeCls.convStatus = this.exrtForm.get('status')?.value;
    this.exchangeCls.rate = this.exrtForm.get('rate')?.value;
    this.exchangeCls.refNo = this.userDataService.userData.sessionID;
    this.exchangeCls.user = this.userDataService.userData.userID;
    this.exchangeCls.company = this.userDataService.userData.company;
    this.exchangeCls.location = this.userDataService.userData.location;
    this.exchangeCls.mode = this.exrtForm.get('mode')?.value;
  }
  onSubmit() {
    this.displayMessage("", "");
    if (this.exrtForm.valid) {
      this.prepareCls();
      try {
        this.loader.start();
        this.subSink.sink = this.glService.UpdateExchangeDetails(this.exchangeCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.displayMessage(res.message, "green");
            if(this.exrtForm.get('mode')?.value.toUpperCase()==='ADD'){
              this.exrtForm.get('mode')?.patchValue('Modify');
            }
            this.GetExchangeDetails();
          }
          else {
            this.displayMessage(res.message, "red");
          }
        })

      }
      catch (ex: any) {
        this.displayMessage("Exception: " + ex.message, "red");
      }

    }
    else {
      this.displayMessage("Form Invalid", "red");
    }
  }
  Clear() {
    this.exrtForm = this.formInit();
    this.displayMessage("", "");
    this.refreshData();
    this.rowData = [];
  }
  reset() {
    // this.exrtForm.reset();
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM406",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

}
