import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MastersService } from 'src/app/Services/masters.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { UserData } from 'src/app/admin/admin.module';
import { SubSink } from 'subsink';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { forkJoin } from 'rxjs';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { SearchProjectComponent } from 'src/app/general/search-project/search-project.component';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { plotSaleClass } from '../Project.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';

@Component({
  selector: 'app-plot-sale',
  templateUrl: './plot-sale.component.html',
  styleUrls: ['./plot-sale.component.css']
})
export class PlotSaleComponent implements OnInit, OnDestroy {
  pltSaleForm!: FormGroup;
  pltSaleCls!: plotSaleClass;
  modes!: any[];
  userData: any;
  retMessage!: string;
  textMessageClass!: string;
  masterParams!: MasterParams;
  private subSink: SubSink;
  dialogOpen = false;
  ventureCode!: string;
  plotNo!: string;
  customerCode!: string;
  tranStatus!: string;
  dealValue!: number;
  public disableDetail: boolean = true;
  public fetchStatus: boolean = true;

  constructor(private fb: FormBuilder,
    private masterService: MastersService,
    private loader: NgxUiLoaderService,
    protected router: Router,
    private projectService: ProjectsService,
    private utlService: UtilitiesService,
    public dialog: MatDialog, private datePipe: DatePipe) {
    this.pltSaleForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.pltSaleCls = new plotSaleClass();
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      venture: ['', [Validators.required, Validators.maxLength(50)]],
      plot: ['', [Validators.required, Validators.maxLength(50)]],
      tranNo: ['', [Validators.maxLength(18)]],
      customer: ['', [Validators.required, Validators.maxLength(50)]],
      tranDate: ['', [Validators.required]],
      dealDate: ['', [Validators.required]],

      tokenAmount: ['', [Validators.required]],
      saleDate: ['', [Validators.required]],
      regnDate: ['', [Validators.required]],
      remarks: ['', [Validators.maxLength(255)]],
      mode: ['View']
    })
  }

  ngOnInit(): void {
    this.loadData();
    this.pltSaleForm.get('venture')!.disable();
    this.pltSaleForm.get('plot')!.disable();
  }
  loadData() {
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    const body = {
      company: this.userData.company,
      location: this.userData.location,
      user: this.userData.userID,
      item: 'ST802',
      refNo: this.userData.sessionID
    };

    try {
      this.loader.start();
      const modes$ = this.masterService.getModesList(body);

      this.subSink.sink = forkJoin([modes$]).subscribe(
        ([modesRes, ventRes]: any) => {
          this.loader.stop();
          this.modes = modesRes['data'];
        },
        error => {
          // Handle error
          console.error(error);
        }
      );

    } catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  modeChange(event: string) {
    if (event === "Add") {
      // this.disableDetail = true;
      if (this.fetchStatus) {
        this.disableDetail = true;
      } else {
        this.disableDetail = false;
      }

      this.reset();
      this.pltSaleForm.controls['mode'].setValue(event);
      this.pltSaleForm.get('tranNo')!.setValue('');
      this.pltSaleForm.get('tranNo')!.disable();
      this.pltSaleForm.get('tranNo')!.clearValidators();

      this.pltSaleForm.get('venture')!.enable();
      this.pltSaleForm.get('plot')!.enable();

    }
    else {
      this.pltSaleForm.get('tranNo')!.enable();
      this.pltSaleForm.get('venture')!.disable();
      this.pltSaleForm.get('plot')!.disable();

    }
  }

  reset() {
    this.pltSaleForm.reset()

  }

  handleVentureChange() {
    this.onVentureSearch();
  }

  onVentureSearch() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "VENTURE",
      Item: this.pltSaleForm.controls['venture'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    //console.log(body);
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.pltSaleForm.controls['venture'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'project': this.pltSaleForm.controls['venture'].value, 'type': "VENTURE",
                  'search': 'Venture Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                // //console.log(result);
                this.ventureCode = result.itemCode;
                this.pltSaleForm.controls['venture'].setValue(result.itemName);
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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  handlePlotChange() {
    this.onPlotSearch();
  }

  onPlotSearch() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "PLOT",
      item: this.ventureCode,
      ItemFirstLevel: this.pltSaleForm.controls['plot'].value || '',
      ItemSecondLevel: "",
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.pltSaleForm.controls['plot'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'search': 'Plot Search',
                  'type': "PLOT",
                  'project': this.pltSaleForm.controls['venture'].value,
                  'plot': this.pltSaleForm.controls['plot'].value
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                //console.log(result);
                this.plotNo = result.itemCode;
                this.pltSaleForm.controls['plot'].setValue(result.itemName);
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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  handleCustomerChange() {
    this.onCustomerSearch();
  }

  onCustomerSearch() {
    const body = {
      Company: this.userData.company,
      Location: this.userData.location,
      Type: "CUSTOMER",
      PartyName: this.pltSaleForm.controls['customer'].value || "",
      User: this.userData.userID,
      refNo: this.userData.sessionID
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: any) => {
        // //console.log(res.data.selName);
        if (res.status != "fail") {
          if (res.data.nameCount === 1) {
            this.pltSaleForm.controls['customer'].patchValue(res.data.selName);
          }
          else {
            // //console.log(name);
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.pltSaleForm.controls['customer'].value || "", 'PartyType': "CUSTOMER",
                  'search': 'Customer Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                //console.log(result);
                this.pltSaleForm.controls['customer'].setValue(result.partyName);
                this.customerCode = result.code;
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
      this.retMessage = "Exception " + ex;
      this.textMessageClass = 'red';
    }
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  onTranNoFocusOut() {
    this.searchData();
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  searchData() {
    try {
      // Get the current date
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        Company: this.userData.company,
        Location: this.userData.location,
        TranType: 'PLOTSALE',
        TranNo: this.pltSaleForm.controls['tranNo'].value,
        Party: "",
        FromDate: formattedFirstDayOfMonth,
        ToDate: formattedCurrentDate,
        TranStatus: "ANY",
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
      this.subSink.sink = this.projectService.GetTranCount(body).subscribe((res: any) => {
        if (res.status != "fail") {
          if (res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.masterParams.langId = this.userData.langId;;
            this.masterParams.company = this.userData.company;
            this.masterParams.location = this.userData.location;
            this.masterParams.user = this.userData.userID;
            this.masterParams.refNo = this.userData.sessionID;
            this.plotSaleData(this.masterParams);
          }
          else {
            this.tranStatus = '';
            this.retMessage = '';

            this.pltSaleForm.controls['tranDate'].setValue('');

            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                height: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.pltSaleForm.controls['tranNo'].value, 'TranType': "PLOTSALE",
                  'search': 'Plot Sale Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result) {
                  this.masterParams.tranNo = result;
                  this.masterParams.langId = this.userData.langId;;
                  this.masterParams.company = this.userData.company;
                  this.masterParams.location = this.userData.location;
                  this.masterParams.user = this.userData.userID;
                  this.masterParams.refNo = this.userData.sessionID;
                  try {
                    this.plotSaleData(this.masterParams);
                  }
                  catch (ex: any) {
                    this.retMessage = ex;
                    this.textMessageClass = 'red';
                  }
                }

              });
            }

          }
        }
        else {
          // this.tranStatus = '';
          // this.retMessage = '';
          // this.receivedOn = "";
          // this.receivedBy = "";
          // this.issuedOn = "";
          // this.issuedBy = "";
          // this.approvedOn = "";
          // this.approvedBy = "";
          // this.fetchStatus = true;
          // this.disableDetail = true;
          // this.purReqHdrForm.controls['tranDate'].setValue(new Date());
          // this.purReqHdrForm.controls['purpose'].setValue('');
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }
  }

  plotSaleData(masterParams: MasterParams) {
    this.loader.start();
    try {
      this.subSink.sink = this.projectService.GetPlotSales(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          //console.log(res);
          this.tranStatus = res['data'].tranStatus;
          this.pltSaleForm.controls['tranNo'].setValue(res['data'].tranNo);
          this.ventureCode = res['data'].ventureCode;
          this.pltSaleForm.controls['venture'].setValue(res['data'].venture);
          this.plotNo = res['data'].plotNo;
          this.pltSaleForm.controls['plot'].setValue(res['data'].plotName);
          this.pltSaleForm.controls['customer'].setValue(res['data'].customerName);
          this.customerCode = res['data'].customer;
          this.pltSaleForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.pltSaleForm.controls['dealDate'].setValue(res['data'].dealDate);
          this.dealValue = res['data'].dealValue;
          this.pltSaleForm.controls['tokenAmount'].setValue(res['data'].tokenAmount);
          this.pltSaleForm.controls['saleDate'].setValue(res['data'].saleDate);
          this.pltSaleForm.controls['regnDate'].setValue(res['data'].regnDate);
          this.pltSaleForm.controls['tranStatus'].setValue(res['data'].tranStatus);
          this.pltSaleForm.controls['remarks'].setValue(res['data'].remarks);

          this.textMessageClass = 'green';
          this.retMessage =
            'Retriving data ' + res.message + ' has completed';
          this.disableDetail = false;
          this.fetchStatus = false;
        }
        else {
          this.textMessageClass = 'red';
          this.retMessage = res.message;
          this.disableDetail = true;
          this.fetchStatus = true;
          // this.purReqHdrForm.reset();
          this.reset();
        }
      });
    }
    catch (ex: any) {
      this.textMessageClass = 'red';
      this.retMessage = ex;
    }
  }

  onSubmit() {
    if (this.pltSaleForm.invalid) {
      return;
    }
    else {
      this.pltSaleCls.company = this.userData.company;
      this.pltSaleCls.location = this.userData.location;
      this.pltSaleCls.langId = 1;
      this.pltSaleCls.user = this.userData.userID;
      this.pltSaleCls.refNo = this.userData.sessionID;
      this.pltSaleCls.mode = this.pltSaleForm.controls['mode'].value;

      this.pltSaleCls.tranNo = this.pltSaleForm.controls['tranNo'].value;
      this.pltSaleCls.tranDate = this.pltSaleForm.controls['tranDate'].value;
      this.pltSaleCls.ventureCode = this.ventureCode;
      this.pltSaleCls.plotNo = this.plotNo;
      this.pltSaleCls.customer = this.customerCode;
      this.pltSaleCls.dealDate = this.pltSaleForm.controls['dealDate'].value;
      this.pltSaleCls.saleDate = this.pltSaleForm.controls['saleDate'].value;
      this.pltSaleCls.regnDate = this.pltSaleForm.controls['regnDate'].value;
      this.pltSaleCls.dealValue = 0;
      // this.pltSaleCls.dealValue = this.pltSaleForm.controls['dealValue'].value;
      this.pltSaleCls.tokenAmount = this.pltSaleForm.controls['tokenAmount'].value;
      this.pltSaleCls.remarks = this.pltSaleForm.controls['remarks'].value;
      this.pltSaleCls.tranStatus = this.tranStatus;
      //console.log(this.pltSaleCls);

      try {
        this.loader.start();
        this.subSink.sink = this.projectService.updatePlotSales(this.pltSaleCls).subscribe((res: any) => {
          this.loader.stop();
          //console.log(res);
          if (res.retVal > 100 && res.retVal < 200) {
            if (res.retVal == 101) {
              this.pltSaleForm.controls['mode'].setValue('View');
              this.pltSaleForm.get('tranNo')!.enable();
              this.pltSaleForm.controls['tranNo'].setValue(res['data'].tranNoNew);
            }
            this.retMessage = res.message;
            this.textMessageClass = "green";
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = "red";
          }
        });
      } catch (ex: any) {
        this.retMessage = ex;
        this.textMessageClass = "red";
      }
    }
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {

        ScrId: "ST802",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userData.userID,
        RefNo: this.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      height: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.pltSaleForm.controls['mode'].value,
        'note': this.pltSaleForm.controls['remarks'].value,
        'TranType': "PLOTSALE",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Plot Sale Notes"
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "PLOTSALE",
        'tranNo': tranNo,
        'search': 'Plot Sales Log Details'
      }
    });
  }



}
