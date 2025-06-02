import { AfterViewInit, ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MastersService } from 'src/app/Services/masters.service'
import { MatDialogRef } from '@angular/material/dialog';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { SubSink } from 'subsink';
import { DatePipe } from '@angular/common';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, TextClr } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
import { Item } from '../Interface/interface';
import { SalesService } from 'src/app/Services/sales.service';

interface packageNames {
  packageId:string;
  packageName:string;
}
@Component({
  selector: 'app-search-engine',
  templateUrl: './search-engine.component.html',
  styleUrls: ['./search-engine.component.css']
})

export class SearchEngineComponent implements OnInit, OnDestroy, AfterViewInit {
  tranSearchForm!: FormGroup;
  @Input() max: any;
  packageNames:packageNames[]=[]

  tomorrow = new Date();
  textMessageClass!: string;
packageTypes:Item[]=[]
  
  retMessage!: string;
  tranStatus: any = ['ANY', 'Closed', 'Authorized', 'Open', 'Deleted', 'Confirmed']
  masterParams!: MasterParams;
  tranNo!: any[];
  searchName!: string;
  rowData: any = [];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  private subSink!: SubSink;
  loader!: NgxUiLoaderService;
  pageSizes = [100, 250, 500];
  pageSize = 100;
  totalAmount: number = 0;
  afterDisc:number=0;

  
  columnDefs: any = [
  ];
  constructor(protected mastService: MastersService, private salesService:SalesService,private userDataService: UserDataService,protected masterService: MastersService,
    private fb: FormBuilder, private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SearchEngineComponent>,
    private loaderService: NgxUiLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.masterParams = new MasterParams();
    this.tranSearchForm = this.formInit();
    this.subSink = new SubSink();
    if(this.data.search === "Booking Search"|| this.data.search  == 'Trip Search'){
      this.columnDefs=[
        { field: "slNo", headerName: "S.No", width: 80 },
    { field: "packageTypeName", headerName: "Package Type", sortable: true, filter: true, resizable: true, width: 90, hide: true },
    { field: "clientName", headerName: "Package Type", sortable: true, filter: true, resizable: true, width: 90, hide: true },
    { field: "tranNo", headerName: "Package Type", sortable: true, filter: true, resizable: true, width: 90, hide: true },
    {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
  { field: "packageTypeName", headerName: "Package Type", sortable: true, filter: true, resizable: true, width: 90, hide: true },
  { field: "packageName", headerName: "Package name", sortable: true, filter: true, resizable: true, width: 90 },
  { field: "tripId", headerName: "Trip Id", sortable: true, filter: true, resizable: true, width: 190 },
  
  {
    field: "startDate", headerName: "Start Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
    field: "endDate", headerName: "End Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
      ]
    }
    else{
      this.columnDefs=[
        { field: "slNo", headerName: "S.No", width: 60 },
   { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, width: 90,},
    {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
  
    
 
  
      ]
    }
  }
  
  ngAfterViewInit(): void {
    this.loader = this.loaderService;
  }
  loadTripList(){
        this.displayMessage("Please Wait ...Loading",'')
    const body={
      Mode:'View',
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID,
      item:"PACKAGE",
      itemFirstLevel: "",
      itemSecondLevel: "",
      password: "",
      selLocation: "",
      tranNo: "",
      tranType: "",
      type: ""
    }
    try {
          this.subSink.sink =this.masterService.getSpecificMasterItems(body).subscribe((res: any) => {
            this.packageTypes= res.data
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }
  loadPackages(){
    this.displayMessage("Please Wait ...Loading",'')
    this.packageNames=[]
    const body={
      "Mode":"View",
      "Company":this.userDataService.userData.company,
      "Location":this.userDataService.userData.location,
      "User":this.userDataService.userData.userID,
      "RefNo":this.userDataService.userData.sessionID,
      "item":this.tranSearchForm.get('packageType')?.value,
    }
    try {
      this.loader.start();
          this.subSink.sink = this.salesService.GetPackagesList(body).subscribe((res: any) => {
            this.loader.stop();
            if(res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR){
              this.displayMessage(res.message, TextClr.red);
            }
            else{
              this.packageNames=res.data;
              this.displayMessage(res.message, TextClr.green);
            }
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
  }

  ngOnInit(): void {
    if(this.data.search === "Package Name Search"){

    }
    else if(this.data.search === "Booking Search"){
      this.bookingSearch();
      this.loadTripList();
      this.tranSearchForm.get('clientName')?.patchValue(this.data.name);
      this.tranSearchForm.get('phoneNo')?.patchValue(this.data.contact);
      this.tranSearchForm.get('email')?.patchValue(this.data.email);
      this.tranSearchForm.get('email')?.patchValue(this.data.batchNo);

    }
    else if(this.data.search === "Trip Search"){
          this.loadTripList();
    }
    this.searchName = this.data.search;
    
    this.search();
    if(this.data.search == 'Booking Search'){
    this.columnDefs= [{ field: "slNo", headerName: "S.No", width: 80 },
    { field: "packageTypeName", headerName: "Package Type", sortable: true, filter: true, resizable: true, width: 90 },
    { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, width: 90 },
    { field: "tranNo", headerName: "Tran No", sortable: true, filter: true, resizable: true, width: 90 },
    {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
]
}
else if(this.data.search == 'Opening Balance Search'){
  this.columnDefs= [{ field: "slNo", headerName: "S.No", width: 80 },
    { field: "tranNo", headerName: "Tran No ", sortable: true, filter: true, resizable: true, width: 90 },
    
    {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
]
}
else if(this.data.search == 'Receipt/Payment Search'){
this.columnDefs= [{ field: "slNo", headerName: "S.No", width: 80 },
  { field: "clientName", headerName: "Client Name", sortable: true, filter: true, resizable: true, width: 90 },
    { field: "tranNo", headerName: "Tran No ", sortable: true, filter: true, resizable: true, width: 90 },
    {
    field: "tranDate", headerName: "Tran Date", sortable: true, filter: true, resizable: true, width: 120,
    valueFormatter: function (params: any) {
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
]
}
this.search();
  }
  bookingSearch(){
        this.displayMessage("Please Wait ...Loading",'')

    const body = {
        ...this.commonParams(),
        TranNo:this.tranSearchForm.get('batchNo')?.value
        
      }
      try {
        this.loader.start();
        this.subSink.sink =  this.mastService.GetBookingDetails(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
  }
loadPackageNames(){
  const body={
      Mode:'View',
      Company:this.userDataService.userData.company,
      Location:this.userDataService.userData.location,
      User:this.userDataService.userData.userID,
      RefNo:this.userDataService.userData.sessionID,
      item:this.tranSearchForm.get('packageType')?.value,
     
    }
    try {
          this.subSink.sink =this.masterService.getSpecificMasterItems(body).subscribe((res: any) => {
            this.packageTypes= res.data
          });
        }
        catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
        }
}
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }
onRowSelected(event: any) {
    
      this.dialogRef.close(event.data);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    this.gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }

  formInit() {
    return this.fb.group({
      tranType: [''],
      tranNo: [''],
      party: [''],
      slNo: [''],
      fromDate: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), Validators.required],
      toDate: [new Date(), Validators.required],
      tranStatus: ['ANY'],
      client: [''],
      message: [''],
      packageType:[''],
      packageName:[''],
      batchNo:[''],
      clientName:[''],
      phoneNo:[""],
      email:['']
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
  async search() {
    if(this.data.search === "Booking Search"){
      const body = {
      SearchFor:"BOOKING",
      TranNo:this.tranSearchForm.get('batchNo')?.value,
      FirstPara:this.tranSearchForm.get('packageType')?.value,
      SecondPara:this.tranSearchForm.get('clientName')?.value,
      ThirdPara:this.tranSearchForm.get('phoneNo')?.value,
      FourthPara:this.tranSearchForm.get('email')?.value,
      FirstDate:this.tranSearchForm.get('fromDate')?.value,
      SecondDate:this.tranSearchForm.get('toDate')?.value,
        ...this.commonParams(),
       
        
      }
      try {
        this.loader.start();
        this.subSink.sink = await this.masterService.GetTranSearch(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    else if(this.data.search  == 'Trip Search'){
      const body = {
        ...this.commonParams(),
        SearchFor:"TRIP",
        Type:this.tranSearchForm.get('packageType')?.value,
        ItemFirstLevel: this.tranSearchForm.get('packageName')?.value,
        FirstDate: this.datePipe.transform(this.tranSearchForm.get('fromDate')!.value, 'yyyy-MM-dd'),
        
      }
      try {
        this.loader.start();
        this.subSink.sink = await this.mastService.GetTripSearchList(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    
    else{
      let searchFor:string='';
      let customer:string='VENDOR';
      if(this.data.search  == 'Opening Balance Search'){
        searchFor='OPNBAL'
         const body = {
      SearchFor:searchFor,
      TranNo:this.tranSearchForm.get('batchNo')?.value,
      FirstPara:customer,
      SecondPara:this.tranSearchForm.get('clientName')?.value,
      ThirdPara:this.tranSearchForm.get('phoneNo')?.value,
      FourthPara:this.tranSearchForm.get('email')?.value,
      FirstDate:this.tranSearchForm.get('fromDate')?.value,
      SecondDate:this.tranSearchForm.get('toDate')?.value,
        ...this.commonParams(),
      }
      try {
        this.loader.start();
        this.subSink.sink = await this.masterService.GetTranSearch(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
      }
      else if(this.data.search  == 'Receipt/Payment Search'){
        searchFor='RCTPMT'
        customer='CUSTOMER'
         const body = {
      SearchFor:searchFor,
      TranNo:this.tranSearchForm.get('batchNo')?.value,
      FirstPara:customer,
      SecondPara:this.tranSearchForm.get('clientName')?.value,
      ThirdPara:this.tranSearchForm.get('phoneNo')?.value,
      FourthPara:this.tranSearchForm.get('email')?.value,
      FirstDate:this.tranSearchForm.get('fromDate')?.value,
      SecondDate:this.tranSearchForm.get('toDate')?.value,
        ...this.commonParams(),
      }
      try {
        this.loader.start();
        this.subSink.sink = await this.masterService.GetTranSearch(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
      }
      else if(this.data.search  == 'Supplier Invoice Search'){
        searchFor='SUPINV'
         customer=this.tranSearchForm.get('clientName')?.value
      }
      else if(this.data.search  == 'Purchase-Order Search'){
        searchFor='PURCHASE'
        customer=this.tranSearchForm.get('clientName')?.value
      }
      else if(this.data.search == 'GRN Search'){
        searchFor='GRN'
         customer=this.tranSearchForm.get('clientName')?.value
      }
         const body = {
      SearchFor:searchFor,
      TranNo:this.tranSearchForm.get('batchNo')?.value,
      FirstPara:customer,
      SecondPara:'',
      ThirdPara:'',
      FourthPara:'',
      FirstDate:this.tranSearchForm.get('fromDate')?.value,
      SecondDate:this.tranSearchForm.get('toDate')?.value,
        ...this.commonParams(),
      }
      try {
        this.loader.start();
        this.subSink.sink = await this.masterService.GetTranSearch(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            this.rowData = [];
          }
          else if(res.data.length === 1){
           this.rowData=res.data
          }
          else {
            this.rowData = res['data'];
            this.calculateTotal(this.rowData);
            this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    
    
    
  }
 
  calculateTotal(data: any) {
    this.totalAmount = data.reduce((sum: number, item: any) => {
      return sum + (item?.tranAmount || 0);
    }, 0);
    this.afterDisc = data.reduce((sum: number, item: any) => {
      return sum + (item?.totalAmount || 0);
    }, 0);
  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  onRowClick(row: any, i: number) {
    this.dialogRef.close(row);
  }
  clear() {
    this.tranSearchForm.reset()
    this.tranSearchForm = this.formInit();
    this.displayMessage("", "");
  }
  onFilterData(event: any) {
    this.calculateTotal(event);
    // console.log(event)
  }
}
