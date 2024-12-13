import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollRoutingModule } from './payroll-routing.module';
import { BonusTypesComponent } from './bonus-types/bonus-types.component';
import { TablesComponent } from './tables/tables.component';
import { ShiftInfoComponent } from './shift-info/shift-info.component';
import { LeaveTypesComponent } from './leave-types/leave-types.component';
import { EligibleLeavesComponent } from './eligible-leaves/eligible-leaves.component';
import { PayComponentsComponent } from './pay-components/pay-components.component';
import { LeaveRegisterComponent } from './leave-register/leave-register.component';
import { OtRegisterComponent } from './ot-register/ot-register.component';
import { HolidayRegisterComponent } from './holiday-register/holiday-register.component';
import { SalaryAdvanceComponent } from './salary-advance/salary-advance.component';
import { AttendanceRegisterComponent } from './attendance-register/attendance-register.component';
import { BonusRegisterComponent } from './bonus-register/bonus-register.component';
import { AbsentRegisterComponent } from './absent-register/absent-register.component';
import { AnnualHolidaysComponent } from './annual-holidays/annual-holidays.component';
import { AppraisalsComponent } from './appraisals/appraisals.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ProcessPayrollComponent } from './process-payroll/process-payroll.component';
import { PayrollReportsComponent } from './payroll-reports/payroll-reports.component';
import { PayrollDashboardComponent } from './payroll-dashboard/payroll-dashboard.component';
import { PaySlipComponent } from './pay-slip/pay-slip.component';
import { HolidayDefinitionComponent } from './holiday-definition/holiday-definition.component';
import { LoanComponent } from './loan/loan.component';
import { PayParticularComponent } from './pay-particular/pay-particular.component';
import { OtRegisterDetailsComponent } from './ot-register/ot-register-details/ot-register-details.component';
import {LoanDetailsComponent} from './loan/loan-details/loan-details.component';
import { GuranteersComponent } from './loan/guranteers/guranteers.component'
import { GeneralModule } from 'src/app/general/general.module';
import { TaxTableDetailsComponent } from './tables/tax-table-details/tax-table-details.component';
import { EligibleDetailsComponent } from './eligible-leaves/eligible-details/eligible-details.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { APP_DATE_FORMATS, AppDateAdapter } from 'src/app/general/date-format';
@NgModule({
  declarations: [
    TablesComponent,
    ShiftInfoComponent,
    LeaveTypesComponent,
    EligibleLeavesComponent,
    PayComponentsComponent,
    LeaveRegisterComponent,
    OtRegisterComponent,
    HolidayRegisterComponent,
    SalaryAdvanceComponent,
    AttendanceRegisterComponent,
    BonusRegisterComponent,
    AbsentRegisterComponent,
    AnnualHolidaysComponent,
    AppraisalsComponent,
    PromotionsComponent,
    ProcessPayrollComponent,
    PayrollReportsComponent,
    PayrollDashboardComponent,
    PaySlipComponent,
    BonusTypesComponent,
    HolidayDefinitionComponent,
    LoanComponent,
    PayParticularComponent,
    OtRegisterDetailsComponent,
    LoanDetailsComponent,
    GuranteersComponent,
    TaxTableDetailsComponent,
    EligibleDetailsComponent
  ],
  imports: [
    CommonModule,
    PayrollRoutingModule,
    GeneralModule
  ],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS }
  ]
})
export class PayrollModule { }

export class CompanyData {
  public companyID!: string
  public name!: string
  public cmpDate!: Date
  public address1!: string
  public address2!: string
  public address3!: string
  public pO_PIN_ZIP!: string
  public city!: string
  public state!: string
  public country!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public fax!: string
  public email!: string
  public uRL!: string
  public vATNo!: string
  public pINNo!: string
  public logoLocn!: string
  public notes!: string
  public status!: string
}

export class UserData {
  public company!: string
  public location!: string
  public userName!: string
  public userID!: string
  public userPassword!: string
  public userProfile!: string
  public userCompany!: string
  public defaultCompany!: string
  public defaultLocn!: string
  public joinDate!: Date
  public expiresOn!: Date
  public userStatus!: string
  public lastLoginOn!: Date
  public lastLoginFailOn!: Date
  public failAttempts!: number
  public maxAllowedFailAttempts!: number
  public remarks!: string
  public email!: string
  public reAssign!: boolean
}

