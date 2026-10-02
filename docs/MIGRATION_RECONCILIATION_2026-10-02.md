# Prisma ↔ Supabase Reconciliation — 2026-10-02

Root-cause record of the "PostgreSQL / Prisma / Supabase not matching" failure
class and the applied fixes. All changes additive except column renames on two
tables created earlier the same day by their (buggy) migrations.

## Root causes found (verified, not assumed)

1. **Field/column mapping drift (520 fields).** Prisma models mixed camelCase
   fields without `@map` against snake_case database columns. The generated
   client emits `"userId"`, `"stripeCustomerId"` etc. (confirmed via
   `prisma migrate diff --from-empty --to-schema`), which fails at runtime with
   "column does not exist". Fixed by adding `@map("snake_case")` to every
   unmapped camelCase field in `prisma/schema.prisma` (789 fields touched
   overall). The database convention (snake_case) is the source of truth; the
   206 pre-existing `@map` entries were already correct.

2. **Missing tables (26 models).** `proof_packages`, `evidence_artifacts`,
   `exception_adjudication_memory`, `queue_*`, `workflow_*`, `deploys`,
   `agent_status` and others were declared in the schema but created by **no**
   migration. Added `prisma/migrations/20261002000003_create_missing_model_tables`
   with DDL generated from the declared schema.

3. **Lost operator-mode tables (6).** `alert_history`, `tenant_usage_ceilings`,
   `background_job_limits`, `kill_switches`, `backup_records`,
   `daily_intelligence` were defined in `supabase/migrations/_archive/20260131000001_operator_mode.sql`
   and dropped during the golden-schema consolidation. Restored in
   `20260131000002_restore_operator_mode_tables` (alert_history gained the
   `tenant_id` column the code contract requires).

4. **`CREATE TABLE IF NOT EXISTS` shape drift.** Where an older table existed,
   the guarded CREATE silently skipped and newer columns never landed
   (`run_deltas` +15 analysis columns, `deterministic_match_results` +4).
   Closed by `20261002000001` and `20261002000002`.

