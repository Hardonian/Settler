# Settler Workflow Truth

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** LOCKED - Authoritative Workflow Definition  
**Purpose:** Exact end-to-end workflow mapping with routes, backend logic, database entities, and failure states

---

## Overview

This document maps the REAL end-to-end workflow for a Settler user. Each step includes:
- Exact UI route (if applicable)
- Backend API route
- Backend logic involved
- Database entities touched
- Expected outcome
- Failure states

**No implied steps. No assumed behavior. Only what exists and is enforced.**

---

## Workflow: Onboarding → Ingestion → Reconciliation → Exceptions → Audit

### Phase 1: Onboarding

#### Step 1.1: Sign Up
- **UI Route:** `/signup`
- **Backend Route:** N/A (handled by auth provider)
- **Backend Logic:** User creation via Supabase Auth
- **Database Entities:** `users` table (via Supabase Auth)
- **Expected Outcome:** User account created, email verification sent
- **Failure States:**
  - Email already exists → Error message
  - Invalid email format → Validation error
  - Password too weak → Validation error

#### Step 1.2: Email Verification
- **UI Route:** `/verify-email` (or email link)
- **Backend Route:** N/A (handled by Supabase Auth)
- **Backend Logic:** Email verification via Supabase Auth
- **Database Entities:** `users` table (email_verified flag)
- **Expected Outcome:** Email verified, user can sign in
- **Failure States:**
  - Invalid verification token → Error message
  - Token expired → Error message, resend option

#### Step 1.3: Sign In
- **UI Route:** `/signin` or `/login`
- **Backend Route:** N/A (handled by Supabase Auth)
- **Backend Logic:** Authentication via Supabase Auth (JWT)
- **Database Entities:** `users` table (last_sign_in_at)
- **Expected Outcome:** JWT token issued, user redirected to dashboard
- **Failure States:**
  - Invalid credentials → Error message
  - Email not verified → Error message, resend verification

#### Step 1.4: Get API Key
- **UI Route:** `/console/api-keys`
- **Backend Route:** `/api/api-keys` (GET, POST)
- **Backend Logic:** 
  - GET: List API keys for user
  - POST: Create new API key (starts with `sk_`)
- **Database Entities:** `api_keys` table
- **Expected Outcome:** API key created, displayed to user (shown once)
- **Failure States:**
  - Not authenticated → 401 Unauthorized
  - Rate limit exceeded → 429 Too Many Requests
  - Invalid request → 400 Bad Request

**Dead Ends Identified:**
- None (onboarding flow is complete)

---

### Phase 2: Data Ingestion

#### Step 2.1: Create Ingestion Source (Connector)
- **UI Route:** `/console/ingestion` (or via API)
- **Backend Route:** `POST /api/v1/ingestion/sources`
- **Backend Logic:**
  - Validate `name`, `type`, `connectorType`
  - Check kill switch for connector (`isConnectorDisabled`)
  - Create `ingestion_sources` record
- **Database Entities:** `ingestion_sources` table
- **Expected Outcome:** Ingestion source created, status "active"
- **Failure States:**
  - Missing required fields → 400 Bad Request
  - Connector disabled → 503 Service Unavailable
  - Invalid connector type → 400 Bad Request
  - Not authenticated → 401 Unauthorized

#### Step 2.2: Upload CSV (Alternative to Connector)
- **UI Route:** `/console/ingestion` (upload form)
- **Backend Route:** `POST /api/v1/ingestion/upload`
- **Backend Logic:**
  - Parse CSV file (headers, rows)
  - Auto-detect column mapping (`autoDetectColumnMapping`)
  - Validate mapping (`validateMapping`)
  - Check ingestion limit (`checkIngestionLimit` middleware)
  - Check kill switches (`isBackgroundJobPaused`, `canRunBackgroundJob`)
  - Create ingestion job (`createIngestion`)
  - Process CSV rows (`normalizeCSVRow`)
  - Create raw records (`createRawRecord`)
  - Batch create normalized transactions (`batchCreateNormalizedTransactions`)
  - Update ingestion status (`updateIngestionStatus`)
  - Track usage (`trackIngestionUsage`)
