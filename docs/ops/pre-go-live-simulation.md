# Pre-go-live simulation (merged runs)

This pass adds **executable, deterministic** coverage for the pure merge and cursor layer that backs merged reconciliation list APIs (`recon_jobs` + `reconciliation_runs`).

## What is proven

- **Concurrent overlapping reads (merge layer)**: Many parallel calls with the same candidate buffers return identical first pages (no race in pure merge).
- **Concurrent overlapping reads (HTTP contract)**: Parallel `GET /api/v1/reconciliation/runs` requests with the same tenant and query params return identical JSON when the data layer returns the same page (supertest + mocked `fetchMergedReconciliationRunsPage`).
- **POST /run input hardening**: Non-string `ingestionId` is rejected with `VALIDATION_ERROR`; `jobId` / `templateId` are read as optional trimmed strings (no `any` on the request body).
- **List telemetry**: Successful list responses emit structured `logInfo` with `event: reconciliation.runs_listed` and bounded fields (limit, run_kind, returned, has_more, cursor_present, tenantId, traceId).
- **Tenant input isolation**: Independent buffers for two synthetic tenants do not share row payloads when merged separately.
- **Cursor pagination contract**: Matches the dual-stream merge behavior documented in `merged-list-pagination` tests—after a page is emitted, the next page assumes buffers are refetched from the cursor (same pattern as existing pagination unit tests).
- **Cursor encoding**: Base64url round-trip preserves merge semantics for page 2.
- **Stream exhaustion metadata**: When one stream is empty, pagination flags reflect exhaustion.

## What is not claimed

- This does **not** prove database scale, network throughput, or live Prisma behavior under load. The API contract tests use **mocks** for `fetchMergedReconciliationRunsPage` and `runReconciliation`.
- Merge-layer tests prove **merge + cursor mathematics**; they do not hit PostgreSQL.
- For DB-backed guarantees (tenant-scoped SQL, merged list rows), use `RUN_RECON_MERGED_LIST_DB=1` with `packages/api` `test:recon-merged-db` when a matching schema is available.

## How to rerun

```bash
pnpm run verify:pre-go-live-simulation
```

Or directly:

```bash
pnpm --filter @settler/reconciliation-core test -- pre-go-live-simulation.test.ts
```
