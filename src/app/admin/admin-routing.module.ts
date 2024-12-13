import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from './company/company.component';
import { UsersComponent } from './users/users.component';
import { AccessRightsComponent } from './access-rights/access-rights.component';
import { ReportRightsComponent } from './report-rights/report-rights.component';
import { ChangeLocationComponent } from './change-location/change-location.component';
import { GroupCompanyComponent } from './group-company/group-company.component';
import { AdminGuard } from './_guard/admin.guard';

const routes: Routes = [
  { path: 'company', component: CompanyComponent, canActivate: [AdminGuard] },
  { path: 'groupcompany', component: GroupCompanyComponent, canActivate: [AdminGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AdminGuard] },
  { path: 'access-rights', component: AccessRightsComponent, canActivate: [AdminGuard] },
  { path: 'report-rights', component: ReportRightsComponent, canActivate: [AdminGuard] },
  { path: 'change-location', component: ChangeLocationComponent, canActivate: [AdminGuard] }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }
