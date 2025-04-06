import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { bankAccountDetails, BankDepositsHeader, BankDepositsDet, financialPeriod, financialPerioddetails, ExcRateClass } from '../gl/gl.class';
import { SaveApiResponse } from '../general/Interface/admin/admin';


@Injectable({
  providedIn: 'root'
})
export class GeneralLedgerService {

  constructor(private http: HttpClient) { }
  GetFinancialPeriods(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetFinancialPeriods/', body)
  }
  UpdateFinancialPeriods(body: financialPerioddetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateFinancialPeriods/', body)
  }

  getBankDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetBankDetails/', body)
  }
  GetFinancialYearsData(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetFinancialYearsData/', body)
  }
  UpdateFinancialYears(body: financialPeriod): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateFinancialYears/', body)
  }

  UpdateBankDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/UpdateBankDetails/', body)
  }

  GetBankAccountDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetBankAccountDetails/', body)
  }

  UpdateBankAccountDetails(bankCls: bankAccountDetails): Observable<any> {
    return this.http.post(environment.Url + 'ledger/UpdateBankAccountDetails/', bankCls)
  }

  /*Expenses service */
  getExpensesHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetExpenses/', body)
  }

  UpdateExpensesHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/UpdateExpenses/', body)
  }

  getExpensesDet(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetExpenseDetails/', body)
  }

  UpdateExpensesDet(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/UpdateExpenseDetails/', body)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }


  GetBankReconcilliationHeader(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetBankReconcilliationHeader', body)
  }

  UpdateBankReconcilliationHdr(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateBankReconcilliationHdr', body)
  }

  getBankDepositsHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetBankDeposits/', body)
  }

  UpdateBankDepositsHdr(bdHdr: BankDepositsHeader): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateBankDeposits/', bdHdr)
  }

  getBankDepositsDet(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetBankDepositsDetails/', body)
  }

  UpdateBankDepositsDet(bdDet: BankDepositsDet): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateBankDepositDetails/', bdDet)
  }

  GetExchangeDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'ledger/GetExchangeDetails/', body)
  }

  UpdateExchangeDetails(bdDet: ExcRateClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateExchangeDetails/', bdDet)
  }


  UpdateVATDetails(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'ledger/UpdateVATDetails/', body)
  }


}
