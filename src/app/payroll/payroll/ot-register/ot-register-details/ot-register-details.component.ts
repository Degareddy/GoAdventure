import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UserData } from '../../payroll.module';
import { MasterParams } from 'src/app/Masters/Modules/masters.module';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { PayrollService } from 'src/app/Services/payroll.service';
import { MastersService } from 'src/app/Services/masters.service';
import { PurchaseService } from 'src/app/Services/purchase.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { displayMsg, TextClr, TranStatus, Type } from 'src/app/utils/enums';
import { UtilitiesService } from 'src/app/Services/utilities.service';
import { nameCountResponse } from 'src/app/general/Interface/admin/admin';
import { SearchPartyComponent } from 'src/app/general/search-party/search-party.component';
import { AccessSettings } from 'src/app/utils/access';
import { firstValueFrom, map, startWith } from 'rxjs';

interface autoComplete {
  itemCode: string
  itemName: string
  itemDetails:string

}
interface params {
  itemCode: string
  itemName: string
}
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
  autoFilteredEmployee: autoComplete[] = [];
  dialogOpen: boolean = false;


  selEmoCode:string=''
  displayColumns: string[] = [];
  dataSource: any;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  selectedRowIndex: number = -1;
  employeeList:autoComplete[]=[];
  filteredEmployee: any[] = [];

  constructor(protected purchreqservice: PurchaseService, private fb: FormBuilder,
    private utlService:UtilitiesService,
    public dialog: MatDialog,  private payService: PayrollService,private userDataService: UserDataService,
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
  async ngOnInit(): Promise<void> {
    this.employeeList=await  this.loadCust("EMPLOYEE");
    this.filteredEmployee=this.employeeList
    
    //console.log(this.data);
    const storedUserData = sessionStorage.getItem('userData');
    if (storedUserData) {
      this.userData = JSON.parse(storedUserData) as UserData;
      // //console.log(this.userData);
    }
    this.purReqHdrForm.get('employee')!.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value?.itemName || ''),
        map(name => this._filterEmployee(name))
      )
      .subscribe(filtered => {
        this.autoFilteredEmployee = filtered;
      });
    this.get(this.data);
  }
  displayEmployee(item: autoComplete): string {
    return item && item.itemName ? item.itemName : '';
  }
  
  filerEmployee(value: any) {
    const filterValue = value.toLowerCase();
    return this.employeeList.filter((cust: params) => cust.itemName.toLowerCase().includes(filterValue));
  }
  private _filterEmployee(value: string): autoComplete[] {
    const filterValue = value.toLowerCase();
  
    return this.employeeList.filter(option =>
      option.itemName.toLowerCase().includes(filterValue) ||
      option.itemCode.toLowerCase().includes(filterValue) ||
      option.itemDetails.toLowerCase().includes(filterValue)
    );
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
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }
  }
  onEmployeeSearch() {
      const body = {
        ...this.commonParams(),
        Type: Type.EMPLOYEE,
        PartyName: this.purReqHdrForm.get('employee')!.value
      }
      try {
        this.subSink.sink = this.utlService.GetNameSearchCount(body).subscribe((res: nameCountResponse) => {
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            if (res && res.data && res.data.nameCount === 1) {
              this.purReqHdrForm.controls['employee'].patchValue(res.data.selName);
              this.selEmoCode = res.data.selCode;
            }
            else {
              if (!this.dialogOpen) {
                const dialogRef: MatDialogRef<SearchPartyComponent> = this.dialog.open(SearchPartyComponent, {
                  width: '90%',
                  disableClose: true,
                  data: {
                    PartyName: this.purReqHdrForm.get('employee')!.value, PartyType: Type.EMPLOYEE,
                    search: 'Employee Search'
                  }
                });
                this.dialogOpen = true;
                dialogRef.afterClosed().subscribe(result => {
                  if (result != true && result != undefined) {
                    this.purReqHdrForm.controls['employee'].patchValue(result.partyName);
                    this.selEmoCode = result.code;
                  }
                  this.dialogOpen = false;
                });
              }
  
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    private displayMessage(message: string, cssClass: string) {
      this.retMessage = message;
      this.textMessageClass = cssClass;
    }
    async loadCust(partyType: string): Promise<autoComplete[]> {
        
        let resList:autoComplete[]=[]
        const body = {
          Company: this.userDataService.userData.company,
          Location: this.userDataService.userData.location,
          City: "",
          Email: "",
          FullAddress: "",
          Phones: "",
          PartyName: "",
          PartyStatus: TranStatus.OPEN,
          RefNo: this.userDataService.userData.sessionID,
          User: this.userDataService.userData.userID,
          PartyType: partyType,
        };
      
        try {
          const res: any = await firstValueFrom(this.utlService.GetPartySearchList(body));
          
          if (res.status.toUpperCase() === AccessSettings.FAIL || res.status.toUpperCase() === AccessSettings.ERROR) {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
            return [];
          }
      
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          resList=res.data.map((item: any) => ({
            itemCode: item.code,
            itemName: item.partyName,
            itemDetails: item.phones || item.email || 'No Email Or Phone number'
          }));
          return resList
        } catch (ex: any) {
          this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
          return [];
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
