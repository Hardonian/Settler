-- Reconciliation Control Plane primitives: spec versions + governance memory + deterministic artifacts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reconciliation_spec_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  user_id UUID,
  source TEXT NOT NULL DEFAULT 'nl',
  spec_json JSONB NOT NULL,
  spec_hash VARCHAR(64) NOT NULL,
  prior_spec_hash VARCHAR(64),
  spec_diff JSONB NOT NULL DEFAULT '{}'::jsonb,
  memory_influence JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reconciliation_spec_versions_hash_len CHECK (char_length(spec_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_spec_versions_org_workspace
  ON reconciliation_spec_versions (org_id, workspace_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reconciliation_spec_versions_workspace_hash
  ON reconciliation_spec_versions (workspace_id, spec_hash);

CREATE TABLE IF NOT EXISTS reconciliation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'pipeline', 'connection')),
  memory_type TEXT NOT NULL CHECK (
    memory_type IN (
      'tolerance_preference',
      'recurring_match_pattern',
      'risk_pattern',
      'false_positive_pattern',
      'reviewer_override_pattern'
    )
  ),
  content_json JSONB NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_memory_org_workspace
  ON reconciliation_memory (org_id, workspace_id, memory_type, updated_at DESC);

CREATE TABLE IF NOT EXISTS reconciliation_codegen_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  spec_hash VARCHAR(64) NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_json JSONB NOT NULL,
  artifact_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reconciliation_codegen_artifacts_hash_len CHECK (char_length(artifact_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_codegen_org_workspace
  ON reconciliation_codegen_artifacts (org_id, workspace_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reconciliation_codegen_spec_type_hash
  ON reconciliation_codegen_artifacts (spec_hash, artifact_type, artifact_hash);

ALTER TABLE reconciliation_spec_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_codegen_artifacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reconciliation_spec_versions'
      AND policyname = 'reconciliation_spec_versions_tenant_isolation'
  ) THEN
    CREATE POLICY reconciliation_spec_versions_tenant_isolation
      ON reconciliation_spec_versions
      USING (org_id::text = current_setting('request.jwt.claim.org_id', true))
      WITH CHECK (org_id::text = current_setting('request.jwt.claim.org_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reconciliation_memory'
      AND policyname = 'reconciliation_memory_tenant_isolation'
  ) THEN
    CREATE POLICY reconciliation_memory_tenant_isolation
      ON reconciliation_memory
      USING (org_id::text = current_setting('request.jwt.claim.org_id', true))
      WITH CHECK (org_id::text = current_setting('request.jwt.claim.org_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reconciliation_codegen_artifacts'
      AND policyname = 'reconciliation_codegen_artifacts_tenant_isolation'
  ) THEN
    CREATE POLICY reconciliation_codegen_artifacts_tenant_isolation
      ON reconciliation_codegen_artifacts
      USING (org_id::text = current_setting('request.jwt.claim.org_id', true))
      WITH CHECK (org_id::text = current_setting('request.jwt.claim.org_id', true));
  END IF;
END $$;
