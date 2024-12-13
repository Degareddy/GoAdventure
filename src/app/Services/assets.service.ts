import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CompanyClass } from '../admin/admin.class';
import { Observable } from 'rxjs';
import { MasterParams } from '../Masters/Modules/masters.module';
import { insurance, AssetGroups, assetConditions } from '../assets/assets.class';
import { SaveApiResponse } from '../general/Interface/admin/admin';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {

  constructor(private http: HttpClient) { }
  getModesList(masParams: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranMode/', masParams)
  }

  GetMasterItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsList/', body)
  }
  // GetTranSearchList(body: any) {
  //   return this.http.post(environment.Url + 'MasterItems/GetTranSearchList/', body)
  // }
  getinsurancehdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetInsuranceHdr/', body)
  }
  updateinsurance(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetInsuranceData', body)
  }
  getAMCHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetAMCHdr/', body)
  }
  updateAMCHdr(body: any) : Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetAMCData', body)
  }
  getAssetGroupData(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetGroupDetails/', body)
  }
  updateAssetGrpdt(assetGrpCls: AssetGroups) : Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetGroupDetails/', assetGrpCls)
  }

  getAssetdts(body: any) : Observable<any>{
    return this.http.post(environment.Url + 'assets/GetAssetDetails/', body)
  }
  updateAssetdts(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetDetails/', body)
  }

  getassetcdt(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetConditionDetails/', body)
  }
  updateACdt(body: assetConditions): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetConditionDetails/', body)
  }
  getalDet(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetLeasingHdr/', body)
  }
  updateAlDet(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetLeasingData/', body)
  }
  getassetleasedt(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetLeasingDetails/', body)
  }
  Updateassetleasedt(body: any) : Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetLeasingDetails/', body)
  }
  getAMCDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetAMCCallData/', body)
  }
  UpdateAMCDetails(body: any) : Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetAMCCallsDetails/', body)
  }

  getATHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetTransfersHdr/', body)
  }
  updateAT(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetTransferData/', body)
  }
  getATDetails(body: any) : Observable<any>{
    return this.http.post(environment.Url + 'assets/GetAssetTransferDetails/', body)
  }
  UpdateATDetails(body: any) : Observable<SaveApiResponse>{
    return this.http.post<SaveApiResponse>(environment.Url + 'assets/UpdateAssetTransferDetails/', body)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }
  GetNameSearchCount(doc: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetNameSearchCount', doc)
  }

  GetAssetSearch(body: any): Observable<any> {
    return this.http.post(environment.Url + 'assets/GetAssetSearch', body)
  }

  getTransactionNotes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTransactionNotes', body)
  }
  updateTransactionNotes(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'MasterItems/UpdateTransactionNotes', body)
  }

}
