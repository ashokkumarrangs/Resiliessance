-- Run this in your Supabase SQL Editor to upgrade the pet_logs table

ALTER TABLE public.pet_logs 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- Update existing rows to have a default category if they were created previously
UPDATE public.pet_logs SET category = 'Grooming' WHERE log_type IN ('Bath', 'Nail Trim', 'Teeth Brushing', 'Ear Cleaning', 'Haircut', 'Coat Brushing') AND category IS NULL;
UPDATE public.pet_logs SET category = 'Activities' WHERE log_type IN ('Beach Trip', 'Park Visit', 'Hike', 'Playdate', 'Swimming', 'Long Car Ride', 'Time Apart') AND category IS NULL;
UPDATE public.pet_logs SET category = 'Wellness' WHERE log_type IN ('Flea/Tick Meds', 'Heartworm Meds', 'Vomit / Upset Stomach') AND category IS NULL;
UPDATE public.pet_logs SET category = 'Training' WHERE log_type IN ('Training Session', 'Behavioral Incident') AND category IS NULL;
