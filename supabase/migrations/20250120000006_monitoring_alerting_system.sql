-- Migration: monitoring_alerting_system
-- Created: 2025-01-20 00:00:06 UTC
-- Description: Monitoring and alerting system for fraud signals, rate limits, anomalies
-- Priority: P1 (High - Operational resilience)

BEGIN;

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100) NOT NULL, -- 'fraud_signal', 'rate_limit_exceeded', 'anomaly_detected', 'integration_failure', 'cost_threshold'
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Context
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  integration_id VARCHAR(100),
  resource_type VARCHAR(100), -- 'billing_account', 'integration', 'usage_event', etc.
  resource_id UUID,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_billing_account_id ON alerts(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_open_critical ON alerts(tenant_id, status, severity) WHERE status = 'open' AND severity = 'critical';

-- ============================================================================
-- ALERT RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL UNIQUE,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium',
  
  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL, -- e.g., {"usage_spike_percentage": 300, "consecutive_failures": 5}
  
  -- Actions
  enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_webhook BOOLEAN DEFAULT false,
  notify_whatsapp BOOLEAN DEFAULT false,
  notify_telegram BOOLEAN DEFAULT false,
  
  -- Recipients
  email_recipients TEXT[],
  webhook_url TEXT,
  whatsapp_number TEXT,
  telegram_chat_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_alert_type ON alert_rules(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;

-- Insert default alert rules
INSERT INTO alert_rules (rule_name, alert_type, severity, conditions, notify_email, email_recipients) VALUES
  ('fraud_usage_spike', 'fraud_signal', 'high', '{"usage_spike_percentage": 300, "min_usage": 100}', true, ARRAY[]::TEXT[]),
  ('rate_limit_exceeded', 'rate_limit_exceeded', 'medium', '{"exceeded_by_percentage": 50}', true, ARRAY[]::TEXT[]),
  ('integration_failure', 'integration_failure', 'high', '{"consecutive_failures": 5}', true, ARRAY[]::TEXT[]),
  ('cost_threshold', 'cost_threshold', 'high', '{"threshold_usd": 1000}', true, ARRAY[]::TEXT[]),
  ('anomaly_detected', 'anomaly_detected', 'medium', '{"anomaly_score": 0.8}', true, ARRAY[]::TEXT[])
ON CONFLICT (rule_name) DO NOTHING;

-- ============================================================================
-- ALERT NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'email', 'webhook', 'whatsapp', 'telegram'
  recipient TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_pending ON alert_notifications(status, created_at) WHERE status = 'pending';

-- ============================================================================
-- MONITORING METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  integration_id VARCHAR(100),
  
  -- Value
  value DECIMAL(15, 6) NOT NULL,
  unit VARCHAR(50),
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_metric_name ON monitoring_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_tenant_id ON monitoring_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_metric_tenant_time ON monitoring_metrics(metric_name, tenant_id, timestamp DESC);

-- ============================================================================
-- FUNCTION: Create alert from fraud signal
-- ============================================================================

CREATE OR REPLACE FUNCTION create_alert_from_fraud_signal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
  v_rule RECORD;
BEGIN
  -- Find matching alert rule
  SELECT * INTO v_rule
  FROM alert_rules
  WHERE alert_type = 'fraud_signal'
    AND enabled = true
    AND (conditions->>'usage_spike_percentage')::INTEGER <= (NEW.metadata->>'spike_percentage')::INTEGER
  ORDER BY (conditions->>'usage_spike_percentage')::INTEGER DESC
  LIMIT 1;

  IF v_rule IS NULL THEN
    RETURN NEW; -- No matching rule
  END IF;

  -- Create alert
  INSERT INTO alerts (
    alert_type,
    severity,
    title,
    message,
    tenant_id,
    billing_account_id,
    metadata
  ) VALUES (
    'fraud_signal',
    v_rule.severity,
    'Fraud Signal Detected',
    NEW.description,
    (SELECT tenant_id FROM billing_accounts WHERE id = NEW.billing_account_id),
    NEW.billing_account_id,
    jsonb_build_object(
      'fraud_signal_id', NEW.id,
      'signal_type', NEW.signal_type,
      'spike_percentage', NEW.metadata->>'spike_percentage'
    )
  )
  RETURNING id INTO v_alert_id;

  -- Send notifications
  IF v_rule.notify_email AND array_length(v_rule.email_recipients, 1) > 0 THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    SELECT v_alert_id, 'email', unnest(v_rule.email_recipients), 'pending';
  END IF;

  IF v_rule.notify_webhook AND v_rule.webhook_url IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status, metadata)
    VALUES (v_alert_id, 'webhook', v_rule.webhook_url, 'pending', jsonb_build_object('url', v_rule.webhook_url));
  END IF;

  IF v_rule.notify_whatsapp AND v_rule.whatsapp_number IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    VALUES (v_alert_id, 'whatsapp', v_rule.whatsapp_number, 'pending');
  END IF;

  IF v_rule.notify_telegram AND v_rule.telegram_chat_id IS NOT NULL THEN
    INSERT INTO alert_notifications (alert_id, notification_type, recipient, status)
    VALUES (v_alert_id, 'telegram', v_rule.telegram_chat_id, 'pending');
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Create alert when fraud signal is created
DROP TRIGGER IF EXISTS trigger_create_alert_from_fraud_signal ON fraud_signals;
CREATE TRIGGER trigger_create_alert_from_fraud_signal
  AFTER INSERT ON fraud_signals
  FOR EACH ROW
  EXECUTE FUNCTION create_alert_from_fraud_signal();

-- ============================================================================
-- FUNCTION: Check and create rate limit alerts
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit_alerts()
RETURNS TABLE(
  alert_id UUID,
  tenant_id UUID,
  rate_limit_exceeded BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_alert_id UUID;
  v_rule RECORD;
BEGIN
  -- This function would be called periodically to check for rate limit violations
  -- For now, it's a placeholder - actual implementation would query rate limit logs
  
  -- Find matching alert rule
  SELECT * INTO v_rule
  FROM alert_rules
  WHERE alert_type = 'rate_limit_exceeded'
    AND enabled = true
  LIMIT 1;

  IF v_rule IS NULL THEN
    RETURN;
  END IF;

  -- TODO: Query actual rate limit violations from logs/metrics
  -- For now, return empty result
  
  RETURN;
END;
$$;

-- ============================================================================
-- FUNCTION: Anomaly detection (simplified)
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_anomalies(
  p_tenant_id UUID,
  p_metric_name VARCHAR(100),
  p_time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  anomaly_score DECIMAL(5, 4),
  detected_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_value DECIMAL(15, 6);
  v_avg_value DECIMAL(15, 6);
  v_std_dev DECIMAL(15, 6);
  v_anomaly_score DECIMAL(5, 4);
BEGIN
  -- Get current value (last hour)
  SELECT AVG(value) INTO v_current_value
  FROM monitoring_metrics
  WHERE metric_name = p_metric_name
    AND tenant_id = p_tenant_id
    AND timestamp >= NOW() - INTERVAL '1 hour';

  -- Get historical average and standard deviation
  SELECT
    AVG(value),
    STDDEV(value)
  INTO v_avg_value, v_std_dev
  FROM monitoring_metrics
  WHERE metric_name = p_metric_name
    AND tenant_id = p_tenant_id
    AND timestamp >= NOW() - (p_time_window_hours || ' hours')::INTERVAL
    AND timestamp < NOW() - INTERVAL '1 hour';

  -- Calculate anomaly score (Z-score)
  IF v_std_dev > 0 THEN
    v_anomaly_score := ABS((v_current_value - v_avg_value) / v_std_dev);
  ELSE
    v_anomaly_score := 0;
  END IF;

  -- Return if anomaly detected (score > 2 = 2 standard deviations)
  IF v_anomaly_score > 2 THEN
    anomaly_score := v_anomaly_score;
    detected_at := NOW();
    RETURN NEXT;
  END IF;

  RETURN;
END;
$$;

-- ============================================================================
-- FUNCTION: Send alert notifications (to be called by Edge Function/cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION send_pending_alert_notifications()
RETURNS TABLE(
  notification_id UUID,
  alert_id UUID,
  notification_type VARCHAR(50),
  recipient TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification RECORD;
BEGIN
  -- Get pending notifications
  FOR v_notification IN
    SELECT an.*, a.title, a.message, a.severity
    FROM alert_notifications an
    JOIN alerts a ON a.id = an.alert_id
    WHERE an.status = 'pending'
    ORDER BY a.severity DESC, an.created_at ASC
    LIMIT 100
  LOOP
    -- Mark as sent (actual sending would be done by Edge Function)
    UPDATE alert_notifications
    SET status = 'sent',
        sent_at = NOW()
    WHERE id = v_notification.id;

    notification_id := v_notification.id;
    alert_id := v_notification.alert_id;
    notification_type := v_notification.notification_type;
    recipient := v_notification.recipient;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

COMMIT;
