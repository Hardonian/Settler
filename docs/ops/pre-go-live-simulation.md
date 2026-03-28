# Pre-go-live simulation (merged runs)

This pass adds **executable, deterministic** coverage for the pure merge and cursor layer that backs merged reconciliation list APIs (`recon_jobs` + `reconciliation_runs`).

## What is proven

- **Concurrent overlapping reads**: Many parallel calls with the same candidate buffers return identical first pages (no race in pure merge).
- **Tenant input isolation**: Independent buffers for two synthetic tenants do not share row payloads when merged separately.
- **Cursor pagination contract**: Matches the dual-stream merge behavior documented in `merged-list-pagination` tests—after a page is emitted, the next page assumes buffers are refetched from the cursor (same pattern as existing pagination unit tests).
- **Cursor encoding**: Base64url round-trip preserves merge semantics for page 2.
- **Stream exhaustion metadata**: When one stream is empty, pagination flags reflect exhaustion.

## What is not claimed

- This does **not** prove database scale, network throughput, or full API integration. It proves the **merge + cursor mathematics** used by list endpoints.
- For DB-backed guarantees (tenant-scoped SQL, merged list rows), use `RUN_RECON_MERGED_LIST_DB=1` with `packages/api` `test:recon-merged-db` when a matching schema is available.

## How to rerun

```bash
pnpm run verify:pre-go-live-simulation
```

Or directly:

```bash
pnpm --filter @settler/reconciliation-core test -- pre-go-live-simulation.test.ts
```
