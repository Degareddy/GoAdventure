import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranRegisterComponent } from './tran-register/tran-register.component';
import { ReportGuard } from './_guard/report.guard';
import { PlreportsComponent } from './plreports/plreports.component';
import { CashBalancesComponent } from './cash-balances/cash-balances.component';
import { PurchaseStatementsComponent } from '../purchase/purchase-statements/purchase-statements.component';
import { TripsComponent } from '../sales/trips/trips.component';
import { TripPLComponent } from '../sales/tripl-pl/tripl-pl.component';

const routes: Routes = [
   { path: 'tran-register', component: TranRegisterComponent ,canActivate:[ReportGuard]},
   { path: 'pnl-report', component: PlreportsComponent ,canActivate:[ReportGuard]},
   { path: 'cash-balance', component: TripPLComponent ,canActivate:[ReportGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
