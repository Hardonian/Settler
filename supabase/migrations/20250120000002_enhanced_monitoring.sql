-- Enhanced Monitoring: Retry Queue, Alerts, and Metrics Support

-- Retry Queue Table
CREATE TABLE IF NOT EXISTS public.retry_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  sync_run_id uuid NOT NULL,
  attempt_count int4 NOT NULL DEFAULT 1,
  max_attempts int4 NOT NULL DEFAULT 5,
  next_retry_at timestamptz NOT NULL,
  error_message text NOT NULL,
  error_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT retry_queue_connector_fk FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE CASCADE,
  CONSTRAINT retry_queue_sync_run_fk FOREIGN KEY (sync_run_id) REFERENCES public.sync_runs(id) ON DELETE CASCADE
);

-- Connector Alerts Table
CREATE TABLE IF NOT EXISTS public.connector_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  message text NOT NULL,
  error_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT connector_alerts_connector_fk FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON DELETE CASCADE
);

-- Indexes for retry queue
CREATE INDEX IF NOT EXISTS idx_retry_queue_status_next_retry ON public.retry_queue(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_retry_queue_connector_tenant ON public.retry_queue(connector_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_retry_queue_sync_run ON public.retry_queue(sync_run_id);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_connector_alerts_active ON public.connector_alerts(connector_id, tenant_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_connector_alerts_severity ON public.connector_alerts(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_connector_alerts_tenant ON public.connector_alerts(tenant_id, created_at);

-- RLS Policies for retry_queue
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS retry_queue_select_tenant ON public.retry_queue;
CREATE POLICY retry_queue_select_tenant ON public.retry_queue
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS retry_queue_insert_tenant ON public.retry_queue;
CREATE POLICY retry_queue_insert_tenant ON public.retry_queue
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS retry_queue_update_tenant ON public.retry_queue;
CREATE POLICY retry_queue_update_tenant ON public.retry_queue
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- RLS Policies for connector_alerts
ALTER TABLE public.connector_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS connector_alerts_select_tenant ON public.connector_alerts;
CREATE POLICY connector_alerts_select_tenant ON public.connector_alerts
  FOR SELECT
  USING (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_alerts_insert_tenant ON public.connector_alerts;
CREATE POLICY connector_alerts_insert_tenant ON public.connector_alerts
  FOR INSERT
  WITH CHECK (tenant_id = ANY(get_user_tenant_ids()));

DROP POLICY IF EXISTS connector_alerts_update_tenant ON public.connector_alerts;
CREATE POLICY connector_alerts_update_tenant ON public.connector_alerts
  FOR UPDATE
  USING (tenant_id = ANY(get_user_tenant_ids()));

-- Update triggers
CREATE TRIGGER update_retry_queue_updated_at
  BEFORE UPDATE ON public.retry_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_alerts_updated_at
  BEFORE UPDATE ON public.connector_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
