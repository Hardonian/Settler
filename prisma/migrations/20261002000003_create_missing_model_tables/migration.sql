-- Create tables for Prisma models that had no DDL in any migration (declared in
-- prisma/schema.prisma but never materialized; verified missing from the live
-- database 2026-10-02). DDL generated from the declared schema via
-- `prisma migrate diff --from-empty --to-schema`, so columns match the models
-- exactly (snake_case via @map). All additive.

CREATE TABLE "workspace_invites" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exception_archetypes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "severity_default" TEXT NOT NULL DEFAULT 'medium',
    "typical_resolution" TEXT,
    "resolution_taxonomy" JSONB NOT NULL DEFAULT '[]',
    "match_pattern" JSONB,
    "match_field_weights" JSONB DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "occurrence_count" INTEGER NOT NULL DEFAULT 0,
    "last_occurrence_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "exception_archetypes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exception_archetype_classifications" (
    "id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "archetype_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "match_features" JSONB NOT NULL DEFAULT '{}',
    "classified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classified_by" TEXT NOT NULL DEFAULT 'system',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "exception_archetype_classifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "exception_adjudication_memory" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "archetype_id" UUID,
    "resolution" TEXT NOT NULL,
    "resolution_reason" TEXT,
    "resolution_code" TEXT,
    "adjudicator_id" UUID NOT NULL,
    "adjudicator_type" TEXT NOT NULL DEFAULT 'operator',
    "adjudication_type" TEXT NOT NULL DEFAULT 'initial',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_ms" BIGINT,
    "outcome" TEXT,
    "confidence" DECIMAL(5,4),
    "reversibility" TEXT,
    "parent_memory_id" UUID,
    "escalated_to" TEXT,
    "escalation_reason" TEXT,
    "evidence_ids" JSONB NOT NULL DEFAULT '[]',
    "source_trust_score" DECIMAL(5,4),
    "annotations" JSONB NOT NULL DEFAULT '{}',
    "operator_notes" TEXT,
    "system_notes" TEXT,
    "suggested_policy_change" JSONB,
    "policy_change_accepted" BOOLEAN,
    "entry_hash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exception_adjudication_memory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queue_workbench_views" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "view_type" TEXT NOT NULL DEFAULT 'personal',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "sort_config" JSONB NOT NULL DEFAULT '{}',
    "column_config" JSONB NOT NULL DEFAULT '[]',
    "group_by" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "scope_filters" JSONB NOT NULL DEFAULT '{}',
    "refresh_interval" INTEGER,
    "highlight_rules" JSONB NOT NULL DEFAULT '[]',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "queue_workbench_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queue_sla_configs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sla_config" JSONB NOT NULL,
    "escalation_timers" JSONB NOT NULL DEFAULT '{}',
    "business_hours_only" BOOLEAN NOT NULL DEFAULT false,
    "business_hours" JSONB,
    "applies_to" TEXT NOT NULL DEFAULT 'all',
    "scope_filter" JSONB NOT NULL DEFAULT '{}',
    "auto_escalate_on_breach" BOOLEAN NOT NULL DEFAULT true,
    "escalation_target" TEXT,
    "breach_notifications" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "queue_sla_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queue_sla_breaches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "sla_config_id" UUID NOT NULL,
    "user_id" UUID,
    "severity" TEXT NOT NULL,
    "archetype_code" TEXT,
    "sla_target_seconds" INTEGER NOT NULL,
    "elapsed_seconds" INTEGER NOT NULL,
    "breach_seconds" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'breached',
    "breached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "escalated_to" TEXT,
    "escalated_at" TIMESTAMP(3),
    "escalation_accepted_at" TIMESTAMP(3),
    "waive_reason" TEXT,
    "waived_by" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_sla_breaches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "queue_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "job_id" UUID,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_open" INTEGER NOT NULL DEFAULT 0,
    "total_in_progress" INTEGER NOT NULL DEFAULT 0,
    "total_resolved" INTEGER NOT NULL DEFAULT 0,
    "total_dismissed" INTEGER NOT NULL DEFAULT 0,
    "total_breached" INTEGER NOT NULL DEFAULT 0,
    "avg_age_seconds" BIGINT NOT NULL DEFAULT 0,
    "oldest_age_seconds" BIGINT NOT NULL DEFAULT 0,
    "median_age_seconds" BIGINT NOT NULL DEFAULT 0,
    "resolved_in_period" INTEGER NOT NULL DEFAULT 0,
    "dismissed_in_period" INTEGER NOT NULL DEFAULT 0,
    "reopened_in_period" INTEGER NOT NULL DEFAULT 0,
    "avg_resolution_time_seconds" BIGINT NOT NULL DEFAULT 0,
    "p50_resolution_time_seconds" BIGINT NOT NULL DEFAULT 0,
    "p95_resolution_time_seconds" BIGINT NOT NULL DEFAULT 0,
    "p99_resolution_time_seconds" BIGINT NOT NULL DEFAULT 0,
    "sla_compliance_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "on_time_count" INTEGER NOT NULL DEFAULT 0,
    "breached_count" INTEGER NOT NULL DEFAULT 0,
    "unique_operators" INTEGER NOT NULL DEFAULT 0,
    "workload_std_dev" DECIMAL(5,4),
    "archetype_breakdown" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidence_artifacts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "artifact_type" TEXT NOT NULL,
    "artifact_key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "payload_size_bytes" INTEGER,
    "source_type" TEXT,
    "source_id" TEXT,
    "captured_by" TEXT NOT NULL DEFAULT 'system',
    "captured_by_user_id" UUID,
    "run_id" UUID,
    "exception_id" UUID,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "expired_at" TIMESTAMP(3),
    "reliability_score" DECIMAL(5,4),
    "reliability_factors" JSONB NOT NULL DEFAULT '[]',
    "degraded" BOOLEAN NOT NULL DEFAULT false,
    "degraded_reasons" JSONB NOT NULL DEFAULT '[]',
    "degraded_at" TIMESTAMP(3),
    "attested" BOOLEAN NOT NULL DEFAULT false,
    "attested_by" UUID,
    "attested_at" TIMESTAMP(3),
    "attestation_method" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "superseded_by" UUID,
    "superseded_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proof_packages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "package_type" TEXT NOT NULL,
    "package_key" TEXT NOT NULL,
    "evidence_ids" JSONB NOT NULL DEFAULT '[]',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "narrative" TEXT,
    "completeness_score" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "missing_evidence" JSONB NOT NULL DEFAULT '[]',
    "completeness_flags" JSONB NOT NULL DEFAULT '[]',
    "package_hash" TEXT NOT NULL,
    "signature" TEXT,
    "attested" BOOLEAN NOT NULL DEFAULT false,
    "attestations" JSONB NOT NULL DEFAULT '[]',
    "scope" TEXT NOT NULL DEFAULT 'run',
    "scope_ids" JSONB NOT NULL DEFAULT '[]',
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "export_format" TEXT,
    "exported_at" TIMESTAMP(3),
    "exported_by" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "finalized_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proof_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "policy_outcome_ledger" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "policy_fingerprint" TEXT NOT NULL,
    "total_adjudications" INTEGER NOT NULL DEFAULT 0,
    "resolution_breakdown" JSONB NOT NULL DEFAULT '{}',
    "avg_confidence_score" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "exception_archetypes" JSONB NOT NULL DEFAULT '[]',
    "common_resolutions" JSONB NOT NULL DEFAULT '[]',
    "suggested_tuning" JSONB,
    "trust_score" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "trust_signals" JSONB NOT NULL DEFAULT '[]',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observation_window" INTEGER NOT NULL DEFAULT 30,
    "reversal_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "accuracy_score" DECIMAL(5,4),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_outcome_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "retention_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "pruned_count" INTEGER NOT NULL DEFAULT 0,
    "storage_bytes" BIGINT NOT NULL DEFAULT 0,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" BIGINT NOT NULL DEFAULT 0,
    "run_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_delegations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "delegator_id" UUID NOT NULL,
    "delegate_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "request_types" JSONB NOT NULL DEFAULT '[]',
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_delegations" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_status" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agents" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "agent_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "monitoring_alerts" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID,
    "message" TEXT NOT NULL,
    "status" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deploys" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID,
    "env" TEXT NOT NULL,
    "commit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "url" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deploys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_audits" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" UUID,
    "scan_time" TIMESTAMP(3),
    "issues" JSONB,
    "summary" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "triggers" JSONB NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduled_workflows" (
    "id" UUID NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "cron_expression" TEXT,
    "schedule_type" TEXT,
    "schedule_config" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_execution_logs" (
    "id" UUID NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "error" TEXT,
    "tenant_id" UUID NOT NULL,

    CONSTRAINT "workflow_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "detection_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detection_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "anomalies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "policy_comparisons" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sections_added" INTEGER NOT NULL,
    "sections_removed" INTEGER NOT NULL,
    "sections_modified" INTEGER NOT NULL,
    "compliance_score" DOUBLE PRECISION NOT NULL,
    "violation_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dpias" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "activity_name" TEXT NOT NULL,
    "overall_risk" TEXT NOT NULL,
    "risk_count" INTEGER NOT NULL,
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nudge_policies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "channel" TEXT NOT NULL DEFAULT 'email',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nudge_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nudge_actions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "target_contact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'dry_run',
    "execute_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nudge_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_invites_token_key" ON "workspace_invites"("token");

