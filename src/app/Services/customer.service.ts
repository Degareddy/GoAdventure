import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Address, Contact, Customer, CustomerParam, CustomerParams, vendorProducts } from '../sales/sales.class';
import { Observable } from 'rxjs';
import { custApiResponse } from '../sales/customer/customer.component';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private http: HttpClient) { }
  getCustomerData(cust: Customer): Observable<custApiResponse> {
    return this.http.post<custApiResponse>(environment.Url + 'common/GetPartyData/', cust)
  }

  getCustomerDet(cust: Customer): Observable<any> {
    return this.http.post(environment.Url + 'common/GetPartyDetails/', cust)
  }

  updateCustomer(customer: Customer): Observable<any> {
    return this.http.post(environment.Url + 'common/UpdatePartyDetails/', customer)
  }

  UpdateSupplierProducts(prodclass: vendorProducts): Observable<any> {
    return this.http.post(environment.Url + 'property/UpdateSupplierProducts/', prodclass)
  }
  GetSupplierProducts(prodclass: any): Observable<any> {
    return this.http.post(environment.Url + 'property/GetSupplierProducts/', prodclass)
  }
  GetProductSuppliers(prodclass: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/GetProductSuppliers/', prodclass)
  }

  getCustomerAddressesData(custParas: CustomerParams): Observable<any> {
    return this.http.post(environment.Url + 'common/GetPartyAddresses/', custParas)
  }

  getCustomerAddressDetails(custParas: CustomerParams): Observable<any> {
    return this.http.post(environment.Url + 'common/GetPartyAddressDetails/', custParas)
  }

  updateCustomerAddress(address: Address): Observable<any> {
    return this.http.post(environment.Url + 'common/UpdateAddresses/', address)
  }

  getCustomerContactsData(custParas: CustomerParams): Observable<any> {
    return this.http.post(environment.Url + 'common/GetPartyContacts/', custParas)
  }

  getCustomerContactsDetails(custParas: CustomerParams): Observable<any> {
    return this.http.post(environment.Url + 'common/GetPartyContactsDetails/', custParas)
  }

  updateCustomerContact(contact: Contact): Observable<any> {
    return this.http.post(environment.Url + 'common/UpdatePartyContacts/', contact)
  }
  
}
