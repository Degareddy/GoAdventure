import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { CompanyComponent } from './company/company.component';
import { UsersComponent } from './users/users.component';
import { ChangeLocationComponent } from './change-location/change-location.component';
import { ReportRightsComponent } from './report-rights/report-rights.component';
import { AccessRightsComponent } from './access-rights/access-rights.component';
import { BranchesComponent } from './company/branches/branches.component';
import { UserDetailsComponent } from './users/user-details/user-details.component';
import { GroupCompanyComponent } from './group-company/group-company.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { PropertiesComponent } from './users/properties/properties.component';
import { GeneralModule } from '../general/general.module';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { CompaniesComponent } from './users/companies/companies.component';

@NgModule({
  declarations: [
    CompanyComponent,
    UsersComponent,
    AccessRightsComponent,
    ChangeLocationComponent,
    ReportRightsComponent,
    BranchesComponent,
    UserDetailsComponent,
    GroupCompanyComponent,
    PropertiesComponent,
    CompaniesComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    NgMultiSelectDropDownModule.forRoot(),
    GeneralModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})

export class AdminModule { }


export class CompanyData {
  public companyID!: string
  public name!: string
  public cmpDate!: Date
  public address1!: string
  public address2!: string
  public address3!: string
  public pO_PIN_ZIP!: string
  public city!: string
  public state!: string
  public country!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public fax!: string
  public email!: string
  public uRL!: string
  public vATNo!: string
  public pINNo!: string
  public logoLocn!: string
  public notes!: string
  public status!: string
}

export class UserData {
  public company!: string
  public location!: string
  public langId!: number
  public locationName!: string
  public userName!: string
  public userID!: string
  public userPassword!: string
  public userProfile!: string
  public userCompany!: string
  public defaultCompany!: string
  public defaultCompanyName!:string
  public defaultLocn!: string
  public joinDate!: Date
  public expiresOn!: Date
  public userStatus!: string
  public lastLoginOn!: Date
  public lastLoginFailOn!: Date
  public failAttempts!: number
  public maxAllowedFailAttempts!: number
  public remarks!: string
  public email!: string
  public reAssign!: boolean
  public sessionID: any;
  public mode!: string;
  defaultLocnName!:string;
  userCompanyName:string=""
}
