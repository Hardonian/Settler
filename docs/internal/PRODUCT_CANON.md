# Settler Product Canon

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** LOCKED - Authoritative Definition  
**Purpose:** Single source of truth for what Settler IS and IS NOT

---

## Core Invariant

**"Reconciliation is a system behavior, not a human task."**

Settler performs continuous, automatic reconciliation. Users supervise exceptions, not configure matching logic.

---

## What Settler DOES (Non-Negotiable Guarantees)

### 1. Automatic Transaction Reconciliation
- **What:** Matches transactions between two or more systems (e.g., Stripe ↔ Shopify, Stripe ↔ QuickBooks)
- **How:** Event-sourced matching engine with deterministic math
- **Guarantee:** Reconciliation runs automatically when transactions are ingested
- **Proof:** Reconciliation runs appear in console, matches/exceptions are visible
- **Enforcement:** Backend processes transactions without user intervention

### 2. Data Ingestion from Standard Integrations
- **What:** Ingests transaction data from Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite, and 50+ platforms
- **How:** Via API adapters that normalize data formats
- **Guarantee:** Standard integrations work out-of-box (no custom code required)
- **Proof:** Adapter list in console, connection status visible
- **Enforcement:** Adapter health monitoring, connection status tracking

### 3. Exception Identification and Reporting
- **What:** Identifies unmatched transactions, mismatches, and discrepancies
- **How:** Confidence scoring (0.0-1.0) for matches, exception flags for unmatched items
- **Guarantee:** All exceptions are flagged and visible in console
- **Proof:** Exception reports show unmatched transactions with reasons
- **Enforcement:** Exception records created automatically, visible in UI

### 4. Audit Trail Generation
- **What:** Complete audit trail showing every transaction, every match, every decision
- **How:** Event-sourced logs, reconciliation history, match records
- **Guarantee:** Every reconciliation run creates audit trail records
- **Proof:** Audit trail visible in console, exportable as JSON/CSV
- **Enforcement:** Database records created for every match/exception

### 5. Tenant Data Isolation
- **What:** Complete isolation of tenant data at database level
- **How:** Row-Level Security (RLS) policies enforce boundaries
- **Guarantee:** One tenant cannot access another tenant's data
- **Proof:** Automated tests verify isolation, RLS policies enforced
- **Enforcement:** PostgreSQL RLS prevents cross-tenant access

### 6. API Authentication and Authorization
- **What:** All API endpoints require valid authentication (API key or JWT)
- **How:** Middleware validates authentication before business logic
- **Guarantee:** Unauthenticated requests return 401 Unauthorized
- **Proof:** All routes protected, middleware tests verify
- **Enforcement:** Authentication middleware on all routes

### 7. Usage Tracking for Billing
- **What:** Tracks reconciliation runs, receipt parses, API calls for billing
- **How:** Usage events recorded in `usage_events` table
- **Guarantee:** Billable operations are tracked
- **Proof:** Usage visible in console, billing dashboard
- **Enforcement:** Usage tracking middleware wraps billable endpoints

### 8. Plan-Based Feature Limits
- **What:** Enforces plan limits (reconciliations/month, adapters, log retention)
- **How:** Billing middleware checks limits before allowing operations
- **Guarantee:** Plan limits are enforced at API level (not just UI)
- **Proof:** API returns 403 when limits exceeded, error messages explain
- **Enforcement:** Billing gating middleware checks limits synchronously

---

## What Settler DOES NOT DO (Explicit Exclusions)

### 1. Manual Reconciliation Configuration
- **What:** Users do NOT configure matching rules, thresholds, or logic
- **Why:** Reconciliation is automatic, not configurable
- **Reality Check:** If UI shows "configure matching rules", it must be removed
- **Enforcement:** No matching rule configuration endpoints exist

### 2. Custom Reconciliation Logic
- **What:** Users do NOT write custom matching algorithms
- **Why:** Deterministic matching is built-in, not customizable
- **Reality Check:** If docs claim "custom matching logic", remove it
- **Enforcement:** No custom logic endpoints exist

### 3. Real-Time Processing Guarantees
- **What:** Settler does NOT guarantee real-time processing
- **Why:** Operations may be delayed by seconds or minutes
- **Reality Check:** Remove "real-time" claims from marketing copy
- **Enforcement:** System processes asynchronously, delays are normal

