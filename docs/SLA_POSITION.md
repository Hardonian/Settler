# SLA Position

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Clear definition of uptime guarantees and SLA posture

## Canonical alignment (2026-04-05)

- **Customer-facing SLA** is contractual (order form / MSA), not implied by marketing pages.
- **Public endpoints** `GET /api/status` and `GET /api/status/health` report **connectivity at request time** only — see `docs/launch/CLAIMS_AND_EVIDENCE_REGISTRY.md`.
- **Commercial tier labels** in `packages/api/src/config/pricing.ts` may describe *offering intent*; they are not automatic proof of measured uptime unless backed by monitoring + contract.

## Overview

This document defines **uptime guarantees** and **SLA posture** for Settler. It is designed to help enterprise customers understand what uptime they can expect.

**Philosophy:** Honest SLAs build trust. Overpromising destroys credibility.

---

## Uptime Guarantees

### Starter Plan

**Uptime:** Best-effort (no SLA)

**Target:** 99.5% uptime (best-effort, not guaranteed)

**What This Means:**
- No SLA-backed uptime guarantee
- Best-effort uptime target
- No credits for downtime
- No uptime monitoring provided

**Reality:**
- Typical uptime: 99.5%+ (best-effort)
- No guarantees
- No credits
- No monitoring

---

### Professional Plan

**Uptime:** 99.5% uptime (best-effort, not SLA-backed)

**Target:** 99.5% uptime (best-effort)

**What This Means:**
- Best-effort uptime target
- No SLA-backed guarantee
- No credits for downtime
- Basic uptime monitoring provided

**Reality:**
- Typical uptime: 99.5%+ (best-effort)
- No SLA-backed guarantee
- No credits
- Basic monitoring

---

### Enterprise Plan

**Uptime:** 99.9% uptime (SLA-backed)

**Target:** 99.9% uptime (SLA-backed)

**What This Means:**
- SLA-backed uptime guarantee
- Credits for downtime below SLA
- Comprehensive uptime monitoring
- Custom SLA terms available

**Reality:**
- SLA-backed uptime guarantee
- Credits for downtime
- Comprehensive monitoring
- Custom SLA terms

---

## SLA Calculation

### Uptime Calculation

**Formula:** Uptime = (Total Time - Downtime) / Total Time × 100%

**Total Time:** 24/7/365 (all hours in the month)

**Downtime:** Time when service is unavailable (all health checks failing)

**Exclusions:**
- Scheduled maintenance (with notice)
- Force majeure events
- Third-party service outages (Stripe, Supabase, etc.)
- User-caused issues (misconfiguration, abuse)

---

### Downtime Definition

**Downtime:** Service is considered down when:
- All health check endpoints return errors
- API endpoints return 5xx errors for > 5 minutes
- Database is unavailable
- Authentication system is unavailable

**Not Downtime:**
- Individual endpoint errors (< 5 minutes)
- Performance degradation (slow but functional)
- Partial outages (some endpoints working)
- User-caused issues

---

## SLA Credits

### Credit Calculation

**Formula:** Credit = Monthly Fee × (Uptime SLA - Actual Uptime) / Uptime SLA

**Example:**
- Monthly Fee: $499
- Uptime SLA: 99.9%
- Actual Uptime: 99.5%
- Credit: $499 × (99.9% - 99.5%) / 99.9% = $2.00

**Maximum Credit:** 100% of monthly fee

---

### Credit Eligibility

**Requirements:**
- Enterprise plan only
- Downtime below SLA threshold
- Credit request within 30 days
- Verified downtime (monitoring data)

**Exclusions:**
- Scheduled maintenance
- Force majeure events
- Third-party service outages
- User-caused issues

---

## Monitoring & Reporting

### Uptime Monitoring

**Starter Plan:**
- No uptime monitoring provided
- Public status page available
- Self-service monitoring (third-party tools)

**Professional Plan:**
- Basic uptime monitoring
- Public status page available
- Monthly uptime reports

