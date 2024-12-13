import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BranchClass, CompanyClass, userBranchClass } from '../admin/admin.class';
import { Observable } from 'rxjs';
import { BranchLocationsResponse, BranchMappingResponse, CompanyResponse, getPayload, helpApiResponse, HelpTextData, getResponse, SaveApiResponse, userResponse } from '../general/Interface/admin/admin';
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = environment.Url;
  constructor(private http: HttpClient) { }
  getCompanyData(company: CompanyClass): Observable<CompanyResponse>  {
    return this.http.post<CompanyResponse>(`${this.baseUrl}Company/GetCompanyDetails/`, company)
  }

  saveCompanyData(company: CompanyClass): Observable<SaveApiResponse>  {
    return this.http.post<SaveApiResponse>(`${this.baseUrl}Company/InsertCompanyDetails/`, company)
  }

  GetUsersList(body: any) : Observable<any> {
    return this.http.post(`${this.baseUrl}Users/GetUsersData/`, body)
  }
  getUserDataByName(body: getPayload): Observable<userResponse>  {
    return this.http.post<userResponse>(`${this.baseUrl}Users/GetUserDetails/`, body)
  }

  saveUserData(userData: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(`${this.baseUrl}Users/UpdateUsers/`, userData,);
  }
  GetMasterItemsList(body: getPayload): Observable<getResponse>  {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetMasterItemsList/', body)
  }
  GetGCMappings(body: any): Observable<any>  {
    return this.http.post(environment.Url + 'Company/GetGCMappings/', body)
  }
  GetBranchList(body: any): Observable<BranchLocationsResponse>  {
    return this.http.post<BranchLocationsResponse>(environment.Url + 'Company/GetBranches/', body)
  }
  searchPopup(body: any): Observable<any>  {
    return this.http.post(environment.Url + 'MasterItems/GetTranSearchList/', body)
  }
  UpdateGCMappings(body: any): Observable<SaveApiResponse>  {
    return this.http.post<SaveApiResponse>(environment.Url + 'Company/UpdateGCMappings/', body)
  }
  UpdateBranchDetails(body: BranchClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Company/UpdateBranchDetails/', body)
  }

  getIPAddress() {
    return this.http.get("https://api.ipify.org/?format=json")
  }

  GetUserBranches(body: getPayload): Observable<BranchMappingResponse> {
    return this.http.post<BranchMappingResponse>(environment.Url + 'Users/GetUserBranches', body)
  }
  UpdateUserBranches(body: userBranchClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Users/UpdateUserBranches', body)
  }
  GetTransactionRecipt(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportTransactionRegister', doc)

  }
  GetNameSearchCount(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetNameSearchCount', doc)
  }

  getHelp(body: any): Observable<helpApiResponse> {
    return this.http.post<helpApiResponse>(environment.Url + 'MasterItems/GetHelp', body)
  }

  getHelpOnline(body: any): Observable<helpApiResponse> {
    return this.http.post<helpApiResponse>(environment.Url + 'MasterItems/GetHelpOnline', body)
  }

  updateHelpText(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'MasterItems/UpdateHelpTopic', body)
  }

  getUserIpsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Users/GetUserIpsList', body)
  }

  getTransactionLog(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTransactionLog', body)
  }
  UpdateAllowedIps(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Users/UpdateAllowedIps', body)
  }
  ManageAccessModesMapping(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Users/ManageAccessModesMapping', body)
  }

  GetAccessModesMapping(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Users/GetAccessModesMapping', body)
  }

  GetUserMappedCompanies(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Users/GetUserMappedCompanies', body)
  }
}


