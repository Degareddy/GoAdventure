import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

import { AssetGroupsComponent } from './asset-groups/asset-groups.component';
import { ConditionComponent } from './condition/condition.component';
import { AssetsComponent } from './assets/assets.component';
import { RelocateComponent } from './relocate/relocate.component';
import { LeasingComponent } from './leasing/leasing.component';
import { InsuranceComponent } from './insurance/insurance.component';
import { AmcComponent } from './amc/amc.component';
import { AssetReportsComponent } from './asset-reports/asset-reports.component';
import { AssetDashboardComponent } from './asset-dashboard/asset-dashboard.component';
import { AssetTransferComponent } from './asset-transfer/asset-transfer.component';
import { AssetGuard } from './_guard/asset.guard';

const routes: Routes = [
  // {
  // path: 'assets',
  // component: DefaultComponent,
  // children: [
    { path: 'asset-groups', component: AssetGroupsComponent,canActivate:[AssetGuard] },
    { path: 'condition', component: ConditionComponent,canActivate:[AssetGuard] },
    { path: 'assets', component: AssetsComponent,canActivate:[AssetGuard] },
    { path: 'relocate', component: RelocateComponent,canActivate:[AssetGuard] },
    { path: 'leasing', component: LeasingComponent,canActivate:[AssetGuard] },
    { path: 'insurance', component: InsuranceComponent ,canActivate:[AssetGuard]},
    { path: 'amc', component: AmcComponent,canActivate:[AssetGuard] },
    { path: 'asset-transfer', component: AssetTransferComponent,canActivate:[AssetGuard]},
    { path: 'asset-reports', component: AssetReportsComponent ,canActivate:[AssetGuard]},
    { path: 'asset-dashboard', component: AssetDashboardComponent,canActivate:[AssetGuard] }
  ]
// }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssetsRoutingModule { }
