import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service';
import { InventoryService } from 'src/app/Services/inventory.service';
import { forkJoin } from 'rxjs';
import { PayrollService } from 'src/app/Services/payroll.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { DatePipe } from '@angular/common';
import { SubSink } from 'subsink';
import { BonusClass } from '../payroll.class';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
@Component({
  selector: 'app-bonus-types',
  templateUrl: './bonus-types.component.html',
  styleUrls: ['./bonus-types.component.css']
})

export class BonusTypesComponent implements OnInit, OnDestroy {
  masterParams!: MasterParams;
  title: string = "Bonus Types"
  modes: Item[] = [];
  selectedObjects!: any[];
  bonusTypeForm!: FormGroup;
  bonusCode!: string;
  textMessageClass: string = "";
  retMessage: string = "";
  newTranMessage: string = "";
  itemStatus!: string;
  bonusTypes: Item[] = [];
  private subSink: SubSink;
  bonusTypeCls!: BonusClass;
  bonusTypeCode!: string;
  @Input() max: any;
  tomorrow = new Date();
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
    protected router: Router, private userDataService: UserDataService,
    private invService: InventoryService,
    private payService: PayrollService,
    private masterService: MastersService,
    public dialog: MatDialog,
    private loader: NgxUiLoaderService,
    private fb: FormBuilder,
    private datePipe: DatePipe) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.bonusTypeCls = new BonusClass();
    this.bonusTypeForm = this.formInit();
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
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
    this.gridApi.sizeColumnsToFit();
  }
  onRowSelected(event: any) {
   
    this.bonusTypeForm.get('bonusTypes')?.setValue(event.data.bonusCode);
  
    this.bonusTypeForm.patchValue({
      bonusCode: event.data.bonusCode,
      bonusName: event.data.bonusName,
      bonusType: event.data.bonusType,
      tranDate: new Date(event.data.tranDate), 
      notes: event.data.notes
    });
    
    this.itemStatus = event.data.itemStatus;
    
    this.textMessageClass = 'green';
    this.retMessage = "Bonus type data loaded for " + event.data.bonusName;
  }

  formInit() {
    return this.fb.group({
      bonusTypes: [''],
      bonusCode: ['', [Validators.required, Validators.maxLength(20)]],
      bonusName: ['', [Validators.required, Validators.maxLength(50)]],
      bonusType: ['', [Validators.required, Validators.maxLength(50)]],
      tranDate: [new Date(), [Validators.required]],
      notes: [''],
      mode: ['View']
    });
  }

  loadData() {
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    const bonusTypes: getPayload = {
      ...this.commonParams(),
      item: "BONUSTYPES",
      mode:this.bonusTypeForm.get('mode')?.value
    };
    const requests = [
      this.invService.GetMasterItemsList(bonusTypes)
    ];
    this.subSink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.bonusTypes = results[0]['data'];
        // this.rowData = results[0]['data'];
        // console.log(results);
    
      },
      (error: any) => {
        this.textMessageClass = 'red';
        this.retMessage = error.message;

      }
    );
    const body: getPayload = {
      ...this.commonParams(),
      item: 'SM603'
    };
    try {
      this.masterService.getModesList(body).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.modes = res['data'];
        }
      });
    }

    catch (ex: any) {
      //console.log(ex);
      this.textMessageClass = 'red';
      this.retMessage = ex.message;
    }
  }

  loadGridData(){
    const bonusTypes: getPayload = {
      ...this.commonParams(),
      item: "BONUSTYPES",
      mode:this.bonusTypeForm.get('mode')?.value
    };
    const requests = [
      this.payService.getBonusTypesList(bonusTypes)
    ];
    this.subSink.sink = forkJoin(requests).subscribe(
      (results: any[]) => {
        this.rowData = results[0]['data'];
      },
      (error: any) => {
        this.textMessageClass = 'red';
        this.retMessage = error.message;
      }
    );
  }
  ngOnInit(): void {
    this.bonusTypeForm =  this.formInit();
    this.loadData();
    this.loadGridData();

  }

  getBonusTypeChange(event: any) {
    // console.log(event);
    this.bonusTypeCode = event.value;
    this.getBonusData(event.value, this.bonusTypeForm.get('mode')?.value);
  }

  getBonusData(bonusCode: string, mode: string) {
    const bonusTypes: getPayload = {
      ...this.commonParams(),
      item: bonusCode,

    };

    try {
      this.loader.start();
      this.subSink.sink = this.payService.GetBonusTypes(bonusTypes).subscribe((res: any) => {
        this.loader.stop();
        // console.log(res.data)
        if (res.status.toUpperCase() === "SUCCESS") {
        this.bonusTypeForm.patchValue({
          bonusCode:res.data.bonusCode,
          bonusName:res.data.bonusName,
          bonusType:res.data.bonusType,
          tranDate:res.data.tranDate,
          // itemStatus:res.data.itemStatus,
          notes:res.data.notes
        })
        this.itemStatus = res['data'].itemStatus;
          if (mode != 'View' && this.newTranMessage != "") {
            this.textMessageClass = 'green';
            this.retMessage = this.newTranMessage;
          }
          else {
            this.textMessageClass = 'green';
            this.retMessage = "Bonus type data is retrieved successfully for " + res['data'].bonusName;
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
    }
  }
  // getBonusData(bonusCode: string, mode: string) {
  //   this.masterParams.item = bonusCode;
  //   this.masterParams.tranType = "BONUSTYPES";
  //   try {
  //     this.loader.start();
  //     this.subSink.sink = this.payService.GetBonusTypes(this.masterParams).subscribe((res: any) => {
  //       this.loader.stop();
  //       if (res.status.toUpperCase() === "SUCCESS") {
  //         this.bonusTypeForm.controls['bonusCode'].patchValue(res['data'].bonusCode);
  //         this.bonusTypeForm.controls['bonusName'].patchValue(res['data'].bonusName);
  //         this.bonusTypeForm.controls['bonusType'].patchValue(res['data'].bonusType);
  //         this.bonusTypeForm.controls['tranDate'].patchValue(res['data'].tranDate);
  //         this.itemStatus = res['data'].itemStatus;
  //         this.bonusTypeForm.controls['notes'].patchValue(res['data'].notes);
  //         if (mode != 'View' && this.newTranMessage != "") {
  //           this.textMessageClass = 'green';
  //           this.retMessage = this.newTranMessage;
  //         }
  //         else {
  //           this.textMessageClass = 'green';
  //           this.retMessage = "Bonus type data is retrieved successfully for " + res['data'].bonusName;
  //         }

  //       }
  //       else {
  //         this.textMessageClass = 'red';
  //         this.retMessage = res.message;
  //       }
  //     });
  //   }
  //   catch (ex: any) {
  //     this.textMessageClass = 'red';
  //     this.retMessage = ex.message;
  //   }
  // }

  clearMsg() {
    this.textMessageClass = "";
    this.retMessage = "";
  }

  prepareBonusCls() {
    this.bonusTypeCls.mode = this.bonusTypeForm.controls['mode'].value;
    this.bonusTypeCls.company = this.userDataService.userData.company;
    this.bonusTypeCls.location = this.userDataService.userData.location;
    this.bonusTypeCls.langId = this.userDataService.userData.langId;
    this.bonusTypeCls.bonusTypes = this.bonusTypeForm.controls['bonusTypes'].value;
    this.bonusTypeCls.bonusCode = this.bonusTypeForm.controls['bonusCode'].value;
    this.bonusTypeCls.bonusName = this.bonusTypeForm.controls['bonusName'].value;
    this.bonusTypeCls.bonusType = this.bonusTypeForm.controls['bonusType'].value;

    const transformedDate = this.datePipe.transform(this.bonusTypeForm.controls['tranDate'].value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.bonusTypeCls.tranDate = transformedDate.toString();
    } else {
      this.bonusTypeCls.tranDate = ''; // or any default value you prefer
    }
    this.bonusTypeCls.notes = this.bonusTypeForm.controls['notes'].value;
    this.bonusTypeCls.user = this.userDataService.userData.userID;
    this.bonusTypeCls.refNo = this.userDataService.userData.sessionID;
  }
  onSubmit() {
    this.clearMsg();
    if (this.bonusTypeForm.valid) {
      this.prepareBonusCls();
      try {
        this.loader.start();
        this.subSink.sink = this.payService.UpdateBonusTypes(this.bonusTypeCls).subscribe((res: SaveApiResponse) => {
          this.loader.stop();
          if (res.status.toUpperCase() === "SUCCESS") {
            this.newTranMessage = res.message;
            if (this.bonusTypeForm.get('mode')?.value === "Add") {
              this.modeChange('Modify');
              this.bonusTypes.push({ itemCode: this.bonusTypeForm.get('bonusCode')?.value, itemName: this.bonusTypeForm.get('bonusName')?.value });
            }
            this.getBonusData(this.bonusTypeForm.get('bonusCode')?.value, this.bonusTypeForm.get('mode')?.value);
            this.loadGridData();
            this.textMessageClass = 'green';
          } else {
            this.retMessage = res.message;
            this.textMessageClass = 'red';
          }
        });
      } catch (ex: any) {
        this.loader.stop();
        this.retMessage = ex.message;
        this.textMessageClass = 'red';
      }
    }
    else {
      this.retMessage = "Form Invalid!";
      this.textMessageClass = 'red';
    }
  }

  modeChange(event: string) {
    if (event === 'Add') {
      this.bonusTypeForm = this.formInit();
      this.bonusTypeForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bonusTypeForm.get('bonusTypes')!.disable();
      this.loadData();
    }
    else {
      this.bonusTypeForm.controls['mode'].patchValue(event, { emitEvent: false });
      this.bonusTypeForm.get('bonusTypes')!.enable();
    }
  }

  reset() {
    this.getBonusData(this.bonusTypeCode, this.bonusTypeForm.get('mode')?.value);
  }

  clear() {
    this.bonusTypeForm = this.formInit();
    // this.bonusTypeForm.reset();
    this.itemStatus = "";
    this.retMessage = "";
    this.textMessageClass = 'grey';
    // this.bonusTypeForm.controls['mode'].patchValue('View');
  }
  close() {
    this.router.navigateByUrl('/home');
  }


  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM603",
        Page: "Bonus Type",
        SlNo: 60,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }
}

