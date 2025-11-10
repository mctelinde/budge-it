export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  notes?: string;
  status?: 'pending' | 'cleared' | 'reconciled';
  budgetId?: string;
}

export interface Budget {
  id: string;
  title: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: string;
  categories?: string[];
  transactionIds?: string[];
  startingBalance?: number;
  startDate?: string;
  rolloverDay?: number; // Day of month (1-31) when budget credits are applied
  pinned?: boolean; // Whether budget is pinned to transactions page
  displayOrder?: number; // Order for displaying budgets
}