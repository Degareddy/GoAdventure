// src/app/utils/clear-state.metareducer.ts
import { ActionReducer, MetaReducer } from '@ngrx/store';
import { logout } from './auth.actions';

export function clearStateMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return function(state, action) {
    if (action.type === logout.type) {
      state = undefined;
    }
    return reducer(state, action);
  };
}

export const metaReducers: MetaReducer<any>[] = [clearStateMetaReducer];
