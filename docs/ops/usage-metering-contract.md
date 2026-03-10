# Usage Metering Contract (Prep)

Usage metering is separate from operational telemetry.

- **Usage metering** answers "how much billable/product usage happened?"
- **Telemetry** answers "how healthy is the system?"

## Contract location

- `packages/api/src/services/usage/usage-metering-contract.ts`

## Canonical usage events

- `runs_executed`
- `records_processed`
- `imports_processed`
- `replay_runs`
- `operator_actions`
- `api_calls`

## Event schema

Required fields:

- `tenant_id`
- `event_name`
- `quantity`
- `occurred_at`

Optional fields:

- `run_id`
- `metadata`

## Provider boundary

`UsageMeterProvider` exposes provider status:

- `installed`
- `configured`
- `unavailable`
- `unsupported_oss`

`NoopUsageMeterProvider` keeps OSS runtime buildable when billing infrastructure is absent.

Future Stripe/warehouse integrations should implement `UsageMeterProvider` without changing caller contracts.

## Current provider implementation

- `DatabaseUsageMeterProvider` writes validated usage events to `audit_logs` with event `usage_metered` when `USAGE_METER_DB_ENABLED=true`.
- In default OSS mode, provider status remains `unavailable` and metering is a safe no-op.
