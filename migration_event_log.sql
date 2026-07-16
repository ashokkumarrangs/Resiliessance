-- 11. EVENT LOG (Activity Stream)
CREATE TABLE IF NOT EXISTS public.event_log (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  event TEXT REFERENCES public.habit_config(habit_name) ON DELETE CASCADE,
  value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for event_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_log;
