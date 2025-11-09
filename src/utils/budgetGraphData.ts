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
 * Uses rollover day to determine when budget credits are applied
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
  const rolloverDay = budget.rolloverDay || 1;

  // Create array of rollover dates from start date to now
  const rolloverDates: Date[] = [];

  // Find first rollover date on or after start date
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  let currentRollover = new Date(startYear, startMonth, rolloverDay);

  // If start date is after this month's rollover, start from next month
  if (startDate > currentRollover) {
    currentRollover = new Date(startYear, startMonth + 1, rolloverDay);
  }

  // Build array of rollover dates up to today
  while (currentRollover <= today) {
    rolloverDates.push(new Date(currentRollover));
    const nextMonth = currentRollover.getMonth() + 1;
    currentRollover = new Date(currentRollover.getFullYear(), nextMonth, rolloverDay);
  }

  // Group transactions by rollover period
  const transactionsByPeriod = new Map<string, number>();

  allocatedTransactions.forEach((txn) => {
    if (txn.type === 'expense') {
      const txnDate = new Date(txn.date);

      // Find which rollover period this transaction belongs to
      let periodKey = 'before-start';
      for (let i = 0; i < rolloverDates.length; i++) {
        const currentPeriod = rolloverDates[i];
        const nextPeriod = i < rolloverDates.length - 1 ? rolloverDates[i + 1] : today;

        if (txnDate >= currentPeriod && txnDate < nextPeriod) {
          periodKey = currentPeriod.toISOString().split('T')[0];
          break;
        } else if (i === rolloverDates.length - 1 && txnDate >= currentPeriod) {
          // After last rollover date
          periodKey = currentPeriod.toISOString().split('T')[0];
          break;
        }
      }

      if (periodKey !== 'before-start') {
        transactionsByPeriod.set(
          periodKey,
          (transactionsByPeriod.get(periodKey) || 0) + txn.amount
        );
      }
    }
  });

  // Generate data points
  const startingBalance = budget.startingBalance || 0;
  let runningBalance = startingBalance;
  let cumulativeCredit = 0;
  let cumulativeDebit = 0;

  const dataPoints: BudgetLifecycleDataPoint[] = rolloverDates.map((rolloverDate) => {
    const dateKey = rolloverDate.toISOString().split('T')[0];
    const periodDebit = transactionsByPeriod.get(dateKey) || 0;
    const periodCredit = budget.amount; // Budget amount added each rollover

    cumulativeCredit += periodCredit;
    cumulativeDebit += periodDebit;
    runningBalance += periodCredit - periodDebit;

    return {
      date: dateKey,
      displayDate: rolloverDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      credit: periodCredit,
      debit: periodDebit,
      balance: runningBalance,
      cumulativeCredit,
      cumulativeDebit,
    };
  });

  return dataPoints;
};
