-- Add pinned column to budgets table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;

-- Create an index for better query performance when filtering pinned budgets
CREATE INDEX IF NOT EXISTS idx_budgets_pinned
ON public.budgets(pinned) WHERE pinned = true;
