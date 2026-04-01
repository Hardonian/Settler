-- Migration: Add composite index to support efficient querying of analytics events.
-- This improves performance of the dashboards.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_tenant_id_type_timestamp
  ON analytics_events (tenant_id, type, timestamp DESC);
