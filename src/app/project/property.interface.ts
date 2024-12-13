export interface PropertyDetailsResponse {
  status: string;
  retVal: number;
  data: propertyDetals;
  message: string
  // Depending on the actual type
}
interface propertyDetals {
  company: string;
  location: string;
  propertyID: string;
  propertyName: string;
  acquiredDate: string;
  venture: string;
  ventureName: string;
  blockCount: number;
  unitCount: number;
  propAddress1: string;
  propAddress2: string;
  propAddress3: string;
  city: string;
  province: string;
  propStatus: string;
  latitude: number;
  longitude: number;
  altitude: number;
  yearBuilt: number;
  employee: string;
  employeeName: string;
  lrNo: string;
  waterDiscount: boolean;
  discType: string;
  discRate: number;
  notes: string;
  mode: string; // Depending on the actual type
  user: string; // Depending on the actual type
  refNo: string;
}
