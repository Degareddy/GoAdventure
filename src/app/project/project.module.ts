import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectRoutingModule } from './project-routing.module';
import { VentureDetailsComponent } from './venture-details/venture-details.component';
import { PlotComponent } from './plot/plot.component';
import { PlotSaleComponent } from './plot-sale/plot-sale.component';
import { ProjectComponent } from './property/project.component';
import { BlocksComponent } from './blocks/blocks.component';
import { FlatsComponent } from './flats/flats.component';
import { BudgetsComponent } from './budgets/budgets.component';
import { BudgetDetailsComponent } from './budgets/budget-details/budget-details.component';
import { CommaSeparatorPipe, FinancialsComponent } from './flats/financials/financials.component';
import { ServiceNumbersComponent } from './flats/service-numbers/service-numbers.component';
import { EquipmentComponent } from './flats/equipment/equipment.component';
import { ProjectInvoiceComponent } from './project-invoice/project-invoice.component';
import { InvoiceDetailsComponent } from './project-invoice/invoice-details/invoice-details.component';
import { InvoiceExpensesComponent } from './project-invoice/invoice-expenses/invoice-expenses.component';
import { UnitChargesComponent } from './unit-charges/unit-charges.component';
import { PropertyReportsComponent } from './property-reports/property-reports.component';
import { WaterReadingComponent } from './water-reading/water-reading.component';
import { PreBookingComponent } from './flats/pre-booking/pre-booking.component';
import { GenerateInvoicesComponent } from './generate-invoices/generate-invoices.component';
import { GeneralModule } from '../general/general.module';
import { PropertyDashboardComponent } from './property-dashboard/property-dashboard.component';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { UnitSalesComponent } from './unit-sales/unit-sales.component';
import { UnitSaleDetailsComponent } from './unit-sales/unit-sale-details/unit-sale-details.component';
import { BudgetSubDetailsComponent } from './budgets/budget-sub-details/budget-sub-details.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { ExtendedDetailsComponent } from './water-reading/extended-details/extended-details.component';
import { ProjectUnitsComponent } from './project-units/project-units.component';
import { ProjectTransfersComponent } from './project-transfers/project-transfers.component';
import { AuthoriseInvoiceComponent } from './project-invoice/authorise-invoice/authorise-invoice.component';
import { LegalChargesComponent } from './legal-charges/legal-charges.component';
import { VacantNoticeComponent } from './flats/vacant-notice/vacant-notice.component';
import { MulticlientsAllocationComponent } from './flats/multiclients-allocation/multiclients-allocation.component';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { FilteredUnitsComponent } from './property-reports/filtered-units/filtered-units.component';
import { ProjectsComponent } from './projects.component';

@NgModule({
  declarations: [
    VentureDetailsComponent,
    PlotComponent,
    PlotSaleComponent,
    ProjectComponent,
    BlocksComponent,
    FlatsComponent,
    BudgetsComponent,
    BudgetDetailsComponent,
    FinancialsComponent,
    ServiceNumbersComponent,
    EquipmentComponent,
    ProjectInvoiceComponent,
    InvoiceDetailsComponent,
    InvoiceExpensesComponent,
    UnitChargesComponent,
    PropertyReportsComponent,
    WaterReadingComponent,
    PreBookingComponent,
    GenerateInvoicesComponent,
    CommaSeparatorPipe,
    PropertyDashboardComponent,
    UnitSalesComponent,
    UnitSaleDetailsComponent,
    BudgetSubDetailsComponent,
    ExtendedDetailsComponent,
    ProjectUnitsComponent,
    ProjectTransfersComponent,
    AuthoriseInvoiceComponent,
    LegalChargesComponent,
    VacantNoticeComponent,
    MulticlientsAllocationComponent,
    FilteredUnitsComponent,
    ProjectsComponent
  ],
  imports: [
    CommonModule,
    ProjectRoutingModule,
    GeneralModule,
    AgChartsAngularModule,
    CardModule,
    ChartModule,
    TableModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class ProjectModule { }
