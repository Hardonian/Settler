# PILOT DEPLOYMENT CHECKLIST

## Environment setup
- [ ] Production environment variables are set for API, Web, workers, and operator tooling.
- [ ] Tenant isolation flags and auth secrets are set and rotated.
- [ ] `pnpm tenant:create --help` executes successfully in operator environment.

## Redis availability
- [ ] Redis endpoint reachable from API + worker nodes.
- [ ] Redis authentication/TLS validated.
- [ ] Queue latency and failure metrics visible in telemetry.

## DB migrations
- [ ] All required migrations applied to target database.
- [ ] RLS and tenant-bound policies verified after migration.
- [ ] Migration verification script exits cleanly (`pnpm verify:schema`).

## Alert integration
- [ ] Alert provider configured (email/Slack/PagerDuty).
- [ ] Reconciliation mismatch and ingestion failure alerts tested.
- [ ] Alert payload includes workspace ID, run ID, and correlation ID.

## Telemetry validation
- [ ] Run lifecycle events emitted for create/start/complete/fail.
- [ ] Replay events emitted and queryable.
- [ ] Operator dashboard shows tenant-scoped run health and failure counts.
- [ ] Audit artifacts retained for at least one complete pilot cycle.
