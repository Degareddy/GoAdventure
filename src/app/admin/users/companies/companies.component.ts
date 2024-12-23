import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Item } from 'src/app/general/Interface/interface';
import { AdminService } from 'src/app/Services/admin.service';
import { MastersService } from 'src/app/Services/masters.service';
import { UserDataService } from 'src/app/Services/user-data.service';
import { SubSink } from 'subsink';
import { CompanyClass, userCompanyClass } from '../../admin.class';
import { getPayload } from 'src/app/general/Interface/admin/admin';
import { forkJoin } from 'rxjs';
import { PropertiesComponent } from '../properties/properties.component';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class CompaniesComponent implements OnInit {

  public companyForm!: FormGroup;
  

  @Input() max: any;
  private compCls: userCompanyClass;
  today = new Date();
  textMessageClass: string = "";
  retMessage: string = "";
  rowData: any = [];
  companyName:string='';
  branchList: Item[] = [];
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;
  public gridOptions!: GridOptions;
  pageSizes = [25, 50, 100, 250, 500];
  pageSize = 25;
  private subsink!: SubSink;
  companyList: Item[] = [];
  columnDefs: any = [
    { field: "companyName", headerName: "Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "companyId", headerName: "Id", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
    { field: "userName", headerName: "User Name", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "mapStatus", headerName: "Map Status", sortable: true, filter: true, resizable: true, flex: 1 },
    { field: "isDefault", headerName: "Is Default", sortable: true, filter: true, resizable: true, flex: 1 },
    // {
    //   field: "dateMapped", headerName: "Mapped On", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
    //     // Format date as dd-MM-yyyy
    //     // Format date as dd-MM-yyyy
    //     if (params.value) {  isDefault
    //       const date = new Date(params.value);
    //       const day = date.getDate().toString().padStart(2, '0');
    //       const month = (date.getMonth() + 1).toString().padStart(2, '0');
    //       const year = date.getFullYear();
    //       return `${day}-${month}-${year}`;
    //     }
    //     return null;
    //   },
    // },
    // { field: "branch", headerName: "Branch", sortable: true, filter: true, resizable: true, flex: 1, hide: true },
  ];
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private adminService: AdminService, public dialog: MatDialog,
    private masterService: MastersService, protected router: Router, private userDataService: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, userId: string }) {
    this.companyForm = this.formInit();
    this.compCls = new userCompanyClass();
    this.subsink = new SubSink();

  }

  ngOnInit(): void {

    this.loadData();
  }
  loadData() {
    const companybody: getPayload = {
      ...this.commonParams(),
      item: "COMPANY"

    };
    const mappedCompanyList = {
      ...this.commonParams(),
      item: this.data.userId,
    }
    const service1 = this.adminService.GetMasterItemsList(companybody);
    const service2 = this.adminService.GetUserMappedCompanies(mappedCompanyList);
    try {
      this.subsink.sink = forkJoin([service1, service2]).subscribe(
        (results: any[]) => {
          this.loader.stop();
          const res1 = results[0];
          if (res1.status.toUpperCase() === "SUCCESS") {
            this.companyList = res1.data;
            if (this.companyList.length === 1) {
              this.companyForm.patchValue({ company: this.companyList[0].itemCode });
              // this.accRightsForm.controls['company'].patchValue(this.companyList[0].itemCode, { emitEvent: false });
              // this.companyChanged();
            }
          }
          else {
            this.displayMessage("Error: Company list empty!", "red");
          }
          const res2 = results[1];
          if (res2.status.toUpperCase() === "SUCCESS") {
            // console.log(res2);
            this.rowData = res2.data;
          }
          else {
            this.displayMessage("Error: " + res2.message, "red");
          }

        },
        (error: any) => {
          this.loader.stop();
          this.displayMessage("Error: " + error.message, "red");
        }
      );
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }

  
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID
    }

  }

  close() {
    this.router.navigateByUrl('/home');
  }
  clear() {
    this.companyForm = this.formInit();
    this.displayMessage("","");
  }
  Map() {
   
     const body = {
      ...this.commonParams(),
      Mode:this.data.mode,
      CompanyId: this.companyForm.get('company')?.value,
      
      UserId:this.data.userId,
      IsDefault:this.companyForm.get('Map')?.value,
      MapStatus:'map',
     };
        try {
          this.loader.start();
          this.subsink.sink =  this.adminService.UpdateUserCompanies(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
              this.displayMessage("Error: " + res.message, "green");
              this.loadData();
            } else {
              // this.handleError(res);
              this.displayMessage("Error: " + res.message, "red");
            }
          });
        } catch (ex: any) {
          this.displayMessage("Exception: " + ex.message, "red");
          // this.handleError(ex);
        }

  }
  unMap() {
    const body = {
      ...this.commonParams(),
      Mode:this.data.mode,
      CompanyId: this.companyForm.get('company')?.value,
      
      UserId:this.data.userId,
      IsDefault:this.companyForm.get('Map')?.value,
      MapStatus:'unmap',
     };
        try {
          this.loader.start();
          this.subsink.sink =  this.adminService.UpdateUserCompanies(body).subscribe((res: any) => {
            this.loader.stop();
            if (res.status.toUpperCase() != "FAIL" && res.status.toUpperCase() != "ERROR") {
              this.displayMessage("Error: " + res.message, "green");
              this.loadData();
            } else {
              // this.handleError(res);
              this.displayMessage("Error: " + res.message, "red");
            }
          });
        } catch (ex: any) {
          this.displayMessage("Exception: " + ex.message, "red");
          // this.handleError(ex);
        }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    // debugger;
    // this.branchCls.branch = event.data.branch;
    try {
      this.companyForm.patchValue({
        company: event.data.companyId,
        // date: event.data.dateMapped,
      })
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }


  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  companyChanges(value: string) {
    this.companyName= this.companyList.find((o: any) => o.itemCode === value)?.itemName || "";
  }
  formInit() {
    return this.fb.group({
      company: ['', Validators.required],
      date: [new Date(), Validators.required],
      Map:[false],
    });
  }
  properties() {
    const dialogRef: MatDialogRef<PropertiesComponent> = this.dialog.open(PropertiesComponent, {
      width: '50%',
      disableClose: true,
      data: { mode: this.data.mode, userId: this.data.userId }
    });

  }
}
