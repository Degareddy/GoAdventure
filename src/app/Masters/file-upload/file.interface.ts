interface FileData {
  company: string;
  location: string;
  tranType: string;
  tranNo: string;
  uploadedDate: string;
  slNo: number;
  fileType: string;
  fileFullPath: string;
  fileName: string;
  fileSizeMb: number;
  unit: string;
  mode: string;
  user: any; // Depending on the actual type
  refNo: any; // Depending on the actual type
  getFileData(): Promise<ArrayBuffer>; // Method to get file data
}

export interface FileDataResponse {
  status: string;
  message: string;
  retVal: number;
  data: FileData[];
}
