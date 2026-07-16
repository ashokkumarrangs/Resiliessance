-- Migration for Task Analytics (Velocity, Aging, Throughput)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update existing completed tasks to have a dummy completed_at if missing
UPDATE tasks SET completed_at = created_at WHERE status = 'Completed' AND completed_at IS NULL;
