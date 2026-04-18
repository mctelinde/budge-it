-- Migration: Remove unused budgets.spent column
-- The spent amount is always computed dynamically from allocated transactions
-- (see calculateBudgetSpent in budgetCalculations.ts) and was never reliably
-- kept in sync with actual transaction data.

ALTER TABLE public.budgets DROP COLUMN IF EXISTS spent;
