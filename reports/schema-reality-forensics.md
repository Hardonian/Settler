# Supabase Schema Reality Forensics (Local Execution)

## Canonical migration source

- **Canonical source used:** `supabase/migrations/*.sql`.
- **Why:** Supabase-oriented GitHub workflows (`supabase-migrate.yml`, `migrations-safe.yml`, `auto-migrate-on-main.yml`) apply SQL from this directory directly, while Prisma migrations coexist mainly for app-side tooling and are not the primary Supabase deployment path.

## Environment and DB connection attempt

- Attempted runtime connection using `DATABASE_URL || DIRECT_URL || SUPABASE_DB_URL`.
- Result: no live DB connection string was available in the current shell session.

Commands and outcomes:

```bash
env | rg "DATABASE_URL|DIRECT_URL|SUPABASE|POSTGRES"
# => no configured DB env vars

npx tsx scripts/supabase-schema-reality-audit.ts
# => Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL

bash scripts/run-preview-reconciliation.sh dry-run
# => Missing DATABASE_URL, DIRECT_URL, or SUPABASE_DB_URL
```

## What was still produced

1. Deterministic reality-audit script:
   - Parses repo migrations into expected object inventory.
   - Connects to live DB (when env is present).
   - Produces machine-readable and markdown reports with missing objects.

2. Final reconciliation SQL artifact for controlled preview execution:
   - `supabase/migrations/20260313000000_final_reconciliation_preview.sql`
   - Additive and guarded; no drops.

3. Preview GitHub Action path:
   - `.github/workflows/preview-db-reconciliation.yml`
   - Uses preview environment secrets, runs audit, performs dry-run always, and applies only on explicit `workflow_dispatch` with `apply=true`.

4. DB target guardrail runner:
   - `scripts/run-preview-reconciliation.sh`
   - Refuses production-like targets unless explicitly overridden.

## Residual risk

- Live-schema vs expected-schema drift **cannot be proven locally** until preview DB secrets are present in environment or the new workflow is run in GitHub Actions `preview` environment.
- Consolidated SQL currently captures high-confidence additive intent from committed migration history; any additional drift discovered by audit should be appended based on generated report evidence.
