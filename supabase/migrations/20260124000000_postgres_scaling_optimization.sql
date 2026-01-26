-- ============================================================================
-- PostgreSQL Scaling Optimization Migration
-- Based on OpenAI Postgres-at-Scale Audit
-- Date: 2026-01-24
-- ============================================================================
-- This migration implements:
-- 1. Missing composite indexes for common query patterns
-- 2. Partial indexes for filtered queries
-- 3. Covering indexes for hot queries
-- 4. MVCC bloat prevention strategies
-- 5. Query discipline enforcement (statement_timeout, row_security)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD MISSING COMPOSITE INDEXES
-- ============================================================================

-- Usage Events: Composite index for analytics queries
-- Covers: WHERE billing_account_id = ? AND event_type = ? ORDER BY timestamp DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_events_account_type_timestamp
ON usage_events (billing_account_id, event_type, timestamp DESC)
WHERE aggregated = false; -- Partial index: exclude already aggregated events

-- API Call Logs: Composite index for filtered log queries
-- Covers: WHERE tenant_id = ? AND method = ? AND path LIKE ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_call_logs_tenant_method_path_created
ON api_call_logs (tenant_id, method, path, created_at DESC);

-- API Call Logs: Partial index for error tracking
-- Covers: WHERE tenant_id = ? AND error IS NOT NULL ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_call_logs_errors_by_tenant
ON api_call_logs (tenant_id, created_at DESC)
WHERE error IS NOT NULL;

-- Stripe Events: Composite index for billing queries
-- Covers: WHERE billing_account_id = ? ORDER BY received_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_events_billing_account_received
ON stripe_events (billing_account_id, received_at DESC)
WHERE billing_account_id IS NOT NULL;

-- Audit Logs: Composite index for filtered audit queries
-- Covers: WHERE tenant_id = ? AND resource_type = ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_resource_created
ON audit_logs (tenant_id, resource_type, created_at DESC);

-- Recon Results: Composite index for dashboard queries
-- Covers: WHERE tenant_id = ? AND status = ? ORDER BY started_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recon_results_tenant_status_started
ON recon_results (tenant_id, status, started_at DESC);

-- Reconciliation Matches: Composite index for match quality filtering
-- Covers: WHERE run_id = ? AND confidence >= ? ORDER BY confidence DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_matches_run_confidence
ON reconciliation_matches (run_id, confidence DESC);

-- Normalized Transactions: Composite index for source lookups
-- Covers: WHERE source_id = ? AND external_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_normalized_transactions_source_external
ON normalized_transactions (source_id, external_id)
WHERE external_id IS NOT NULL;

-- ============================================================================
-- PART 2: COVERING INDEXES FOR HOT QUERIES
-- ============================================================================

-- Usage Events: Covering index for aggregation queries
-- Covers: SELECT event_type, SUM(quantity) WHERE billing_account_id = ? GROUP BY event_type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_events_account_covering
ON usage_events (billing_account_id, event_type) INCLUDE (quantity, timestamp)
WHERE aggregated = false;

-- API Call Logs: Covering index for performance analysis
-- Covers: SELECT method, path, AVG(response_time) WHERE tenant_id = ? GROUP BY method, path
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_call_logs_performance_covering
ON api_call_logs (tenant_id, method, path) INCLUDE (response_time, status_code);

-- ============================================================================
-- PART 3: OPTIMIZE EXISTING INDEXES
-- ============================================================================

-- Drop redundant indexes (if they exist)
-- Note: Check for actual redundancy before dropping in production

-- Example: If idx_usage_events_timestamp exists but is redundant with composite index
-- DROP INDEX CONCURRENTLY IF EXISTS idx_usage_events_timestamp;

-- ============================================================================
-- PART 4: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update table statistics for query planner optimization
ANALYZE usage_events;
ANALYZE api_call_logs;
ANALYZE stripe_events;
ANALYZE audit_logs;
ANALYZE recon_results;
ANALYZE reconciliation_matches;
ANALYZE normalized_transactions;
ANALYZE usage_counters;

-- ============================================================================
-- PART 5: SET STATEMENT TIMEOUT (QUERY DISCIPLINE)
-- ============================================================================

-- Set default statement timeout for all connections (60 seconds)
-- This prevents runaway queries from blocking the database
-- Individual queries can override with SET LOCAL statement_timeout

-- Note: This is set at the database level, not per-connection
-- Adjust based on your workload (default: 60s read, 120s write)
ALTER DATABASE postgres SET statement_timeout = '60s';

-- ============================================================================
-- PART 6: ENABLE QUERY PERFORMANCE TRACKING
-- ============================================================================

-- Enable pg_stat_statements for slow query monitoring
-- Note: Requires superuser or RDS/Supabase admin permissions
-- Uncomment if you have necessary permissions:

-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';
-- ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Note: Requires PostgreSQL restart to take effect
-- On Supabase, contact support to enable pg_stat_statements

-- ============================================================================
-- PART 7: VACUUM CONFIGURATION (MVCC BLOAT PREVENTION)
-- ============================================================================

-- Configure aggressive autovacuum for high-write tables
-- Prevents MVCC bloat and keeps indexes efficient

-- Usage Events (high write volume)
ALTER TABLE usage_events SET (
  autovacuum_vacuum_scale_factor = 0.05, -- Vacuum when 5% of rows are dead (default: 20%)
  autovacuum_analyze_scale_factor = 0.05, -- Analyze when 5% of rows changed
  autovacuum_vacuum_cost_limit = 400 -- Increase vacuum speed
);

