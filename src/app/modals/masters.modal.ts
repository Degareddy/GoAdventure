export class MasterParams {
  public company!: string
  public location!: string
  public type!: string
  public tranType!: string
  public item!: string
  public user!: string | null
  public password!: string
  public refNo!: string
  public TranNo!: string
  public LangId!: string
  public Item!:string;
  public itemFirstLevel!:string;
  public tranNo!:string;
}

export class MasterList {
  public itemCode!: string
  public itemName!: string
}

export class MasterItems {
  public mode!: string
  public company!: string
  public location!: string
  public typeName!: string
  public itemCode!: string
  public itemName!: string
  public effectiveDate!: Date
  public itemStatus!: string
  public notes!: string
  public imgPath!: string
  public user!: string
  public refNo!: string
}

export class LoggerInfo {
  public company !: string
  public location !: string
  public userName !: string
  public userID !: string
  public userProfile !: string
  public userCompany !: string
  public userCompanyName !: string
  public defaultCompany !: string
  public defaultCompanyName !: string
  public defaultLocn !: string
  public defaultLocnName !: string
  public expiresOn !: Date
  public userStatus !: string
  public sessionID !: string
  public lastLoginOn !: Date
  public dbMessage !: string
}

export class sideMenu {
  // public company !: string
  // public location !: string
  public MenuId		!: number
  public MenuTitle!: string
  public SubId	!: number
  public SubText	!: string
  public SubUrl !: string
}
