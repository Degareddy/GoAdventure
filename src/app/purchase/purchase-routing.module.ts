import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultComponent } from 'src/app/layouts/default/default.component';

import { SupplierQuotationComponent } from './supplier-quotation/supplier-quotation.component';
import { PurchaseRequestComponent } from './purchase-request/purchase-request.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { GrnComponent } from './grn/grn.component';
import { SupplierInvoiceComponent } from './supplier-invoice/supplier-invoice.component';
import { PaymentsComponent } from './payments/payments.component';
import { PurchaseReportsComponent } from './purchase-reports/purchase-reports.component';
import { PurchaseStatementsComponent } from './purchase-statements/purchase-statements.component';
import { PaymentsAnalysisComponent } from './payments-analysis/payments-analysis.component';
import { CreditAccountComponent } from './credit-account/credit-account.component';
import { PurchaseDashboardComponent } from './purchase-dashboard/purchase-dashboard.component';
import { PurchaseGuard } from './_guard/purchase.guard';
import { OpeningBalancesComponent } from './opening-balances/opening-balances.component';
import { GoodsReturnComponent } from './goods-return/goods-return.component';
import { ReceiptsComponent } from '../sales/receipts/receipts.component';
import { DebitCreditNoteComponent } from '../general/debit-credit-note/debit-credit-note.component';

const routes: Routes = [
  // {
  // path: 'purchase',
  // component: DefaultComponent,
  // children: [
  { path: 'supplier-quotation', component: SupplierQuotationComponent, canActivate: [PurchaseGuard] },
  { path: 'purchase-request', component: PurchaseRequestComponent, canActivate: [PurchaseGuard] },
  { path: 'party-opbalances', component: OpeningBalancesComponent, canActivate: [PurchaseGuard] },
  { path: 'purchase-order', component: PurchaseOrderComponent, canActivate: [PurchaseGuard] },
  { path: 'grn', component: GrnComponent, canActivate: [PurchaseGuard] },
  { path: 'greturn', component: GoodsReturnComponent, canActivate: [PurchaseGuard] },
  { path: 'supplier-invoice', component: SupplierInvoiceComponent, canActivate: [PurchaseGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [PurchaseGuard] },
  { path: 'purchase-reports', component: PurchaseReportsComponent, canActivate: [PurchaseGuard] },
  { path: 'purchase-statements', component: PurchaseStatementsComponent, canActivate: [PurchaseGuard] },
  { path: 'payments-analysis', component: PaymentsAnalysisComponent, canActivate: [PurchaseGuard] },
  { path: 'credit-account', component: CreditAccountComponent, canActivate: [PurchaseGuard] },
  { path: 'purchase-dashboard', component: PurchaseDashboardComponent, canActivate: [PurchaseGuard] },
  { path: 'receipts-payments', component: ReceiptsComponent, canActivate: [PurchaseGuard] },
  { path: 'debit-credit-note', component: DebitCreditNoteComponent, canActivate: [PurchaseGuard] }
]
// }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PurchaseRoutingModule { }
