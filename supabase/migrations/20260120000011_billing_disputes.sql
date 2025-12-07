-- Migration: billing_disputes
-- Created: 2026-01-20
-- Description: Billing dispute tracking

BEGIN;

CREATE TABLE IF NOT EXISTS billing_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id VARCHAR(255) NOT NULL,
  disputed_amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, under_review, resolved, rejected
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_disputes_user_id ON billing_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_disputes_status ON billing_disputes(status);

ALTER TABLE billing_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_disputes_select ON billing_disputes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY billing_disputes_insert ON billing_disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
