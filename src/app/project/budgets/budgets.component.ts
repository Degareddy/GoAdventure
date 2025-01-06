import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { ProjectsService } from 'src/app/Services/projects.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SubSink } from 'subsink';
import { SearchProjectComponent } from 'src/app/general/search-project/search-project.component';
import { BudgetCls } from '../Project.class';
import { SearchEngineComponent } from 'src/app/general/search-engine/search-engine.component';
import { BudgetDetailsComponent } from './budget-details/budget-details.component';
import { Router } from '@angular/router';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.css']
})

export class BudgetsComponent implements OnInit, OnDestroy {
  bgtForm !: FormGroup;
  isDisabled: boolean = false;
  bgtCls !: BudgetCls
  retMessage: string = "";
  textMessageClass: string = "";
  modes: Item[] = [];
  currencyList: Item[] = [];
  projectList: Item[] = [];
  private subSink: SubSink;
  masterParams!: MasterParams;
  dialogOpen = false;
  projType!: string;
  code!: string;
  @Input() max: any;
  tomorrow = new Date();
  budgetAmt: number = 0;
  actualAmt: number = 0;
  diffAmt: number = 0;
  schCmpldDate!: Date;
  actCmplDate!: Date;
  diffDays: number = 0;
  tranStatus: string = "";
  newTranMsg: string = "";
  constructor(private fb: FormBuilder, private masterService: MastersService,
    private projectService: ProjectsService, private userDataService: UserDataService,
    private datePipe: DatePipe,
    private loader: NgxUiLoaderService, protected route: Router,
    public dialog: MatDialog, private utlService: UtilitiesService) {
    this.bgtForm = this.formInit();
    this.subSink = new SubSink();
    this.masterParams = new MasterParams();
    this.bgtCls = new BudgetCls();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      projectType: ['', [Validators.required]],
      projectName: ['', [Validators.required]],
      tranNo: [''],
      tranDate: [new Date(), [Validators.required]],
      currency: ['', [Validators.required]],
      bugetAmount: [''],
      actualAmount: [''],
      scheduledDate: [],
      actualDate: [''],
      remarks: ['', [Validators.maxLength(256)]],
      mode: ['View'],
    });
  }

  ngOnInit(): void {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
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

  searchData() {
    try {
      // Get the current date
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const formattedFirstDayOfMonth = this.formatDate(firstDayOfMonth);
      const formattedCurrentDate = this.formatDate(currentDate);
      const body = {
        ...this.commonParams(),
        TranType: 'BUDGET',
        TranNo: this.bgtForm.controls['tranNo'].value,
        Party: "",
        FromDate: this.datePipe.transform(formattedFirstDayOfMonth, "yyyy-MM-dd"),
        ToDate: this.datePipe.transform(formattedCurrentDate, "yyyy-MM-dd"),
        TranStatus: "ANY"
      }
      this.subSink.sink = this.masterService.GetTranCount(body).subscribe((res: any) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.tranCount === 1) {
            this.masterParams.tranNo = res.data.selTranNo;
            this.bgtForm.get('tranNo')?.patchValue(res.data.selTranNo);
            this.getBudgetData(this.masterParams, this.bgtForm.get('mode')!.value);
          }
          else {
            this.tranStatus = '';
            this.retMessage = '';
            this.budgetAmt = 0;
            this.actualAmt = 0;
            this.schCmpldDate = new Date();
            this.actCmplDate = new Date();
            this.code = "";
            this.bgtForm.controls['tranDate'].patchValue(new Date());
            this.bgtForm.controls['projectName'].patchValue('');
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchEngineComponent> = this.dialog.open(SearchEngineComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.bgtForm.controls['tranNo'].value, 'TranType': "BUDGET",
                  'search': 'Budget Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                this.dialogOpen = false;
                if (result != true) {
                  this.masterParams.tranNo = result;
                  this.bgtForm.get('tranNo')?.patchValue(result);
                  this.getBudgetData(this.masterParams, this.bgtForm.get('mode')!.value);
                }

              });
            }

          }
        }
        else {
          this.tranStatus = '';
          this.retMessage = '';
          this.budgetAmt = 0;
          this.actualAmt = 0;
          this.schCmpldDate = new Date();
          this.actCmplDate = new Date();
          this.code = "";
          this.bgtForm.controls['tranDate'].patchValue(new Date());
          this.bgtForm.controls['projectName'].patchValue('');
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  getBudgetData(masterParams: MasterParams, mode: string) {
    try {
      this.loader.start();
      this.subSink.sink = this.projectService.getBudget(masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() == "SUCCESS") {
          this.tranStatus = res['data'].tranStatus;
          this.bgtForm.controls['tranNo'].patchValue(res['data'].tranNo);
          this.bgtForm.controls['tranDate'].patchValue(res['data'].tranDate);
          this.bgtForm.controls['projectType'].patchValue(res['data'].projectType);
          this.bgtForm.controls['projectName'].patchValue(res['data'].code);
          this.bgtForm.controls['currency'].patchValue(res['data'].currency);
          this.code = res['data'].code;
          this.budgetAmt = res['data'].budgetAmt;
          this.actualAmt = res['data'].actualAmt;
          this.diffAmt = res['data'].diffAmt;
          this.schCmpldDate = res['data'].schStartDate.startsWith('0001-01-01') ? '' : res['data'].schStartDate;;
          this.actCmplDate = res['data'].actEndDate.startsWith('0001-01-01') ? '' : res['data'].actEndDate;
          this.diffDays = res['data'].diffDays;
          this.textMessageClass = 'green';

          if (mode != "View" && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
          }
          else {
            this.retMessage = 'Retriving data ' + res.message + ' has completed';
          }
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
      this.loader.stop();
    }
  }

  typeChange(event: any) {
    this.projType = this.bgtForm.controls['projectType'].value;
    this.bgtForm.controls['projectName'].patchValue("", { emitEvent: false });
  }


  searchProject() {
    const body = {
      ...this.commonParams(),
      Type: this.bgtForm.controls['projectType'].value.toUpperCase(),
      Item: this.bgtForm.controls['projectName'].value || '',
      ItemFirstLevel: "",
      ItemSecondLevel: ""
    }
    try {
      this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.bgtForm.controls['projectName'].patchValue(res.data.selName);
            this.code = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchProjectComponent> = this.dialog.open(SearchProjectComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'project': this.bgtForm.controls['projectName'].value, 'type': this.bgtForm.controls['projectType'].value.toUpperCase(),
                  'search': this.bgtForm.controls['projectType'].value.toUpperCase() + ' Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.code = result.itemCode;
                  this.bgtForm.controls['projectName'].patchValue(result.itemName);
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

  loadData() {
    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'ST901'
    };
    const curbody: getPayload = {
      ...this.commonParams(),
      item: "CURRENCY",
      mode:this.bgtForm.get('mode')?.value
    };
    const venturebody: getPayload = {
      ...this.commonParams(),
      item: "VENTURE",
      mode:this.bgtForm.get('mode')?.value
    };
    try {
      const modes$ = this.masterService.getModesList(modebody);
      const currencies$ = this.masterService.GetMasterItemsList(curbody);
      const project$ = this.masterService.GetMasterItemsList(venturebody);
      this.subSink.sink = forkJoin([modes$, currencies$, project$]).subscribe(
        ([modesRes, curRes, projectRes]: any) => {
          this.modes = modesRes['data'];
          this.currencyList = curRes['data'];
          this.projectList = projectRes['data'];
          if (this.projectList.length === 1) {
            this.bgtForm.get('projectName')?.patchValue(this.projectList[0].itemCode)
          }
        },
        error => {
          this.retMessage = error.message;
          this.textMessageClass = 'red';
        }
      );
    } catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }
  }

  onDetailsCilcked(tranNo: any) {
    const dialogRef: MatDialogRef<BudgetDetailsComponent> = this.dialog.open(BudgetDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: { 'tranNo': tranNo, 'mode': this.bgtForm.controls['mode'].value, 'status': this.tranStatus }  // Pass any data you want to send to CustomerDetailsComponent
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        this.getBudgetData(this.masterParams, this.bgtForm.get('mode')!.value);
      }
    });
  }

  clear() {
    this.bgtForm = this.formInit();
    this.retMessage = '';
    this.tranStatus = '';
    this.textMessageClass = "";
    this.tranStatus = '';
    this.budgetAmt = 0;
    this.actualAmt = 0;
    this.diffAmt = 0;
    this.diffDays = 0;
    this.schCmpldDate = new Date();
    this.actCmplDate = new Date();
    this.code = "";
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.clear();
      this.bgtForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bgtForm.controls['tranNo'].disable({ onlySelf: false });
      this.loadData();
    } else {
      this.bgtForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bgtForm.controls['tranNo'].enable({ onlySelf: false });
    }
  }

  reset() {
    this.textMessageClass = '';
    this.retMessage = '';
  }

  clearMsg() {
    this.textMessageClass = '';
    this.retMessage = '';
  }

  Close() {
    this.route.navigateByUrl('/home');
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  onProjectFocusOut() {
    // this.searchData();
  }

  onSubmit() {
    this.clearMsg();
    if (this.bgtForm.invalid) {
      return;
    }
    else {
      this.bgtCls.company = this.userDataService.userData.company;
      this.bgtCls.location = this.userDataService.userData.location;
      this.bgtCls.langId = this.userDataService.userData.langId;
      this.bgtCls.mode = this.bgtForm.get('mode')!.value;
      this.bgtCls.user = this.userDataService.userData.userID;
      this.bgtCls.refNo = this.userDataService.userData.sessionID;


      const transformedDate = this.datePipe.transform(this.bgtForm.get('tranDate')!.value, 'yyyy-MM-dd');
      if (transformedDate !== undefined && transformedDate !== null) {
        this.bgtCls.tranDate = transformedDate.toString();
      } else {
        this.bgtCls.tranDate = ''; // or any default value you prefer
      }

      // this.bgtCls.tranDate = this.bgtForm.get('tranDate')!.value;
      this.bgtCls.tranNo = this.bgtForm.get('tranNo')!.value;
      this.bgtCls.currency = this.bgtForm.get('currency')!.value;
      this.bgtCls.projectType = this.bgtForm.get('projectType')!.value;
      this.bgtCls.projectName = this.bgtForm.get('projectName')!.value;
      this.bgtCls.remarks = this.bgtForm.get('remarks')!.value;
      this.bgtCls.code = this.bgtForm.get('projectName')!.value;
      try {
        this.loader.start();
        this.subSink.sink = this.projectService.updateBugetHdr(this.bgtCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.retVal > 100 && res.retVal < 200) {
            this.newTranMsg = res.message;
            if (this.bgtForm.get('mode')?.value === "Add") {
              this.modeChange("Modify")
            }
            this.bgtForm.get('tranNo')?.patchValue(res.tranNoNew);
            this.masterParams.tranNo = res.tranNoNew;
            this.getBudgetData(this.masterParams, this.bgtForm.get('mode')?.value)
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

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': this.bgtForm.controls['mode'].value,
        'note': this.bgtForm.controls['remarks'].value,
        'TranType': "BUGETS",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Bugets Notes"
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
        'tranType': "BUGETS",
        'tranNo': tranNo,
        'search': 'Bugets Log Details'
      }
    });
  }

  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {

        ScrId: "ST901",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}

