export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card';
  currentBalance: number;
  notes?: string;
  displayOrder: number;
  createdAt: string;
}

export interface Forecast {
  id: string;
  budgetId: string;
  title: string;
  targetAmount: number;
  notes?: string;
  achievedAt?: string | null; // ISO date string, null when not yet achieved
  createdAt: string;
}

export interface RecurringCharge {
  id: string;
  budgetId: string;
  /** Matched case-insensitively against transaction.description */
  description: string;
  /** Per-period charge amount */
  amount: number;
  /** ISO date string — rollover date of the first period this charge applies */
  startPeriodDate: string;
  /** ISO date string — optional end date; undefined means indefinite */
  endPeriodDate?: string;
  createdAt: string;
}

export interface InstallmentPlan {
  id: string;
  transactionId: string;
  budgetId: string;
  numInstallments: number;
  amountPerInstallment: number;
  /** ISO date string — rollover date of the first budget period with an installment due */
  startPeriodDate: string;
  createdAt: string;
}

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
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: string;
  categories?: string[];
  transactionIds?: string[];
  startingBalance?: number;
  startDate?: string;
  rolloverDay?: number; // Day of month (1-31) when budget credits are applied
  pinned?: boolean; // Whether budget is pinned to transactions page
  displayOrder?: number; // Order for displaying budgets
  installmentPlans?: InstallmentPlan[];
  recurringCharges?: RecurringCharge[];
}