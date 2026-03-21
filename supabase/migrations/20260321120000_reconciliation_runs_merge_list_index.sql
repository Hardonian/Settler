BEGIN;

-- Supports merged console/API list pagination ordered by GREATEST(started_at, created_at) DESC, id DESC per tenant.
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_greatest_started_created
ON public.reconciliation_runs (
  tenant_id,
  (GREATEST(started_at, created_at)) DESC NULLS LAST,
  id DESC
);

COMMIT;
