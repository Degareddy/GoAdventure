import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LocationState, PLReportState, ReportState, SaleReportState, TransactionReportState } from './location.reducer';

export const selectLocationState = createFeatureSelector<LocationState>('location');

export const selectLocation = createSelector(
  selectLocationState,
  (state: LocationState) => state.location
);
export const selectCompany = createSelector(
  selectLocationState,
  (state: LocationState) => state.company
);

//NGRX statement storage
export const selectReportState = createFeatureSelector<ReportState>('report');

export const selectReportData = createSelector(
  selectReportState,
  (state: ReportState) => state
);

export const selectSaleReportState = createFeatureSelector<SaleReportState>('saleReport');

export const selectSaleReportData = createSelector(
  selectSaleReportState,
  (state: SaleReportState) => state
);


export const selectPLReportState = createFeatureSelector<PLReportState>('PLReport');

export const selectPLReportData = createSelector(
  selectPLReportState,
  (state: PLReportState) => state
);


export const selectTransactionReportState = createFeatureSelector<TransactionReportState>('TransactionReport');

export const selectTransactionReportData = createSelector(
  selectTransactionReportState,
  (state: TransactionReportState) => state
);
