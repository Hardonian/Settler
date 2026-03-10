# Support Intake Foundation

Support intake is intentionally minimal and contract-first in OSS mode.

## Contract location

- `packages/api/src/services/support/support-intake-contract.ts`

## Required fields

- `tenant_id`
- `category`
- `description` (minimum context for investigation)

Optional correlation/context fields:

- `run_id`
- `route`
- `module`
- contact context (`user_id`, `email`, `role`)

## Category set

- `run_failure`
- `data_mismatch`
- `import_export`
- `replay_divergence`
- `auth_access`
- `performance`
- `billing_usage`
- `docs_other`

## Minimal authenticated endpoint

- `POST /api/v1/support/intake`
- requires authenticated user context and tenant resolution
- validates payload against `supportIntakeSubmissionSchema`
- persists submission to `audit_logs` as `support_intake_submitted` (durable store in OSS mode)

## How to attach evidence later

When wiring private/internal support systems, attach:

1. failing request metadata (`route`, status, trace ID)
2. run-level telemetry (`run_id`, module logs)
3. linked GitHub triage issue (if escalation needed)

No fake inbox/ticketing system is provided in OSS mode.
