CREATE TABLE ml_adapter_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    external_id_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.4,
    amount_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.25,
    date_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
    description_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.1,
    currency_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.05,
    historical_match_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.05,
    adapter_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ml_adapter_weights_tenant ON ml_adapter_weights(tenant_id);

ALTER TABLE ml_adapter_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY ml_adapter_weights_tenant_isolation ON ml_adapter_weights
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
