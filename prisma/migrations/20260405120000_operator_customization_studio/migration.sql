-- Operator Customization Studio: versioned presentation/workflow config, proposals, audit, usage signals.
-- Tenant-scoped; user-scoped layouts via user_id (super-admin console).

CREATE TABLE "operator_customization_states" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL DEFAULT '1',
    "draft_config" JSONB NOT NULL DEFAULT '{}',
    "published_config" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3),
    "draft_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_customization_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_customization_states_tenant_user_surface_key"
  ON "operator_customization_states"("tenant_id", "user_id", "surface");

CREATE INDEX "operator_customization_states_tenant_id_idx" ON "operator_customization_states"("tenant_id");
CREATE INDEX "operator_customization_states_user_id_idx" ON "operator_customization_states"("user_id");

CREATE TABLE "operator_customization_proposals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "natural_language_request" TEXT NOT NULL,
    "structured_patch" JSONB NOT NULL DEFAULT '{}',
    "rationale" TEXT,
    "inference_mode" TEXT NOT NULL DEFAULT 'rules',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),

    CONSTRAINT "operator_customization_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operator_customization_proposals_tenant_id_created_at_idx"
  ON "operator_customization_proposals"("tenant_id", "created_at" DESC);
CREATE INDEX "operator_customization_proposals_user_id_idx" ON "operator_customization_proposals"("user_id");
CREATE INDEX "operator_customization_proposals_status_idx" ON "operator_customization_proposals"("status");

CREATE TABLE "operator_customization_audits" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "surface" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_customization_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operator_customization_audits_tenant_id_created_at_idx"
  ON "operator_customization_audits"("tenant_id", "created_at" DESC);

CREATE TABLE "operator_interaction_signals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "signal_type" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_interaction_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "operator_interaction_signals_tenant_module_created_idx"
  ON "operator_interaction_signals"("tenant_id", "module_id", "created_at" DESC);
CREATE INDEX "operator_interaction_signals_user_id_idx" ON "operator_interaction_signals"("user_id");

ALTER TABLE "operator_customization_states"
  ADD CONSTRAINT "operator_customization_states_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operator_customization_proposals"
  ADD CONSTRAINT "operator_customization_proposals_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operator_customization_audits"
  ADD CONSTRAINT "operator_customization_audits_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operator_interaction_signals"
  ADD CONSTRAINT "operator_interaction_signals_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
