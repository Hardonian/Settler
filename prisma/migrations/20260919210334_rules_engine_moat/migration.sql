-- Rules Engine Moat Migration
-- Stores user mapping rules and learned patterns that improve match rate over time.
-- This creates data gravity and workflow lock-in.

CREATE TABLE IF NOT EXISTS reconciliation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tenant_id UUID,
  user_id UUID,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100) NOT NULL, -- 'field_mapping', 'vendor_normalization', 'amount_tolerance', 'date_tolerance', 'custom_logic'
  source_field VARCHAR(255),
  target_field VARCHAR(255),
  rule_config JSONB NOT NULL DEFAULT '{}', -- Flexible config for different rule types
  match_count INTEGER NOT NULL DEFAULT 0, -- How many times this rule successfully matched
  success_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0, -- 0.0000 to 1.0000
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT reconciliation_rules_billing_account_fk FOREIGN KEY (billing_account_id) REFERENCES billing_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_reconciliation_rules_billing_account ON reconciliation_rules(billing_account_id);
CREATE INDEX idx_reconciliation_rules_tenant ON reconciliation_rules(tenant_id);
CREATE INDEX idx_reconciliation_rules_user ON reconciliation_rules(user_id);
CREATE INDEX idx_reconciliation_rules_type ON reconciliation_rules(rule_type);
CREATE INDEX idx_reconciliation_rules_active ON reconciliation_rules(is_active);
CREATE INDEX idx_reconciliation_rules_success_rate ON reconciliation_rules(success_rate DESC);
CREATE INDEX idx_reconciliation_rules_last_used ON reconciliation_rules(last_used_at DESC);

-- Rule usage tracking (for learning)
CREATE TABLE IF NOT EXISTS rule_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES reconciliation_rules(id) ON DELETE CASCADE,
  reconciliation_run_id UUID,
  matched BOOLEAN NOT NULL,
  confidence DECIMAL(5, 4), -- 0.0000 to 1.0000
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT rule_usage_events_rule_fk FOREIGN KEY (rule_id) REFERENCES reconciliation_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_rule_usage_events_rule ON rule_usage_events(rule_id);
CREATE INDEX idx_rule_usage_events_run ON rule_usage_events(reconciliation_run_id);
CREATE INDEX idx_rule_usage_events_matched ON rule_usage_events(matched);
CREATE INDEX idx_rule_usage_events_created ON rule_usage_events(created_at DESC);

-- Function to update rule success rate
CREATE OR REPLACE FUNCTION update_rule_success_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reconciliation_rules
  SET
    match_count = (
      SELECT COUNT(*) FROM rule_usage_events
      WHERE rule_id = NEW.rule_id AND matched = true
    ),
    success_rate = (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0.0
          ELSE COUNT(*) FILTER (WHERE matched = true)::DECIMAL / COUNT(*)::DECIMAL
        END
      FROM rule_usage_events
      WHERE rule_id = NEW.rule_id
    ),
    last_used_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.rule_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update success rate
CREATE TRIGGER trigger_update_rule_success_rate
AFTER INSERT ON rule_usage_events
FOR EACH ROW
EXECUTE FUNCTION update_rule_success_rate();
