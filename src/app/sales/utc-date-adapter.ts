// src/app/utc-date-adapter.ts
import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class UtcDateAdapter extends NativeDateAdapter {

  override createDate(year: number, month: number, date: number): Date {
    // Force date creation in UTC with no time offset
    const result = new Date(Date.UTC(year, month, date));
    result.setUTCFullYear(year);
    return result;
  }

  override toIso8601(date: Date): string {
    return date.toISOString();
  }

  override format(date: Date, displayFormat: Object): string {
    // Display date in local string format (dd/MM/yyyy or similar)
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${this._to2digit(day)}/${this._to2digit(month)}/${year}`;
  }

  private _to2digit(n: number) {
    return ('00' + n).slice(-2);
  }
}
