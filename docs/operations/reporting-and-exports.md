# Reporting and Exports

## Reporting Engine Scope

Settler reporting covers:

- execution history
- failure statistics
- tenant usage
- API usage
- policy decisions
- replay verification

Reports are generated from telemetry/audit tables and filtered by tenant + time range.

## Export API

Primary endpoint:

- `POST /api/exports`
- `GET /api/exports`

Supported output formats:

- CSV
- JSON
- signed audit bundles (planned extension over export artifacts)

## Isolation Rules

- Export request must resolve authenticated `tenantId` and `userId`.
- Query predicates must include `tenantId`.
- Export artifacts must not include cross-tenant records.

## Scheduling Model

Scheduled export cadences:

- daily
- weekly
- monthly

Implementation uses a job queue/cron trigger that enqueues a tenant-scoped export job with explicit range bounds.

## Auditability

Every export operation should capture:

- requester identity
- tenant ID
- report/export type
- filters/time range
- artifact checksum/signature
- completion status and duration
