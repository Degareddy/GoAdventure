import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MasterItems, MasterParams } from '../Masters/Modules/masters.module';
import { Observable } from 'rxjs';
import { DelFileInfo } from '../Masters/master.class';
import { getResponse, SaveApiResponse } from '../general/Interface/admin/admin';
import { loginResponse } from '../layouts/login-component/login-component.component';
import { FileDataResponse } from '../Masters/file-upload/file.interface';

@Injectable({
  providedIn: 'root'
})
export class MastersService {

  constructor(private http: HttpClient) { }

  getModesList(masParams: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetTranMode/', masParams)
  }
  //Master Services
  getMasterTypesList(masParams: MasterParams): Observable<string[]> {
    return this.http.post<string[]>(environment.Url + 'MasterItems/GetMasterTypesList/', masParams)
  }
  GetMyCashTransfers(masParams: any): Observable<string[]> {
    return this.http.post<string[]>(environment.Url + 'MasterItems/GetMasterTypesList/', masParams)
  }

  getSpecificMasterItems(masParams: any): Observable<string[]> {
    return this.http.post<string[]>(environment.Url + 'MasterItems/GetMasterItemsList/', masParams)
  }

  
  getSpecificMasterItemDetails(masParams: MasterParams): Observable<string[]> {
    return this.http.post<string[]>(environment.Url + 'MasterItems/GetMasterItemsDetails/', masParams)
  }

  updateMasterItemDetails(mastItem: MasterItems): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/UpdateMasterItemsDetails/', mastItem)
  }

  getLoggerInfo(masParams: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'admin/GetLoggerInformation/', masParams)
  }

  getsideMenu(masParams: MasterParams): Observable<string[]> {
    return this.http.post<string[]>(environment.Url + 'admin/GetUserMenu/', masParams)
  }
  login(masParams: MasterParams): Observable<loginResponse> {
    return this.http.post<loginResponse>(environment.Url + 'admin/Login/', masParams)

  }
  getCountryDetails(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetCountryDetails', body);
  }
  GetMasterItemsList(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetMasterItemsList/', body);
  }
  getCountriesList(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetMasterItemsList/', body);
  }

  GetAuthorizedTransactionsList(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetAuthorizedTransactions/', body);
  }

  GetCascadingMasterItemsList(body: any): Observable<getResponse> {
    return this.http.post<getResponse>(environment.Url + 'MasterItems/GetCascadingMasterItemsList/', body)
  }

  GetProjectsSearchResults(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetProjectsSearchList/', body)
  }

  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  uploadFile(fileInfo: FormData): Observable<any> {
    return this.http.post(environment.Url + 'files/UploadFile', fileInfo, {
      reportProgress: true,
      observe: 'events',
      responseType: 'json',
    });
  }

  deleteFile(fileInfo: DelFileInfo): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'files/DeleteFile', fileInfo);
  }

  GetFilesList(body: any): Observable<FileDataResponse> {
    return this.http.post<FileDataResponse>(environment.Url + 'files/GetFilesList', body)
  }
  RegenToken(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'MasterItems/RegenToken', body)
  }

  downloadFile(filename: string): Observable<Blob> {
    return this.http.get<Blob>(environment.Url + 'files/DownloadFile/' + filename, { responseType: 'blob' as 'json' });
  }

  previewFile(filename: string): Observable<Blob> {
    return this.http.get(environment.Url + 'files/DownloadFile/' + filename, { responseType: 'blob' });
  }

  previewAndDownloadFile(filename: string): void {
    this.previewFile(filename).subscribe(blob => {
      const blobUrl = URL.createObjectURL(blob);
      if (filename.toLowerCase().endsWith('.pdf')) {
        const iframe = document.createElement('iframe');
        iframe.src = blobUrl;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        document.body.appendChild(iframe);
      } else if (filename.toLowerCase().match(/\.(jpeg|jpg|png|gif)$/)) {
        const img = document.createElement('img');
        img.src = blobUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        document.body.appendChild(img);
      }
    });
  }

  GetTranSearchList(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'MasterItems/GetTranSearchList/', body)
  }

  GetRctPmtTranSearchList(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'sales/GetReceiptPaymentsDetails/', body)
  }

  UpdateMyCashTransfers(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'sales/UpdateMyCashTransfers/', body)
  }

  getImageUrl(filePath: string, fileName: string): string {
    // Construct the full URL for the image dynamically
    return `${environment.Url}${filePath.replace(/\\/g, '/')}${fileName}`;
  }

  ResetPassword(body: any): Observable<any> {
    return this.http.post<any>(environment.Url + 'MasterItems/ResetPassword/', body)
  }
}
