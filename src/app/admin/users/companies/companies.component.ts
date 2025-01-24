import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
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
import { getPayload, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { forkJoin } from 'rxjs';
import { PropertiesComponent } from '../properties/properties.component';
import { DatePipe } from '@angular/common';
import { Items, TextClr,displayMsg } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class CompaniesComponent implements OnInit, OnDestroy {
  public companyForm!: FormGroup;
  @Input() max: any;
  private compCls: userCompanyClass;
  today = new Date();
  textMessageClass: string = "";
  retMessage: string = "";
  rowData: any = [];
  companyName: string = '';
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
    {
      field: "tranDate", headerName: "Date", sortable: true, filter: true, resizable: true, flex: 1, valueFormatter: function (params: any) {
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
  public rowSelection: 'single' | 'multiple' = 'multiple';
  constructor(private fb: FormBuilder, private loader: NgxUiLoaderService, private adminService: AdminService, public dialog: MatDialog,
    private masterService: MastersService, protected router: Router, private userDataService: UserDataService,private datepipe:DatePipe,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string, userId: string }) {
    this.companyForm = this.formInit();
    this.compCls = new userCompanyClass();
    this.subsink = new SubSink();

  }
  ngOnDestroy(): void {
    this.subsink.unsubscribe();
  }

  ngOnInit(): void {

    this.loadData();
  }
  loadData() {
    const companybody: getPayload = {
      ...this.commonParams(),
      item: Items.COMPANY,
      mode:this.data.mode

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
          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.companyList = res1.data;
            if (this.companyList.length === 1) {
              this.companyForm.patchValue({ company: this.companyList[0].itemCode });
            }
          }
          else {
            this.displayMessage("Error: Company list empty!", TextClr.red);
          }
          const res2 = results[1];
          if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
            // console.log(res2);
            this.rowData = res2.data;
          }
          else {
            this.displayMessage(displayMsg.ERROR+ res2.message, TextClr.red);
          }

        },
        (error: any) => {
          this.loader.stop();
          this.displayMessage(displayMsg.ERROR + error.message, TextClr.red);
        }
      );
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
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
    this.displayMessage("", "");
  }
  Map() {

    const body = {
      ...this.commonParams(),
      Mode: this.data.mode,
      CompanyId: this.companyForm.get('company')?.value,
      UserId: this.data.userId,
      IsDefault: this.companyForm.get('Map')?.value,
      MapStatus: 'map',
      TranDate: this.datepipe.transform(this.companyForm.get('date')?.value, 'dd-MM-yyyy')

    };
    try {
      this.loader.start();
      this.subsink.sink = this.adminService.UpdateUserCompanies(body).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          this.loadData();
        } else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  unMap() {
    const body = {
      ...this.commonParams(),
      Mode: this.data.mode,
      CompanyId: this.companyForm.get('company')?.value,

      UserId: this.data.userId,
      IsDefault: this.companyForm.get('Map')?.value,
      MapStatus: 'unmap',
      TranDate: this.companyForm.controls['date'].value
    };
    try {
      this.loader.start();
      this.subsink.sink = this.adminService.UpdateUserCompanies(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() != AccessSettings.FAIL && res.status.toUpperCase() != AccessSettings.ERROR) {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
          this.loadData();
        } else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        }
      });
    } catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }
  }
  onPageSizeChanged() {
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.pageSize);
    }
  }

  onRowSelected(event: any) {
    this.companyForm.get('company')?.patchValue(event.data.company);
    this.companyForm.get('Map')?.patchValue(event.data.isDefault);
    this.companyForm.get('date')?.patchValue(event.data.tranDate);
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const gridApi = params.api;
    gridApi.addEventListener('rowClicked', this.onRowSelected.bind(this));
  }
  companyChanges(value: string) {
    this.companyName = this.companyList.find((o: any) => o.itemCode === value)?.itemName || "";
  }
  formInit() {
    return this.fb.group({
      company: ['', Validators.required],
      date: [new Date(), Validators.required],
      Map: [false],
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
