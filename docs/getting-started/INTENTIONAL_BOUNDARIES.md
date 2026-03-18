# Intentional Boundaries

**Last Updated:** 2026-03-18  
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

**Status:** Not yet built

Automated scheduling of reconciliation runs is not implemented.

**Workaround:** Trigger reconciliation manually via console or API.

---

## Production Hardening Gaps

### Observability

**What's implemented:**
- Basic error logging
- Health check endpoints

**What's missing:**
- Custom dashboards
- Alerting thresholds
- SLI/SLO tracking

---

### Rate Limiting

**Status:** Fallback mode

Rate limiting falls back to in-memory storage if Redis is unavailable.

**Implication:**
- Rate limits reset on server restart
- Rate limits are per-instance

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
