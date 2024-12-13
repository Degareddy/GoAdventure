export class MasterParams {
  public company: string = '';
  public location: string = '';
  public selLocation: string = '';
  public type: string = '';
  public tranType: string = '';
  public item: string = '';
  public itemFirstLevel: string = '';
  public itemSecondLevel: string = '';
  public user: string | null = '';
  public password: string = '';
  public refNo: string = '';
  public langId: number = 0;
  public tranNo: string = '';
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

// export class ProjectClass {
//   public company!: string
//   public locnId!: string
//   public langID!: number
//   public tranNo!: string
//   public venture!: string
//   public vendor!: string
//   public tranDate!: Date
//   public startDate!: Date
//   public endDate!: Date
//   public amount!: number
//   public workType!: string
//   public workStatus!: string
//   public tranStatus!: string
//   public notes!: string
//   public mode!: string
//   public user!: string
//   public refNo!: string
// }

export class DashboardParams {
  public company!: string
  public location!: string
  public lnagId!: number
  public tranType!: string
  public reportType!: string
  public fromDate!: Date
  public toDate!: Date
  public party!: string
  public productGroup!: string
  public product!: string
  public user!: string
  public refNo!: string
}

export class DashboardData {
  public year!: number
  public month!: number
  public monthName!: string
  public amount!: number
}
