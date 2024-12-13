export class CompanyClass {

  public company!: string
  public location!: string

  public ID!: string
  public name!: string
  public cmpDate!: string
  public address1!: string
  public address2!: string
  public address3!: string
  public pO_PIN_ZIP!: string
  public city!: string
  public state!: string
  public country!: string
  public phone1!: string
  public phone2!: string
  public phone3!: string
  public fax!: string
  public email!: string
  public url!: string
  public vatNo!: string
  public pinNo!: string
  public logoLocn!: string
  public notes!: string
  public status!: string
  public mode!: string
  public user!: string
  public refNo!: string
  public item!: string

  public facebook!: string
  public twitter!: string
  public instagram!: string
  public youtube!: string
  public pinterest!: string
}


export class UserDetails {
  public company!: string
  public location!: string
  public userID!: string
  public iPNo!: string
  public remarks!: string
  public refNo!: string
}
export class BranchClass {
  company!: string;
  location!: string;
  slNo!: number;
  branchLocn!: string;
  address1!: string;
  address2!: string;
  address3!: string;
  pO_PIN_ZIP!: string;
  city!: string;
  province!: string;
  country!: string;
  phone1!: string;
  phone2!: string;
  phone3!: string;
  fax!: string;
  eMail!: string;
  currStatus!: string;
  notes!: string;
  pinNo!: string;
  webSite!: string;
  mode!: string;
  user!: string;
  refNo!: string;

}

export class userBranchClass {
  public mode!: string;
  public company!: string;
  public location !: string;
  public userId !: string;
  public branch !: string;
  public mapStatus!: string;
  public remarks!: string;
  public user !: string;
  public refNo!: string;
}

export class userCompanyClass {
  public mode!: string;
  public company!: string;
  public location !: string;
  public userId !: string;
  public CompanyId !: string;
  public mapStatus!: string;
  public IsDefault!:boolean;
  public remarks!: string;
  public user !: string;
  public refNo!: string;
}

export class notesDetailscls{
  public mode!: string;
  public company!: string;
  public location !: string;
  public userId!: string;
  public notes!: string;
  public user!: string;
  public notesDate!: string;
  public refNo!: string;
 public  langId!:number;
 public tranType!:string;
 public slNo!:number;
 public tranNo!:string;
}

