-- Migration: edge_ai_schema
-- Created: 2025-12-01 00:00:00 UTC
-- Description: Edge AI platform schema - Edge nodes, models, candidates, anomalies, PII tokens, device profiles

BEGIN;

-- ============================================================================
-- 1. EDGE NODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS edge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  node_key VARCHAR(255) UNIQUE NOT NULL,
  node_key_hash VARCHAR(255) NOT NULL,
  enrollment_key VARCHAR(255),
  enrollment_key_hash VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, active, inactive, revoked
  device_type VARCHAR(100), -- server, embedded, mobile, edge_gateway
  device_os VARCHAR(100), -- linux, windows, android, ios
  device_arch VARCHAR(50), -- x86_64, arm64, armv7
  capabilities JSONB DEFAULT '{
    "cpu": false,
    "gpu": false,
    "npu": false,
    "tpu": false,
    "onnx_runtime": false,
    "tensorrt": false,
    "executorch": false,
    "webgpu": false,
    "wasm": false
  }'::jsonb,
  location JSONB, -- { "region": "us-west-2", "lat": 37.7749, "lng": -122.4194 }
  last_heartbeat_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  version VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_edge_nodes_tenant_id ON edge_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_node_key_hash ON edge_nodes(node_key_hash);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON edge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_tenant_status ON edge_nodes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_last_heartbeat ON edge_nodes(last_heartbeat_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_active_tenant ON edge_nodes(tenant_id, last_heartbeat_at DESC) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_edge_nodes_capabilities_gin ON edge_nodes USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_deleted ON edge_nodes(deleted_at);

-- ============================================================================
-- 2. MODEL VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  model_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  model_type VARCHAR(100) NOT NULL, -- matching, anomaly_detection, schema_inference, pii_detection
  format VARCHAR(50) NOT NULL, -- onnx, tensorrt, executorch, wasm, tflite
  quantization VARCHAR(20), -- int4, int8, fp16, fp32
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_hash VARCHAR(255),
  aias_job_id VARCHAR(255), -- Reference to AIAS Edge Studio job
  benchmark_results JSONB, -- { "latency_ms": 12.5, "throughput_per_sec": 80, "accuracy": 0.95 }
  device_targets TEXT[], -- ["x86_64", "arm64"]
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_versions_tenant_id ON model_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_model_name ON model_versions(model_name);
CREATE INDEX IF NOT EXISTS idx_model_versions_type ON model_versions(model_type);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON model_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_model_versions_tenant_active ON model_versions(tenant_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_versions_aias_job ON model_versions(aias_job_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_device_targets_gin ON model_versions USING GIN (device_targets);

-- ============================================================================
-- 3. EDGE JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS edge_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_node_id UUID NOT NULL REFERENCES edge_nodes(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL, -- ingestion, scoring, anomaly_detection, sync
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edge_jobs_edge_node_id ON edge_jobs(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_tenant_id ON edge_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_status ON edge_jobs(status);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_type ON edge_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_tenant_status ON edge_jobs(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_node_status ON edge_jobs(edge_node_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_input_data_gin ON edge_jobs USING GIN (input_data);
CREATE INDEX IF NOT EXISTS idx_edge_jobs_output_data_gin ON edge_jobs USING GIN (output_data);

-- ============================================================================
-- 4. RECONCILIATION CANDIDATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconciliation_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES executions(id) ON DELETE SET NULL,
  edge_node_id UUID REFERENCES edge_nodes(id) ON DELETE SET NULL,
  source_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
  match_algorithm VARCHAR(100), -- fuzzy, semantic, rule_based, hybrid
  model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  score_matrix JSONB, -- Detailed scoring breakdown
  features JSONB, -- Extracted features used for matching
  is_accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_tenant_id ON reconciliation_candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_job_id ON reconciliation_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_execution_id ON reconciliation_candidates(execution_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_edge_node_id ON reconciliation_candidates(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_confidence ON reconciliation_candidates(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_tenant_confidence ON reconciliation_candidates(tenant_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_accepted ON reconciliation_candidates(is_accepted);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_source_target ON reconciliation_candidates(source_id, target_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_score_matrix_gin ON reconciliation_candidates USING GIN (score_matrix);
CREATE INDEX IF NOT EXISTS idx_reconciliation_candidates_features_gin ON reconciliation_candidates USING GIN (features);

-- ============================================================================
-- 5. ANOMALY EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS anomaly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  edge_node_id UUID REFERENCES edge_nodes(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES executions(id) ON DELETE SET NULL,
  anomaly_type VARCHAR(100) NOT NULL, -- amount_mismatch, duplicate, missing_transaction, pattern_deviation
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_data JSONB,
  anomaly_score DECIMAL(5, 4), -- 0.0000 to 1.0000
  model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_id ON anomaly_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_edge_node_id ON anomaly_events(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_job_id ON anomaly_events(job_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_type ON anomaly_events(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_severity ON anomaly_events(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved ON anomaly_events(is_resolved);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_severity ON anomaly_events(tenant_id, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_tenant_unresolved ON anomaly_events(tenant_id, detected_at DESC) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_anomaly_events_transaction_data_gin ON anomaly_events USING GIN (transaction_data);

-- ============================================================================
-- 6. PII MAPPING TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pii_mapping_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  edge_node_id UUID REFERENCES edge_nodes(id) ON DELETE SET NULL,
  original_value_hash VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  pii_type VARCHAR(100), -- email, ssn, credit_card, phone, name
  encryption_key_id VARCHAR(255),
  redacted_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(tenant_id, original_value_hash)
);

CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_tenant_id ON pii_mapping_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_edge_node_id ON pii_mapping_tokens(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_token ON pii_mapping_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_original_hash ON pii_mapping_tokens(original_value_hash);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_pii_type ON pii_mapping_tokens(pii_type);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_expires ON pii_mapping_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_pii_mapping_tokens_tenant_token ON pii_mapping_tokens(tenant_id, token);

-- ============================================================================
-- 7. DEVICE PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  edge_node_id UUID REFERENCES edge_nodes(id) ON DELETE CASCADE,
  profile_name VARCHAR(255) NOT NULL,
  device_specs JSONB NOT NULL, -- { "cpu": "Intel i7", "ram_gb": 16, "gpu": "NVIDIA RTX 3080" }
  benchmark_results JSONB, -- Performance benchmarks for different models
  recommended_models UUID[], -- Array of model_version_ids
  optimization_settings JSONB, -- Model optimization preferences
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(edge_node_id, profile_name)
);

CREATE INDEX IF NOT EXISTS idx_device_profiles_tenant_id ON device_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_profiles_edge_node_id ON device_profiles(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_device_profiles_device_specs_gin ON device_profiles USING GIN (device_specs);
CREATE INDEX IF NOT EXISTS idx_device_profiles_benchmark_results_gin ON device_profiles USING GIN (benchmark_results);
CREATE INDEX IF NOT EXISTS idx_device_profiles_recommended_models_gin ON device_profiles USING GIN (recommended_models);

-- ============================================================================
-- 8. EDGE NODE DEPLOYMENTS TABLE (Track model deployments to nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS edge_node_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_node_id UUID NOT NULL REFERENCES edge_nodes(id) ON DELETE CASCADE,
  model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, deploying, active, failed, rolled_back
  deployed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  rollback_reason TEXT,
  performance_metrics JSONB, -- Runtime performance after deployment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(edge_node_id, model_version_id)
);

CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_edge_node_id ON edge_node_deployments(edge_node_id);
CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_model_version_id ON edge_node_deployments(model_version_id);
CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_tenant_id ON edge_node_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_status ON edge_node_deployments(status);
CREATE INDEX IF NOT EXISTS idx_edge_node_deployments_tenant_status ON edge_node_deployments(tenant_id, status, deployed_at DESC);

-- ============================================================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_edge_nodes_updated_at BEFORE UPDATE ON edge_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_versions_updated_at BEFORE UPDATE ON model_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edge_jobs_updated_at BEFORE UPDATE ON edge_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_candidates_updated_at BEFORE UPDATE ON reconciliation_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anomaly_events_updated_at BEFORE UPDATE ON anomaly_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_profiles_updated_at BEFORE UPDATE ON device_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edge_node_deployments_updated_at BEFORE UPDATE ON edge_node_deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE edge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_mapping_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_node_deployments ENABLE ROW LEVEL SECURITY;

-- Edge nodes: tenants can only see their own nodes
CREATE POLICY edge_nodes_tenant_isolation ON edge_nodes
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Model versions: tenants can only see their own models
CREATE POLICY model_versions_tenant_isolation ON model_versions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID OR tenant_id IS NULL);

-- Edge jobs: tenants can only see their own jobs
CREATE POLICY edge_jobs_tenant_isolation ON edge_jobs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Reconciliation candidates: tenants can only see their own candidates
CREATE POLICY reconciliation_candidates_tenant_isolation ON reconciliation_candidates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Anomaly events: tenants can only see their own events
CREATE POLICY anomaly_events_tenant_isolation ON anomaly_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- PII mapping tokens: tenants can only see their own tokens
CREATE POLICY pii_mapping_tokens_tenant_isolation ON pii_mapping_tokens
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Device profiles: tenants can only see their own profiles
CREATE POLICY device_profiles_tenant_isolation ON device_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Edge node deployments: tenants can only see their own deployments
CREATE POLICY edge_node_deployments_tenant_isolation ON edge_node_deployments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

COMMIT;