CREATE INDEX "workspace_invites_tenant_id_idx" ON "workspace_invites"("tenant_id");

CREATE INDEX "workspace_invites_email_idx" ON "workspace_invites"("email");

CREATE INDEX "workspace_invites_token_idx" ON "workspace_invites"("token");

CREATE INDEX "workspace_invites_status_idx" ON "workspace_invites"("status");

CREATE INDEX "workspace_invites_expires_at_idx" ON "workspace_invites"("expires_at");

CREATE INDEX "exception_archetypes_tenant_id_idx" ON "exception_archetypes"("tenant_id");

CREATE INDEX "exception_archetypes_category_idx" ON "exception_archetypes"("category");

CREATE INDEX "exception_archetypes_is_active_idx" ON "exception_archetypes"("is_active");

CREATE INDEX "exception_archetypes_occurrence_count_idx" ON "exception_archetypes"("occurrence_count" DESC);

CREATE UNIQUE INDEX "exception_archetypes_tenant_id_code_key" ON "exception_archetypes"("tenant_id", "code");

CREATE INDEX "exception_archetype_classifications_exception_id_idx" ON "exception_archetype_classifications"("exception_id");

CREATE INDEX "exception_archetype_classifications_archetype_id_idx" ON "exception_archetype_classifications"("archetype_id");

