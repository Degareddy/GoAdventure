import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MasterParams } from '../Masters/Modules/masters.module';
import { PhysicalDeails, ProductGroup, StockIssueHdr, StockTransfer, materialRequestDetails, materialRequestHdr, stockAdjClass, stockAdjDetailsClass, stockAdjustmenthdrClass, stockConsumptionDetails, stockTransferReceiptHeader } from '../inventory/inventory.class';
import { Observable } from 'rxjs';
import { SaveApiResponse } from '../general/Interface/admin/admin';
import { getTransactionDetailsResp } from '../inventory/stock-transfer/stock-transfer.component';
@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(private http: HttpClient) { }
  getModesList(masParams: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranMode/', masParams)
  }
  GetMasterItemsList(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsList/', body)
  }
  GetProductDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/GetProductDetails?', body)
  }
  saveUpdateProducts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/UpdateProducts?', body)
  }
  GetWarehouseDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Warehouse/GetWarehouseDetails/', body)
  }
  saveWarehouse(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Warehouse/UpdateWarehouse/', body)
  }
  GetStockTransfer(body: any): Observable<getTransactionDetailsResp> {
    return this.http.post<getTransactionDetailsResp>(environment.Url + 'stocktrans/GetStockTransfer/', body)
  }
  GetStockTransferReceipt(body: any): Observable<getTransactionDetailsResp> {
    return this.http.post<getTransactionDetailsResp>(environment.Url + 'stocktrans/GetStockTransferReceipt/', body)
  }
  UpdateStockTransfer(body: StockTransfer): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockTransferHdr/', body)
  }
  UpdateStockTransferReceiptHdr(body: stockTransferReceiptHeader): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockTransferReceiptHdr/', body)
  }
  GetMasterItemsListSelLocation(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsListLocnSpecific/', body)
  }
  GetStockTransferDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetStockTransferDetails/', body)
  }
  GetTransferReceiptDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetTransferReceiptDetails/', body)
  }
  UpdateStockTransferDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/UpdateStockTransferDet/', body)
  }
  GetMaterialRequest(mtr: materialRequestHdr): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetMaterialRequest/', mtr)
  }
  GetMaterialRequestDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetMaterialRequestDetails/', body)
  }
  UpdateMaterialRequestDetails(materialRequestDetails: materialRequestDetails): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/UpdateMaterialRequestDetails/', materialRequestDetails)
  }
  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  GetStockAdjustment(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stockadjustments/GetStockAdjustment/', body)
  }
  GetStockAdjustmentDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stockadjustments/GetStockTransferDetails/', body)
  }

  GetPhysicalStock(phyCls: PhysicalDeails): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetPhysicalStock/', phyCls)
  }

  UpdatePhysicalStock(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdatePhysicalStock/', body)
  }


  getPropertyDetails(bcls: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPropertyDetails', bcls)
  }
  getProductGroupDetails(prodcls: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/GetProductGroupDetails', prodcls)
  }
  UpdateProductGroups(prodcls: ProductGroup): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'Products/UpdateProductGroups', prodcls)
  }

  //#region Consumption
  getStockIssueHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'delivery/GetConsumptionHeader/', body)
  }
  updateStockIssueHdr(body: any): Observable<any> {
    return this.http.post(environment.Url + 'delivery/UpdateStockIssuesHdr/', body)
  }

  getStockIssueDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'delivery/GetStockIssueItemDetails/', body)
  }
  updateStockIssueDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'delivery/UpdateStockIssueItemDetails/', body)
  }

  getProductAliasDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/GetProductAliasNames/', body)
  }

  updateProductAliasDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'Products/UpdateProductAliasNames/', body)
  }
  //#endregion


  getWareHouseLotStock(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetProductWarehouseLotStock', body)
  }

  updatematerialRequest(matReqHdr: materialRequestHdr): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/UpdateMaterialRequest', matReqHdr)
  }

  GetAuthorizedTransactions(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetAuthorizedTransactions', body)
  }
  getStockConsumptionHeader(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetStockConsumptionHeader', body)
  }


  GetStockConsumptionDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetStockConsumptionDetails', body)
  }

  GetStockAdj(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetStockAdjustment', body)
  }

  UpdateStockConsumptionHdr(stkConHdr: StockIssueHdr): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockConsumptionHeader', stkConHdr)
  }

  UpdateStockConsDetails(stkConDet: stockConsumptionDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockConsumptionDetails', stkConDet)
  }

  UpdateStockAdjustment(stkAdjCls: stockAdjustmenthdrClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockAdjustment', stkAdjCls)
  }


  GetStockAdjDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stocktrans/GetStockAdjustmentDetails', body)
  }


  UpdateStockAdjDetails(stkAdjdetCls: stockAdjDetailsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'stocktrans/UpdateStockAdjustmentDetails', stkAdjdetCls)
  }
}
