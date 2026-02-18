-- Red-team security hardening controls
-- 1) Append-only audit logs enforcement
-- 2) Audit notarization checkpoints

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
  ) THEN
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
  END IF;
END $$;

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

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;

COMMIT;
