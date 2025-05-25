import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MastersService } from 'src/app/Services/masters.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { GeneralLedgerService } from 'src/app/Services/general-ledger.service';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { bankAccountDetails } from '../../gl.class';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
import { getPayload, nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';

@Component({
  selector: 'app-bank-accounts',
  templateUrl: './bank-accounts.component.html',
  styleUrls: ['./bank-accounts.component.css']
})
export class BankAccountsComponent implements OnInit, OnDestroy {
  bankAccountForm!: FormGroup;
  retNum!: number;
  dataFlag: boolean = false;
  slNum: number = 0;
  modes: string="";
  private subSink: SubSink;
  currencyList:Item[] =[];
  retMessage: string="";
  textMessageClass: string="";
  @ViewChild('frmClear') public sourceFrm!: NgForm;
  @Output() serialCreated = new EventEmitter<{ slNo: number }>();
  accStatus: string = "";
  selectedRowIndex: number = -1;
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  slValue: boolean = false;
  code!: string;
  masterParams!: MasterParams;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  dialogOpen = false;
  rowData: any = [];
  private bankAccCls: bankAccountDetails;
  signerCode:string="";
  private loader!: NgxUiLoaderService
  public rowSelection: 'single' | 'multiple' = 'multiple';
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "accNo", headerName: "Account No", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "branchName", headerName: "Branch Name", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "ifscCode", headerName: "IFSC Code", sortable: true, filter: true, resizable: true, width: 130 },
  { field: "signerName", headerName: "Signer", sortable: true, filter: true, resizable: true, width: 130 },
  { field: "province", headerName: "Province", sortable: true, filter: true, resizable: true, width: 120 },
  { field: "address1", headerName: "Address1", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "address2", headerName: "Address2", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "city", headerName: "City", sortable: true, filter: true, resizable: true, width: 130 },
  { field: "province", headerName: "Province", sortable: true, filter: true, resizable: true, width: 120 },
  { field: "email", headerName: "Email", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "accountStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 100 }
  ];

  constructor(private fb: FormBuilder,private utlService: UtilitiesService, public dialog: MatDialog,  private loaderService: NgxUiLoaderService,private glService: GeneralLedgerService,
    private masterService: MastersService,private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: string, tranNo: string, status: string,
    }
  ) {
    this.masterParams = new MasterParams();
    this.subSink = new SubSink();
    this.bankAccountForm = this.formInit();
    this.bankAccCls = new bankAccountDetails()
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  ngAfterViewInit(): void {
    this.loader = this.loaderService;
  }
  ngOnInit(): void {

    if (this.data.tranNo != "") {
      this.modes = this.data.mode;
      this.code = this.data.tranNo;
      this.accStatus = this.data.status;
      this.getBankDetailsData(this.data.tranNo);
    }
    this.loadData();
  }

  formInit() {
    return this.fb.group({
      accNo: ['', [Validators.required, Validators.maxLength(15)]],
      currency: ['', [Validators.required, Validators.maxLength(20)]],
      branchCode: ['', [Validators.required, Validators.maxLength(10)]],
      branchName: ['', [Validators.required, Validators.maxLength(50)]],
      ifscCode: ['', [Validators.required, Validators.maxLength(32)]],
      address1: ['', [Validators.required, Validators.maxLength(32)]],
      address2: ['', [Validators.maxLength(32)]],
      poBoxNO: ['', [Validators.maxLength(15)]],
      city: ['', [Validators.required, Validators.maxLength(50)]],
      province: ['', [Validators.required, Validators.maxLength(50)]],
      phone1: ['', [Validators.required, Validators.maxLength(15)]],
      phone2: ['', [Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      signerName:['',[Validators.required, Validators.maxLength(50)]],
      notes: ['', [Validators.maxLength(512)]],
    })
  }

  getBankDetailsData(tranNo: string) {
    this.masterParams.item = tranNo;
    this.masterParams.langId = this.userDataService.userData.langId;
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    try {
      this.loaderService.start();
      this.subSink.sink = this.glService.GetBankAccountDetails(this.masterParams).subscribe((res: any) => {
        this.loaderService.stop();
        // console.log(res);
        if (res.status.toUpperCase() === 'SUCCESS') {
          this.rowData = res['data'];
        } else {
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

  loadData() {
    const curbody :getPayload= {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      item: "CURRENCY",
      refNo: this.userDataService.userData.sessionID,
      user: this.userDataService.userData.userID,
      ...(this.data.mode === "Add" ? { mode: this.data.mode } : {})
    };
    try {
      const currencies$ = this.masterService.GetMasterItemsList(curbody);
      this.subSink.sink = forkJoin([currencies$]).subscribe(
        ([curRes]: any) => {
          this.currencyList = curRes['data'];
        },
        error => {
          this.hanldeError(error);
        }
      );
    } catch (ex: any) {
      this.hanldeError(ex);
    }
  }
  async onUserSearch() {
    const body = {
      Company: this.userDataService.userData.company,
      Location: this.userDataService.userData.location,
      Type: "USER",
      item: '',
      ItemFirstLevel: "",
      ItemSecondLevel: "",
      User: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
    try {
      this.subSink.sink =await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            // this.bankAccountForm.controls['user'].patchValue(res.data.selName);
            // this.bankAccountForm.controls['userName'].patchValue(res.data.selName);
            // this.bankAccountForm.controls['userID'].patchValue(res.data.selCode);
            // this.bankAccountForm(res.data.selCode);
            this.bankAccountForm.controls['signerName'].patchValue(res.data.selName);
            this.bankAccCls.signAuthority=res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'tranNum': this.bankAccountForm.controls['signerName'].value, 'PartyType': "USER",
                  'search': 'User Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  // this.bankAccountForm.controls['user'].patchValue(result.partyName);
                  this.bankAccountForm.controls['signerName'].patchValue(result.partyName);
                  this.bankAccCls.signAuthority=result.code;

                  // this.userForm.controls['userID'].patchValue(result.code);
                  // this.getUserData(result.code);
                }
                this.dialogOpen = false;

              });
            }
          }
        }
        // else {
        //   this.displayMessage("Error: " + res.message, "red");
        // }
      });
    }
    catch (ex: any) {
    //  this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  onClearClick() {
    this.bankAccountForm.get('user')!.patchValue('');
  }
  prepareAccountCls() {
    this.bankAccCls.Company = this.userDataService.userData.company;
    this.bankAccCls.Location = this.userDataService.userData.location;
    this.bankAccCls.langID = 1;
    this.bankAccCls.User = this.userDataService.userData.userID;
    this.bankAccCls.RefNo = this.userDataService.userData.sessionID;
    this.bankAccCls.Mode = this.modes;
    this.bankAccCls.slNo = this.slNum || 0;
    this.bankAccCls.Code = this.code;
    this.bankAccCls.accNo = this.bankAccountForm.controls['accNo'].value;
    this.bankAccCls.Currency = this.bankAccountForm.controls['currency'].value;
    this.bankAccCls.CurrencyName = this.bankAccountForm.controls['currency'].value;
    this.bankAccCls.branchCode = this.bankAccountForm.controls['branchCode'].value;
    this.bankAccCls.branchName = this.bankAccountForm.controls['branchName'].value;
    this.bankAccCls.iFSCCode = this.bankAccountForm.controls['ifscCode'].value;
    this.bankAccCls.address1 = this.bankAccountForm.controls['address1'].value;
    this.bankAccCls.address2 = this.bankAccountForm.controls['address2'].value;
    this.bankAccCls.pOBoxNO = this.bankAccountForm.controls['poBoxNO'].value;
    this.bankAccCls.city = this.bankAccountForm.controls['city'].value;
    this.bankAccCls.province = this.bankAccountForm.controls['province'].value;
    this.bankAccCls.phone1 = this.bankAccountForm.controls['phone1'].value;
    this.bankAccCls.phone2 = this.bankAccountForm.controls['phone2'].value;
    this.bankAccCls.accountStatus = this.accStatus;
    this.bankAccCls.notes = this.bankAccountForm.controls['notes'].value;
    this.bankAccCls.email = this.bankAccountForm.controls['email'].value;
    // this.bankAccCls.signerName=this.bankAccountForm.controls['user'].value;
  }
  clearMsg() {
    this.textMessageClass = ""
    this.retMessage = "";
  }
  onSubmit() {
    this.clearMsg();
    if (this.bankAccountForm.invalid) {
      return;
    }
    this.prepareAccountCls();
    this.subSink.sink = this.glService.UpdateBankAccountDetails(this.bankAccCls).subscribe((result: any) => {
      if (result.status.toUpperCase() === "SUCCESS") {
        this.getBankDetailsData(result.tranNoNew)
        this.textMessageClass = "green"
        this.retMessage = result.message;
      }
      else {
        this.hanldeError(result);
      }
    });
  }
  hanldeError(res: any) {
    this.textMessageClass = "red"
    this.retMessage = res.message;
  }
  refresh(custId: string, mode: string) {
    this.clearMsg();
    this.modes = mode;
    this.clear();
    if (custId) {
      this.slNum = 0;
      this.code = custId;
      if (this.code != null || this.code != undefined) {
        this.masterParams.type = this.code;
        this.loader.start();
        this.glService.GetBankAccountDetails(this.masterParams).subscribe((result: any) => {
          this.loader.stop();
          if (result.status.toUpperCase() != "FAIL" && result.status.toUpperCase() != "ERROR") {
            this.rowData = result['data'];
          }
          else {
            this.hanldeError(result);
          }

        });
      }
    }
  }
  add() {
    this.slNum = 0;
    this.bankAccountForm = this.formInit();
    this.textMessageClass = "";
    this.retMessage = "";
    this.accStatus = "";
  }
  Delete() {

  }
  clear() {
    this.bankAccountForm = this.formInit();
    this.clearMsg();
    this.accStatus = "";
    this.slNum = 0;
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
  onRowSelected(event: any) {
    // this.onViewClicked(event.data);
  }

  // onViewClicked(data: any) {
  //   // ;
  //   this.clearMsg();
  //   this.slNum = data.slNo;
  //   this.bankAccCls.slNo = this.slNum;
  //   this.bankAccCls.Code = this.code;
  //   this.serialCreated.emit({ slNo: this.slNum });
  //   this.accStatus = data.status;
  //   this.bankAccountForm.patchValue({
  //     slNo: data.slNo,
  //     address1: data.address1,
  //     address2: data.address2,
  //     address3: data.address3,
  //     pO_PIN_ZIP: data.pO_PIN_ZIP,
  //     city: data.city,
  //     province: data.province,
  //     country: data.country,
  //     phone1: data.phone1,
  //     phone2: data.phone2,
  //     phone3: data.phone3,
  //     fax: data.fax,
  //     email: data.eMail,
  //     currStatus: data.currStatus,
  //     notes: data.notes
  //   });
  // }
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowClick.bind(this));
  }

  onRowClick(row: any, i: number) {
    // console.log(row.data);
    this.clearMsg();
    this.accStatus = row.data.accountStatus;
    this.bankAccountForm.patchValue(row.data);
    this.selectedRowIndex = i;
    this.slNum = row.data.slNo;
  }



}