**Enterprise Plan:**
- Comprehensive uptime monitoring
- Private status page available
- Real-time uptime dashboards
- Monthly uptime reports

---

### Status Page

**Public Status Page:** https://status.settler.io

**Available:** All plans

**Content:**
- Current status
- Incident history
- Scheduled maintenance
- Uptime statistics

**Updates:**
- Real-time status updates
- Incident notifications
- Maintenance notifications

---

## Maintenance Windows

### Scheduled Maintenance

**Frequency:** As needed (typically monthly)

**Duration:** < 4 hours (typically < 1 hour)

**Notice:** 7 days advance notice (email + status page)

**Impact:** Minimal (zero-downtime deployments preferred)

**Exclusions:** Scheduled maintenance does not count as downtime

---

### Emergency Maintenance

**Frequency:** As needed (rare)

**Duration:** < 2 hours (typically < 30 minutes)

**Notice:** Immediate notice (email + status page)

**Impact:** Service may be unavailable during maintenance

**Inclusions:** Emergency maintenance counts as downtime (if service unavailable)

---

## Force Majeure

### Force Majeure Events

**Definition:** Events beyond reasonable control

**Examples:**
- Natural disasters
- War or terrorism
- Government actions
- Internet outages
- Third-party service outages (AWS, Vercel, Supabase)

**Impact:** Force majeure events do not count as downtime

---

## Third-Party Dependencies

### Third-Party Services

**Infrastructure:**
- AWS (cloud hosting)
- Vercel (application hosting)
- Supabase (database)
- Upstash (Redis/cache)

**Services:**
- Stripe (payment processing)
- Cloudflare (DDoS protection)
- Sentry (error monitoring)

**Impact:** Third-party service outages do not count as downtime (unless Settler's fault)

---

## SLA Limitations

### What SLA Does NOT Cover

**Not Covered:**
- ❌ Performance degradation (slow but functional)
- ❌ Individual endpoint errors (< 5 minutes)
- ❌ Partial outages (some endpoints working)
- ❌ User-caused issues (misconfiguration, abuse)
- ❌ Third-party service outages
- ❌ Scheduled maintenance
- ❌ Force majeure events

**Covered:**
- ✅ Complete service outages (> 5 minutes)
- ✅ Database unavailability
- ✅ Authentication system unavailability
- ✅ API unavailability (> 5 minutes)

---

## SLA Reality

### Actual Uptime

**Historical Uptime:**
- Typical: 99.5%+ (best-effort)
- Target: 99.9% (SLA-backed for enterprise)
- Reality: Varies by month

**Factors Affecting Uptime:**
- Infrastructure reliability
- Third-party service reliability
- Deployment frequency
- Incident response time

---

### Uptime Improvements

**Planned Improvements:**
- Multi-region deployment (future)
- Improved monitoring
- Faster incident response
- Better error handling

**Timeline:**
- Short-term: Improved monitoring and incident response
- Medium-term: Multi-region deployment
- Long-term: 99.99% uptime target

---

## Summary

Settler's SLA position:
- ✅ **Starter:** Best-effort (no SLA, target 99.5%)
- ✅ **Professional:** Best-effort (no SLA, target 99.5%)
- ✅ **Enterprise:** SLA-backed (99.9% uptime guarantee)
- ✅ **SLA Calculation:** Uptime = (Total Time - Downtime) / Total Time × 100%
- ✅ **SLA Credits:** Enterprise only, credit = Monthly Fee × (SLA - Actual) / SLA
- ✅ **Monitoring:** Basic (Professional), Comprehensive (Enterprise)
- ✅ **Status Page:** Public status page available (all plans)
- ✅ **Maintenance:** Scheduled maintenance excluded from downtime
- ✅ **Force Majeure:** Force majeure events excluded from downtime
- ✅ **Third-Party Dependencies:** Third-party outages excluded from downtime

**Key Principles:**
- Honest SLAs build trust
- Overpromising destroys credibility
- Best-effort for Starter/Professional
- SLA-backed for Enterprise

**When in doubt, assume best-effort unless SLA-backed.**
