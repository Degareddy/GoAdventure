import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilitiesRoutingModule } from './utilities-routing.module';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GrievancesComponent } from './grievances/grievances.component';
import { TenantEnquiryComponent } from './tenant-enquiry/tenant-enquiry.component';
import { LandlordEnquiryComponent } from './landlord-enquiry/landlord-enquiry.component';
import { GrievanceServiceComponent } from './grievance-service/grievance-service.component';
import { GrievanceCostsComponent } from './grievance-service/grievance-costs/grievance-costs.component';
import { TechnicianComponent } from './grievance-service/technician/technician.component';
import { GeneralModule } from '../general/general.module';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { SiteFilesUploadComponent } from './site-files-upload/site-files-upload.component';

@NgModule({
  declarations: [
    ChangePasswordComponent,
    TenantEnquiryComponent,
    LandlordEnquiryComponent,
    GrievancesComponent,
    GrievanceServiceComponent,
    GrievanceCostsComponent,
    TechnicianComponent,
    SiteFilesUploadComponent,
  ],
  imports: [
    CommonModule,
    UtilitiesRoutingModule,
    GeneralModule
  ],
  exports: [
    GrievancesComponent,
    ChangePasswordComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class UtilitiesModule { }
