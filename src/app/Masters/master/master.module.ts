import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterRoutingModule } from './master-routing.module';
import { MaterialModule } from 'src/app/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MasterItemsComponent } from './master-items/master-items.component';
import { ExchangeRatesComponent } from './exchange-rates/exchange-rates.component';
import { ReportRemarksComponent } from './report-remarks/report-remarks.component';
import { ChangeCompanyComponent } from './change-company/change-company.component';
import { DocumentNumbersComponent } from './document-numbers/document-numbers.component';
import { PeriodClosureComponent } from './period-closure/period-closure.component';
import { SystemParametersComponent } from './system-parameters/system-parameters.component';
import { HelpUpdateComponent } from './help-update/help-update.component';

@NgModule({
  declarations: [
    // CustomerComponent,
    // CustomerSearchComponent,
    // CustomerDetailsComponent,
    // CustomerAddressesComponent,
    // CustomerContactsComponent,
    MasterItemsComponent,
    ExchangeRatesComponent,
    ReportRemarksComponent,
    ChangeCompanyComponent,
    DocumentNumbersComponent,
    PeriodClosureComponent,
    SystemParametersComponent,
    HelpUpdateComponent
  ],
  imports: [
    CommonModule,
    MasterRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class MasterModule { }
