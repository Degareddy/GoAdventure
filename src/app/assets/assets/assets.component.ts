import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { AssetsService } from 'src/app/Services/assets.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserData } from 'src/app/admin/admin.module';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SubSink } from 'subsink';
import { AssetDetails } from '../assets.class';
import { SearchAssetComponent } from 'src/app/general/search-asset/search-asset.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { UserDataService } from 'src/app/Services/user-data.service';
import { TranStatus } from 'src/app/utils/enums';
@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  dialogOpen = false;
  modes: Item[] = [];
  descriptionLevelList: Item[] = [];
  //assetID!: any[];
  itemGCode!: string;
  assetForm!: FormGroup;
  bonusCode!: any;
  UOMList: Item[] = [];
  groupList: Item[] = [];
  currencyList: Item[] = [];
  assetcondList: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  assignedSlNo!: string;
  newTranMsg: string = "";
  selMode!: string;
  private subSink: SubSink;
  @Input() max: any;
  tomorrow = new Date();
  initialValue = 0;
  currentValue = 0;
  suppCode!: string;
  descriptionMethodList: Item[] = [];
  assetLocationList: Item[] = [];
  assetStatus!: string;
  assetDetailsCls: AssetDetails;
  currCustodianCode!: string;
  constructor(protected route: ActivatedRoute, private datePipe: DatePipe,
    protected router: Router, private userDataService: UserDataService,
    private masterService: MastersService, public dialog: MatDialog,
    private fb: FormBuilder, private toastr: ToastrService,
    private loader: NgxUiLoaderService,
    protected assetdtService: AssetsService) {
    this.masterParams = new MasterParams();
    this.assetForm = this.formInit();
    this.subSink = new SubSink();
    this.assetDetailsCls = new AssetDetails();
  }

  formInit() {
    return this.fb.group({
      assetID: ['', [Validators.required, Validators.maxLength(20)]],
      groupID: ['', [Validators.required, Validators.maxLength(50)]],
      assignedSlNo: [''],
      assetDesc: ['', [Validators.required, Validators.maxLength(50)]],
      uom: ['', [Validators.required, Validators.maxLength(10)]],
      asstLocation: ['', [Validators.required, Validators.maxLength(35)]],
      supplier: ['', [Validators.required, Validators.maxLength(255)]],
      make: ['', [Validators.required, Validators.maxLength(50)]],
      model: ['', [Validators.required, Validators.maxLength(50)]],
      mode: ['View', [Validators.maxLength(50)]],
      mfrSerial: ['', [Validators.required, Validators.maxLength(50)]],
      condition: ['', [Validators.required, Validators.maxLength(50)]],
      addedOn: [new Date(), [Validators.required]],
      applyOn: ['', [Validators.required, Validators.maxLength(15)]],
      depLevel: ['', Validators.maxLength(15)],
      depRate: [0.00],
      disposedValue: [0.00],
      disposedOn: [new Date(), [Validators.required]],
      lifeYears: ['', Validators.maxLength(10)],
      lifeMonths: ['', Validators.maxLength(10)],
      quantity: ['0'],
      remarks: ['', [Validators.maxLength(512)]],
      custodianName: ['', [Validators.maxLength(35)]],
      applyWarranty: [''],
      warrExpiry: [new Date(), [Validators.required]],
      warrDesc: ['', [Validators.maxLength(512)]],
      user: [''],
      refNo: [''],
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
  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;

    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM502'
    };
    try {
      this.subSink.sink = this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }
    catch (ex) {
      //console.log(ex);
    }
    this.loadData();
  }

  reset() {
    // this.getAssetData(this.masterParams);
    //this.get();
  }

  loadData() {
    const groupbody: getPayload = {
      ...this.commonParams(),
      item: "ASSETGROUP"
    }
    const condCodes: getPayload = {
      ...this.commonParams(),
      item: "ASSETCOND"
    };
    const uombody: getPayload = {
      ...this.commonParams(),
      item: "UOM"
    };
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM303'
    };
    const branchbody: getPayload = {
      ...this.commonParams(),
      item: 'BRANCHES'
    };
    const service1 = this.assetdtService.getModesList(modebody);
    const service2 = this.assetdtService.GetMasterItemsList(uombody);
    const service3 = this.assetdtService.GetMasterItemsList(groupbody);
    const service4 = this.assetdtService.GetMasterItemsList(condCodes);
    const service5 = this.assetdtService.GetMasterItemsList(branchbody);
    this.loader.start();
    this.subSink.sink = forkJoin([service1, service2, service3, service4, service5]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        const res4 = results[3];
        const res5 = results[4];
        this.modes = res1.data;
        this.UOMList = res2.data;
        this.groupList = res3.data;
        this.assetcondList = res4.data;
        this.assetLocationList = res5.data;
      },
      (error: any) => {
        this.loader.stop();
        this.toastr.info(error.message, "Exception");
      }
    );
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  getAssetData(assetData: MasterParams, mode: string) {
    this.loader.start();
    try {
      this.subSink.sink = this.assetdtService.getAssetdts(assetData).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.textMessageClass = "green";
          this.assetStatus = res['data'].assetStatus;
          this.assetForm.controls['groupID'].patchValue(res['data'].groupID);
          this.assetForm.controls['assetID'].patchValue(res['data'].assetID);
          this.assetForm.controls['assignedSlNo'].patchValue(res['data'].assignedSlNo);
          this.assetForm.controls['assetDesc'].patchValue(res['data'].assetDesc);
          this.assetForm.controls['uom'].patchValue(res['data'].uom);
          this.assetForm.controls['asstLocation'].patchValue(res['data'].asstLocation);
          this.initialValue = res.data.initialValue;
          this.assetForm.controls['supplier'].patchValue(res['data'].supplier);
          this.suppCode = res.data.suppCode;
          this.assetForm.controls['make'].patchValue(res['data'].make);
          this.assetForm.controls['model'].patchValue(res['data'].model);
          this.assetForm.controls['mfrSerial'].patchValue(res['data'].mfrSerial);
          this.assetForm.controls['condition'].patchValue(res['data'].condition);
          this.assetForm.controls['addedOn'].patchValue(res['data'].addedOn);
          this.assetForm.controls['depLevel'].patchValue(res['data'].depLevel);
          this.assetForm.controls['applyOn'].patchValue(res['data'].applyOn);
          this.currentValue = res.data.currentValue;
          this.initialValue = res.data.initialValue;
          this.assetForm.controls['disposedOn'].patchValue(res['data'].disposedOn);
          this.assetForm.controls['lifeYears'].patchValue(res['data'].lifeYears);
          this.assetForm.controls['lifeMonths'].patchValue(res['data'].lifeMonths);
          this.assetStatus = res.data.assetStatus;
          this.assetForm.controls['remarks'].patchValue(res['data'].remarks);
          this.assetForm.controls['custodianName'].patchValue(res['data'].custodianName);
          this.currCustodianCode = res['data'].currentCustodian;
          this.assetForm.controls['applyWarranty'].patchValue(res['data'].applyWarranty);
          this.assetForm.controls['warrDesc'].patchValue(res['data'].warrDesc);
          this.assetForm.controls['warrExpiry'].patchValue(res['data'].warrExpiry);
          this.assetForm.controls['quantity'].patchValue(res['data'].quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
          this.assetForm.controls['depRate'].patchValue(res['data'].depRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.assetForm.controls['disposedValue'].patchValue(res['data'].disposedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          this.currentValue = res.data.currValue;
          if (mode != 'View' && this.newTranMsg != '') {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = res.message;
          }
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      });
    }
    catch (ex: any) {
      this.retMessage = "Exception " + ex.message;
      this.textMessageClass = "red";
    }

  }

  // getAssetData() {
  //   this.masterParams.item = this.assetForm.controls['assignedSlNo'].value;
  //   //console.log(this.masterParams);
  //   try {
  //     // this.loader.start;
  //     this.assetdtService.getAssetdts(this.masterParams).subscribe((res: any) => {
  //       // this.loader.stop;
  //       //console.log(res);

  //       if (res.status.toUpperCase() === "SUCCESS") {
  //         this.assetForm.patchValue(res['data']);
  //         //this.assetForm = res['data'].groupId;

  //         this.assetStatus = res['data'].assetStatus;
  //         this.assetForm.controls['groupID'].patchValue(res['data'].groupID);
  //         this.assetForm.controls['assetID'].patchValue(res['data'].assetID);
  //         this.assetForm.controls['assignedSlNo'].patchValue(res['data'].assignedSlNo);
  //         this.assetForm.controls['assetDesc'].patchValue(res['data'].assetDesc);
  //         this.assetForm.controls['uom'].patchValue(res['data'].uom);
  //         this.assetForm.controls['asstLocation'].patchValue(res['data'].asstLocation);
  //         this.assetForm.controls['initialValue'].patchValue(res['data'].initialValue);
  //         this.assetForm.controls['supplier'].patchValue(res['data'].supplier);
  //         this.assetForm.controls['make'].patchValue(res['data'].make);
  //         this.assetForm.controls['model'].patchValue(res['data'].model);
  //         this.assetForm.controls['mfrSerial'].patchValue(res['data'].mfrSerial);
  //         this.assetForm.controls['condition'].patchValue(res['data'].condition);
  //         this.assetForm.controls['addedOn'].patchValue(res['data'].addedOn);
  //         this.assetForm.controls['depLevel'].patchValue(res['data'].depLevel);
  //         this.assetForm.controls['applyOn'].patchValue(res['data'].applyOn);
  //         this.assetForm.controls['depType'].patchValue(res['data'].depType);
  //         this.depRate = res.data.depRate;
  //         this.currentValue = res.data.currValue;
  //         this.assetForm.controls['disposedValue'].patchValue(res['data'].disposedValue);
  //         this.assetForm.controls['disposedOn'].patchValue(res['data'].disposedOn);
  //         this.assetForm.controls['lifeYears'].patchValue(res['data'].lifeYears);
  //         this.assetForm.controls['lifeMonths'].patchValue(res['data'].lifeMonths);
  //         //this.assetForm.controls['assetStatus'].patchValue(res['data'].assetStatus);
  //         this.assetForm.controls['remarks'].patchValue(res['data'].remarks);
  //         this.assetForm.controls['currentCustodian'].patchValue(res['data'].currentCustodian);
  //         this.assetForm.controls['applyWarranty'].patchValue(res['data'].applyWarranty);
  //         //this.assetForm.controls['warrExpiry'].patchValue(res['data'].warrExpiry);
  //         this.assetStatus = res.data.assetStatus;
  //         this.datePipe.transform(this.assetForm.controls['warrExpiry'].value, "dd-MM-yyyy");

  //         this.assetForm.controls['warrDesc'].patchValue(res['data'].warrDesc);
  //         this.assetForm.controls['mode'].patchValue('View');

  //         //console.log(this.assetForm);
  //         // Set the formatted date as the value of the form control
  //         // this.assetgrpForm.controls['effectiveDate'].patchValue(formattedDate);
  //         this.textMessageClass = 'green';
  //         this.retMessage =
  //           'Retriving data ' + res.message + ' has completed';
  //       }
  //       else {
  //         this.textMessageClass = 'red';
  //         this.retMessage = res.message;
  //       }
  //     })

  //   }
  //   catch (ex) {

  //   }
  // }

  Close() {
    this.router.navigateByUrl('/home');
  }

  formatDate(date: Date): string {
    // return this.datePipe.transform(date, 'dd-MM-yyyy') || ''
    return this.datePipe.transform(date, 'yyyy-MM-dd') || ''
  }

  searchData() {
    try {
      // Get the current date
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);

      const body = {
        Company: this.userDataService.userData.company,
        Location: this.userDataService.userData.location,
        TranType: 'ASSET',
        TranNo: this.assetForm.controls['assignedSlNo'].value,
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        Party:"",
        TranStatus:"ANY",
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
      this.subSink.sink = this.assetdtService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.item = res.data.selTranNo;
            this.getAssetData(this.masterParams, this.assetForm.get('mode')?.value);
          }
          else {
            // this.reset
            if (!this.dialogOpen) {
              this.dialogOpen = true;

              const dialogRef: MatDialogRef<SearchAssetComponent> = this.dialog.open(SearchAssetComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetForm.controls['assignedSlNo'].value, 'TranType': "ASSET",
                  'search': 'Asset Search'
                }
              });
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.masterParams.item = result.assignedSlNo;
                  this.assetForm.controls['assignedSlNo'].patchValue(result.assignedSlNo);
                  this.getAssetData(this.masterParams, this.assetForm.get('mode')?.value)
                }
              });
            }
          }
        }
        else {
          // this.reset();
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }

      });
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.assetForm = this.formInit();
      this.Clear()
      this.assetForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
    else {
      this.assetForm.controls['mode'].patchValue(event, { emitEvent: false });
    }
  }

  onSubmit(): void {
    this.retMessage = "";
    this.textMessageClass = "";
    if (this.assetForm.invalid) {
      return;
    }
    else {
      this.assetDetailsCls.mode = this.assetForm.controls['mode'].value;
      this.assetDetailsCls.user = this.userDataService.userData.userID;
      this.assetDetailsCls.company = this.userDataService.userData.company;
      this.assetDetailsCls.location = this.userDataService.userData.location;
      this.assetDetailsCls.user = this.userDataService.userData.userID,
        this.assetDetailsCls.refNo = this.userDataService.userData.sessionID;
      this.assetDetailsCls.groupID = this.assetForm.controls['groupID'].value;
      this.assetDetailsCls.assetID = this.assetForm.controls['assetID'].value;
      this.assetDetailsCls.assignedSlNo = this.assetForm.controls['assignedSlNo'].value;
      this.assetDetailsCls.assetDesc = this.assetForm.controls['assetDesc'].value;
      this.assetDetailsCls.uom = this.assetForm.controls['uom'].value;
      this.assetDetailsCls.asstLocation = this.assetForm.controls['asstLocation'].value;
      this.assetDetailsCls.initialValue = this.initialValue;
      this.assetDetailsCls.supplier = this.suppCode;
      this.assetDetailsCls.make = this.assetForm.controls['make'].value;
      this.assetDetailsCls.model = this.assetForm.controls['model'].value;
      this.assetDetailsCls.mfrSerial = this.assetForm.controls['mfrSerial'].value;
      this.assetDetailsCls.condition = this.assetForm.controls['condition'].value;
      this.assetDetailsCls.addedOn = this.assetForm.controls['addedOn'].value;
      this.assetDetailsCls.depLevel = this.assetForm.controls['depLevel'].value;
      this.assetDetailsCls.applyOn = this.assetForm.controls['applyOn'].value;
      this.assetDetailsCls.depRate = parseFloat(this.assetForm.controls['depRate'].value.replace(/,/g, ''));
      this.assetDetailsCls.disposedValue = parseFloat(this.assetForm.controls['disposedValue'].value.replace(/,/g, ''));
      this.assetDetailsCls.disposedOn = this.assetForm.controls['disposedOn'].value;
      this.assetDetailsCls.lifeYears = this.assetForm.controls['lifeYears'].value;
      this.assetDetailsCls.lifeMonths = this.assetForm.controls['lifeMonths'].value;
      this.assetDetailsCls.assetStatus = this.assetStatus;
      this.assetDetailsCls.remarks = this.assetForm.controls['remarks'].value;
      this.assetDetailsCls.currentCustodian = this.currCustodianCode;
      this.assetDetailsCls.applyWarranty = this.assetForm.controls['applyWarranty'].value;
      this.assetDetailsCls.warrExpiry = this.assetForm.controls['warrExpiry'].value;
      this.assetDetailsCls.warrDesc = this.assetForm.controls['warrDesc'].value;
      this.assetDetailsCls.quantity = parseFloat(this.assetForm.controls['quantity'].value.replace(/,/g, ''));
      try {
        this.loader.start();
        this.subSink.sink = this.assetdtService.updateAssetdts(this.assetDetailsCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.assetForm.controls['mode'].value === "Add") {
              this.modeChange("Modify");
            }
            this.masterParams.item = res.tranNoNew;
            this.getAssetData(this.masterParams, this.assetForm.get('mode')?.value);
          }
          else {
            this.textMessageClass = 'red';
            this.retMessage = res.message;
          }
        });

      }
      catch (ex: any) {
        this.textMessageClass = 'red';
        this.retMessage = ex.message;
      }

    }
  }

  // onSearchCilcked(assignedSlNo: any) {
  //   const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
  //     disableClose: true,
  //     data: { 'tranNum': 'assignedSlNo', 'search': 'Asset Search' }  // Pass any data you want to send to CustomerDetailsComponent
  //   });
  //
  //   dialogRef.afterClosed().subscribe(result => {
  //     //console.log(`Dialog result: ${result}`);
  //     this.masterParams.item = result;
  //     this.assetdata(this.masterParams);

  //   });
  Delete() {

  }

  Clear() {
    this.assetForm = this.formInit();
    this.assetStatus = "";
    this.initialValue = 0;
    this.currentValue = 0;
    this.newTranMsg="";

  }

  onEmployeeSearch() {
    const body = {
      ...this.commonParams(),
      Type: "USER",
      item: this.assetForm.controls['custodianName'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.assetdtService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.assetForm.controls['custodianName'].patchValue(res.data.selName);
            this.currCustodianCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetForm.controls['custodianName'].value, 'PartyType': "USER",
                  'search': 'Employee Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.assetForm.controls['custodianName'].patchValue(result.partyName);
                  this.currCustodianCode = result.code
                }
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

  onSupplierSearch() {
    const body = {
      ...this.commonParams(),
      Type: "SUPPLIER",
      item: this.assetForm.controls['supplier'].value,
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.assetdtService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.assetForm.controls['supplier'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.assetForm.controls['supplier'].value, 'PartyType': "SUPPLIER",
                  'search': 'Supplier Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.assetForm.controls['supplier'].patchValue(result.partyName);
                  this.suppCode = result.code
                }
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

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {

      disableClose: true,
      data: {
        ScrId: "SM502",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }
}
