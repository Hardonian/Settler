# Settler Workflow Gaps - Prioritized by Revenue Impact vs Effort

**Generated:** 2025-01-27  
**Purpose:** Ranked list of workflow gaps with revenue impact and implementation effort  
**Status:** Actionable Priority List

---

## Scoring Methodology

- **Revenue Impact:** Estimated monthly revenue increase per user (Low: <$50, Medium: $50-200, High: $200-500, Very High: $500+)
- **Implementation Effort:** Estimated weeks (Low: 1-2, Medium: 2-4, High: 4-6, Very High: 6+)
- **Priority:** P0 (blocking), P1 (high value), P2 (revenue growth), P3 (future)

---

## P0: Blocking Workflows (Must Fix)

### 1. Job Results Viewing API
**Gap:** Job detail page uses mock data, not connected to real API  
**Impact:** Users cannot see actual reconciliation results  
**Revenue Impact:** Very High (blocks all users from core value)  
**Effort:** Low (1 week)  
**Score:** 10/10 (Very High Impact / Low Effort)

**Implementation:**
- Create `GET /api/jobs/[jobId]` endpoint
- Connect to `recon_results`, `reconciliation_runs`, `reconciliation_matches` tables
- Update `packages/web/src/app/dashboard/jobs/[jobId]/page.tsx` to use real API

**Code References:**
- UI: `packages/web/src/app/dashboard/jobs/[jobId]/page.tsx` (currently mock)
- Database: `prisma/schema.prisma` → `ReconResult`, `ReconciliationRun`, `ReconciliationMatch`
- API: Create `packages/web/src/app/api/jobs/[jobId]/route.ts`

---

### 2. Exception Review UI
**Gap:** No UI for reviewing unmatched transactions  
**Impact:** Users cannot resolve exceptions, workflow incomplete  
**Revenue Impact:** Very High (blocks core workflow)  
**Effort:** High (3-4 weeks)  
**Score:** 8/10 (Very High Impact / High Effort)

**Implementation:**
- Create `/dashboard/jobs/[jobId]/exceptions` page
- Create `GET /api/reconciliation/[runId]/unmatched` endpoint
- Add manual matching UI
- Add bulk actions (mark as expected, export)
- Store manual matches in `ReconciliationMatch` table

**Code References:**
- Database: `prisma/schema.prisma` → `ReconciliationMatch` → `matchType: 'manual'`, `reviewed`, `reviewedBy`
- Create: `packages/web/src/app/dashboard/jobs/[jobId]/exceptions/page.tsx`
- Create: `packages/web/src/app/api/reconciliation/[runId]/unmatched/route.ts`

---

### 3. Scheduled Job Execution
**Gap:** Cron scheduler not implemented, scheduled jobs never run  
**Impact:** Recurring revenue blocked, users must manually trigger jobs  
**Revenue Impact:** Very High (blocks recurring revenue model)  
**Effort:** Medium-High (2-3 weeks)  
**Score:** 9/10 (Very High Impact / Medium-High Effort)

**Implementation:**
- Implement cron scheduler service
- Create `packages/api/src/infrastructure/jobs/scheduler.ts`
- Use `node-cron` or similar library
- Query `recon_jobs` where `scheduleCron` is set
- Execute jobs at scheduled times
- Handle timezone conversion (`scheduleTimezone`)

**Code References:**
- Database: `prisma/schema.prisma` → `ReconJob` → `scheduleCron`, `scheduleTimezone`
- Service: `packages/api/src/infrastructure/jobs/scheduler.ts` (exists but may be incomplete)

---

### 4. Jobs List API
**Gap:** Jobs list page uses mock data  
**Impact:** Users cannot see their actual jobs  
**Revenue Impact:** Very High (blocks workflow)  
**Effort:** Low (1 week)  
**Score:** 10/10 (Very High Impact / Low Effort)

