-- ARTHA HABIT RULES MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor if you already have the Artha tables.

DO $$ 
BEGIN 
    -- 1. Add Condition & Goal Columns to habit_config
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='condition_type') THEN
        ALTER TABLE public.habit_config ADD COLUMN condition_type TEXT DEFAULT 'at_least_n';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='direction') THEN
        ALTER TABLE public.habit_config ADD COLUMN direction TEXT DEFAULT 'more';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='target_value') THEN
        ALTER TABLE public.habit_config ADD COLUMN target_value DECIMAL DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='suc_min') THEN
        ALTER TABLE public.habit_config ADD COLUMN suc_min DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='suc_max') THEN
        ALTER TABLE public.habit_config ADD COLUMN suc_max DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='tol_min') THEN
        ALTER TABLE public.habit_config ADD COLUMN tol_min DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='tol_max') THEN
        ALTER TABLE public.habit_config ADD COLUMN tol_max DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='crit_min') THEN
        ALTER TABLE public.habit_config ADD COLUMN crit_min DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='crit_max') THEN
        ALTER TABLE public.habit_config ADD COLUMN crit_max DECIMAL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='grace_days') THEN
        ALTER TABLE public.habit_config ADD COLUMN grace_days INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='soft_grace_days') THEN
        ALTER TABLE public.habit_config ADD COLUMN soft_grace_days INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='escalation_days') THEN
        ALTER TABLE public.habit_config ADD COLUMN escalation_days INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='habit_config' AND column_name='tol_cap_days') THEN
        ALTER TABLE public.habit_config ADD COLUMN tol_cap_days INTEGER DEFAULT 0;
    END IF;

    -- 2. Safely Update Realtime Publication
    -- First, check if the publication 'supabase_realtime' exists (it usually does in Supabase)
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        
        -- Add 'habit_config' if not there
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_config') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_config;
        END IF;

        -- Ensure other core tables are there too (idempotent check)
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_data') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_data;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'liquidity') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.liquidity;
        END IF;

    END IF;

END $$;