### 4. 100% Accuracy Guarantees
- **What:** Settler does NOT guarantee 100% matching accuracy
- **Why:** Confidence scores indicate uncertainty, exceptions require review
- **Reality Check:** Remove "100% accurate" claims, use "99%+ accuracy"
- **Enforcement:** Confidence scores (0.0-1.0) indicate uncertainty

### 5. Zero Downtime Guarantees
- **What:** Settler does NOT guarantee zero downtime
- **Why:** Brief outages may occur during deployments
- **Reality Check:** Remove "zero downtime" claims, use "99.9% uptime"
- **Enforcement:** System may experience brief outages

### 6. Unlimited Scale
- **What:** Settler does NOT offer unlimited scale
- **Why:** Rate limits and quotas apply to all operations
- **Reality Check:** Remove "unlimited" claims except for Enterprise plan
- **Enforcement:** Plan limits enforced at API level

### 7. Custom Integrations (Standard Plans)
- **What:** Users do NOT build custom integrations on standard plans
- **Why:** Only standard adapters are available (50+ platforms)
- **Reality Check:** Remove "custom integrations" from non-Enterprise plans
- **Enforcement:** Only standard adapters available, custom requires Enterprise

### 8. On-Premise Deployment (Standard Plans)
- **What:** Users do NOT deploy Settler on-premise on standard plans
- **Why:** Only SaaS deployment available (on-premise is Enterprise-only)
- **Reality Check:** Remove "on-premise" claims from non-Enterprise plans
- **Enforcement:** No on-premise deployment endpoints for standard plans

### 9. AI-Powered Features (Beyond OCR)
- **What:** Settler does NOT use AI for reconciliation matching
- **Why:** Matching is deterministic, not AI-powered
- **Reality Check:** Remove "AI-powered reconciliation" claims, keep "AI-powered OCR" for receipts
- **Enforcement:** Matching engine is deterministic, not ML-based

### 10. Compliance Certifications (Beyond SOC 2 Planned)
- **What:** Settler does NOT have HIPAA, FedRAMP, or industry-specific certifications
- **Why:** SOC 2 Type II planned (Q3 2026), others not planned
- **Reality Check:** Remove compliance claims except SOC 2 planned, GDPR/CCPA compliant
- **Enforcement:** No compliance certifications beyond stated ones

---

## Ideal Customer Profile (ICP)

### Primary ICP: E-commerce Finance Manager
- **Role:** Finance Manager, Controller, or CFO
- **Company Size:** 50-500 employees
- **Industry:** E-commerce (DTC brands, marketplaces, multi-channel retailers)
- **Annual Revenue:** $5M-$50M
- **Pain Point:** Monthly reconciliation takes 2-3 days of manual work
- **Current State:** Using spreadsheets or manual matching between Shopify/Stripe/QuickBooks
- **Trigger:** Recent accounting error, audit preparation, or scaling beyond manual capacity
- **Budget:** $5K-$50K/year, can approve $500/month without procurement
- **Use Case:** Automated reconciliation via API, <1 hour/month, 99%+ accuracy
- **Value:** Saves 20+ hours/month, reduces errors, improves audit readiness
- **Plan:** Professional ($499/month) or Growth ($599/month)
- **ROI:** 10x+ within first month

### Secondary ICP: SaaS Operations Lead
- **Role:** Operations Manager, Revenue Operations, or Finance Operations
- **Company Size:** 20-200 employees
- **Industry:** B2B SaaS, Marketplaces, Platforms
- **Annual Revenue:** $2M-$20M ARR
- **Pain Point:** Multi-currency reconciliation is manual and error-prone
- **Current State:** Stripe + PayPal + bank statements don't match accounting system
- **Trigger:** International expansion, new payment methods, or compliance requirement
- **Budget:** $3K-$30K/year, can approve $500/month
- **Use Case:** Automated multi-currency matching, <30 minutes/month
- **Value:** Eliminates currency conversion errors, saves 15+ hours/month
- **Plan:** Professional ($499/month) or Growth ($599/month)
- **ROI:** 5x+ within first quarter

### Tertiary ICP: E-commerce Developer/Founder
- **Role:** Founder, CTO, or Lead Developer
- **Company Size:** 5-50 employees
- **Industry:** E-commerce, DTC brands, Marketplaces
- **Annual Revenue:** $1M-$10M
- **Pain Point:** Building reconciliation logic is taking too long
- **Current State:** Custom reconciliation code, maintenance burden, errors
- **Trigger:** Scaling beyond manual processes, need for reliability, or focus shift
- **Budget:** $2K-$20K/year, can approve $500/month
- **Use Case:** API-based reconciliation, no maintenance, reliable, <1 hour/month
- **Value:** Saves 10+ hours/month of development time, improves reliability
- **Plan:** Starter ($99/month) or Professional ($499/month)
- **ROI:** 10x+ within first month (developer time value)

