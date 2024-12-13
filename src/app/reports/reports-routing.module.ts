import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranRegisterComponent } from './tran-register/tran-register.component';
import { ReportGuard } from './_guard/report.guard';
import { PlreportsComponent } from './plreports/plreports.component';
import { CashBalancesComponent } from './cash-balances/cash-balances.component';
import { AuthoriseInvoiceComponent } from '../project/project-invoice/authorise-invoice/authorise-invoice.component';

const routes: Routes = [
   { path: 'tran-register', component: TranRegisterComponent ,canActivate:[ReportGuard]},
   { path: 'pnl-report', component: PlreportsComponent ,canActivate:[ReportGuard]},
   { path: 'cash-balance', component: CashBalancesComponent ,canActivate:[ReportGuard]},
   { path: 'authorize-trans', component: AuthoriseInvoiceComponent, canActivate: [ReportGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
