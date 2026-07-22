-- Migration for Pro Tasks UI

-- 1. Add Inbox flag
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_inbox BOOLEAN DEFAULT false;

-- 2. Add Notes field
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Add High Priority flag
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_high_priority BOOLEAN DEFAULT false;

-- 4. Add Sort Order
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
