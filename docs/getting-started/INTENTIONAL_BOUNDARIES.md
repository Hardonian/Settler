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

## Features Not Yet Built

### Enterprise Connectors (JobForge)

**Status:** Not yet implemented

JobForge integration for external system connections is in development.

**What's missing:**
- OAuth2 connector flows
- Pre-built connector templates
- Connector SDK

**Workaround:** Use CSV ingestion for now.

---

### Multi-Currency Reconciliation

**Status:** Partial

Basic multi-currency support exists, but advanced scenarios are incomplete.

**What's working:**
- Single-currency matching
- Basic currency conversion

**What's missing:**
- Dynamic exchange rate handling
- Multi-currency tolerance zones
- Currency-specific reconciliation rules

---

### Advanced Scheduling / Cron

**Status:** Not yet built (reconciliation runs)

Workflow templates and some internal job queues may store `schedule_cron`-style fields or enqueue delayed work, but **there is no operator-facing, per-tenant cron that starts reconciliation runs on a cadence** with last-run / next-run truth in the product surface.

**Workaround:** Trigger reconciliation manually via console, API, or your own scheduler calling the API.

---

## Production Hardening Gaps

### Observability

**What's implemented:**
- Basic error logging
- Health check endpoints (`/health`, `/health/detailed`, `/health/ready`) including dependency checks
- Detailed health exposes **distributed guard posture**: API rate limiting and webhook replay deduplication are `distributed_shared` only when Redis is healthy; otherwise guarantees are explicitly **degraded** (Postgres ledger / in-memory fallbacks may apply—see API code)

**What's missing:**
- Custom dashboards
- Alerting thresholds (beyond what you wire to health/metrics)
- SLI/SLO tracking

---

### Rate Limiting

**Status:** Tiered guarantees (Redis → Postgres → in-memory)

The API prefers **Redis** for shared rate limits and webhook replay keys. If Redis is down or unset, it attempts a **Postgres-backed** counter / replay ledger (`rate_limit_counters`, `webhook_replay_keys`). If that fails, it falls back to **per-process memory** (limits do not hold across instances).

**Implication:**
- Without healthy Redis, limits are not reliably shared across horizontally scaled instances (Postgres path helps when migrations/tables exist; memory path is last resort).
- For **production** deployments that must not boot without shared Redis, set `REDIS_REQUIRED_FOR_PRODUCTION=true` (API fails startup in `NODE_ENV=production` if Redis is missing or unreachable).

---

### File Upload Limits

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
| Core Reconciliation | ✅ Ready | Primary workflow functional |
| Evidence Generation | ✅ Ready | Deterministic evidence produced |
| Manual Review Queue | ✅ Ready | Full audit trail |
| Tenant Isolation | ✅ Ready | RLS enforced |
| Stripe Ingestion | ✅ Ready | API-based |
| Bank CSV Import | ✅ Ready | CSV upload |
| Multi-tenancy | ✅ Ready | Workspace isolation |
| Scheduled Runs | ❌ Not built | Manual trigger only |
| Enterprise Connectors | ❌ Not built | Coming soon |
| Advanced Analytics | ⚠️ Partial | Basic only |
| Multi-currency | ⚠️ Partial | Single-currency preferred |

---

## What This Means for Operators

1. **Core reconciliation is production-ready** — Use it for real workloads
2. **Evidence system is reliable** — Audit trails are complete
3. **Multi-currency requires care** — Test thoroughly with your currency pairs
4. **Scheduled runs are manual** — Plan accordingly
5. **Enterprise features need roadmap** — Don't build production flows around JobForge yet

---

## Related Documentation

- [What Works Today](./WHAT_WORKS.md)
- [Known Limitations](../KNOWN_LIMITATIONS.md)
- [Quickstart](./quickstart.md)
