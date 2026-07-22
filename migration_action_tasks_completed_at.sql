-- Migration to add completed_at to action_tasks
ALTER TABLE public.action_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
