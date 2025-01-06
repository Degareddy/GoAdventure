//import { materialRequest } from './inventory.class';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

import { WarehouseComponent } from './warehouse/warehouse.component';
import { ProductParametersComponent } from './product-parameters/product-parameters.component';
import { ProductsComponent } from './products/products.component';
import { PricingComponent } from './pricing/pricing.component';
import { ConsumptionComponent } from './consumption/consumption.component';
import { StockTransferComponent } from './stock-transfer/stock-transfer.component';
import { TransferInvoiceComponent } from './transfer-invoice/transfer-invoice.component';
import { TransferReceiptComponent } from './transfer-receipt/transfer-receipt.component';
import { PhysicalStockComponent } from './physical-stock/physical-stock.component';
import { StockAdjustmentComponent } from './stock-adjustment/stock-adjustment.component';
import { UnitConversionComponent } from './unit-conversion/unit-conversion.component';
import { MergeComponent } from './merge/merge.component';
import { StockOpeningsComponent } from './stock-openings/stock-openings.component';
import { StockReportsComponent } from './stock-reports/stock-reports.component';
import { StockDashboardComponent } from './stock-dashboard/stock-dashboard.component';
import { MaterialRequestComponent } from './material-request/material-request.component'
import { InventoryGuard } from './_guard/inventory.guard';
import { ProductGroupsComponent } from './product-groups/product-groups.component';
const routes: Routes = [

  { path: 'warehouse', component: WarehouseComponent ,canActivate:[InventoryGuard]},
  { path: 'product-parameters', component: ProductParametersComponent ,canActivate:[InventoryGuard]},
  { path: 'products', component: ProductsComponent,canActivate:[InventoryGuard] },
  { path: 'product-groups', component: ProductGroupsComponent,canActivate:[InventoryGuard] },
  { path: 'pricing', component: PricingComponent,canActivate:[InventoryGuard] },
  { path: 'consumption', component: ConsumptionComponent ,canActivate:[InventoryGuard]},
  { path: 'stock-transfer', component: StockTransferComponent,canActivate:[InventoryGuard] },
  { path: 'transfer-invoice', component: TransferInvoiceComponent ,canActivate:[InventoryGuard]},
  { path: 'transfer-receipt', component: TransferReceiptComponent ,canActivate:[InventoryGuard]},
  { path: 'physical-stock', component: PhysicalStockComponent ,canActivate:[InventoryGuard]},
  { path: 'stock-adjustment', component: StockAdjustmentComponent,canActivate:[InventoryGuard] },
  { path: 'unit-conversion', component: UnitConversionComponent,canActivate:[InventoryGuard] },
  { path: 'merge', component: MergeComponent ,canActivate:[InventoryGuard]},
  { path: 'stock-openings', component: StockOpeningsComponent ,canActivate:[InventoryGuard]},
  { path: 'stock-reports', component: StockReportsComponent ,canActivate:[InventoryGuard]},
  { path: 'stock-dashboard', component: StockDashboardComponent ,canActivate:[InventoryGuard]},
  { path: 'material-request', component: MaterialRequestComponent ,canActivate:[InventoryGuard]}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
