-- Migration: analytics_events
-- Created: 2026-01-15
-- Description: Add analytics events table for growth tracking

BEGIN;

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event ON analytics_events(user_id, event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date ON analytics_events(user_id, DATE(created_at));

COMMENT ON TABLE analytics_events IS 'Tracks user events for growth analytics and conversion funnel analysis';
COMMENT ON COLUMN analytics_events.event IS 'Event name (e.g., onboarding.step_completed, conversion.upgrade_clicked)';
COMMENT ON COLUMN analytics_events.properties IS 'Event-specific properties as JSON';

COMMIT;
