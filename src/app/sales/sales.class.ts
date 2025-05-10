export class Customer {
  public mode!: string
  public company!: string
  public location!: string
  public groupName!: string
  public groupCode!: string
  public code!: string
  public name!: string
  public effectiveDate!: Date
  public status!: string
  public vATPINNo!: string
  public currency!: string
  public payTerm!: string
  public pricing!: string
  public maxCrLimit!: number
  public secuItemDesc!: string
  public salesExecutive!: string
  public phone!:string;
  public eMail!:String;
  public notes!: string
  public refNo!: string
  public user!: string
  public Type!: string
  public Item!: string
  public isCustomer!: boolean;
  public isVendor!: boolean;
  public isEmployee!: boolean;
  public isLandlord!: boolean;
  public isTenant!: boolean;
  public isStaker!:boolean;
  public IsCareTaker !:boolean;
  public repCode!:any;
  public repName!:any;
}
export class vendorProducts{
  public Mode!:string;
  public company!: string
  public location!: string
  public Supplier!:string;
  public SlNo!:number;
  public ProdCode!:string;
  public Rate!:string;
  public ValidUntil!:Date;
  public ProdStatus!:string;
  public User!:string;
  public RefNo!:string;

}

export class MasterParams {
  public company!: string
  public location!: string
  public type!: string
  public item!: string
  public itemFirstLevel!: string
  public itemSecondLevel!: string
  public user!: string | null
  public password!: string
  public refNo!: string
  public TranNo!: string
  public langId!: number
  public tranType!: string
  public tranNo!: string
}
export class getTripIds{
  public company!:string
  public location!: string
  public packageType!: string
  public packageName!: string
  public tripId!: string
  public tripDesc!: string
  public tranDate!: string
  public startDate!: string
  public endDate!: string
  public tripStatus!: string
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
}
export class Address {
  public mode!: string
  public company!: string
  public location!: string
  public code!: string
  public slNo!: number
  public address1!: string
  public address2!: string
  public address3!: string
  public pO_PIN_ZIP!: string
  public city!: string
  public province!: string
  public country!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public fax!: string
  public eMail!: string
  public currStatus!: string
  public notes!: string
  public user!: string
}

export class CustomerParams {
  public company!: string
  public location!: string
  public code !: string
  public slNo!: number
  public contactId !: string
  public user !: string
  public refNo!: string
  public Type!: string
}
export class CustomerParam {
  public company!: string
  public location!: string
  public Code !: string
  public user !: string
  public refNo!: string
}

export class Contact {
  public mode!: string
  public company!: string
  public location!: string
  public code!: string
  public slNo!: number
  public contactID!: string
  public contactName!: string
  public department!: string
  public designation!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public eMail!: string
  public currStatus!: string
  public remarks!: string
  public nationality!: string
  public idNo!: string
  public dob!: string
  public user!: string
}

export class QuotationHdrCls {
  public ScrId!: string;
  public user!: string
  public Mode!: string;
  public Company!: string;
  public Location!: string;
  public LangID!: number;
  public refNo!: string
  public InvType!: string;
  public TranNo!: string;
  public TranDate!: string;
  public SaleNo!: string;
  public Customer!: string;
  public PayTerm!: string;
  public Currency!: string;
  public ExchRate!: number;
  public SalesRep!: string;
  public LPONo!: string;
  public DelNo!: string;
  public DelMethod!: string;
  public TruckNo!: string;
  public Transporter!: string;
  public DriverName!: string;
  public DriverID!: string;
  public ApplyVAT!: boolean;
  public IssueStock!: boolean;
  public Remarks!: string;
  public BillTo!: string;
  public ShipTo!: string;
  public billToDes!: string;
  public shipToDesc!: string;
  public trantype!: string;
}
export class saleQuotationHdrCls {
  ScrId!: string;
  Mode!: string;
  Company!: string;
  Location!: string;
  LangId!: number;
  TranNo!: string;
  RevisionNo!: string;
  TranDate!: string;
  ValidDays!: number;
  Customer!: string;
  Currency!: string;
  ExchRate!: number;
  PayTerm!: string;
  SalesExec!: string;
  CustRef!: string;
  ApplyVAT!: boolean;
  Remarks!: string;
  BillTo!: string;
  User!: string;
  RefNo!: string;
  TranStatus!: string
}
export class QuatationDetails {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public product!: string
  public productName!: string
  public uom!: string
  public unitRate!: number
  public discRate!: number
  public vatRate!: number
  public netRate!: number
  public quantity!: number
  public amount!: number
  public user!: string;
  public refNo!: string;
  public mode!: string;
}

