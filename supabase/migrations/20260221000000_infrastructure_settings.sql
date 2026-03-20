-- =================================================================================
-- Database Concurrency, Pooling & Infrastructure Constraints
-- =================================================================================

-- 1. Operator Infrastructure Settings (Dynamic Control Plane)
CREATE TABLE IF NOT EXISTS public.operator_infrastructure_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    max_statement_timeout_ms INT NOT NULL DEFAULT 10000, -- Kills runaway queries
    max_worker_concurrency INT NOT NULL DEFAULT 10,      -- Limits background job throughput
    maintenance_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

INSERT INTO public.operator_infrastructure_settings (id)
VALUES ('global') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.operator_infrastructure_settings ENABLE ROW LEVEL SECURITY;

-- Only operators/admins can read or modify infra settings
CREATE POLICY infra_settings_operator_access ON public.operator_infrastructure_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = current_setting('app.current_user_id', true)::uuid
            AND users.role = 'operator'
        )
    );

-- Allow service_role bypass for background workers
CREATE POLICY infra_settings_service_bypass ON public.operator_infrastructure_settings
    FOR ALL USING (current_user = 'service_role');

-- 2. Secure View for Connection Pool Visibility
-- Wraps pg_stat_activity so operators can see connection metrics without needing raw superuser
CREATE OR REPLACE VIEW public.vw_connection_pool_stats AS
SELECT
    state,
    wait_event_type IS NOT NULL as is_waiting,
    count(*) as count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type IS NOT NULL;

-- Grant read access to authenticated API users (enforced via API route authorization)
GRANT SELECT ON public.vw_connection_pool_stats TO authenticated;
