# Proof Explorer Architecture

Proof Explorer exposes execution history and proof inspection through:

- CLI history and inspection commands
- Web explorer timeline and execution detail pages
- Tenant-scoped API endpoints

## Web routes

- `/explorer`
- `/explorer/execution/[id]`
- `/explorer/tenant/[tenant_id]`

## API routes

- `GET /api/explorer/history`
- `GET /api/explorer/execution/[id]`

Security model:

- Non-admin requests are tenant scoped by `x-tenant-id`
- Cross-tenant requests return `403 tenant_scope_violation`
- Admin requests (`x-settler-admin: true`) can query global or explicit tenant scope

## CLI commands

- `settler history [--tenant <tenant_id>]`
- `settler show <execution_id>`
- `settler diff <execution_a> <execution_b>`
- `settler verify <execution_id>` (ledger-aware)
- `settler export-ledger --format json|csv|signed`

## Diff coverage

Execution diff highlights:

- input hash differences
- output hash differences
- policy version changes
- tool call list changes
- execution status/duration differences
