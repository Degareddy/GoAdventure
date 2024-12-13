import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlRoutingModule } from './gl-routing.module';
import { VatDetailsComponent } from './vat-details/vat-details.component';
import { FinPeriodsComponent } from './fin-periods/fin-periods.component';
import { BanksComponent } from './banks/banks.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { DepoitsComponent } from './depoits/depoits.component';
import { BankEntriesComponent } from './bank-entries/bank-entries.component';
import { ReconciliationComponent } from './reconciliation/reconciliation.component';
import { GlReportsComponent } from './gl-reports/gl-reports.component';
import { ExpenseAnalysisComponent } from './expense-analysis/expense-analysis.component';
import { GrossMarginComponent } from './gross-margin/gross-margin.component';
import { VatSubmitComponent } from './vat-submit/vat-submit.component';
import { GlDashboardComponent } from './gl-dashboard/gl-dashboard.component';
import { ExchangeRateComponent } from './exchange-rate/exchange-rate.component';
import { ExpenseDetailsComponent } from './expenses/expense-details/expense-details.component';
import { BankDepositsDetailsComponent } from './depoits/bank-deposits-details/bank-deposits-details.component';
import { BankAccountsComponent } from './banks/bank-accounts/bank-accounts.component';
import { GeneralModule } from '../general/general.module';
import { FinancialDetailsComponent } from './fin-periods/financial-details/financial-details.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { LinkUnitComponent } from './expenses/link-unit/link-unit.component';

@NgModule({
  declarations: [
    VatDetailsComponent,
    FinPeriodsComponent,
    BanksComponent,
    ExpensesComponent,
    DepoitsComponent,
    BankEntriesComponent,
    ReconciliationComponent,
    GlReportsComponent,
    ExpenseAnalysisComponent,
    GrossMarginComponent,
    VatSubmitComponent,
    GlDashboardComponent,
    ExchangeRateComponent,
    ExpenseDetailsComponent,
    BankDepositsDetailsComponent,
    BankAccountsComponent,
    FinancialDetailsComponent,
    LinkUnitComponent
  ],
  imports: [
    CommonModule,
    GlRoutingModule,
    GeneralModule
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class GlModule { }
