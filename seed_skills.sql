-- ============================================================
-- Skills: 6-Month Test Data Seed
-- ============================================================
-- Delete existing data first (clean slate)
DELETE FROM skill_logs;
DELETE FROM skill_items;

-- ============================================================
-- SKILL ITEMS (5 archived + 1 focus + 2 queued)
-- ============================================================
INSERT INTO skill_items (id, name, icon, color, description, status, focus_month, queue_order, target_sessions_per_month) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Reading Books',  '📚', '#10b981', '30 pages per session, non-fiction focus', 'archived', '2026-01-01', 0, 20),
  ('a1000000-0000-0000-0000-000000000002', 'Meditation',     '🧘', '#6366f1', 'Mindfulness + breathwork, 15-20 min daily', 'archived', '2026-02-01', 0, 24),
  ('a1000000-0000-0000-0000-000000000003', 'Guitar',         '🎸', '#f59e0b', 'Chord progressions + fingerpicking', 'archived', '2026-03-01', 0, 16),
  ('a1000000-0000-0000-0000-000000000004', 'Swimming',       '🏊', '#3b82f6', '30 laps per session, freestyle + breaststroke', 'archived', '2026-04-01', 0, 12),
  ('a1000000-0000-0000-0000-000000000005', 'Spanish',        '🇪🇸', '#ec4899', 'Duolingo + conversation practice', 'archived', '2026-05-01', 0, 30),
  ('a1000000-0000-0000-0000-000000000006', 'Boxing',         '🥊', '#7c3aed', '3x per week, sparring + bag work', 'focus',    '2026-06-01', 0, 20),
  ('a1000000-0000-0000-0000-000000000007', 'Digital Art',    '🎨', '#06b6d4', 'Procreate, 1 piece per week', 'queued',   NULL,          1, 16),
  ('a1000000-0000-0000-0000-000000000008', 'Jiu Jitsu',      '🥋', '#ef4444', 'Fundamentals + rolling sessions', 'queued',   NULL,          2, 12);

-- ============================================================
-- SKILL LOGS — Reading Books (Jan 2026, 18 sessions)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000001', '2026-01-02', 45, 'Started Atomic Habits, great first chapter', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-04', 40, 'Habit loops concept clicked today', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-06', 30, 'Slow day, only 20 pages', 'okay'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-08', 50, 'Identity-based habits chapter, mind blown', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-10', 45, 'Finished Atomic Habits, starting Deep Work', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-12', 35, 'Deep Work intro, challenging but good', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-14', 40, 'Newport''s case for focus is compelling', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-16', 30, 'Tired, forced through 25 pages', 'hard'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-18', 45, 'Rules for deep work, taking notes', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-20', 50, 'Quit social media chapter resonates', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-22', 40, 'Finishing Deep Work, solid book', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-24', 35, 'Started The Psychology of Money', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-25', 45, 'Getting rich vs staying rich chapter', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-27', 30, 'Consistent but tired', 'okay'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-28', 45, 'Tails, you win concept — great insight', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-29', 40, 'Almost done with the book', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-30', 50, 'Finished Psychology of Money, 3 books done!', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-01-31', 30, 'Quick review session and notes', 'good'),
  -- Occasional sessions after archiving
  ('a1000000-0000-0000-0000-000000000001', '2026-02-15', 40, 'Read some articles, keeping up habit', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-03-10', 45, 'Started The Almanack of Naval', 'great'),
  ('a1000000-0000-0000-0000-000000000001', '2026-04-22', 30, 'Quick reading session', 'okay'),
  ('a1000000-0000-0000-0000-000000000001', '2026-05-18', 45, 'Read 2 chapters of Shoe Dog', 'good'),
  ('a1000000-0000-0000-0000-000000000001', '2026-06-12', 40, 'Continuing Shoe Dog, great story', 'great');

-- ============================================================
-- SKILL LOGS — Meditation (Feb 2026, 22 sessions)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000002', '2026-02-01', 15, 'First session, mind very busy', 'hard'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-02', 15, 'Getting the hang of breathing focus', 'okay'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-03', 20, 'Felt calmer after, good start', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-04', 20, 'Morning routine, felt great all day', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-05', 20, 'Body scan technique today', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-06', 15, 'Short session, work stress crept in', 'hard'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-07', 20, 'Gratitude meditation, very grounding', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-08', 20, 'Streak: 8 days!', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-10', 20, 'Missed yesterday but back on track', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-12', 20, 'Visualisation meditation today', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-13', 15, 'Busy day, quick session', 'okay'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-14', 20, 'Valentine''s day, peaceful morning', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-15', 20, 'Noticing less reactivity this week', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-17', 20, 'Loving kindness meditation', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-18', 20, 'Felt deep stillness today', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-20', 15, 'Travel day, meditated in airport', 'okay'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-22', 20, 'Back home, great session', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-24', 20, 'Box breathing for stress relief', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-25', 20, '30 day streak broken, but strong month', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-26', 20, 'Getting comfortable with silence', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-27', 20, 'One of the best sessions this month', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-02-28', 20, 'Month complete! 22 sessions. Proud.', 'great'),
  -- Occasional after archiving
  ('a1000000-0000-0000-0000-000000000002', '2026-03-15', 20, 'Quick morning session', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-04-08', 15, 'Stressful week, needed this', 'good'),
  ('a1000000-0000-0000-0000-000000000002', '2026-05-25', 20, 'Back to meditation, missed it', 'great'),
  ('a1000000-0000-0000-0000-000000000002', '2026-06-03', 20, 'Morning routine restored', 'great');

-- ============================================================
-- SKILL LOGS — Guitar (Mar 2026, 14 sessions)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000003', '2026-03-01', 30, 'Dusted off the guitar, fingers hurt!', 'hard'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-03', 30, 'G, C, D chords practice', 'okay'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-05', 45, 'Em and Am chords, getting smoother', 'good'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-07', 45, 'First full song: Wonderwall!', 'great'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-10', 30, 'Fingerpicking intro, tough', 'hard'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-12', 45, 'Travis picking pattern clicking', 'good'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-14', 30, 'Played for family, great feeling!', 'great'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-17', 45, 'Learning Blackbird intro', 'okay'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-19', 60, 'Breakthrough on Blackbird!', 'great'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-21', 45, 'Barre chords F — the nemesis', 'hard'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-24', 45, 'F chord is slowly getting there', 'okay'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-26', 45, 'Solid session, playing feels natural now', 'good'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-28', 60, 'Played 3 full songs without stopping!', 'great'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-31', 45, 'Month wrap-up, recorded a video', 'great'),
  -- Occasional after archiving
  ('a1000000-0000-0000-0000-000000000003', '2026-04-20', 30, 'Quick jam, kept the rust away', 'good'),
  ('a1000000-0000-0000-0000-000000000003', '2026-05-12', 30, 'Played some chords, relaxing', 'good');

