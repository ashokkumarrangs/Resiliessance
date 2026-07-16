-- RUN IN SUPABASE SQL EDITOR
-- Create budget_plans table for Artha

CREATE TABLE IF NOT EXISTS public.budget_plans (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  month DATE NOT NULL, -- Stored as 'YYYY-MM-01'
  planned_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, subcategory, month)
);

-- Enable RLS (if needed)
-- ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all public for now" ON public.budget_plans FOR ALL USING (true);
