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
