# Reconciliation read contract (canonical)

## Scope

This note defines how **recon jobs** (`recon_jobs` + `recon_results`) and **ingestion reconciliation runs** (`reconciliation_runs`) are exposed on read paths so Express (`/api/v1/reconciliation/*`) and Next (`/api/console/reconciliation`) do not drift.

## Single mapping source

Shared package: `packages/reconciliation-core` (`@settler/reconciliation-core`).

- **Canonical job/result math** (counts, lifecycle, drift, row materialization): `canonical-run-result.ts` (moved from web; web re-exports it).
- **Unified list/detail DTOs**: `canonical-reconciliation.ts`.
- **Merged list pagination** (dual-stream keyset cursors): `merged-list-pagination.ts`, `merged-runs-query.ts`.
- **Cross-table UUID resolution** (no silent pick): `run-resolution.ts`.

## Run kinds

| `run_kind`      | Primary table(s)              | Notes                                                                 |
| --------------- | ----------------------------- | --------------------------------------------------------------------- |
| `recon_job`     | `recon_jobs`, `recon_results` | Durable job definition + latest result row.                           |
| `ingestion_run` | `reconciliation_runs`         | Ingestion-scoped execution; matches live in `reconciliation_matches`. |

## Express v1

### `GET /api/v1/reconciliation/runs`

- **Merged** listing when `run_kind=all` (default).
- **Query**: `limit` (1–500), `cursor` (opaque), `run_kind=all|recon_job|ingestion_run`.
- **Response**: `contract_version`, `runs[]` (canonical list items), `next_cursor`, `pagination`, `response_meta`.
- **Ordering**: `recon_jobs` by `created_at DESC, id DESC`; `reconciliation_runs` by `GREATEST(started_at, created_at) DESC NULLS LAST, id DESC`; merged by sort time then UUID tie-break (lexicographic desc).

### `GET /api/v1/reconciliation/runs/:id`

- Resolves **exactly one** backing row per tenant, or returns typed errors.
- **Body**: `contract_version`, `run_kind`, `capabilities` (booleans derived from `run_kind`: `matches`, `workbench`, `compare`, `export`, `consoleResults`), `canonical` (full detail DTO), `legacy_v1` (field names matching the historical SQL-shaped detail for ingestion runs where applicable), `traceId`.
- **UI / clients**: branch on `run_kind` or `capabilities` before calling ingestion-only child routes; do not send `recon_job` ids to matches/workbench/compare/export.

### Workbench / matches / compare / export

These operate on **`reconciliation_runs` only**. If `:id` resolves to a `recon_job`, the API returns **409** `RECONCILIATION_WRONG_RUN_KIND` with a hint to use the canonical detail route.

`GET .../matches` and workbench routes clamp `limit` to **1–500** (default 100) and reject negative `offset` by normalizing to `0`.

### UUID collision

If the same UUID exists in **both** `recon_jobs` and `reconciliation_runs` for a tenant, detail and workbench gates return **409** `RECONCILIATION_UUID_COLLISION` with both row ids in `extra`. This indicates a **data anomaly** (import/seed overlap, bad migration, or extremely unlikely random collision)—not a normal client error.

## Next console: `GET /api/console/reconciliation`

- **Default** `run_kind=recon_job` preserves historical “jobs only” `reconciliations[]` shape for list calls without query params.
- **`run_kind=all`**: response includes `runs` (canonical merged list) plus `reconciliations` (job-shaped projection for backward compatibility) and real `next_cursor`.
- **`run_kind=ingestion_run`**: only ingestion stream; `reconciliations` is `[]`.

## Cursor format (v1)

Base64url JSON:

```json
{ "v": 1, "ij": { "t": "<ISO>", "id": "<uuid>" } | null, "ir": { "t": "<ISO>", "id": "<uuid>" } | null }
```

Each stream carries its own continuation; malformed cursors return **400** with `RECONCILIATION_CURSOR_INVALID` (Next) or Problem+JSON (Express).

## Consistency

Pagination is **read-committed**: concurrent inserts may appear or move between pages; no duplicate/skips under stable data for a fixed cursor.

## Verification

```bash
pnpm --filter @settler/types build
pnpm --filter @settler/reconciliation-core build
cd packages/reconciliation-core && pnpm exec jest --runInBand --forceExit
pnpm --filter @settler/web typecheck:ci
pnpm --filter @settler/api typecheck
pnpm --filter @settler/api exec jest src/__tests__/routes/reconciliation-runtime-config-route.test.ts src/__tests__/routes/reconciliation-v1-contract.test.ts --runInBand --forceExit
```

Typecheck note: the workspace pins a single `@types/pg` version via root `pnpm.overrides` and reuses the API `db` module’s `Pool` class for `PrismaPg` so adapter and app pools share one `Pool` type identity.
