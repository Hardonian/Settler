-- Durable suggestion dismissals + proposal lane / evidence metadata (additive; no reconciliation contract change).

ALTER TABLE "operator_customization_proposals"
  ADD COLUMN "proposal_lane" TEXT NOT NULL DEFAULT 'rules',
  ADD COLUMN "explanation_evidence" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "operator_suggestion_dismissals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surface" TEXT NOT NULL,
    "suggestion_kind" TEXT NOT NULL,
    "suggestion_key" TEXT NOT NULL,
    "reason_category" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_suggestion_dismissals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_suggestion_dismissals_tenant_user_surface_kind_key_key"
  ON "operator_suggestion_dismissals"("tenant_id", "user_id", "surface", "suggestion_kind", "suggestion_key");

CREATE INDEX "operator_suggestion_dismissals_tenant_id_user_id_surface_idx"
  ON "operator_suggestion_dismissals"("tenant_id", "user_id", "surface");

ALTER TABLE "operator_suggestion_dismissals"
  ADD CONSTRAINT "operator_suggestion_dismissals_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
