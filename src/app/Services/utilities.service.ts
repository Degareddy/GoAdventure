import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { documnetNumberSaveCalss, documnetNumberingClass } from '../utilities/document-numbers/document-numbering-details/docNumber.modal';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { partySearchClass } from '../layouts/partySearch';
import { productSearchClass } from '../layouts/productSearch';
import { directionsClass } from '../project/Project.class';
import { GreivanceClass, GrievanceCostClass, GrievanceParams, technicianClass } from '../utilities/utilities.class';
import { nameCountResponse, SaveApiResponse } from '../general/Interface/admin/admin';

@Injectable({
  providedIn: 'root'
})
export class UtilitiesService {

  constructor(private http: HttpClient) { }

  getdocumentData(doc: documnetNumberingClass): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetDocumentNumbers', doc)
  }
  UpdateDocumentNumbers(doc: documnetNumberSaveCalss): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/UpdateDocumentNumbers', doc)
  }

  GetNameSearchCount(doc: any): Observable<nameCountResponse> {
    return this.http.post<nameCountResponse>(environment.Url + 'MasterItems/GetNameSearchCount', doc)
  }
  GetPartySearchList(doc: partySearchClass): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetPartySearchList', doc)
  }
  GetProductSearchList(doc: productSearchClass): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetProductSearchList', doc)
  }
  GetBoundaryDetails(boundary: any): Observable<any>  {
    return this.http.post(environment.Url + 'MasterItems/GetBoundaryDetails', boundary)
  }
  UpdateBoundaryDetails(boundary: directionsClass): Observable<any>  {
    return this.http.post(environment.Url + 'MasterItems/UpdateBoundaryDetails', boundary)
  }

  GetTenantSpecificGrievanceDetails(grParams: GrievanceParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetTenantSpecificGrievanceDetails', grParams)
  }
  UpdateGrievance(grCls: GreivanceClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateGrievance', grCls)
  }

  UpdatePassword(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/UpdatePassword', body)
  }

  GetSelectedGrievancesList(grParams: GrievanceParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetGrievanceAllocation', grParams)
  }

  UpdateGrievanceAllocation(grCls: GreivanceClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'property/UpdateGrievanceDetails', grCls)
  }

  GetGrievanceCosts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetGrievanceCosts', body)
  }

  UpdateGrievanceCosts(grCls: GrievanceCostClass): Observable<any> {
    return this.http.post(environment.Url + 'property/UpdateGrievanceCosts', grCls)
  }


  GetGrievanceTechs(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetGrievanceTechs', body)
  }

  UpdateGrievanceTechs(grCls: technicianClass): Observable<any> {
    return this.http.post(environment.Url + 'property/UpdateGrievanceTechs', grCls)
  }



  GetReportStatement(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportStatement', body)
  }


  GetReportCashflowStatement(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportCashflowStatement', body)
  }
  GetReportDeposit(depositBody:any):Observable<any>{
    return this.http.post(environment.Url + 'sales/ReportGetClientDepositBalances', depositBody)
  }



}
