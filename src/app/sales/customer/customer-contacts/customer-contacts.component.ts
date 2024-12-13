import { Component, OnInit, Inject, ViewChild, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, NgForm, Validators } from '@angular/forms';
import { CustomerService } from 'src/app/Services/customer.service';
import { Contact, CustomerParams, MasterParams } from '../../sales.class';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { nameCountResponse } from 'src/app/general/Interface/admin/admin';

interface Item {
  itemCode: string;
  itemName: string;
}
@Component({
  selector: 'app-customer-contacts',
  templateUrl: './customer-contacts.component.html',
  styleUrls: ['./customer-contacts.component.css']
})

export class CustomerContactsComponent implements OnInit, OnDestroy {
  @Input() InputCode!: string;
  @Input() mode!:string;
  @Input() custID!:string;
  private code!: string;
  contactsList: Contact[] = [];
  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('frmClear') public sourceFrm!: NgForm;
  private subSink: SubSink;
  slNo!: number;
  contactForm!: any;
  dialogOpen = false;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  custParas: CustomerParams;
  nationalityList: any = [];
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  masterParams!: MasterParams;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "contactID", headerName: "Contact S.No", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "contactName", headerName: "Contact Name", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "department", headerName: "Department", sortable: true, filter: true, resizable: true, width: 130 },
  { field: "designation", headerName: "Designation", sortable: true, filter: true, resizable: true, width: 120 },
  { field: "phone1", headerName: "Phone", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "eMail", headerName: "Email", sortable: true, filter: true, resizable: true, width: 100 },
  { field: "currStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 100 }
  ];
  countryList:Item[]=[];

  constructor(private custService: CustomerService, private masterService: MastersService,public dialog: MatDialog,
    private loader: NgxUiLoaderService,private userDataService: UserDataService,
    protected router: Router,    private utlService: UtilitiesService,
    protected route: ActivatedRoute,
    protected fb: FormBuilder) {
    this.custParas = new CustomerParams();
    this.masterParams = new MasterParams();
    this.displayColumns = ["contactID", "contactName", "department", "designation", "phone1", "eMail", "currStatus", "actions"];
    this.contactForm = this.formInit();
    this.subSink = new SubSink();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      company: [''],
      location: [''],
      code: [''],
      slNo: [''],
      contactID: ['', Validators.required],
      name: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      phone1: ['', Validators.required],
      phone2: [''],
      phone3: [''],
      eMail: ['', [Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      currStatus: [''],
      remarks: [''],
      user: [''],
      refNo: [''],
      mode: [''],
      nationality:['',Validators.required],
      dob:[new Date(),Validators.required],
      idNo:['',Validators.required]
    })
  }

  ngOnInit(): void {
    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;

    this.custParas.company = this.userDataService.userData.company;
    this.custParas.location = this.userDataService.userData.location;
    this.custParas.refNo = this.userDataService.userData.sessionID;
    this.custParas.user = this.userDataService.userData.userID;
    this.textMessageClass = "msgBackColorDefault";

    const body = {
      ...this.commonParams(),
      item: 'NATIONAL'
    };
    this.subSink.sink = this.masterService.GetMasterItemsList(body).subscribe((res:any)=>{
        if(res.status.toUpperCase()==="SUCCESS"){
          this.nationalityList = res['data'];
        }
    });
    this.getCountryList();

  }
  private createRequestDataForSearch(item: string, type: string) {
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
  async onnameSearch() {
    const body = this.createRequestDataForSearch(this.contactForm.get('name')!.value || "", "CARETAKER");
    try {
      this.subSink.sink = await this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
        if (res.retVal === 0) {
          if (res && res.data && res.data.nameCount === 1) {
            this.contactForm.get('name')!.patchValue(res.data.selName);
            // this.tenantCode = res.data.selCode;
          }
          else {
            if (!this.dialogOpen) {
              const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                width: '90%',
                disableClose: true,
                data: {
                  'PartyName': this.contactForm.get('name')!.value, 'PartyType': "CARETAKER",
                  'search': 'Care Taker Search'
                }
              });
              this.dialogOpen = true;
              dialogRef.afterClosed().subscribe(result => {
                if (result != true) {
                  this.contactForm.get('name')!.patchValue(result.partyName);
                  // this.tenantCode = result.code;
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
  commonParams(){
    return{
      company:this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  countryChanged(country:any){
    
  }
  refresh(code: any, serialNum: number, mode: string) {
    this.mode = mode || this.mode;
    this.code = code || this.custID;
    this.retMessage = "";
    this.textMessageClass = "";
    if ((this.code != null && this.code != undefined && this.code != "") && serialNum != 0) {
      this.custParas.code = this.code;
      this.custParas.slNo = serialNum;
      this.slNo = serialNum;
      this.loader.start();
      this.subSink.sink = this.custService.getCustomerContactsData(this.custParas).subscribe((result: any) => {
        this.loader.stop();
        if (result.status.toUpperCase() != 'FAIL' && result.status.toUpperCase() != 'ERROR') {
          this.rowData = result['data'];
          this.contactsList = result['data'];
        }
        else {
          this.retMessage = result.message;
          this.textMessageClass = 'red';
          this.rowData = []
        }
      });
    }
  }
getCountryList(){
  const body = {
    ...this.commonParams(),
    item: 'COUNTRY'
  };
  this.loader.start();
  this.subSink.sink=this.masterService.getCountriesList(body).subscribe((res:any)=>{
    this.loader.stop();
    if(res.status.toUpperCase()==="SUCCESS"){
      this.countryList = res['data'];
    }
  })
}
  onSelectClicked(contactID: string): void {
    this.custParas.contactId = contactID;
    this.loader.start();
    this.subSink.sink = this.custService.getCustomerContactsDetails(this.custParas)
      .subscribe((res: any) => {
        this.loader.stop();
        this.contactForm.controls['company'].setValue(res['data'].company);
        this.contactForm.controls['location'].setValue(res['data'].location);
        this.contactForm.controls['code'].setValue(res['data'].code);
        this.contactForm.controls['slNo'].setValue(res['data'].slNo);
        this.contactForm.controls['contactID'].setValue(res['data'].contactID);
        this.contactForm.controls['contactName'].setValue(res['data'].contactName);
        this.contactForm.controls['department'].setValue(res['data'].department);
        this.contactForm.controls['designation'].setValue(res['data'].designation);
        this.contactForm.controls['phone1'].setValue(res['data'].phone1);
        this.contactForm.controls['phone2'].setValue(res['data'].phone2);
        this.contactForm.controls['phone3'].setValue(res['data'].phone3);
        this.contactForm.controls['eMail'].setValue(res['data'].eMail);
        this.contactForm.controls['currStatus'].setValue(res['data'].currStatus);
        this.contactForm.controls['remarks'].setValue(res['data'].remarks);
        this.contactForm.controls['nationality'].setValue(res['data'].nationality);
        this.contactForm.controls['idNo'].setValue(res['data'].idNo);
        this.contactForm.controls['dob'].setValue(res['data'].dob);
      });
  }

  Clear() {
    this.sourceFrm.resetForm();
    this.contactForm = this.formInit();
    this.retMessage = "";
    this.textMessageClass = "";
  }

  Submit() {
    this.contactForm.controls['company'].setValue(this.userDataService.userData.company);
    this.contactForm.controls['location'].setValue(this.userDataService.userData.location);
    this.contactForm.controls['code'].setValue(this.code || this.custID);
    this.contactForm.controls['slNo'].setValue(this.slNo);
    this.contactForm.controls['mode'].setValue(this.mode);
    this.contactForm.controls['user'].setValue(this.userDataService.userData.userID);
    this.contactForm.controls['refNo'].setValue(this.userDataService.userData.sessionID);
    this.subSink.sink = this.custService.updateCustomerContact(this.contactForm.value)
      .subscribe((result: any) => {
        this.retNum = result.retVal;
        if (this.retNum === 101 || this.retNum === 102 || this.retNum === 103 || this.retNum === 104) {
          if (this.mode != 'Add') {
            this.refresh(this.code || this.custID, this.slNo, this.mode);
            this.textMessageClass = "green"
            this.retMessage = result.message;
          } else {
            this.Clear();
            this.refresh(this.code || this.custID, this.slNo, this.mode);
          }

        }
        else if (this.retNum < 100) {
          this.textMessageClass = "red"
          this.retMessage = result.message;
        }
        else if (this.retNum > 200) {
          this.textMessageClass = "red"
          this.retMessage = result.message;
        }
        else {
          this.textMessageClass = "red"
          this.retMessage = result.message;
        }
      });
  }

  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  onRowSelected(event: any) {
    this.onViewClicked(event.data);
  }

  onViewClicked(data: any) {
    this.custParas.code = this.code;
    this.custParas.refNo = this.userDataService.userData.sessionID;
    this.custParas.user = this.userDataService.userData.userID;
    this.custParas.contactId = data.contactID.toString().trim();
    this.loader.start();
    this.subSink.sink = this.custService.getCustomerContactsDetails(this.custParas)
      .subscribe((res: any) => {
        this.loader.stop();
        this.contactForm.controls['company'].setValue(res['data'].company);
        this.contactForm.controls['location'].setValue(res['data'].location);
        this.contactForm.controls['code'].setValue(res['data'].code);
        this.contactForm.controls['slNo'].setValue(res['data'].slNo);
        this.contactForm.controls['contactID'].setValue(res['data'].contactID);
        this.contactForm.controls['contactName'].setValue(res['data'].contactName);
        this.contactForm.controls['department'].setValue(res['data'].department);
        this.contactForm.controls['designation'].setValue(res['data'].designation);
        this.contactForm.controls['phone1'].setValue(res['data'].phone1);
        this.contactForm.controls['phone2'].setValue(res['data'].phone2);
        this.contactForm.controls['phone3'].setValue(res['data'].phone3);
        this.contactForm.controls['eMail'].setValue(res['data'].eMail);
        this.contactForm.controls['currStatus'].setValue(res['data'].currStatus);
        this.contactForm.controls['remarks'].setValue(res['data'].remarks);
        this.contactForm.controls['idNo'].setValue(res['data'].idNo);
        this.contactForm.controls['nationality'].setValue(res['data'].nationality);
        this.contactForm.controls['dob'].setValue(res['data'].dob);
        //console.log(this.contactForm.value);

      });
  }
}
