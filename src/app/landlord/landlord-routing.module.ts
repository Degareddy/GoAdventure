import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrievancesComponent } from '../utilities/grievances/grievances.component';
import { LandlordGuard } from './_guard/landlord.guard';
import { ChangePasswordComponent } from '../utilities/change-password/change-password.component';
import { ReprotsComponent } from '../general/reprots/reprots.component';
import { PropertyReportsComponent } from '../project/property-reports/property-reports.component';

const routes: Routes = [
  { path: 'grievances', component: GrievancesComponent, canActivate: [LandlordGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [LandlordGuard] },
  { path: 'statement', component: ReprotsComponent, canActivate: [LandlordGuard] },
  { path: 'report', component: PropertyReportsComponent, canActivate: [LandlordGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandlordRoutingModule { }
