import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

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
import { GlGuard } from './_guard/gl.guard';
import { DebitCreditNoteComponent } from '../general/debit-credit-note/debit-credit-note.component';
import { ReceiptsComponent } from '../sales/receipts/receipts.component';

const routes: Routes = [
  { path: 'vat-details', component: VatDetailsComponent, canActivate: [GlGuard] },
  { path: 'fin-periods', component: FinPeriodsComponent, canActivate: [GlGuard] },
  { path: 'banks', component: ReceiptsComponent, canActivate: [GlGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [GlGuard] },
  { path: 'deposits', component: DepoitsComponent, canActivate: [GlGuard] },
  { path: 'bank-entries', component: BankEntriesComponent, canActivate: [GlGuard] },
  { path: 'reconciliation', component: ReconciliationComponent, canActivate: [GlGuard] },
  { path: 'gl-reports', component: GlReportsComponent, canActivate: [GlGuard] },
  { path: 'expense-analysis', component: ExpenseAnalysisComponent, canActivate: [GlGuard] },
  { path: 'gross-margin', component: GrossMarginComponent, canActivate: [GlGuard] },
  { path: 'vat-submit', component: VatSubmitComponent, canActivate: [GlGuard] },
  { path: 'gl-dashboard', component: GlDashboardComponent, canActivate: [GlGuard] },
  { path: 'exchange-rates', component: ExchangeRateComponent, canActivate: [GlGuard] },
  { path: 'debit-credit-note', component: DebitCreditNoteComponent, canActivate: [GlGuard] },
]


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GlRoutingModule { }
