import { CompanyClass } from "src/app/admin/admin.class";

export interface CompanyResponse {
  status: string;
  message: string;
  retVal: number;
  data: CompanyClass;
}

export interface getResponse {
  status: string;
  message: string;
  retVal: number;
  data: { itemCode: string, itemName: string }[];
}
export interface SaveApiResponse {
  status: string;
  tranNoNew: string;
  message: string;
  retVal: number;
}
export interface CompanyLocation {
  company: string;
  location: string;
  slNo: number;
  branchLocn: string;
  locnName: string;
  address1: string;
  address2: string;
  address3: string;
  pO_PIN_ZIP: string;
  city: string;
  province: string;
  country: string;
  phone1: string;
  phone2: string;
  phone3: string;
  fax: string;
  eMail: string;
  currStatus: string;
  notes: string;
  pinNo: string;
  webSite: string;
  mode: any;
  user: any;
  refNo: any;
}
export interface BranchLocationsResponse {
  status: string;
  message: string;
  retVal: number;
  data: CompanyLocation[];
}

export interface getPayload {
  company: string;
  location: string;
  user: string;
  refNo: string;
  item: string;

}

export interface transactionsPayload {
  company: string;
  location: string;
  user: string;
  refNo: string;
  langId: string;
  tranNo:string
}


export interface userResponse {
  status: string;
  message: string;
  retVal: number;
  data: UserData;
}

export interface UserData {
  loggedInUserID: string;
  company: string;
  location: string;
  userName: string;
  userID: string;
  userPassword: string;
  userProfile: string;
  userCompany: string;
  defaultCompany: string;
  defaultLocn: string;
  joinDate: string; // Date as ISO string
  expiresOn: string; // Date as ISO string
  userStatus: string;
  lastLoginOn: string; // Date as ISO string
  lastLoginFailOn: string; // Date as ISO string
  failAttempts: number;
  maxAllowedFailAttempts: number;
  remarks: string;
  mobile: string;
  email: string;
  reAssign: boolean;
  mode: string;
  user: any;
  refNo: any;
}

export interface ResponseData {
  nameCount: number;
  selName: string;
  selCode: string;
}

// Interface to represent the entire JSON response
export interface nameCountResponse {
  status: string;
  message: string;
  retVal: number;
  data: ResponseData;
}

export interface tranCountResponse {
  status: string;
  message: string;
  tranCount: number;
  data: ResponseData;
}

interface Party {
  company: string;
  location: string;
  code: string;
  partyType: string;
  partyName: string;
  property: string;
  fullAddress: string;
  city: string;
  partyStatus: string;
  phones: string;
  email: string;
  execDate: string;
  mode: string;
  user: any; // Depending on the actual type
  refNo: any; // Depending on the actual type
}

export interface PartyResponse {
  status: string;
  message: string;
  retVal: number;
  data: Party[];
}


interface BranchMapping {
  company: string;
  location: any; // Depending on the actual type
  branch: string;
  userId: any; // Depending on the actual type
  branchName: string;
  mapStatus: any; // Depending on the actual type
  dateMapped: string;
  remarks: string;
  mode: any; // Depending on the actual type
  user: any; // Depending on the actual type
  refNo: any; // Depending on the actual type
}

export interface BranchMappingResponse {
  status: string;
  message: string;
  retVal: number;
  data: BranchMapping[];
}

export interface HelpTextData {
  page: string;
  scrId: string;
  slNo: number;
  helpText: string;
  preNo: number;
  nextNo: number;
  user: any;
  refNo: any;
}

export interface helpApiResponse {
  status: string;
  message: string;
  retVal: number;
  data: HelpTextData;
}

export interface notesdetails{

  company: string;
  location: string;
  langId:string;
  tranType:string;
  tranNo:string;
  user:string;
}
