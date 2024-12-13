import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
// import { AppraisalsComponent } from './appraisals/appraisals.component';
import { PromotionsComponent } from './promotions/promotions.component';
import { ProcessPayrollComponent } from './process-payroll/process-payroll.component';
import { PayrollReportsComponent } from './payroll-reports/payroll-reports.component';
import { PayrollDashboardComponent } from './payroll-dashboard/payroll-dashboard.component';
import { PaySlipComponent } from './pay-slip/pay-slip.component';
 import { HolidayDefinitionComponent } from './holiday-definition/holiday-definition.component'
import { LoanComponent } from './loan/loan.component';
import { PayParticularComponent } from './pay-particular/pay-particular.component'
import { PayrollGuard } from '../_guard/payroll.guard';
import { AppraisalsComponent } from './appraisals/appraisals.component';
const routes: Routes = [
  // {
  // path: 'payroll',
  // component: DefaultComponent,
  // children: [
  { path: 'bonus-types', component: BonusTypesComponent,canActivate:[PayrollGuard] },
  { path: 'tables', component: TablesComponent,canActivate:[PayrollGuard] },
  { path: 'shift-info', component: ShiftInfoComponent,canActivate:[PayrollGuard] },
  { path: 'leave-types', component: LeaveTypesComponent ,canActivate:[PayrollGuard]},
  { path: 'eligible-leaves', component: EligibleLeavesComponent,canActivate:[PayrollGuard] },
  { path: 'pay-components', component: PayComponentsComponent,canActivate:[PayrollGuard] },
  { path: 'leave-register', component: LeaveRegisterComponent,canActivate:[PayrollGuard] },
  { path: 'ot-register', component: OtRegisterComponent,canActivate:[PayrollGuard] },
  { path: 'holiday-register', component: HolidayRegisterComponent ,canActivate:[PayrollGuard]},
  { path: 'salary-advance', component: SalaryAdvanceComponent ,canActivate:[PayrollGuard]},
  { path: 'attendance-register', component: AttendanceRegisterComponent ,canActivate:[PayrollGuard]},
  { path: 'bonus-register', component: BonusRegisterComponent ,canActivate:[PayrollGuard]},
  { path: 'absent-register', component: AbsentRegisterComponent ,canActivate:[PayrollGuard]},
  { path: 'annual-holidays', component: AnnualHolidaysComponent ,canActivate:[PayrollGuard]},
  { path: 'appraisals', component: AppraisalsComponent ,canActivate:[PayrollGuard]},
  { path: 'promotions', component: PromotionsComponent ,canActivate:[PayrollGuard]},
  { path: 'process-payroll', component: ProcessPayrollComponent ,canActivate:[PayrollGuard]},
  { path: 'payroll-reports', component: PayrollReportsComponent ,canActivate:[PayrollGuard]},
  { path: 'payroll-dashboard', component: PayrollDashboardComponent ,canActivate:[PayrollGuard]},
  { path: 'pay-slip', component: PaySlipComponent ,canActivate:[PayrollGuard]},
  { path: 'holiday-definition', component: HolidayDefinitionComponent ,canActivate:[PayrollGuard]},
  { path: 'loans', component: LoanComponent ,canActivate:[PayrollGuard]},
  { path: 'pay-particulars', component: PayParticularComponent ,canActivate:[PayrollGuard]},
 // { path: 'loan-details', component: LoanDetailsComponent }

  // {path:'',component:holi}
]
// }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PayrollRoutingModule { }
