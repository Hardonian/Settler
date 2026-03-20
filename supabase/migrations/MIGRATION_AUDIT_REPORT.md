# SQL Migration Audit Report

**Generated:** 2026-03-18  
**Repository:** Settler  
**Consolidated Baseline:** `00000000000000_consolidated_baseline.sql`

---

## 1. Migrations Analyzed

### Primary Migration Files (supabase/migrations/)

| File                                                       | Purpose                          |
| ---------------------------------------------------------- | -------------------------------- |
| `20240101000000_settler_golden_schema.sql`                 | Golden schema foundation (667KB) |
| `20240101000001_get_tables_function.sql`                   | Utility functions                |
| `20240101000002_table_crud_rpc_functions.sql`              | CRUD RPC functions               |
| `20240101000003_secure_crud_functions.sql`                 | Secure CRUD                      |
| `20240101000004_rls_consolidation.sql`                     | RLS policies                     |
| `20240101000089_support_tickets_sla_tracking.sql`          | Support tickets                  |
| `20241201000000_create_api_call_logs.sql`                  | API logging                      |
| `20241201000001_optimize_api_call_logs.sql`                | Index optimization               |
| `20241201000002_add_log_retention_policy.sql`              | Retention policy                 |
| `20241201000003_enhance_rls_policies.sql`                  | RLS enhancement                  |
| `20250101000000_add_partner_mode.sql`                      | Partner access                   |
| `20250101000001_introspection.sql`                         | Introspection                    |
| `20250101000002_patch.sql`                                 | Schema patches                   |
| `20250101000003_rollback.sql`                              | Rollback functions               |
| `20250101000004_verify.sql`                                | Verification                     |
| `20250101000005_verify_console_setup.sql`                  | Console setup                    |
| `20250102000000_gaps_report.sql`                           | Gap analysis                     |
| `20250120000000_gap_discovery_phases.sql`                  | Discovery phases (20+ tables)    |
| `20250120000000_integrations_framework.sql`                | Connector framework (12 tables)  |
| `20250120000001_add_advisory_locks.sql`                    | Advisory locks                   |
| `20250120000002_enhanced_monitoring.sql`                   | Monitoring tables                |
| `20250121000000_security_billing_enforcement.sql`          | Security & billing               |
| `20250122000000_rls_enforcement_critical.sql`              | Critical RLS enforcement         |
| `20250130000001_python_workhorse_tables.sql`               | Python job queue                 |
| `20250131000000_job_queue_rls.sql`                         | Job queue RLS                    |
| `20250312000000_billing_rls_guards.sql`                    | Billing RLS guards               |
| `20251128200000_resilience_and_indexing.sql`               | Resilience & indexing            |
| `20260107000000_remainder_consolidation.sql`               | Remainder consolidation          |
| `20260107120000_remainder_consolidation.sql`               | Consolidation continued          |
| `20260124000000_postgres_scaling_optimization.sql`         | PostgreSQL optimization          |
| `20260131000001_rls_policy_completion.sql`                 | RLS policy completion            |
| `20260131000002_tenant_indexes_and_idempotency.sql`        | Tenant indexes                   |
| `20260131000003_jobforge_integration.sql`                  | JobForge integration             |
| `20260218000000_red_team_security_controls.sql`            | Security controls                |
| `20260220000000_ingestion_hardening.sql`                   | Ingestion hardening              |
| `20260220000001_enterprise_rls_and_isolation.sql`          | Enterprise RLS                   |
| `20260221000000_infrastructure_settings.sql`               | Infrastructure settings          |
| `20260310000000_system_incidents.sql`                      | System incidents                 |
| `20260313000000_connector_save_normalized_data_atomic.sql` | Connector persistence            |
| `20260313000000_final_reconciliation_preview.sql`          | Reconciliation preview           |
| `20260313010000_sync_run_persistence_truth.sql`            | Sync run persistence             |

### Prisma Migrations (prisma/migrations/)

| File                                                      | Purpose                      |
| --------------------------------------------------------- | ---------------------------- |
| `20260224000000_deterministic_core.sql`                   | Deterministic recon core     |
| `20260224120000_reconciliation_control_plane.sql`         | Reconciliation control plane |
| `20260303090000_phase1_console_metrics.sql`               | Console metrics              |
| `20260311120000_alert_history_tenant_triggered_index.sql` | Alert indexes                |
| `20260317_tenant_governance.sql`                          | Tenant governance            |
| `20260318_add_tenant_id_to_execution_provenance.sql`      | Execution provenance         |
| `20260310103000_operator_control_plane_intelligence/`     | Operator control plane       |
| `20260318000000_add_tolerance_fields_to_template/`        | Template tolerance fields    |

