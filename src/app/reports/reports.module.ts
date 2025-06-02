import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsRoutingModule } from './reports-routing.module';
import { TranRegisterComponent } from './tran-register/tran-register.component';
import { GeneralModule } from '../general/general.module';
import { PlreportsComponent } from './plreports/plreports.component';
import { CashBalancesComponent } from './cash-balances/cash-balances.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TripPLComponent } from '../sales/tripl-pl/tripl-pl.component';

@NgModule({
  declarations: [
    TranRegisterComponent,
    PlreportsComponent,
    CashBalancesComponent,
    TripPLComponent
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    GeneralModule,
    CardModule,
    ChartModule,
    TableModule,
  ]
})
export class ReportsModule { }
