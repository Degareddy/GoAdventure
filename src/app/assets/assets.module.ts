import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssetsRoutingModule } from './assets-routing.module';
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
import { AssetLeaseDetailsComponent } from './leasing/asset-lease-details/asset-lease-details.component';
import { AssetAMCDetailsComponent } from './amc/asset-amc-details/asset-amc-details.component';
import { AssetTransferDetailsComponent } from './asset-transfer/asset-transfer-details/asset-transfer-details.component';
import { SearchEngineComponent } from '../general/search-engine/search-engine.component';
import { AssetDetailsComponent } from './assets/asset-details/asset-details.component';
import { GeneralModule } from '../general/general.module';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';


@NgModule({
  declarations: [
    AssetGroupsComponent,
    ConditionComponent,
    AssetsComponent,
    RelocateComponent,
    LeasingComponent,
    InsuranceComponent,
    AmcComponent,
    AssetReportsComponent,
    AssetDashboardComponent,
    AssetTransferComponent,
    AssetLeaseDetailsComponent,
    AssetAMCDetailsComponent,
    AssetTransferDetailsComponent,
    SearchEngineComponent,
    AssetDetailsComponent
  ],
  imports: [
    CommonModule,
    AssetsRoutingModule,
    GeneralModule
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class AssetsModule { }


