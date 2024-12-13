import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

import { CustomerComponent } from './customer/customer.component';
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { CustomerAddressesComponent } from './customer-addresses/customer-addresses.component';
import { CustomerContactsComponent } from './customer-contacts/customer-contacts.component';
import { MasterItemsComponent } from './master-items/master-items.component';
import { ExchangeRatesComponent } from './exchange-rates/exchange-rates.component';
import { ReportRemarksComponent } from './report-remarks/report-remarks.component';
import { ChangeCompanyComponent } from './change-company/change-company.component';
import { DocumentNumbersComponent } from './document-numbers/document-numbers.component';
import { PeriodClosureComponent } from './period-closure/period-closure.component';
import { SystemParametersComponent } from './system-parameters/system-parameters.component';
import { HelpUpdateComponent } from './help-update/help-update.component';

const routes: Routes = [
  // {
  // path: 'master',
  // component: DefaultComponent,
  // children: [
    // { path: 'customer', component: CustomerComponent },
    { path: 'customer-details/:code', component: CustomerDetailsComponent },
    { path: 'customer-addresses/:code', component: CustomerAddressesComponent },
    { path: 'customer-contacts/:code/:slno', component: CustomerContactsComponent },
    { path: 'master-items', component: MasterItemsComponent },
    { path: 'exchange-rates', component: ExchangeRatesComponent },
    { path: 'report-remarks', component: ReportRemarksComponent },
    { path: 'change-company', component: ChangeCompanyComponent },
    { path: 'document-numbers', component: DocumentNumbersComponent },
    { path: 'period-closure', component: PeriodClosureComponent },
    { path: 'system-parameters', component: SystemParametersComponent },
    { path: 'help-update', component: HelpUpdateComponent },
  ]
// }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
