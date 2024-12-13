import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { DashboardParams, MasterParams } from '../Masters/Modules/masters.module';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private http: HttpClient) { }
//#region Dashboard
  getDashboardDetails(dbParams: DashboardParams): Observable<any> {
    return this.http.post(environment.Url + 'dashboard/GetDashboardReportData', dbParams)
  }

  //#endregion

  //#region Reports
  getPurchaseOrderDetails(repParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportPurchaseOrder', repParams)
  }
  //#endregion
  GetReportProfitAndLoss(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportProfitAndLoss', body)
  }

  GetReportCashBalances(body: any): Observable<any> {
    return this.http.post(environment.Url + 'reports/GetReportCashBalances', body)
  }
}
