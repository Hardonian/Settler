# Zero-Downtime PostgreSQL & Prisma Migration Policy

This document establishes the non-negotiable migration rules for Settler's multi-tenant ledger database. During 100k tx/s production ingestion, database locks must never halt transaction processing.

## 1. Expand and Contract Pattern

All schema changes must follow a three-phase deployment sequence:

### Phase 1: Expand (Additive Changes Only)
- New columns must be added as **NULLABLE** or with a non-volatile **DEFAULT**.
- New tables must have Row-Level Security (RLS) enabled before deployment.
- Never add `NOT NULL` columns without a default value.
- Never drop a column or rename a table in Phase 1.

### Phase 2: Dual-Writing & Backfill
- Application code writes to both old and new columns.
- Background backfill jobs populate missing data in batches with `sleep` intervals.

### Phase 3: Contract (Deprecation & Removal)
- Application code removes reads and writes to legacy columns.
- Safe drop of deprecated columns during scheduled maintenance windows.

## 2. Invariant Rules for Prisma Migrations

1. **No Table Rewrites**: Never run operations that require an exclusive table lock (`ACCESS EXCLUSIVE`) for more than 50ms.
2. **Index Creation**: Always use `CREATE INDEX CONCURRENTLY`. Never block write operations.
3. **Foreign Keys**: Add foreign keys with `NOT VALID`, then run `VALIDATE CONSTRAINT` asynchronously.
4. **Tenant Scoping**: All tenant-scoped tables must have `tenant_id UUID NOT NULL` indexed and covered by RLS policies.
