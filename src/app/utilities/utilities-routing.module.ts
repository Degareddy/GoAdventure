import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterItemsComponent } from '../Masters/master-items/master-items.component';
import { DocumentNumbersComponent } from './document-numbers/document-numbers.component';
import { DocGuard } from './_guard/doc.guard';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { GrievancesComponent } from './grievances/grievances.component';
import { TenantEnquiryComponent } from './tenant-enquiry/tenant-enquiry.component';
import { LandlordEnquiryComponent } from './landlord-enquiry/landlord-enquiry.component';
import { SiteFilesUploadComponent } from './site-files-upload/site-files-upload.component';
import { DairyComponent } from './dairy/dairy.component';

const routes: Routes = [
  { path: 'master-items', component: MasterItemsComponent, canActivate: [DocGuard] },
  { path: 'document-numbers', component: DocumentNumbersComponent, canActivate: [DocGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [DocGuard] },
   { path: 'grievances', component: GrievancesComponent, canActivate: [DocGuard] },
  // { path: 'grievance-service', component: GrievanceServiceComponent, canActivate: [DocGuard] },
  { path: 'tenant-enquiry', component: TenantEnquiryComponent, canActivate: [DocGuard] },
  { path: 'landlord-enquiry', component: LandlordEnquiryComponent, canActivate: [DocGuard] },
  { path: 'site-files', component: SiteFilesUploadComponent, canActivate: [DocGuard] },
  { path: 'diary', component: DairyComponent, canActivate: [DocGuard] },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UtilitiesRoutingModule { }
