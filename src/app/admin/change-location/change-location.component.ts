import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from 'src/app/Services/admin.service';
import { UserData } from '../admin.module';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import { UserDataService } from 'src/app/Services/user-data.service';
import { Item } from 'src/app/general/Interface/interface';
import { getPayload, getResponse } from 'src/app/general/Interface/admin/admin';
import { updateLocation } from 'src/app/utils/location.actions';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-change-location',
  templateUrl: './change-location.component.html',
  styleUrls: ['./change-location.component.css']
})
export class ChangeLocationComponent implements OnInit, OnDestroy {
  changeLocationForm!: FormGroup;
  companyList: Item[] = [];
  locationList: Item[] = [];
  userData!: UserData;
  private subSink!: SubSink;
  textMessageClass: string = "";
  retMessage: string = "";
  constructor(private adminService: AdminService, private userDataService: UserDataService, private toaster: ToastrService,
    private fb: FormBuilder, protected router: Router, private store: Store) {
    this.changeLocationForm = this.formInit();
    this.subSink = new SubSink();
    this.userData = new UserData();
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  ngOnInit() {
    this.loadData();
  }
  Close() {
    this.router.navigateByUrl('/home');
  }
  commonParams() {
    return {
      company: this.userDataService.userData.company,
      location: this.userDataService.userData.location,
      user: this.userDataService.userData.userID,
      refNo: this.userDataService.userData.sessionID,
    }
  }
 async loadData() {
    this.userData.location = this.userDataService.userData.location;
    const companybody: getPayload = {
      ...this.commonParams(),
      item: 'COMPANY'
    };
    try {
      // this.loader.start();
      const company$ = this.adminService.GetMasterItemsList(companybody);
      this.subSink.sink =await forkJoin([company$]).subscribe(
        ([companyRes]: any) => {
          this.companyList = companyRes['data'];
          if (this.companyList.length === 1) {
            this.changeLocationForm.get('company')!.patchValue(this.companyList[0].itemCode);
            this.companyChanged(this.companyList[0].itemCode)
          }
        },
        error => {
          this.displayMessage("Error: " + error.message, "red");
        }
      );

    } catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }
  }
  formInit() {
    return this.fb.group({
      company: ['', Validators.required],
      location: ['', Validators.required]
    });
  }
  onSubmit() {
    this.clearMsg();
    if (this.changeLocationForm.invalid) {
      return;
    }
    else {
      const storedUserData = sessionStorage.getItem('userData');
      try {
        if (storedUserData) {
          this.userData = this.userDataService.userData;
          this.userData.company = this.changeLocationForm.controls['company'].value;
          this.userData.location = this.changeLocationForm.controls['location'].value;
          const foundLocation = this.locationList.find((location: Item) => location.itemCode === this.changeLocationForm.controls['location'].value);
          const foundCompany = this.companyList.find((comp: Item) => comp.itemCode === this.changeLocationForm.controls['company'].value);
          if (foundLocation && foundCompany) {
            this.userData.defaultLocnName = foundLocation.itemName;
            this.userData.defaultCompanyName = foundCompany.itemName;
            this.userData.location = foundLocation.itemCode;
            this.userData.company = foundCompany.itemCode;

            const location = foundLocation.itemName;
            const company = foundCompany.itemName;
            this.store.dispatch(updateLocation({ location, company }));
            this.toaster.success(
              `Location changed to <br><strong><span class="red-text">${foundLocation.itemName}</span></strong>`,
              "Success",
              {
                enableHtml: true, // Ensure HTML is enabled
                disableTimeOut: false // Optional: set to true to prevent auto-close
              }
            );
            // this.toaster.success("Location changed to " + foundLocation.itemName, "Success");
            this.userDataService.updateUserData(this.userData)
              .then(() => {
                this.router.navigate(['/home']);

              })
              .catch(error => {
                this.displayMessage("Error: " + error.message, "red");
              });
          }
          else {
            this.displayMessage("Error: Location not found.", "red");
            return;
          }
        }

      } catch (error:any) {
        this.displayMessage("Error: " + error.message, "red");
      }
    }
  }
  locationChanged(event: any) {
  
    this.displayMessage("", "");
    const foundLocation = this.locationList.find((location: Item) => location.itemCode === this.changeLocationForm.controls['location'].value);
    if (this.userDataService.userData.location.toUpperCase() ===this.currLoc.toUpperCase() && this.userDataService.userData.company == this.changeLocationForm.controls['company'].value) {
      this.displayMessage(`Your already in ${foundLocation?.itemName} location!`, "red");
      return;
    }
  }
  private displayMessage(message: string, cssClass: string) {
    this.retMessage = message;
    this.textMessageClass = cssClass;
  }
  companyChanged(event: any) {
    this.locationList = [];
    this.changeLocationForm.controls.location.patchValue('');
    this.clearMsg();
    const locationbody = {
      ...this.commonParams(),
      company: this.changeLocationForm.controls.company.value,
      item: "CMPUSERBRANCH"
    };
    try {
      this.subSink.sink = this.adminService.GetMasterItemsList(locationbody).subscribe((res: getResponse) => {
        if (res.status.toUpperCase() === "SUCCESS") {
          this.locationList = res['data'];
          if (this.locationList.length === 1) {
            this.changeLocationForm.controls['location'].patchValue(this.locationList[0].itemCode, { emitEvent: false });
          }
        }
        else {
          this.displayMessage("Error: " + res.message, "red");
        }
      });
    }
    catch (ex: any) {
      this.displayMessage("Exception: " + ex.message, "red");
    }

  }



  clearMsg() {
  this.displayMessage("","");
  }
  clear() {
    this.clearMsg();
    this.locationList = [];
    this.changeLocationForm = this.formInit();
  }
}
