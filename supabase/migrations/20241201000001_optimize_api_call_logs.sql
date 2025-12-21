-- Optimize API Call Logs table for performance
-- Add additional indexes and optimize queries

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_api_call_logs_tenant_status_created 
ON api_call_logs(tenant_id, status_code, created_at DESC);

-- Add index for method + path queries
CREATE INDEX IF NOT EXISTS idx_api_call_logs_method_path 
ON api_call_logs(method, path);

-- Add index for error tracking
CREATE INDEX IF NOT EXISTS idx_api_call_logs_errors 
ON api_call_logs(tenant_id, created_at DESC) 
WHERE error IS NOT NULL;

-- Add index for response time analysis
CREATE INDEX IF NOT EXISTS idx_api_call_logs_response_time 
ON api_call_logs(tenant_id, response_time, created_at DESC);

-- Add partial index for recent logs (most queries are for recent data)
CREATE INDEX IF NOT EXISTS idx_api_call_logs_recent 
ON api_call_logs(tenant_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Optimize table statistics
ANALYZE api_call_logs;

-- Add comment
COMMENT ON INDEX idx_api_call_logs_tenant_status_created IS 'Composite index for filtering by tenant, status, and date';
COMMENT ON INDEX idx_api_call_logs_method_path IS 'Index for filtering by HTTP method and path';
COMMENT ON INDEX idx_api_call_logs_errors IS 'Partial index for error tracking queries';
COMMENT ON INDEX idx_api_call_logs_response_time IS 'Index for performance analysis queries';
COMMENT ON INDEX idx_api_call_logs_recent IS 'Partial index for recent logs (last 7 days)';
