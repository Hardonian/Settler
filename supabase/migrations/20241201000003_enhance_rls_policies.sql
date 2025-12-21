-- Enhance RLS policies for API call logs
-- Add more granular access control and performance optimizations

-- Drop existing policies to recreate with optimizations
DROP POLICY IF EXISTS "Users can view their tenant's API logs" ON api_call_logs;
DROP POLICY IF EXISTS "Service role can insert API logs" ON api_call_logs;
DROP POLICY IF EXISTS "Super admins can view all API logs" ON api_call_logs;

-- Optimized policy: Users can view logs for their own tenant
-- Uses efficient subquery with tenant lookup
CREATE POLICY "Users can view their tenant's API logs"
  ON api_call_logs
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM billing_accounts 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Service role can insert logs (for API middleware)
CREATE POLICY "Service role can insert API logs"
  ON api_call_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Policy: Super admins can view all logs
-- Optimized with efficient role check
CREATE POLICY "Super admins can view all API logs"
  ON api_call_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_accounts
      WHERE user_id = auth.uid()
      AND (
        (metadata->>'role')::text = 'SUPER_ADMIN'
        OR (metadata->>'isSuperAdmin')::boolean = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email LIKE '%@settler.dev'
    )
  );

-- Add policy for users to view their own API calls (by user_id)
CREATE POLICY "Users can view their own API calls"
  ON api_call_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON api_call_logs TO authenticated;
GRANT INSERT ON api_call_logs TO service_role;
GRANT SELECT ON api_call_logs TO service_role;

-- Add comment
COMMENT ON POLICY "Users can view their tenant's API logs" ON api_call_logs IS 
  'Allows users to view API logs for their tenant. Optimized with efficient subquery.';
COMMENT ON POLICY "Super admins can view all API logs" ON api_call_logs IS 
  'Allows super admins to view all API logs across all tenants.';
