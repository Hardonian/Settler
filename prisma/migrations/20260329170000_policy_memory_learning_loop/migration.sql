CREATE TABLE IF NOT EXISTS policy_memory_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_key TEXT NOT NULL,
  signature_key TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  degraded BOOLEAN NOT NULL DEFAULT false,
  degraded_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT policy_memory_artifacts_tenant_artifact_key_unique UNIQUE (tenant_id, artifact_key)
);

CREATE INDEX IF NOT EXISTS policy_memory_artifacts_tenant_idx ON policy_memory_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS policy_memory_artifacts_type_idx ON policy_memory_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS policy_memory_artifacts_signature_idx ON policy_memory_artifacts(signature_key);

CREATE TABLE IF NOT EXISTS policy_evolution_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  proposal_key TEXT NOT NULL,
  proposal_type TEXT NOT NULL,
  signature_key TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  why TEXT NOT NULL,
  historical_support JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT policy_evolution_proposals_tenant_proposal_key_unique UNIQUE (tenant_id, proposal_key)
);

CREATE INDEX IF NOT EXISTS policy_evolution_proposals_tenant_idx ON policy_evolution_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS policy_evolution_proposals_signature_idx ON policy_evolution_proposals(signature_key);
CREATE INDEX IF NOT EXISTS policy_evolution_proposals_status_idx ON policy_evolution_proposals(status);

CREATE TABLE IF NOT EXISTS policy_evolution_proposal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL REFERENCES policy_evolution_proposals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_user_id UUID NULL,
  reason TEXT NULL,
  prior_status TEXT NOT NULL,
  resulting_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_evolution_proposal_reviews_tenant_idx ON policy_evolution_proposal_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS policy_evolution_proposal_reviews_proposal_idx ON policy_evolution_proposal_reviews(proposal_id);
CREATE INDEX IF NOT EXISTS policy_evolution_proposal_reviews_created_at_idx ON policy_evolution_proposal_reviews(created_at);
