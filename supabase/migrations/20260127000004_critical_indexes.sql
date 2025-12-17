-- Migration: critical_indexes
-- Created: 2026-01-27
-- Description: Add critical indexes for performance and tenant isolation queries

BEGIN;

-- ============================================================================
-- USAGE_EVENTS INDEXES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_events') THEN
    -- Index for time-series queries by billing account
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_events' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_events' 
      AND column_name = 'timestamp'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_events' AND indexname = 'idx_usage_events_billing_account_timestamp') THEN
        EXECUTE 'CREATE INDEX idx_usage_events_billing_account_timestamp ON usage_events(billing_account_id, timestamp DESC)';
      END IF;
    END IF;
    
    -- Index for aggregation queries
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_events' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_events' 
      AND column_name = 'event_type'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_events' 
      AND column_name = 'timestamp'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_events' AND indexname = 'idx_usage_events_billing_account_event_type_timestamp') THEN
        EXECUTE 'CREATE INDEX idx_usage_events_billing_account_event_type_timestamp ON usage_events(billing_account_id, event_type, timestamp DESC)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- USAGE_AGGREGATE_DAILY INDEXES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_aggregate_daily') THEN
    -- Index for time-series queries by billing account
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'date'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_aggregate_daily' AND indexname = 'idx_usage_aggregate_daily_billing_account_date') THEN
        EXECUTE 'CREATE INDEX idx_usage_aggregate_daily_billing_account_date ON usage_aggregate_daily(billing_account_id, date DESC)';
      END IF;
    END IF;
    
    -- Index for event type queries
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'event_type'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_aggregate_daily' 
      AND column_name = 'date'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_aggregate_daily' AND indexname = 'idx_usage_aggregate_daily_billing_account_event_type_date') THEN
        EXECUTE 'CREATE INDEX idx_usage_aggregate_daily_billing_account_event_type_date ON usage_aggregate_daily(billing_account_id, event_type, date DESC)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- USAGE_COUNTERS INDEXES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_counters') THEN
    -- Index for service/period queries
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'service'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'period'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_counters' AND indexname = 'idx_usage_counters_billing_account_service_period') THEN
        EXECUTE 'CREATE INDEX idx_usage_counters_billing_account_service_period ON usage_counters(billing_account_id, service, period)';
      END IF;
    END IF;
    
    -- Index for period start queries
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'usage_counters' 
      AND column_name = 'period_start'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'usage_counters' AND indexname = 'idx_usage_counters_billing_account_period_start') THEN
        EXECUTE 'CREATE INDEX idx_usage_counters_billing_account_period_start ON usage_counters(billing_account_id, period_start DESC)';
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- TENANT_USERS INDEXES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_users') THEN
    -- Composite index for membership lookups
    CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant
      ON tenant_users(user_id, tenant_id);
    
    -- Index for tenant membership queries
    CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id
      ON tenant_users(tenant_id);
  END IF;
END $$;

-- ============================================================================
-- CONSOLE_ACTIVITIES INDEXES (if not already exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'console_activities') THEN
    -- Index for recent activities query (may already exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'console_activities' 
      AND column_name = 'billing_account_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'console_activities' 
      AND column_name = 'created_at'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'console_activities' AND indexname = 'idx_console_activities_billing_account_created_at_desc') THEN
        EXECUTE 'CREATE INDEX idx_console_activities_billing_account_created_at_desc ON console_activities(billing_account_id, created_at DESC)';
      END IF;
    END IF;
  END IF;
END $$;

COMMIT;
