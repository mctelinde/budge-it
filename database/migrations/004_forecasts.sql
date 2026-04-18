-- Migration: Add forecasts table
-- Supports planning for large future purchases against a specific budget.
-- A forecast projects when the user's budget remaining balance + future period
-- credits will be sufficient to afford the target purchase amount.

CREATE TABLE public.forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  notes TEXT,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_forecasts_user_id ON public.forecasts(user_id);
CREATE INDEX idx_forecasts_budget_id ON public.forecasts(budget_id);

-- Row Level Security
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own forecasts" ON public.forecasts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own forecasts" ON public.forecasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forecasts" ON public.forecasts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forecasts" ON public.forecasts
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER set_updated_at_forecasts
  BEFORE UPDATE ON public.forecasts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
