BEGIN;

-- Usage exports: durable async chunk artifacts + hot-path indexes
-- Purpose:
-- 1) Persist chunked usage export artifacts for bounded async delivery.
-- 2) Add index support for keyset export scans and usage summary windows.

CREATE TABLE IF NOT EXISTS public.usage_export_chunks (
  export_id uuid NOT NULL REFERENCES public.exports(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  billing_account_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  row_count integer NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT usage_export_chunks_pkey PRIMARY KEY (export_id, chunk_index),
  CONSTRAINT usage_export_chunks_chunk_index_nonnegative CHECK (chunk_index >= 0),
  CONSTRAINT usage_export_chunks_row_count_nonnegative CHECK (row_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_usage_export_chunks_tenant_created
ON public.usage_export_chunks (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_export_chunks_billing_created
ON public.usage_export_chunks (billing_account_id, created_at DESC);

-- Keep updated_at current for retries/chunk rewrites.
CREATE OR REPLACE FUNCTION public.set_usage_export_chunks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS usage_export_chunks_set_updated_at
ON public.usage_export_chunks;

CREATE TRIGGER usage_export_chunks_set_updated_at
BEFORE UPDATE ON public.usage_export_chunks
FOR EACH ROW
EXECUTE FUNCTION public.set_usage_export_chunks_updated_at();

-- Hot-path export/summarization index for usage_events with schema-variant support.
DO $$
DECLARE
  has_snake boolean;
  has_camel boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usage_events'
      AND column_name = 'billing_account_id'
  ) INTO has_snake;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usage_events'
      AND column_name = 'billingAccountId'
  ) INTO has_camel;

  IF has_snake THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_usage_events_billing_timestamp_id_desc
      ON public.usage_events (billing_account_id, "timestamp" DESC, id DESC)
    ';
  ELSIF has_camel THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_usage_events_billing_timestamp_id_desc
      ON public.usage_events ("billingAccountId", "timestamp" DESC, id DESC)
    ';
  END IF;
END;
$$;

-- Usage-export job lookup index for queue/status polling.
DO $$
DECLARE
  has_snake boolean;
  has_camel boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exports'
      AND column_name = 'tenant_id'
  ) INTO has_snake;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exports'
      AND column_name = 'tenantId'
  ) INTO has_camel;

  IF has_snake THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_exports_usage_jobs_lookup
      ON public.exports (tenant_id, user_id, status, created_at DESC)
      WHERE format = ''usage_events''
    ';
  ELSIF has_camel THEN
    EXECUTE '
      CREATE INDEX IF NOT EXISTS idx_exports_usage_jobs_lookup
      ON public.exports ("tenantId", "userId", status, "createdAt" DESC)
      WHERE format = ''usage_events''
    ';
  END IF;
END;
$$;

COMMIT;
