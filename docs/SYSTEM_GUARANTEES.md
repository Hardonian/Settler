# System Guarantees

**Last Updated:** 2025-01-20  
**Status:** Production Reality Check  
**Purpose:** Explicit definition of what Settler guarantees vs. what it attempts

## Overview

This document defines **enforceable guarantees** that Settler provides today. Anything not listed here is **best-effort** and may fail, degrade, or behave unpredictably.

**Philosophy:** It is better to guarantee less and deliver reliably than to promise more and fail silently.

---

## Core Guarantees

### 1. Data Isolation

**Guarantee:** Tenant data is isolated at the database level using Row-Level Security (RLS).

- ✅ **Enforced:** PostgreSQL RLS policies prevent cross-tenant data access
- ✅ **Verified:** Automated tests verify tenant isolation (`validate:tenant-isolation`)
- ✅ **Failure Mode:** If RLS is disabled or bypassed, isolation fails (this is a critical failure)

**What This Means:**
- One tenant cannot access another tenant's data through the API
- Database-level enforcement means application bugs cannot bypass isolation
- Service-role keys bypass RLS (documented risk, requires operational controls)

**What This Does NOT Mean:**
- Data is encrypted at rest (encryption is best-effort, not guaranteed)
- Data cannot be accessed by database administrators (they can bypass RLS)
- Cross-tenant analytics are impossible (they require service-role access)

---

### 2. API Authentication

**Guarantee:** All API endpoints require valid authentication (API key or JWT).

- ✅ **Enforced:** Middleware rejects unauthenticated requests
- ✅ **Verified:** All routes protected by `authMiddleware` or `apiKeyMiddleware`
- ✅ **Failure Mode:** Misconfigured routes may expose endpoints (audited in CI)

**What This Means:**
- Unauthenticated requests return `401 Unauthorized`
- API keys are validated before any business logic executes
- JWT tokens are verified for signature and expiration

**What This Does NOT Mean:**
- Rate limiting is guaranteed (falls back to in-memory if Redis unavailable)
- API keys cannot be brute-forced (rate limiting is best-effort)
- Token revocation is immediate (may take up to 15 minutes for JWT expiration)

---

### 3. Usage Tracking

**Guarantee:** API usage is tracked for billing purposes.

- ✅ **Enforced:** Usage events recorded for all billable operations
- ✅ **Verified:** Usage tracking middleware wraps billable endpoints
- ✅ **Failure Mode:** If database is unavailable, usage tracking fails (non-blocking)

**What This Means:**
- Reconciliation runs, receipt parses, and feature flag evaluations are counted
- Usage events are written to `usage_events` table
- Daily aggregation runs to create billing records

**What This Does NOT Mean:**
- Usage tracking is real-time (may lag by minutes)
- Usage tracking is 100% accurate (failures are non-blocking, may be lost)
- Usage limits are enforced synchronously (quota checks may race)

---

### 4. Idempotency

**Guarantee:** API requests can be safely retried using idempotency keys.

- ✅ **Enforced:** Idempotency middleware caches responses for duplicate requests
- ✅ **Verified:** Idempotency keys prevent duplicate processing
- ✅ **Failure Mode:** If idempotency storage fails, requests may be duplicated

**What This Means:**
- Clients can retry failed requests with the same idempotency key
- Duplicate requests return the same response (cached)
- Idempotency keys expire after 24 hours

**What This Does NOT Mean:**
- All operations are idempotent (only those using idempotency keys)
- Idempotency works across API versions (keys are version-specific)
- Idempotency survives database migrations (keys may be lost)

---

### 5. Webhook Delivery

**Guarantee:** Webhooks are delivered with retry logic and signature verification.

- ✅ **Enforced:** Webhook service retries failed deliveries with exponential backoff
- ✅ **Verified:** Webhook signatures prevent tampering
- ✅ **Failure Mode:** If webhook service fails, deliveries may be lost

**What This Means:**
- Webhooks are retried up to 5 times with exponential backoff
- Webhook payloads are signed with HMAC-SHA256
- Failed webhooks are logged for manual retry

**What This Does NOT Mean:**
- Webhooks are delivered in real-time (may be delayed by minutes)
- Webhooks are guaranteed to be delivered (eventual delivery, not guaranteed)
- Webhook order is preserved (deliveries may be out of order)

