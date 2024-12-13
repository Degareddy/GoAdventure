
export interface Item {
  itemCode: string;
  itemName: string;
}

export interface getTransationsPayload {
  company: string;
  Location: string;
  LangId: number;
  TranNo: string;
  User: string;
  RefNo: string;
}

export interface updateInvHeader {
  deliveryNo: string;
  //  company: string
  //  location: string
  //  mode:string
  //  langID: number
  //  refNo: string
  //  user: string
  //  tranNo: string
  //  revisionNo: number
  //  tranDate: Date
  //  validDays: number
  //  customer: string
  //  currency: string
  //  exchRate: number
  //  payTerm: string
  //  salesExec: string
  //  custRef: string
  //  tranStatus: string
  //  applyVAT: boolean
  //  remarks: string
  scrId: string;
  mode: string;
  company: string;
  location: string;
  langID: string;
  invType: string;
  tranNo: string;
  tranDate: string;
  saleNo: string;
  customer: string;
  payTerm: string;
  currency: string;
  exchRate: number;
  salesRep: string;
  lpoNo: string;
  delMethod: string;
  truckNo: string;
  transporter: string;
  driverName: string;
  driverID: string;
  applyVAT: boolean;
  issueStock: boolean;
  remarks: string;
  billTo: string;
  shipTo: string;
}