- **Database Entities:**
  - `ingestion_sources` (if source not provided)
  - `ingestions`
  - `raw_records`
  - `normalized_transactions`
  - `usage_events`
- **Expected Outcome:** CSV uploaded, transactions normalized, ingestion status "completed"
- **Failure States:**
  - No file uploaded → 400 Bad Request
  - CSV file empty → 400 Bad Request
  - Invalid column mapping → 400 Bad Request (with detected headers/mapping)
  - Ingestion limit exceeded → 403 Forbidden (plan limit)
  - Background job paused → 503 Service Unavailable
  - Background job limit exceeded → 429 Too Many Requests
  - Normalization failures → Partial success (failedCount > 0)

#### Step 2.3: View Ingestion Status
- **UI Route:** `/console/ingestion/[ingestionId]`
- **Backend Route:** `GET /api/v1/ingestion/:ingestionId`
- **Backend Logic:**
  - Query `ingestions` table by ID and tenant_id
  - Return ingestion details (status, counts, timestamps)
- **Database Entities:** `ingestions` table
- **Expected Outcome:** Ingestion details displayed (status, raw_record_count, normalized_count, failed_count)
- **Failure States:**
  - Ingestion not found → 404 Not Found
  - Not authenticated → 401 Unauthorized
  - Cross-tenant access → 404 Not Found (RLS prevents)

#### Step 2.4: View Normalized Transactions
- **UI Route:** `/console/ingestion/[ingestionId]` (transactions tab)
- **Backend Route:** `GET /api/v1/ingestion/:ingestionId/transactions`
- **Backend Logic:**
  - Query `normalized_transactions` by ingestion_id and tenant_id
  - Pagination (limit, offset)
- **Database Entities:** `normalized_transactions` table
- **Expected Outcome:** List of normalized transactions displayed
- **Failure States:**
  - Ingestion not found → 404 Not Found
  - No transactions → Empty array
  - Not authenticated → 401 Unauthorized

**Dead Ends Identified:**
- None (ingestion flow is complete)

---

### Phase 3: Reconciliation

#### Step 3.1: Run Reconciliation (Manual Trigger)
- **UI Route:** `/console/reconciliation` (or via API)
- **Backend Route:** `POST /api/v1/reconciliation/run`
- **Backend Logic:**
  - Validate `ingestionId`
  - Build reconciliation config (dateWindowDays, amountTolerance, etc.)
  - Call `runReconciliation` service
  - Create reconciliation run record
- **Database Entities:**
  - `reconciliation_runs` table
  - `reconciliation_matches` table (created during matching)
  - `reconciliation_exceptions` table (created for unmatched items)
- **Expected Outcome:** Reconciliation run started, runId returned, status "running"
- **Failure States:**
  - Missing ingestionId → 400 Bad Request
  - Ingestion not found → 404 Not Found
  - No transactions to reconcile → 400 Bad Request
  - Not authenticated → 401 Unauthorized

**Note:** Reconciliation may also run automatically when transactions are ingested (if configured). This is handled by background jobs, not user-initiated.

#### Step 3.2: View Reconciliation Run Status
- **UI Route:** `/console/reconciliation/[runId]`
- **Backend Route:** `GET /api/v1/reconciliation/runs/:runId`
- **Backend Logic:**
  - Query `reconciliation_runs` by ID and tenant_id
  - Return run details (status, counts, confidence scores)
- **Database Entities:** `reconciliation_runs` table
- **Expected Outcome:** Reconciliation run details displayed (status, matched_count, unmatched_source_count, unmatched_target_count, confidence_avg)
- **Failure States:**
  - Run not found → 404 Not Found
  - Not authenticated → 401 Unauthorized
  - Cross-tenant access → 404 Not Found (RLS prevents)

