-- =================================================================================
-- Ingestion Hardening: Idempotency & Dead Letter Queue (DLQ)
-- =================================================================================

-- 1. Idempotency Keys (24-hour durability for safe webhook retries)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    response JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_tenant ON public.idempotency_keys(tenant_id);

-- 2. Ingestion Dead Letter Queue (Visibility into signature mismatches & malformed payloads)
CREATE TABLE IF NOT EXISTS public.ingestion_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- Nullable if the tenant couldn't be parsed due to severe malformation
    source VARCHAR(255) NOT NULL,
    payload TEXT,
    headers JSONB,
    error_reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingestion_dlq_tenant ON public.ingestion_dlq(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_dlq_created ON public.ingestion_dlq(created_at DESC);
