import { Injectable } from '@angular/core';
import { Expense } from '../project/water-reading/water-reading.component';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  private expenses: Expense[] = [];

  constructor() {}

  getExpenses(): Observable<Expense[]> {
    return of(this.expenses);
  }

  addExpense(expense: Expense): void {
    this.expenses.push(expense);
  }

  updateExpense(updatedExpense: Expense): void {
    const index = this.expenses.findIndex(e => e.id === updatedExpense.id);
    if (index !== -1) {
      this.expenses[index] = updatedExpense;
    }
  }

  deleteExpense(id: number): void {
    this.expenses = this.expenses.filter(e => e.id !== id);
  }
}
