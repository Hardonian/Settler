# Intentional Boundaries

**Last Updated:** 2026-04-04  
**Purpose:** Document what is intentionally not production-complete and why.

---

## Philosophy

Settler ships with clear boundaries. This document distinguishes between:
- **Not yet built** — planned features on the roadmap
- **Known limitations** — constraints with workarounds
- **Intentionally incomplete** — features that work but aren't production-hardened

---

## Scheduling / Cron

**Status:** Functional (API/backend)

The `JobSchedulerService` (`packages/api/src/infrastructure/jobs/scheduler-service.ts`) is implemented and supports:
- Cron expression scheduling via `node-cron`
- Timezone-aware execution (`scheduleCron` and `scheduleTimezone` fields on the ReconJob model)
- Idempotent job execution with retry logic
- Health monitoring and graceful shutdown
- Automatic job reload on schedule changes

Additionally, 5 cron endpoint routes exist in `packages/web/src/app/api/cron/` covering daily cost rollups, email lifecycle, monthly summaries, reliability alert checks, and low-activity detection.

**What's not yet built:**
- Console UI for creating/editing schedule configuration (schedules must be configured via API or database)
- Visual schedule monitoring dashboard

---

## Enterprise Connectors (JobForge & Adapters)

**Status:** Functional (SDK and driver framework built, many drivers implemented)

The connector ecosystem consists of multiple packages:

- **`packages/jobforge-sdk-ts`** — TypeScript SDK client for the JobForge platform
- **`packages/jobforge-shared`** — Shared types, schemas, and constants
- **`packages/jobforge-errors`** — Structured error envelopes with correlation tracking
- **`packages/jobforge-fetch`** — Resilient HTTP fetch with retry logic
- **`packages/jobforge-adapter-settler`** — Settler-specific JobForge adapter

The `packages/adapters/` package provides a connector driver framework with 14 registered drivers:
- **Banking/Open Banking:** Plaid, TrueLayer
- **Payments:** Stripe Connect, PayPal (with enhanced and payouts variants)
- **Commerce:** Shopify, WooCommerce, Wix Stores, Amazon Seller, Etsy, eBay, TikTok Shop, Meta Commerce, Google Pay
- **Accounting/ERP:** QuickBooks (with enhanced variant), Xero, FreshBooks, Wave, NetSuite, SAP
- **Billing/Subscriptions:** Chargebee, Recurly
- **Tax:** Avalara, TaxJar

The adapter framework includes:
- Connector driver base class with credential encryption
- Connector runtime with sandboxed execution
- Concurrency protection and rate limiting per connector
- Retry queue for failed operations
- Prometheus metrics collection
- Alert management

**What's partial or evolving:**
- Not all drivers have been integration-tested against live APIs
- OAuth2 flows exist in the driver contracts but are not wired through a universal console UI
- CSV ingestion remains the simplest onboarding path for operators who don't need live connectors

---

## Multi-Currency Reconciliation

**Status:** Partial (API layer built, matching engine currency-unaware)

**What's implemented:**
- Currency API routes at `/api/v1/currency/*` (rate lookup, rate submission, conversion)
- `FXService` with conversion recording, provider tracking, and rate-date awareness
- FX provider chain with ECB (European Central Bank) provider and extensible `FXRateProvider` interface
- FX rate sync job (`packages/api/src/jobs/fx-rate-sync.ts`) that syncs rates for all active tenants with governance freeze checks
- FX conversion tracking stored in `fx_conversions` table

**What's not yet complete:**
- The reconciliation matching engine does not incorporate currency conversion into its tolerance/matching logic — matching is effectively single-currency
- The FX rate sync job framework exists but relies on the external `exchangerate.host` API which may require an API key for production volume
- Multi-currency tolerance zones (e.g., matching within an FX-adjusted threshold) are not implemented
- Currency-specific reconciliation rules are not supported

---

## Observability

**Status:** Comprehensive implementation

The observability stack is substantially built out:

- **Prometheus metrics** (`packages/api/src/infrastructure/observability/metrics.ts`): RED method (Rate, Errors, Duration) for HTTP requests, business metrics for reconciliations and webhooks, all with tenant and tier labels
- **Grafana dashboards** (`grafana-dashboards/`): Pre-built dashboards for API metrics, API performance, and reconciliation metrics
- **SLO alerting** (`packages/api/src/services/slo-alerting/`): Per-tenant SLO configuration, threshold breach detection, percentile tracking (p50/p95/p99), drift detection, multi-severity alerts (warning/critical), multi-channel notification
- **Health checks** (`packages/api/src/infrastructure/observability/health.ts`): Comprehensive dependency checks (database, Redis, Sentry, TigerBeetle) with liveness/readiness probe support, degraded-state detection, and blocking-dependency tracking
- **OpenTelemetry tracing**: Configured in the API package for distributed trace propagation
- **Structured logging**: Request-scoped trace IDs, tenant context in log entries

**What's still evolving:**
- Alert channel integrations (Slack, PagerDuty, email) are defined in the type system but delivery implementations vary in completeness
- Dashboard coverage will expand as new features are instrumented
- Custom per-tenant dashboard provisioning is not automated

---

## Rate Limiting

**Status:** Functional with Redis-based distributed implementation and in-memory fallback

**What's implemented:**
- Redis-backed token bucket rate limiting (`packages/api/src/infrastructure/rate-limiting/TokenBucket.ts`) with atomic Lua script operations
- Tier-based rate limiting for reconciliation operations (`packages/api/src/middleware/recon-rate-limiter.ts`) with per-tier RPM, concurrent job, and monthly recon limits (free/starter/pro/business/enterprise tiers)
- Adaptive rate limiting support

**Fallback behavior:**
- If Redis is unavailable, rate limiting falls back to in-memory storage
- In fallback mode, rate limits reset on server restart and are per-instance (not distributed)

---

## File Upload Limits

**Status:** 10MB hard limit

- Files >10MB are rejected
- No chunked upload support

---

## Known Limitations

For comprehensive known limitations, see [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md).

---

## Production Readiness Indicators

| Component | Status | Notes |
|-----------|--------|-------|
| Core Reconciliation | Ready | Primary workflow functional |
| Evidence Generation | Ready | Deterministic evidence produced |
| Manual Review Queue | Ready | Full audit trail |
| Tenant Isolation | Ready | RLS enforced |
| Stripe Ingestion | Ready | API-based with enhanced adapter |
| Bank CSV Import | Ready | CSV upload |
| Multi-tenancy | Ready | Workspace isolation |
| Scheduled Runs | Functional | Backend scheduler with cron/timezone support; no console UI for configuration |
| Enterprise Connectors | Functional | 14+ drivers in adapter framework; SDK and runtime built; not all drivers integration-tested |
| Observability | Functional | Prometheus, Grafana dashboards, SLO alerting, health probes, tracing |
| Rate Limiting | Functional | Redis-based distributed token bucket; in-memory fallback |
| Multi-currency | Partial | API routes, FX service, and rate sync exist; matching engine is currency-unaware |
| Advanced Analytics | Partial | Basic reconciliation metrics; advanced analytics evolving |

---

## What This Means for Operators

1. **Core reconciliation is production-ready** — Use it for real workloads
2. **Evidence system is reliable** — Audit trails are complete
3. **Scheduling works at the API level** — Configure cron schedules via API; console UI for schedule management is not yet available
4. **Connectors are available but maturing** — The adapter framework and many drivers are built; start with Stripe, Plaid, or CSV ingestion for initial deployments and expand from there
5. **Multi-currency requires care** — FX rate infrastructure exists, but the matching engine does not yet apply currency conversion during reconciliation; test thoroughly with your currency pairs
6. **Observability is operational** — Prometheus metrics, Grafana dashboards, and SLO alerting are in place; instrument custom metrics as needed
7. **Rate limiting is distributed** — Works correctly with Redis; degrades gracefully to per-instance limits without it

---

## Related Documentation

- [What Works Today](./WHAT_WORKS.md)
- [Known Limitations](../KNOWN_LIMITATIONS.md)
- [Quickstart](./quickstart.md)