CREATE INDEX "exception_archetype_classifications_tenant_id_idx" ON "exception_archetype_classifications"("tenant_id");

CREATE INDEX "exception_archetype_classifications_confidence_idx" ON "exception_archetype_classifications"("confidence");

CREATE INDEX "exception_archetype_classifications_classified_at_idx" ON "exception_archetype_classifications"("classified_at");

CREATE UNIQUE INDEX "exception_archetype_classifications_exception_id_archetype__key" ON "exception_archetype_classifications"("exception_id", "archetype_id");

CREATE INDEX "exception_adjudication_memory_tenant_id_idx" ON "exception_adjudication_memory"("tenant_id");

CREATE INDEX "exception_adjudication_memory_exception_id_idx" ON "exception_adjudication_memory"("exception_id");

CREATE INDEX "exception_adjudication_memory_archetype_id_idx" ON "exception_adjudication_memory"("archetype_id");

CREATE INDEX "exception_adjudication_memory_adjudicator_id_idx" ON "exception_adjudication_memory"("adjudicator_id");

CREATE INDEX "exception_adjudication_memory_resolution_idx" ON "exception_adjudication_memory"("resolution");

CREATE INDEX "exception_adjudication_memory_outcome_idx" ON "exception_adjudication_memory"("outcome");

CREATE INDEX "exception_adjudication_memory_created_at_idx" ON "exception_adjudication_memory"("created_at" DESC);

CREATE INDEX "exception_adjudication_memory_tenant_id_resolution_created__idx" ON "exception_adjudication_memory"("tenant_id", "resolution", "created_at" DESC);

CREATE INDEX "queue_workbench_views_tenant_id_idx" ON "queue_workbench_views"("tenant_id");

