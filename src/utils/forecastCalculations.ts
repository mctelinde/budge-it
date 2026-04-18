/**
 * Forecast calculation utilities.
 * Projects when a budget's running balance will reach a target amount,
 * assuming the user saves 100% of the per-period budget credit going forward.
 */

export interface ForecastResult {
  /** True if the current remaining balance already meets the target */
  isAchievableNow: boolean;
  /** Number of additional budget periods needed to reach the target */
  periodsNeeded: number;
  /** The projected calendar date when the target will be reached, or null if uncomputable */
  projectedDate: Date | null;
  /** How much more is still needed beyond the current remaining balance */
  shortfall: number;
}

/**
 * Advance a date by N rollover periods, respecting the budget's period type
 * and rolloverDay (for monthly budgets).
 */
function advanceByPeriods(
  from: Date,
  periods: number,
  period: 'monthly' | 'weekly' | 'yearly',
  rolloverDay?: number
): Date {
  const d = new Date(from);

  switch (period) {
    case 'monthly': {
      if (rolloverDay) {
        // Each period is one calendar month; the credit lands on rolloverDay
        d.setMonth(d.getMonth() + periods);
      } else {
        d.setMonth(d.getMonth() + periods);
      }
      break;
    }
    case 'weekly': {
      d.setDate(d.getDate() + periods * 7);
      break;
    }
    case 'yearly': {
      d.setFullYear(d.getFullYear() + periods);
      break;
    }
  }

  return d;
}

/**
 * Find the next upcoming rollover date on or after `from`.
 * For monthly budgets with a rolloverDay, this snaps to that day-of-month.
 * For weekly/yearly budgets this is simply `from` (periods start immediately).
 */
function nextRolloverDate(
  from: Date,
  period: 'monthly' | 'weekly' | 'yearly',
  rolloverDay?: number
): Date {
  if (period !== 'monthly' || !rolloverDay) {
    return new Date(from);
  }

  const year = from.getFullYear();
  const month = from.getMonth();
  const candidate = new Date(year, month, rolloverDay);

  if (candidate >= from) {
    return candidate;
  }

  // Rollover day already passed this month — next one is next month
  return new Date(year, month + 1, rolloverDay);
}

/**
 * Calculate a forecast result.
 *
 * @param targetAmount     The purchase goal (positive number)
 * @param currentRemaining The budget's current remaining balance (can be negative)
 * @param perPeriodAmount  The budget's per-period credit amount
 * @param period           Budget period type
 * @param rolloverDay      Day of month for monthly rollover (optional)
 */
export function calculateForecast(
  targetAmount: number,
  currentRemaining: number,
  perPeriodAmount: number,
  period: 'monthly' | 'weekly' | 'yearly',
  rolloverDay?: number
): ForecastResult {
  const shortfall = Math.max(0, targetAmount - currentRemaining);

  if (shortfall === 0) {
    return {
      isAchievableNow: true,
      periodsNeeded: 0,
      projectedDate: new Date(),
      shortfall: 0,
    };
  }

  if (perPeriodAmount <= 0) {
    return {
      isAchievableNow: false,
      periodsNeeded: Infinity,
      projectedDate: null,
      shortfall,
    };
  }

  const periodsNeeded = Math.ceil(shortfall / perPeriodAmount);
  const startFrom = nextRolloverDate(new Date(), period, rolloverDay);
  const projectedDate = advanceByPeriods(startFrom, periodsNeeded, period, rolloverDay);

  return {
    isAchievableNow: false,
    periodsNeeded,
    projectedDate,
    shortfall,
  };
}
