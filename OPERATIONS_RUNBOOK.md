# Settler — Operations Runbook

Standard operating procedures for running the Settler platform. Designed for a small ops team or solo operator.

## 1. Incident Response

### Application Errors (Sentry)

- **Trigger:** Sentry alert indicating an unhandled exception in the API or console.
- **Action:**
  1. Check the Sentry dashboard for the stack trace and affected tenant.
  2. If the error is in the API control plane, check recent deployments via `git log -5`.
  3. If the error is in the console, check for client-side hydration issues or missing data.
  4. If severity warrants, revert the latest deployment via the Vercel dashboard.

### Reconciliation Exceptions

- **Trigger:** Operator notices elevated unmatched transaction count in the console's exception review queue.
- **Action:**
  1. Open the Settler Console → Exception Review.
  2. Review the unmatched transactions and their tolerance violations.
  3. Adjudicate each exception (approve, reject, or flag for further review).
  4. If a pattern emerges, adjust tolerance rules for the affected job configuration.

### Tenant Isolation Breach (Critical)

- **Trigger:** Cross-tenant test failure in CI, or manual discovery of tenant data leakage.
- **Action:**
  1. Immediately freeze the affected tenant via the governance middleware.
  2. Run `pnpm run verify:tenant-isolation` and `pnpm run test:cross-tenant` to assess scope.
  3. Engage incident response per [SECURITY.md](SECURITY.md).
  4. Document findings in a postmortem using the template in `docs/INCIDENT_POSTMORTEM_TEMPLATE.md`.

## 2. AI Feature Management

### BYOK Key Configuration

- **Issue:** A customer reports that AI-assisted features are not available.
- **Resolution:** Direct the customer to verify their OpenAI API key in tenant settings. When the key is missing or invalid, the platform operates in `verified_degraded` state — all core reconciliation and evidence features work normally without AI assistance.

### Monitoring Degraded State

- **Procedure:** Check the ops daily report (`pnpm run ops:daily`) for tenants operating in degraded state. Degraded state is an explicit, documented mode — not a failure condition.

## 3. Financial Operations

### Stripe Billing

- **Monitoring:** Subscription tier enforcement is handled by the billing middleware. Usage events are recorded per reconciliation run.
- **Reporting:** Revenue = Sum of subscription fees + (total transactions × per-transaction rate).
- **Overages:** Handled automatically via Stripe metered billing.

### Trial Lifecycle

- **Automation:** Trial lifecycle emails (day 7, day 14, expiry) are managed by the email lifecycle service. Monitor via `pnpm run ops:daily`.

## 4. Deployment Pipeline

- **Branching:** All work on feature branches. `main` must remain green.
- **Pre-commit:** Husky runs ESLint, Prettier, and type-checking before every commit.
- **CI/CD:** Pushing to `main` triggers a Vercel production build. All PRs must pass `pnpm verify`.
- **Pre-deploy checklist:** Run `pnpm run build` locally before pushing major changes.

## 5. Verification Commands Reference

```bash
pnpm run doctor              # Comprehensive environment diagnostic
pnpm run ops:daily           # Daily operational report
pnpm run ops:doctor          # Full health check (lint, typecheck, build, routes)
pnpm run verify:fast         # Fast verification profile
pnpm run verify:full         # Complete release verification
pnpm run verify:security     # Security posture check
```

## 6. Escalation Path

| Severity | Response Time | Action |
| --- | --- | --- |
| P0 — Data loss or tenant breach | Immediate | Freeze tenant, engage incident response |
| P1 — Service outage | < 1 hour | Check Vercel/Supabase status, rollback if needed |
| P2 — Feature degradation | < 4 hours | Investigate, document, schedule fix |
| P3 — Non-critical bug | Next business day | Triage and assign |

## 7. Backup & Restore

### PostgreSQL

```bash
# Manual backup (Supabase-hosted)
pg_dump "$DATABASE_URL" --format=custom --file=settler-$(date +%Y%m%d).dump

# Restore
pg_restore --dbname="$DATABASE_URL" settler-YYYYMMDD.dump
```

- Supabase provides automated daily backups with 7-day retention (Pro plan) or 30-day retention (Enterprise).
- Test restore procedures quarterly. Document results in `docs/archive/`.

### TigerBeetle

- TigerBeetle is an append-only ledger — data is immutable by design.
- Cluster replication handles durability. For backup, snapshot the data directory.
- `pnpm tb:status` verifies cluster health.

### Redis

- Redis is used for caching and job queues — data is ephemeral by design.
- No backup required. Jobs are retried automatically via BullMQ retry policies.
- If Redis is lost, restart it and allow the queue to rebuild from pending database state.

## 8. Monitoring Setup

| System | Tool | Purpose |
| --- | --- | --- |
| **Errors** | Sentry | Unhandled exceptions, performance monitoring |
| **Uptime** | Vercel / external probe | HTTP health checks on `/api/v1/health` |
| **Logs** | Vercel Log Drain → Sentry | Structured log aggregation |
| **Metrics** | OpenTelemetry (optional) | Request latency, throughput, queue depth |
| **Billing** | Stripe Dashboard | Subscription status, MRR, churn |

### Structured Logging

Settler uses structured JSON logging via `@settler/logger`. All log entries include:

- `tenantId` (when in tenant context)
- `requestId` (correlation ID)
- `timestamp` (ISO 8601)
- `level` (error, warn, info, debug)

### Alerting Thresholds

| Metric | Warning | Critical |
| --- | --- | --- |
| Error rate (5xx) | > 1% of requests | > 5% of requests |
| P95 latency | > 2s | > 5s |
| Queue depth | > 1000 pending jobs | > 5000 pending jobs |
| Disk usage | > 70% | > 90% |
| Unmatched exception rate | > 20% of run | > 50% of run |

## 9. Capacity Planning

### Scaling Triggers

| Resource | Trigger | Action |
| --- | --- | --- |
| **API CPU** | Sustained > 80% for 10 min | Scale Vercel concurrency or add serverless regions |
| **Database connections** | > 80% of pool | Increase connection pool size or enable PgBouncer |
| **Redis memory** | > 70% of allocated | Increase instance size or tune TTLs |
| **Queue backlog** | Jobs older than SLA threshold | Add worker concurrency, investigate bottleneck |

### Cost Optimization

- Settler is designed for scale-to-zero on Vercel Serverless.
- TigerBeetle and PostgreSQL are the only always-on costs.
- Redis can be replaced with Upstash (serverless) for lower-traffic deployments.

## 10. On-Call Rotation

### Responsibilities

- Monitor Sentry alerts and the daily ops report (`pnpm run ops:daily`).
- Acknowledge P0/P1 incidents within the SLA window.
- Run `pnpm run doctor` if system health is uncertain.
- Document all incidents using the template at `docs/INCIDENT_POSTMORTEM_TEMPLATE.md`.

### Communication Channels

| Channel | Purpose |
| --- | --- |
| Sentry alerts | Automated error notifications |
| Email | Escalation path for P0/P1 |
| `pnpm run ops:daily` | Daily digest of operational health |