#### Step 3.3: View Reconciliation Matches
- **UI Route:** `/console/reconciliation/[runId]` (matches tab)
- **Backend Route:** `GET /api/v1/reconciliation/runs/:runId/matches`
- **Backend Logic:**
  - Query `reconciliation_matches` by run_id and tenant_id
  - Include source and target transaction details
  - Pagination (limit, offset)
- **Database Entities:**
  - `reconciliation_matches` table
  - `normalized_transactions` table (joined for source/target)
- **Expected Outcome:** List of matched transactions displayed (with confidence scores)
- **Failure States:**
  - Run not found → 404 Not Found
  - No matches → Empty array
  - Not authenticated → 401 Unauthorized

**Dead Ends Identified:**
- None (reconciliation flow is complete)

---

### Phase 4: Exception Handling

#### Step 4.1: View Exceptions
- **UI Route:** `/console/reconciliation/[runId]` (exceptions tab) or `/console/exceptions`
- **Backend Route:** `GET /api/v1/reconciliation/runs/:runId/exceptions` (or similar)
- **Backend Logic:**
  - Query `reconciliation_exceptions` by run_id and tenant_id
  - Include unmatched transaction details
  - Filter by exception type (unmatched_source, unmatched_target, mismatch)
- **Database Entities:**
  - `reconciliation_exceptions` table
  - `normalized_transactions` table (joined for transaction details)
- **Expected Outcome:** List of exceptions displayed (unmatched transactions, mismatches)
- **Failure States:**
  - Run not found → 404 Not Found
  - No exceptions → Empty array
  - Not authenticated → 401 Unauthorized

**Note:** Exception handling routes may not exist yet. If not, exceptions are viewed as part of reconciliation run details.

#### Step 4.2: Resolve Exception (Manual)
- **UI Route:** `/console/reconciliation/[runId]` (exception detail)
- **Backend Route:** `PUT /api/v1/reconciliation/exceptions/:exceptionId` (or similar)
- **Backend Logic:**
  - Update exception status (resolved, accepted, ignored)
  - Create audit trail entry
- **Database Entities:**
  - `reconciliation_exceptions` table
  - `audit_logs` table (if exists)
- **Expected Outcome:** Exception marked as resolved, audit trail updated
- **Failure States:**
  - Exception not found → 404 Not Found
  - Invalid status → 400 Bad Request
  - Not authenticated → 401 Unauthorized

**Dead Ends Identified:**
- Exception resolution endpoints may not exist → Need to verify and create if missing

---

### Phase 5: Audit Trail

#### Step 5.1: View Audit Trail
- **UI Route:** `/console/audit-trail`
- **Backend Route:** `GET /api/v1/audit-trail`
- **Backend Logic:**
  - Query audit trail records by tenant_id
  - Filter by date range, event type, user
  - Pagination (limit, offset)
- **Database Entities:** `audit_logs` table (or similar)
- **Expected Outcome:** Audit trail displayed (all reconciliation actions, matches, exceptions)
- **Failure States:**
  - No audit records → Empty array
  - Not authenticated → 401 Unauthorized
  - Plan limit exceeded (log retention) → 403 Forbidden (if log retention enforced)

#### Step 5.2: Export Audit Trail
- **UI Route:** `/console/audit-trail` (export button)
- **Backend Route:** `GET /api/v1/audit-trail/export` (or similar)
- **Backend Logic:**
  - Query audit trail records
  - Generate CSV/JSON export
  - Return file download
- **Database Entities:** `audit_logs` table
- **Expected Outcome:** Audit trail exported as CSV/JSON
- **Failure States:**
  - No audit records → Empty export
  - Export limit exceeded → 403 Forbidden (if plan limit enforced)
  - Not authenticated → 401 Unauthorized

