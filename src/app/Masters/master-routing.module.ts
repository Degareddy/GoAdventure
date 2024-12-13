import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterItemsComponent } from './master-items/master-items.component';
import { ExchangeRatesComponent } from './exchange-rates/exchange-rates.component';
import { ReportRemarksComponent } from './report-remarks/report-remarks.component';
import { DocumentNumbersComponent } from '../utilities/document-numbers/document-numbers.component';
import { PeriodClosureComponent } from './period-closure/period-closure.component';
import { SystemParametersComponent } from './system-parameters/system-parameters.component';
import { HelpUpdateComponent } from './help-update/help-update.component';
import { MasterGuard } from './_guard/master.guard';

const routes: Routes = [
    { path: 'master-items', component: MasterItemsComponent,canActivate:[MasterGuard] },
    { path: 'exchange-rates', component: ExchangeRatesComponent,canActivate:[MasterGuard] },
    { path: 'report-remarks', component: ReportRemarksComponent,canActivate:[MasterGuard] },
    { path: 'document-numbers', component: DocumentNumbersComponent ,canActivate:[MasterGuard]},
    { path: 'period-closure', component: PeriodClosureComponent ,canActivate:[MasterGuard]},
    { path: 'system-parameters', component: SystemParametersComponent ,canActivate:[MasterGuard]},
    { path: 'help-update', component: HelpUpdateComponent ,canActivate:[MasterGuard]},
  ]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
