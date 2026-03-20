-- SLO Alerting Infrastructure Migration
-- Per-tenant SLO alerting for metrics:
-- - usage.api.latency_ms
-- - usage.api.query_rows
-- - usage.export.duration_ms

-- SLO Configuration per tenant
CREATE TABLE IF NOT EXISTS slo_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    threshold_warning DECIMAL(20, 4) NOT NULL,
    threshold_critical DECIMAL(20, 4) NOT NULL,
    percentile_threshold JSONB,
    drift_detection JSONB,
    enabled BOOLEAN DEFAULT true,
    evaluation_interval INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT slo_config_unique UNIQUE (tenant_id, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_slo_configs_tenant ON slo_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_slo_configs_metric ON slo_configs(metric_type);

-- SLO Metrics Data Points
CREATE TABLE IF NOT EXISTS slo_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    value DECIMAL(20, 4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slo_metrics_tenant_timestamp ON slo_metrics(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_slo_metrics_tenant_type_timestamp ON slo_metrics(tenant_id, metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_slo_metrics_timestamp ON slo_metrics(timestamp DESC);

-- SLO Alert Rules
CREATE TABLE IF NOT EXISTS slo_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    threshold DECIMAL(20, 4),
    percentile VARCHAR(10),
    drift_enabled BOOLEAN DEFAULT false,
    warning_severity VARCHAR(20) DEFAULT 'warning',
    critical_severity VARCHAR(20) DEFAULT 'critical',
    channels JSONB DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slo_alert_rules_tenant ON slo_alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_slo_alert_rules_tenant_metric ON slo_alert_rules(tenant_id, metric_type);

-- SLO Alerts
CREATE TABLE IF NOT EXISTS slo_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    current_value DECIMAL(20, 4),
    threshold DECIMAL(20, 4),
    percentile VARCHAR(10),
    drift_data JSONB,
    status VARCHAR(20) DEFAULT 'firing',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP WITH TIME ZONE,
    runbook_url TEXT,
    dashboard_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slo_alerts_tenant_status ON slo_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_slo_alerts_tenant_triggered ON slo_alerts(tenant_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_slo_alerts_metric_status ON slo_alerts(metric_type, status);
CREATE INDEX IF NOT EXISTS idx_slo_alerts_status_triggered ON slo_alerts(status, triggered_at DESC);

-- Function to automatically clean up old metrics (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_slo_metrics(tenant_uuid UUID, retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM slo_metrics
    WHERE tenant_id = tenant_uuid
      AND timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_slo_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS slo_config_updated_at_trigger ON slo_configs;
CREATE TRIGGER slo_config_updated_at_trigger
    BEFORE UPDATE ON slo_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_slo_config_updated_at();

-- Trigger for alert rules
CREATE OR REPLACE FUNCTION update_slo_alert_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS slo_alert_rule_updated_at_trigger ON slo_alert_rules;
CREATE TRIGGER slo_alert_rule_updated_at_trigger
    BEFORE UPDATE ON slo_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_slo_alert_rule_updated_at();

-- Trigger for alerts
CREATE OR REPLACE FUNCTION update_slo_alert_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS slo_alert_updated_at_trigger ON slo_alerts;
CREATE TRIGGER slo_alert_updated_at_trigger
    BEFORE UPDATE ON slo_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_slo_alert_updated_at();

-- Insert default SLO configs for existing tenants (optional, can be run manually)
-- This will be handled by the initializeDefaultSLOConfigs function

COMMENT ON TABLE slo_configs IS 'Per-tenant SLO configuration with thresholds and drift detection settings';
COMMENT ON TABLE slo_metrics IS 'Raw metric data points for SLO calculations';
COMMENT ON TABLE slo_alert_rules IS 'Alert rule definitions per tenant';
COMMENT ON TABLE slo_alerts IS 'SLO alerts generated from threshold breaches and drift detection';
