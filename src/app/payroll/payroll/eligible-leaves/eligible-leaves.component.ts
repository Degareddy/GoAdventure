import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { PayrollService } from 'src/app/Services/payroll.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DatePipe } from '@angular/common';
import { InventoryService } from 'src/app/Services/inventory.service';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { eligibleLeaves } from '../payroll.class';
import { EligibleDetailsComponent } from './eligible-details/eligible-details.component';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
@Component({
  selector: 'app-eligible-leaves',
  templateUrl: './eligible-leaves.component.html',
  styleUrls: ['./eligible-leaves.component.css']
})
export class EligibleLeavesComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  modes: Item[] = [];
  eligibleLeavesForm!: FormGroup;
  textMessageClass: string = "";
  retMessage: string = "";
  newTranMsg: string = "";
  status: string = ""
  newTranMessage: string = "";
  tranStatus: string = "";
  yearNum: Item[] = []
  @Input() max: any;
  tomorrow = new Date();
  private elgCls: eligibleLeaves = new eligibleLeaves();
  private subsink: SubSink = new SubSink();
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [
    // { field: "itemCode", headerName: "Bonus Code", sortable: true, filter: true, resizable: true, flex: 2,autoHeight:true,cellStyle:{whitespace:'normal'},suppressSizeToFit:true},
    { field: "bonusCode", headerName: "Bonus Code", sortable: true, filter: true, resizable: true, flex: 1},
    { field: "bonusName", headerName: "Bonus Name", sortable: true, filter: true, resizable: true, flex: 1},
    { field: "bonusType", headerName: "Bonus Type", sortable: true, filter: true, resizable: true, flex: 1},
    { field: "tranDate", headerName: "Date",valueFormatter:(params:any)=>{ return this.datePipe.transform(params.value)} ,sortable: true, filter: true, resizable: true, flex: 1},
    { field: "itemStatus", headerName: "Bonus Status", sortable: true, filter: true, resizable: true, flex: 1},
  ];

  constructor(protected route: ActivatedRoute,
    protected router: Router,
    private masterService: MastersService,
    private fb: FormBuilder, public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private payService: PayrollService,
    private userDataService: UserDataService,
    private datePipe: DatePipe) {
    this.masterParams = new MasterParams();
    this.eligibleLeavesForm = this.formInit();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }
  formInit() {
    return this.fb.group({
      yearNo: [''],
      fromDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      notes: [''],
      mode: ['View'],
      tranDate: [new Date()]
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
  onGridReady(params: any) {
    this.gridApi.sizeColumnsToFit();
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  onRowSelected(event: any) {
    this.getEligibleLeaves(event.data.bonusCode,"View");
  }
  ngOnInit(): void {
    this.loadData();
    this.loadGridData();
  }
  loadGridData(){
    const data: getPayload = {
      ...this.commonParams(),
      item: "FINYEAR",
      mode:this.eligibleLeavesForm.get('mode')?.value
    };
    const requests = [
      this.payService.GetEligibleLeaveTypesList(data)
    ];
    this.subsink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.rowData = results[0]['data'];
      },
      (error: any) => {
        this.textMessageClass = 'red';
        this.retMessage = error.message;
      }
    );
  }
  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;

    const modebody: getPayload = {
      ...this.commonParams(),
      item: 'SM604',
    };
    const yearBody: getPayload = {
      ...this.commonParams(),
      item: "FINYEAR",
      mode: this.eligibleLeavesForm.get('mode')?.value
    };

    try {
      this.loader.start();
      const service1 = this.masterService.getModesList(modebody);
      const service2 = this.masterService.GetMasterItemsList(yearBody);
      this.subsink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          const res2 = results[1];
          this.modes = res1.data;
          this.yearNum = res2.data;
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
  prepareCls() {
    this.elgCls.company = this.userDataService.userData.company;
    this.elgCls.location = this.userDataService.userData.location;
    this.elgCls.refNo = this.userDataService.userData.sessionID;
    this.elgCls.user = this.userDataService.userData.userID;

    this.elgCls.mode = this.eligibleLeavesForm.get('mode')?.value;

    const transformedDate = this.datePipe.transform(this.eligibleLeavesForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.elgCls.tranDate = transformedDate.toString();
    } else {
      this.elgCls.tranDate = ''; // or any default value you prefer
    }

    const fromDate = this.datePipe.transform(this.eligibleLeavesForm.controls['fromDate'].value, 'yyyy-MM-dd');
    if (fromDate !== undefined && fromDate !== null) {
      this.elgCls.fromDate = fromDate.toString();
    } else {
      this.elgCls.fromDate = ''; // or any default value you prefer
    }
    const toDate = this.datePipe.transform(this.eligibleLeavesForm.controls['toDate'].value, 'yyyy-MM-dd');
    if (toDate !== undefined && toDate !== null) {
      this.elgCls.toDate = toDate.toString();
    } else {
      this.elgCls.toDate = ''; // or any default value you prefer
    }
    // this.elgCls.fromDate = this.eligibleLeavesForm.get('fromDate')?.value;
    // this.elgCls.toDate = this.eligibleLeavesForm.get('toDate')?.value;
    // this.elgCls.tranDate = this.eligibleLeavesForm.get('tranDate')?.value;

    this.elgCls.yearNo = this.eligibleLeavesForm.get('yearNo')?.value;
    this.elgCls.notes = this.eligibleLeavesForm.get('notes')?.value;
    // this.elgCls.company = this.userDataService.userData.company;
  }
  onSubmit() {
    this.clearMsg();
    if (this.eligibleLeavesForm.invalid) {
      return;
    }
    else {
      this.prepareCls()
      this.loader.start();
      this.subsink.sink = this.payService.UpdateEligibleLeaves(this.elgCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.newTranMessage = res.message;
          if (this.eligibleLeavesForm.get('mode')?.value === "Add") {
            this.modeChanged('Modify');
          }
          this.retMessage = res.message;
          this.textMessageClass = "green";
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }
      })
    }
  }
  searchData() {
    this.masterParams.tranNo = this.eligibleLeavesForm.controls['tranNo'].value;

    try {
      this.loader.start();
      this.subsink.sink = this.payService.GetEligibleLeaves(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.eligibleLeavesForm.controls['tranDate'].setValue(res['data'].tranDate);
          this.eligibleLeavesForm.controls['notes'].setValue(res['data'].notes);
          //this.eligibleLeavesForm.controls['department'].setValue(res['data'].department);
          //this.eligibleLeavesForm.controls['tranStatus'].setValue(res['data'].tranStatus);
          this.tranStatus = res['data'].tranStatus;
          this.eligibleLeavesForm.controls['mode'].setValue('View');
          this.textMessageClass = 'green';
          this.retMessage =
            'Retriving data ' + res.message + ' has completed';
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
  clearMsg() {
    this.retMessage = "";
    this.textMessageClass = "";
  }
  reset() {
    this.eligibleLeavesForm = this.formInit();
    this.tranStatus = '';
    this.clearMsg();
  }
  // yearChanged(event: any) {
  //   // console.log(event.value);
  //   if (this.eligibleLeavesForm.get('mode')?.value != "Add") {
  //     const body: any = {
  //       ...this.commonParams(),
  //       item: event.value
  //     };
  //     this.subsink.sink = this.masterService.getSpecificMasterItemDetails(body).subscribe((res: any) => {
  //       if (res.status.toUpperCase() === "SUCCESS") {
  //         console.log(res);

  //       }
  //       else {
  //         this.retMessage = res.message;
  //         this.textMessageClass = "red";
  //       }
  //     });
  //   }

  // }
  modeChanged(event: string) {
    if (event.toUpperCase() === "ADD") {
      this.eligibleLeavesForm = this.formInit();
      this.clearMsg();
      this.tranStatus = "";
      this.eligibleLeavesForm.get('mode')?.patchValue(event, { emitEvent: false });
      this.loadData();
    }
    else {
      this.eligibleLeavesForm.get('mode')?.patchValue(event, { emitEvent: false });
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM613",
        Page: "Annual ELigible Leaves",
        SlNo: 76,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });

  }

  yearChanged(event: any) {
    this.getEligibleLeaves(event.value, this.eligibleLeavesForm.get('mode')?.value);
  }

  getEligibleLeaves(leaveCode: string, mode: string) {
    const body: getPayload = {
      ...this.commonParams(),
      item: leaveCode,
    };
    try {
      this.loader.start();
      this.subsink.sink = this.payService.GetEligibleLeaves(body).subscribe((res: any) => {
        this.loader.stop();
        console.log(res.data);
        if (res.status.toUpperCase() === "SUCCESS") {
          this.status = res['data'].typeStatus;
          this.eligibleLeavesForm.patchValue({
            tranDate: res.data.tranDate,
            fromDate: res.data.fromDate,
            toDate: res.data.toDate,
            notes: res.data.notes
          });
          if (mode != 'View' && this.newTranMsg != "") {
            this.retMessage = this.newTranMsg;
            this.textMessageClass = 'green';
          }
          else {
            this.retMessage = res.message;
            this.textMessageClass = 'green';
          }

        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = 'red';
        }
      })

    } catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex.message;
      this.textMessageClass = 'red';
    }

  }

  onDetailsCilcked() {
    const dialogRef: MatDialogRef<EligibleDetailsComponent> = this.dialog.open(EligibleDetailsComponent, {
      width: '90%',
      disableClose: true,
      data: {
        search: "Eligible Details",
        mode: this.eligibleLeavesForm.get('mode')!.value, status: this.tranStatus,
        yearNo: this.eligibleLeavesForm.get('yearNo')!.value,

      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered === true) {
        // this.saleData(this.masterParams, this.saleForm.get('mode')?.value);
      }
    });

  }
  Close(){
    this.router.navigateByUrl('/home');

  }
}
