export class venturnClass {
  public company!: string
  public location!: string
  public langId!: number
  public code!: string
  public ventureName!: string
  public projLocation!: string
  public latitude!: number
  public longitude!: number
  public altitude_M!: number
  public acquiredOn!: string | null
  public extent_M2!: number
  public vendor!: string
  public venStatus!: string
  public remarks!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class plotClass {
  public company!: string
  public location!: string
  public langId!: number
  public ventureCode!: string
  public venture!: string
  public plotNo!: string
  public plotName!: string
  public latitude!: number
  public longitude!: number
  public extent_M2!: number
  public client!: string
  public availableFrom!: string | null
  public saleDate!: Date
  public regnDate!: Date
  public plotStatus!: string
  public remarks!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class plotSaleClass {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public ventureCode!: string
  public plotNo!: string
  public plotName!: string
  public customer!: string
  public customerCode!: string
  public tranDate!: Date
  public dealDate!: Date
  public dealValue!: number
  public tokenAmount!: number
  public saleDate!: Date
  public regnDate!: Date
  public tranStatus!: string
  public remarks!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class ProjectCostsClass {
  public company!: string
  public locnId!: string
  public langID!: number
  public tranNo!: string
  public venture!: string
  public vendor!: string
  public tranDate!: Date
  public startDate!: Date
  public endDate!: Date
  public workType!: string
  public workStatus!: string
  public tranStatus!: string
  public notes!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class BlockClass {
  public company!: string
  public location!: string
  public property!: string

  public blockID!: string
  public blockName!: string
  public blockType!: string
  public blockDate!: Date
  public yearBuilt!: number
  public floorCount!: number
  public unitCount!: number
  public latitude!: number
  public longitude!: number
  public blockStatus!: string
  public notes!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class FlatClass {
  public company!: string
  public location!: string
  public unitID!: string
  public unitName!: string
  public unitDate!: Date
  public propCode!: string
  public blockCode!: string
  public floorNo!: number

  public updateAll: boolean = false
  public fromFloorNo: number = 0
  public toFloorNo: number = 0
  public firstPart!: string
  public secondPart!: string
  public pattern!:string

  public totalRooms!: number
  public floorType!: string
  public usageType!: string
  public size!: number
  public flinthArea!: number
  public carpetArea!: number
  public flatType!: string
  public plexType!: string
  public landLord!: string
  public landLordName!: string
  public employee!: string
  public empName!: string
  public currentTenant!: string
  public tenantJoinDate!: Date
  public tenantName!: string
  public petsAllowed!: boolean
  public smokingAllowed!: boolean
  public percentage!: number
  public deposit!: number
  public bedRooms!: number
  public bathRooms!: number
  public unitStatus!: string
  public planImg!: string
  public rentType!: string
  public latitude!: number
  public longitude!: number
  public landlordPayDay!: number
  public tenantPayDay!: number
  public invDay!: number
  public vat!: string
  public notes!: string
  public payWhenVacant!: boolean
  public mode!: string
  public user!: string
  public refNo!: string
  public bolconyCount!: string
  public luxuryType!: string
  public hasExtraStudyroom!: boolean
  public hasServantRoom!: boolean
  public hasServantToilet!: boolean
  public hasUtility!: boolean
  public hasStore!: boolean
  public hasExtraHall!: boolean
  public waterDiscount!: boolean
  public discType!: boolean
  public discRate!: boolean
  public noRent!: boolean
  public currency!:string;
  public unitCost!:string;
}

export class ProjectClass {
  public company!: string
  public location!: string
  public locnId!: string
  public langID!: number
  public tranNo!: string
  public venture!: string
  public vendor!: string
  public tranDate!: Date
  public startDate!: Date
  public endDate!: Date
  public amount!: number
  public workType!: string
  public workStatus!: string
  public tranStatus!: string
  public notes!: string
  public mode!: string
  public user!: string
  public refNo!: string
}

export class directionsClass {
  public Mode!: string
  public Company!: string
  public Location!: string
  public LangId!: number
  public RefType!: string
  public ReferenceNo!: string
  public SlNo!: number
  public Latitude!: number
  public Longitude!: number
  public Direction!: string
  public BoundaryDesc!: string
  public Remarks!: string
  public User!: string
  public RefNo!: string
}

export class PropertyCls {
  public company!: string
  public location!: string
  public langId!: number
  public propertyID!: string
  public propertyName!: string
  public venture!: string
  public ventureName!: string
  public acquiredDate!: string
  public blockCount!: number
  public propAddress1!: string
  public propAddress2!: string
  public propAddress3!: string
  public city!: string
  public province!: string
  public propStatus!: string
  public latitude!: number
  public longitude!: number
  public altitude!: number

  public yearBuilt!: number
  public landlord!: string
  public landlordName!: string
  public employee!: string
  public employeeName!: string
  public landlordPercentage!: number
  public lrNo!: string
  public notes!: string
  public user!: string
  public refNo!: string
  public mode!: string
}

export class BudgetCls {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public projectType!: string
  public code!: string
  public projectName!: string
  public currency!: string
  public tranDate!: string
  public tranStatus!: string
  public remarks!: string

  public bugetAmt!: number
  public actualAmt!: number
  public diffAmt!: number
  public scheduledDate!: Date
  public actualDate!: Date
  public diffDays!: number

  public mode!: string
  public user!: string
  public refNo!: string

}

export class BudgetDetailsCls {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public slNo!: number
  public workTypeCode!: string
  public workTypeName!: string
  public budgetAmt!: number
  public actualAmt!: number
  public diffAmt!: number
  public SchStartDate!: string
  public SchEndDate!: string
  public actCmplDate!: Date
  public diffDays!: number
  public notes!: string

  public mode!: string
  public user!: string
  public refNo!: string
}

export class finacialsClass {
  public company!: string
  public location!: string
  public user!: string
  public mode!: string
  public propCode!: string
  public blockCode!: string
  public unitCode!: string
  public slNo!: number
  public charge!: string
  public reviewedOn!: Date
  public nextReviewOn!: Date
  public tranStatus!: string
  public amount!: number
  public discType!: string
  public discRate!: number
  public discAmount!: number
  public vatRate!: number
  public vatAmount!: number
  public netAmount!: number
  public revenueTo!: string
  public notes!: string
  public isRecurring!: boolean
  public isRefundable!: boolean
  public refNo !: string;
}

export class serviceClass {
  public company!: string
  public location!: string
  public propCode!: string
  public blockCode!: string
  public unitCode!: string
  public slNo!: number
  public serviceType!: string
  public serviceNo!: string
  public deviceNo!: string
  public notes!: string
  public user!: string
  public mode!: string
  public refNo !: string;
}

export class equipmentClass {
  public company!: string
  public location!: string
  public propCode!: string
  public blockCode!: string
  public unitCode!: string
  public slNo!: number
  public code!: string
  public assetSlNo!: string
  public asset!: string
  public item!: string
  public rate!: number
  public quantity!: number
  public amount!: number
  public fixedOn!: string
  public removedOn!: string
  public expiresOn!: string
  public condition!: string
  public notes!: string
  public mode!: string
  public user!: string
  public refNo!: string
}

export class unitLandLordClass {
  public Mode!: string
  public Company!: string
  public Location !: string
  public PropCode!: string
  public BlockCode!: string
  public UnitCode!: string
  public RentPayBy !: string
  public Rate!: string
  public DepositWithLandlord!: string
  public LastReviewedOn!: Date
  public User!: string
  public RefNo!: string
}

export class invoiceClass {
  public company!: string
  public location!: string
  public tranNo!: string
  public tranDate!: Date
  public tenant!: string
  public tenantName!: string
  public currency!: string
  public exchRate!: number
  public invPeriodicity!: string
  public invFromDate!: Date
  public invToDate!: Date
  public rentMonth!: number
  public rentYear!: number
  public invDay!: number
  public isRentInvoice!: boolean
  public applyVAT!: boolean
  public includeExpenses!: boolean
  public IsMiscInvoice!:boolean;
  public AllUnits!: boolean
  public dueDate!: Date
  public penaltyPerDay!: number
  public unitCount!: number
  public lPONo!: string
  public executive!: string
  public exeName!: string
  public tranStatus!: string
  public remarks!: string
  public rentalCharges!: number
  public othrCharges!: number
  public vatAmount!: number
  public totalCharges!: number
  public mode!: string
  public user!: string
  public refNo!: string

  public property!: string
  public block!: string
  public unit!: string

  public isFull!: boolean
  public transferAmount!: number
  public transferTo!: string
}
export class invoiceDetailClass {
  public company!: string
  public location!: string
  public tranNo!: string
  public slNo!: number
  public ChargeItem!: string
  public prodName!: string
  public itemRate!: number
  public vatRate!: number
  public vatAmount!: number
  public amount!: number
  public NetAmount!: number
  public mode!: string
  public user!: string
  public refNo!: string
  public discType!: string
  public discRate!: number
  public discAmount!: number

}

export class ReportTenantInvoice {
  public company!: string
  public companyName!: string
  public location!: string
  public locationName!: string
  public compAddresses!: string
  public compContacts!: string
  public emailInfo!: string
  public vATPin!: string
  public clientAddresses!: string
  public clientContacts!: string
  public clientOtherInfo!: string
  public invoiceNo!: string
  public tranYear!: number
  public tranMonth!: number
  public tranMonthName!: string
  public tranDate!: Date
  public dueDate!: Date
  public tenant!: string
  public tenantName!: string
  public emailId!: string
  public rentCharge!: number
  public otherCharge!: number
  public vatCharge!: number
  public totalCharge!: number
  public slNo!: number
  public costItem!: string
  public costItemDesc!: string
  public itemAmount!: number
  public vatAmount!: number
  public netAmount!: number
  public propID!: string
  public property!: string
  public blockID!: string
  public block!: string
  public unitID!: string
  public unit!: string
  public refNo!: string
}

export class unitCharges {
  company!: string;
  location!: string;
  langId: number = 1;
  chargeType!: string;
  bedroomCount: number = 0;
  amount: number = 0;
  // slNo:number=0;
  vatRate!: string;
  revenueTo!: string;
  isRecurring: boolean = false;
  isRefundable: boolean = false;
  user!: string;
  refNo!: string;
  applyForAll: boolean = false
  nextReviewOn!: Date;
  reviewedOn!: Date;
  block!: string;
  property!: string;
  notes!: string;
  mode: string = "";
  plexType:string="";
}


export class propertyReportData {
  public Company!: string;
  public Location!: string;
  public PropCode!: string;
  public BlockCode!: string;
  public UnitID!: string;
  public UnitStatus!: string;
  public FromDate!: Date;
  public ToDate!: Date;
  public Report!: string;
  public User!: string;
  public RefNo!: string;
}

export class waterReading {
  public company!: string
  public location!: string
  public langID!: number
  public tranNo!: string
  public property!: string
  public block!: string
  public unit!: string
  public tranDate!: string
  public tenant!: string
  public reading!: number
  public unitCount!: number
  public rate!: number
  public amount!: number
  public notes!: string
  public tranStatus!: string
  public mode!: string
  public user!: string
  public refNo!: string
}
export class TransactionDetails {
  public mode!: string
  public company!: string
  public location!: string
  public tranNo!: string
  public slNo!: number
  public serviceType!: string
  public reading!: number
  public unitCount!: number
  public rate!: number
  public amount!: number
  public user!: string
  public refNo!: string
  public expenseType!: string

}

export class RepGrievanceCls {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public raisedDate!: Date
  public allocatedDate!: Date
  public allocatedTime!: string
  public closedDate!: Date
  public closedTime!: string
  public tenant!: string
  public tenantName!: string
  public property!: string
  public propertyName!: string
  public block!: string
  public blockName!: string
  public unit!: string
  public unitName!: string
  public complaintType!: string
  public complaint!: string
  public priority!: string
  public tTDays!: number
  public tTHours!: number
  public tTMins!: number
  public costToMgmt!: number
  public costToLandlord!: number
  public costToTenant!: number
}

export class RepTechParams {
  public company!: string
  public location!: string
  public technician!: string
  public fromDate!: Date
  public toDate!: Date
  public user!: string
  public refNo!: string
}

export class RepTechnicianHistory {
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string
  public tenant!: string
  public tenantName!: string
  public property!: string
  public propertyName!: string
  public block!: string
  public blockName!: string
  public unit!: string
  public unitName!: string
  public techCode!: string
  public techName!: string
  public startDate!: Date
  public startTime!: string
  public givenDate!: Date
  public givenTime!: string
  public endDate!: Date
  public endTime!: string
  public extraDays!: number
  public extraHours!: number
  public extraMins!: number
}


export class unitSalesClass {
  Mode: string = "";
  Company: string = "";
  LangId: number = 1;
  Location: string = "";
  TranNo: string = "";
  TranDate: string = "";
  CustRefNo: string = "";
  Customer: string = "";
  PayTerm: string = "";
  Currency: string = "";
  ExchRate: number = 0;
  SalesRep: string = "";
  LPONo: string = "";
  ApplyVat: boolean = false;
  Remarks: string = "";
  User: string = "";
  RefNo: string = "";
  itemType: string = "";
}

export class unitSalesDetailsClass {
  Mode: string = "";
  Company: string = "";
  LangId: number = 1;
  Location: string = "";
  User: string = "";
  RefNo: string = "";
  SlNo: number = 0;
  Prop_Vent: string = "";
  BlockId: string = "";
  Flat_Plot: string = "";
  UnitRate: number = 0;
  DiscRate: number = 0;
  VatRate: number = 0;
  NetAmount: number = 0;
  TranNo: string = "";
}


export class workdetails {
  public Mode: string = "";
  public Company: string = "";
  public Location: string = "";
  public LangId: number = 1;
  public TranNo: string = "";
  public SlNo: number = 0;
  public WorkType: string = "";
  public SubWorkType: string = "";
  public BudgetAmt: number = 0;
  public User: string = "";
  public RefNo: string = ""
}

export class TransferDetails {
  mode!: string;
  company!: string;
  location!: string;
  propCode!: string;
  blockCode!: string;
  transferTo!: string;
  tranDate!: Date;
  notes!: string;
  user!: string;
  refNo!: string;
}


export class multiClients{
  mode!: string;
  company!: string;
  location!: string;
  user!: string;
  refNo!: string;
  property!:string;
  block!:string;
  unitId!:string;
  landlord!:string;
  llStatus!:string;
  share!:number;
  dateJoined!:Date;
  dateLeft!:Date;
}
