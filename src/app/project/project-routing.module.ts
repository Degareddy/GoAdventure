import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VentureDetailsComponent } from './venture-details/venture-details.component';
import { PlotComponent } from './plot/plot.component';
import { PlotSaleComponent } from './plot-sale/plot-sale.component';
import { ProjectComponent } from './property/project.component';
import { BlocksComponent } from './blocks/blocks.component';
import { FlatsComponent } from './flats/flats.component';
import { BudgetsComponent } from './budgets/budgets.component';
import { ProjectGuard } from './_guard/project.guard';
import { ProjectInvoiceComponent } from './project-invoice/project-invoice.component';
import { UnitChargesComponent } from './unit-charges/unit-charges.component';
import { PropertyReportsComponent } from './property-reports/property-reports.component';
import { WaterReadingComponent } from './water-reading/water-reading.component';
import { GenerateInvoicesComponent } from './generate-invoices/generate-invoices.component';
import { PropertyDashboardComponent } from './property-dashboard/property-dashboard.component';
import { GrievanceServiceComponent } from '../utilities/grievance-service/grievance-service.component';
import { PropertyGuard } from './_guard/property.guard';
import { UnitSalesComponent } from './unit-sales/unit-sales.component';
import { CustomerComponent } from '../sales/customer/customer.component';
import { ReceiptsComponent } from '../sales/receipts/receipts.component';
import { ReprotsComponent } from '../general/reprots/reprots.component';
import { SalesReportsComponent } from '../sales/sales-reports/sales-reports.component';
import { ProjectUnitsComponent } from './project-units/project-units.component';
import { ProjectTransfersComponent } from './project-transfers/project-transfers.component';
import { LegalChargesComponent } from './legal-charges/legal-charges.component';
import { AuthoriseInvoiceComponent } from './project-invoice/authorise-invoice/authorise-invoice.component';
import { ProjectsComponent } from './projects.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsComponent,
    children:[
      { path: 'ventures', component: VentureDetailsComponent, canActivate: [ProjectGuard] },
      { path: 'plots', component: PlotComponent, canActivate: [ProjectGuard] },
      { path: 'units', component: ProjectUnitsComponent, canActivate: [ProjectGuard]},
      { path: 'plotsale', component: PlotSaleComponent, canActivate: [ProjectGuard] },
      { path: 'budgets', component: BudgetsComponent, canActivate: [ProjectGuard] },
      { path: 'unitsales', component: UnitSalesComponent, canActivate: [ProjectGuard]},
      { path: 'block', component: BlocksComponent, canActivate: [ProjectGuard]},
      { path: 'projects', component: ProjectComponent, canActivate: [ProjectGuard]},
      { path: 'transfer', component: ProjectTransfersComponent, canActivate: [ProjectGuard]},

      { path: 'project', component: ProjectComponent, canActivate: [PropertyGuard] },
      { path: 'blocks', component: BlocksComponent, canActivate: [PropertyGuard] },
      { path: 'flats', component: FlatsComponent, canActivate: [PropertyGuard] },
      { path: 'invoice', component: ProjectInvoiceComponent, canActivate: [PropertyGuard] },
      { path: 'unit-charges', component: UnitChargesComponent, canActivate: [PropertyGuard] },
      { path: 'report', component: PropertyReportsComponent, canActivate: [PropertyGuard]},
      { path: 'extended-bills', component: WaterReadingComponent, canActivate: [PropertyGuard]},
      { path: 'generate-invoices', component: GenerateInvoicesComponent, canActivate: [PropertyGuard]},
      { path: 'property-dashboard', component: PropertyDashboardComponent, canActivate: [PropertyGuard]},
      { path: 'grievance-service', component: GrievanceServiceComponent, canActivate: [PropertyGuard]},

      { path: 'client', component: CustomerComponent, canActivate: [PropertyGuard]},
      { path: 'legal-charges', component: LegalChargesComponent, canActivate: [PropertyGuard]},
      { path: 'receipts-payments', component: ReceiptsComponent, canActivate: [PropertyGuard]},
      { path: 'statement', component: ReprotsComponent, canActivate: [PropertyGuard]},
      { path: 'client-balances', component: SalesReportsComponent, canActivate: [PropertyGuard]}
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectRoutingModule { }
