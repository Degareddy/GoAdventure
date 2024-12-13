import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
interface SMSResponse {
  'response-code': number;
  'response-description': string;
  mobile: number;
  messageid: number;
  networkid: string;
}

interface SMSRequestBody {
  apikey: string;
  partnerID: string;
  message: string;
  shortcode: string;
  mobile: string;
}
@Injectable({
  providedIn: 'root'
})
export class SmsService {
  // private apiUrl = 'https://sms.textsms.co.ke/api/services/sendsms/';
  constructor(private http: HttpClient) { }

  sendSMS(API_KEY: string,PARTNER_ID: string,SHORTCODE: string,message: string, mobile: string,url:string): Observable<SMSResponse[]> {
    // console.log(url);
    const body: SMSRequestBody = {
      apikey: API_KEY,
      partnerID: PARTNER_ID,
      message: message,
      shortcode: SHORTCODE,
      mobile: mobile
    };
    return this.http.post<SMSResponse[]>(url, body);
  }
  sendBulkSMS(body: any,url:string): Observable<any> {
    return this.http.post(url, body);
  }
  getMessagingContacts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetMessagingContacts', body);
  }
  getMessageCredentials(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMessageCredentials', body);
  }
  SendSingleSMS(body:any):Observable<any>{
    return this.http.post(environment.Url + 'MasterItems/SendSingleSMS', body);
  }
  SendBulkSMS(body:any):Observable<any>{
    return this.http.post(environment.Url + 'bulksms/SendBulkSms', body);
  }
}
