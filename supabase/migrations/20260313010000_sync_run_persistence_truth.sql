-- Sync durability truth fields for connector persistence outcomes.
ALTER TABLE public.sync_runs
  ADD COLUMN IF NOT EXISTS persistence_status text,
  ADD COLUMN IF NOT EXISTS recovery_required boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sync_runs_persistence_status_check'
      AND conrelid = 'public.sync_runs'::regclass
  ) THEN
    ALTER TABLE public.sync_runs
      ADD CONSTRAINT sync_runs_persistence_status_check
      CHECK (
        persistence_status IS NULL
        OR persistence_status IN ('durable_atomic', 'durable_non_atomic', 'failed_partial')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sync_runs_persistence_status
  ON public.sync_runs USING btree (persistence_status)
  WHERE persistence_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_runs_recovery_required
  ON public.sync_runs USING btree (recovery_required)
  WHERE recovery_required = true;