CREATE INDEX "queue_workbench_views_user_id_idx" ON "queue_workbench_views"("user_id");

CREATE INDEX "queue_workbench_views_scope_idx" ON "queue_workbench_views"("scope");

CREATE INDEX "queue_workbench_views_is_default_idx" ON "queue_workbench_views"("is_default");

CREATE INDEX "queue_workbench_views_is_favorite_idx" ON "queue_workbench_views"("is_favorite");

CREATE INDEX "queue_sla_configs_tenant_id_idx" ON "queue_sla_configs"("tenant_id");

CREATE INDEX "queue_sla_configs_is_active_idx" ON "queue_sla_configs"("is_active");

CREATE INDEX "queue_sla_configs_is_default_idx" ON "queue_sla_configs"("is_default");

CREATE UNIQUE INDEX "queue_sla_configs_tenant_id_name_key" ON "queue_sla_configs"("tenant_id", "name");

CREATE INDEX "queue_sla_breaches_tenant_id_idx" ON "queue_sla_breaches"("tenant_id");

CREATE INDEX "queue_sla_breaches_exception_id_idx" ON "queue_sla_breaches"("exception_id");

CREATE INDEX "queue_sla_breaches_sla_config_id_idx" ON "queue_sla_breaches"("sla_config_id");

CREATE INDEX "queue_sla_breaches_status_idx" ON "queue_sla_breaches"("status");

CREATE INDEX "queue_sla_breaches_breached_at_idx" ON "queue_sla_breaches"("breached_at" DESC);

CREATE INDEX "queue_metrics_tenant_id_idx" ON "queue_metrics"("tenant_id");

CREATE INDEX "queue_metrics_job_id_idx" ON "queue_metrics"("job_id");

CREATE INDEX "queue_metrics_period_start_idx" ON "queue_metrics"("period_start" DESC);

CREATE UNIQUE INDEX "queue_metrics_tenant_id_job_id_period_start_key" ON "queue_metrics"("tenant_id", "job_id", "period_start");

CREATE INDEX "evidence_artifacts_tenant_id_idx" ON "evidence_artifacts"("tenant_id");

CREATE INDEX "evidence_artifacts_artifact_type_idx" ON "evidence_artifacts"("artifact_type");

CREATE INDEX "evidence_artifacts_run_id_idx" ON "evidence_artifacts"("run_id");

CREATE INDEX "evidence_artifacts_exception_id_idx" ON "evidence_artifacts"("exception_id");

CREATE INDEX "evidence_artifacts_captured_at_idx" ON "evidence_artifacts"("captured_at" DESC);

CREATE INDEX "evidence_artifacts_is_expired_idx" ON "evidence_artifacts"("is_expired");

CREATE UNIQUE INDEX "evidence_artifacts_tenant_id_artifact_key_key" ON "evidence_artifacts"("tenant_id", "artifact_key");

CREATE INDEX "proof_packages_tenant_id_idx" ON "proof_packages"("tenant_id");

CREATE INDEX "proof_packages_package_type_idx" ON "proof_packages"("package_type");

CREATE INDEX "proof_packages_status_idx" ON "proof_packages"("status");

CREATE INDEX "proof_packages_created_at_idx" ON "proof_packages"("created_at" DESC);

CREATE UNIQUE INDEX "proof_packages_tenant_id_package_key_key" ON "proof_packages"("tenant_id", "package_key");

CREATE INDEX "policy_outcome_ledger_tenant_id_idx" ON "policy_outcome_ledger"("tenant_id");

CREATE INDEX "policy_outcome_ledger_trust_score_idx" ON "policy_outcome_ledger"("trust_score");

CREATE INDEX "policy_outcome_ledger_last_seen_at_idx" ON "policy_outcome_ledger"("last_seen_at" DESC);

CREATE UNIQUE INDEX "policy_outcome_ledger_tenant_id_policy_fingerprint_key" ON "policy_outcome_ledger"("tenant_id", "policy_fingerprint");

CREATE INDEX "retention_metrics_tenant_id_idx" ON "retention_metrics"("tenant_id");

CREATE INDEX "retention_metrics_run_date_idx" ON "retention_metrics"("run_date" DESC);

