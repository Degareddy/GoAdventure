import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryRoutingModule } from './inventory-routing.module';
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
import { MaterialRequestComponent } from './material-request/material-request.component';
import { MaterialRequestDetailsComponent } from './material-request/material-request-details/material-request-details.component';
import { PhysicalStockDetailsComponent } from './physical-stock/physical-stock-details/physical-stock-details.component';
import { StockAdjustmentDetailsComponent } from './stock-adjustment/stock-adjustment-details/stock-adjustment-details.component';
import { TransferDetailsComponent } from './stock-transfer/transfer-details/transfer-details.component';
import { ProductGroupsComponent } from './product-groups/product-groups.component';
import { ConsumptionDetailsComponent } from './consumption/consumption-details/consumption-details.component';
import { GeneralModule } from '../general/general.module';
import { ProductDetailsComponent } from './products/product-details/product-details.component';
import { WareHouseSearchComponent } from './stock-transfer/ware-house-search/ware-house-search.component';
import { ReceiptDetailsComponent } from './transfer-receipt/receipt-details/receipt-details.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { SupplierProductsComponent } from './products/supplier-products/supplier-products.component';

@NgModule({
  declarations: [
    WarehouseComponent,
    ProductParametersComponent,
    ProductsComponent,
    PricingComponent,
    ConsumptionComponent,
    StockTransferComponent,
    TransferInvoiceComponent,
    TransferReceiptComponent,
    PhysicalStockComponent,
    StockAdjustmentComponent,
    UnitConversionComponent,
    MergeComponent,
    StockOpeningsComponent,
    StockReportsComponent,
    StockDashboardComponent,
    MaterialRequestComponent,
    MaterialRequestDetailsComponent,
    TransferDetailsComponent,
    PhysicalStockDetailsComponent,
    StockAdjustmentDetailsComponent,
    ProductGroupsComponent,
    ConsumptionDetailsComponent,
    ProductDetailsComponent,
    WareHouseSearchComponent,
    ReceiptDetailsComponent,
    SupplierProductsComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    GeneralModule,
    AgChartsAngularModule
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class InventoryModule { }
