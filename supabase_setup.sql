-- (LIFE OS) SUPABASE SETUP SCRIPT (CONSOLIDATED)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. LIQUIDITY (Accounts & Wallets)
CREATE TABLE IF NOT EXISTS public.liquidity (
  account_name TEXT PRIMARY KEY,
  balance DECIMAL DEFAULT 0,
  account_no TEXT,
  type TEXT DEFAULT 'Savings',
  notes TEXT,
  card_no TEXT,
  card_pin TEXT,
  nb_user TEXT,
  nb_pass TEXT,
  nb_txn TEXT,
  mb_pass TEXT,
  mb_mpin TEXT,
  mb_txn TEXT,
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASSETS
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'General',
  current_value DECIMAL DEFAULT 0,
  purchase_price DECIMAL DEFAULT 0,
  purchase_date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  subcategory TEXT,
  owner TEXT DEFAULT 'Me',
  place TEXT,
  notes TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LIABILITIES
CREATE TABLE IF NOT EXISTS public.liabilities (
  party TEXT PRIMARY KEY,
  party_type TEXT DEFAULT 'Personal',
  total_amount DECIMAL DEFAULT 0,
  remaining DECIMAL DEFAULT 0,
  interest_paid DECIMAL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HISTORY TABLES
CREATE TABLE IF NOT EXISTS public.history_expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL, -- Expense, Income, Transfer
  account TEXT REFERENCES public.liquidity(account_name) ON DELETE SET NULL,
  category TEXT,
  subcategory TEXT,
  particular TEXT,
  vendor TEXT,
  place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.history_liabilities (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount DECIMAL NOT NULL,
  type TEXT NOT NULL, -- Principal, Interest, Borrowed
  account TEXT, -- Paid, Received
  party TEXT REFERENCES public.liabilities(party) ON DELETE SET NULL,
  party_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
  is_today BOOLEAN DEFAULT FALSE,
  is_week BOOLEAN DEFAULT FALSE,
  is_inbox BOOLEAN DEFAULT FALSE,
  is_high_priority BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HABITS
CREATE TABLE IF NOT EXISTS public.habit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_name TEXT NOT NULL UNIQUE,
  group_name TEXT,
  input_type TEXT DEFAULT 'boolean',
  unit TEXT,
  frequency TEXT DEFAULT 'daily',
  emoji TEXT,
  group_order INTEGER DEFAULT 0,
  daily_habit_order INTEGER DEFAULT 0,
  habit_color TEXT DEFAULT '#3b82f6',
  unlogged_is_success BOOLEAN DEFAULT FALSE,
  
  -- Rules Logic Columns
  condition_type TEXT DEFAULT 'at_least_n', -- boolean, at_least_n, at_most_n, exactly_n, between, above_below
  direction TEXT DEFAULT 'more', -- more (More is Better), less (Less is Better)
  target_value DECIMAL DEFAULT 1,
  suc_min DECIMAL,
  suc_max DECIMAL,
  tol_min DECIMAL,
  tol_max DECIMAL,
  crit_min DECIMAL,
  crit_max DECIMAL,
  
  -- Streak Rules
  grace_days INTEGER DEFAULT 0,
  soft_grace_days INTEGER DEFAULT 0,
  escalation_days INTEGER DEFAULT 0,
  tol_cap_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_data (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  habit TEXT REFERENCES public.habit_config(habit_name) ON DELETE CASCADE,
  value TEXT,
  status TEXT DEFAULT 'Not Entered',
  group_name TEXT,
  unit TEXT,
  source TEXT DEFAULT 'daily', -- daily, event
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENT LOG (Activity Stream for Habits)
CREATE TABLE IF NOT EXISTS public.event_log (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  event TEXT REFERENCES public.habit_config(habit_name) ON DELETE CASCADE,
  value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WORKOUT
CREATE TABLE IF NOT EXISTS public.workout_log (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  workout_day TEXT,
  workout_name TEXT NOT NULL,
  set_no INTEGER NOT NULL,
  weight DECIMAL,
  reps INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'Car',
  fuel_type TEXT DEFAULT 'Petrol',
  initial_odometer DECIMAL DEFAULT 0,
  insurance_expiry DATE,
  next_service_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_fuel_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicle_config(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer DECIMAL NOT NULL,
  liters DECIMAL NOT NULL,
  amount DECIMAL NOT NULL,
  station TEXT,
  full_tank BOOLEAN DEFAULT TRUE,
  mileage DECIMAL,
  full_tank_mileage DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_service_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicle_config(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer DECIMAL NOT NULL,
  amount DECIMAL NOT NULL,
  service_center TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vehicle_mileage_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicle_config(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer DECIMAL NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BUDGET PLANS
CREATE TABLE IF NOT EXISTS public.budget_plans (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  month DATE NOT NULL, -- Stored as 'YYYY-MM-01'
  planned_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, subcategory, month)
);

-- 11. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
  icon TEXT, -- Emoji icon
  type TEXT DEFAULT 'other', -- city, building, room, furniture, compartment, other
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id UUID REFERENCES public.inventory_locations(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT,
  tags TEXT[],
  notes TEXT,
  
  -- Origin
  origin_type TEXT CHECK (origin_type IN ('bought', 'gifted_in', 'borrowed')),
  origin_person TEXT,
  acquired_date DATE,
  purchase_price DECIMAL,
  
  -- Condition
  condition TEXT DEFAULT 'good', -- new, good, fair, poor
  
  -- Status & Lending
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lent_out', 'retired')),
  lent_to_person TEXT,
  lent_date DATE,
  return_due_date DATE,
  
  -- Retirement
  retired_reason TEXT CHECK (retired_reason IN ('worn_out', 'gifted_out', 'lost', 'stolen', 'sold', 'returned')),
  retired_at TIMESTAMPTZ,
  retired_to_person TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SQUARESHIFT (Action Items)
CREATE TABLE IF NOT EXISTS public.action_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.action_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT REFERENCES public.action_projects(id) ON DELETE CASCADE, -- Null means Quick Notes
  text TEXT NOT NULL,
  due DATE,
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for all tables to prevent row-level security policy violation errors in this personal application
ALTER TABLE public.liquidity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_liabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fuel_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_service_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_mileage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_tasks DISABLE ROW LEVEL SECURITY;


-- 12. REALTIME ENABLEMENT
DO $$
BEGIN
  -- Safe helper function to enable realtime for a table if not already enabled
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_data') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_data;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'liquidity') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.liquidity;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_config;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_fuel_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_fuel_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_service_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_service_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_mileage_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_mileage_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'event_log') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_locations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_locations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'action_projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.action_projects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'action_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.action_tasks;
  END IF;
END $$;

