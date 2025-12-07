-- Migration: financial_ledger
-- Created: 2025-11-29
-- Description: Financial ledger table for immutable transaction records
-- CFO Mode: Accuracy & Idempotency

BEGIN;

-- ============================================================================
-- FINANCIAL LEDGER TABLE
-- ============================================================================
-- Immutable credit/debit ledger for all financial movements
-- CFO Principle: Never delete transactions, only offset with corrective entries

CREATE TABLE IF NOT EXISTS financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'fee', 'adjustment', 'correction'
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  amount_cents BIGINT NOT NULL, -- CFO Mode: Store in cents, never use floats
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  account_type VARCHAR(50) NOT NULL, -- 'revenue', 'expense', 'asset', 'liability'
  reference_type VARCHAR(50), -- 'stripe_payment', 'shopify_order', 'invoice', etc.
  reference_id VARCHAR(255), -- External ID (e.g., Stripe payment intent ID)
  idempotency_key VARCHAR(255) NOT NULL, -- CFO Mode: Prevent double-recording
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Immutable: No updated_at or deleted_at
  UNIQUE(tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_id ON financial_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transaction_type ON financial_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_type ON financial_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_account_type ON financial_ledger(account_type);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON financial_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON financial_ledger(tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON financial_ledger(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_account ON financial_ledger(tenant_id, account_type, created_at DESC);

-- ============================================================================
-- ACCOUNT BALANCES TABLE (Derived from ledger)
-- ============================================================================
-- Materialized view of current balances per account type
-- Updated via triggers or scheduled jobs

CREATE TABLE IF NOT EXISTS account_balances (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_type VARCHAR(50) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  balance_cents BIGINT NOT NULL DEFAULT 0, -- CFO Mode: Integer math
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, account_type, currency)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_tenant ON account_balances(tenant_id);

-- ============================================================================
-- FUNCTION: Calculate account balance from ledger
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_account_balance(
  p_tenant_id UUID,
  p_account_type VARCHAR(50),
  p_currency VARCHAR(10) DEFAULT 'USD'
) RETURNS BIGINT AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN entry_type = 'credit' THEN amount_cents
      WHEN entry_type = 'debit' THEN -amount_cents
      ELSE 0
    END
  ), 0) INTO v_balance
  FROM financial_ledger
  WHERE tenant_id = p_tenant_id
    AND account_type = p_account_type
    AND currency = p_currency;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Record ledger entry with idempotency check
-- ============================================================================
-- CFO Mode: Idempotency is critical for financial transactions

CREATE OR REPLACE FUNCTION record_ledger_entry(
  p_tenant_id UUID,
  p_transaction_type VARCHAR(50),
  p_entry_type VARCHAR(10),
  p_amount_cents BIGINT,
  p_currency VARCHAR(10),
  p_account_type VARCHAR(50),
  p_reference_type VARCHAR(50),
  p_reference_id VARCHAR(255),
  p_idempotency_key VARCHAR(255),
  p_description TEXT,
  p_metadata JSONB,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Check for existing entry with same idempotency key
  SELECT id INTO v_entry_id
  FROM financial_ledger
  WHERE tenant_id = p_tenant_id
    AND idempotency_key = p_idempotency_key;
  
  IF v_entry_id IS NOT NULL THEN
    -- Idempotent: return existing entry ID
    RETURN v_entry_id;
  END IF;
  
  -- Insert new entry
  INSERT INTO financial_ledger (
    tenant_id,
    transaction_type,
    entry_type,
    amount_cents,
    currency,
    account_type,
    reference_type,
    reference_id,
    idempotency_key,
    description,
    metadata,
    created_by
  ) VALUES (
    p_tenant_id,
    p_transaction_type,
    p_entry_type,
    p_amount_cents,
    p_currency,
    p_account_type,
    p_reference_type,
    p_reference_id,
    p_idempotency_key,
    p_description,
    p_metadata,
    p_created_by
  ) RETURNING id INTO v_entry_id;
  
  -- Update account balance
  INSERT INTO account_balances (tenant_id, account_type, currency, balance_cents, last_updated_at)
  VALUES (
    p_tenant_id,
    p_account_type,
    p_currency,
    calculate_account_balance(p_tenant_id, p_account_type, p_currency),
    NOW()
  )
  ON CONFLICT (tenant_id, account_type, currency)
  DO UPDATE SET
    balance_cents = calculate_account_balance(p_tenant_id, p_account_type, p_currency),
    last_updated_at = NOW();
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

-- Users can only view ledger entries for their tenant
CREATE POLICY "Users can view ledger entries for their tenant"
  ON financial_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = financial_ledger.tenant_id
    )
  );

-- Only admins can insert ledger entries (via function)
CREATE POLICY "Admins can insert ledger entries"
  ON financial_ledger FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = financial_ledger.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Ledger is immutable: no UPDATE or DELETE policies

-- Account balances: Users can view balances for their tenant
CREATE POLICY "Users can view account balances for their tenant"
  ON account_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = account_balances.tenant_id
    )
  );

COMMIT;