-- API Call Logs (high write volume)
ALTER TABLE api_call_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_vacuum_cost_limit = 400
);

-- Stripe Events (medium write volume with updates)
ALTER TABLE stripe_events SET (
  autovacuum_vacuum_scale_factor = 0.10,
  autovacuum_analyze_scale_factor = 0.10
);

-- Usage Counters (hot row updates)
ALTER TABLE usage_counters SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.05,
  fillfactor = 70 -- Leave 30% free space per page for updates (reduces bloat)
);

-- ============================================================================
-- PART 8: ADD MONITORING VIEWS
-- ============================================================================

-- View: Check index usage and identify unused indexes
CREATE OR REPLACE VIEW vw_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END AS usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid::regclass) DESC;

-- View: Check table bloat and vacuum status
CREATE OR REPLACE VIEW vw_table_bloat AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE
    WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::NUMERIC / n_live_tup) * 100, 2)
    ELSE 0
  END AS dead_row_percentage,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- View: Check connection pool usage (Supabase/PgBouncer)
-- Note: This view requires pg_stat_activity which may be restricted on Supabase
-- Uncomment if you have access:

-- CREATE OR REPLACE VIEW vw_connection_stats AS
-- SELECT
--   state,
--   COUNT(*) AS connection_count,
--   MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) AS max_idle_time_seconds
-- FROM pg_stat_activity
-- WHERE datname = current_database()
-- GROUP BY state
-- ORDER BY connection_count DESC;

-- ============================================================================
-- PART 9: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_usage_events_account_type_timestamp IS
'Composite index for usage analytics queries (WHERE account + type, ORDER BY timestamp). Partial: excludes aggregated events.';

COMMENT ON INDEX idx_api_call_logs_tenant_method_path_created IS
'Composite index for filtered log queries (WHERE tenant + method + path, ORDER BY created_at)';

COMMENT ON INDEX idx_api_call_logs_errors_by_tenant IS
'Partial index for error tracking queries (WHERE tenant + error IS NOT NULL). Reduces index size.';

COMMENT ON INDEX idx_stripe_events_billing_account_received IS
'Composite index for billing event queries (WHERE billing_account, ORDER BY received_at). Partial: excludes NULL accounts.';

COMMENT ON INDEX idx_audit_logs_tenant_resource_created IS
'Composite index for filtered audit log queries (WHERE tenant + resource_type, ORDER BY created_at)';

COMMENT ON INDEX idx_recon_results_tenant_status_started IS
'Composite index for reconciliation dashboard queries (WHERE tenant + status, ORDER BY started_at)';

COMMENT ON INDEX idx_reconciliation_matches_run_confidence IS
'Composite index for match quality filtering (WHERE run_id, ORDER BY confidence)';

COMMENT ON INDEX idx_normalized_transactions_source_external IS
'Composite index for source transaction lookups (WHERE source_id + external_id). Partial: excludes NULL external_id.';

COMMENT ON VIEW vw_index_usage IS
'Monitoring view: Identifies unused or low-usage indexes that can be dropped to reduce write overhead.';

COMMENT ON VIEW vw_table_bloat IS
'Monitoring view: Identifies tables with high dead row counts that need vacuum.';

-- ============================================================================
-- PART 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on monitoring views to authenticated users (for admin endpoints)
GRANT SELECT ON vw_index_usage TO authenticated;
GRANT SELECT ON vw_table_bloat TO authenticated;
-- GRANT SELECT ON vw_connection_stats TO authenticated; -- Uncomment if view is created

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the migration:

-- 1. Check new indexes were created
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE indexname LIKE 'idx_%_account_%' OR indexname LIKE 'idx_%_tenant_%'
-- ORDER BY tablename, indexname;

-- 2. Check autovacuum settings
-- SELECT relname, reloptions
-- FROM pg_class
-- WHERE relname IN ('usage_events', 'api_call_logs', 'stripe_events', 'usage_counters')
-- AND relkind = 'r';

-- 3. Check table sizes
-- SELECT
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
--   pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
--   pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS index_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
-- LIMIT 20;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- **IMPORTANT**: This migration uses CREATE INDEX CONCURRENTLY to avoid locking tables.
-- However, CONCURRENTLY cannot be used inside a transaction block in some Postgres versions.
-- If you encounter errors, run each CREATE INDEX CONCURRENTLY statement separately outside of BEGIN/COMMIT.

-- **MONITORING**: After this migration, monitor:
-- 1. Query performance: Use EXPLAIN ANALYZE on slow queries to verify index usage
-- 2. Index usage: Check vw_index_usage view weekly to identify unused indexes
-- 3. Table bloat: Check vw_table_bloat view daily to verify autovacuum is effective
-- 4. Connection pool: Monitor connection counts to detect saturation

-- **NEXT STEPS**:
-- 1. Enable pg_stat_statements (requires admin permissions)
-- 2. Implement table partitioning for usage_events and api_call_logs (consider after 1M+ rows)
-- 3. Set up automated alerts for high dead row counts (>20%)
-- 4. Consider read replicas if query load exceeds 1000 QPS on primary

-- **ROLLBACK**: To rollback this migration, drop the created indexes:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_usage_events_account_type_timestamp;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_api_call_logs_tenant_method_path_created;
-- (... continue for all indexes)
-- DROP VIEW IF EXISTS vw_index_usage;
-- DROP VIEW IF EXISTS vw_table_bloat;
