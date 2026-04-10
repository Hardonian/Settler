-- Venture invoice nudger (reconciliation-aware late-invoice workflow)

CREATE TABLE IF NOT EXISTS public.venture_invoice_nudge_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  created_by uuid,
  status text NOT NULL DEFAULT 'pending',
  min_days_overdue int NOT NULL,
  lookback_days int NOT NULL,
  execute_mode boolean NOT NULL DEFAULT false,
  total_scanned int NOT NULL DEFAULT 0,
  total_nudged int NOT NULL DEFAULT 0,
  total_suppressed int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT venture_invoice_nudge_runs_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_venture_invoice_nudge_runs_tenant_created
  ON public.venture_invoice_nudge_runs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_venture_invoice_nudge_runs_status
  ON public.venture_invoice_nudge_runs(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.venture_invoice_nudge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  invoice_id uuid,
  external_id text NOT NULL,
  invoice_number text,
  customer_id text,
  customer_name text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL,
  due_date date,
  action text NOT NULL,
  reason text NOT NULL,
  has_payment_signal boolean NOT NULL DEFAULT false,
  has_recon_signal boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venture_invoice_nudge_items_run_fkey
    FOREIGN KEY (run_id) REFERENCES public.venture_invoice_nudge_runs(id) ON DELETE CASCADE,
  CONSTRAINT venture_invoice_nudge_items_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT venture_invoice_nudge_items_invoice_fkey
    FOREIGN KEY (invoice_id) REFERENCES public.financial_invoices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_venture_invoice_nudge_items_run
  ON public.venture_invoice_nudge_items(run_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_venture_invoice_nudge_items_tenant_action
  ON public.venture_invoice_nudge_items(tenant_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_venture_invoice_nudge_items_tenant_invoice
  ON public.venture_invoice_nudge_items(tenant_id, external_id);

ALTER TABLE public.venture_invoice_nudge_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venture_invoice_nudge_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venture_invoice_nudge_runs_tenant_isolation ON public.venture_invoice_nudge_runs;
CREATE POLICY venture_invoice_nudge_runs_tenant_isolation
  ON public.venture_invoice_nudge_runs
  USING (tenant_id = ANY (ARRAY(SELECT get_user_tenant_ids())));

DROP POLICY IF EXISTS venture_invoice_nudge_items_tenant_isolation ON public.venture_invoice_nudge_items;
CREATE POLICY venture_invoice_nudge_items_tenant_isolation
  ON public.venture_invoice_nudge_items
  USING (tenant_id = ANY (ARRAY(SELECT get_user_tenant_ids())));
