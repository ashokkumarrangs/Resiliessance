-- Run this in your Supabase SQL Editor

CREATE TABLE public.pet_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pet_id UUID REFERENCES public.pet_profile(id) ON DELETE CASCADE,
    log_type TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pet_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (assuming personal project, adjust if needed)
CREATE POLICY "Enable all for anon" ON public.pet_logs
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
