-- ============================================================
-- Skills Monthly Focus Tracker - Database Migration
-- ============================================================

-- Table 1: skill_items
CREATE TABLE IF NOT EXISTS skill_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  icon                      TEXT NOT NULL DEFAULT '🎯',
  color                     TEXT NOT NULL DEFAULT '#7c3aed',
  description               TEXT,
  status                    TEXT NOT NULL DEFAULT 'queued'
                              CHECK (status IN ('focus', 'archived', 'queued')),
  focus_month               DATE,
  queue_order               INTEGER DEFAULT 0,
  target_sessions_per_month INTEGER DEFAULT 20,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: skill_logs
CREATE TABLE IF NOT EXISTS skill_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id         UUID NOT NULL REFERENCES skill_items(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes            TEXT,
  mood             TEXT DEFAULT 'good'
                     CHECK (mood IN ('great', 'good', 'okay', 'hard')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_logs_skill_id ON skill_logs(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_date      ON skill_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_skill_items_status   ON skill_items(status);

ALTER TABLE skill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_logs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on skill_items" ON skill_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on skill_logs"  ON skill_logs  FOR ALL USING (true) WITH CHECK (true);
