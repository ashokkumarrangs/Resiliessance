-- 1. Create inventory_locations table for the hierarchy
CREATE TABLE IF NOT EXISTS public.inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
    icon TEXT, -- Emoji icon
    type TEXT DEFAULT 'other', -- city, building, room, furniture, compartment, other
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_id UUID REFERENCES public.inventory_locations(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    category TEXT,
    tags TEXT[],
    notes TEXT,
    
    -- Origin
    origin_type TEXT CHECK (origin_type IN ('bought', 'gifted_in', 'borrowed')),
    origin_person TEXT,
    acquired_date DATE,
    purchase_price DECIMAL,
    
    -- Condition
    condition TEXT DEFAULT 'good', -- new, good, fair, poor
    
    -- Status & Lending
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lent_out', 'retired')),
    lent_to_person TEXT,
    lent_date DATE,
    return_due_date DATE,
    
    -- Retirement
    retired_reason TEXT CHECK (retired_reason IN ('worn_out', 'gifted_out', 'lost', 'stolen', 'sold', 'returned')),
    retired_at TIMESTAMPTZ,
    retired_to_person TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Disable RLS for simplicity (Fixes "violates row-level security" errors)
ALTER TABLE public.inventory_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;

-- 4. Enable Realtime Safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_locations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_locations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
  END IF;
END $$;


