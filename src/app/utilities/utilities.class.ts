export class GreivanceClass {
  public mode!: string
  public company!: string
  public location!: string
  public langId!: number
  public tranNo!: string

  public raisedDate!: Date
  public allocatedDate!: string
  public closedDate!: string
  public allocatedTime!: string
  public closedTime!: string
  public tenant!: string
  public property!: string
  public propertyName!: string
  public block!: string
  public blockName!: string
  public unit!: string
  public unitName!: string
  public complaintType!: string
  public complaintTypeName!: string
  public complaint!: string
  public priority!: string

  // public resolvedOn!: Date
  public tTDays!: number
  public tTHours!: number
  public tTMins!: number
  public issueStatus!: string
  // public resolvedBy!: string
  public remarks!: string

  public costToMgmt!: number
  public costToLandlord!: number
  public costToTenant!: number

  public user!: string
  public refNo!: string
}

export class GrievanceParams {
  public company!: string
  public location!: string
  public langId !: number
  public tranType!: string
  public tranNo!: string
  public issueStatus!: string
  public fromDate!: string
  public toDate!: string
  public all!: boolean;
  public user!: string
  public refNo!: string
}


export class GrievanceCostClass {
  public company!: string
  public location!: string
  public langId !: number

  public slNo!: number
  public prodCode!: string
  public uom!: string
  public unitRate!: number
  public quantity!: number
  public cost!: number
  public costTo!: string
  public notes!: string

  public tranNo!: string
  public mode!: string
  public user!: string
  public refNo!: string

}


export class technicianClass {
  public Mode!: string
  public Company!: string
  public Location!: string
  public LangId!: number
  public TranNo!: string
  public SlNo!: number
  public TechCode!: string
  public StartDate!: string
  public StartTime!: string
  public givenDate!: string
  public givenTime!: string
  public EndDate!: string
  public EndTime!: string
  public TaskStatus!: string
  public Notes!: string
  public User !: string
  public RefNo!: string

}
export class FormDataModel {
  mode!: string;
  company!: string;
  location!: string;
  user!: string;
  refNo!: string;
  itemType!: string;
  propCode!: string;
  blockCode!: string;
  unitCode!: string;
  show!: boolean;
}

export class ActivityDiary {
  company!: string;
  location!: string;
  empCode!: string;
  diaryDate!: string;
  slNo!: number;
  fromTime!: Date;
  toTime!: Date;
  activityDescription!: string;
  activityStatus!: string;
  selfRating!: number;
  evalRating!: number | null;
  remarks!: string | null;
  user!: string;
  refNo!: string;

  constructor(init?: Partial<ActivityDiary>) {
    Object.assign(this, init);
  }
}
