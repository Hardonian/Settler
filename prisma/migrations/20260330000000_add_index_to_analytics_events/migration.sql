-- Migration: Add composite index to support efficient querying of analytics events.
-- This improves performance of the dashboards.
--
-- Corrected 2026-10-02: originally targeted a nonexistent `tenant_id` column;
-- neither prisma/schema.prisma (AnalyticsEvent) nor the live table declares it
-- and no code references it. The migration had never applied anywhere, so
-- correcting it in place is safe. Index now covers the model's declared
-- filter/order shape (type + timestamp).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_timestamp
  ON analytics_events (type, timestamp DESC);
