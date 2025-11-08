import { Budget } from '../types/transaction';

/**
 * Calculate how many budget periods have elapsed from start date to current date
 * For monthly budgets: counts the number of 1st days of the month that have passed
 * For weekly budgets: counts the number of weeks
 * For yearly budgets: counts the number of years
 */
export const calculateElapsedPeriods = (
  startDate: string | undefined,
  period: 'monthly' | 'weekly' | 'yearly'
): number => {
  if (!startDate) {
    // If no start date, assume 1 period (current period only)
    return 1;
  }

  const start = new Date(startDate);
  const now = new Date();

  // If start date is in the future, return 0
  if (start > now) {
    return 0;
  }

  switch (period) {
    case 'monthly': {
      // Count the number of months elapsed (including partial months)
      const yearsDiff = now.getFullYear() - start.getFullYear();
      const monthsDiff = now.getMonth() - start.getMonth();
      const totalMonths = yearsDiff * 12 + monthsDiff;

      // Add 1 to include the starting month
      return totalMonths + 1;
    }

    case 'weekly': {
      // Calculate number of weeks elapsed
      const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
      const timeDiff = now.getTime() - start.getTime();
      const weeksDiff = Math.floor(timeDiff / millisecondsPerWeek);

      // Add 1 to include the starting week
      return weeksDiff + 1;
    }

    case 'yearly': {
      // Count the number of years elapsed
      const yearsDiff = now.getFullYear() - start.getFullYear();

      // Add 1 to include the starting year
      return yearsDiff + 1;
    }

    default:
      return 1;
  }
};

/**
 * Calculate the cumulative budget amount based on elapsed periods
 */
export const calculateCumulativeBudget = (
  budget: Budget
): number => {
  const periods = calculateElapsedPeriods(budget.startDate, budget.period);
  return budget.amount * periods;
};

/**
 * Calculate the total available funds (starting balance + cumulative budget)
 */
export const calculateTotalAvailable = (
  budget: Budget
): number => {
  const cumulativeBudget = calculateCumulativeBudget(budget);
  const startingBalance = budget.startingBalance ?? 0;
  return startingBalance + cumulativeBudget;
};

/**
 * Calculate remaining budget (total available - spent)
 */
export const calculateRemaining = (
  budget: Budget,
  spent: number
): number => {
  const totalAvailable = calculateTotalAvailable(budget);
  return totalAvailable - spent;
};
