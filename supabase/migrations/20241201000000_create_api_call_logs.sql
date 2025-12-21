-- Create API Call Logs table for developer console observability
-- Tracks all API requests made by tenants for debugging and analytics

CREATE TABLE IF NOT EXISTS api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  api_key_id UUID, -- References api_keys table if exists
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE, etc.
  path TEXT NOT NULL, -- API endpoint path
  status_code INTEGER NOT NULL, -- HTTP status code
  response_time INTEGER NOT NULL, -- Response time in milliseconds
  headers JSONB, -- Request headers (sanitized)
  query JSONB, -- Query parameters
  body JSONB, -- Request body (sanitized)
  response_body JSONB, -- Response body (sanitized)
  error TEXT, -- Error message if request failed
  user_agent TEXT, -- User agent string
  ip_address TEXT, -- IP address (redacted for privacy)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_call_logs_tenant_id ON api_call_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_user_id ON api_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created_at ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_method ON api_call_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_status_code ON api_call_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_tenant_created ON api_call_logs(tenant_id, created_at DESC);

-- RLS Policies
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for their own tenant
CREATE POLICY "Users can view their tenant's API logs"
  ON api_call_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert logs (for API middleware)
CREATE POLICY "Service role can insert API logs"
  ON api_call_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Policy: Super admins can view all logs
CREATE POLICY "Super admins can view all API logs"
  ON api_call_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE user_id = auth.uid()
      AND (metadata->>'role')::text = 'SUPER_ADMIN'
    )
    OR auth.jwt()->>'email' LIKE '%@settler.dev'
  );

-- Add comment
COMMENT ON TABLE api_call_logs IS 'Logs all API calls made to Settler APIs for developer observability and debugging. PII is sanitized before storage.';
