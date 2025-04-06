import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GrievancesComponent } from 'src/app/utilities/grievances/grievances.component';
import { TenantGuard } from '../_guard/tenant.guard';
import { ChangePasswordComponent } from 'src/app/utilities/change-password/change-password.component';
import { ReprotsComponent } from 'src/app/general/reprots/reprots.component';

const routes: Routes = [
  { path: 'grievances', component: GrievancesComponent, canActivate: [TenantGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [TenantGuard] },
  { path: 'statement', component: ReprotsComponent, canActivate: [TenantGuard] },
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TenantRoutingModule { }
