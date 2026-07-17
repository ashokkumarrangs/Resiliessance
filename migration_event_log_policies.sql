-- Enable Row Level Security
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- Add policies for public (anon) access
-- Note: In a production app, you'd restrict this to authenticated users.
-- For local development, we usually allow all for ease of use.

DROP POLICY IF EXISTS "Allow public read access" ON public.event_log;
CREATE POLICY "Allow public read access" ON public.event_log
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.event_log;
CREATE POLICY "Allow public insert access" ON public.event_log
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.event_log;
CREATE POLICY "Allow public update access" ON public.event_log
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.event_log;
CREATE POLICY "Allow public delete access" ON public.event_log
FOR DELETE USING (true);
