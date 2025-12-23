# Ops Autopilot - Failure Mode Inventory

**Generated:** 2025-01-27  
**Purpose:** Phase 1 - Enumerate critical flows and their failure modes

## Critical Flows & Failure Modes

### 1. Auth/Session Flow
**Endpoints:** `/api/auth/*`, middleware authentication

**External Dependencies:**
- Supabase Auth
- Session storage (cookies/localStorage)

**Failure Modes:**
- Supabase Auth service down → All authenticated routes fail
- Session expiry mid-request → User sees 401 unexpectedly
- Cookie corruption → User cannot authenticate
- RLS policy misconfiguration → Data leaks or false denials

**Current Behavior:**
- Some routes return 401/403 (good)
- Some routes catch auth errors and return 500 (bad)
- No graceful degradation when auth service is down

**Missing Guards:**
- Timeout on auth checks
- Retry logic for transient auth failures
- Fallback to cached session state

---

### 2. Adapter Ingestion Flow
**Endpoints:** `/api/connectors/sync/[providerId]`, `/api/connectors/backfill/[providerId]`

**External Dependencies:**
- External APIs (Stripe, Shopify, etc.)
- Database (Supabase/Prisma)
- Encryption service for credentials

**Failure Modes:**
- External API rate limits → Ingestion fails, no retry
- External API downtime → All syncs fail globally
- Credential decryption fails → Job fails silently
- Database timeout → Partial ingestion, no rollback
- Network timeout → Job hangs indefinitely

**Current Behavior:**
- No idempotency keys → Duplicate ingestion on retry
- No retry logic for transient failures
- No per-tenant rate limiting
- Errors bubble up as 500

**Missing Guards:**
- Idempotency keys per sync
- Exponential backoff for external APIs
- Per-tenant rate limits
- Timeout enforcement
- Partial success handling

---

### 3. Receipt Upload/Parse Flow
**Endpoints:** `/api/v1/receipts`

**External Dependencies:**
- OCR provider (external service)
- File storage (URL fetch or inline)
- Database (Prisma)

**Failure Modes:**
- OCR provider down → All receipts fail
- OCR provider timeout → Request hangs
- Invalid image format → Parse fails, no graceful error
- Database write fails → Receipt lost
- File fetch timeout → No retry

**Current Behavior:**
- Returns 200 with demo response on error (good for playground)
- No retry for OCR failures
- No idempotency → Duplicate uploads possible
- No correlation ID propagation to OCR provider

**Missing Guards:**
- OCR retry with backoff
- Idempotency keys for uploads
- Timeout on OCR calls
- Graceful degradation (return partial data)

---

### 4. Reconciliation Job Create/Run Flow
**Endpoints:** `/api/v1/recon/jobs`, `/api/runs/create`, job processor

**External Dependencies:**
- Database (job state)
- Job queue/worker
- Reconciliation engine

**Failure Modes:**
- Job creation succeeds but worker never picks it up → Job stuck
- Worker crashes mid-execution → Job lost
- Database deadlock → Job creation fails
- Reconciliation engine timeout → Job hangs
- State machine corruption → Job stuck in invalid state

**Current Behavior:**
- Job processor has retry logic (good)
- No idempotency keys → Duplicate jobs possible
- Optimistic locking exists but may race
- No dead-letter recovery path visible to users

**Missing Guards:**
- Idempotency keys for job creation
- Heartbeat/health checks for workers
- Job timeout enforcement
- State machine validation
- Dead-letter recovery UI

---

### 5. Export/Report Generation Flow
**Endpoints:** `/api/exports/*` (if exists), report generation

**External Dependencies:**
- Database queries (large datasets)
- File storage (S3/Supabase Storage)
- Report generation service

**Failure Modes:**
- Large query timeout → Export fails
- Storage quota exceeded → Export fails silently
- Report generation OOM → Process killed
- Concurrent exports → Database overload

**Current Behavior:**
- Unknown (need to check if exists)
- Likely no rate limiting
- No idempotency

**Missing Guards:**
- Query timeout enforcement
- Storage quota checks
- Per-tenant export limits
- Idempotency keys
- Progress tracking

---

### 6. Webhooks Flow
**Endpoints:** `/api/connectors/webhook/[providerId]`, webhook delivery

**External Dependencies:**
- External webhook endpoints (customer URLs)
- HMAC signing service
- Webhook delivery queue

**Failure Modes:**
- Customer endpoint down → Webhook lost
- Customer endpoint slow → Queue backs up
- HMAC signing fails → Webhook rejected
- Delivery timeout → Webhook lost
- Retry exhaustion → Webhook permanently lost

**Current Behavior:**
- WebhookDelivery model exists with retry fields
- Unknown if retry logic is implemented
- No per-tenant webhook rate limits

**Missing Guards:**
- Exponential backoff for retries
- Per-tenant webhook rate limits
- Dead-letter queue for failed webhooks
- Webhook delivery timeout
- Idempotency keys for webhook events

---

### 7. Scheduled/Cron Triggers Flow
**Endpoints:** `/api/cron/*`

**External Dependencies:**
- Vercel Cron (or external scheduler)
- Database queries
- Background job queue

**Failure Modes:**
- Cron secret mismatch → Job skipped
- Database timeout → Cron fails
- Job queue full → Cron fails
- Concurrent cron runs → Duplicate work

**Current Behavior:**
- Cron secret verification exists
- No idempotency → Duplicate runs possible
- Errors return 500 → Cron service may retry

**Missing Guards:**
- Idempotency keys per cron run
- Timeout enforcement
- Lock to prevent concurrent runs
- Graceful error handling (don't return 500)

---

### 8. Admin Analytics/Telemetry Views Flow
**Endpoints:** `/api/admin/monitoring/*`, `/api/console/*`

**External Dependencies:**
- Database queries (aggregations)
- Telemetry storage

**Failure Modes:**
- Large aggregation timeout → View fails
- Missing telemetry data → Incomplete metrics
- Database overload → All admin views slow

**Current Behavior:**
- Some routes return degraded status on error (good)
- No query timeout enforcement
- No caching

**Missing Guards:**
- Query timeout enforcement
- Caching for expensive queries
- Graceful degradation (show partial data)
- Rate limiting for admin endpoints

---

## Top Failure Risks (Priority Order)

1. **No Idempotency Keys** → Duplicate work on retry, data corruption
2. **No Per-Tenant Rate Limits** → One tenant can spike global cost
3. **Missing Timeouts** → Requests/jobs hang indefinitely
4. **Hard 500 Errors** → User-facing routes crash instead of degrading
5. **No Correlation IDs** → Cannot trace failures across services
6. **No Dead-Letter Recovery** → Failed jobs lost forever
7. **External API Failures** → No retry/backoff, cascading failures
8. **Database Timeouts** → No retry, partial failures

---

## Next Steps

- Phase 2: Implement idempotency patterns
- Phase 3: Add tenant containment (rate limits, quotas)
- Phase 4: Add correlation IDs and structured logging
- Phase 5: Eliminate hard-500 errors
- Phase 6: Add health checks
- Phase 7: Enhance doctor command
- Phase 8: Update CI gates
