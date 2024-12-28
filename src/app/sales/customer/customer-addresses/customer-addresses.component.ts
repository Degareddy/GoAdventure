import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { CustomerService } from 'src/app/Services/customer.service';
import { Address, CustomerParams } from '../../sales.class';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { Item } from 'src/app/general/Interface/interface';
import { UserDataService } from 'src/app/Services/user-data.service';
@Component({
  selector: 'app-customer-addresses',
  templateUrl: './customer-addresses.component.html',
  styleUrls: ['./customer-addresses.component.css']
})

export class CustomerAddressesComponent implements OnInit, OnDestroy {
  addressesList: Address[] = [];
  @Input() custID!: string;
  public slNo: number = 0;
  @ViewChild('frmClear') public sourceFrm!: NgForm;
  @Output() serialCreated = new EventEmitter<{ slNo: number }>();
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  public exportTmp: boolean = true;
  public excelName: string = "";
  public srNum!: number;
  modes: Item[] = [];
  masterParams!: MasterParams;
  code!: string;
  addressForm!: FormGroup;
  retMessage!: string;
  retNum!: number;
  textMessageClass!: string;
  selectedObjects!: any[];
  custParas: CustomerParams;
  @Input() mode!: string;
  @Input() data={mode:"" ,isLandlord:false}
  private subsink: SubSink;
  columnDefs: any = [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "address1", headerName: "Address1", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "address2", headerName: "Address2", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "city", headerName: "City", sortable: true, filter: true, resizable: true, width: 130 },
  { field: "province", headerName: "Province", sortable: true, filter: true, resizable: true, width: 120 },
  // { field: "eMail", headerName: "Email", sortable: true, filter: true, resizable: true, width: 180 },
  { field: "currStatus", headerName: "Status", sortable: true, filter: true, resizable: true, width: 100 }

  ];
  constructor(private custService: CustomerService,
    private loader: NgxUiLoaderService, private userDataService: UserDataService,
    protected router: Router,
    protected route: ActivatedRoute,
    protected fb: FormBuilder) {
    this.custParas = new CustomerParams();
    this.masterParams = new MasterParams();
    this.addressForm = this.formInit();
    this.subsink = new SubSink();
  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  formInit() {
    return this.fb.group({
      company: [''],
      location: [''],
      code: [''],
      slNo: [0],
      address1: ['', Validators.required],
      address2: ['', Validators.required],
      address3: [''],
      pO_PIN_ZIP: ['', Validators.required, Validators.maxLength(12)],
      city: ['', Validators.required],
      province: ['', Validators.required],
      country: ['', Validators.required],
       phone1: ['0',],
      phone2: [''],
      phone3: [''],
      fax: [''],
      // email: ['', [Validators.pattern(/^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/)]],
      currStatus: ['Open'],
      notes: [''],
      user: [''],
      refNo: [''],
      mode: ['View'],
      allowEmail: [false],
      allowWhatsApp: [false],
      allowSMS: [false]
    });
  }
  onExportBtnClick() {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({ fileName: this.excelName + '.csv' });
    }
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

  ngOnInit(): void {
    this.loadData();
  }
  loadData() {
    this.srNum = 0;
    this.slNo=0;
    this.custParas.company = this.userDataService.userData.company;
    this.custParas.user = this.userDataService.userData.userID;
    this.custParas.location = this.userDataService.userData.location;
    this.custParas.refNo = this.userDataService.userData.sessionID;

    this.masterParams.company = this.userDataService.userData.company;
    this.masterParams.location = this.userDataService.userData.location;
    this.masterParams.item = 'SM201';
    this.masterParams.user = this.userDataService.userData.userID;
    this.masterParams.refNo = this.userDataService.userData.sessionID;
    this.textMessageClass = "msgBackColorDefault";
  }
  refresh(custId: string, mode: string) {
    this.mode = mode;
    // this.Clear();
    if (custId) {
      this.srNum = 0;
      this.slNo =0;
      this.code = custId || this.custID;
      if (this.code != null || this.code != undefined) {
        this.custParas.Type = this.code;
        this.loader.start();
        this.subsink.sink = this.custService.getCustomerAddressesData(this.custParas).subscribe((result: any) => {
          this.loader.stop();
          if (result.status.toUpperCase() != "FAIL" && result.status.toUpperCase() != "ERROR") {
            this.rowData = result['data'];
            if (this.rowData && this.rowData.length > 0) {
              this.onViewClicked(this.rowData[this.rowData.length - 1]);
            }
          }
          else {
            this.retMessage = result.message;
            this.textMessageClass = "red";
          }
        });
      }
    }
  }
  onPhone1Change(value:any){
    const input = value.target.value.replace(/[^0-9]/g, '');
    this.addressForm.controls['phone2'].patchValue(input);
  }
  
  onPhone2Change(value:any){
    const input = value.target.value.replace(/[^0-9]/g, '');
    this.addressForm.controls['phone3'].patchValue(input);
  }
  onRowSelected(event: any) {
    this.onViewClicked(event.data);
  }

  onViewClicked(data: any) {
    this.srNum = data.slNo;
    this.custParas.slNo = this.srNum;
    this.custParas.code = this.code;
    this.serialCreated.emit({ slNo: this.srNum });
    this.slNo = data.slNo;
    const formData = {
      slNo: data.slNo,
      address1: data.address1,
      address2: data.address2,
      address3: data.address3,
      pO_PIN_ZIP: data.pO_PIN_ZIP,
      city: data.city,
      province: data.province,
      country: data.country,
      phone1: data.phone1,
      phone2: data.phone2,
      phone3: data.phone3,
      fax: data.fax,
      email: data.eMail,
      currStatus: data.currStatus,
      notes: data.notes,
      allowEmail: data.allowEmail,
      allowWhatsApp: data.allowWhatsApp,
      allowSMS: data.allowSMS
    };
    this.addressForm.patchValue(formData);
  }
  Submit() {
    this.textMessageClass = ""
    this.retMessage = "";
    if (this.addressForm.invalid) {
      return;
    }
    this.addressForm.controls['company'].setValue(this.userDataService.userData.company);
    this.addressForm.controls['location'].setValue(this.userDataService.userData.location);
    this.addressForm.controls['code'].setValue(this.code || this.custID);
    this.addressForm.controls['user'].setValue(this.userDataService.userData.userID);
    this.addressForm.controls['refNo'].setValue(this.userDataService.userData.sessionID);
    this.addressForm.controls['mode'].setValue(this.mode);
    this.addressForm.controls['slNo'].setValue(this.slNo);
    this.subsink.sink = this.custService.updateCustomerAddress(this.addressForm.value).subscribe((result: any) => {
        this.retNum = result.retVal;
        if (this.retNum === 101 || this.retNum === 102 || this.retNum === 103 || this.retNum === 104) {
          this.srNum = this.slNo;
          if (this.mode != "View") {
            this.refresh(this.code || this.custID, this.mode);
          }
          this.textMessageClass = "green"
          this.retMessage = result.message;
        }
        else if (this.retNum < 100 || this.retNum > 200) {
          this.textMessageClass = "red"
          this.retMessage = result.message;
        }
        // else if (this.retNum > 200) {
        //   this.textMessageClass = "red"
        //   this.retMessage = result.message;
        // }
        else {
          this.textMessageClass = "red"
          this.retMessage = result.message;
        }
      });
  }
  Clear() {
    this.addressForm = this.formInit();
    this.sourceFrm.resetForm();
    this.textMessageClass = "";
    this.retMessage = "";
    this.slNo = 0;
  }
}
