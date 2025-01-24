import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators, } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AdminService } from 'src/app/Services/admin.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import { getPayload, getResponse, SaveApiResponse } from 'src/app/general/Interface/admin/admin';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { AccessSettings } from 'src/app/utils/access';
import { displayMsg, Items, TextClr } from 'src/app/utils/enums';
interface IAcess {
  item_id: string;
  item_text: string;
}
@Component({
  selector: 'app-access-rights',
  templateUrl: './access-rights.component.html',
  styleUrls: ['./access-rights.component.css']
})
export class AccessRightsComponent implements OnInit, OnDestroy {
  accRightsForm!: FormGroup;
  usersListData: Item[] = [];
  selectedObjects!: any[];
  selectedItems: Array<IAcess> = [];
  modes: Item[] = [];
  companyList: Item[] = [];
  locationList: Item[] = [];
  pagesData: any;
  private subSink: SubSink;
  public loadContent: boolean = false;
  public dropdownData: any = [];
  // rightsAssigned: string[] = ['Add', 'Authorize', 'Delete', 'Modify', 'View'];
  rightsAvailable: string[] = [];
  selectedRightAssigned: string | null = null;
  selectedRightAvailable: string | null = null;
  textMessageClass: string = "";
  retMessage: string = "";
  mappedList: any = [];
  unMappedList: any = [];
  @ViewChild('frmClear') public sprFrm!: NgForm;
  constructor(private fb: FormBuilder, private userDataService: UserDataService,
    protected route: ActivatedRoute,
    protected router: Router,
    private adminService: AdminService,
    private loader: NgxUiLoaderService,
  ) {
    this.accRightsForm = this.formInit();
    this.subSink = new SubSink();
  }
  async ngOnInit() {
    this.setupValueChangeSubscriptions();
    await this.loadData();


  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  async pageChange() {
    if (this.accRightsForm.invalid) {
      return;
    }
    else {
      this.mappedList = [];
      this.unMappedList = [];
      const body = {
        company: this.accRightsForm.get('company')?.value,
        location: this.accRightsForm.get('location')?.value,
        user: this.accRightsForm.get('user')?.value,
        item: this.accRightsForm.get('page')?.value
      };
      try {
        this.loader.start();
        this.subSink.sink = await this.adminService.GetAccessModesMapping(body).subscribe((res: any) => {
          this.loader.stop();
          if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
            const data = res.data;
            this.mappedList = data.filter((item: any) => item.modeStatus.toUpperCase() === "MAPPED").map((item: any) => item.modeId);
            this.unMappedList = data.filter((item: any) => item.modeStatus.toUpperCase() !== "MAPPED").map((item: any) => item.modeId);
          } else {
            this.displayMessage(displayMsg.ERROR + res.message, TextClr.red);
          }
        });
      }
      catch (ex: any) {
        this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);

      }
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
  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
  setupValueChangeSubscriptions(): void {
    const fieldsToWatch = ['company', 'location', 'user'];
    fieldsToWatch.forEach(field => {
      this.accRightsForm.get(field)!.valueChanges.subscribe(() => {
        this.accRightsForm.get('page')!.patchValue('');
      });
    });
  }
  formInit() {
    this.loadContent = true;
    return this.fb.group({
      company: ['', [Validators.required, Validators.maxLength(50)]],
      location: ['', [Validators.required, Validators.maxLength(50)]],
      user: ['', [Validators.required, Validators.maxLength(50)]],
      page: ['', [Validators.required, Validators.maxLength(50)]],
      asUser: [''],
      asLocation: ['']
    });
  }
  close() {
    this.router.navigateByUrl('/home');
  }
  async loadData() {
    const companybody: getPayload = {
      ...this.commonParams(),
      item: Items.COMPANY

    };
    const pagesListbody: getPayload = {
      ...this.commonParams(),
      item: Items.PAGES
    };
    const userListbody: getPayload = {
      ...this.commonParams(),
      item: Items.USER
    };
    const service1 = this.adminService.GetMasterItemsList(companybody);
    const service2 = this.adminService.GetMasterItemsList(userListbody);
    const service3 = this.adminService.GetMasterItemsList(pagesListbody);
    this.subSink.sink = await forkJoin([service1, service2, service3]).subscribe(
      (results: any[]) => {
        this.loader.stop();
        const res1 = results[0];
        const res2 = results[1];
        const res3 = results[2];
        if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
          if (res1.status.toUpperCase() === AccessSettings.SUCCESS) {
            this.companyList = res1.data;
            if (this.companyList.length === 1) {
              this.accRightsForm.controls['company'].patchValue(this.companyList[0].itemCode, { emitEvent: false });
              this.companyChanged();
            }
          }
          else {
            this.displayMessage(displayMsg.ERROR + "Company List " + res1.message, TextClr.red);
          }

        }
        if (res2.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.usersListData = res2.data;
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Users List " + res2.message, TextClr.red);
        }
        if (res3.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.pagesData = res3.data;

        }
        else {
          this.displayMessage(displayMsg.ERROR + "Pages List " + res3.message, TextClr.red);
        }

      },
      (error: any) => {
        this.loader.stop();
        this.displayMessage(displayMsg.ERROR+ error.message, TextClr.red);
      }
    );


  }
  clearMsg() {
   this.displayMessage("","");
  }
  companyChanged() {
    this.locationList = [];
    this.accRightsForm.controls.location.patchValue('');
    this.clearMsg();
    const locationbody = {
      ...this.commonParams(),
      company: this.accRightsForm.controls.company.value,
      item: Items.CMPUSERBRANCH
    };
    try {
      this.subSink.sink = this.adminService.GetMasterItemsList(locationbody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
          this.locationList = res['data'];
          if (this.locationList.length === 1) {
            this.accRightsForm.controls['location'].patchValue(this.locationList[0].itemCode, { emitEvent: false });
          }
        }
        else {
          this.displayMessage(displayMsg.ERROR + "Location List " + res.message, TextClr.red);
        }
      });
    }
    catch (ex: any) {
      this.displayMessage(displayMsg.EXCEPTION + ex.message, TextClr.red);
    }

  }
  selectRight(right: string, list: 'assigned' | 'available') {
    if (list === 'assigned') {
      this.selectedRightAssigned = right;
      this.selectedRightAvailable = null;
    } else {
      this.selectedRightAvailable = right;
      this.selectedRightAssigned = null;
    }
  }

  moveRight() {
    if (this.selectedRightAvailable) {
      this.assignRights("INVOKE", this.selectedRightAvailable, "");
      const index = this.unMappedList.indexOf(this.selectedRightAvailable);
      if (index > -1) {
        this.unMappedList.splice(index, 1);
        this.mappedList.push(this.selectedRightAvailable);
        this.selectedRightAvailable = null;
      }

    }
  }

  moveLeft() {
    if (this.selectedRightAssigned) {
      this.assignRights("REVOKE", this.selectedRightAssigned, "")
      const index = this.mappedList.indexOf(this.selectedRightAssigned);
      if (index > -1) {
        this.mappedList.splice(index, 1);
        this.unMappedList.push(this.selectedRightAssigned);
        this.selectedRightAssigned = null;
      }
    }
  }

  moveAllRight() {
    this.mappedList.push(...this.unMappedList);
    this.unMappedList = [];
    this.selectedRightAssigned = null;
    this.assignRights("INVOKE", "ALL", "");
  }

  moveAllLeft() {
    this.unMappedList.push(...this.mappedList);
    this.mappedList = [];
    this.selectedRightAvailable = null;
    this.assignRights("REVOKE", "ALL", "");
  }
  assignRights(action: string, mode: string, asUser: string) {
    const body = {
      action: action,
      company: this.accRightsForm.get('company')?.value,
      location: this.accRightsForm.get('location')?.value,
      user: this.accRightsForm.get('user')?.value,
      screen: this.accRightsForm.get('page')?.value,
      mode: mode,
      asUser: asUser,
      refNo: this.userDataService.userData.sessionID,
      asLocation: this.accRightsForm.get('asLocation')?.value
    }
    this.loader.start();
    this.subSink.sink = this.adminService.ManageAccessModesMapping(body).subscribe((res: SaveApiResponse) => {
      this.loader.stop();
      if (res.status.toUpperCase() === AccessSettings.SUCCESS) {
        this.displayMessage(displayMsg.SUCCESS + res.message, TextClr.green);
      }
      else {
        this.displayMessage(displayMsg.ERROR+ res.message, TextClr.red);
      }
    });
  }
  assignAsUser() {
    this.assignRights("INVOKE", "ALL", this.accRightsForm.get('asUser')?.value,);
  }
}
