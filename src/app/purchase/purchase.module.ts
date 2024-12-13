import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { PurchaseRoutingModule } from './purchase-routing.module';
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
import { PurchasedetailsComponent } from './purchase-request/purchasedetails/purchasedetails.component';
import { SupplierQuotaionDetailsComponent } from './supplier-quotation/supplier-quotaion-details/supplier-quotaion-details.component';
import { PurchaseorderdetailsComponent } from './purchase-order/purchase-order-details/purchase-order-details.component';
import { GrnDetailsComponent } from './grn/grn-details/grn-details.component';
import { SupplierInvoiceDetailsComponent } from './supplier-invoice/supplier-invoice-details/supplier-invoice-details.component';
import { PaymentDetailsComponent } from './payments/payment-details/payment-details.component';
import { AgChartsAngular, AgChartsAngularModule } from 'ag-charts-angular';
import { ItemChargesComponent } from './grn/item-charges/item-charges.component';
import { CommonChargesComponent } from './grn/common-charges/common-charges.component';
import { GeneralModule } from '../general/general.module';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from '../general/date-format';
import { OpeningBalancesComponent } from './opening-balances/opening-balances.component';
import { OpeningDetailComponent } from './opening-balances/opening-detail/opening-detail.component';
import { GoodsReturnComponent } from './goods-return/goods-return.component';


@NgModule({
  declarations: [
    SupplierQuotationComponent,
    PurchaseRequestComponent,
    PurchaseOrderComponent,
    GrnComponent,
    SupplierInvoiceComponent,
    PaymentsComponent,
    PurchaseReportsComponent,
    PurchaseStatementsComponent,
    PaymentsAnalysisComponent,
    CreditAccountComponent,
    PurchaseDashboardComponent,
    PurchasedetailsComponent,
    SupplierQuotaionDetailsComponent,
    PurchaseorderdetailsComponent,
    GrnDetailsComponent,
    SupplierInvoiceDetailsComponent,
    PaymentDetailsComponent,
    ItemChargesComponent,
    CommonChargesComponent,
    OpeningBalancesComponent,
    OpeningDetailComponent,
    GoodsReturnComponent

  ],
  imports: [
    CommonModule,
    PurchaseRoutingModule,
    AgChartsAngularModule,
    GeneralModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers:[AgChartsAngular,DecimalPipe,
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})

export class PurchaseModule { }