**Dead Ends Identified:**
- Audit trail export endpoints may not exist → Need to verify and create if missing

---

## Ongoing Operations

### Monitoring Dashboard
- **UI Route:** `/console` (dashboard)
- **Backend Route:** `GET /api/v1/dashboard` (or similar)
- **Backend Logic:**
  - Aggregate reconciliation stats (total runs, match rate, exception count)
  - Recent reconciliation runs
  - Usage metrics (reconciliations/month, API calls)
- **Database Entities:**
  - `reconciliation_runs` table
  - `usage_events` table
  - `ingestions` table
- **Expected Outcome:** Dashboard displays key metrics and recent activity
- **Failure States:**
  - No data → Empty dashboard
  - Not authenticated → 401 Unauthorized

### Usage Monitoring
- **UI Route:** `/console/usage`
- **Backend Route:** `GET /api/v1/usage` (or similar)
- **Backend Logic:**
  - Query `usage_events` by tenant_id
  - Aggregate by event type, date
  - Compare against plan limits
- **Database Entities:** `usage_events` table
- **Expected Outcome:** Usage displayed (current usage vs plan limits)
- **Failure States:**
  - No usage data → Empty display
  - Not authenticated → 401 Unauthorized

---

## Failure State Summary

### Common Failure States Across All Steps

1. **401 Unauthorized:** Not authenticated (missing/invalid JWT or API key)
2. **403 Forbidden:** Plan limit exceeded, feature not available, pilot expired
3. **404 Not Found:** Resource not found (or RLS prevents access)
4. **400 Bad Request:** Invalid request (missing fields, invalid format)
5. **429 Too Many Requests:** Rate limit exceeded
6. **500 Internal Server Error:** Server error (should be logged, user sees generic message)
7. **503 Service Unavailable:** Kill switch active, service paused

### Error Message Requirements

All error responses must include:
- `error`: Error code (e.g., "UNAUTHORIZED", "PLAN_LIMIT_EXCEEDED")
- `message`: Human-readable message explaining WHY (not just WHAT)
- `traceId`: Request trace ID for debugging
- `upgrade_required`: Boolean (if applicable, for plan limit errors)

**Example:**
```json
{
  "error": "PLAN_LIMIT_EXCEEDED",
  "message": "You have reached your reconciliation limit (50,000/month) for the Starter plan. Upgrade to Growth ($599/month) to increase your limit to 500,000/month.",
  "traceId": "abc123",
  "upgrade_required": true,
  "current_usage": 50000,
  "limit": 50000,
  "current_plan": "starter",
  "recommended_plan": "growth"
}
```

---

## Dead Ends and Missing Steps

### Identified Dead Ends

1. **Exception Resolution:** Exception resolution endpoints may not exist → Need to verify
2. **Audit Trail Export:** Audit trail export endpoints may not exist → Need to verify
3. **Automatic Reconciliation:** Automatic reconciliation on ingestion may not be configured → Need to verify

### Missing Steps

1. **Connector Configuration:** Connector setup flow (OAuth, API keys) → Need to map
2. **Scheduled Reconciliation:** Scheduled reconciliation setup → Need to map
3. **Webhook Configuration:** Webhook setup for real-time updates → Need to map

---

## Next Steps

1. **Verify Exception Endpoints:** Check if exception resolution endpoints exist
2. **Verify Audit Trail Export:** Check if audit trail export endpoints exist
3. **Map Connector Setup:** Map OAuth/API key setup flow for connectors
4. **Map Scheduled Reconciliation:** Map scheduled reconciliation setup flow
5. **Map Webhook Setup:** Map webhook configuration flow
6. **Fix Dead Ends:** Create missing endpoints or remove UI references
7. **Add Error Messages:** Ensure all error messages explain WHY, not just WHAT

---

**This document is LOCKED. Any changes must be approved and documented.**
