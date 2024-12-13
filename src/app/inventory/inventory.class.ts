export class materialRequestHdr {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public requestToLocn: string = ""
  public requestToLocnName: string = ""
  public tranDate: Date = new Date()
  public tranStatus: string = ""
  public purpose: string = ""
  public approvedBy: string = ""
  public approvedOn: Date = new Date()
  public issuedBy: string = ""
  public issuedOn: Date = new Date()
  public receivedBy: string = ""
  public receivedOn: Date = new Date()
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""

}

export class materialRequestDetails {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public slNo: number = 0
  public product: string = ""
  public productName: string = ""
  public uom: string = ""
  public quantity: number = 0
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""

}

// export class mrDet {
//   public company:string=""
//   public location:string=""
//   public langID:number=0
//   public tranNo:string=""
//   public slNo:number=0
//   public prodCode:string=""
//   public uOM:string=""
//   public quantity:number=0
//   public warehouse:string=""
//   public cOG:number=0
//   public lotNo:number=0
//   public exStock:number=0
//   public unitRate:number=0
//   public mode:string=""
//   public user:string=""
//   public refNo:string=""
// }

export class StockDetails {
  public company: string = ""
  public location: string = ""
  public langID: string = ""
  public tranNo: string = ""
  public slNo: number = 0
  public prodCode: string = ""
  public uOM: string = ""
  public quantity: number = 0
  public lotNo: number = 0
  public warehouse: string = ""
  public unitRate: number = 0
  public rowValue: number = 0
  public availableStock: number = 0
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
}

export class PhysicalDeails {
  public company: string = ""
  public user: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public refNo: number = 0
  public slNo: number = 0
  public item: string = ""
  public uOM: string = ""
  public wHCode: string = ""
  public quantity: number = 0
  public remarks: string = ""

}

export class stockAdjClass {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public slNo: number = 0
  public prodCode: string = ""
  public uOM: string = ""
  public unitRate: number = 0
  public quantity: number = 0
  public amount: number = 0
  public wHNo: string = ""
  public remarks: string = ""
  public cOG: number = 0
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
}

export class stocktransferDetailsclass {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public slNo: number = 0
  public product: string = ""
  public uom: string = ""
  public quantity: number = 0
  public warehouse: string = ""
  public unitRate: number = 0
  public remarks: string = ""
  public lotNo: number = 0
  public rowValue: number = 0
  public availableStock: string = ""
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
}

export class ProductGroup {
  public ProductGroups: string = ""
  public Mode: string = ""
  public Company: string = ""
  public Location: string = ""
  public GroupType: string = ""
  public GroupCode: string = ""
  public GroupName: string = ""
  public EffectiveDate: Date = new Date()
  public Notes: string = ""
  public User: string = ""
  public RefNo: string = ""
}



export class StockIssueDet {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public slNo: number = 0
  public issueFor: string = ""
  public property: string = ""
  public propertyName: string = ""
  public blockCode: string = ""
  public blockName: string = ""
  public unitCode: string = ""
  public unitName: string = ""
  public accountOf: string = ""
  public prodCode: string = ""
  public prodName: string = ""
  public uom: string = ""
  public quantity: number = 0
  public rowWeight: number = 0
  public whNo: string = ""
  public cogs: number = 0
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
}

export class StockTransfer {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public fromLocn: string = ""
  public ToLocnName: string = ""
  public ToLocn: string = ""
  public fromWarehouse: string = ""
  public toWarehouse: number = 0
  public tranDate: string = ""
  public remarks: string = ""
  public matReqNo: string = ""
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
  public tranStatus: string = ""
}

export class productAliasNameDetails {
  public company: string = ""
  public location: string = ""
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
  public slNo: number = 0
  public aliasname: string = ""
  public remarks: string = ""
  public code: string = ""

}

export class physicalStockDetailsClass {
  company: string = "";
  location: string = "";
  langID: number = 1;
  tranNo: string = "";
  slNo: number = 0;
  prodCode: string = "";
  product: string = "";
  uom: string = "";
  warehouse: string = "";
  quantity: number = 1;
  remarks: string = "";
  mode: string = "";
  user: string = "";
  refNo: string = "";

}

export class WarehouseSearchClass {
  public company: string = ""
  public location: string = ""
  public langID: string = ""
  public user: string = ""
  public refNo: string = ""
  public slNo: number = 0
  public whNo: string = ""
  public whName: string = ""
  public quantity: number = 0
  public unitRate: number = 0
  public lotNo: number = 0

}

export class stockTransferReceiptHeader {
  public company: string = ""
  public mode: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public matReqNo: string = ""
  public transferNo: string = ""
  public tranDate: string = ""
  public tranStatus: string = ""
  public remarks: string = ""
  public user: string = ""
  public refNo: string = ""
  public ReqLocation: string = ""
}


export class StockIssueHdr {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public tranDate!: string
  public refTranNo!: string
  public tranStatus!: string
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
  public purpose!: string
  // public unit!:string
  public blockId!: string
  public blockName!: string
  public propertyName!: string
  public property!: string
  public itemCount!: string
}

export class stockConsumptionDetails {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public slNo: number = 0
  public productName: string = ""
  public product: string = ""
  public property: string = ""
  public blockId: string = ""
  public unitId: string = ""
  public uom: string = ""
  public quantity: number = 0
   public warehouse: string = ""
  public unitRate: number = 0
  //public remarks: string = ""
  public lotNo: number = 0
  public rowValue: number = 0
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
  public mainWorkType:string =""
  public subWorkType:string =""
}


export class stockAdjustmenthdrClass{
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
  public tranType: string = ""
  public adjType: string = ""
  public tranDate: string = ""
  public refTranNo: string = ""
  public Remarks: string = ""
}

export class stockAdjDetailsClass {
  public company: string = ""
  public location: string = ""
  public langID: number = 0
  public tranNo: string = ""
  public mode: string = ""
  public user: string = ""
  public refNo: string = ""
  
  public slNo: number = 0
  public product: string = ""
  //public productcode: string = ""
  public uom: string = ""
  public quantity: number = 0
   public warehouse: string = ""
  public unitRate: number = 0
  public notes: string = ""
  public amount: number = 0
 
}
