import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, forkJoin } from 'rxjs';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { unitCharges } from '../Project.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProjectsService } from 'src/app/Services/projects.service';
import { MasterParams } from 'src/app/modals/masters.modal';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions, RowClassRules } from 'ag-grid-community';
import { DatePipe } from '@angular/common';
import { AppHelpComponent } from 'src/app/layouts/app-help/app-help.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { NotesComponent } from 'src/app/general/notes/notes.component';
import { LogComponent } from 'src/app/general/log/log.component';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/general/confirm-dialog/confirm-dialog.component';

interface UnitCharge {
  company: string;
  location: string;
  langId: number;
  chargeType: string;
  bedroomCount: number;
  amount: number;
  vatRate: string;
  revenueTo: string;
  isRecurring: boolean;
  isRefundable: boolean;
  user: string;
  refNo: string;
  applyForAll: boolean
  nextReviewOn: Date
  reviewedOn: Date
  blockCode: string
  propCode: string
  notes: string;
  plexType:string
}

@Component({
  selector: 'app-unit-charges',
  templateUrl: './unit-charges.component.html',
  styleUrls: ['./unit-charges.component.css']
})

export class UnitChargesComponent implements OnInit, OnDestroy {
  unitDetForm!: FormGroup;
  serviceList: Item[] = [];
  textMessageClass: string = "";
  retMessage: string = "";
  vatList: Item[] = [];
  subSink: SubSink;
  unitCls: unitCharges;
  masterParams!: MasterParams;
  properytList: Item[] = [];
  blocksList: Item[] = [];
  bedRoomList: Item[] = [];
  @Input() max: any;
  today = new Date();
  plexTypeList: Item[] = [
    { itemCode: "SIMPLEX", itemName: 'Simplex' },
    { itemCode: "DUPLEX", itemName: 'Duplex' },
    { itemCode: "TRIPLEX", itemName: 'Triplex' },
    { itemCode: "MULTIPLEX", itemName: 'Multiplex' }
  ];
  rowData: any = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  columnDefs: any = [
    { field: "bedroomCount", headerName: "BR Count", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "plexType", headerName: "Plex Type", flex: 1, resizable: true, sortable: true, filter: true, },
    { field: "chargeTypeDesc", headerName: "Charge", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "vatRate", headerName: "Vat Rate", sortable: true, filter: true, resizable: true, flex: 1 },
    {
      field: "amount", headerName: "Amount", sortable: true, filter: true, resizable: true, flex: 1, type: 'rightAligned',
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
    {
      field: "reviewedOn", headerName: "Reviewed", sortable: true, resizable: true, flex: 1, filter: true
      , valueFormatter: function (params: any) {
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
      field: "nextReviewOn", headerName: "Next Review", sortable: true, resizable: true, flex: 1, filter: true
      , valueFormatter: function (params: any) {
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
    }
  ];
  selectedRowClass = 'ag-custom-highlight';
  rowClassRules: RowClassRules<any> = {
    [this.selectedRowClass]: (params: any) => {
      return params.node.isSelected();
    }
  };

  public rowSelection: 'single' | 'multiple' = 'multiple';
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  revenueList: Item[] = [{ itemCode: "COMPANY", itemName: "Company" },
  { itemCode: "LANDLORD", itemName: "Landlord" },
  { itemCode: "PROPERTY", itemName: "Property" }];
  constructor(private fb: FormBuilder, private masterService: MastersService, private datepipe: DatePipe,
    private loader: NgxUiLoaderService, protected router: Router, public dialog: MatDialog,
    private projService: ProjectsService, private userDataService: UserDataService) {
    this.unitDetForm = this.formInit();
    this.subSink = new SubSink();
    this.unitCls = new unitCharges();
    this.masterParams = new MasterParams();

  }


  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  Delete() {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Delete?", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      height: '200px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult != true && dialogResult === "YES") {
        this.apply("Delete");
      }
    });
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
 async chargeSearch() {
    this.clearMsgs();
    this.rowData = [];
    if (this.unitDetForm.controls['propCode'].value === "") {
      this.textMessageClass = "red";
      this.retMessage = "Select Property!";
      return;
    }
    if (this.unitDetForm.controls['blockCode'].value === "") {
      this.textMessageClass = "red";
      this.retMessage = "Select Block!";
      return;
    }
    const body = {
      ...this.commonParams(),
      LangId: this.userDataService.userData.langId,
      PropCode: this.unitDetForm.controls['propCode'].value,
      BlockCode: this.unitDetForm.controls['blockCode'].value,
      BedroomCount: this.unitDetForm.controls['bedroomCount'].value,
      plexType:this.unitDetForm.controls['plexType'].value,
    }
    try {
      this.loader.start();
      this.subSink.sink =await this.projService.GetUnitRecurringChargesForAll(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.rowData = res['data'];
        }
        else {
          this.rowData = [];
          this.handelError(res);
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.handelError(ex);
    }

  }

  handelError(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'red';
  }

  handelSuccess(res: any) {
    this.retMessage = res.message;
    this.textMessageClass = 'green';
  }
  refreshData() {
    this.unitDetForm.controls.blockCode.valueChanges.subscribe((data) => {
      this.unitDetForm.controls['bedroomCount'].patchValue('');
      this.rowData = [];
    });
  }
 async onSelectedPropertyChanged() {
    this.blocksList = [];
    this.clearMsgs();
    this.unitDetForm.controls['bedroomCount'].patchValue('');
    this.masterParams.type = 'BLOCK';
    this.masterParams.item = this.unitDetForm.controls['propCode'].value;
    try {
      if (this.masterParams.item != 'All' && this.unitDetForm.controls['propCode'].value != '') {
        this.subSink.sink =await this.masterService.GetCascadingMasterItemsList(this.masterParams)
          .pipe(
            debounceTime(300) // Adjust the debounce time as needed (in milliseconds)
          )
          .subscribe((result: getResponse) => {
            if (result.status.toUpperCase() === "SUCCESS") {
              this.blocksList = result['data'];
              if (this.blocksList.length === 1) {
                this.unitDetForm.get('blockCode')!.patchValue(this.blocksList[0].itemCode);
                const body = {
                  ...this.commonParams(),
                  LangId: this.userDataService.userData.langId,
                  PropCode: this.unitDetForm.controls['propCode'].value,
                  BlockCode: this.unitDetForm.controls['blockCode'].value,
                  BedroomCount:"All"
                }
                try {
                  this.loader.start();
                  this.subSink.sink = this.projService.GetUnitRecurringChargesForAll(body).subscribe((res: any) => {
                    this.loader.stop();
                    if (res.status.toUpperCase() === "SUCCESS") {
                      this.rowData = res['data'];
                    }
                    else {
                      this.rowData = [];
                      this.handelError(res);
                    }
                  });
                }
                catch (ex: any) {
                  this.loader.stop();
                  this.handelError(ex);
                }
              }
            }
            else {
              this.retMessage = "Block list empty!";
              this.textMessageClass = 'red';
              return;
            }
          });
      }
    }
    catch (ex: any) {
      this.loader.stop();
      this.handelError(ex);
    }
  }

  handleloadRes(vatRes: getResponse, chargeRes: getResponse, propertyRes: getResponse, bedRes: getResponse) {
    if (propertyRes.status.toUpperCase() === "SUCCESS") {
      this.properytList = propertyRes['data'];
      if (this.properytList.length === 1) {
        this.unitDetForm.get('propCode')!.patchValue(this.properytList[0].itemCode);
        this.onSelectedPropertyChanged();
      }
    } else {
      this.retMessage = "Property list empty!";
      this.textMessageClass = "red";

    }
    if (vatRes.status.toUpperCase() === "SUCCESS") {
      this.vatList = vatRes['data'];
      if (this.vatList.length === 1) {
        this.unitDetForm.get('vatRate')!.patchValue(this.vatList[0].itemCode);
      }
    }
    else {
      this.retMessage = "Vat list empty!";
      this.textMessageClass = "red";

    }
    if (chargeRes.status.toUpperCase() === "SUCCESS") {
      this.serviceList = chargeRes['data'];
      if (this.serviceList.length === 1) {
        this.unitDetForm.get('chargeType')!.patchValue(this.serviceList[0].itemCode);
      }
    }
    else {
      this.retMessage = "Service list empty!";
      this.textMessageClass = "red";

    }

    if (bedRes.status.toUpperCase() === "SUCCESS") {
      this.bedRoomList = bedRes['data'];
      if (this.bedRoomList.length === 1) {
        this.unitDetForm.get('bedroomCount')!.patchValue(this.bedRoomList[0].itemCode);
      }
    } else {
      this.retMessage = "Bedroom list empty!";
      this.textMessageClass = "red";

    }
  }

 async loadData() {
    const vbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'VATRATE' });
    const cbody$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'RENTCHARGE' });
    const property$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'PROPERTY' });
    const bedroom$ = this.masterService.GetMasterItemsList({ ...this.commonParams(), item: 'BEDROOM' });
    this.subSink.sink =await forkJoin([vbody$, cbody$, property$, bedroom$]).subscribe(
      ([vatRes, chargeRes, propertyRes, bedRes]: any) => {
        this.handleloadRes(vatRes, chargeRes, propertyRes, bedRes);
      },
      error => {
        this.handelError(error);
      }
    );    
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.loadData();
    this.refreshData();
  }

  clearMsgs() {
    this.retMessage = "";
    this.textMessageClass = "";
  }

  formatDate(unitDateValue: string): string {
    const unitDateObject = new Date(unitDateValue);
    if (unitDateObject instanceof Date && !isNaN(unitDateObject.getTime())) {
      const year = unitDateObject.getFullYear();
      const month = (unitDateObject.getMonth() + 1).toString().padStart(2, '0');
      const day = unitDateObject.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } else {
      return '';
    }
  }

  prepareUnitCls(mode: string) {
    const formValues: UnitCharge = this.unitDetForm.value;
    this.unitCls.mode = mode;

    let reviewDate: any;
    let nextReviewDate: any;
    reviewDate = this.formatDate(formValues.reviewedOn.toString());
    nextReviewDate = this.formatDate(formValues.nextReviewOn.toString());
    this.unitCls.amount = parseFloat(this.unitDetForm.get('amount')!.value.replace(/,/g, ''));
    this.unitCls.bedroomCount = formValues.bedroomCount;
    this.unitCls.chargeType = formValues.chargeType;
    this.unitCls.company = this.userDataService.userData.company;
    this.unitCls.isRecurring = formValues.isRecurring;
    this.unitCls.isRefundable = formValues.isRefundable;
    this.unitCls.langId = this.userDataService.userData.langId;
    this.unitCls.location = this.userDataService.userData.location;
    this.unitCls.refNo = this.userDataService.userData.sessionID;
    this.unitCls.revenueTo = formValues.revenueTo;
    this.unitCls.user = this.userDataService.userData.userID;;
    this.unitCls.vatRate = this.unitDetForm.get('vatRate')!.value;
    this.unitCls.applyForAll = formValues.applyForAll;
    this.unitCls.property = formValues.propCode;
    this.unitCls.block = formValues.blockCode;
    this.unitCls.notes = formValues.notes;
    this.unitCls.reviewedOn = reviewDate;
    this.unitCls.plexType=formValues.plexType;
    this.unitCls.nextReviewOn = nextReviewDate;
  }
 async apply(mode: string) {
    this.prepareUnitCls(mode);
    this.loader.start()
    try {
      this.subSink.sink =await this.projService.UpdateUnitRecurringChargesForAll(this.unitCls).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() === "SUCCESS") {
          this.chargeSearch();
          this.handelSuccess(res);

        }
        else {
          this.handelError(res);
        }
      });
    }
    catch (ex: any) {
      this.loader.stop();
      this.handelError(ex);
    }
  }
  onUpdate() {
    this.clearMsgs();
    if (this.unitDetForm.valid) {
      // const mode = "Modify"
      this.apply("Modify");

    }
    else {
      return;
    }

  }

  Clear() {
    this.unitDetForm = this.formInit();
    this.clearMsgs();
    this.refreshData();
    this.rowData = [];
  }
  onRowSelected(event: any) {
    console.log(event);
    this.unitDetForm.patchValue({
      bedroomCount: event.data.bedroomCount,
      amount: event.data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      vatRate: event.data.vatRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isRecurring: event.data.isRecurring,
      isRefundable: event.data.isRefundable,
      notes: event.data.notes,
      chargeType: event.data.chargeType,
      revenueTo: event.data.revenueTo,
      reviewedOn: event.data.reviewedOn,
      nextReviewOn: event.data.nextReviewOn,
      applyForAll: event.data.applyForAll,
      plexType:event.data.plexType
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  formatAmount(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    value = parts.join('.');
    inputElement.value = value;
  }



  formInit() {
    return this.fb.group({
      bedroomCount: ["", [Validators.required]],
      amount: [0, [Validators.required]],
      vatRate: ['', [Validators.required]],
      isRecurring: [false],
      isRefundable: [false],
      notes: [''],
      plexType:['',[Validators.required]],
      chargeType: ['', [Validators.required]],
      revenueTo: ['', [Validators.required]],
      propCode: [this.unitDetForm ? this.unitDetForm.value.propCode : '', [Validators.required]],
      blockCode: [this.unitDetForm ? this.unitDetForm.value.blockCode : '', [Validators.required]],
      reviewedOn: [new Date(), [Validators.required]],
      nextReviewOn: [new Date(), [Validators.required]],
      applyForAll: [false]
    });
  }

  Close() {
    this.router.navigateByUrl('/home');
  }

  onAmountChanged() {
    let numAmount: number;
    let strAmount = this.unitDetForm.controls['amount'].value.toString();
    numAmount = Number(strAmount.replace(/,(?=\d*\.\d*)/g, ''));
    let options: Intl.NumberFormatOptions = {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    this.unitDetForm.controls['amount'].patchValue(numAmount.toLocaleString(undefined, options));
  }

  dateChanged(event: any, controlName: string) {
    const control = this.unitDetForm.get(controlName);
    const inputValue = event.target.value;
    const [day, month, year] = inputValue.split('-').map((part: any) => parseInt(part, 10));
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        control?.patchValue(date);
      } else {
        console.error('Invalid date:', inputValue);
      }
    } else {
      console.error('Invalid date format:', inputValue);
    }
  }
  onHelpCilcked() {
    const dialogRef: MatDialogRef<AppHelpComponent> = this.dialog.open(AppHelpComponent, {
      disableClose: true,
      data: {
        ScrId: "SM807",
        SlNo: 0,
        IsPrevious: false,
        IsNext: false,
        User: this.userDataService.userData.userID,
        RefNo: this.userDataService.userData.sessionID
      }
    });
  }

  NotesDetails(tranNo: any) {
    const dialogRef: MatDialogRef<NotesComponent> = this.dialog.open(NotesComponent, {
      width: '90%',
      disableClose: true,
      data: {
        'tranNo': tranNo,
        'mode': 'modify',
        'note': this.unitDetForm.controls['notes'].value,
        'TranType': "UNITCHARGE",  // Pass any data you want to send to CustomerDetailsComponent
        'search': "Unit Charges Notes"
      }
    });

  }
  logDetails(tranNo: string) {
    const dialogRef: MatDialogRef<LogComponent> = this.dialog.open(LogComponent, {
      width: '60%',
      disableClose: true,
      data: {
        'tranType': "UNITCHARGE",
        'tranNo': tranNo,
        'search': 'Unit Charges Log Details'
      }
    });
  }
  serviceChange(){
    if(this.unitDetForm.get('chargeType')?.value === 'SERVICE' || this.unitDetForm.get('chargeType')?.value === 'DEPOSIT'){
      this.unitDetForm.get('revenueTo')?.patchValue('PROPERTY');
    }
    else if(this.unitDetForm.get('chargeType')?.value === 'RENT'){
      this.unitDetForm.get('revenueTo')?.patchValue('LANDLORD');
    }
  }


}