**Implementation:**
- Update `GET /api/v1/recon/jobs` to return real data
- Connect to `recon_jobs` table
- Add filtering by status, search
- Update `packages/web/src/app/dashboard/jobs/page.tsx` to use real API

**Code References:**
- UI: `packages/web/src/app/dashboard/jobs/page.tsx` (currently mock)
- API: `packages/web/src/app/api/v1/recon/jobs/route.ts` → `GET /` (returns empty array)
- Database: `prisma/schema.prisma` → `ReconJob`

---

## P1: High Value Features (Quick Wins)

### 5. Failure Notifications
**Gap:** No notifications when jobs fail  
**Impact:** Users discover failures days later, trust risk  
**Revenue Impact:** Medium (+$25-50/mo per user)  
**Effort:** Low (1-2 weeks)  
**Score:** 7/10 (Medium Impact / Low Effort)

**Implementation:**
- Add email notification triggers on job failure
- Use existing email service (`packages/api/src/services/email/`)
- Create failure notification template
- Add webhook support (optional)
- Store notification preferences in user settings

**Code References:**
- Email Service: `packages/api/src/services/email/` (exists)
- Database: `prisma/schema.prisma` → `ReconResult` → `status: 'failed'`, `errorMessage`
- Create: Notification trigger in job execution service

---

### 6. Progress Tracking
**Gap:** Job execution is async but no progress UI  
**Impact:** Users don't know if job is stuck or processing  
**Revenue Impact:** Medium (UX improvement, reduces support)  
**Effort:** Medium (2-3 weeks)  
**Score:** 6/10 (Medium Impact / Medium Effort)

**Implementation:**
- Add progress events to job execution
- Store progress in `ReconResult.metadata` or new `job_progress` table
- Create WebSocket or polling endpoint for progress updates
- Update UI to show progress bar
- Add estimated time remaining

**Code References:**
- Database: `prisma/schema.prisma` → `ReconResult` → `metadata` (JSON)
- Create: `GET /api/jobs/[jobId]/progress` endpoint
- Update: `packages/web/src/app/dashboard/jobs/[jobId]/page.tsx` with progress UI

---

### 7. Export Functionality
**Gap:** Export button exists but functionality not implemented  
**Impact:** Users cannot export results for accounting systems  
**Revenue Impact:** Medium (+$50-150/mo, compliance requirement)  
**Effort:** Medium (2-3 weeks)  
**Score:** 6/10 (Medium Impact / Medium Effort)

**Implementation:**
- Implement `POST /api/exports` endpoint
- Create export service (`packages/api/src/services/export/`)
- Support CSV, JSON, Excel formats
- Generate signed URLs for downloads
- Store exports in `exports` table
- Add accounting system-specific formats (QuickBooks, Xero)

**Code References:**
- Database: `prisma/schema.prisma` → `Export` model (exists)
- Create: `packages/web/src/app/api/exports/route.ts`
- Create: `packages/api/src/services/export/export-service.ts`

---

### 8. Adapter Connection Health Check
**Gap:** No validation of adapter credentials before job creation  
**Impact:** Jobs fail after creation, poor UX  
**Revenue Impact:** Medium (reduces support, improves UX)  
**Effort:** Low-Medium (1-2 weeks)  
**Score:** 7/10 (Medium Impact / Low-Medium Effort)

**Implementation:**
- Add `POST /api/connectors/test/[providerId]` endpoint (may exist)
- Test adapter connection before job creation
- Show connection status in UI
- Validate credentials format

**Code References:**
- API: `packages/web/src/app/api/connectors/test/[providerId]/route.ts` (may exist)
- Update: Job creation UI to test connection first

---

## P2: Revenue Growth Features

### 9. Receipt Auto-Matching
**Gap:** Receipts exist but don't auto-match to transactions  
**Impact:** Manual work required, feature underutilized  
**Revenue Impact:** Medium (+$50-150/mo per user)  
**Effort:** Medium (2-3 weeks)  
**Score:** 5/10 (Medium Impact / Medium Effort)

