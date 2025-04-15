export class payComponents{
  mode!: string;
  company!: string;
  location!: string;
  payId!: string;
  payDesc!: string;
  payOn!: string;
  payType!: string;
  payBy!: string;
  taxable!: boolean;
  isMandatory!: boolean;
  payValue!: number;
  createdDate!: string;
  notes!: string;
  user!: string;
  refNo!: string;
}
export class eligibleLeaves {
  public company!: string
  public location!: string
  public yearNo!: string
  public fromDate!: string
  public toDate!: string
  public tranStatus!: string
  public notes!: string
  public mode!: string
  public user!: string
  public refNo!: string
  public tranDate!:string
}
export class eligibleLeavesDetails {
  public company!: string
  public location!: string
  public yearNo!: string
  public leaveType!: string
  public eligibleLeaves!: string
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
  public slNo!:number;
}
export class attendenceRegister {
  company!: string
  location!: string
  tranNo!: string
  payrollYear!: string
  payrollPeriod!: string
  tranDate!: string
  tranStatus!: string
  notes!: string
  mode!: string
  user!: string
  refNo!: string
}

export class bonusType {
  public company!: string
  public location!: string
  public langID!: number
  public bonusCode!: string
  public bonusName!: string
  public bonusType!: string
  public tranDate!: Date
  public itemStatus!: string
  public notes!: string
}
export class absentRegister {
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public payrollYear!: string
  public payrollMonth!: string
  public tranStatus!: string
  public notes!: string
}
export class shiftInfo {
  public company!: string
  public location!: string
  public typeCode!: string
  public typeDesc!: string
  public fromTime!: string
  public toTime!: string
  public typeRate!: number
  public tranDate!: Date
  public typeStatus!: string
  public notes!: string
  public mode!:string
  public user!: string
  public refNo!: string

}
export class annualHolidays {
  public company!: string
  public location!: string
  public yearNo!: string
  public tranDate!: Date
  public optionalHolidays!: number
  public publicHolidays!: number
  public tranStatus!: string
  public remarks!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class taxTable {
  public mode!:string
  public company!: string
  public location!: string
  public tableType!: string
  public yearCode!: string
  public validFrom!: string
  public validTo!: string
  public taxStatus!: string
  public notes!: string
  public user!: string
  public refNo!: string
  // public langId!: string
}

export class taxTableDetails {
  public company!: string
  public location!: string
  public yearCode!: string
  public slNo!: number
  public tableType!: string
  public rateType!: string
  public fromAmt!: number
  public toAmt!: number
  public rate!: string
  public note!: string
  public user!: string
  public refNo!: number
  public mode!: string
}

export class employeClass {
  public company!: string
  public location!: string
  public empID!: string
  public firstName!: string
  public lastName!: string
  public otherName!: string
  public fatherName!: string
  public motherName!: string
  public dOB!: Date
  public gender!: string
  public nationality!: string
  public iDCardNo!: string
  public address1!: string
  public address2!: string
  public address3!: string
  public pOBox!: string
  public city!: string
  public province!: string
  public country!: string
  public homePhone!: string
  public mobilePhone!: string
  public eMail!: string
  public empStatus!: string
  public notes!: string

}

export class HolidayRegister {
  public company!: string
  public location!: string
  public leaveCode!: string
  public leaveDesc!: string
  public applicableTo!: string
  public isEncashable!: boolean
  public isCarryFwdble!: boolean
  public tranDate!: Date
  public typeStatus!: string
  public notes!: string
}

export class payClass {
  public company!: string
  public location!: string
  public payID!: string
  public payDesc!: string
  public payOn!: string
  public payType!: string
  public payBy!: string
  public taxable!: boolean
  public isMandatory!: boolean
  public payValue!: number
  public createdDate!: Date
  public tranStatus!: string
  public notes!: string
}

export class LeaveRegister {
  public company!: string
  public location!: string
  public tranNo!: number
  public tranDate!: Date
  public employee!: string
  public leaveType!: string
  public requestedLeaveFrom!: Date
  public requestedLeaveTo!: Date
  public sanctionedLeaveFrom!: Date
  public sanctionedLeaveTo!: Date
  public joinedBackOn!: Date
  public totalLeaveDays!: number
  public appliedOn!: Date
  public approvedOn!: Date
  public approvedBy!: string
  public isBonusLeave!: boolean
  public extraLeavesTaken!: number
  public leaveStatus!: string
  public remarks!: string
  public langID!: number
  public slNo!: number
  public refNo!: number
  public user!: string
  public mode!: string
}



export class lotRegister {
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public notes!: string
  public tranStatus!: string

}

export class annualHolidys {
  public company!: string
  public location!: string
  public yearNo!: string
  public tranDate!: Date
  public optionalHolidays!: number
  public publicHolidays!: number
  public tranStatus!: string
  public remarks!: string
}

export class salaryAdvance {
  public company!: string
  public location!: string
  public payrollYear!: string
  public payrollPeriod!: string
  public tranNo!: string
  public tranDate!: Date
  public notes!: string
  public tranStatus!: string
}

export class Attendance {
  public company!: string
  public location!: string
  public tranNo!: string
  public payrollYear!: string
  public payrollPeriod!: string
  public tranDate!: Date
  public tranStatus!: string
  public notes!: string

}
export class BonusClass {
  public mode!: string
  public langId!: number
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: string
  public payrollYear!: string
  public payrollMonth!: string
  public tranStatus!: string
  public notes!: string
  public user!: string
  public refNo!: number
  public bonusTypes!: string
  public bonusCode!: number
  public bonusName!: string
  public bonusType!: string
}

export class AbsentClass {
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public payrollYear!: string
  public payrollMonth!: string
  public tranStatus!: string
  public notes!: string
}
export class leaveType {
  public refNo!: number
  public user!: string
  public mode!: string
  public company!: string
  public location!: string
  public leaveCode!: string
  public leaveDesc!: string
  public applicableTo!: string
  public isEncashable!: boolean
  public isCarryFwdble!: boolean
  public tranDate!: string
  public typeStatus!: string
  public notes!: string
}

export class AppraisalClass {
  mode!: string
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public payrollYear!: string
  public payrollMonth!: string
  public wEF!: Date
  public tranStatus!: string
  public notes!: string
  public user!: string
  public refNo!: number
}


export class promotionClass {
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public payrollYear!: string
  public payrollMonth!: string
  public tranStatus!: string
  public notes!: string
}


export class PaySlipClass {
  public company!: string
  public location!: string
  public refNo!: string
  public employee!: string
  public department!: string
  public designation!: string
  public empType!: string
  public payID!: string
  public payType!: string
  public basicPay!: number
  public isTaxable!: boolean
  public flatOrPercent!: string
  public rate!: number
  public amount!: number
  public grossPay!: number
  public taxablePay!: number
  public taxAmount!: number
  public deductedAmt!: number
  public netPay!: number
  public mMonth!: string
  public mYear!: number
  public payDate!: Date
  public payMode!: string
  public perAmount!: number
  public tranStatus!: string
  public tranDate!: Date
}
export class HolidayDefClass {
  public company!: string
  public location!: string
  public holidayCode!: string
  public holidayDesc!: string
  public holidayType!: string
  public tranDate!: Date
  public fromDate!: Date
  public toDate!: Date
  public daysCount!: number
  public repeats!: boolean
  public typeStatus!: string
  public notes!: string
}

export class LonesClass {
  mode!: string;
  public refNo!: number
  public user!: string
  public langID!: number
  public company!: string
  public location!: string
  public tranNo!: string
  public employee!: string
  public designation!: string
  public department!: string
  public empType!: string
  public tranDate!: Date
  public appliedOn!: Date
  public sanctionOn!: Date
  public deductionFrom!: string
  public fromYear!: number
  public totalInstallments!: number
  public paidInstallments!: number
  public balInstallments!: number
  public loanAmount!: number
  public interestType!: string
  public interestRate!: number
  public totalToPay!: number
  public totalPaid!: number
  public balToPay!: number
  public tranStatus!: string
  public notes!: string
}

export class payPerticularclass {
  public company!: string
  public location!: string
  public payID!: string
  public payDesc!: string
  public payOn!: string
  public payType!: string
  public payBy!: string
  public taxable!: boolean
  public isMandatory!: boolean
  public payValue!: number
  public createdDate!: Date
  public tranStatus!: string
  public notes!: string
}
export class loanDetails {
  public company!: string
  public location!: string
  public tranNo!: string
  public slNo!: number
  public instNo!: number
  public instMonth!: string
  public instYear!: number
  public instAmt!: number
  public adjustments!: number
  public paidAmt!: number
  public paidOn!: Date
  public instStatus!: number
  public remarks!: string
  public langID!: number
  public user!: string
  public mode!: string
  public refNo!: number

}

export class Guranteers {
  public company!: string
  public location!: string
  public tranNo!: string
  public slNo!: number
  public employee!: string
  public joinDate!: Date
  public basic!: number
  public lastPay!: number
  public remarks!: string
  public rowStatus!: string
  public langID!: number
  public user!: string
  public refNo!: number
  public mode!: string

}
