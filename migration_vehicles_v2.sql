-- VEHICLE MODULE MIGRATION (V2)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. VEHICLE CONFIG (Master table for fleet)
CREATE TABLE IF NOT EXISTS public.vehicle_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'Car', -- Car, Bike, Scooter
  fuel_type TEXT DEFAULT 'Petrol', -- Petrol, Diesel, EV
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUEL LOGS (Tracking fuel entries and mileage)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICE LOGS (Tracking maintenance history)
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

-- 4. REALTIME ENABLEMENT
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_fuel_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_service_logs;

-- 5. RLS POLICIES (Allowing public access for the standalone OS)
ALTER TABLE public.vehicle_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to vehicle_config" ON public.vehicle_config FOR ALL USING (true);
CREATE POLICY "Allow public access to vehicle_fuel_logs" ON public.vehicle_fuel_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to vehicle_service_logs" ON public.vehicle_service_logs FOR ALL USING (true);