---

## Anti-ICP (Who Should NOT Buy)

### 1. Companies with <1,000 Transactions/Month
- **Why:** Manual reconciliation is sufficient at this scale
- **Reality:** Settler is designed for 10K+ transactions/month
- **Message:** "If you're processing <1,000 transactions/month, manual reconciliation may be sufficient."

### 2. Companies Without API Access
- **Why:** Settler requires API access to Stripe, Shopify, QuickBooks, etc.
- **Reality:** No API access = cannot use Settler
- **Message:** "Settler requires API access to your payment and accounting systems. If you don't have API access, we can help you set it up, or Settler may not be the right fit."

### 3. Companies Needing Industry-Specific Compliance
- **Why:** Settler does NOT have HIPAA, FedRAMP, or industry-specific certifications
- **Reality:** Only SOC 2 planned (Q3 2026), GDPR/CCPA compliant
- **Message:** "Settler is designed for e-commerce and SaaS companies. If you need HIPAA, FedRAMP, or other industry-specific certifications, we may not be the right fit."

### 4. Companies Wanting Custom Matching Logic
- **Why:** Settler uses deterministic matching, not configurable logic
- **Reality:** No custom matching rules, only standard matching
- **Message:** "Settler uses deterministic matching algorithms. If you need extensive custom matching logic, we can discuss Enterprise options."

### 5. Companies Wanting On-Premise Deployment (Non-Enterprise)
- **Why:** On-premise deployment is Enterprise-only
- **Reality:** Only SaaS deployment available for standard plans
- **Message:** "On-premise deployment is available for Enterprise customers only. Standard plans use SaaS deployment."

### 6. Companies Processing Only Single Currency
- **Why:** Multi-currency is a key differentiator, single-currency may not justify cost
- **Reality:** Single-currency reconciliation may be sufficient with manual process
- **Message:** "Settler is designed for companies processing multiple currencies. If you're single-currency, our standard reconciliation may be sufficient, but manual processes may be more cost-effective."

---

## Core Invariant Principles

### 1. Truth Over Marketing
- **Principle:** If a claim cannot be demonstrated live in the console, it must be removed
- **Enforcement:** All marketing claims must map to demonstrable features
- **Example:** "Real-time reconciliation" → Remove if processing has delays

### 2. Enforcement Over Flexibility
- **Principle:** Backend enforcement beats frontend gating
- **Enforcement:** All plan limits enforced at API level, not just UI
- **Example:** Plan limits return 403 at API level, not just UI warnings

### 3. Determinism Over AI
- **Principle:** Reconciliation matching is deterministic, not AI-powered
- **Enforcement:** Matching algorithms are deterministic, confidence scores indicate uncertainty
- **Example:** "AI-powered reconciliation" → Remove, use "deterministic matching"

### 4. Fewer Features > More Certainty
- **Principle:** It is better to guarantee less and deliver reliably than to promise more and fail
- **Enforcement:** Remove features that cannot be proven or enforced
- **Example:** Remove "custom matching logic" if not implemented

### 5. Remove Rather Than Explain
- **Principle:** If something cannot be proven, remove it rather than add disclaimers
- **Enforcement:** Remove ambiguous claims, don't add fine print
- **Example:** Remove "100% accurate" rather than adding "in most cases"

### 6. Production Behavior Only
- **Principle:** No demo-only logic, production behavior only
- **Enforcement:** All features work in production, no mock data
- **Example:** Remove mock data, ensure all console data is real

### 7. Pricing Reflects Enforcement
- **Principle:** Pricing must reflect what is actually enforced
- **Enforcement:** Plan limits match pricing page, backend enforces limits
- **Example:** If pricing says "50K reconciliations/month", backend must enforce it

---

## Pricing Reality

### Current Pricing Tiers (From `billing-gating.ts`)

#### Free
- **Price:** $0/month
- **Reconciliations:** 1,000/month
- **API Requests:** 10,000/month
- **Adapters:** 2
- **Log Retention:** 7 days
- **Support:** Community

#### Starter
- **Price:** $99/month
- **Reconciliations:** 50,000/month
- **API Requests:** 500,000/month
- **Adapters:** 5
- **Log Retention:** 30 days
- **Support:** Email (24-hour SLA)

