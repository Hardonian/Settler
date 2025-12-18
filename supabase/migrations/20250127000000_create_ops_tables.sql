-- Create ops_* tables for Founder Ops Command Center
-- These tables store operational data for monitoring and management

-- Ops Errors Table
CREATE TABLE IF NOT EXISTS ops_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  route VARCHAR(500),
  user_id UUID,
  organization_id UUID,
  request_id VARCHAR(255),
  user_agent TEXT,
  severity VARCHAR(50) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_errors_created_at ON ops_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_errors_severity ON ops_errors(severity);
CREATE INDEX IF NOT EXISTS idx_ops_errors_resolved ON ops_errors(resolved);
CREATE INDEX IF NOT EXISTS idx_ops_errors_route ON ops_errors(route);

-- Ops Jobs Table
CREATE TABLE IF NOT EXISTS ops_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payload JSONB,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_jobs_status ON ops_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ops_jobs_scheduled_at ON ops_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ops_jobs_job_type ON ops_jobs(job_type);

-- Ops Webhooks Table
CREATE TABLE IF NOT EXISTS ops_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_webhooks_status ON ops_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_ops_webhooks_event_type ON ops_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_ops_webhooks_created_at ON ops_webhooks(created_at DESC);

-- Ops Usage Aggregates Table (daily aggregates)
CREATE TABLE IF NOT EXISTS ops_usage_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID,
  user_id UUID,
  endpoint VARCHAR(255),
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, organization_id, user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_date ON ops_usage_aggregates(date DESC);
CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_org ON ops_usage_aggregates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ops_usage_aggregates_user ON ops_usage_aggregates(user_id);

-- Ops Support Tickets Table
CREATE TABLE IF NOT EXISTS ops_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category VARCHAR(255),
  triage_result JSONB,
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  context JSONB, -- Auto-captured context (route, request_id, UA, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_status ON ops_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_user ON ops_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_org ON ops_support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_created_at ON ops_support_tickets(created_at DESC);

-- Ops Audit Log Table
CREATE TABLE IF NOT EXISTS ops_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(255),
  resource_id UUID,
  user_id UUID,
  organization_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_action ON ops_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_user ON ops_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_audit_logs_created_at ON ops_audit_logs(created_at DESC);

-- RLS Policies (admin-only access)
ALTER TABLE ops_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can access ops tables
-- Note: This assumes you have a function to check if user is super admin
CREATE POLICY ops_errors_admin_only ON ops_errors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
  );

CREATE POLICY ops_jobs_admin_only ON ops_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
  );

CREATE POLICY ops_webhooks_admin_only ON ops_webhooks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
  );

CREATE POLICY ops_usage_aggregates_admin_only ON ops_usage_aggregates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
  );

CREATE POLICY ops_support_tickets_admin_only ON ops_support_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
    OR user_id = auth.uid() -- Users can view their own tickets
  );

CREATE POLICY ops_audit_logs_admin_only ON ops_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.user_id = auth.uid()
      AND (ba.metadata->>'role')::text = 'SUPER_ADMIN'
    )
  );

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  ticket_num VARCHAR(50);
BEGIN
  ticket_num := 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_sequence')::text, 6, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ops_support_tickets_set_number
  BEFORE INSERT ON ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ops_errors_updated_at
  BEFORE UPDATE ON ops_errors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_jobs_updated_at
  BEFORE UPDATE ON ops_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_webhooks_updated_at
  BEFORE UPDATE ON ops_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_usage_aggregates_updated_at
  BEFORE UPDATE ON ops_usage_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ops_support_tickets_updated_at
  BEFORE UPDATE ON ops_support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