### Archived Migrations (supabase/migrations/\_archive/)

80+ archived migration files representing historical schema evolution, including:

- Billing schemas
- Tenant systems
- Reconciliation core
- Support systems
- Analytics
- And many more experimental features

---

## 2. Final Objects Included in Consolidated Schema

### Extensions

- `uuid-ossp`
- `pgcrypto`
- `pg_trgm`

### Enums (8)

- `customer_segment`
- `email_sequence_type`
- `export_status`
- `issue_severity`
- `issue_status`
- `receipt_event_type`
- `receipt_upload_status`
- `user_lifecycle_stage`

### Tables (50+)

Core infrastructure tables:

- `tenants`, `memberships`, `billing_accounts`, `subscriptions`
- `usage_events`, `usage_aggregate_daily`, `usage_counters`
- `recon_jobs`, `recon_results`, `recon_templates`, `recon_audits`
- `mapping_templates`, `validation_rules`, `transform_recipes`
- `contract_versions`, `drift_events`
- `connectors`, `connector_credentials`, `connector_accounts`
- `sync_runs`, `sync_cursors`
- `financial_transactions`, `financial_balances`, `financial_payouts`
- `financial_invoices`, `financial_subscriptions`, `financial_tax_estimates`
- `raw_events`, `webhook_events`, `ingestion_sources`, `ingestions`
- `jobforge_jobs`, `jobforge_job_results`, `jobforge_job_attempts`
- `receipt_uploads`, `receipts`, `receipt_items`
- `feature_flags`, `feature_flag_environments`, `feature_flag_overrides`
- `webhooks`, `webhook_deliveries`
- `idempotency_keys`, `ingestion_dlq`, `audit_logs`
- `operator_infrastructure_settings`, `system_incidents`
- `audit_notarization_checkpoints`, `api_call_logs`
- `run_snapshots`, `execution_provenance`, `deterministic_match_results`

### Indexes (100+)

All tables have appropriate indexes on:

- Primary keys
- Foreign keys
- Tenant IDs
- Status columns
- Timestamp columns
- Compound indexes for common queries

### Functions (10+)

- `current_tenant_id()` - Tenant context retrieval
- `set_tenant_context()` - Tenant context setting
- `get_user_tenant_ids()` - Multi-tenant user access
- `create_index_if_not_exists()` - Idempotent index creation
- `jobforge_update_updated_at()` - Auto-timestamp trigger
- `compute_audit_notarization_hash()` - Audit integrity
- `write_audit_notarization_checkpoint()` - Audit checkpoints
- `block_audit_log_mutation()` - Append-only enforcement

### RLS Policies (50+)

Comprehensive RLS coverage for:

- All tenant-scoped tables
- Billing accounts and subscriptions
- Recon jobs and results
- Job queue tables
- Feature flags
- Webhooks
- Receipts and exports

---

## 3. Redundant Operations Removed

### Duplicate Constraint Definitions

- **memberships_tenant_id_fkey**: Defined 2x in golden schema - consolidated to single constraint
- **memberships_user_id_fkey**: Defined 2x in golden schema - consolidated
- **memberships_tenant_id_user_id_key**: Defined 2x as both UNIQUE constraint and index - consolidated

### Duplicate Table Creations

- **tenants**: Created in 7+ migrations with slight variations - consolidated to single definition
- **billing_accounts**: Created in 4+ migrations - consolidated
- **recon_jobs**: Created in 3+ migrations - consolidated
- **ingestion_sources**: Created in 2 migrations - consolidated

### Redundant Indexes

- Multiple identical indexes on `tenant_id`, `user_id`, `status` columns
- Consolidated to single index per column combination

---

## 4. Conflicting Policies Normalized

### Policy Conflicts Resolved

1. **idempotency_keys**: Changed from global unique key to compound key `(tenant_id, key)` for tenant isolation
2. **billing_accounts**: Unified SELECT policies to use `user_id = auth.uid()`
3. **recon_jobs**: Consolidated multiple overlapping policies into single policy using `get_user_tenant_ids()`
4. **ingestion_dlq**: Added NULL tenant_id handling for malformed webhooks

### Policy Patterns Standardized

- All tenant-scoped tables use `tenant_id IN (SELECT public.get_user_tenant_ids())`
- All billing tables use billing account ownership check
- Service role bypass policies added where needed for background workers

