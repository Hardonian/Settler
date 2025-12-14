-- Migration: Add UsageCounter table for real-time usage tracking
-- Purpose: Enable accurate usage tracking and billing enforcement
-- Date: 2026-01-25

-- Create usage_counters table
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL, -- 'reconcile', 'receipts', 'featureFlags', 'playground'
  period VARCHAR(20) NOT NULL, -- 'daily', 'monthly'
  period_start DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL DEFAULT 0, -- Cached limit for reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_billing_service_period UNIQUE (billing_account_id, service, period, period_start)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_counters_billing_service_period 
  ON usage_counters(billing_account_id, service, period);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period_start 
  ON usage_counters(period_start);

-- Add RLS policies
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage counters
CREATE POLICY usage_counters_user_access ON usage_counters
  FOR SELECT
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert/update usage counters (via service role)
-- Note: This is handled by application code with service role key

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_usage_counters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usage_counters_updated_at
  BEFORE UPDATE ON usage_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_counters_updated_at();

-- Add comment
COMMENT ON TABLE usage_counters IS 'Real-time usage counters for billing enforcement. Tracks usage per billing account, service, and period.';
