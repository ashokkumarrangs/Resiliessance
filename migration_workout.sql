-- Add missing workout_day column to workout_log
ALTER TABLE public.workout_log 
ADD COLUMN IF NOT EXISTS workout_day TEXT;
