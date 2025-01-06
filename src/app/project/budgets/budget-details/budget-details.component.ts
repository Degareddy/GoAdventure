import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { SubSink } from 'subsink';
import { BudgetDetailsCls } from '../../Project.class';
import { ProjectsService } from 'src/app/Services/projects.service';
import { MastersService } from 'src/app/Services/masters.service';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { DatePipe } from '@angular/common';
import { BudgetSubDetailsComponent } from '../budget-sub-details/budget-sub-details.component';
interface params {
  itemCode: string
  itemName: string
}

@Component({
  selector: 'app-budget-details',
  templateUrl: './budget-details.component.html',
  styleUrls: ['./budget-details.component.css']
})

export class BudgetDetailsComponent implements OnInit, OnDestroy {
  dataFlag: boolean = false;
  workTypes: Item[] = [];
  masterParams!: MasterParams;
  retMessage: string = "";
  newMessage: string = "";
  textMessageClass: string = "";
  bgtDetForm!: FormGroup;
  slNum: number = 0;
  mode: string = "";
  private subSink!: SubSink;
  selectedRowIndex: number = -1;
  supplierlist: Item[] = [];
  UOMList: Item[] = [];
  groupList: Item[] = [];
  wareHouseList: Item[] = [];
  modes: Item[] = [];
  productList: Item[] = [];
  status!: string
  bgtDetCls!: BudgetDetailsCls;
  slValue: boolean = false;
  actualAmt!: number;
  diffAmt!: number;
  actCmplDate!: Date;
  diffDays!: number;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  dataModified: boolean = false;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "workTypeName", headerName: "Work", sortable: true, filter: true, resizable: true, flex: 1 },
  {
    field: "schStartDate", headerName: "Start Date", sortable: true, filter: true, resizable: true, width: 130, valueFormatter: function (params: any) {
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
    field: "schEndDate", headerName: "End Date", sortable: true, filter: true, resizable: true, width: 130, valueFormatter: function (params: any) {
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
    field: "budgetAmt", headerName: "Budget", sortable: true, filter: true, resizable: true, width: 130, type: 'rightAligned', cellStyle: { justifyContent: "flex-end" },
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
  { field: "notes", headerName: "Remarks", sortable: true, resizable: true, flex: 1 },
  {
    field: "details",
    headerName: "Sub Tasks",
    width: 100,
    cellRenderer: (params: any) => {
      const button = document.createElement('button');;
      button.innerText = 'Sub Tasks';
      button.style.fontSize = "10px";
      button.style.fontWeight = "600";
      button.style.color = "white";
      button.style.border = "1 solid";
      button.style.backgroundColor = "green"
      // if (params.data.f_reconciliation_flag === 'N') {
      //   button.disabled = true;
      //   button.style.color = "green";
      // } else {
      //   button.disabled = false;
      //   button.style.color = "white"; // set font color to white
      //   button.style.backgroundColor = "red"; // set background color to red
      // }
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const rowData = params.data;
        const rowIndex = params.rowIndex;
        this.onDetailsClicked(rowData, rowIndex);
      });
      const cell = document.createElement('div');
      cell.appendChild(button);
      cell.style.cursor = "pointer";
      return cell;
    },
    editable: false
  },
  ];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';

  constructor(protected projService: ProjectsService,
    private fb: FormBuilder, private datePipe: DatePipe,
    private loader: NgxUiLoaderService, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    private mastService: MastersService) {
    this.masterParams = new MasterParams();
    this.bgtDetForm = this.formInit();
    this.subSink = new SubSink();
    this.bgtDetCls = new BudgetDetailsCls();
  }

  formInit() {
    return this.fb.group({
      workTypeName: ['', [Validators.required, Validators.maxLength(50)]],
      budgetAmt: ['0.00', [Validators.required]],
      startDate: [new Date()],
      endDate: [new Date()],
      remarks: ['']
    });
  }
  onDetailsClicked(rowData: any, rowIndex: number) {
    const dialogRef: MatDialogRef<BudgetSubDetailsComponent> = this.dialog.open(BudgetSubDetailsComponent, {
      width: '60%',
      disableClose: true,
      data: {
        tranNo: this.data.tranNo, mode: this.data.mode, workType: rowData.workTypeCode
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.isAltered) {
        this.dataModified = true;
        this.getBudgetDetails(this.data.tranNo, this.data.mode)
      }
      else {
        this.dataModified = false;
      }
    });
  }
  ngOnInit(): void {

    this.mode = this.data.mode;
    this.status = this.data.status;
    this.masterParams.langId = this.userDataService.userData.langId;;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    if (this.data.tranNo != "") {
      this.getBudgetDetails(this.data, this.data.mode);
    }
  }

  getBudgetDetails(data: any, mode: string) {
    if (data.tranNo) {
      this.masterParams.tranNo = data.tranNo;
    }
    else {
      this.masterParams.tranNo = data;
    }

    try {
      this.loader.start();
      this.subSink.sink = this.projService.getBudgetDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != 'FAIL') {
          this.rowData = res.data;

        } else {
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

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  displayProduct(item: params): string {
    return item && item.itemName ? item.itemName : '';
  }

  displaySupplier(item: any): string {
    return item ? item.itemName : '';
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
    const workbody: getPayload = {
      ...this.commonParams(),
      item: "WRKMAIN",
      mode:this.data.mode
    };
    try {
      const wtypes$ = this.mastService.GetMasterItemsList(workbody);
      this.subSink.sink = forkJoin([wtypes$]).subscribe(
        ([wtRes]: any) => {
          this.workTypes = wtRes['data'];
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
  prepareCls() {
    this.bgtDetCls.company = this.userDataService.userData.company;
    this.bgtDetCls.location = this.userDataService.userData.location;
    this.bgtDetCls.langId = this.userDataService.userData.langId;
    this.bgtDetCls.user = this.userDataService.userData.userID;
    this.bgtDetCls.refNo = this.userDataService.userData.sessionID;
    this.bgtDetCls.mode = this.mode;
    this.bgtDetCls.slNo = this.slNum || 0;
    this.bgtDetCls.tranNo = this.masterParams.tranNo;
    this.bgtDetCls.workTypeCode = this.bgtDetForm.get('workTypeName')!.value;
    this.bgtDetCls.workTypeName = this.bgtDetForm.get('workTypeName')!.value;
    this.bgtDetCls.budgetAmt = parseFloat(this.bgtDetForm.get('budgetAmt')!.value.replace(/,/g, ''));
    const transformedDate = this.datePipe.transform(this.bgtDetForm.get('startDate')!.value, 'yyyy-MM-dd');
    if (transformedDate !== undefined && transformedDate !== null) {
      this.bgtDetCls.SchStartDate = transformedDate.toString();
    } else {
      this.bgtDetCls.SchStartDate = ''; // or any default value you prefer
    }
    const transformedendDate = this.datePipe.transform(this.bgtDetForm.get('endDate')!.value, 'yyyy-MM-dd');
    if (transformedendDate !== undefined && transformedendDate !== null) {
      this.bgtDetCls.SchEndDate = transformedendDate.toString();
    } else {
      this.bgtDetCls.SchEndDate = ''; // or any default value you prefer
    }
    this.bgtDetCls.notes = this.bgtDetForm.get('remarks')!.value;
  }
  onSubmit() {
    this.prepareCls();
    this.loader.start();
    try {
      this.subSink.sink = this.projService.UpdateBudgetDetails(this.bgtDetCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.dataModified = true;
          this.retMessage = res.message;
          this.textMessageClass = 'green';
          this.getBudgetDetails(res.tranNoNew, this.data.mode);
        }
        else {
          this.retMessage = res.message;
          this.textMessageClass = "red";
        }

      });
    }
    catch (ex: any) {
      this.retMessage = ex.message;
      this.textMessageClass = "red";
    }

  }

  onProductFocusOut() {
    // this.searchProduct();
  }

  onRowClick(row: any) {
    this.bgtDetForm.patchValue({
      workTypeName: row.workTypeCode,
      budgetAmt: row.budgetAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      startDate: row.schStartDate,
      endDate: row.schEndDate,
      remarks: row.notes
    });
    this.slNum = row.slNo;
    this.actualAmt = row.actualAmt;
    this.diffAmt = row.diffAmt;
    this.actCmplDate = row.actCmplDate;
    this.diffDays = row.diffDays;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.onRowClick(event.data);
  }
  addBudget() {
    this.bgtDetForm.reset();
    this.bgtDetForm = this.formInit();
    this.slNum = 0;
    this.slValue = true;
    this.textMessageClass = "";
    this.retMessage = "";
  }

  // searchWorkType() {
  //   const body = {
  //     ...this.commonParams(),
  //     PartyType: "WORKTYPE",
  //     PartyName: this.bgtDetForm.controls['workType'].value
  //   }
  //   this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
  //     if (res.retVal === 0) {
  //       if (res && res.data && res.data.nameCount === 1) {
  //         this.bgtDetCls.workTypeName = res.data.selName;
  //         this.bgtDetCls.workTypeCode = res.data.selCode;
  //       }
  //       else {
  //         const dialogRef: MatDialogRef<SearchProductComponent> = this.dialog.open(SearchProductComponent, {
  //           width: '90%',
  //           disableClose: true,
  //           data: {
  //             'tranNum': this.bgtDetForm.controls['workName'].value, 'TranType': "PRODUCT",
  //             'search': 'Product Search'
  //           }
  //         });
  //         dialogRef.afterClosed().subscribe(result => {
  //           // this.bgtDetForm.controls['worktypeName'].setValue(result.prodName);
  //           this.bgtDetCls.workTypeCode = result.prodCode;
  //         });
  //       }
  //     }
  //     else {
  //       this.retMessage = res.message;
  //       this.textMessageClass = "red";
  //     }
  //   });
  // }
}
