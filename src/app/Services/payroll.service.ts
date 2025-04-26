import { Injectable } from '@angular/core';
import { MasterParams } from '../Masters/Modules/masters.module';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LonesClass, LeaveRegister, loanDetails, Guranteers, BonusClass, bonusType, attendenceRegister, AppraisalClass, annualHolidays, taxTable, taxTableDetails, leaveType, eligibleLeaves, eligibleLeavesDetails, payComponents, shiftInfo } from '../payroll/payroll/payroll.class';
import { Observable } from 'rxjs';
import { getPayload, getResponse, SaveApiResponse } from '../general/Interface/admin/admin';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  constructor(private http: HttpClient) { }

  GetPayComponentData(pmt: getPayload): Observable<any> {
    return this.http.post<getResponse>(environment.Url + 'payroll/GetPayComponentData', pmt)
  }
  UpdatePayComponents(elCls: payComponents): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdatePayComponents', elCls)
  }
  GetPaymentsHdrData(pmt: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'payments/GetPayments', pmt)
  }
  GetBonusTypes(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetBonusTypes', pmt)
  }
  
  GetTaxTable(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetTaxTable', pmt)
  }
  GetTaxTableDetails(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetTaxTableDetails', pmt)
  }

  GetEligibleLeaveDetails(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetEligibleLeaveDetails', pmt)
  }

  GetEligibleLeaveTypesList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetEligibleLeaveTypesList', pmt)
  }

  GetEligibleLeaves(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetEligibleLeaves', pmt)
  }
  UpdateEligibleLeaves(elCls: eligibleLeaves): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateEligibleLeaves', elCls)
  }

  UpdateEligibleLeaveDetails(elCls: eligibleLeavesDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateEligibleLeaveDetails', elCls)
  }
  UpdateBonusTypes(bonusType: BonusClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateBonusTypes', bonusType)
  }
  UpdateOTRegister(bonusType: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateOTRegister', bonusType)
  }
  UpdateTaxTable(taxCls: taxTable): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateTaxTable', taxCls)
  }
  UpdateTaxTableDetails(taxCls: taxTableDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateTaxTableDetails', taxCls)
  }
  getLeaveTypes(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLeaveTypes', pmt)
  }
  GetLeaveRegister(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLeaveRegister', pmt)
  }
  UpdateLeaveRegister(LeaveRegister: LeaveRegister): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateLeaveRegister', LeaveRegister)
  }

  GetOTRegister(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetOTRegister', pmt)
  }
  UpdateHolidayTypes(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/UpdateHolidayTypes', pmt)
  }
  getBonusTypesList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetBonusTypesList', pmt)
  }
  GetTaxTableList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetTaxTableList', pmt)
  }
  GetLeaveTypesList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLeaveTypesList', pmt)
  }
  GetHolidayTypesList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetHolidayTypesList', pmt)
  }
  GetPayComponentsList(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetPayComponentsList', pmt)
  }
  GetHolidayTypes(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetHolidayTypes', pmt)
  }
  UpdateOTRegisterDetails(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/UpdateOTRegisterDetails', pmt)
  }

  GetOTRegisterDetails(pmt: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetOTRegisterDetails', pmt)
  }

  GetLoans(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLoans/', body)
  }
  UpdateLoans(LonesClass: LonesClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateLoans', LonesClass)
  }
  UpdateLeaveTypes(body: leaveType): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateLeaveTypes/', body)
  }
  GetLeaveTypes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLeaveTypes/', body)
  }
  GetAppraisals(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetAppraisals/', body)
  }
  UpdateAppraisal(AppraisalClass: AppraisalClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateAppraisal/', AppraisalClass)
  }
  GetLoanDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLoanDetails/', body)
  }
  UpdateLoanDetails(loanDetails: loanDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateLoanDetails/', loanDetails)
  }

  GetLoanGuaranteers(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetLoanGuaranteers/', body)
  }
  UpdateLoanGuaranteers(loanGuaranteersDetails: Guranteers): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateLoanGuaranteers/', loanGuaranteersDetails)
  }
  GetBonusRegister(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetBonusRegister/', body)
  }

  UpdateBonusRegister(BonusClass: BonusClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateBonusRegister/', BonusClass)
  }

  GetAttendance(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetAttendance/', body)
  }
  UpdateAttendance(attendenceRegister: attendenceRegister): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateAttendance/', attendenceRegister)
  }
  GetAnnualHolidays(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetAnnualHolidays/', body)
  }
  UpdateAnnualHolidays(annualHolidays: annualHolidays): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateAnnualHolidays/', annualHolidays)
  }

  GetShiftTypeDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetShiftTypeDetails/', body)
  }
  GetShiftTypesList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'payroll/GetShiftTypesList/', body)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  UpdateShiftDetails(shiftDet: shiftInfo): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'payroll/UpdateShiftTypes/', shiftDet)
  }


}