**Implementation:**
- Create receipt-to-transaction matching algorithm
- Match by amount, date, merchant name
- Store matches in `receipt_transaction_matches` table (new)
- Show matches in UI with confidence scores
- Allow manual override

**Code References:**
- Database: `prisma/schema.prisma` → `Receipt`, `ReceiptUpload`, `NormalizedTransaction`
- Create: Matching service `packages/api/src/services/receipt-matching.ts`
- Update: `/console/receipts` page with match indicators

---

### 10. Rule Optimization Suggestions
**Gap:** No suggestions for improving match rates  
**Impact:** Users struggle with low match rates  
**Revenue Impact:** Low-Medium (+$50-100/mo per user)  
**Effort:** Medium (2 weeks)  
**Score:** 4/10 (Low-Medium Impact / Medium Effort)

**Implementation:**
- Analyze match patterns from historical runs
- Identify common unmatched transaction types
- Suggest rule adjustments (tolerance, date window)
- Show impact estimate (match rate improvement)
- A/B test suggestions

**Code References:**
- Database: `prisma/schema.prisma` → `ReconciliationMatch`, `ReconResult`
- Create: `packages/api/src/services/rule-optimizer.ts`
- Update: Job creation UI with suggestions

---

### 11. Automatic Retry Logic
**Gap:** No retry for failed adapter connections  
**Impact:** Manual intervention required for transient failures  
**Revenue Impact:** Low-Medium (+$25-75/mo per user)  
**Effort:** Low-Medium (1-2 weeks)  
**Score:** 5/10 (Low-Medium Impact / Low-Medium Effort)

**Implementation:**
- Add retry logic to adapter connection service
- Exponential backoff (3 retries)
- Retry only for transient errors (network, rate limit)
- Store retry attempts in `ReconResult.metadata`
- Show retry status in UI

**Code References:**
- Service: Adapter connection service (implied)
- Database: `prisma/schema.prisma` → `ReconResult` → `metadata`

---

### 12. Bulk Operations
**Gap:** No bulk actions for jobs (pause, resume, delete)  
**Impact:** Manual work for managing multiple jobs  
**Revenue Impact:** Low (+$25-50/mo per user)  
**Effort:** Low-Medium (1-2 weeks)  
**Score:** 4/10 (Low Impact / Low-Medium Effort)

**Implementation:**
- Add bulk selection UI in jobs list
- Create `POST /api/jobs/bulk` endpoint
- Support actions: pause, resume, delete, export
- Update job statuses in batch
- Show confirmation dialog

**Code References:**
- UI: `packages/web/src/app/dashboard/jobs/page.tsx`
- Create: `packages/web/src/app/api/jobs/bulk/route.ts`
- Database: `prisma/schema.prisma` → `ReconJob` → `status`

---

## P3: Future Features (Defer)

### 13. Multi-Source Reconciliation
**Gap:** Cannot reconcile multiple sources against one target  
**Impact:** Blocks enterprise customers with multiple payment processors  
**Revenue Impact:** High (+$200-500/mo) but low user count  
**Effort:** Very High (4-6 weeks)  
**Score:** 3/10 (High Impact / Very High Effort)

**Implementation:**
- Major architecture change
- Support multiple `sourceAdapter` values in `ReconJob`
- Merge transactions from multiple sources
- Handle duplicates across sources
- Conflict resolution UI

**Code References:**
- Database: `prisma/schema.prisma` → `ReconJob` → `sourceAdapter` (single value)
- Service: `packages/api/src/services/recon-core.ts` (needs major refactor)

**Defer Until:** Enterprise demand confirmed

---

### 14. Approval Workflows
**Gap:** No approval process for low-confidence matches  
**Impact:** Compliance requirement for some customers  
**Revenue Impact:** Medium (+$100-300/mo) but low user count  
**Effort:** High (3-4 weeks)  
**Score:** 2/10 (Medium Impact / High Effort)

