import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { unitSalesClass } from '../Project.class';
import { ProjectsService } from 'src/app/Services/projects.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { InventoryService } from 'src/app/Services/inventory.service';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UnitSaleDetailsComponent } from './unit-sale-details/unit-sale-details.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';

@Component({
  selector: 'app-unit-sales',
  templateUrl: './unit-sales.component.html',
  styleUrls: ['./unit-sales.component.css']
})
export class UnitSalesComponent implements OnInit, OnDestroy {
  unitSalesForm!: FormGroup;
  modes: Item[] = [];
  private subSink: SubSink = new SubSink();
  paytemList: Item[] = [];
  itemList: Item[] = [{ itemCode: "Plot", itemName: "Plot" }, { itemCode: "Flat", itemName: "Flat" }];
  currencyList: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  private unitCls: unitSalesClass;
  private tranNewMsg: string = "";
  dialogOpen: boolean = false;
  dialogSearchOpen: boolean = false;
  tranStatus: string = "";
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    private datePipe: DatePipe, private dialog: MatDialog, protected utlService: UtilitiesService,
    private projectService: ProjectsService, private loader: NgxUiLoaderService, private invService: InventoryService,
    private masterService: MastersService) {
    this.formInit();
    this.unitCls = new unitSalesClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    const body: getPayload = {
      ...this.commonParams(),
      item: 'ST905'
    };
    this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.modes = res['data'];
        if (this.modes.length === 1) {
          this.unitSalesForm.get('mode')!.patchValue(this.modes[0].itemCode);
        }
      }
    });
    this.loadData();
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
    const curbody = {
      ...this.commonParams(),
      Item: "CURRENCY",
      mode: this.unitSalesForm.get('mode')?.value
    };
    const payTerm = {
      ...this.commonParams(),
      Item: "PAYTERM",
      mode: this.unitSalesForm.get('mode')?.value
    };
    const service2 = this.invService.GetMasterItemsList(curbody);
    const service3 = this.invService.GetMasterItemsList(payTerm);
    this.subSink.sink = forkJoin([service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        if (res2.status.toUpperCase() === "SUCCESS") {
          this.paytemList = res2.data;

        }
        else {
          this.retMessage = "Payterm list empty!"
          this.textMessageClass = "red";
          return;
        }
        if (res1.status.toUpperCase() === "SUCCESS") {
          this.currencyList = res1.data;

        }
        else {
          this.retMessage = "Currency list empty!"
          this.textMessageClass = "red";
          return;
        }


      },
      (error: any) => {
        this.loader.stop();
      }
    );
  }
  private createRequestData(item: string, type: string,): any {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      item: item,
      type: type,
      refNo: this.userDataService.userData.sessionID,
      itemFirstLevel: "",
      itemSecondLevel: "",
    };
  }
  searchCustomer(custType: string) {
    let body = {};
    let PartyType = "";
    if (custType === "Customer") {
      body = this.createRequestData(this.unitSalesForm.controls['customer'].value || '', "CUSTOMER");
      PartyType = "CUSTOMER"
    }
    else {
      body = this.createRequestData(this.unitSalesForm.controls['salesRep'].value || '', "EMPLOYEE");
      PartyType = "EMPLOYEE"
    }

    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            if (custType === "Customer") {
              this.unitSalesForm.controls['customer'].patchValue(res.data.selName);
              this.unitCls.Customer = res.data.selCode;
            }
            else {
              this.unitSalesForm.controls['salesRep'].patchValue(res.data.selName);
              this.unitCls.SalesRep = res.data.selCode;
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.unitSalesForm.controls['customer'].value, 'PartyType': PartyType,
                  'search': PartyType + ' Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  if (custType === "Customer") {
                    this.unitSalesForm.controls['customer'].patchValue(result.partyName);
                    this.unitCls.Customer = result.code;
                  }
                  else {
                    this.unitSalesForm.controls['salesRep'].patchValue(result.partyName);
                    this.unitCls.SalesRep = result.code;
                  }
                }
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.handleError(res);
        }
      });
    }
    catch (ex: any) {
      this.handleError(ex);
    }
  }

  handleError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = "red";
  }
  modeChange(event: string) {
    if (event === "Add") {
      this.formInit();
      this.retMessage = "";
      this.textMessageClass = "";
      this.unitSalesForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.unitSalesForm.get('tranNo')?.disable()
      this.loadData();
    }
    else {
      this.unitSalesForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.unitSalesForm.get('tranNo')?.enable();
    }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }
  searchTranNum() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: 'FPINV',
      TranNo: this.unitSalesForm.get('tranNo')!.value,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        if (res && res.data && res.data.tranCount === 1) {
          this.getUnitSales(res.data.selTranNo, this.unitSalesForm.get('mode')!.value);
        }
        else {
          if (!this.dialogSearchOpen) {
            this.dialogSearchOpen = true;
            const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
              width: '90%',
              disableClose: true,
              data: {
                mode: this.unitSalesForm.get('mode')!.value,
                tranNum: this.unitSalesForm.get('tranNo')!.value, search: 'Unit Sale Details', TranType: "FPINV"
              }
            });
            dialogRef.afterClosed().subscribe(result => {
              this.dialogSearchOpen = false;
              if (result != true) {
                this.unitSalesForm.get('tranNo')!.patchValue(result);
                this.getUnitSales(result, this.unitSalesForm.get('mode')!.value)
              }
            });
          }

        }
      }
      else {
        this.retMessage = "No transactions found!";
        this.textMessageClass = "red";
        return;
      }
    });
  }
  formInit() {
    this.unitSalesForm = this.fb.group({
      mode: ['View'],
      itemType: ['', Validators.required],
      tranNo: [''],
      tranDate: [new Date(), Validators.required],
      custRefNo: [''],
      customer: ['', Validators.required],
      payterm: ['', Validators.required],
      currency: ['', Validators.required],
      exchRate: ['1.0000', Validators.required],
      salesRep: ['', Validators.required],
      lpoNo: [''],
      applyVat: [false],
      remarks: ['', Validators.required]
    });
  }
  getUnitSales(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      TranNo: tranNo,
      TranType: "FPINV",
      langId: this.userDataService.userData.langId
    }
    this.subSink.sink = this.projectService.GetSaleInvoicePFHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        if (mode != "View") {
          this.retMessage = this.tranNewMsg;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        this.unitCls.Customer = res['data'].customer;
        this.unitCls.SalesRep = res['data'].salesRep;
        this.tranStatus = res['data'].tranStatus;
        this.unitSalesForm.patchValue({
          tranNo: tranNo,
          itemType: res['data'].itemType,
          tranDate: res['data'].tranDate,
          custRefNo: res['data'].custRefNo,
          customer: res['data'].customerName,
          payterm: res['data'].payTerm,
          currency: res['data'].currency,
          exchRate: res['data'].exchRate.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
          salesRep: res['data'].salesRep,
          lpoNo: res['data'].lpoNo,
          applyVat: res['data'].applyVAT,
          remarks: res['data'].remarks
        });
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  onSubmit() {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.unitSalesForm.invalid) {
      this.retMessage = "Enter mandatory fields";
      this.textMessageClass = "";
      return;
    }
    else {
      const formValues = this.unitSalesForm.value;
      this.unitCls.Mode = formValues.mode;
      this.unitCls.itemType = formValues.itemType;
      this.unitCls.TranNo = formValues.tranNo;

      const transformedDate = this.datePipe.transform(formValues.tranDate, 'yyyy-MM-dd');
      if (transformedDate !== undefined && transformedDate !== null) {
        this.unitCls.TranDate = transformedDate.toString();
      } else {
        this.unitCls.TranDate = '';
      }

      this.unitCls.CustRefNo = formValues.custRefNo;
      this.unitCls.PayTerm = formValues.payterm;
      this.unitCls.Currency = formValues.currency;
      this.unitCls.ExchRate = formValues.exchRate;
      this.unitCls.LPONo = formValues.lpoNo;
      this.unitCls.ApplyVat = formValues.applyVat;
      this.unitCls.Remarks = formValues.remarks;
      this.unitCls.Company = this.userDataService.userData.company;
      this.unitCls.Location = this.userDataService.userData.location;
      this.unitCls.LangId = this.userDataService.userData.langId;
      this.unitCls.User = this.userDataService.userData.userID;
      this.unitCls.RefNo = this.userDataService.userData.sessionID;
      this.loader.start();
      this.subSink.sink = this.projectService.UpdateInvoicePlotFlatHdr(this.unitCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.tranNewMsg = res.message;
          this.unitSalesForm.get('tranNo')?.patchValue(res.tranNoNew);
          if (this.unitSalesForm.get('mode')!.value === "Add") {
            this.modeChange("Modify");
          }
          this.getUnitSales(res.tranNoNew, this.unitSalesForm.get('mode')!.value)
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })
    }
  }
  clear() {
    this.retMessage = "";
    this.textMessageClass = "";
    this.formInit();
    this.tranStatus = "";
  }
  Close() {

  }
  onDocsCilcked() {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.unitSalesForm.controls['mode'].value, tranNo: this.unitSalesForm.controls['tranNo'].value, search: 'Unit Sales Docs', tranType: "FPINV" }
    });
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST905",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }
  onDetailsCilcked() {
    const dialogRef: MatDialogRef<UnitSaleDetailsComponent> = this.dialog.open(UnitSaleDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { mode: this.unitSalesForm.controls['mode'].value, tranNum: this.unitSalesForm.controls['tranNo'].value, search: 'Unit Sale Details', tranType: "FPINV" }
    });

  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.unitSalesForm.controls['mode'].value,
        'note': this.unitSalesForm.controls['remarks'].value,
        'TranType': "FPINV",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Unit Sales Notes"
      }
    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "FPINV",
        'tranNo': tranNo,
        'search': 'Unit Sale Log Details'
      }
    });
  }


}

