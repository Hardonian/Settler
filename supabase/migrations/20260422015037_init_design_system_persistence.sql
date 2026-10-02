-- Recovered from the live database's supabase_migrations.schema_migrations
-- (version 20260422015037, name "init_design_system_persistence") on 2026-10-02. This migration was applied
-- via the Supabase migrations UI and existed only in database bookkeeping;
-- recorded here so the repository holds the full schema history.

-- Design System Persistence Layer
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tokens JSONB NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.interaction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Placeholder for actual Auth integration)
CREATE POLICY "Allow authenticated users to manage their themes" ON public.themes
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to log events" ON public.interaction_events
    FOR INSERT WITH CHECK (true);
