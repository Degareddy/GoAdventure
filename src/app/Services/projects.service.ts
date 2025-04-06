import { Injectable } from '@angular/core';
import { MasterParams } from '../Masters/Modules/masters.module';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FlatClass, ProjectClass, venturnClass, plotClass, BlockClass, plotSaleClass, PropertyCls, BudgetCls, BudgetDetailsCls, finacialsClass, serviceClass, equipmentClass, unitLandLordClass, invoiceClass, invoiceDetailClass, unitCharges, propertyReportData, waterReading, unitSalesClass, unitSalesDetailsClass, workdetails, TransactionDetails, TransferDetails, multiClients, stakeHolder } from '../project/Project.class';
import { Observable } from 'rxjs';

import { getResponse, SaveApiResponse } from '../general/Interface/admin/admin';

// import { MasterParams } from '../sales/sales.class';

@Injectable({
  providedIn: 'root'
})

export class ProjectsService {

  constructor(private http: HttpClient) { }
  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }
  updateNoticeDate(body:any): Observable<any> {
    return this.http.post(environment.Url + 'property/UpdateUnitVacateNotice/', body)
  }
  getNoticeDateDetails(body:any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitVacateNotice/', body)
  }
  getLegalCharges(body: any): Observable<any>{
    return this.http.post(environment.Url + 'property/GetLegalCharges', body)
  }
  updateLegalCharges(body:any):Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitLegalCharges', body)
  }
  getAuthoriseInvoicesData(body:any):Observable<any>{
    return this.http.post(environment.Url + 'property/GetTranNumberDetails', body)
  }
  authoriseSelectedData(body:any):Observable<any>{
    return this.http.post(environment.Url + 'property/AuthorizeTrans', body)
  }

  getVentureDetails(vdt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetVentureDetails', vdt)
  }

  updateVentureDetails(vtr: venturnClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdateVentureDetails', vtr)
  }
  GetProjectStakersDetails(vtr: any):Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/GetProjectStakersDetails', vtr)
  }

  GetProjectCostsHeader(pro: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetProjectCostsHeader', pro)
  }

  UpdateProjectsCostHdr(pro: ProjectClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdateProjectsCostHdr', pro)
  }

  GetPlotDetails(pdt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetPlotDetails', pdt)
  }

  updatePlotDetails(plt: plotClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdatePlotDetails', plt)
  }

  UpdateExtendedBillsDet(bill: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateExtendedBillsDet', bill)
  }

  getFlatDetails(pro: MasterParams): Observable<any> {
    return this.http.post<any>(environment.Url + 'property/GetUnitDetails', pro)
  }

  UpdateFlatDetails(flatCls: FlatClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnit', flatCls)
  }

  getBlockDetails(bcls: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetBlockDetails', bcls)
  }

  UpdateBlockDetails(bcls: BlockClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateBlock', bcls)
  }

 

  UpdatePropertyDetails(propCls: PropertyCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateProperty', propCls)
  }

  GetPlotSales(pdt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetPlotSales', pdt)
  }

  updatePlotSales(plt: plotSaleClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdatePlotSalesHdr', plt)
  }

  getBudget(budget: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetBudgets', budget)
  }

  updateBugetHdr(bgt: BudgetCls): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdateBudgetsHdr', bgt)
  }

  getBudgetDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'venture/GetBudgetDetails/', body)
  }
  UpdateBudgetDetails(bgtDets: BudgetDetailsCls):Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdateBudgetsDet/', bgtDets)
  }

  // -----flat services---- //
  GetUnitChargeDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitChargeDetails/', body)
  }

  UpdateUnitCharges(finCls: finacialsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitCharges/', finCls)
  }

  GetUnitServiceDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitServiceDetails/', body)
  }

  UpdateUnitServices(serCls: serviceClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitServices/', serCls)
  }

  GetUnitEquipmentDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitEquipmentDetails/', body)
  }

  UpdateUnitEquipment(equntCls: equipmentClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitEquipment/', equntCls)
  }

  GetUnitLandlordCharges(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitLandlordCharges/', body)
  }

  UpdateUnitLandlordCharge(equntCls: unitLandLordClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitLandlordCharge/', equntCls)
  }

  GetTenantInvoiceHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantInvoiceHdr/', body)
  }

  UpdateTenantInvoiceHdr(equntCls: invoiceClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateTenantInvoiceHdr/', equntCls)
  }

  GetTenantInvoiceDet(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantInvoiceDet/', body)
  }

  UpdateTenantInvoiceDet(equntCls: invoiceDetailClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateTenantInvoiceDet/', equntCls)
  }
  getLegalChargesCalcs(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitLegalCharges', body)

  }
  GetReportTenantInvoice(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetReportTenantInvoice/', body)
  }

  sendEmailWithAttachment(formFile: any, mailTo: string, mailToName: string, mailSubject: string, mailMsg: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('formFile', formFile);
    formData.append('mailTo', mailTo);
    formData.append('mailToName', mailToName);
    formData.append('mailSubject', mailSubject);
    formData.append('mailMsg', mailMsg);

    return this.http.post(`${environment.Url}MasterItems/SendEmail`, formData);
  }

  UpdateUnitRecurringChargesForAll(unitCls: unitCharges): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitRecurringChargesForAll/', unitCls)
  }

  GetTenantInvoiceCosts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantInvoiceCosts/', body)
  }

  pullTenantInvoiceCosts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/PullTenantInvoiceCosts/', body)
  }
  GetReportUnitsData(propCls: propertyReportData): Observable<any> {
    return this.http.post(environment.Url + 'property/GetReportUnitsData/', propCls)
  }

  GetUnitRecurringChargesForAll(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitRecurringChargesForAll/', body)
  }

  GetTenantAgreementDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantAgreementDetails/', body)
  }

  GetUnitsSearchList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetUnitsSearchList/', body)
  }

  GetUnitWaterMeterRdg(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitMeterRdg/', body)
  }
  GetExtendedBillsDetInfo(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetExtendedBillsDet/', body)
  }
  UpdateExtendedBillsDetInfo(tranCls: TransactionDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateExtendedBillsDet/', tranCls)
  }

  UpdateExtendedBillsHdr(waterCls: waterReading): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateExtendedBillsHdr/', waterCls)
  }
  // MasterItems/GetProjectsSearchList

  GetUnitAllocationDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetUnitAllocationDetails/', body)
  }

  GetReportUnitGrievancesHistory(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetReportUnitGrievancesHistory/', body)
  }

  GetReportTechnicianHistory(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetReportTechnicianHistory/', body)
  }



  UpdateUnitPreBooking(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitPreBooking/', body)
  }

  FetchTenantInvoiceData(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/FetchTenantInvoiceData/', body)
  }

  ReportGetClientBalances(body: any): Observable<any> {
    return this.http.post(environment.Url + 'sales/ReportGetClientBalances/', body)
  }

  AutogenerateTenantInvoices(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/AutogenerateTenantInvoices/', body)
  }
  GetReportInvoicesList(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/GetReportInvoicesList/', body)
  }

  GetLastGeneratedInvoiceInfo(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetLastBulkInvoiceInfo/', body)
  }

  GetExtendedBillsHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetExtendedBillsHdr/', body)
  }

  // GetDashUnitStatus(body: any): Observable<any> {
  //   return this.http.post(environment.Url + 'reports/GetDashUnitStatus/', body)
  // }

  GetDashRevenue(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetDashRevenue/', body)
  }

  GetReportTenantInvoicesData(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetReportTenantInvoicesData/', body)
  }
  UpdateProjectStakersDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'venture/UpdateProjectStakersDetails', body)
  }

  UpdateInvoicePlotFlatHdr(body: unitSalesClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Invoice/UpdateInvoicePlotFlatHdr/', body)
  }

  GetSaleInvoicePFHdr(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'Invoice/GetSaleInvoicePFHdr/', body)
  }

  GetFlatPlotSaleDetails(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'Invoice/GetFlatPlotSaleDetails/', body)
  }

  UpdateFlatPlotSaleDetails(body: unitSalesDetailsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Invoice/UpdateFlatPlotSaleDetails/', body)
  }
  GetBudgetWorkDetails(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'venture/GetBudgetWorkDetails/', body)
  }
  UpdateBudgetWorkDet(body: workdetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'venture/UpdateBudgetWorkDet/', body)
  }



  GetDashboardBudgets(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'dashboard/GetDashboardBudgets/', body)
  }

  GetDashboardsData(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'dashboard/GetDashboardsData/', body)
  }


  UpdateExpenseUnitDetails(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateExpenseUnitDetails/', body)
  }



  GetExpenseUnitDetails(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'property/GetExpenseUnitDetails/', body)
  }



  GeLinkedTranUnits(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'property/GeLinkedTranUnits/', body)
  }


  UpdateLinkUnitsAndTransactionsDetails(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateLinkUnitsAndTransactionsDetails/', body)
  }


  UpdatePropertyTransfer(transefCls: TransferDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdatePropertyTransfer/', transefCls)
  }

  GetPropertyTransferDetails(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'property/GetPropertyTransferDetails/', body)
  }



  UpdateUnitLandlordDetails(mulCls: multiClients): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateUnitLandlordDetails/', mulCls)
  }


  GetUnitLandlords(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'property/GetUnitLandlords/', body)
  }

}