5. **Migrations referencing nonexistent objects.** Three migrations were
   unexecutable anywhere:
   - `20260330020000_add_gin_index_to_audit_logs_meta` indexed `meta`; the
     declared and live column is `metadata`. Fixed in place (never applied).
   - `20260330000000_add_index_to_analytics_events` indexed a phantom
     `tenant_id` (no model field, no code reference). Fixed to `(type, timestamp)`.
   - `20260311120000_alert_history_tenant_triggered_index` assumed the lost
     `alert_history` table (restored by #3).

6. **Column naming disagreements between generated migrations and the model.**
   `worker_runs` and `scheduled_jobs` were created with camelCase columns while
   the models map snake_case. Migrations corrected in place and the live
   columns renamed to match the declared schema.

7. **No Prisma bookkeeping.** `_prisma_migrations` did not exist (schema changes
   arrived via Supabase paths). Created and baselined: 32 rows, checksums
   matching `sha256(migration.sql)` exactly, so `prisma migrate status` reports
   a consistent history and `migrate deploy` applies only genuinely new work.

8. **Untracked database migrations.** Four migrations applied via the Supabase
   UI existed only in `supabase_migrations.schema_migrations`; recovered into
   `supabase/migrations/` (design system, decision audit traces, queue system,
   portfolio tables).

## Layout normalization

10 flat `prisma/migrations/*.sql` files were invisible to Prisma and CI
(`prisma/migrations/<14digit>_<name>/migration.sql` contract). All moved into
compliant directories. `add_value_ledger` / `add_rules_engine_moat` had no
timestamps and were versioned from their git-add dates
(`20260919210333`, `20260919210334`).

## Verification (all at reconciliation time)

- Prisma↔Postgres model diff: **0 missing tables, 0 mapping bugs, 0 missing columns**
- All 32 migrations applied and object-verified against the live project
  (`johfcvvmtfiomzxipspz`)
- `_prisma_migrations`: 32 rows / 32 dirs, checksum mismatches: none
- `prisma validate` ✓, `prisma generate` ✓
- `pnpm run db:verify:migrations` 8/8 (contract guards pass, incl. duplicate
  versions and destructive-SQL rejection)

## Post-review hardening (Supabase API, 2026-10-02)

The Hermes reconciliation was reviewed against the live `Settler` project
(`johfcvvmtfiomzxipspz`) through commit `3189a6edd`.

- The live `_prisma_migrations` ledger contains all 34 local Prisma migrations.
  The readiness migration checksum is
  `bc1478ec3b6c754ae10cf4711e161a711c6123a9274769557827aedc8bd40e12`,
  and the annotation-only migration checksum is
  `7ba1dac24e4ead5e2c12ac61e93deb474e0dcb5eb90af2d92af08e17d5fb1f3b`;
  both match their local `migration.sql` files exactly.
- Supabase migration `20261002000005_fix_type_drift_and_cron` is present both
  locally and in the live migration ledger. Live columns now report `text` for
  `usage_aggregate_daily.integration_id` and `integer` for
  `approvers.approval_threshold`; the stale `agent-monitor` cron entry is gone.
  The 12 most recent observed runs of the usage rollup and capacity-alert cron
  jobs all completed successfully.
- All 11 readiness indexes exist with the expected definitions. All 61 tables
  named by the readiness migration have RLS enabled. These tables are
  intentionally server-only and deny browser roles by default, so the Supabase
  `rls_enabled_no_policy` information notices are expected.
- The recovered portfolio policies were named for `service_role` but applied
  to `PUBLIC`. Migration `20261002195244_harden_recovered_supabase_objects`
  now scopes them to `service_role`, gives `themes` and `interaction_events`
  authenticated ownership predicates, pins six trigger-function search paths,
  and removes browser-role function execution.
- Migration `20261002195507_harden_database_advisor_findings` pins and protects
  the internal `capacity_alerts()` helper and removes browser-role access to
  the internal `mv_usage_daily_costs` materialized view.
- A post-apply advisor rerun has no mutable-function-search-path or
  materialized-view-in-API finding. The two hardening migrations are present in
  the live Supabase migration ledger under the same versions as the repository.
- `pnpm verify` passed in 488.6 seconds: repository integrity, lint, strict
  TypeScript, full build, 599 API tests (76 skipped), route and documentation
  contracts, policy/replay checks, tenant isolation, and 36 cross-tenant tests
  (11 skipped).

### Residual live-project backlog (not introduced by the Hermes changes)

The final Supabase advisor scan still reports broad pre-existing debt: 140
anonymous-executable and 145 authenticated-executable `SECURITY DEFINER`
functions, 19 RLS init-plan findings, 213 multiple-permissive-policy findings,
51 duplicate-index findings, and leaked-password protection disabled in Auth.
These require a separate RPC allowlist and policy/index audit; blanket revocation
or deletion would risk breaking intentional public/authenticated APIs.

`alert_history.tenant_id` is nullable by design in the restored DDL because the
operator alert service and privileged route retain an explicit global scope.
The live table had zero rows at review time. This global-row behavior must be
treated as an explicit exception to the otherwise tenant-scoped table contract;
making the column `NOT NULL` requires removing or redesigning that global scope
in the service and scheduled job first.

## Known limits

- Fresh-database provisioning order is: `supabase/migrations/` (golden
  baseline) first, then `prisma migrate deploy`. Prisma-only provisioning from
  empty is not supported (historical ordering between `20260224000000` and
  `20260317500000` assumes the baseline tables exist).
- Prisma model `@@index` declarations are not exhaustively materialized as
  physical indexes; the performance-critical ones from migrations are applied.
- The `_prisma_migrations` history records the reconciled state; per-migration
  apply logs from the reconciliation run are held in the operator's scratch
  log (not committed).
- Direct Prisma schema-engine connectivity from the review environment was not
  available through either the direct host or pooler, so live parity was
  verified through the Supabase management API and SQL rather than by a fresh
  `prisma migrate status` or live `prisma migrate diff` invocation.
