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


-- Workout Templates
CREATE TABLE IF NOT EXISTS workout_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_template_exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_template(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workout_template_set (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_exercise_id UUID REFERENCES workout_template_exercise(id) ON DELETE CASCADE,
  set_no INT NOT NULL,
  target_weight NUMERIC,
  target_reps INT
);

-- Enable RLS and add policies for templates
ALTER TABLE workout_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_set ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write on workout_template"
ON workout_template FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write on workout_template_exercise"
ON workout_template_exercise FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write on workout_template_set"
ON workout_template_set FOR ALL USING (true) WITH CHECK (true);

-- Scheduled Workouts
CREATE TABLE IF NOT EXISTS scheduled_workout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_template(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_workout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read/write on scheduled_workout"
ON scheduled_workout FOR ALL USING (true) WITH CHECK (true);

-- Weekly & Custom Frequency Habit support columns
ALTER TABLE habit_config 
ADD COLUMN IF NOT EXISTS frequency_type TEXT DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interval_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interval_unit TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interval_anchor DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flexible_target_count INTEGER DEFAULT NULL;

-- Second Brain: Knowledge Base
CREATE TABLE IF NOT EXISTS brain_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'idea',
  -- types: 'fleeting' | 'idea' | 'book_note' | 'quote' | 'article' | 'insight' | 'concept'
  body TEXT,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '💡',
  next_review_date DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  review_interval_days INT DEFAULT 7,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brain_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read/write on brain_cards"
ON brain_cards FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS brain_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_card_id UUID REFERENCES brain_cards(id) ON DELETE CASCADE,
  to_card_id UUID REFERENCES brain_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_card_id, to_card_id)
);

ALTER TABLE brain_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read/write on brain_links"
ON brain_links FOR ALL USING (true) WITH CHECK (true);

-- ─── Savings Goals & Allocations ────────────────────────────────────────────────
-- Add tags support to liquidity accounts
ALTER TABLE liquidity ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  target_date DATE,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused'
  notes TEXT
);

-- Enable RLS for savings_goals
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read/write on savings_goals"
ON savings_goals FOR ALL USING (true) WITH CHECK (true);

-- Savings Allocations Table (Envelope allocations)
CREATE TABLE IF NOT EXISTS savings_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL REFERENCES liquidity(account_name) ON UPDATE CASCADE ON DELETE CASCADE,
  allocated_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  UNIQUE(goal_id, account_name)
);

-- Enable RLS for savings_allocations
ALTER TABLE savings_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read/write on savings_allocations"
ON savings_allocations FOR ALL USING (true) WITH CHECK (true);


-- ─── Tasks & SquareShift Recurrence & Deadlines ────────────────────────────────

-- Upgrade SquareShift (action_tasks) table
ALTER TABLE action_tasks 
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_anchor DATE DEFAULT NULL;

-- Upgrade General Task Manager (tasks) table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_anchor DATE DEFAULT NULL;

-- Habit Streak Protection: Joker Cards support
ALTER TABLE habit_config 
ADD COLUMN IF NOT EXISTS joker_days_limit INTEGER DEFAULT 0;


-- ─── Vehicle Component Age Tracker ──────────────────────────────────────────

-- Track individual vehicle components and their lifespans
CREATE TABLE IF NOT EXISTS vehicle_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicle_config(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Component Details
  component_name TEXT NOT NULL,         -- e.g., "Engine Oil", "Front Brake Pads", "Cabin Air Filter"
  category TEXT NOT NULL,               -- 'Fluids' | 'Brakes' | 'Filters' | 'Electrical' | 'Tires' | 'Belts' | 'Other'
  brand_model TEXT,                     -- e.g., "Mobil1 5W-30", "Brembo Ceramic"
  cost NUMERIC(12, 2) DEFAULT 0.00,
  notes TEXT,
  
  -- Lifespan Baseline (Installation State)
  installed_date DATE NOT NULL,
  installed_odometer INT NOT NULL,
  
  -- Lifespan Thresholds (Limits)
  limit_odometer INT,                   -- e.g., 10000 (km/miles) until replacement
  limit_months INT,                     -- e.g., 12 (months) until replacement
  
  -- Current Lifecycle Metadata
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE vehicle_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write on vehicle_components"
ON vehicle_components FOR ALL USING (true) WITH CHECK (true);

-- Component Life Cycle History
CREATE TABLE IF NOT EXISTS vehicle_component_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES vehicle_components(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicle_config(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand_model TEXT,
  
  -- Lifespan achieved
  installed_date DATE NOT NULL,
  installed_odometer INT NOT NULL,
  replaced_date DATE NOT NULL,
  replaced_odometer INT NOT NULL,
  
  -- Performance
  distance_traveled INT NOT NULL,
  months_in_service INT NOT NULL,
  cost NUMERIC(12, 2) DEFAULT 0.00,
  replacement_reason TEXT               -- 'Scheduled', 'Wear/Failure', 'Upgrade'
);

ALTER TABLE vehicle_component_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read/write on vehicle_component_history"
ON vehicle_component_history FOR ALL USING (true) WITH CHECK (true);

