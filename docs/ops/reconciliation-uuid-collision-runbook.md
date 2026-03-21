# Runbook: `RECONCILIATION_UUID_COLLISION` (409)

## What it means

For a given `tenant_id`, the same UUID value exists as **both**:

- `recon_jobs.id`, and
- `reconciliation_runs.id`

The API refuses to guess which row is authoritative and returns **409** with:

- `code`: `RECONCILIATION_UUID_COLLISION`
- `extra.duplicate_uuid`
- `extra.recon_job_id`
- `extra.reconciliation_run_id`

This is **not** a user-actionable “merge conflict” in the product sense; it is an **internal data integrity anomaly**.

## Likely causes

1. **Seed or migration** inserted fixed UUIDs into both tables.
2. **Manual SQL** or tooling copied an id across models.
3. **Extremely rare** random UUID collision (treat as suspicious until proven otherwise).

## Detection

- API logs (Express): `reconciliation_uuid_collision` via structured `logWarn` from startup hook in `packages/api/src/index.ts`.
- Response: Problem+JSON on v1 routes; JSON on console list/detail if extended to the same resolver.

## Inspection (Postgres)

As an operator with DB access, for a reported `duplicate_uuid` and `tenant_id`:

```sql
SELECT id, tenant_id, name, status, created_at
FROM recon_jobs
WHERE id = '<duplicate_uuid>' AND tenant_id = '<tenant_id>';

SELECT id, tenant_id, ingestion_id, status, started_at, created_at
FROM reconciliation_runs
WHERE id = '<duplicate_uuid>' AND tenant_id = '<tenant_id>';
```

Compare timestamps, provenance metadata, and whether either row is referenced by foreign keys (`reconciliation_matches.run_id`, exports, etc.).

## Determining authority

- If **only one** row has **downstream children** (matches, exports), prefer keeping that row and **re-id or delete** the orphan after a written plan.
- If **both** have children, escalate: this may require a **data repair migration** and product decision.

## Mitigation (high level)

1. **Freeze** automated jobs touching the tenant until scope is clear.
2. **Rename** one UUID (new uuidv4) _only_ with a transaction that updates all FKs, or **delete** the clearly bogus row.
3. **Re-run** reconciliation or backfill as needed after repair.
4. **Document** the incident in internal change records.

## Escalation

Escalate when:

- Both rows have dependent data, or
- The collision appears across multiple tenants, or
- Root cause points to application bug (duplicate id generation).

## User-facing impact

- **Internal operators / API clients**: see 409 with machine-readable code.
- **End users**: typically none unless they hit a misconfigured integration; treat as platform incident if widespread.
