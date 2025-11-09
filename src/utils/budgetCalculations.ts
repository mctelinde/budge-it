import { Budget } from '../types/transaction';

/**
 * Calculate how many budget periods have elapsed based on rollover day
 * For monthly budgets with rollover day: counts credits applied on rollover days since start
 * For weekly budgets: counts the number of weeks
 * For yearly budgets: counts the number of years
 */
export const calculateElapsedPeriods = (
  startDate: string | undefined,
  period: 'monthly' | 'weekly' | 'yearly',
  rolloverDay?: number
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
      if (rolloverDay) {
        // Count how many rollover days have passed since start date
        let count = 0;
        const currentDate = new Date(start);

        // Move to the first rollover day on or after start date
        const startMonth = currentDate.getMonth();
        const startYear = currentDate.getFullYear();

        // Set to rollover day of the start month
        let rolloverDate = new Date(startYear, startMonth, rolloverDay);

        // If start date is after the rollover day this month, move to next month
        if (start > rolloverDate) {
          rolloverDate = new Date(startYear, startMonth + 1, rolloverDay);
        }

        // Count all rollover dates that have passed
        while (rolloverDate <= now) {
          count++;
          // Move to next month's rollover day
          const nextMonth = rolloverDate.getMonth() + 1;
          const nextYear = rolloverDate.getFullYear();
          rolloverDate = new Date(nextYear, nextMonth, rolloverDay);
        }

        return count;
      } else {
        // Legacy behavior: Count the number of months elapsed
        const yearsDiff = now.getFullYear() - start.getFullYear();
        const monthsDiff = now.getMonth() - start.getMonth();
        const totalMonths = yearsDiff * 12 + monthsDiff;
        return totalMonths + 1;
      }
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
  const periods = calculateElapsedPeriods(budget.startDate, budget.period, budget.rolloverDay);
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