**Implementation:**
- Create approval workflow engine
- Add `approval_requests` table
- Route low-confidence matches to approvers
- Email notifications for pending approvals
- Approval UI with comments

**Code References:**
- Database: Create `approval_requests` table
- Service: `packages/api/src/services/approval-workflows.ts` (may exist)
- Create: Approval UI components

**Defer Until:** Compliance demand confirmed

---

### 15. Advanced Audit Trail
**Gap:** Basic audit logs exist but limited UI  
**Impact:** Compliance requirement for enterprise  
**Revenue Impact:** Medium (+$150-400/mo) but low user count  
**Effort:** Medium-High (2-3 weeks)  
**Score:** 3/10 (Medium Impact / Medium-High Effort)

**Implementation:**
- Enhance `AuditLog` model with more fields
- Create audit trail UI (`/console/audit-trail`)
- Add filtering, search, export
- Compliance-specific exports
- Read-only auditor role

**Code References:**
- Database: `prisma/schema.prisma` → `AuditLog` (exists)
- UI: `packages/web/src/app/console/audit-trail/page.tsx` (may exist)
- Update: Add more audit events

**Defer Until:** Enterprise demand confirmed

---

### 16. Currency Conversion
**Gap:** Cannot reconcile transactions in different currencies  
**Impact:** Blocks international customers  
**Revenue Impact:** Medium (+$100-200/mo) but low user count  
**Effort:** Medium (2-3 weeks)  
**Score:** 3/10 (Medium Impact / Medium Effort)

**Implementation:**
- Integrate currency conversion API (e.g., ExchangeRate-API)
- Add conversion to matching algorithm
- Store exchange rates used
- Show conversion in UI
- Handle currency fluctuations

**Code References:**
- Database: `prisma/schema.prisma` → `NormalizedTransaction` → `currency`
- Service: Matching algorithm (needs currency conversion)

**Defer Until:** International customer demand

---

## Summary: Prioritized Action Plan

### Phase 1: P0 Blocking Issues (6-8 weeks)
1. Job Results Viewing API (1 week)
2. Jobs List API (1 week)
3. Exception Review UI (3-4 weeks)
4. Scheduled Job Execution (2-3 weeks)

**Total Revenue Impact:** Unblocks all users, enables recurring revenue  
**Total Effort:** 6-8 weeks

---

### Phase 2: P1 High Value Features (4-6 weeks)
5. Failure Notifications (1-2 weeks)
6. Progress Tracking (2-3 weeks)
7. Export Functionality (2-3 weeks)
8. Adapter Connection Health Check (1-2 weeks)

**Total Revenue Impact:** +$100-300/mo per user  
**Total Effort:** 4-6 weeks

---

### Phase 3: P2 Revenue Growth (4-6 weeks)
9. Receipt Auto-Matching (2-3 weeks)
10. Rule Optimization Suggestions (2 weeks)
11. Automatic Retry Logic (1-2 weeks)
12. Bulk Operations (1-2 weeks)

**Total Revenue Impact:** +$150-375/mo per user  
**Total Effort:** 4-6 weeks

---

### Phase 4: P3 Future Features (Defer)
13. Multi-Source Reconciliation (4-6 weeks) - Defer until enterprise demand
14. Approval Workflows (3-4 weeks) - Defer until compliance demand
15. Advanced Audit Trail (2-3 weeks) - Defer until enterprise demand
16. Currency Conversion (2-3 weeks) - Defer until international demand

---

## Total Estimated Impact

- **Phase 1 (P0):** Unblocks core workflows, enables recurring revenue
- **Phase 2 (P1):** +$100-300/mo per user
- **Phase 3 (P2):** +$150-375/mo per user
- **Combined:** +$250-675/mo per user after all phases

**Total Implementation Time:** 14-20 weeks

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-27  
**Next Review:** After Phase 1 completion