CREATE UNIQUE INDEX "retention_metrics_tenant_id_run_date_key" ON "retention_metrics"("tenant_id", "run_date");

CREATE INDEX "approval_delegations_tenant_id_idx" ON "approval_delegations"("tenant_id");

CREATE INDEX "approval_delegations_delegator_id_idx" ON "approval_delegations"("delegator_id");

CREATE INDEX "approval_delegations_delegate_id_idx" ON "approval_delegations"("delegate_id");

CREATE INDEX "approval_delegations_is_active_idx" ON "approval_delegations"("is_active");

CREATE UNIQUE INDEX "approval_delegations_tenant_id_delegator_id_delegate_id_rol_key" ON "approval_delegations"("tenant_id", "delegator_id", "delegate_id", "role");

CREATE INDEX "agent_status_tenant_id_idx" ON "agent_status"("tenant_id");

CREATE INDEX "monitoring_alerts_tenant_id_idx" ON "monitoring_alerts"("tenant_id");

CREATE INDEX "deploys_tenant_id_idx" ON "deploys"("tenant_id");

CREATE INDEX "security_audits_tenant_id_idx" ON "security_audits"("tenant_id");

CREATE INDEX "workflow_definitions_tenant_id_idx" ON "workflow_definitions"("tenant_id");

CREATE INDEX "scheduled_workflows_tenant_id_idx" ON "scheduled_workflows"("tenant_id");

CREATE INDEX "scheduled_workflows_workflow_id_idx" ON "scheduled_workflows"("workflow_id");

CREATE INDEX "workflow_execution_logs_tenant_id_idx" ON "workflow_execution_logs"("tenant_id");

CREATE INDEX "workflow_execution_logs_workflow_id_idx" ON "workflow_execution_logs"("workflow_id");

CREATE INDEX "workflow_execution_logs_run_id_idx" ON "workflow_execution_logs"("run_id");

CREATE INDEX "detection_rules_tenant_id_idx" ON "detection_rules"("tenant_id");

CREATE INDEX "anomalies_tenant_id_idx" ON "anomalies"("tenant_id");

CREATE INDEX "anomalies_type_idx" ON "anomalies"("type");

CREATE INDEX "anomalies_severity_idx" ON "anomalies"("severity");

CREATE INDEX "policy_comparisons_tenant_id_idx" ON "policy_comparisons"("tenant_id");

CREATE INDEX "dpias_tenant_id_idx" ON "dpias"("tenant_id");

CREATE INDEX "nudge_policies_tenant_id_idx" ON "nudge_policies"("tenant_id");

CREATE INDEX "nudge_policies_is_active_idx" ON "nudge_policies"("is_active");

CREATE INDEX "nudge_actions_tenant_id_idx" ON "nudge_actions"("tenant_id");

CREATE INDEX "nudge_actions_policy_id_idx" ON "nudge_actions"("policy_id");

CREATE INDEX "nudge_actions_status_idx" ON "nudge_actions"("status");

ALTER TABLE "exception_archetype_classifications" ADD CONSTRAINT "exception_archetype_classifications_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "reconciliation_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exception_archetype_classifications" ADD CONSTRAINT "exception_archetype_classifications_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "exception_archetypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exception_adjudication_memory" ADD CONSTRAINT "exception_adjudication_memory_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "reconciliation_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exception_adjudication_memory" ADD CONSTRAINT "exception_adjudication_memory_archetype_id_fkey" FOREIGN KEY ("archetype_id") REFERENCES "exception_archetypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "exception_adjudication_memory" ADD CONSTRAINT "exception_adjudication_memory_parent_memory_id_fkey" FOREIGN KEY ("parent_memory_id") REFERENCES "exception_adjudication_memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "scheduled_workflows" ADD CONSTRAINT "scheduled_workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "detection_rules" ADD CONSTRAINT "detection_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_comparisons" ADD CONSTRAINT "policy_comparisons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dpias" ADD CONSTRAINT "dpias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nudge_policies" ADD CONSTRAINT "nudge_policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nudge_actions" ADD CONSTRAINT "nudge_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nudge_actions" ADD CONSTRAINT "nudge_actions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "nudge_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
