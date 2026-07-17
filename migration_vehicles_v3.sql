-- VEHICLE MODULE ENHANCEMENTS (V3)
-- Run this in your Supabase SQL Editor

-- 1. ADD NEW COLUMNS TO VEHICLE CONFIG
ALTER TABLE public.vehicle_config 
ADD COLUMN IF NOT EXISTS initial_odometer DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
ADD COLUMN IF NOT EXISTS next_service_date DATE;

-- 2. ADD COLUMNS TO FUEL LOGS
ALTER TABLE public.vehicle_fuel_logs 
ADD COLUMN IF NOT EXISTS full_tank_mileage DECIMAL;

-- 3. ADD COLUMNS TO SERVICE LOGS
ALTER TABLE public.vehicle_service_logs 
ADD COLUMN IF NOT EXISTS next_service_date DATE;
