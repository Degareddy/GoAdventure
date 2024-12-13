import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { CustomerOpeningComponent } from './customer-opening/customer-opening.component';
import { QuotationComponent } from './quotation/quotation.component';
import { OrderInvoiceComponent } from './order-invoice/order-invoice.component';
import { DirectInvoiceComponent } from './direct-invoice/direct-invoice.component';
import { CashSaleComponent } from './cash-sale/cash-sale.component';
import { TransferInvoiceComponent } from './transfer-invoice/transfer-invoice.component';
import { CreditInvoiceComponent } from './credit-invoice/credit-invoice.component';
import { InvoiceAdjustmentComponent } from './invoice-adjustment/invoice-adjustment.component';
import { ReceiptsComponent } from './receipts/receipts.component';
import { PricingComponent } from './pricing/pricing.component';
import { SalesReportsComponent } from './sales-reports/sales-reports.component';
import { SalesDashboardComponent } from './sales-dashboard/sales-dashboard.component';
import { DebitInvoiceComponent } from './debit-invoice/debit-invoice.component';
import { CustomerDetailsComponent } from './customer/customer-details/customer-details.component';
import { CustomerAddressesComponent } from './customer/customer-addresses/customer-addresses.component';
import { CustomerContactsComponent } from './customer/customer-contacts/customer-contacts.component';
import { CustomerComponent } from './customer/customer.component';
import { QuatationDetailsComponent } from './quotation/quatation-details/quatation-details.component';
import { OrderInvoiceDetailsComponent } from './order-invoice/order-invoice-details/order-invoice-details.component';
import { DirectInvoiceDetailsComponent } from './direct-invoice/direct-invoice-details/direct-invoice-details.component';
import { PricingDetailsComponent } from './pricing/pricing-details/pricing-details.component';
import { TenantSearchComponent } from './receipts/tenant-search/tenant-search.component';
import { ReceiptDetailsComponent } from './receipts/receipt-details/receipt-details.component';
import { GeneralModule } from '../general/general.module';
import { DeliveryComponent } from './delivery/delivery.component';
import { DeliveryDetailsComponent } from './delivery/delivery-details/delivery-details.component';
import { SaleOrderComponent } from './sale-order/sale-order.component';
import { SaleOrderDetailsComponent } from './sale-order/sale-order-details/sale-order-details.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { AllocateComponent } from './receipts/allocate/allocate.component';
import { LoanAllocationComponent } from './receipts/loan-allocation/loan-allocation.component';
import { CustomerUnitsComponent } from './customer/customer-units/customer-units.component';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';


@NgModule({
  declarations: [
    CustomerComponent,
    CustomerOpeningComponent,
    CustomerDetailsComponent,
    CustomerAddressesComponent,
    CustomerContactsComponent,
    QuotationComponent,
    OrderInvoiceComponent,
    DirectInvoiceComponent,
    CashSaleComponent,
    TransferInvoiceComponent,
    CreditInvoiceComponent,
    InvoiceAdjustmentComponent,
    ReceiptsComponent,
    PricingComponent,
    SalesReportsComponent,
    SalesDashboardComponent,
    DebitInvoiceComponent,
    QuatationDetailsComponent,
    OrderInvoiceDetailsComponent,
    DirectInvoiceDetailsComponent,
    PricingDetailsComponent,
    TenantSearchComponent,
    ReceiptDetailsComponent,
    DeliveryComponent,
    DeliveryDetailsComponent,
    SaleOrderComponent,
    SaleOrderDetailsComponent,
    AllocateComponent,
    LoanAllocationComponent,
    CustomerUnitsComponent
  ],
  imports: [
    CommonModule,
    SalesRoutingModule,
    GeneralModule,
    CardModule,
    ChartModule,
    TableModule,
  ],
  exports: [
    CustomerDetailsComponent,
    CustomerAddressesComponent,
    CustomerContactsComponent,
    CustomerUnitsComponent
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    DecimalPipe
  ]
})
export class SalesModule { }
