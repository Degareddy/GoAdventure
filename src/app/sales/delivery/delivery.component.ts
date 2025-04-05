import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Item } from 'src/app/general/Interface/interface';
import { MastersService } from 'src/app/Services/masters.service';
import { SalesService } from 'src/app/Services/sales.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { deliveryHeader, MasterParams } from '../sales.class';
import { SubSink } from 'subsink';
import { forkJoin, map, startWith } from 'rxjs';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { FileUploadComponent } from 'src/app/Masters/file-upload/file-upload.component';
import { DeliveryDetailsComponent } from './delivery-details/delivery-details.component';
import { PdfReportsService } from 'src/app/FileGenerator/pdf-reports.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { displayMsg, TextClr, TranStatus } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

interface params {
  itemCode: string
  itemName: string

}
@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit, OnDestroy {
  deliveryForm!: FormGroup;
  filteredCustomer: any[] = [];
  customerList:any[]=[]
  tomorrow = new Date();
  title: string = "Delivery";
  modes: Item[] = [];
  retMessage: string = "";
  textMessageClass: string = "";
  private newTranMsg: string = "";
  masterParams!: MasterParams;
  private subSink: SubSink;
  private custCode: string = "";
  private delCls: deliveryHeader = new deliveryHeader();
  deliveryMethodList: Item[] = [{ itemCode: "byRoad", itemName: "By Road" }];
  tranStatus: string = "";
  dialogOpen: boolean = false;
  constructor(private fb: FormBuilder, public dialog: MatDialog, private userDataService: UserDataService,
    private masterService: MastersService, private pdfService: PdfReportsService,
    private utlService: UtilitiesService, protected saleService: SalesService, private loader: NgxUiLoaderService,
    protected router: Router, private datePipe: DatePipe) {
    this.deliveryForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    // this.masterParams.tranType = "DIRINV";
    this.loadData();
    this.deliveryForm.get('customer')!.valueChanges
                  .pipe(
                    startWith(''),
                    map(value => this._filter(value || ''))
                  )
                  .subscribe(filtered => {
                    this.filteredCustomer = filtered;
                  });
                  this.loadCust()
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  loadCust(){
        const body={
          "Company": this.userDataService.userData.company,
          "Location" : this.userDataService.userData.location,
          "City" : "",
          "Email" : "",
          "FullAddress":  "",
          "Phones"   :  "",
          "PartyName"  : "",
          "PartyStatus"  : TranStatus.OPEN,
          "RefNo"   :this.userDataService.userData.sessionID,
          "User"   :this.userDataService.userData.userID,
          "PartyType"     : "CUSTOMER",
          
        }
        try {
          
            this.subSink.sink = this.utlService.GetPartySearchList(body).subscribe((res: any) => {
              if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
                this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
               
              }
              else {
               this.customerList=res.data.map((item: any) => item.partyName);
               this.filerCutomers
    =res.data.map((item: any) => item.partyName)
               console.log(this.customerList)
                this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
              }
            });
          }
          catch (ex: any) {
            this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
          }
      }
  filerCutomers(value: any) {
    const filterValue = value.toLowerCase();
    return this.customerList.filter((cust: params) => cust.itemName.toLowerCase().includes(filterValue));
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.customerList.filter(option => option.toLowerCase().includes(filterValue));
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
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST204',
    };
    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      this.subSink.sink = forkJoin([service1]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          this.modes = res1.data;
        },
        (error: any) => {
          this.loader.stop();
          this.retMessage = error.message;
          this.textMessageClass = 'red';
        }
      );

    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }
  onDocsCilcked(arg0: string) {
    const dialogRef: MatDialogRef<FileUploadComponent> = this.dialog.open(FileUploadComponent, {
      width: '90%',
      disableClose: true,
      data: {
        mode: this.deliveryForm.get('mode')!.value, tranNo: this.deliveryForm.get('tranNo')!.value,
        search: 'Delivery Docs', tranType: "DELISSUE"
      }
    });
  }
  onDetailsCilcked(arg0: string) {
    const dialogRef: MatDialogRef<DeliveryDetailsComponent> = this.dialog.open(DeliveryDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranType': "DELISSUE", 'tranNo': this.deliveryForm.controls['delNo'].value, 'search': "Delivery Details",
        'mode': this.deliveryForm.controls['mode'].value, 'status': this.tranStatus
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        // this.saleData(this.masterParams, this.deliveryForm.get('mode')?.value);
      }
    });
  }
  formInit() {
    return this.fb.group({
      mode: ['View'],
      tranNo: [''],
      delNo: [''],
      tranDate: [new Date(), [Validators.required]],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      notes: [''],
      shipTo: ['', [Validators.required]],
      deliveryMethod: ['', Validators.required],
      // deliveryNo: ['', [Validators.required]],
      transporter: ['', [Validators.required]],
      truckNo: ['', [Validators.required]],
      driverName: ['', [Validators.required]],
      driverId: ['', [Validators.required]]
    });
  }
  prepareDelCls() {
    this.delCls.company = this.userDataService.userData.company;
    this.delCls.location = this.userDataService.userData.location;
    this.delCls.langID = this.userDataService.userData.langId;
    this.delCls.refNo = this.userDataService.userData.sessionID;
    this.delCls.user = this.userDataService.userData.userID;

    this.delCls.customer = this.custCode;
    this.delCls.delMethod = this.deliveryForm.get("deliveryMethod")!.value;
    this.delCls.driverID = this.deliveryForm.get("driverId")!.value;
    this.delCls.driverName = this.deliveryForm.get("driverName")!.value;
    this.delCls.mode = this.deliveryForm.get("mode")!.value;

    this.delCls.remarks = this.deliveryForm.get("notes")!.value;
    this.delCls.saleNo = this.deliveryForm.get("tranNo")!.value;

    this.delCls.tranNo = this.deliveryForm.get("delNo")!.value;
    this.delCls.shipToDesc = this.deliveryForm.get("shipTo")!.value;
    const transformedDate = this.datePipe.transform(this.deliveryForm.get('tranDate')!.value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.delCls.tranDate = transformedDate.toString();
    } else {
      this.delCls.tranDate = ''; // or any default value you prefer
    }

    // this.delCls.tranDate = this.deliveryForm.get("tranDate")!.value;
    this.delCls.transporter = this.deliveryForm.get("transporter")!.value;

    this.delCls.truckNo = this.deliveryForm.get("truckNo")!.value;
    // this.delCls.transporter = this.userDataService.userData.company;
    // this.delCls.transporter = this.userDataService.userData.company;
  }
  onSubmit() {
    this.clearMsg();
    if (this.deliveryForm.invalid) {
      this.retMessage = "Enter all mandatory fields";
      this.textMessageClass = "red";
      return;
    }
    else {
      if (this.custCode === "") {
        this.retMessage = "Select Valid Customer!";
        this.textMessageClass = "red";
        return;
      }
      this.prepareDelCls();
      this.loader.start();
      this.subSink.sink = this.saleService.UpdateDeliveryHdr(this.delCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.newTranMsg = res.message;
          if (this.deliveryForm.get('mode')?.value === 'Add') {
            this.modeChange('Modify');
          }
          this.deliveryForm.get('delNo')?.patchValue(res.tranNoNew);
          this.getDelHeader(res.tranNoNew, this.deliveryForm.get('mode')?.value);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
  }
  clear() {
    // this.deliveryForm.reset()
    this.deliveryForm = this.formInit();
    this.clearMsg();
    this.tranStatus="";
  }
  Close() {
    this.router.navigateByUrl('/home');

  }
  deliveryReport() {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: this.deliveryForm.get('delNo')!.value
    }
    this.subSink.sink = this.saleService.GetDeliveryReport(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.pdfService.generateQuotationPDF(res['data'], "Delivery", new Date(), "PDF");
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  billToSearch(itemType: string) {
    let controlValue: string;
    controlValue = this.deliveryForm.get('shipTo')!.value
    const body = {
      ...this.commonParams(),
      Type: itemType,
      Item: this.deliveryForm.get('customer')!.value,
      ItemFirstLevel: controlValue,
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.deliveryForm.get('shipTo')!.patchValue(res.data.selName);
            this.delCls.shipTo = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.deliveryForm.controls['customer'].value, 'PartyType': itemType,
                  'search': itemType + ' Search', 'PartyName': ""
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.deliveryForm.get('shipTo')!.patchValue(result.partyName);
                this.delCls.shipTo = result.code;
              });
              this.dialogOpen = false;
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  modeChange(event: string) {
    if (event === "Add") {
      // this.reset();
      this.deliveryForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.deliveryForm.get('tranNo')!.enable();
      this.deliveryForm.get('delNo')!.disable();
    }
    else {
      this.deliveryForm.get('mode')!.patchValue(event, { emitEvent: false });
      this.deliveryForm.get('tranNo')!.disable();
      this.deliveryForm.get('delNo')!.enable();
    }
  }
  getSaleOrderHeader(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetSaleOrderHdr(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        this.deliveryForm.patchValue({
          customer: res.data.customerName,
          shipTo: res.data.shipToDesc,
        });
        this.custCode = res.data.customer;
        this.delCls.shipTo =  res.data.shipTo
        // this.vatAmount = res.data.vatAmount;
        // this.totalAmount = res.data.totalAmount;
        // this.itemCount = res.data.itemCount;
      }
    });
  }
  searchtransaction(tranType: string, tranNo: string, search: string) {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
    const formattedCurrentDate = this.formatDate(currentDate);
    const body = {
      ...this.commonParams(),
      TranType: tranType,
      TranNo: tranNo,
      Party: "",
      FromDate: formattedFirstDayOfMonth,
      ToDate: formattedCurrentDate,
      TranStatus: "ANY"
    }
    try {
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.tranCount === 1) {
            if (tranType === "DELISSUE") {
              this.deliveryForm.get("delNo")!.patchValue(res.data.selTranNo);
              this.masterParams.tranNo = res.data.selTranNo;
              this.getDelHeader(res.data.selTranNo, this.deliveryForm.get("mode")!.value);
            }
            else {
              this.deliveryForm.get("tranNo")!.patchValue(res.data.selTranNo);
              this.getSaleOrderHeader(res.data.selTranNo, this.deliveryForm.get("mode")!.value);
            }
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': tranNo, 'TranType': tranType, 'search': search + ' Search'
                }
              });

              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  if (tranType === "DELISSUE") {
                    this.deliveryForm.get("delNo")!.patchValue(result);
                    this.masterParams.tranNo = result;
                    this.getDelHeader(result, this.deliveryForm.get("mode")!.value);
                  }
                  else {
                    this.deliveryForm.get("tranNo")!.patchValue(result);
                    this.getSaleOrderHeader(result, this.deliveryForm.get("mode")!.value);
                  }
                }
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }
  deliverySearch() {
    this.searchtransaction("DELISSUE", this.deliveryForm.get("delNo")!.value, "DELIVERY");
  }
  saleOrderSearch() {
    this.searchtransaction("SALEORDER", this.deliveryForm.get("tranNo")!.value, "Sale Order");
  }
  onCustomerSearch() {
    const body = {
      ...this.commonParams(),
      Type: "CUSTOMER",
      PartyName: this.deliveryForm.controls['customer'].value || ""

    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          if (res && res.data && res.data.nameCount === 1) {
            this.deliveryForm.get('customer')!.patchValue(res.data.selName);
            this.custCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.deliveryForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.deliveryForm.get('customer')!.patchValue(result.partyName);
                this.custCode = result.code;
                this.dialogOpen = false;
              });
            }
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = 'red';
    }
  }

  getDelHeader(tranNo: string, mode: string) {
    const body = {
      ...this.commonParams(),
      langId: this.userDataService.userData.langId,
      tranNo: tranNo
    }
    this.subSink.sink = this.saleService.GetDeliveryHeader(body).subscribe((res: any) => {
      if (res.status.toUpperCase() === "SUCCESS") {
        if (mode != 'View' && this.newTranMsg != "") {
          this.retMessage = this.newTranMsg;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        this.deliveryForm.patchValue({
          tranDate: res.data.tranDate,
          customer: res.data.customerName,
          notes: res.data.remarks,
          shipTo: res.data.shipToDesc,
          deliveryMethod: res.data.delMethod,
          tranNo: res.data.saleNo,
          transporter: res.data.transporter,
          truckNo: res.data.truckNo,
          driverName: res.data.driverName,
          driverId: res.data.driverID
        });
        this.delCls.shipTo =  res.data.shipTo;
        this.delCls.shipToDesc =  res.data.shipToDesc;
        this.custCode = res.data.customer;
        this.tranStatus = res.data.tranStatus;
      }
      else {
        this.retMessage = res.message;
        this.textMessageClass = "red";
      }
    });
  }



  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "ST204",
        SlNo: 0,
        IsPrevious: false,
        IsNext:false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}
