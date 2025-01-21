import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { paymentHdr, paymentDetails, PurchaseOrder, PurchaseOrderDetails, purchaseRequestDetailsClass, supplierQuotation, supplierQuotationItems, purchaseRequestHeader, supplier, supplierInvoice, grn, grnDetails, itemCharges, commonCharges, supInvoiceDet, OpeningBalancesClass, OpeningBalDetailCls } from '../purchase/purchase.class';
import { MasterParams } from '../Masters/Modules/masters.module';
import { Observable } from 'rxjs';
import { SaveApiResponse } from '../general/Interface/admin/admin';

@Injectable({
  providedIn: 'root'
})

export class PurchaseService {

  constructor(private http: HttpClient) { }

  GetPaymentsHdrData(pmt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payments/GetPayments', pmt)
  }

  UpdatePayments(pmtHdr: paymentHdr): Observable<any> {
    return this.http.post(environment.Url + 'payments/UpdatePaymentsHdr', pmtHdr)
  }

  GetPaymetsDetails(params: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payments/GetPayDetails', params)
  }

  UpdatePaymetsDetails(pmtDet: paymentDetails): Observable<any> {
    return this.http.post(environment.Url + 'payments/UpdatePayDetails', pmtDet)
  }

  getPurchaseHeaderData(purchOrd: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseOrder/GetPurchaseOrderHeader', purchOrd)
  }

  updatePurchaseOrder(purhdr: PurchaseOrder): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseOrder/InsertPurchaseOrderHdr', purhdr)
  }

  getPurchaseDetailsData(purchOrd: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseOrder/GetPurchaseOrderDetails', purchOrd)
  }

  updatePurchaseOrderDetails(purOrdDet: PurchaseOrderDetails): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseOrder/UpdatePurchaseDetails', purOrdDet)
  }

  getPurchaseReqData(purReq: any): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseRequest/GetPurchaseRequestHeader', purReq)
  }

  InsertPurchaseRequestHdr(purReq: purchaseRequestHeader): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseRequest/InsertPurchaseRequestHdr', purReq)
  }

  getSupplierDetails(purReq: supplier): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseRequest/GetSupplierDetails', purReq)
  }

  getSupplierData(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'Suppliers/GetSupplierDetails', supp)
  }

  GetPurRequestDetails(purReq: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseRequest/GetPurRequestDetails', purReq)
  }

  // updateSupplier(supp :supplier){
  // return this.http.post(environment.Url + 'Suppliers/InsertSupplierDetails', supp)
  // }

  insertPurchaseDetails(body: purchaseRequestDetailsClass): Observable<any> {
    return this.http.post(environment.Url + 'PurchaseRequest/InsertPurchaseRequestDet', body)
  }

  updateSupplierQuotation(body: supplierQuotation): Observable<any> {
    return this.http.post(environment.Url + 'SupplierQuotation/UpdateSupplierQuotationDetails', body)
  }

  // SupplierQuotation/GetSuppQuotationItems MasterItems/GetTranCount
  GetSuppQuotationItems(body: any): Observable<any> {
    return this.http.post(environment.Url + 'SupplierQuotation/GetSuppQuotationItems', body)
  }

  GetSupplierInvoice(suppINV: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payinvoice/GetPayInvoice', suppINV)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  GetBillToList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetBillToList', body)
  }

  UpdateSupplierQtnItems(body: supplierQuotationItems): Observable<any> {
    return this.http.post(environment.Url + 'SupplierQuotation/UpdateSupplierQtnItems', body)
  }

  getsupplierQuotationData(suppQt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'SupplierQuotation/GetSupplierQuotationHeader', suppQt)
  }

  updatesupplierQuotation(suppQt: supplierQuotation): Observable<any> {
    return this.http.post(environment.Url + 'SupplierQuotation/InsertSupplierQuotationDetails', suppQt)
  }

  getSupplierInvoiceData(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payinvoice/GetPayInvoice', supp)
  }

  updateSupplierInvoice(supp: supplierInvoice): Observable<any> {
    return this.http.post(environment.Url + 'payinvoice/UpdatePayInvoice', supp)
  }

  GetClietBalanceSummary(body: any): Observable<any> {
    return this.http.post(environment.Url + 'SupplierInvoice/GetClietBalanceSummary', body)
  }

  GetPayInvoiceDetails(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payinvoice/GetPayInvoiceDetails', supp)
  }

  GetSuppInvoiceDetails(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'SupplierInvoice/GetSuppInvoiceDetails', supp)
  }

  UpdateSuppInvoiceDetails(supp: supInvoiceDet): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'SupplierInvoice/UpdateSuppInvoiceDetails', supp)
  }

  UpdatePayInvoiceDetails(supp: supplierInvoice): Observable<any> {
    return this.http.post(environment.Url + 'payinvoice/UpdatePayInvoiceDetails', supp)
  }

  //   getSupplierData(supp: MasterParams) {
  //     return this.http.post(environment.Url + 'Suppliers/GetSupplierDetails', supp)
  //  }

  updateSupplier(supp: supplier): Observable<any> {
    return this.http.post(environment.Url + 'Suppliers/InsertSupplierDetails', supp)
  }

  getGrnData(grnParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'grn/GetGrnHeader', grnParams)
  }

  updateGrn(grnHdr: grn): Observable<any> {
    return this.http.post(environment.Url + 'grn/InsertGRNDetails', grnHdr)
  }

  getGrnDetails(goodsReceipt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'grn/GetGrnItems', goodsReceipt)
  }

  updateGrnDetails(grnDet: grnDetails): Observable<any> {
    return this.http.post(environment.Url + 'grn/UpdateGRNItems', grnDet)
  }

  getPaymentsData(pmtParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payments/GetPayments', pmtParams)
  }

  GetNameSearchCount(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetNameSearchCount', doc)
  }

  getPropertyDetails(propDt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPropertyDetails', propDt)
  }

  GetGrnItemSpecificCharges(specificCharge: any): Observable<any> {
    return this.http.post(environment.Url + 'grn/GetGrnItemSpecificCharges', specificCharge)
  }
  UpdateGRNProductSpecificCharges(specificCharge: itemCharges): Observable<any> {
    return this.http.post(environment.Url + 'grn/UpdateGRNProductSpecificCharges', specificCharge)
  }

  GetGrnCommonCharges(commonCharge: any): Observable<any> {
    return this.http.post(environment.Url + 'grn/GetGrnCommonCharges', commonCharge)
  }

  UpdateGRNCommonCharges(commonCharge: commonCharges): Observable<any> {
    return this.http.post(environment.Url + 'grn/UpdateGRNCommonCharges', commonCharge)
  }

  GetTranItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranItemsList', body)
  }

  GetMasterItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsList', body)
  }

  GetSupplierPendingGRNs(body: any): Observable<any> {
    return this.http.post(environment.Url + 'SupplierInvoice/GetSupplierPendingGRNs', body)
  }

  UpdatePartyOpeningBalancesHeader(opBalances: OpeningBalancesClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdatePartyOpeningBalancesHeader', opBalances)
  }


  UpdatePartyOpeningBalanceDetails(opBalances: OpeningBalDetailCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdatePartyOpeningBalanceDetails', opBalances)
  }


  GetPartyOpeningBalancesHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPartyOpeningBalancesHdr', body)
  }

  GetPartyOpeningBalanceDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPartyOpeningBalanceDetails', body)
  }

}
// MasterItems/GetTranItemsList
