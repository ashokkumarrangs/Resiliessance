-- Run this SQL in your Supabase SQL Editor to create the push subscriptions table.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_name TEXT
);

-- Enable row-level security (optional, but good practice. For now we allow all authenticated/anon inserts/selects for simplicity)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write"
ON push_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);

-- SquareShift action_tasks columns for Today tab and High Priority support
ALTER TABLE action_tasks 
ADD COLUMN IF NOT EXISTS is_today BOOLEAN DEFAULT false;

ALTER TABLE action_tasks 
ADD COLUMN IF NOT EXISTS is_high_priority BOOLEAN DEFAULT false;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  next_due_date DATE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  vendor TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused'
  account TEXT NOT NULL, -- source liquidity account
  type TEXT NOT NULL DEFAULT 'Subscription' -- 'Subscription', 'Loan', 'Payment'
);

-- Upgrade existing table if it already exists
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Subscription';

-- Enable RLS and add policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write on subscriptions"
ON subscriptions
FOR ALL
USING (true)
WITH CHECK (true);


