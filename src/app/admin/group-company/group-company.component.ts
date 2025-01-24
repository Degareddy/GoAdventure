import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MastersService } from 'src/app/Services/masters.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { UserData } from '../admin.module';
import { AdminService } from 'src/app/Services/admin.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { displayMsg, Items, TextClr } from 'src/app/utils/enums';
import { AccessSettings } from 'src/app/utils/access';
import { SaveApiResponse } from 'src/app/general/Interface/admin/admin';

@Component({
  selector: 'app-group-company',
  templateUrl: './group-company.component.html',
  styleUrls: ['./group-company.component.css']
})
export class GroupCompanyComponent implements OnInit, OnDestroy {
  groupCompany!: FormGroup;
  dataSource: any = [];
  displayColumns: any = []
  selectedRowIndex!: number;
  groupcompany: any = []
  grpCode!: string;
  retMessage!: string;
  textMessageClass!: string;
  private subSink = new SubSink();
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) matsort!: MatSort;
  constructor(private fb: FormBuilder, private masterService: MastersService, private userdataService: UserDataService,
    private loader: NgxUiLoaderService, private adService: AdminService,
    private toastr: ToastrService) {
    this.subSink = new SubSink();
    this.displayColumns = ["slNo", "company", "country", "mapped", "update"];
    this.groupCompany = this.formInit();

  }
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit(): void {
    this.loadData();
  }
  loadData() {

    const body = {
      Company: this.userdataService.userData.company,
      Location: this.userdataService.userData.location,
      Item: Items.GROUPCOMP,
      refNo: this.userdataService.userData.sessionID,
      user: this.userdataService.userData.userID
    };
    try {
      this.loader.start();
      this.subSink.sink = this.masterService.GetMasterItemsList(body).subscribe((res: any) => {
        this.loader.stop();
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.groupcompany = res.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
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

  updateMapStatus(row: any, isChecked: boolean,i:number) {
    row.mapStatus = isChecked ? 'Map' : 'UnMap';
    // row.mapStatus= isChecked ? 'Map' : 'UnMap';
  }
  groupCompanyChange(event: any) {
    if (event.value) {
      this.grpCode = event.value;
      const body = {
        Company: this.userdataService.userData.company,
        Location: this.userdataService.userData.location,
        Item: event.value,
        User: this.userdataService.userData.userID,
        refNo: this.userdataService.userData.sessionID
      };
      try {
        this.loader.start();
        this.subSink.sink = this.adService.GetGCMappings(body).subscribe((res: any) => {
          this.loader.stop();
          console.log(res);
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.dataSource = res.data;
            for (let i = 0; i < this.dataSource.length; i++) {
              this.dataSource[i].slNo = i + 1
            }
            this.dataSource = new MatTableDataSource(res['data']);

            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.matsort;
          } else {
            this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.loader.stop();
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
      }
    }
    else {
      this.dataSource = []
    }

  };
  onRowClick(row: any, i: number) {

  }
  update(row: any,i:number) {
    row.groupCode = this.grpCode;
    row.user = this.userdataService.userData.userID;
    row.refNo = this.userdataService.userData.sessionID;
    row.mode = row.mapStatus;
    delete row.mapStatus;
    try {
      this.loader.start();
      this.subSink.sink = this.adService.UpdateGCMappings(row).subscribe((res: SaveApiResponse) => {
        this.loader.stop();
        if (res.retVal < 100 || res.retVal > 200) {
          this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
        } else {
          this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
        }
      });
    } catch (ex: any) {
      this.loader.stop();
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  formInit() {
    return this.fb.group({
      groupCompany: ['']
    });
  }
}
