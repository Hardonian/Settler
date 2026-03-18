-- =================================================================================
-- Authentication & Tenant Isolation: Boundary RLS & Compound Keys
-- =================================================================================

-- 1. Prevent Cross-Tenant Idempotency Key Collisions
-- A single unique 'key' across the entire database is a severe multi-tenant vulnerability.
-- We must enforce compound uniqueness: (tenant_id, key)
ALTER TABLE public.idempotency_keys DROP CONSTRAINT IF EXISTS idempotency_keys_pkey;
ALTER TABLE public.idempotency_keys ADD PRIMARY KEY (tenant_id, key);

-- 2. Enable Defense-in-Depth Row Level Security (RLS)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_dlq ENABLE ROW LEVEL SECURITY;

-- 3. Strict Tenant Isolation Policies
CREATE POLICY tenant_isolation_idempotency_keys ON public.idempotency_keys
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DLQ requires special handling because malformed webhooks might lack a valid tenant_id
CREATE POLICY tenant_isolation_ingestion_dlq ON public.ingestion_dlq
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        OR tenant_id IS NULL
    );

-- 4. Service Role Bypasses for Background Workers
CREATE POLICY service_role_bypass_dlq ON public.ingestion_dlq FOR ALL USING (current_user = 'service_role');
CREATE POLICY service_role_bypass_idempotency ON public.idempotency_keys FOR ALL USING (current_user = 'service_role');
