export class supplier {
  public company!: string
  public location!: string
  public suppID!: string
  public suppName!: string
  public suppType!: string
  public currency!: string
  public effectiveDate!: Date
  public address1!: string
  public address2!: string
  public address3!: string
  public city!: string
  public province!: string
  public country!: string
  public pO_PIN_ZIP!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public fax!: string
  public email!: string
  public url!: string
  public suppStatus!: string
  public notes!: string
  public contactName!: string
  public contactNo!: string
  public payTerm!: string
  public pricing!: string
  public latitude!: number
  public longitude!: number
}

export class purchaseRequestHeader {
  public company!: string
  public user!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: string
  public tranStatus!: string
  public purpose!: string
  public approvedBy!: string
  public approvedOn!: string
  public issuedBy!: string
  public issuedOn!: string
  public receivedBy!: string
  public receivedOn!: string
  public refNo!: string
  public authorizePOs!: boolean
  public mode!: string
}
export class purchaseRequestDetailsClass {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public slNo!: number
  public product!: string
  public prodCode!: string
  public uom!: string
  public supplier!: string
  public suppCode!: string
  public warehouse!: string
  public unitRate!: number
  public quantity!: number
  public availableQty!: number
  public pendingQty!: number
  public orderingQty!: number
  public amount!: number
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
}

export class supplierQuotation {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public revisionNo!: number
  public tranDate!: Date
  public validDays!: number
  public supplier!: string
  public currency!: string
  public exchRate!: number
  public payTerm!: string
  public salesExec!: string
  public tranStatus!: string
  public applyVAT!: boolean
  public remarks!: string
  public billTo!: string
  public billToName!: string
  public tranAmount!: number
  public vatAmount!: number
  public totalAmount!: number
  public itemCount!: number
  public user!: string
  public mode!: string
  public refNo!: string
}
export class supplierQuotationItems {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public prodCode!: string
  public prodName!: string
  public uom!: string
  public unitRate!: number
  public discRate!: number
  public vatRate!: number
  public netRate!: number
  public quantity!: number
  public amount!: number
  public remarks!: string
  public user!: string
  public mode!: string
  public refNo!: string
}


export class supplierInvoice {
  public company!: string
  public location!: string
  public user!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: string
  public supplier!: string
  public currency!: string
  public applyVAT!: number
  public vATMonth!: number
  public vATYear!: number
  public supplierAmt!: number
  public invoiceAmt!: number
  public vATAmt!: number
  public gRNAmt!: number
  public payableAmt!: number
  public paidAmt!: number
  public balAmt!: number
  public tranStatus!: string
  public remarks!: string
  public refNo!: string
  public mode!: string
}

export class supInvoiceDet {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public slNo!: number
  public grnNo!: string
  public grnDate!: Date
  public currency!: string
  public exchRate!: number
  public grnAmt!: number
  public vatAmt!: number
  public amount!: number
  public refNo!: string
  public mode!: string
  public user!: string
}

export class grn {
  public company!: string
  public location!: string
  public langID!: number
  public refNo!: string
  public tranNo!: string
  public tranDate!: string
  public pONo!: string
  public supplier!: string
  public suppCode!:string
  public currency!: string
  public exchRate!: number
  public isVatable!: boolean
  public delNoteNo!: string
  public suppInvNo!: string
  public proformaInvNo!: string
  public itemCategory!: string
  public tranStatus!: string
  public remarks!: string
  public mode!: string
  public user!: string
}

export class grnDetails {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public poNo!: string
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
  public warehouse!: string
  public unitWeight!: number
  public lotNo!: number
  public serialNo!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class PurchaseOrder {
  public company!: string
  public location!: string
  public langCode!: number
  public tranNo!: string
  public isQtnBased!: boolean
  public quotationNo!: string
  public tranType!: string
  public tranCategory!: string
  public supplier!: string
  public tranDate!: string
  public currency!: string
  public exchRate!: number
  public isVatable!: boolean
  public suppRefNo!: string
  public tranStatus!: string
  public notes!: string
  public authorizedBy!: string
  public authorizedOn!: Date
  public user!: string
  public refNo!: string
  public mode!: string
}

export class PurchaseOrderDetails {
  public company!: string
  public location!: string
  public langCode!: number
  public tranNo!: string
  public slNo!: number
  public prodCode!: string
  public prodName!: string
  public uom!: string
  public unitRate!: number
  public discPer!: number
  public vATRate!: number
  public netRate!: number
  public quantity!: number
  public rowValue!: number
  public receivedQty!: number
  public user!: string
  public refNo!: string
  public mode!: string
}

export class paymentHdr {
  public company!: string
  public location!: string
  public langID!: number
  public payNo!: string
  public payDate!: Date
  public supplier!: string
  public suppType!: string
  public currency!: string
  public payMode!: string
  public banker!: string
  public accNumber!: string
  public chequeNo!: string
  public chequeDate!: Date
  public chequeStatus!: string
  public tranAmount!: number
  public allocatedAmt!: number
  public tranStatus!: string
  public remarks!: string
}

export class paymentDetails {
  public company!: string
  public location!: string
  public langID!: number
  public payNo!: string
  public slNo!: number
  public refDocNo!: string
  public refDocDate!: Date
  public payDueDate!: Date
  public currID!: string
  public exchRate!: number
  public docAmt!: number
  public balAmt!: number
  public payAmt!: number
  public remarks!: string
}

export class specicificCharges {
  public company!: string
  public location!: string
  public langID!: number
  public tranType!: string
  public tranNo!: string
  public gRNSlNo!: number
  public slNo!: number
  public prodCode!: string
  public supplier!: string
  public currency!: string
  public exchRate!: number
  public chargeItem!: string
  public unitRate!: number
  public vATRate!: number
  public netRate!: number
  public quantity!: number
  public rowAmount!: number
  public remarks!: string
}

export class itemCharges {
  public company!: string
  public location!: string
  public langID!: number
  public tranType!: string
  public tranNo!: string
  public gRNSlNo!: number
  public slNo!: number
  public prodCode!: string
  public supplier!: string
  public currency!: string
  public exchRate!: number
  public chargeItem!: string
  public unitRate!: number
  public vatRate!: number
  public netRate!: number
  public quantity!: number
  public rowAmount!: number
  public remarks!: string
  public applyVat!: boolean
  public refNo!:string
  public mode!:string
  public user!:string;
}

export class commonCharges {
  public company!: string
  public location!: string
  public langID!: number
  public tranType!: string
  public tranNo!: string
  public slNo!: number
  public supplier!: string
  public currency!: string
  public exchRate!: number
  public chargeItem!: string
  public unitRate!: number
  public vATRate!: number
  public netRate!: number
  public quantity!: number
  public rowAmount!: number
  public remarks!: string

  public vatRate!: string
  public refNo!: string
  public mode!: string
  public user!: string
}

export class OpeningBalancesClass {
  mode!: string;
  company!: string;
  location!: string;
  langID!: number;
  tranNo!: string;
  tranDate!: Date;
  balType!: string;
  notes!: string;
  user!: string;
  refNo!: string;

}
export class OpeningBalDetailCls{
  mode!: string;
  company!: string;
  location!: string;
  langId!: number;
  tranNo!: string;
  slNo!: number;
  partyType!: string;
  partyName!: string;
  currency!: string;
  balAmount!: number;
  user!: string;
  refNo!: string
  party!:string

}
