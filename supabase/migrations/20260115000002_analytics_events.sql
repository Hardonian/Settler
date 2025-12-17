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

-- Create indexes conditionally to avoid duplicates
-- Note: DATE() is not IMMUTABLE, so we can't use it in an index expression
-- Instead, we'll index on created_at and filter by date in queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'user_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analytics_events' AND indexname = 'idx_analytics_events_user_id') THEN
        EXECUTE 'CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'event')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'created_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analytics_events' AND indexname = 'idx_analytics_events_user_event') THEN
          EXECUTE 'CREATE INDEX idx_analytics_events_user_event ON analytics_events(user_id, event, created_at DESC)';
        END IF;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'event') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analytics_events' AND indexname = 'idx_analytics_events_event') THEN
        EXECUTE 'CREATE INDEX idx_analytics_events_event ON analytics_events(event)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics_events' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'analytics_events' AND indexname = 'idx_analytics_events_created_at') THEN
        EXECUTE 'CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC)';
      END IF;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE analytics_events IS 'Tracks user events for growth analytics and conversion funnel analysis';
COMMENT ON COLUMN analytics_events.event IS 'Event name (e.g., onboarding.step_completed, conversion.upgrade_clicked)';
COMMENT ON COLUMN analytics_events.properties IS 'Event-specific properties as JSON';

COMMIT;
