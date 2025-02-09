import { createReducer, on } from '@ngrx/store';
import { clearPLReportState, clearReportState, clearSaleReportState, clearTransctionReportState, loadPLReportState, loadReportState, loadSaleReportState, loadTransctionReportState, savePLReportState, saveReportState, saveSaleReportState, saveTransctionReportState, updateLocation } from './location.actions';

export interface ReportState {
  reportType: string;
  client: string;
  clientType: string;
  chargeType: string;
  fromDate: Date;
  toDate: Date;
  summary: boolean;
  data: any[];
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  creditAmount: number;
  debitAmount: number;
  balAmount: number;
  landlordCode: string
}

export interface SaleReportState {
  BlockCode: string;
  FromDate: Date;
  PropCode: string;
  UnitID: string;
  BalanceType:string;
  receiptType:string;
  isSummary:boolean;
  data: any[];
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
}

export interface PLReportState {
  reportType: string;
  fromDate: Date;
  toDate: Date;
  branch: string;
  summary: boolean;
  data: any[];
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
}


export interface TransactionReportState {
  reportType: string;
  fromDate: Date;
  toDate: Date;
  branch:string;
  item: string;
  data: any[];
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  tranAmount:number;
  totalAmount:number;
}


export interface LocationState {
  location: string;
  company: string;
}

export const initialState: LocationState = {
  location: '',
  company: ''
};

export const locationReducer = createReducer(
  initialState,
  on(updateLocation, (state: LocationState, { location, company }: { location: string, company: string }) => ({ ...state, location, company }))
);

export const initialState1: ReportState = {
  reportType: '',
  client: '',
  clientType: '',
  chargeType: '',
  fromDate: new Date(),
  toDate: new Date(),
  summary: false,
  data: [],
  pagination: {
    pageIndex: 0,
    pageSize: 25
  },
  creditAmount: 0,
  debitAmount: 0,
  balAmount: 0,
  landlordCode: ""
};

export const reportReducer = createReducer(
  initialState1,
  on(saveReportState, (state, { state: reportState }) => ({ ...reportState })),
  on(loadReportState, (state) => state),
  on(clearReportState, () => initialState1)
);


export const initialState2: SaleReportState = {
  BlockCode: '',
  FromDate: new Date(),
  PropCode: '',
  UnitID: '',
  BalanceType:'',
  receiptType:'',
  isSummary:false,
  data: [],
  pagination: {
    pageIndex: 0,
    pageSize: 25
  },
};

export const saleReportReducer = createReducer(
  initialState2,
  on(saveSaleReportState, (state, { state: saleReportState }) => ({ ...saleReportState })),
  on(loadSaleReportState, (state) => state),
  on(clearSaleReportState, () => initialState2)
);


export const initialState3: PLReportState = {
  reportType: '',
  fromDate: new Date(),
  toDate: new Date(),
  summary: false,
  branch:'',
  data: [],
  pagination: {
    pageIndex: 0,
    pageSize: 25
  },
};

export const PLReportReducer = createReducer(
  initialState3,
  on(savePLReportState, (state, { state: PLReportState }) => ({ ...PLReportState })),
  on(loadPLReportState, (state) => state),
  on(clearPLReportState, () => initialState3)
);




export const initialState4: TransactionReportState = {
  reportType: '',
  fromDate: new Date(),
  toDate: new Date(),
  branch:'',
  item:'',
  data: [],
  pagination: {
    pageIndex: 0,
    pageSize: 25
  },
  tranAmount: 0,
  totalAmount: 0,
};

export const TransactionReportReducer = createReducer(
  initialState4,
  on(saveTransctionReportState, (state, { state: TransactionReportState }) => ({ ...TransactionReportState })),
  on(loadTransctionReportState, (state) => state),
  on(clearTransctionReportState, () => initialState4)
);
