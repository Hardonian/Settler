-- Production-readiness pass (2026-10-02): performance indexes + RLS coverage.
-- Recorded so fresh provisioning reproduces the optimized live database.
-- All statements idempotent. The live database received the same DDL with
-- CREATE INDEX CONCURRENTLY (non-blocking); these IF NOT EXISTS forms are
-- equivalent for empty/fresh databases.

-- FK-supporting indexes (unindexed FKs slow joins and ON DELETE checks)
CREATE INDEX IF NOT EXISTS idx_entity_performance_portfolio_id ON entity_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_tenant_governance_frozen_by ON tenant_governance(frozen_by);
CREATE INDEX IF NOT EXISTS idx_kill_switches_created_by ON kill_switches(created_by);
CREATE INDEX IF NOT EXISTS idx_exception_adjudication_memory_parent ON exception_adjudication_memory(parent_memory_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_intelligence_log_source ON portfolio_intelligence_log(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_intelligence_log_target ON portfolio_intelligence_log(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_risk_events_entity ON portfolio_risk_events(entity_id);

-- Function-hot-path indexes (filters taken from pg_proc sources; the polling
-- functions check_degraded_mode / cleanup_stale_presence /
-- process_unresolved_confusion / realtime_limit_alerts run every few seconds)
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_status_open ON circuit_breakers(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);
CREATE INDEX IF NOT EXISTS idx_user_confusion_events_unresolved ON user_confusion_events(detected_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_realtime_limits_window_start ON realtime_limits(window_start);

-- RLS coverage: enable on all public tables created outside the golden-schema
-- migrations. Server-side flows use the postgres table owner (bypasses RLS);
-- anon/authenticated get deny-by-default until per-table policies are authored.
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_job_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deploys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drift_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exception_adjudication_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exception_archetype_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exception_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_customization_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_customization_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_customization_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_error_issue_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_interaction_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_suggestion_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_evolution_proposal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_evolution_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_memory_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_outcome_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sla_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sla_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_workbench_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage_ceilings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_export_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_ledger_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
