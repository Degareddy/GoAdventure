export class documnetNumberingClass {
  public Company!: string
  public Location!: string
  public TranType!: string
  public TranNo!: string
  public Party!: string
  public User!: string
  public RefNo!: string
}



export class documnetNumberSaveCalss {
  public company!: string
  public location!: string
  public langID!: number
  public selCompany!: string
  public selLocation!: string
  public scrID!: string
  public slNo!: number
  public prefix!: string
  public lastNo!: number
  public suffix!: string
  public startDate!: string | null
  public endDate!: string | null
  public lastTranDate!: string | null
  public currStatus!: string
  public remarks!: string
  public mode!: string
  public user!: string
  public refNo!: string
  startDateFormatted!: string | null
}