#### Growth
- **Price:** $599/month
- **Reconciliations:** 500,000/month
- **API Requests:** 5,000,000/month
- **Adapters:** 15
- **Log Retention:** 90 days
- **Support:** Priority email (24-hour SLA)

#### Scale
- **Price:** $4,999/month
- **Reconciliations:** 5,000,000/month
- **API Requests:** 50,000,000/month
- **Adapters:** Unlimited
- **Log Retention:** 1 year
- **Support:** Priority support (4-hour SLA)

#### Enterprise
- **Price:** Custom ($1,000-$10,000+/month)
- **Reconciliations:** Unlimited
- **API Requests:** Unlimited
- **Adapters:** Unlimited
- **Log Retention:** Custom (up to 7 years)
- **Support:** Dedicated account manager (1-hour SLA)

### Pricing Enforcement Rules

1. **Backend Enforcement Required:** All plan limits must be enforced at API level
2. **No Frontend-Only Gating:** UI warnings are insufficient, API must return 403
3. **Pilot/Trial Handling:** Pilots have unlimited usage, but expire after trial period
4. **Grace Period:** No billing account = allow operation (grace period for new users)
5. **Fail Open on Error:** If billing check fails, allow operation (fail open, not fail closed)

---

## System Guarantees (From `SYSTEM_GUARANTEES.md`)

### Guaranteed
1. **Data Isolation:** Tenant data isolated via RLS
2. **API Authentication:** All endpoints require authentication
3. **Usage Tracking:** Billable operations are tracked
4. **Idempotency:** API requests can be safely retried
5. **Webhook Delivery:** Webhooks delivered with retries and signatures

### Best-Effort (Not Guaranteed)
1. **Real-Time Processing:** Operations may be delayed
2. **100% Accuracy:** AI/ML operations have confidence scores
3. **Zero Downtime:** Brief outages may occur
4. **Perfect Data Consistency:** Eventual consistency is the norm
5. **Complete Error Recovery:** Some errors require manual intervention

---

## Workflow Truth (High-Level)

### 1. Onboarding
- **Step:** Sign up → Verify email → Get API key
- **Route:** `/signup` → `/verify-email` → `/dashboard/settings/api-keys`
- **Backend:** User creation, email verification, API key generation
- **Outcome:** User has API key, can make API calls

### 2. Data Ingestion
- **Step:** Connect adapter → Ingest transactions
- **Route:** `/api/v1/ingestion` (API) or `/console/adapters` (UI)
- **Backend:** Adapter connection, transaction ingestion, normalization
- **Outcome:** Transactions stored in database, normalized format

### 3. Reconciliation
- **Step:** Automatic reconciliation runs → Matches created → Exceptions flagged
- **Route:** Automatic (no user action required) or `/api/v1/recon/jobs` (manual trigger)
- **Backend:** Matching engine processes transactions, creates matches/exceptions
- **Outcome:** Reconciliation run complete, matches/exceptions visible

### 4. Exception Handling
- **Step:** Review exceptions → Resolve manually or accept
- **Route:** `/console/exceptions` or `/api/v1/exceptions`
- **Backend:** Exception records, resolution tracking
- **Outcome:** Exceptions resolved, audit trail updated

### 5. Audit Trail
- **Step:** View audit trail → Export reports
- **Route:** `/console/audit-trail` or `/api/v1/audit-trail`
- **Backend:** Audit log queries, report generation
- **Outcome:** Audit trail visible, reports exportable

### 6. Ongoing Operations
- **Step:** Monitor reconciliation → Review exceptions → Export reports
- **Route:** `/console/dashboard` (monitoring), `/console/exceptions` (review), `/console/reports` (export)
- **Backend:** Dashboard data, exception queries, report generation
- **Outcome:** Ongoing reconciliation, exception supervision, reporting

---

## Next Steps

1. **Phase 2:** Map detailed workflow with exact routes, backend logic, database entities
2. **Phase 3:** Audit all routes/actions/UI for 500s, access control, error states
3. **Phase 4:** Harden tenant isolation, plan entitlements, feature flags
4. **Phase 5:** Align pricing with enforcement, remove misaligned pricing language
5. **Phase 6:** Validate real moats vs marketing claims
6. **Phase 7:** Create canonical demo flow
7. **Phase 8:** Compress into unified narrative
8. **Phase 9:** Final verification checklist

---

**This document is LOCKED. Any changes must be approved and documented.**
