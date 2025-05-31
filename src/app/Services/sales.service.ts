import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { InvoiceDetailsClass, QuatationDetails, QuotationHdrCls, SaleOrderHeader, SalesOrderDetails, deliveryDetails, deliveryHeader, paymentClass, recieptsClass, saleQuotationHdrCls } from '../sales/sales.class';
import { MasterParams } from '../Masters/Modules/masters.module';
import { Observable } from 'rxjs';
import { SaveApiResponse } from '../general/Interface/admin/admin';
import { getTransationsPayload, Item } from '../general/Interface/interface';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  constructor(private http: HttpClient) { }
  getModesList(masParams: MasterParams): Observable<Item> {
    return this.http.post<Item>(environment.Url + 'MasterItems/GetTranMode/', masParams)
  }
  GetMasterItemsList(body: any): Observable<Item> {
    return this.http.post<Item>(environment.Url + 'MasterItems/GetMasterItemsList/', body)
  }
  getQtnHeaderData(qtnHdr: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetQuotationHeader', qtnHdr)
  }

  updateQtnHdr(qtnHdr: QuotationHdrCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/InsertQuotation', qtnHdr)
  }

  getQuotationDetails(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetQuotationDetails', qtnDet)
  }
GetPartySearchList(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetPartySearchList', doc)
  }
  GetQuotationReport(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetQuotationReport', qtnDet)
  }
  GetReceiptPaymentsDetails(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetReceiptsAndPaymentsDetails', qtnDet)
  }
  GetDeliveryReport(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetDeliveryReport', qtnDet)
  }
   UpdateReceiptsAndPayments(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/UpdateReceiptsAndPayments', qtnDet)
  }
  GetTripDefinitionsList(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetTripDefinitionsList', qtnDet)
  }
      GetClientBalance(body: any): Observable<any> {
      return this.http.post<any>(environment.Url + 'sales/GetClientBalance/', body);
    }
     GetTripDataToBooking(body: any): Observable<any> {
      return this.http.post<any>(environment.Url + 'sales/GetTripDataToBooking/', body);
    }
  GetPackagesList(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetPackagesList', qtnDet)
  }
   GetBookingDetails(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetBookingDetails', qtnDet)
  }
 
  UpdatePackageDetails(qtnDet: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/UpdatePackageDetails', qtnDet)
  }
  getDetailsPdf(body:any):Observable<any>{
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/GetReceiptReport', body)

  }
  updateQuotationDetails(qtnDet: QuatationDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateQuotationDetails', qtnDet)
  }

  UpdateQuotation(qtnDet: saleQuotationHdrCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateQuotation', qtnDet)
  }
  getInvoiceHeaderData(qtnHdr: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetInvoiceHdr', qtnHdr)
  }

  updateInvoiceHdr(qtnHdr: QuotationHdrCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateInvoiceHdr', qtnHdr)
  }
  GetOrderInvoiceDetails(qtnHdr: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/GetOrderInvoiceDetails', qtnHdr)
  }
  UpdateOrderInvoiceDetails(qtnHdr: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateOrderInvoiceDetails', qtnHdr)
  }

  getInvoiceDetailsData(qtnDet: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetDirectInvoiceDet', qtnDet)
  }
  updateInvoiceDetails(invDet: InvoiceDetailsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateInvoiceItemDet', invDet)
  }

  getTenantInvoiceHeaderData(qtnHdr: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantInvoiceHdr', qtnHdr)
  }


  GetReceiptDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetReceiptDetails', body)
  }

  UpdateReceiptDetails(recptCls: recieptsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateReceiptPaymentDetails', recptCls)
  }

  GetPaymentsDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPaymentsDetails', body)
  }
  updatePaymentDetails(payCls: paymentClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'purchase/UpdatePaymentDetails', payCls)
  }
  GetClientBalances(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetClientBalance', body)
  }


  GetReceiptAllocatedDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetReceiptAllocatedDetails', body)
  }


  GetReceiptDetToAllocate(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetReceiptDetToAllocate', body)
  }
  UpdateDeliveryHdr(delHdr: deliveryHeader): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateDeliveryHdr', delHdr)
  }
  GetDeliveryHeader(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetDeliveryHeader', body)
  }

  InsertSaleOrderHdr(saleHdr: SaleOrderHeader): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/InsertSaleOrderHdr', saleHdr)
  }

  UpdateSaleOrderItemDetails(saleDet: SalesOrderDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateSaleOrderItemDetails', saleDet)
  }
  GetSaleOrderDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetSaleOrderDetails', body)
  }

  GetSaleOrderHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetSaleOrderHdr', body)
  }

  UpdateDeliveryItemDetails(delDet: deliveryDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'sales/UpdateDeliveryItemDetails', delDet)
  }
  GetDeliveryDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetDeliveryDetails', body)
  }

  GetInvoiceReport(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetInvoiceReport', body)
  }
  getOrderInvoiceHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetInvoiceHdr', body)
  }
  FetchPaymentsReceiptsToAllocate(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/FetchPaymentsReceiptsToAllocate', body)
  }

  UpdatePaymentReceiptAllocationDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/UpdateAllocationDetails', body)
  }

  GetUserCashBalance(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetUserCashBalance', body)
  }

  GetLoanBalances(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/GetLoanBalances', body)
  }
}
