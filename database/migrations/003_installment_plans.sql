-- Migration: Add installment_plans table
-- Supports spreading a single large transaction across multiple budget periods
-- (e.g. Buy Now Pay Later: $600 purchase paid as 6 x $100/month)

-- Ensure the updated_at trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.installment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  num_installments INTEGER NOT NULL CHECK (num_installments >= 2),
  amount_per_installment NUMERIC(10, 2) NOT NULL CHECK (amount_per_installment > 0),
  -- The rollover date of the first budget period in which an installment is due
  start_period_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Only one installment plan per transaction
  UNIQUE(transaction_id)
);

-- Indexes
CREATE INDEX idx_installment_plans_user_id ON public.installment_plans(user_id);
CREATE INDEX idx_installment_plans_budget_id ON public.installment_plans(budget_id);
CREATE INDEX idx_installment_plans_transaction_id ON public.installment_plans(transaction_id);

-- Row Level Security
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installment plans" ON public.installment_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own installment plans" ON public.installment_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment plans" ON public.installment_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment plans" ON public.installment_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER set_updated_at_installment_plans
  BEFORE UPDATE ON public.installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
