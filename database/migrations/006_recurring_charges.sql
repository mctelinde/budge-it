-- Migration: Add recurring_charges table
-- Supports defining a fixed monthly charge applied against a budget based on a
-- promoted transaction. The charge contributes amount × elapsed_periods to the
-- budget spend, and all allocated transactions matching description + amount
-- (case-insensitive) are excluded from direct counting to prevent double-counting.

CREATE TABLE public.recurring_charges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  budget_id         UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  -- Matched case-insensitively against transaction.description
  description       TEXT NOT NULL,
  -- Per-period charge amount
  amount            NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  -- Rollover date of the first budget period in which the charge applies
  start_period_date DATE NOT NULL,
  -- Optional end date (NULL = indefinite); charge is capped at this rollover date
  end_period_date   DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_period_date IS NULL OR end_period_date > start_period_date)
);

-- Indexes
CREATE INDEX idx_recurring_charges_user_id   ON public.recurring_charges(user_id);
CREATE INDEX idx_recurring_charges_budget_id ON public.recurring_charges(budget_id);

-- Row Level Security
ALTER TABLE public.recurring_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring charges" ON public.recurring_charges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring charges" ON public.recurring_charges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring charges" ON public.recurring_charges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring charges" ON public.recurring_charges
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER set_updated_at_recurring_charges
  BEFORE UPDATE ON public.recurring_charges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
