import type { Budget, Transaction } from '../types/transaction';

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

  // Group non-installment transactions by rollover period
  const installmentTxnIds = new Set(
    (budget.installmentPlans || []).map((p) => p.transactionId)
  );
  const transactionsByPeriod = new Map<string, { debit: number; credit: number }>();

  allocatedTransactions
    .filter((txn) => !installmentTxnIds.has(txn.id))
    .forEach((txn) => {
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
        periodKey = currentPeriod.toISOString().split('T')[0];
        break;
      }
    }

    if (periodKey !== 'before-start') {
      const existing = transactionsByPeriod.get(periodKey) || { debit: 0, credit: 0 };
      if (txn.type === 'expense') {
        transactionsByPeriod.set(periodKey, { ...existing, debit: existing.debit + txn.amount });
      } else if (txn.type === 'income') {
        transactionsByPeriod.set(periodKey, { ...existing, credit: existing.credit + txn.amount });
      }
    }
  });

  // Generate data points
  const startingBalance = budget.startingBalance || 0;
  let runningBalance = startingBalance;
  let cumulativeCredit = 0;
  let cumulativeDebit = 0;

  // Pre-compute installment debit per period index
  const installmentDebitByIndex = new Array(rolloverDates.length).fill(0);
  for (const plan of (budget.installmentPlans || [])) {
    const startIdx = rolloverDates.findIndex(
      (d) => d.toISOString().split('T')[0] === plan.startPeriodDate
    );
    if (startIdx !== -1) {
      const endIdx = Math.min(startIdx + plan.numInstallments, rolloverDates.length);
      for (let i = startIdx; i < endIdx; i++) {
        installmentDebitByIndex[i] += plan.amountPerInstallment;
      }
    }
  }

  const dataPoints: BudgetLifecycleDataPoint[] = rolloverDates.map((rolloverDate, periodIndex) => {
    const dateKey = rolloverDate.toISOString().split('T')[0];
    const period = transactionsByPeriod.get(dateKey) || { debit: 0, credit: 0 };
    const periodDebit = period.debit + installmentDebitByIndex[periodIndex];
    const periodCredit = budget.amount + period.credit; // Budget allocation + any income credits

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
