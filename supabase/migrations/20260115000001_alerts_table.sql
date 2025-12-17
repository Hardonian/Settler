-- Migration: alerts_table
-- Created: 2026-01-15
-- Description: Add alerts table for operational alerting

BEGIN;

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'resolved') THEN
      ALTER TABLE alerts ADD COLUMN resolved BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
  END IF;
END $$;

-- Create indexes conditionally to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'resolved') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_resolved') THEN
        EXECUTE 'CREATE INDEX idx_alerts_resolved ON alerts(resolved)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'severity') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_severity') THEN
        EXECUTE 'CREATE INDEX idx_alerts_severity ON alerts(severity)';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'created_at')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'resolved') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_unresolved_severity') THEN
          EXECUTE 'CREATE INDEX idx_alerts_unresolved_severity ON alerts(severity, created_at DESC) WHERE resolved = FALSE';
        END IF;
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'type') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_type') THEN
        EXECUTE 'CREATE INDEX idx_alerts_type ON alerts(type)';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'created_at') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'alerts' AND indexname = 'idx_alerts_created_at') THEN
        EXECUTE 'CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC)';
      END IF;
    END IF;
  END IF;
END $$;

COMMENT ON TABLE alerts IS 'Operational alerts for system monitoring';
COMMENT ON COLUMN alerts.severity IS 'Alert severity: low, medium, high, critical';

COMMIT;
