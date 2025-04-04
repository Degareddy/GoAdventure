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
  updateSkinsTypes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'skins/UpdateSkinTypes/', body)
  }
  getSkinsTypes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'skins/GetSkinTypesList/', body)
  }
  getSkinsSubTypes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'skins/GetSkinSubTypesList/', body)
  }
  GetSelSkinSubTypeDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'skins/GetSelSkinSubTypeDetails/', body)
  }
  UpdateSkinSubTypes(body: any): Observable<any> {
    return this.http.post(environment.Url + 'skins/UpdateSkinSubTypes/', body)
  }
  GetProductDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetProductDetails?', body)
  }
  saveUpdateProducts(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/UpdateProducts?', body)
  }
  GetWarehouseDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetWarehouseDetails/', body)
  }
  saveWarehouse(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateWarehouse/', body)
  }
  GetStockTransfer(body: any): Observable<getTransactionDetailsResp> {
    return this.http.post<getTransactionDetailsResp>(environment.Url + 'inventory/GetStockTransfer/', body)
  }
  GetStockTransferReceipt(body: any): Observable<getTransactionDetailsResp> {
    return this.http.post<getTransactionDetailsResp>(environment.Url + 'inventory/GetStockTransferReceipt/', body)
  }
  UpdateStockTransfer(body: StockTransfer): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockTransferHdr/', body)
  }
  UpdateStockTransferReceiptHdr(body: stockTransferReceiptHeader): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockTransferReceiptHdr/', body)
  }
  GetMasterItemsListSelLocation(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetMasterItemsListLocnSpecific/', body)
  }
  GetStockTransferDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockTransferDetails/', body)
  }
  GetTransferReceiptDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetTransferReceiptDetails/', body)
  }
  UpdateStockTransferDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/UpdateStockTransferDet/', body)
  }
  GetMaterialRequest(mtr: materialRequestHdr): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetMaterialRequest/', mtr)
  }
  GetMaterialRequestDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetMaterialRequestDetails/', body)
  }
  UpdateMaterialRequestDetails(materialRequestDetails: materialRequestDetails): Observable<any> {
    return this.http.post(environment.Url + 'inventory/UpdateMaterialRequestDetails/', materialRequestDetails)
  }
  GetTranCount(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetTranCount', body)
  }

  GetStockAdjustment(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockAdjustment/', body)
  }
  GetStockAdjustmentDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'stockadjuinventorystments/GetStockTransferDetails/', body)
  }

  GetPhysicalStock(phyCls: PhysicalDeails): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetPhysicalStock/', phyCls)
  }

  UpdatePhysicalStock(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdatePhysicalStock/', body)
  }
  UpdatePhysicalStockDetails(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdatePhysicalStockDetails/', body)
  }
  GetPhysicalStockDetails(body: any): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/GetPhysicalStockDetails/', body)
  }


  getPropertyDetails(bcls: MasterParams): Observable<any> {
    return this.http.post(environment.Url + 'property/GetPropertyDetails', bcls)
  }
  getProductGroupDetails(prodcls: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetProductGroupDetails', prodcls)
  }
  UpdateProductGroups(prodcls: ProductGroup): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateProductGroups', prodcls)
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
    return this.http.post(environment.Url + 'inventory/GetProductAliasNames/', body)
  }

  updateProductAliasDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/UpdateProductAliasNames/', body)
  }
  //#endregion


  getWareHouseLotStock(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetProductWarehouseLotStock', body)
  }

  updatematerialRequest(matReqHdr: materialRequestHdr): Observable<any> {
    return this.http.post(environment.Url + 'inventory/UpdateMaterialRequest', matReqHdr)
  }

  GetAuthorizedTransactions(body: any): Observable<any> {
    return this.http.post(environment.Url + 'MasterItems/GetAuthorizedTransactions', body)
  }
  getStockConsumptionHeader(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockConsumptionHeader', body)
  }


  GetStockConsumptionDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockConsumptionDetails', body)
  }

  GetStockAdj(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockAdjustment', body)
  }

  UpdateStockConsumptionHdr(stkConHdr: StockIssueHdr): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockConsumptionHeader', stkConHdr)
  }

  UpdateStockConsDetails(stkConDet: stockConsumptionDetails): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockConsumptionDetails', stkConDet)
  }

  UpdateStockAdjustment(stkAdjCls: stockAdjustmenthdrClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockAdjustment', stkAdjCls)
  }


  GetStockAdjDetails(body: any): Observable<any> {
    return this.http.post(environment.Url + 'inventory/GetStockAdjustmentDetails', body)
  }


  UpdateStockAdjDetails(stkAdjdetCls: stockAdjDetailsClass): Observable<SaveApiResponse> {
    return this.http.post<SaveApiResponse>(environment.Url + 'inventory/UpdateStockAdjustmentDetails', stkAdjdetCls)
  }
}
