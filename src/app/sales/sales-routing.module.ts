import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

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
import { CustomerComponent } from './customer/customer.component';
import { DebitInvoiceComponent } from './debit-invoice/debit-invoice.component';
import { CustomerDetailsComponent } from './customer/customer-details/customer-details.component';
import { CustomerAddressesComponent } from './customer/customer-addresses/customer-addresses.component';
import { CustomerContactsComponent } from './customer/customer-contacts/customer-contacts.component';
import { SaleGuard } from './_guard/sale.guard';
import { ReprotsComponent } from '../general/reprots/reprots.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { SaleOrderComponent } from './sale-order/sale-order.component';
import { DebitCreditNoteComponent } from '../general/debit-credit-note/debit-credit-note.component';
import { OpeningBalancesComponent } from '../purchase/opening-balances/opening-balances.component';
import { BookingComponent } from './booking/booking.component';
import { TripsComponent } from './trips/trips.component';
import { PackageNamesComponent } from './package-names/package-names.component';
import { ReceiptsPaymentsComponent } from './receipts-payments/receipts-payments.component';
import { EditorComponent } from './booking/editor/editor.component';


const routes: Routes = [

  { path: 'customer-details/:code', component: CustomerDetailsComponent, canActivate: [SaleGuard] },
  { path: 'customer-addresses/:code', component: CustomerAddressesComponent, canActivate: [SaleGuard] },
  { path: 'customer-contacts/:code/:slno', component: CustomerContactsComponent, canActivate: [SaleGuard] },
  { path: 'customer', component: CustomerComponent, canActivate: [SaleGuard] },
  { path: 'customer-opening', component: CustomerOpeningComponent, canActivate: [SaleGuard] },
    { path: 'opening', component: OpeningBalancesComponent, canActivate: [SaleGuard] },
    { path: 'party-opbalances', component: OpeningBalancesComponent, canActivate: [SaleGuard] },
  { path: 'quotation', component: QuotationComponent, canActivate: [SaleGuard] },
  { path: 'order-invoice', component: OrderInvoiceComponent, canActivate: [SaleGuard] },
  { path: 'direct-invoice', component: DirectInvoiceComponent, canActivate: [SaleGuard] },
  { path: 'debit-invoice', component: DebitInvoiceComponent, canActivate: [SaleGuard] },
  { path: 'cash-sale', component: CashSaleComponent, canActivate: [SaleGuard] },
  { path: 'transfer-invoice', component: TransferInvoiceComponent, canActivate: [SaleGuard] },
  { path: 'credit-invoice', component: CreditInvoiceComponent, canActivate: [SaleGuard] },
  { path: 'invoice-adjustment', component: InvoiceAdjustmentComponent, canActivate: [SaleGuard] },
  { path: 'rctpmt', component: ReceiptsPaymentsComponent, canActivate: [SaleGuard] },
  { path: 'pricing', component: PricingComponent, canActivate: [SaleGuard] },
  { path: 'sales-statement', component: ReprotsComponent, canActivate: [SaleGuard] },
  { path: 'sales-reports', component: SalesReportsComponent, canActivate: [SaleGuard] },
  { path: 'sales-dashboard', component: SalesDashboardComponent, canActivate: [SaleGuard] },
  { path: 'customer-details/:code', component: CustomerDetailsComponent, canActivate: [SaleGuard] },
  { path: 'customer-addresses/:code', component: CustomerAddressesComponent, canActivate: [SaleGuard] },
  { path: 'customer-contacts/:code/:slno', component: CustomerContactsComponent, canActivate: [SaleGuard] },
  { path: 'delivery', component: DeliveryComponent, canActivate: [SaleGuard] },
  { path: 'sale-order', component: SaleOrderComponent, canActivate: [SaleGuard] },
  { path: 'booking', component: BookingComponent, canActivate: [SaleGuard] },
  { path: 'debit-credit-note', component: DebitCreditNoteComponent, canActivate: [SaleGuard] },

  { path: 'packages', component: PackageNamesComponent, canActivate: [SaleGuard] },
  {path:'trip',component:TripsComponent,canActivate:[SaleGuard]},
  { path: 'invoice-editor', component: EditorComponent },


  
]
// }];debit-credit-note

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