export class SalesOrderDetails {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public product!: string
  public productName!: string
  public uom!: string
  public unitRate!: number
  public discRate!: number
  public vatRate!: number
  public netRate!: number
  public quantity!: number
  public amount!: number
  public delivered!: number
  public mode!: string;
  public user!: string;
  public refNo!: string;
}

export class OrderInvDetails {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public saleNo!: string
  public slNo!: number
  public issueNo!: string
  public issueDate!: Date
  public issueValue!: number
  public vATAmount!: number
  public totalAmount!: number

}

export class InvoiceHeader {
  public company!: string
  public location!: string
  public langID!: number
  public invType!: string
  public tranNo!: string
  public lpoNo!: string
  public tranDate!: Date
  public customer!: string
  public payTerm!: string
  public currency!: string
  public exchRate!: number
  public salesRep!: string
  public tranStatus!: string
  public applyVAT!: boolean
  public remarks!: string
  public tranAmount!: number
  public charges!: number
  public vatAmount!: number
  public totalAmount!: number
}

export class InvoiceDetailsClass {
  public company!: string
  public location!: string
  public langID!: number
  public invType!: string
  public tranNo!: string
  public slNo!: number
  public prodCode!: string
  public product!: string
  public uom!: string
  public unitRate!: number
  public discRate!: number
  public vatRate!: number
  public netRate!: number
  public quantity!: number
  public amount!: number
  public refNo!: string
  public user!: string
  public mode!: string
  public warehouse!: string

}

export class ReceiptDetails {
  public company!: string
  public location!: string
  public langID!: number
  public receiptNo!: string
  public slNo!: number
  public refDocNo!: string
  public refDocDate!: Date
  public receiptDueDate!: Date
  public currency!: string
  public exchRate!: number
  public docAmt!: number
  public balAmt!: number
  public receiptAmt!: number
  public remarks!: string
}


export class PricingDetails {
  public company!: string
  public location!: string
  public langID!: number
  public priceID!: string
  public prodCode!: string
  public rate!: number
}


export class recieptsClass {
  public company!: string
  public location!: string
  public langID!: number
  public TranNo!: string
  public TranDate!: string
  public ClientBankRefDate!: string
  public OtherFirstRefNo!: string
  public OtherSecondRefNo!: string
  public OtherRefDate!: string
  public ClientTranStatus!: string
  public TranAt!: string
  public TranBy!:string
  public Client!: string
  public Currency!: string
  public TranMode!: string
  public ClientBank!: string
  public ClientAccount!: string
  public ClientAccName!: string
  public instrumentNo!: string
  public instrumentDate!: string
  public instrumentStatus!: string
  public TranType!: string
  public TxnBank!: string
  public TxnAccount!: string
  public TxnDate!: string
  public TxnStatus!: string
  public TranAmount!: number
  public tranStatus!: string
  public Remarks!: string
  public PaidCurrency!: string
  public PaidExchRate!: number
  public Charges!: number
  public PaidAmt!: number
  public AllottedAmount!: number
  public Mode!: string
  public User!: string
  public RefNo!: string
  public TranFor!: string
  public ClientType!:string
  public IsCash!:boolean
  public ClientBankRefNo!:string
}
export class ReceiptsDetails {
  public company!: string
  public location!: string
  public langID!: number
  public receiptNo!: string
  public slNo!: number
  public refDocNo!: string
  public refDocDate!: Date
  public receiptDueDate!: Date
  public currency!: string
  public exchRate!: number
  public docAmt!: number
  public balAmt!: number
  public receiptAmt!: number
  public remarks!: string
  public Mode!: string
  public User!: string
  public RefNo!: string
}
export class paymentClass {
  public company!: string
  public location!: string
  public langID!: number
  public payNo!: string
  public payDate!: Date
  public supplier!: string
  public currency!: string
  public payMode!: string
  public bank!: string
  public accNumber!: string
  public instrumentNo!: string
  public instrumentDate!: Date
  public instrumentStatus!: string
  public payStatus!: string
  public supplierBank!: string
  public supplierAccount!: string
  public paidDate!: Date
  public transferStatus!: string
  public tranAmount!: number
  public tranStatus!: string
  public remarks!: string
  public Mode!: string
  public User!: string
  public RefNo!: string
}

