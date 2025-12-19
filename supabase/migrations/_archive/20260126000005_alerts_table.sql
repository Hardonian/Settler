-- Migration: Alerts Table
-- Created: 2026-01-26
-- Description: Store alert history for monitoring

BEGIN;

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  check_type VARCHAR(100),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'severity') THEN
      ALTER TABLE alerts ADD COLUMN severity VARCHAR(50);
      UPDATE alerts SET severity = 'low' WHERE severity IS NULL;
      ALTER TABLE alerts ALTER COLUMN severity SET NOT NULL;
      -- Add CHECK constraint
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'alerts_severity_check'
        AND conrelid = 'alerts'::regclass
      ) THEN
        ALTER TABLE alerts ADD CONSTRAINT alerts_severity_check CHECK (severity IN ('critical', 'high', 'medium', 'low'));
      END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'title') THEN
      ALTER TABLE alerts ADD COLUMN title VARCHAR(255);
      UPDATE alerts SET title = 'Alert' WHERE title IS NULL;
      ALTER TABLE alerts ALTER COLUMN title SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'message') THEN
      ALTER TABLE alerts ADD COLUMN message TEXT;
      UPDATE alerts SET message = '' WHERE message IS NULL;
      ALTER TABLE alerts ALTER COLUMN message SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'check_type') THEN
      ALTER TABLE alerts ADD COLUMN check_type VARCHAR(100);
      UPDATE alerts SET check_type = 'unknown' WHERE check_type IS NULL;
      ALTER TABLE alerts ALTER COLUMN check_type SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'sent_at') THEN
      ALTER TABLE alerts ADD COLUMN sent_at TIMESTAMPTZ DEFAULT NOW();
      UPDATE alerts SET sent_at = NOW() WHERE sent_at IS NULL;
      ALTER TABLE alerts ALTER COLUMN sent_at SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'acknowledged_at') THEN
      ALTER TABLE alerts ADD COLUMN acknowledged_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'resolved_at') THEN
      ALTER TABLE alerts ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'severity') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_severity') THEN
        EXECUTE 'CREATE INDEX idx_alerts_severity ON alerts(severity)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'sent_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_sent_at') THEN
        EXECUTE 'CREATE INDEX idx_alerts_sent_at ON alerts(sent_at DESC)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'check_type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_check_type') THEN
        EXECUTE 'CREATE INDEX idx_alerts_check_type ON alerts(check_type)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'resolved_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_unresolved') THEN
        EXECUTE 'CREATE INDEX idx_alerts_unresolved ON alerts(resolved_at) WHERE resolved_at IS NULL';
      END IF;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE alerts IS 'Stores alert history for monitoring and incident tracking';

COMMIT;
