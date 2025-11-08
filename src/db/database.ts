import Dexie, { Table } from 'dexie';
import { Transaction, Budget } from '../types/transaction';

export class BudgetDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('BudgetItDatabase');

    this.version(1).stores({
      transactions: 'id, date, type, category, account, budgetId, status',
      budgets: 'id, title, period, createdAt',
    });
  }
}

export const db = new BudgetDatabase();