---

## Service-Specific Guarantees

### Receipts API

**Guarantee:** Receipt parsing returns structured JSON with confidence scores.

- ✅ **Enforced:** Receipt parser extracts fields from PDFs/images
- ✅ **Verified:** Receipts are stored with confidence scores (0.0-1.0)
- ✅ **Failure Mode:** If OCR fails, receipt parsing returns partial data

**What This Means:**
- Receipts are parsed into structured JSON (vendor, date, total, items)
- Confidence scores indicate extraction quality
- Receipts are stored in `receipts` table with `receipt_items`

**What This Does NOT Mean:**
- Receipt parsing is 100% accurate (confidence scores indicate uncertainty)
- All receipt formats are supported (only common formats are reliable)
- Receipt parsing is real-time (may take seconds for complex receipts)

---

### Feature Flags API

**Guarantee:** Feature flags return consistent values within an environment.

- ✅ **Enforced:** Feature flags are evaluated deterministically
- ✅ **Verified:** Flag values cached for performance
- ✅ **Failure Mode:** If cache fails, flags may be inconsistent temporarily

**What This Means:**
- Feature flags return boolean/string/number values
- Flags are scoped to environments (production, staging, development)
- Flag overrides allow per-user/tenant customization

**What This Does NOT Mean:**
- Feature flags are updated instantly (may take up to 60 seconds to propagate)
- Feature flags work offline (requires database connection)
- Feature flag evaluations are free (counted toward usage limits)

---

### Reconciliation Engine

**Guarantee:** Reconciliation runs match transactions between source and target systems.

- ✅ **Enforced:** Reconciliation engine processes transactions and creates matches
- ✅ **Verified:** Reconciliation runs create `ReconciliationMatch` records
- ✅ **Failure Mode:** If matching logic fails, runs may return partial results

**What This Means:**
- Reconciliation runs process transactions from ingestion sources
- Matches are created with confidence scores (0.0-1.0)
- Unmatched transactions are flagged for manual review

**What This Does NOT Mean:**
- Reconciliation is 100% accurate (confidence scores indicate uncertainty)
- Reconciliation is real-time (may take minutes for large datasets)
- All transaction types are supported (only normalized transactions are matched)

---

## Non-Guarantees (Best-Effort)

The following are **best-effort** and may fail without notice:

1. **Real-time Processing:** Operations may be delayed by seconds or minutes
2. **100% Accuracy:** AI/ML operations have confidence scores indicating uncertainty
3. **Zero Downtime:** System may experience brief outages during deployments
4. **Perfect Data Consistency:** Eventual consistency is the norm, not immediate consistency
5. **Complete Error Recovery:** Some errors may require manual intervention
6. **Cross-Region Redundancy:** Single-region deployment (no automatic failover)
7. **Unlimited Scale:** Rate limits and quotas apply to all operations
8. **Perfect Audit Trails:** Audit logs may be incomplete if logging fails

---

## Guarantee Enforcement

### Validation

- **Automated Tests:** Critical guarantees are verified in CI/CD
- **Production Monitoring:** Guarantees are monitored in production
- **Alerting:** Violations trigger alerts to operations team

### Failure Response

When a guarantee fails:

1. **Immediate:** System attempts automatic recovery
2. **Short-term:** Operations team is alerted
3. **Long-term:** Root cause analysis and prevention measures

### Guarantee Evolution

Guarantees may be:
- **Added:** When new capabilities are proven reliable
- **Removed:** When guarantees cannot be maintained
- **Modified:** When requirements change

All changes are documented and communicated to users.

---

## User Responsibilities

Users must:

1. **Handle Failures:** Implement retry logic for best-effort operations
2. **Verify Results:** Check confidence scores and match quality
3. **Monitor Usage:** Track usage against quotas and limits
4. **Report Issues:** Report guarantee violations to support

---

## Summary

Settler guarantees:
- ✅ **Data isolation** (RLS-enforced)
- ✅ **API authentication** (required for all endpoints)
- ✅ **Usage tracking** (for billing)
- ✅ **Idempotency** (for safe retries)
- ✅ **Webhook delivery** (with retries and signatures)

Everything else is **best-effort** and may fail, degrade, or behave unpredictably.

**When in doubt, assume best-effort, not guaranteed.**