export class recieptDetails {
  SlNo: number;
  RefDocNo: string;
  RefDocDate: Date;
  ReceiptDueDate: Date;
  Currency: string;
  CurrencyName: string;
  ExchRate: number;
  DocAmt: number;
  BalAmt: number;
  ReceiptAmt: number;
  Remarks: string;

  constructor(
    SlNo: number,
    RefDocNo: string,
    RefDocDate: Date,
    ReceiptDueDate: Date,
    Currency: string,
    CurrencyName: string,
    ExchRate: number,
    DocAmt: number,
    BalAmt: number,
    ReceiptAmt: number,
    Remarks: string
  ) {
    this.SlNo = SlNo;
    this.RefDocNo = RefDocNo;
    this.RefDocDate = RefDocDate;
    this.ReceiptDueDate = ReceiptDueDate;
    this.Currency = Currency;
    this.CurrencyName = CurrencyName;
    this.ExchRate = ExchRate;
    this.DocAmt = DocAmt;
    this.BalAmt = BalAmt;
    this.ReceiptAmt = ReceiptAmt;
    this.Remarks = Remarks;
  }
}

export class deliveryHeader {
  mode!: string;
  company!: string;
  location!: string;
  langID!: number;
  tranNo!: string;
  tranDate!: string;
  saleNo!: string;
  customer!: string;
  shipTo!: string;
  shipToDesc !: string
  delMethod!: string;
  truckNo!: string;
  transporter!: string;
  driverName!: string;
  driverID!: string;
  remarks!: string;
  user!: string;
  refNo!: string;
}

export class SaleOrderHeader {
  mode!: string;
  company!: string;
  location!: string;
  langId!: number;
  tranNo!: number;
  tranDate!: string;
  quotationNo!: string;
  scheduleType!: string;
  customer!: string;
  currency!: string;
  exchRate!: number;
  payTerm!: string;
  pricing!: string;
  salesExec!: string;
  custRef!: string;
  billTo!: string;
  billToDes!: string
  shipTo!: string;
  shipToDesc!: string
  applyVAT!: boolean;
  remarks!: string;
  user!: string;
  refNo!: string;
  ScheduleType!: string
  tranStatus!: string
}

export class deliveryDetails {
  mode!: string;
  company!: string;
  location!: string;
  langID!: number;
  product!: string
  uom!: string
  tranNo!: string;
  slNo!: number;
  quantity!: number
  user!: string;
  refNo!: string;
  rowWeight!: number
  warehouse!: string
}

export class OrderInvoiceHeader {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public saleNo!: string
  public lpoNo!: string
  public tranDate!: Date
  public customer!: string
  public payTerm!: string
  public currency!: string
  public exchRate!: number
  public BillTo!: string;
  public tranStatus!: string
  public applyVAT!: boolean
  public remarks!: string
  public tranAmount!: number
  public charges!: number
  public vatAmount!: number
  public totalAmount!: number
}
