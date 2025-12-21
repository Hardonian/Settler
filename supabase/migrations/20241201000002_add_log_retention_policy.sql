-- Add log retention policy
-- Automatically delete logs older than 90 days to manage storage

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete logs older than 90 days
  DELETE FROM api_call_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Log cleanup
  RAISE NOTICE 'Cleaned up old API logs';
END;
$$;

-- Create scheduled job (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled
-- Run manually or via cron job if pg_cron is not available
-- SELECT cron.schedule('cleanup-api-logs', '0 2 * * *', 'SELECT cleanup_old_api_logs()');

-- Add comment
COMMENT ON FUNCTION cleanup_old_api_logs IS 'Cleans up API logs older than 90 days';

-- Manual cleanup can be triggered with:
-- SELECT cleanup_old_api_logs();
