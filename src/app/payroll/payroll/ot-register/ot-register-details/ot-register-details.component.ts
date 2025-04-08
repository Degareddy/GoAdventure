import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserData } from '../../payroll.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { MastersService } from 'src/app/Services/masters.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-ot-register-details',
  templateUrl: './ot-register-details.component.html',
  styleUrls: ['./ot-register-details.component.css']
})
export class OtRegisterDetailsComponent implements OnInit {

  userData: any;
  private subSink!: SubSink;
  masterParams!: MasterParams;
  retMessage!: string;
  textMessageClass!: string;
  purReqHdrForm!: FormGroup;
  slNum!: string;

  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;

  constructor(protected purchreqservice: PurchaseService, private fb: FormBuilder, private payService: PayrollService,private userDataService: UserDataService,
    private loader: NgxUiLoaderService, @Inject(MAT_DIALOG_DATA) public data: any,private masterService: MastersService) {
    this.masterParams = new MasterParams();
    this.purReqHdrForm = this.formInit();
    this.displayColumns = ["slNo", "tranNo", "employee", "fromDateTime", "toDateTime",
      "otHours", "otRate", "otAmount", "remarks"];
      this.subSink = new SubSink();

  }
  formInit() {
    return this.fb.group({
      // slNo: [''],
      employee: [''],
      fromDateTime: [''],
      toDateTime: [''],
      otHours: [''],
      otRate: [''],
      otAmount: [''],
      remarks: ['']
      // pendingQty: [''],
      // orderingQty: [''],
      // amount: [''],
      // remarks: ['']
    });
  }
  ngOnInit(): void {
    //console.log(this.data);
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    this.get(this.data);
  }
  get(tarnNO: string) {
    this.masterParams.tranNo = tarnNO;
    this.masterParams.langId = this.userData.langId;;
    this.masterParams.company = this.userData.company;
    this.masterParams.location = this.userData.location;
    this.masterParams.user = this.userData.userID;
    this.masterParams.refNo = this.userData.sessionID;
    // //console.log(this.masterParams);
    try {
      this.loader.start();
      this.payService.GetOTRegisterDetails(this.masterParams).subscribe((res: any) => {
        this.loader.stop();
        //console.log(res);
        this.dataSource = res['data'];
        this.dataSource = new MatTableDataSource(res['data']);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.matsort;
      });
    }
    catch (ex: any) {
      //console.log(ex);
      this.retMessage = ex;
      this.textMessageClass = 'red';
    }

  }
  onSubmit() {
    //console.log(this.purReqHdrForm.value);
    const body={
      
      "Company":this.userDataService.userData.company,
       "Location":this.userDataService.userData.location,
       "User":this.userDataService.userData.userID,
       "RefNo":this.userDataService.userData.sessionID,
       "Mode":this.data.mode,
       "TranNo":this.data.tranNo,
       "SlNo":this.slNum,
       "Employee":this.purReqHdrForm.get('employee')?.value,
       "ShiftNo":'',
       "FromDateTime":this.purReqHdrForm.get('fromDateTime')?.value,
       "ToDateTime":this.purReqHdrForm.get('toDateTime')?.value,
       "OTHours":this.purReqHdrForm.get('otHours')?.value,
       "OTRate":this.purReqHdrForm.get('otRate')?.value,
       "OTAmount":this.purReqHdrForm.get('otAmount')?.value,
       "Remarks":this.purReqHdrForm.get('remarks')?.value,
      
 
     }
    
     try {
       this.loader.start();
       this.subSink.sink = this.payService.UpdateOTRegisterDetails(body).subscribe((res: any) => {
         this.loader.stop();
         if (res.status.toUpperCase() === "SUCCESS") {
           
             this.textMessageClass = 'green';
             this.retMessage = res.message;
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
  onRowClick(row: any, i: number) {
    //console.log(row, i);
    this.selectedRowIndex = i;
    this.slNum = row.slNo;
    this.purReqHdrForm.patchValue(row);
  }
}
