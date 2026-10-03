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
- `pnpm verify` passed on the final rebased tree in 534.5 seconds: repository
  integrity, lint, strict
  TypeScript, full build, 599 API tests (76 skipped), route and documentation
  contracts, policy/replay checks, tenant isolation, and 36 cross-tenant tests
  (11 skipped).
- `cargo fmt --all -- --check`, workspace clippy with warnings denied, and the
  full Rust workspace tests also passed (14 tests).

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

## 2026-10-03 update — advisor lint sweep, catalog reconciliation, parity
monitoring

All changes are recorded as forward-only migrations under
`supabase/migrations/20261003*` and in `supabase_migrations.schema_migrations`.

RLS (live: `johfcvvmtfiomzxipspz`):

- `multiple_permissive_policies` 213 -> 0 via role-conditioned per-action
  consolidation (`20261003011531_consolidate_permissive_policies`). Every
  consolidated cell keeps its predicate as the OR of the same expressions, with
  `pg_has_role(...)` guards preserving role-set semantics; the equivalence
  manifest is `supabase/consolidation-evidence.json`.
- `auth_rls_initplan` 19 -> 0 (`20261003010424_optimize_rls_initplans`).
- The 61 policy-free RLS tables are strictly server-only: browser-role table
  grants revoked (`20261003012119`); anon/authenticated queries return zero
  rows by deny-by-default policy.
- `alert_history` global scope made explicit (`20261003013025` +
  `20261003013317`): tenant rows visible to members, `tenant_id IS NULL` rows
  visible only to admins; writes remain service-side. `tenant_id` stays NULLABLE
  until the operator alert job and super-admin route semantics are migrated.
  Live-proven by `scripts/probes/assert-alert-history-rls.mjs` (member sees
  own-tenant only; stranger sees 0; admin sees own-tenant + global).

Indexes (`20261003012423_drop_duplicate_indexes`): `duplicate_index` 51 -> 0.
Each pair verified definition-identical (columns + uniqueness) before removal;
constraint-backed indexes kept; the 31 `api_call_logs` partition pairs resolved
at the parent (dropping `idx_api_call_logs_tenant` cascades its 31 loose
children). `table_bloat` 1 -> 0: `VACUUM (FULL, ANALYZE) net._http_response`
(48 MB -> 520 kB). Residual: 2083 `unused_index` findings (INFO) intentionally
NOT dropped — dropping on label alone risks losing index coverage for slow
cadence queries; this needs a per-index query-plan review (backlog).

Migration catalog reconciliation: 53 unrecorded `supabase/migrations` files were
missing from `supabase_migrations.schema_migrations` (plus 2 filename version
collisions, `20250120000000` and `20260313000000`, renamed to
`20250120000010_gap_discovery_phases` and
`20260313000010_final_reconciliation_preview`). Ledger now matches the file
catalog exactly (71 = 71 supabase, 34 = 34 prisma). Permanent monitoring:
`scripts/verify-migration-catalog.mjs` (`pnpm run verify:migration-catalog`, now
also detects duplicate version prefixes) and `.github/workflows/parity-monitor.yml`
(daily: route parity, surface/API-family docs, contract compatibility, migration
catalog parity, `prisma migrate status`).

Verification tooling fixes (root causes, not symptom suppression):

- `verify:route-parity` false-negatives: marketing routes (`/why-settler`,
  `/comparison`, `/security`) are `next.config.js` redirects, not page files.
  The route registry now records redirect/rewrite sources (`routedPaths`), and
  the genuinely missing `/architecture` route was added as a redirect.
- `verify:production-parity` exited 0 with a failing step in its summary. The
  introspection step is now required when `DATABASE_URL` is present and cleanly
  reported as skipped (not passed) when it is not; any failure exits non-zero.
- `find-pipe-dream-signals.ts` `table_no_consumer` consumed only `.from('t')`
  in `packages/`, producing 416 false "high" findings. Consumer detection now
  includes Prisma `@@map`, SQL routines, and quoted dynamic RPC references, and
  the signal is a medium review signal (removing tables is destructive and
  needs human review). Residual review backlog: tables still unconsumed after
  the improved detection are listed in `supabase/pipe-dream-signals.json`.

Schema-engine gap closed: `prisma migrate status` runs green from this
environment (34 migrations, "Database schema is up to date!"). Full
`prisma migrate diff --from-schema --to-config-datasource` is still blocked by
Prisma P4002 (cross-schema FK `public.activity_logs -> auth.users` requires
`auth` in the datasource `schemas` list) — a tooling limit, not schema drift;
parity remains covered by `migrate status` + the nightly catalog check.

Residual risks (unchanged or by design): leaked-password protection
(`auth_leaked_password_protection`) returns HTTP 402 — "Configuring leaked
password protection via HaveIBeenPwned.org is available on Pro Plans and up."
(plan blocker, enable `password_hibp_enabled` after upgrade); 4 anon-executable
SECURITY DEFINER context helpers (`current_tenant_id`, `get_user_tenant_ids`,
`is_admin_user`, `is_tenant_admin`) are required by the `TO (public)` tenant
isolation policies (revoking turns anon reads into errors — see known limits);
2083 `unused_index` findings remain as the review backlog above; the
Open-Source Public Mirror Sync job remains red on its expired
`PUBLIC_MIRROR_GIT_TOKEN`.
