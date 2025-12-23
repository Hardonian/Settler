# Settler.dev Canonical Workflows

**Generated:** 2025-01-27  
**Purpose:** Complete end-to-end workflow documentation derived from actual codebase  
**Status:** Canonical Reference

---

## Table of Contents

1. [User Personas](#user-personas)
2. [Day 0 Onboarding Workflows](#day-0-onboarding-workflows)
3. [First Successful Reconciliation](#first-successful-reconciliation)
4. [Ongoing Monthly Operations](#ongoing-monthly-operations)
5. [Failure and Exception Handling](#failure-and-exception-handling)
6. [Code Traceability Matrix](#code-traceability-matrix)
7. [Gap Analysis](#gap-analysis)
8. [Revenue Impact vs Effort Matrix](#revenue-impact-vs-effort-matrix)

---

## User Personas

### 1. Solo Founder / Operator

**Profile:**
- **Goals:** Quick setup, see where money is going, minimal time investment
- **Tolerance for Complexity:** Low
- **Frequency:** Weekly/Monthly
- **Authority Level:** Full
- **Willingness to Pay:** Low ($0-$50/mo)
- **Tech Comfort:** Low-Medium

**Key Workflows:**
- One-time manual reconciliation
- Receipt upload for expense tracking
- Basic Stripe → bank reconciliation

**Pain Points:**
- Too many steps to get started
- Unclear what adapters to use
- Confusing terminology

---

### 2. SMB Finance Lead

**Profile:**
- **Goals:** Accurate monthly reconciliation, compliance, team collaboration
- **Tolerance for Complexity:** Medium
- **Frequency:** Daily/Weekly
- **Authority Level:** High (within finance)
- **Willingness to Pay:** Medium-High ($100-$500/mo)
- **Tech Comfort:** Medium

**Key Workflows:**
- Scheduled recurring reconciliation
- Multi-adapter reconciliation (Stripe + PayPal + bank)
- Exception handling and review
- Export for accounting systems

**Pain Points:**
- Manual exception review is tedious
- No approval workflows
- Limited audit trail visibility

---

### 3. Enterprise Operations Manager

**Profile:**
- **Goals:** Monitor reconciliation health, set up automation, alert on failures
- **Tolerance for Complexity:** Medium-High
- **Frequency:** Daily
- **Authority Level:** Medium
- **Willingness to Pay:** Medium-High ($200-$1000/mo)
- **Tech Comfort:** High

**Key Workflows:**
- Scheduled job monitoring
- Webhook configuration
- Alert setup
- Performance monitoring

**Pain Points:**
- No real-time monitoring dashboard
- Alert configuration is complex
- No SLA tracking

---

### 4. Accountant / Bookkeeper

**Profile:**
- **Goals:** Client reconciliation management, multi-tenant access, detailed reporting
- **Tolerance for Complexity:** High
- **Frequency:** Daily
- **Authority Level:** High (client access)
- **Willingness to Pay:** High ($200-$1000/mo)
- **Tech Comfort:** Medium-High

**Key Workflows:**
- Bulk historical backfill
- Multi-client reconciliation
- Custom matching rules
- Detailed discrepancy reports

**Pain Points:**
- No client-level isolation UI
- Limited bulk operations
- Export formats don't match accounting software

---

### 5. Auditor / Compliance Reviewer

**Profile:**
- **Goals:** Review reconciliation accuracy, audit trail access, compliance reporting
- **Tolerance for Complexity:** Low-Medium
- **Frequency:** Quarterly/Annually
- **Authority Level:** Read-only
- **Willingness to Pay:** Enterprise ($1000+/mo)
- **Tech Comfort:** Low-Medium

**Key Workflows:**
- Read-only access to all reconciliations
- Audit log review
- Compliance export
- Historical data access

**Pain Points:**
- No read-only role in UI
- Audit logs hard to navigate
- No compliance-specific exports

---

### 6. Integration Engineer

**Profile:**
- **Goals:** API-first workflow, programmatic job creation, custom adapters
- **Tolerance for Complexity:** Very High
- **Frequency:** As needed
- **Authority Level:** Technical
- **Willingness to Pay:** Variable
- **Tech Comfort:** Very High

**Key Workflows:**
- API-based job creation
- Custom adapter development
- Webhook integration
- CLI usage

**Pain Points:**
- API documentation gaps
- No SDK for some languages
- Webhook reliability unclear

---

## Day 0 Onboarding Workflows

### Persona 1: Solo Founder / Operator

#### Step 1: Sign Up
**Entry Point:** `/signup` (page.tsx)  
**Backend:** `POST /api/auth/signup` → Supabase Auth  
**Database:** `auth.users` (Supabase), `onboarding_progress` table  
**Feature Flags:** None

**Flow:**
1. User visits `/signup`
2. Fills form (email, password, name, accepts terms)
3. `signUpUser()` action called (`app/actions/auth.ts`)
4. Supabase Auth creates user
5. `onboarding_progress` record created with `currentStep: 'welcome'`
6. Redirect to `/console?welcome=true`

**Gaps:**
- ⚠️ No email verification step enforced
- ⚠️ No welcome email sent automatically
- ⚠️ No billing account auto-creation (happens lazily on first API call)

**Code References:**
- UI: `packages/web/src/app/signup/page.tsx`
- Auth: `packages/web/src/app/actions/auth.ts`
- Onboarding: `packages/web/src/lib/onboarding/service.ts`
- Database: `prisma/schema.prisma` → `OnboardingProgress` model

---

#### Step 2: Welcome / Console Landing
**Entry Point:** `/console` (page.tsx)  
**Backend:** Server-side data fetching  
**Database:** `onboarding_progress`, `billing_accounts`  
**Feature Flags:** None

**Flow:**
1. User lands on `/console`
2. `ConsoleOverviewContent()` fetches onboarding progress
3. `WelcomeBannerClient` component shows welcome message
4. `OnboardingWizardClient` shows current step
5. If no billing account exists, one is created lazily

**Gaps:**
- ⚠️ Billing account creation is lazy (may fail silently)
- ⚠️ No explicit "Get Started" flow for first-time users
- ✅ Onboarding wizard exists but may be skipped

**Code References:**
- UI: `packages/web/src/app/console/page.tsx`
- Components: `packages/web/src/components/onboarding/OnboardingWizardClient.tsx`
- Service: `packages/web/src/lib/onboarding/service.ts`

---

#### Step 3: Create API Key
**Entry Point:** `/console/api-keys` (via onboarding wizard)  
**Backend:** `POST /api/console/api-keys`  
**Database:** `api_keys` table (implied, not in Prisma schema)  
**Feature Flags:** None

**Flow:**
1. User clicks "Create API Key" from onboarding wizard
2. Navigates to `/console/api-keys`
3. Clicks "Create New Key"
4. API key generated and stored
5. Onboarding step marked complete: `completeStep(userId, 'create_api_key')`

**Gaps:**
- ❌ API keys table not in Prisma schema (may use Supabase directly)
- ⚠️ No API key validation/format checking visible
- ⚠️ No rate limit warnings shown

**Code References:**
- Onboarding: `packages/web/src/lib/onboarding/service.ts` → `ONBOARDING_STEPS`
- API Route: `packages/web/src/app/api/console/api-keys/route.ts` (implied)

---

#### Step 4: Try Playground
**Entry Point:** `/console/playground`  
**Backend:** Demo mode (no auth required)  
**Database:** None (demo only)  
**Feature Flags:** None

**Flow:**
1. User clicks "Try Playground" from onboarding wizard
2. Navigates to `/console/playground`
3. Can test APIs without authentication
4. Onboarding step marked complete: `completeStep(userId, 'try_playground')`

**Gaps:**
- ✅ Playground works without auth (good for onboarding)
- ⚠️ No guided tutorial in playground
- ⚠️ Demo responses may confuse users about real behavior

**Code References:**
- UI: `packages/web/src/app/console/playground/page.tsx`
- Onboarding: `packages/web/src/lib/onboarding/service.ts` → step `try_playground`

---

#### Step 5: First Reconciliation
**Entry Point:** `/console/playground/reconcile`  
**Backend:** `POST /api/v1/recon/jobs`  
**Database:** `recon_jobs`, `recon_results`  
**Feature Flags:** None

**Flow:**
1. User navigates to `/console/playground/reconcile`
2. Selects source adapter (e.g., Stripe)
3. Provides source credentials/config
4. Selects target adapter (e.g., QuickBooks)
5. Provides target credentials/config
6. Sets date range
7. Optionally configures matching rules
8. Submits reconciliation job
9. Job created: `POST /api/v1/recon/jobs` → creates `ReconJob` record
10. Job execution starts (async)
11. Results stored in `ReconResult` table
12. Onboarding step marked complete: `completeStep(userId, 'first_reconciliation')`

**Gaps:**
- ⚠️ Job execution is async but no progress tracking UI
- ⚠️ No email notification when job completes
- ⚠️ No error handling UI for adapter connection failures
- ❌ No validation of adapter credentials before job creation

**Code References:**
- UI: `packages/web/src/app/console/playground/reconcile/page.tsx` (implied)
- API: `packages/web/src/app/api/v1/recon/jobs/route.ts`
- Backend: `packages/api/src/routes/v1/recon/jobs.ts`
- Database: `prisma/schema.prisma` → `ReconJob`, `ReconResult` models

---

### Persona 2: SMB Finance Lead

#### Day 0 Flow (Similar but with team focus)

**Step 1-4:** Same as Solo Founder

**Step 5: Invite Team**
**Entry Point:** `/console` → Team section  
**Backend:** `POST /api/workspaces/[workspaceId]/invites`  
**Database:** `workspace_invites`  
**Feature Flags:** None

**Flow:**
1. User navigates to team/invite section
2. Enters email addresses
3. Selects roles (owner, admin, member, viewer)
4. Invite created: `WorkspaceInvite` record
5. Email sent with invite token
6. Invitee clicks link: `/invite/[token]`
7. Accepts invite, account created/linked
8. Onboarding step marked complete: `completeStep(userId, 'invite_team')`

**Gaps:**
- ⚠️ No role-based UI differences visible
- ⚠️ No workspace concept in UI (only tenant)
- ❌ No bulk invite functionality

**Code References:**
- API: `packages/web/src/app/api/workspaces/[workspaceId]/invites/route.ts`
- Database: `prisma/schema.prisma` → `WorkspaceInvite` model
- UI: `packages/web/src/app/invite/[token]/page.tsx`

---

## First Successful Reconciliation

### Common Flow (All Personas)

#### Step 1: Job Creation
**Entry Point:** `/console/playground/reconcile` or `POST /api/v1/recon/jobs`  
**Backend:** `POST /api/v1/recon/jobs`  
**Database:** `recon_jobs`  
**Feature Flags:** None

**Flow:**
1. User creates reconciliation job
2. `POST /api/v1/recon/jobs` called
3. `ReconJob` record created with:
   - `sourceAdapter`, `sourceConfigEncrypted`
   - `targetAdapter`, `targetConfigEncrypted`
   - `mappingTemplateId` (optional)
   - `transformRecipeId` (optional)
   - `validationRules` (JSON)
   - `reconStrategy` (default: "deterministic")
   - `scheduleCron` (optional, for recurring)
4. Job status: `status: 'active'`

**Code References:**
- API: `packages/web/src/app/api/v1/recon/jobs/route.ts`
- Backend: `packages/api/src/routes/v1/recon/jobs.ts` → `POST /`
- Service: `packages/api/src/services/recon-core.ts` (implied)
- Database: `prisma/schema.prisma` → `ReconJob` model

---

#### Step 2: Adapter Connection & Data Fetching
**Backend:** Adapter service (not directly exposed)  
**Database:** `ingestion_sources`, `ingestions`, `raw_records`, `normalized_transactions`  
**Feature Flags:** None

**Flow:**
1. Job execution triggered (manual or scheduled)
2. Source adapter connects using `sourceConfigEncrypted`
3. Fetches transactions from source system
4. `IngestionSource` record created/updated
5. `Ingestion` record created
6. Raw data stored in `RawRecord` table
7. Data normalized → `NormalizedTransaction` records
8. Target adapter connects using `targetConfigEncrypted`
9. Fetches transactions from target system
10. Same ingestion pipeline for target data

**Gaps:**
- ❌ No connection health check before job execution
- ❌ No retry logic for adapter connection failures
- ⚠️ No progress tracking during data fetch
- ⚠️ No partial results if one adapter fails

**Code References:**
- Database: `prisma/schema.prisma` → `IngestionSource`, `Ingestion`, `RawRecord`, `NormalizedTransaction`
- Service: `packages/api/src/services/ingestion/` (implied)

---

#### Step 3: Matching Algorithm
**Backend:** Reconciliation matcher service  
**Database:** `reconciliation_runs`, `reconciliation_matches`  
**Feature Flags:** None

**Flow:**
1. `ReconciliationRun` record created
2. Matching algorithm runs:
   - Exact match on `external_id` (if available)
   - Amount match (within tolerance)
   - Date match (within window)
   - Fuzzy description match
   - Currency match (required)
3. Matches stored in `ReconciliationMatch` table:
   - `matchType`: "exact", "fuzzy", "manual", "unmatched"
   - `confidence`: 0.0000 to 1.0000
   - `matchReason`: text explanation
   - `amountDiff`, `dateDiff`: calculated differences
4. Run status updated: `status: 'completed'`
5. Summary stats calculated:
   - `matchedCount`, `unmatchedSourceCount`, `unmatchedTargetCount`
   - `confidenceAvg`, `confidenceMin`, `confidenceMax`

**Gaps:**
- ⚠️ Matching rules not fully configurable via UI
- ⚠️ Confidence threshold hardcoded (0.80)
- ❌ No manual match override UI
- ❌ No match review/approval workflow

**Code References:**
- Database: `prisma/schema.prisma` → `ReconciliationRun`, `ReconciliationMatch`
- Service: `packages/api/src/services/recon-core.ts` (implied)

---

#### Step 4: Results Viewing
**Entry Point:** `/dashboard/jobs/[jobId]`  
**Backend:** `GET /api/jobs/[jobId]` (implied)  
**Database:** `recon_results`, `reconciliation_runs`, `reconciliation_matches`  
**Feature Flags:** None

**Flow:**
1. User navigates to `/dashboard/jobs/[jobId]`
2. Job details fetched (currently mock data)
3. Summary stats displayed:
   - Total transactions
   - Matched count
   - Unmatched count
   - Conflicts count
   - Accuracy percentage
4. Confidence indicator shown
5. Export options available (CSV, JSON)

**Gaps:**
- ❌ Job detail page uses mock data (not connected to real API)
- ❌ No drill-down into individual matches
- ❌ No unmatched transaction review UI
- ❌ No conflict resolution UI
- ⚠️ Export functionality not implemented

**Code References:**
- UI: `packages/web/src/app/dashboard/jobs/[jobId]/page.tsx`
- UI: `packages/web/src/app/dashboard/jobs/page.tsx`
- Database: `prisma/schema.prisma` → `ReconResult`, `ReconciliationRun`, `ReconciliationMatch`

---

## Ongoing Monthly Operations

### Persona 2: SMB Finance Lead

#### Step 1: Scheduled Job Setup
**Entry Point:** `/console/playground/reconcile` → Schedule section  
**Backend:** `POST /api/v1/recon/jobs` with `scheduleCron`  
**Database:** `recon_jobs` → `scheduleCron`, `scheduleTimezone`  
**Feature Flags:** None

**Flow:**
1. User creates reconciliation job
2. Sets `scheduleCron` (e.g., "0 0 1 * *" for monthly)
3. Sets `scheduleTimezone` (default: "UTC")
4. Job saved with schedule
5. Cron scheduler picks up job at scheduled time
6. Job executes automatically

**Gaps:**
- ❌ No cron scheduler implementation visible
- ❌ No UI for managing scheduled jobs
- ❌ No schedule validation/error handling
- ⚠️ No notification when scheduled job runs

**Code References:**
- Database: `prisma/schema.prisma` → `ReconJob` → `scheduleCron`, `scheduleTimezone`
- Scheduler: `packages/api/src/infrastructure/jobs/scheduler.ts` (implied)

---

#### Step 2: Job Monitoring
**Entry Point:** `/dashboard/jobs`  
**Backend:** `GET /api/v1/recon/jobs`  
**Database:** `recon_jobs`, `recon_results`  
**Feature Flags:** None

**Flow:**
1. User navigates to `/dashboard/jobs`
2. List of jobs fetched (currently mock data)
3. Jobs filtered by status (all, completed, running, pending, failed)
4. Search functionality (by name, source, target)
5. Click job → navigate to detail page

**Gaps:**
- ❌ Jobs list uses mock data (not connected to real API)
- ❌ No real-time status updates
- ❌ No job execution history
- ❌ No failure notifications
- ⚠️ No bulk operations (pause, resume, delete)

**Code References:**
- UI: `packages/web/src/app/dashboard/jobs/page.tsx`
- API: `packages/web/src/app/api/v1/recon/jobs/route.ts` → `GET /`

---

#### Step 3: Exception Review
**Entry Point:** `/dashboard/jobs/[jobId]` → Unmatched section  
**Backend:** `GET /api/reconciliation/[runId]/unmatched` (implied)  
**Database:** `reconciliation_matches` where `matchType: 'unmatched'`  
**Feature Flags:** None

**Flow:**
1. User views job detail page
2. Clicks "View Unmatched Transactions"
3. List of unmatched transactions displayed
4. User reviews each transaction
5. User can manually match transactions
6. User can mark as "expected unmatched"
7. Changes saved to `ReconciliationMatch` table

**Gaps:**
- ❌ Unmatched transaction review UI not implemented
- ❌ Manual matching UI not implemented
- ❌ No bulk actions for unmatched transactions
- ❌ No export of unmatched transactions

**Code References:**
- Database: `prisma/schema.prisma` → `ReconciliationMatch` → `matchType`, `reviewed`, `reviewedBy`, `reviewedAt`

---

#### Step 4: Export for Accounting System
**Entry Point:** `/dashboard/jobs/[jobId]` → Export button  
**Backend:** `POST /api/exports` (implied)  
**Database:** `exports`  
**Feature Flags:** None

**Flow:**
1. User clicks "Export Report"
2. Selects format (CSV, JSON, Excel)
3. Selects scope (matched, unmatched, all, reconciliation_report)
4. Export job created: `Export` record
5. Export processed asynchronously
6. File stored (location in `storageLocation`)
7. Signed URL generated (`signedUrl`, `signedUrlExpiresAt`)
8. User downloads file

**Gaps:**
- ❌ Export functionality not implemented
- ❌ No export format validation
- ❌ No export queue management
- ⚠️ No accounting system-specific formats (QuickBooks, Xero)

**Code References:**
- Database: `prisma/schema.prisma` → `Export` model
- API: Export routes (not found in codebase)

---

## Failure and Exception Handling

### Adapter Connection Failures

#### Symptom: "Failed to connect to adapter"
**Entry Point:** Job execution  
**Backend:** Adapter service  
**Database:** `recon_results` → `errorMessage`, `errorStack`  
**Feature Flags:** None

**Flow:**
1. Job execution starts
2. Adapter connection attempted
3. Connection fails (invalid credentials, network error, rate limit)
4. Error stored in `ReconResult.errorMessage`
5. Job status: `status: 'failed'`
6. User views error in job detail page

**Gaps:**
- ❌ No automatic retry logic
- ❌ No connection health check before job creation
- ❌ No user notification of failure
- ⚠️ Error messages may be technical/unclear

**Code References:**
- Database: `prisma/schema.prisma` → `ReconResult` → `errorMessage`, `errorStack`, `status`

---

### Matching Failures

#### Symptom: Low match rate / Many unmatched transactions
**Entry Point:** Job results  
**Backend:** Matching algorithm  
**Database:** `reconciliation_matches`  
**Feature Flags:** None

**Flow:**
1. Job completes successfully
2. Match rate is low (< 80%)
3. Many unmatched transactions
4. User reviews unmatched transactions
5. User adjusts matching rules
6. User re-runs job

**Gaps:**
- ❌ No automated suggestions for rule improvements
- ❌ No match rate alerts/thresholds
- ❌ No rule optimization recommendations
- ⚠️ Re-running job requires manual steps

**Code References:**
- Database: `prisma/schema.prisma` → `ReconciliationMatch` → `matchType`, `confidence`

---

### Receipt Processing Failures

#### Symptom: Receipt OCR fails
**Entry Point:** `/console/receipts` → Upload  
**Backend:** `POST /api/v1/receipts`  
**Database:** `receipt_uploads` → `status: 'failed'`, `errorMessage`  
**Feature Flags:** None

**Flow:**
1. User uploads receipt
2. `ReceiptUpload` record created: `status: 'pending'`
3. OCR processing starts: `status: 'processing'`
4. OCR fails (poor image quality, unsupported format)
5. Status updated: `status: 'failed'`
6. Error message stored: `errorMessage`
7. User sees error in receipt list

**Gaps:**
- ❌ No OCR retry with different providers
- ❌ No manual entry UI for failed receipts
- ❌ No receipt quality validation before upload
- ⚠️ No receipt matching to transactions

**Code References:**
- Database: `prisma/schema.prisma` → `ReceiptUpload`, `Receipt`
- API: `packages/web/src/app/api/v1/receipts/route.ts` (implied)

---

## Code Traceability Matrix

### Onboarding Workflow

| Step | UI Route | Backend Function | Database Table | Feature Flag | Status |
|------|----------|------------------|----------------|--------------|--------|
| Sign Up | `/signup` | `signUpUser()` | `auth.users`, `onboarding_progress` | None | ✅ |
| Welcome | `/console` | `getOnboardingProgress()` | `onboarding_progress` | None | ✅ |
| Create API Key | `/console/api-keys` | `POST /api/console/api-keys` | `api_keys` (implied) | None | ⚠️ |
| Try Playground | `/console/playground` | Demo mode | None | None | ✅ |
| First Reconciliation | `/console/playground/reconcile` | `POST /api/v1/recon/jobs` | `recon_jobs` | None | ⚠️ |
| Invite Team | `/console` → Team | `POST /api/workspaces/[id]/invites` | `workspace_invites` | None | ⚠️ |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented (gaps exist)
- ❌ Not implemented

---

### Reconciliation Workflow

| Step | UI Route | Backend Function | Database Table | Feature Flag | Status |
|------|----------|------------------|----------------|--------------|--------|
| Create Job | `/console/playground/reconcile` | `POST /api/v1/recon/jobs` | `recon_jobs` | None | ✅ |
| Adapter Connection | N/A (backend) | Adapter service | `ingestion_sources` | None | ⚠️ |
| Data Fetching | N/A (backend) | Ingestion service | `ingestions`, `raw_records`, `normalized_transactions` | None | ✅ |
| Matching | N/A (backend) | Matching algorithm | `reconciliation_runs`, `reconciliation_matches` | None | ✅ |
| View Results | `/dashboard/jobs/[jobId]` | `GET /api/jobs/[id]` (implied) | `recon_results` | None | ❌ |
| Exception Review | `/dashboard/jobs/[jobId]` → Unmatched | `GET /api/reconciliation/[runId]/unmatched` (implied) | `reconciliation_matches` | None | ❌ |
| Export | `/dashboard/jobs/[jobId]` → Export | `POST /api/exports` (implied) | `exports` | None | ❌ |

---

## Gap Analysis

### Critical Gaps (Blocking Workflows)

1. **Job Results Viewing**
   - **Issue:** Job detail page uses mock data, not connected to real API
   - **Impact:** Users cannot see actual reconciliation results
   - **Code:** `packages/web/src/app/dashboard/jobs/[jobId]/page.tsx` uses mock data
   - **Fix Required:** Implement `GET /api/jobs/[jobId]` endpoint

2. **Exception Review UI**
   - **Issue:** No UI for reviewing unmatched transactions
   - **Impact:** Users cannot resolve exceptions
   - **Code:** Missing component/page
   - **Fix Required:** Create `/dashboard/jobs/[jobId]/exceptions` page

3. **Export Functionality**
   - **Issue:** Export button exists but functionality not implemented
   - **Impact:** Users cannot export results for accounting systems
   - **Code:** `Export` model exists but no API routes
   - **Fix Required:** Implement `POST /api/exports` endpoint

4. **Scheduled Job Execution**
   - **Issue:** Cron scheduler not implemented
   - **Impact:** Scheduled jobs never run
   - **Code:** `scheduleCron` field exists but no scheduler
   - **Fix Required:** Implement cron scheduler service

5. **Failure Notifications**
   - **Issue:** No notifications when jobs fail
   - **Impact:** Users discover failures days later
   - **Code:** Email service exists but not used for failures
   - **Fix Required:** Add failure notification triggers

---

### UX Dead Ends

1. **Onboarding Wizard Can Be Skipped**
   - Users can skip all onboarding steps
   - No enforcement of required steps
   - **Fix:** Make critical steps non-skippable

2. **No Progress Tracking**
   - Job execution is async but no progress UI
   - Users don't know if job is stuck or processing
   - **Fix:** Add progress tracking and real-time updates

3. **Mock Data Confusion**
   - Jobs list and detail pages use mock data
   - Users may think system is working when it's not
   - **Fix:** Connect to real APIs or show "coming soon" message

4. **No Error Recovery Guidance**
   - Error messages are technical
   - No suggested actions for common errors
   - **Fix:** Add error recovery suggestions

---

### Missing Automations

1. **Automatic Receipt Matching**
   - Receipts exist but don't auto-match to transactions
   - **Impact:** Manual work required
   - **Revenue Opportunity:** Premium feature (+$50-150/mo)

2. **Automatic Rule Optimization**
   - No suggestions for improving match rates
   - **Impact:** Users struggle with low match rates
   - **Revenue Opportunity:** Premium feature (+$50-100/mo)

3. **Automatic Retry Logic**
   - No retry for failed adapter connections
   - **Impact:** Manual intervention required
   - **Revenue Opportunity:** Premium feature (+$25-75/mo)

4. **Automatic Failure Notifications**
   - No email/SMS notifications for failures
   - **Impact:** Users discover failures late
   - **Revenue Opportunity:** Premium feature (+$25-50/mo)

---

### Manual → Paid Automation Opportunities

1. **Manual Exception Review → Automated Review**
   - Current: Users manually review unmatched transactions
   - Opportunity: AI-powered exception review with confidence scores
   - **Revenue:** +$100-300/mo (Premium)

2. **Manual Export → Automated Scheduled Exports**
   - Current: Users manually export results
   - Opportunity: Scheduled exports to accounting systems
   - **Revenue:** +$50-150/mo (Premium)

3. **Manual Job Creation → Template-Based Automation**
   - Current: Users manually configure each job
   - Opportunity: Job templates with one-click setup
   - **Revenue:** +$25-75/mo (Premium)

4. **Manual Rule Configuration → AI-Optimized Rules**
   - Current: Users manually configure matching rules
   - Opportunity: AI suggests optimal rules based on data patterns
   - **Revenue:** +$100-200/mo (Premium)

---

## Revenue Impact vs Effort Matrix

### High Impact, Low Effort (Quick Wins)

1. **Failure Notifications** (1-2 weeks)
   - **Revenue Impact:** Medium (+$25-50/mo per user)
   - **Implementation Effort:** Low
   - **Code:** Email service exists, add triggers
   - **Priority:** P0

2. **Job Results API** (1 week)
   - **Revenue Impact:** High (blocks all users)
   - **Implementation Effort:** Low
   - **Code:** Connect existing UI to database
   - **Priority:** P0

3. **Progress Tracking** (2-3 weeks)
   - **Revenue Impact:** Medium (UX improvement)
   - **Implementation Effort:** Medium
   - **Code:** Add progress events to job execution
   - **Priority:** P1

---

### High Impact, High Effort (Strategic)

1. **Exception Review UI** (3-4 weeks)
   - **Revenue Impact:** High (core workflow)
   - **Implementation Effort:** High
   - **Code:** New UI components + API endpoints
   - **Priority:** P0

2. **Scheduled Job Execution** (2-3 weeks)
   - **Revenue Impact:** High (recurring revenue enabler)
   - **Implementation Effort:** Medium-High
   - **Code:** Cron scheduler service
   - **Priority:** P0

3. **Export Functionality** (2-3 weeks)
   - **Revenue Impact:** Medium (compliance requirement)
   - **Implementation Effort:** Medium
   - **Code:** Export service + storage integration
   - **Priority:** P1

---

### Medium Impact, Low Effort (Nice to Have)

1. **Receipt Auto-Matching** (2-3 weeks)
   - **Revenue Impact:** Medium (+$50-150/mo)
   - **Implementation Effort:** Medium
   - **Code:** Matching algorithm + UI
   - **Priority:** P2

2. **Rule Optimization Suggestions** (2 weeks)
   - **Revenue Impact:** Low-Medium (+$50-100/mo)
   - **Implementation Effort:** Medium
   - **Code:** Analytics + suggestion engine
   - **Priority:** P2

---

### Low Impact, High Effort (Defer)

1. **Multi-Source Reconciliation** (4-6 weeks)
   - **Revenue Impact:** High (+$200-500/mo) but low user count
   - **Implementation Effort:** Very High
   - **Code:** Major architecture change
   - **Priority:** P3 (defer until enterprise demand)

2. **Approval Workflows** (3-4 weeks)
   - **Revenue Impact:** Medium (+$100-300/mo) but low user count
   - **Implementation Effort:** High
   - **Code:** New workflow engine
   - **Priority:** P3 (defer until compliance demand)

---

## Summary

### Workflow Completeness

- **Day 0 Onboarding:** ✅ 80% complete (gaps: email verification, billing account creation)
- **First Reconciliation:** ⚠️ 60% complete (gaps: results viewing, exception review)
- **Ongoing Operations:** ⚠️ 40% complete (gaps: scheduled execution, monitoring, exports)
- **Failure Handling:** ⚠️ 30% complete (gaps: notifications, retry logic, recovery guidance)

### Critical Path to Revenue

1. **P0 (Blocking):** Job Results API, Exception Review UI, Scheduled Execution
2. **P1 (High Value):** Export Functionality, Progress Tracking, Failure Notifications
3. **P2 (Revenue Growth):** Receipt Auto-Matching, Rule Optimization
4. **P3 (Future):** Multi-Source, Approval Workflows

### Estimated Timeline

- **P0 Features:** 6-8 weeks
- **P1 Features:** 4-6 weeks
- **P2 Features:** 4-6 weeks
- **Total:** 14-20 weeks to complete all critical workflows

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-01-27  
**Next Review:** After P0 features complete
