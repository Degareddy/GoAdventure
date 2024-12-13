export class SupplierDetails {
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

export class SupplierQuotation {
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
  public billTo!: number
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
  public tranDate!: Date
  public currency!: string
  public exchRate!: number
  public isVatable!: boolean
  public suppRefNo!: string
  public tranStatus!: string
  public notes!: string
  public authorizedBy!: string
  public authorizedOn!: Date
}

export class GoodsReceiptNote {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: Date
  public pONo!: string
  public supplier!: string
  public currency!: string
  public exchRate!: number
  public isVatable!: boolean
  public delNoteNo!: string
  public suppInvNo!: string
  public proformaInvNo!: string
  public itemCategory!: string
  public tranStatus!: string
  public remarks!: string
}

export class SupplierInvoice {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: Date
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

}
