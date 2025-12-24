-- Value Ledger Migration
-- Tracks measurable outcomes: reconciliations completed, receipts processed, time saved, etc.
-- This is investor ammo and retention glue.

CREATE TABLE IF NOT EXISTS value_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID,
  user_id UUID,
  event_type VARCHAR(100) NOT NULL, -- 'reconciliation_completed', 'receipt_processed', 'export_generated', etc.
  quantity DECIMAL(15, 6) NOT NULL DEFAULT 1, -- Can be fractional (e.g., hours saved)
  unit VARCHAR(50), -- 'reconciliation', 'receipt', 'hour', 'dollar', etc.
  metadata JSONB DEFAULT '{}', -- Additional context (job_id, run_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT value_ledger_billing_account_fk FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_value_ledger_billing_account ON value_ledger(billing_account_id);
CREATE INDEX idx_value_ledger_tenant ON value_ledger(tenant_id);
CREATE INDEX idx_value_ledger_user ON value_ledger(user_id);
CREATE INDEX idx_value_ledger_event_type ON value_ledger(event_type);
CREATE INDEX idx_value_ledger_created_at ON value_ledger(created_at DESC);
CREATE INDEX idx_value_ledger_billing_event_created ON value_ledger(billing_account_id, event_type, created_at DESC);

-- Value aggregates for fast queries (daily rollups)
CREATE TABLE IF NOT EXISTS value_ledger_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID,
  date DATE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  total_quantity DECIMAL(15, 6) NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(billing_account_id, date, event_type),
  CONSTRAINT value_ledger_daily_billing_account_fk FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_value_ledger_daily_billing_account ON value_ledger_daily(billing_account_id);
CREATE INDEX idx_value_ledger_daily_tenant ON value_ledger_daily(tenant_id);
CREATE INDEX idx_value_ledger_daily_date ON value_ledger_daily(date DESC);
CREATE INDEX idx_value_ledger_daily_event_type ON value_ledger_daily(event_type);
