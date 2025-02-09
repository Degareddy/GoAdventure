import { createAction, props } from '@ngrx/store';
import { PLReportState, ReportState, SaleReportState, TransactionReportState } from './location.reducer';

export const updateLocation = createAction(
  '[Location] Update Location',
  props<{ location: string,company:string }>()
);


//NGRX actions to save
export const saveReportState = createAction(
  '[Report] Save State',
  props<{ state: ReportState }>()
);

export const loadReportState = createAction('[Report] Load State');
export const clearReportState = createAction('[Report] Clear State');


export const saveSaleReportState = createAction(
  '[SaleReport] Save State',
  props<{ state: SaleReportState }>()
);

export const loadSaleReportState = createAction('[SaleReport] Load State');

export const clearSaleReportState = createAction('[SaleReport] Clear State');


export const savePLReportState = createAction(
  '[PLReport] Save State',
  props<{ state: PLReportState }>()
);

export const loadPLReportState = createAction('[PLReport] Load State');

export const clearPLReportState = createAction('[PLReport] Clear State');



export const saveTransctionReportState = createAction(
  '[TransctionReport] Save State',
  props<{ state: TransactionReportState }>()
);

export const loadTransctionReportState = createAction('[TransctionReport] Load State');

export const clearTransctionReportState = createAction('[TransctionReport] Clear State');
