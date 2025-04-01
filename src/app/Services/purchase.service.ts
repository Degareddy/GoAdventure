import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { paymentHdr, paymentDetails, PurchaseOrder, PurchaseOrderDetails, purchaseRequestDetailsClass, supplierQuotation, supplierQuotationItems, purchaseRequestHeader, supplier, supplierInvoice, grn, grnDetails, itemCharges, commonCharges, supInvoiceDet, OpeningBalancesClass, OpeningBalDetailCls, TransactionDetails } from '../purchase/purchase.class';
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
    return this.http.post(environment.Url + 'purchase/GetPurchaseOrderHeader', purchOrd)
  }

  updatePurchaseOrder(purhdr: PurchaseOrder): Observable<any> {
    return this.http.post(environment.Url + 'purchase/InsertPurchaseOrderHdr', purhdr)
  }

  getPurchaseDetailsData(purchOrd: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPurchaseOrderDetails', purchOrd)
  }

  updatePurchaseOrderDetails(purOrdDet: PurchaseOrderDetails): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdatePurchaseDetails', purOrdDet)
  }

  getPurchaseReqData(purReq: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPurchaseRequestHeader', purReq)
  }

  InsertPurchaseRequestHdr(purReq: purchaseRequestHeader): Observable<any> {
    return this.http.post(environment.Url + 'purchase/InsertPurchaseRequestHdr', purReq)
  }

  getSupplierDetails(purReq: supplier): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSupplierDetails', purReq)
  }

  getSupplierData(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSupplierDetails', supp)
  }

  GetPurRequestDetails(purReq: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPurRequestDetails', purReq)
  }

  // updateSupplier(supp :supplier){
  // return this.http.post(environment.Url + 'Suppliers/InsertSupplierDetails', supp)
  // }

  insertPurchaseDetails(body: purchaseRequestDetailsClass): Observable<any> {
    return this.http.post(environment.Url + 'purchase/InsertPurchaseRequestDet', body)
  }

  updateSupplierQuotation(body: supplierQuotation): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdateSupplierQuotationDetails', body)
  }

  // SupplierQuotation/GetSuppQuotationItems MasterItems/GetTranCount
  GetSuppQuotationItems(body: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSuppQuotationItems', body)
  }

  GetSupplierInvoice(suppINV: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPayInvoice', suppINV)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  GetBillToList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetBillToList', body)
  }

  UpdateSupplierQtnItems(body: supplierQuotationItems): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdateSupplierQtnItems', body)
  }

  getsupplierQuotationData(suppQt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSupplierQuotationHeader', suppQt)
  }

  updatesupplierQuotation(suppQt: supplierQuotation): Observable<any> {
    return this.http.post(environment.Url + 'purchase/InsertSupplierQuotationDetails', suppQt)
  }

  getSupplierInvoiceData(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPayInvoice', supp)
  }

  updateSupplierInvoice(supp: supplierInvoice): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdatePayInvoice', supp)
  }

  GetClietBalanceSummary(body: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetClietBalanceSummary', body)
  }

  GetPayInvoiceDetails(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPayInvoiceDetails', supp)
  }

  GetSuppInvoiceDetails(supp: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSuppInvoiceDetails', supp)
  }

  UpdateSuppInvoiceDetails(supp: supInvoiceDet): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'purchase/UpdateSuppInvoiceDetails', supp)
  }

  UpdatePayInvoiceDetails(supp: supplierInvoice): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdatePayInvoiceDetails', supp)
  }

  //   getSupplierData(supp: MasterParams) {
  //     return this.http.post(environment.Url + 'Suppliers/GetSupplierDetails', supp)
  //  }

  updateSupplier(supp: supplier): Observable<any> {
    return this.http.post(environment.Url + 'Suppliers/InsertSupplierDetails', supp)
  }

  getGrnData(grnParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetGrnHeader', grnParams)
  }

  updateGrn(grnHdr: grn): Observable<any> {
    return this.http.post(environment.Url + 'purchase/InsertGRNDetails', grnHdr)
  }

  getGrnDetails(goodsReceipt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetGrnItems', goodsReceipt)
  }

  updateGrnDetails(grnDet: grnDetails): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdateGRNItems', grnDet)
  }

  getPaymentsData(pmtParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetPayments', pmtParams)
  }

  GetNameSearchCount(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetNameSearchCount', doc)
  }

  getPropertyDetails(propDt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPropertyDetails', propDt)
  }

  GetGrnItemSpecificCharges(specificCharge: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetGrnItemSpecificCharges', specificCharge)
  }
  UpdateGRNProductSpecificCharges(specificCharge: itemCharges): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdateGRNProductSpecificCharges', specificCharge)
  }

  GetGrnCommonCharges(commonCharge: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetGrnCommonCharges', commonCharge)
  }

  UpdateGRNCommonCharges(commonCharge: commonCharges): Observable<any> {
    return this.http.post(environment.Url + 'purchase/UpdateGRNCommonCharges', commonCharge)
  }

  GetTranItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranItemsList', body)
  }

  GetMasterItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsList', body)
  }

  GetSupplierPendingGRNs(body: any): Observable<any> {
    return this.http.post(environment.Url + 'purchase/GetSupplierPendingGRNs', body)
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


  UpdateCreditDebitNote(crCls: TransactionDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateCreditDebitNote', crCls)
  }
  GetCreditDebitNote(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetCreditDebitNote', body)
  }
}

