import { Budget, Transaction } from '../types/transaction';

export interface BudgetLifecycleDataPoint {
  date: string;
  displayDate: string;
  credit: number;
  debit: number;
  balance: number;
  cumulativeCredit: number;
  cumulativeDebit: number;
}

/**
 * Generate budget lifecycle data for graphing
 * Shows monthly credits (budget allocations) and debits (spending) over time
 */
export const generateBudgetLifecycleData = (
  budget: Budget,
  allocatedTransactions: Transaction[]
): BudgetLifecycleDataPoint[] => {
  if (!budget.startDate) {
    return [];
  }

  const startDate = new Date(budget.startDate);
  const today = new Date();

  // Create array of months from start date to now
  const months: Date[] = [];
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (currentDate <= today) {
    months.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Group transactions by month
  const transactionsByMonth = new Map<string, number>();
  allocatedTransactions.forEach((txn) => {
    if (txn.type === 'expense') {
      const txnDate = new Date(txn.date);
      const monthKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
      transactionsByMonth.set(
        monthKey,
        (transactionsByMonth.get(monthKey) || 0) + txn.amount
      );
    }
  });

  // Generate data points
  const startingBalance = budget.startingBalance || 0;
  let runningBalance = startingBalance;
  let cumulativeCredit = 0;
  let cumulativeDebit = 0;

  const dataPoints: BudgetLifecycleDataPoint[] = months.map((month, index) => {
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    const monthDebit = transactionsByMonth.get(monthKey) || 0;
    const monthCredit = budget.amount; // Budget amount added each month

    cumulativeCredit += monthCredit;
    cumulativeDebit += monthDebit;
    runningBalance += monthCredit - monthDebit;

    return {
      date: monthKey,
      displayDate: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      credit: monthCredit,
      debit: monthDebit,
      balance: runningBalance,
      cumulativeCredit,
      cumulativeDebit,
    };
  });

  return dataPoints;
};
