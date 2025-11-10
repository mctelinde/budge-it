-- Add display_order column to budgets table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_display_order
ON public.budgets(display_order);

-- Optionally, initialize display_order for existing budgets based on created_at
UPDATE public.budgets
SET display_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
  FROM public.budgets
  WHERE display_order IS NULL OR display_order = 0
) AS subquery
WHERE budgets.id = subquery.id;