-- ============================================================
-- SKILL LOGS — Swimming (Apr 2026, 10 sessions)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000004', '2026-04-02', 45, 'First pool session, 20 laps done', 'good'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-05', 45, 'Freestyle form improving', 'good'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-08', 60, '30 laps! Hit the target', 'great'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-11', 45, 'Breaststroke practice, legs tired', 'okay'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-14', 60, 'Mixed strokes session, 35 laps', 'great'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-17', 30, 'Short session, gym was crowded', 'okay'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-20', 60, 'Personal best: 40 laps in one go!', 'great'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-23', 45, 'Recovery swim, easy pace', 'good'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-26', 60, 'Endurance swim, 45 laps', 'great'),
  ('a1000000-0000-0000-0000-000000000004', '2026-04-30', 45, 'Last session of the month, great progress', 'great');

-- ============================================================
-- SKILL LOGS — Spanish (May 2026, 26 sessions)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000005', '2026-05-01', 20, 'Duolingo streak started!', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-02', 20, 'Basic greetings and numbers', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-03', 30, 'Conjugation is tricky but fun', 'okay'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-04', 20, 'Colors and food vocabulary', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-05', 25, 'Watched El Casa de Papel with subs', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-06', 20, 'Travel phrases practice', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-07', 20, 'Week 1 done! Feeling confident', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-08', 30, 'Verb tenses — present tense review', 'okay'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-09', 20, 'Daily Duolingo + Anki cards', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-10', 25, 'Had a short convo with a native speaker!', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-12', 20, 'Missed yesterday, back on track', 'okay'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-13', 30, 'Past tense (preterite) — hard!', 'hard'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-14', 20, 'Review day, feeling better about preterite', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-15', 20, '15 day streak!', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-16', 30, 'Imperfect vs preterite — confusing', 'hard'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-17', 20, 'Watched 1 Spanish YouTube video', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-19', 25, 'Conversation practice app', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-20', 20, 'Songs in Spanish — great method!', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-21', 30, 'Writing practice — short journal entry', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-22', 20, 'Quick Duolingo session', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-23', 25, 'Subjunctive mood — nightmare! 😅', 'hard'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-25', 20, 'Review of all verb tenses', 'okay'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-26', 30, '30-min live class on iTalki', 'great'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-27', 20, 'Maintained streak!', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-29', 25, 'Reading a simple Spanish article', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-05-31', 30, 'Month end — 26 sessions, best month!', 'great'),
  -- Occasional after archiving
  ('a1000000-0000-0000-0000-000000000005', '2026-06-10', 20, 'Keeping up Duolingo streak', 'good'),
  ('a1000000-0000-0000-0000-000000000005', '2026-06-20', 20, 'Quick vocab review', 'okay');

-- ============================================================
-- SKILL LOGS — Boxing (Jun 2026 = CURRENT FOCUS, 14 sessions so far)
-- ============================================================
INSERT INTO skill_logs (skill_id, date, duration_minutes, notes, mood) VALUES
  ('a1000000-0000-0000-0000-000000000006', '2026-06-01', 45, 'First boxing class, learned stance and jab', 'good'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-03', 45, 'Jab-cross combo, arms sore!', 'hard'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-05', 60, 'Bag work: 5 x 3min rounds', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-07', 45, 'Footwork drills, much harder than it looks', 'hard'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-09', 60, 'Jab-cross-hook combo clicking!', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-11', 45, 'Defence practice — slipping and rolling', 'okay'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-13', 60, 'First light sparring session!', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-15', 45, 'Conditioning circuits — brutal', 'hard'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-17', 60, 'Pad work with trainer, sharp combinations', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-19', 45, 'Solo bag session, working on speed', 'good'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-21', 60, 'Sparring round 2, held my own!', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-23', 45, 'Power shots on heavy bag', 'good'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-25', 60, 'Full class: warmup + combos + sparring', 'great'),
  ('a1000000-0000-0000-0000-000000000006', '2026-06-27', 45, 'Intense sparring, felt strong today', 'great');

