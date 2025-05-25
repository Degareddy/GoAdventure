export class TaxDetailsClass {
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
}

export class ExcRateClass {
  public company!: string
  public location!: string
  public ConvDate!: Date
  public baseCurrency!: string
  public ConvCurrency!:string
  public rate!: number
  public convStatus!: string
  public user!:string
  public refNo!:string
  public mode!:string
}

export class BankDeptClass {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public tranType!: string
  public refTranNo!: string
  public party!: string
  public chequeNo!: string
  public chequeDate!: Date
  public chequeAmount!: number
  public chequeStatus!: string
  public activityDate!: Date
  public remarks!: string
}

export class BankClass {
  public company!: string
  public location!: string
  public langID!: number
  public code!: string
  public bankName!: string
  public cashHandles!: boolean
  public notCashHandles!: boolean
  public effectiveDate!: string
  public website!: string
  public notes!: string
  public bankStatus!: string
  public mode!: string
  public user!: string
  public refNo!: string
   public BankType!: string
}

export class ExpenseHdr {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public tranDate!: string
  public tranStatus!: string
  public notes!: string
  public mode!: string
  public user!: string
  public refNo!: string
  public Supplier!:string
}

export class ExpenseDet {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public slNo!: number
  public expenseItem!: string
  public property!: string
  public block!: string
  public unit!: string
  public amount!: number
  public expTo!: string
  public expRefNo!: string
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
}

export class bankAccountDetails {
  public signAuthority!:string;
  public accountName!:string
  public Company!: string
  public Location!: string
  public langID!: number
  public Code!: string
  public accNo!: string
  public Currency!: string
  public CurrencyName !: string
  public slNo!: number
  public branchCode!: string
  public branchName!: string
  public iFSCCode!: string
  public address1!: string
  public address2!: string
  public pOBoxNO!: string
  public city!: string
  public province!: string
  public phone1!: string
  public phone2!: string
  public email!: string
  public accountStatus!: string
  public notes!: string
  public Mode!: string
  public User!: string
  public RefNo!: string
}

export class BankDepositsHeader {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: Date
  public depositType!: string
  public bankCode!: string
  public accountNo!: string
  public currency!: string
  public tranStatus!: string
  public remarks!: string
  public Mode!: string
  public User!: string
  public RefNo!: string
}

export class BankDepositsDet {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public tranType!: string
  public refTranNo!: string
  public party!: string
  public chequeNo!: string
  public chequeDate!: Date
  public chequeAmount!: number
  public chequeStatus!: string
  public activityDate!: Date
  public remarks!: string
  public Mode!: string
  public User!: string
  public RefNo!: string
}

export class financialPeriod {
  public company!: string
  public location!: string
  public langID!: number
  public finYrCode!: string
  public finYrDesc!: string
  public fromDate!: string
  public toDate!: string
  public notes!: string
  public mode!: string
  public user!: string
  public refNo!: string
}

export class financialPerioddetails {
  mode!: string;
  company!: string;
  location!: string;
  finYrCode!: string;
  slNo!: number;
  periodNo!: string;
  periodName!: string;
  periodFrom!: string;
  periodTo!: string;
  remarks!: string;
  user!: string;
  refNo!: string;
  prdStatus!:string
}
