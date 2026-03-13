-- Final consolidated reconciliation patch for preview/staging environments.
-- Scope: only additive, guarded changes derived from committed Supabase migration intent.
-- Safe to run multiple times.

-- Ensure required extension for UUID defaults in this patch.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 20260218000000_red_team_security_controls.sql intent
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_notarization_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_at timestamptz NOT NULL DEFAULT now(),
  audit_row_count bigint NOT NULL,
  checkpoint_hash text NOT NULL,
  source_window text NOT NULL DEFAULT 'latest_5000',
  created_by text NOT NULL DEFAULT current_user
);

CREATE OR REPLACE FUNCTION public.compute_audit_notarization_hash(max_rows integer DEFAULT 5000)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  computed_hash text;
BEGIN
  IF max_rows < 1 THEN
    max_rows := 1;
  END IF;

  IF to_regclass('public.audit_logs') IS NULL THEN
    RETURN md5('');
  END IF;

  SELECT md5(COALESCE(string_agg(to_jsonb(a)::text, '|' ORDER BY a.id::text), ''))
  INTO computed_hash
  FROM (
    SELECT *
    FROM public.audit_logs
    ORDER BY id DESC
    LIMIT max_rows
  ) a;

  RETURN computed_hash;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.write_audit_notarization_checkpoint(max_rows integer DEFAULT 5000)
RETURNS public.audit_notarization_checkpoints
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $fn$
DECLARE
  inserted_row public.audit_notarization_checkpoints;
  audit_count bigint;
  hash_value text;
BEGIN
  IF to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'public.audit_logs is required for notarization checkpoints';
  END IF;

  SELECT COUNT(*) INTO audit_count FROM public.audit_logs;
  hash_value := public.compute_audit_notarization_hash(max_rows);

  INSERT INTO public.audit_notarization_checkpoints (
    audit_row_count,
    checkpoint_hash,
    source_window
  ) VALUES (
    audit_count,
    hash_value,
    format('latest_%s', max_rows)
  )
  RETURNING * INTO inserted_row;

  RETURN inserted_row;
END;
$fn$;

DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION public.block_audit_log_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      RAISE EXCEPTION 'audit_logs is append-only and cannot be %', TG_OP
        USING ERRCODE = '42501';
    END;
    $fn$;

    DROP TRIGGER IF EXISTS trg_block_audit_log_updates ON public.audit_logs;
    CREATE TRIGGER trg_block_audit_log_updates
      BEFORE UPDATE OR DELETE ON public.audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.block_audit_log_mutation();

    REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
  END IF;
END $$;

-- ============================================================================
-- 20260310000000_system_incidents.sql intent
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  tenant_id UUID,
  run_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  linked_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_incidents_created_at ON public.system_incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_tenant ON public.system_incidents(tenant_id);