---

## 5. Indexes Normalized/Added/Removed

### Standardized Index Naming

- `idx_<table>_<column>` pattern for single-column indexes
- `idx_<table>_<columns_joined>` pattern for compound indexes
- Partial indexes where appropriate (e.g., `WHERE status = 'queued'`)

### Added High-Signal Indexes

- `idx_sync_runs_persistence_status` - For recovery queries
- `idx_sync_runs_recovery_required` - For recovery automation
- `idx_jobforge_jobs_claim` - For job claiming efficiency
- `idx_deterministic_match_results_tenant_id` - For tenant queries

### Removed Redundant Indexes

- Duplicate btree indexes on same column(s)
- Indexes on columns already covered by composite indexes

---

## 6. Assumptions Made

1. **Tenant Isolation**: Assumes multi-tenant architecture with `tenant_id` as primary isolation key
2. **Billing Integration**: Assumes Stripe-based billing with `billing_accounts` linking to tenants
3. **JobForge Priority**: JobForge is the primary job queue (newer than python_jobs)
4. **RLS Required**: All user-facing tables require RLS - enabled on all appropriate tables
5. **Service Role Usage**: Background workers use service_role for cross-tenant operations
6. **Append-Only Audit**: audit_logs treated as append-only with trigger protection

---

## 7. Residual Risks / Manual Review Required

### Ambiguities Unable to Resolve

1. **Dual User Tables**
   - Both `auth.users` (Supabase managed) and `public.users` (custom) may exist
   - Some migrations reference one, some the other
   - **Recommendation**: Audit application code to determine which is authoritative

2. **Python Job Queue vs JobForge**
   - Both `python_jobs` and `jobforge_jobs` exist
   - Unclear which is actively used
   - **Recommendation**: Verify which queue system is in production use

3. **Connector vs Ingestion Sources**
   - Both `connectors` and `ingestion_sources` tables exist
   - Potential overlap in functionality
   - **Recommendation**: Determine if tables should be merged or remain separate

4. **Archived Tables Not Included**
   - 80+ tables in `_archive/` directory not included in baseline
   - Some may contain production data
   - **Recommendation**: Review archive and migrate any active tables

5. **RLS on Some Tables May Block Service Operations**
   - Some policies may be too restrictive for background jobs
   - **Recommendation**: Test thoroughly with service_role account

6. **Missing Foreign Keys**
   - Some tables lack FK constraints for performance reasons
   - Example: `recon_jobs.source_adapter` is text, not FK
   - **Recommendation**: Review and add FKs where data integrity is critical

7. **Stripe Events Table**
   - Both `stripe_events` and potentially `stripe_event_log` exist
   - **Recommendation**: Consolidate to single table

---

## 8. Validation Results

### Idempotency Checks

- ✅ All `CREATE TABLE` statements use `IF NOT EXISTS`
- ✅ All `CREATE INDEX` statements use `IF NOT EXISTS`
- ✅ All `ALTER TABLE ADD COLUMN` use `IF NOT EXISTS`
- ✅ All `CREATE POLICY` statements use `DROP POLICY IF EXISTS`

### Dependency Ordering

- ✅ Extensions first
- ✅ Enums before tables that use them
- ✅ Base tables before tables with foreign keys
- ✅ Functions before triggers
- ✅ Tables before RLS policies

### Security Checks

- ✅ All tenant-scoped tables have RLS enabled
- ✅ SECURITY DEFINER functions have explicit `search_path` set
- ✅ Service role bypass policies added where necessary
- ✅ Tenant isolation enforced on all critical tables

---

## 9. Files Created

1. **`supabase/migrations/00000000000000_consolidated_baseline.sql`**
   - Single consolidated baseline migration
   - ~2500 lines of SQL
   - Idempotent and production-safe

2. **`supabase/migrations/MIGRATION_AUDIT_REPORT.md`**
   - This audit report
   - Documents all analysis and decisions

---

## 10. Usage Instructions

To apply this consolidated baseline to a new database:

```bash
# Apply the consolidated baseline
psql -h <host> -U <user> -d <database> -f supabase/migrations/00000000000000_consolidated_baseline.sql

# Verify RLS is enabled
psql -h <host> -U <user> -d <database> -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

**Note:** This baseline should be applied to a fresh database. If applied to an existing database with data, review the idempotency carefully and consider running in a transaction with appropriate error handling.

---

_End of Report_
