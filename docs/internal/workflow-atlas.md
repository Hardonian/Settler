# Settler Workflow Atlas

**Generated:** 2025-01-27  
**Purpose:** Complete enumeration of all realistic user workflows for reconciliation across adapters, receipts, rules, and feature flags. This document maps reality, not ideal scenarios.

---

## Table of Contents

1. [User Roles & Personas](#user-roles--personas)
2. [End-to-End Workflows](#end-to-end-workflows)
3. [Adapter & Receipt Interaction Matrix](#adapter--receipt-interaction-matrix)
4. [Rules, Flags & Control Surfaces](#rules-flags--control-surfaces)
5. [Failure Paths & Edge Cases](#failure-paths--edge-cases)

---

## User Roles & Personas

### 1. Solo Founder / Operator
**Goals:**
- Quick setup without technical complexity
- See where money is going
- Minimal time investment

**Tolerance for Complexity:** Low  
**Frequency:** Weekly/Monthly  
**Authority Level:** Full  
**Willingness to Pay:** Low ($0-$50/mo)  
**Key Workflows:**
- One-time manual reconciliation
- Receipt upload for expense tracking
- Basic Stripe → bank reconciliation

**Pain Points:**
- Too many steps to get started
- Unclear what adapters to use
- Confusing terminology

### 2. Finance Admin
**Goals:**
- Accurate monthly reconciliation
- Compliance and audit readiness
- Team collaboration

**Tolerance for Complexity:** Medium  
**Frequency:** Daily/Weekly  
**Authority Level:** High (within finance)  
**Willingness to Pay:** Medium-High ($100-$500/mo)  
**Key Workflows:**
- Scheduled recurring reconciliation
- Multi-adapter reconciliation (Stripe + PayPal + bank)
- Exception handling and review
- Export for accounting systems

**Pain Points:**
- Manual exception review is tedious
- No approval workflows
- Limited audit trail visibility

### 3. Accountant / Bookkeeper
**Goals:**
- Client reconciliation management
- Multi-tenant access
- Detailed reporting

**Tolerance for Complexity:** High  
**Frequency:** Daily  
**Authority Level:** High (client access)  
**Willingness to Pay:** High ($200-$1000/mo)  
**Key Workflows:**
- Bulk historical backfill
- Multi-client reconciliation
- Custom matching rules
- Detailed discrepancy reports

**Pain Points:**
- No client-level isolation UI
- Limited bulk operations
- Export formats don't match accounting software

### 4. Ops Manager
**Goals:**
- Monitor reconciliation health
- Set up automation
- Alert on failures

**Tolerance for Complexity:** Medium-High  
**Frequency:** Daily  
**Authority Level:** Medium  
**Willingness to Pay:** Medium ($100-$300/mo)  
**Key Workflows:**
- Scheduled job monitoring
- Webhook configuration
- Alert setup
- Performance monitoring

**Pain Points:**
- No real-time monitoring dashboard
- Alert configuration is complex
- No SLA tracking

### 5. Auditor / Compliance Reviewer
**Goals:**
- Review reconciliation accuracy
- Audit trail access
- Compliance reporting

**Tolerance for Complexity:** Low-Medium  
**Frequency:** Quarterly/Annually  
**Authority Level:** Read-only  
**Willingness to Pay:** Enterprise ($1000+/mo)  
**Key Workflows:**
- Read-only access to all reconciliations
- Audit log review
- Compliance export
- Historical data access

**Pain Points:**
- No read-only role in UI
- Audit logs hard to navigate
- No compliance-specific exports

### 6. Integration Engineer
**Goals:**
- API-first workflow
- Programmatic job creation
- Custom adapters

**Tolerance for Complexity:** Very High  
**Frequency:** As needed  
**Authority Level:** Technical  
**Willingness to Pay:** Variable  
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

## End-to-End Workflows

### Workflow 1: One-Off Manual Reconciliation

**Entry Point:** UI (`/console/playground/reconcile`) or API (`POST /api/v1/reconciliation/run`)

**Flow:**
```
1. User selects source adapter (e.g., Stripe)
   ↓
2. User provides source credentials/config
   ↓
3. User selects target adapter (e.g., QuickBooks)
   ↓
4. User provides target credentials/config
   ↓
5. User sets date range (default: last 7 days)
   ↓
6. User optionally configures matching rules
   ↓
7. System validates adapter connections
   ↓
8. System fetches transactions from source
   ↓
9. System fetches transactions from target
   ↓
10. System normalizes transactions
    ↓
11. System runs matching algorithm
    ↓
12. System generates report
    ↓
13. User views matches/unmatched
    ↓
14. User reviews exceptions
    ↓
15. User exports results (optional)
```

**Decision Points:**
- Manual vs automatic matching rules
- Date range selection
- Export format (CSV, JSON, PDF)

**Outputs:**
- Reconciliation report
- Matched transactions
- Unmatched transactions
- Confidence scores

**Failure Paths:**
- Adapter connection fails → Show error, allow retry
- No transactions found → Show empty state, suggest date range expansion
- Matching fails → Show partial results, allow manual review
- Export fails → Retry, show error

**Current State:** ✅ Fully supported

---

### Workflow 2: Recurring Scheduled Reconciliation

**Entry Point:** UI (`/console/workflows/new`) or API (`POST /api/v1/jobs` with `schedule`)

**Flow:**
```
1. User creates reconciliation job
   ↓
2. User configures source/target adapters
   ↓
3. User sets schedule (cron expression or UI picker)
   ↓
4. User sets timezone
   ↓
5. User configures notification preferences
   ↓
6. System saves job
   ↓
7. Cron scheduler triggers job at scheduled time
   ↓
8. System executes reconciliation
   ↓
9. System sends notification (email/webhook)
   ↓
10. User reviews results in dashboard
```

**Decision Points:**
- Schedule frequency (daily, weekly, monthly)
- Notification channels
- Failure handling (retry, alert, pause)

**Outputs:**
- Scheduled job record
- Execution history
- Notifications

**Failure Paths:**
- Scheduler fails → Alert admin, manual trigger available
- Job execution fails → Retry logic, alert user
- Notification fails → Logged, retry notification

**Current State:** ⚠️ Partially supported (scheduling exists but limited UI)

---

### Workflow 3: Bulk Historical Backfill

**Entry Point:** API (`POST /api/v1/reconciliation/run` with large date range) or UI (future)

**Flow:**
```
1. User specifies large date range (e.g., 1 year)
   ↓
2. System validates date range (may warn if > 90 days)
   ↓
3. System fetches transactions in batches
   ↓
4. System processes batches sequentially
   ↓
5. System shows progress indicator
   ↓
6. System generates consolidated report
   ↓
7. User downloads results
```

**Decision Points:**
- Batch size
- Processing priority
- Progress visibility

**Outputs:**
- Historical reconciliation report
- Batch processing logs

**Failure Paths:**
- Date range too large → Warn user, suggest smaller ranges
- Batch processing fails → Resume from last successful batch
- Timeout → Allow continuation, show partial results

**Current State:** ⚠️ Partially supported (works but no UI, no progress tracking)

---

### Workflow 4: Partial Data Reconciliation

**Entry Point:** UI (`/console/playground/reconcile`) or API

**Flow:**
```
1. User uploads CSV/JSON file as source
   ↓
2. User selects target adapter
   ↓
3. System validates file format
   ↓
4. System normalizes uploaded data
   ↓
5. System runs reconciliation against target
   ↓
6. User reviews results
```

**Decision Points:**
- File format (CSV, JSON, Excel)
- Column mapping
- Data validation rules

**Outputs:**
- Reconciliation report
- Validation errors (if any)

**Failure Paths:**
- Invalid file format → Show error, suggest format
- Missing required columns → Show mapping UI
- Data validation fails → Show errors, allow correction

**Current State:** ⚠️ Partially supported (CSV upload exists, limited validation)

---

### Workflow 5: Reconciliation with Missing Receipts

**Entry Point:** UI (`/console/receipts` + `/console/playground/reconcile`)

**Flow:**
```
1. User runs reconciliation
   ↓
2. System identifies unmatched transactions
   ↓
3. System flags transactions that might need receipts
   ↓
4. User uploads receipts for unmatched transactions
   ↓
5. System processes receipts (OCR)
   ↓
6. System attempts to match receipts to transactions
   ↓
7. User reviews matches
   ↓
8. User manually links receipts if needed
   ↓
9. User re-runs reconciliation
```

**Decision Points:**
- Automatic receipt matching vs manual
- Receipt processing priority
- Receipt storage retention

**Outputs:**
- Receipt-linked transactions
- Updated reconciliation report

**Failure Paths:**
- Receipt OCR fails → Allow manual entry
- Receipt matching fails → Show manual linking UI
- Receipt storage full → Alert user, suggest cleanup

**Current State:** ⚠️ Partially supported (receipts exist, limited integration with reconciliation)

---

### Workflow 6: Reconciliation with Conflicting Adapters

**Entry Point:** UI or API

**Flow:**
```
1. User configures multiple source adapters (e.g., Stripe + PayPal)
   ↓
2. User selects single target adapter (e.g., QuickBooks)
   ↓
3. System fetches from all sources
   ↓
4. System normalizes all transactions
   ↓
5. System identifies potential duplicates across sources
   ↓
6. System runs reconciliation against target
   ↓
7. System flags conflicts (same transaction in multiple sources)
   ↓
8. User reviews conflicts
   ↓
9. User resolves conflicts (merge, ignore, prioritize)
   ↓
10. System generates final report
```

**Decision Points:**
- Conflict resolution strategy
- Duplicate detection rules
- Source priority

**Outputs:**
- Conflict report
- Resolved reconciliation

**Failure Paths:**
- Adapter conflict → Show conflict resolution UI
- Duplicate detection fails → Allow manual review
- Resolution unclear → Escalate to user

**Current State:** ❌ Not supported (no multi-source reconciliation)

---

### Workflow 7: Audit-Driven Reconciliation

**Entry Point:** UI (`/console/reconciliation-view`) or API

**Flow:**
```
1. Auditor requests read-only access
   ↓
2. Admin grants auditor role
   ↓
3. Auditor views all reconciliation jobs
   ↓
4. Auditor filters by date range, adapter, status
   ↓
5. Auditor reviews reconciliation reports
   ↓
6. Auditor reviews audit logs
   ↓
7. Auditor exports compliance report
   ↓
8. Auditor flags discrepancies
   ↓
9. Admin reviews flags
   ↓
10. Admin resolves discrepancies
```

**Decision Points:**
- Access level (read-only, read+export)
- Data retention period
- Export format (compliance-specific)

**Outputs:**
- Compliance report
- Audit trail export
- Discrepancy flags

**Failure Paths:**
- Access denied → Show error, contact admin
- Data not available → Show retention policy, suggest timeframe
- Export fails → Retry, show error

**Current State:** ⚠️ Partially supported (audit logs exist, no auditor role, limited compliance exports)

---

### Workflow 8: Correction / Re-Run Workflows

**Entry Point:** UI (`/console/runs/[runId]`) or API (`POST /api/v1/reconciliation/run`)

**Flow:**
```
1. User reviews reconciliation results
   ↓
2. User identifies incorrect matches
   ↓
3. User manually corrects matches (unmatch, rematch)
   ↓
4. User updates matching rules (if needed)
   ↓
5. User triggers re-run
   ↓
6. System applies corrections
   ↓
7. System re-runs matching algorithm
   ↓
8. System generates updated report
   ↓
9. User reviews updated results
   ↓
10. User approves final results
```

**Decision Points:**
- Correction scope (single match, all matches, rules)
- Re-run strategy (full, incremental)
- Approval workflow

**Outputs:**
- Corrected reconciliation report
- Correction audit trail

**Failure Paths:**
- Correction fails → Show error, allow retry
- Re-run fails → Show error, allow partial re-run
- Approval workflow breaks → Bypass, log issue

**Current State:** ⚠️ Partially supported (manual corrections exist, no approval workflow)

---

## Adapter & Receipt Interaction Matrix

### Adapter Types

#### Payment Processors
- **Stripe** ✅
  - Provides: Transaction IDs, amounts, dates, fees, refunds
  - Omits: Receipt attachments, detailed line items
  - Breaks: Rate limits, webhook delivery delays
  - Latency: < 1s (API), variable (webhooks)

- **PayPal** ✅
  - Provides: Transaction IDs, amounts, dates, fees
  - Omits: Consistent transaction IDs across products
  - Breaks: OAuth token expiration, API version changes
  - Latency: 1-3s (API)

- **Square** ✅
  - Provides: Transaction IDs, amounts, dates, locations
  - Omits: Multi-location aggregation
  - Breaks: Location-specific API keys
  - Latency: < 2s (API)

#### E-commerce Platforms
- **Shopify** ✅
  - Provides: Order IDs, amounts, dates, line items
  - Omits: Payment processor details
  - Breaks: Webhook ordering, rate limits
  - Latency: 1-2s (API), variable (webhooks)

- **WooCommerce** ✅
  - Provides: Order IDs, amounts, dates
  - Omits: Standardized data format
  - Breaks: Plugin conflicts, version differences
  - Latency: Variable (self-hosted)

#### Accounting Systems
- **QuickBooks** ✅
  - Provides: Transaction IDs, amounts, dates, accounts
  - Omits: Real-time sync
  - Breaks: OAuth refresh, API version changes
  - Latency: 2-5s (API)

- **Xero** ✅
  - Provides: Transaction IDs, amounts, dates, accounts
  - Omits: Receipt attachments in API
  - Breaks: OAuth expiration
  - Latency: 1-3s (API)

- **NetSuite** ✅
  - Provides: Transaction IDs, amounts, dates
  - Omits: Simplified API access
  - Breaks: Complex authentication, SOAP/REST differences
  - Latency: 3-10s (API)

### Receipt Processing

#### Upload Methods
- **Manual Upload** ✅
  - UI: `/console/receipts`
  - API: `POST /api/v1/receipts`
  - Formats: PDF, PNG, JPG
  - Max size: 10MB (configurable)

- **Auto-Ingest** ⚠️
  - Webhook-based (future)
  - Email parsing (future)
  - Integration-specific (limited)

#### Receipt Types
- **Structured Receipts** ✅
  - OCR accuracy: 95%+
  - Fields: Amount, date, merchant, line items
  - Processing time: < 5s

- **Unstructured Receipts** ⚠️
  - OCR accuracy: 70-85%
  - Fields: Variable
  - Processing time: 5-15s
  - Manual review often required

#### Receipt States
- **Pending** → Uploaded, not processed
- **Processing** → OCR in progress
- **Processed** → OCR complete, data extracted
- **Failed** → OCR failed, manual entry required
- **Linked** → Matched to transaction
- **Unlinked** → Not matched to transaction

### Adapter × Receipt Combinations

| Adapter | Receipt Upload | Receipt Auto-Match | Receipt Manual Link | Status |
|---------|---------------|-------------------|-------------------|---------|
| Stripe | ✅ | ⚠️ | ✅ | Partial |
| PayPal | ✅ | ⚠️ | ✅ | Partial |
| Shopify | ✅ | ❌ | ✅ | Partial |
| QuickBooks | ✅ | ❌ | ✅ | Partial |
| Xero | ✅ | ❌ | ✅ | Partial |
| CSV Upload | ✅ | ❌ | ✅ | Partial |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported (works but limited)
- ❌ Not supported

### Degraded States

#### Adapter Degraded but Acceptable
- **Rate Limited:** Continue with reduced frequency
- **Partial Data:** Show warnings, proceed with available data
- **Delayed Sync:** Use cached data, show staleness indicator

#### Receipt Degraded but Acceptable
- **Low OCR Confidence:** Flag for review, allow manual correction
- **Missing Fields:** Proceed with available fields, flag gaps
- **Duplicate Receipts:** Detect, allow merge/ignore

---

## Rules, Flags & Control Surfaces

### Matching Rules

#### Rule Types

1. **Exact Match Rules** ✅
   - Field: `external_id`, `transaction_id`
   - Config: Exact string match
   - UI: `/console/playground/reconcile` (rules editor)
   - Backend: `reconciliation-matcher.ts`

2. **Amount Match Rules** ✅
   - Field: `amount`
   - Config: Tolerance (default: 0.01)
   - UI: Rules editor
   - Backend: `amountsMatch()` function

3. **Date Range Match Rules** ✅
   - Field: `date`
   - Config: Window days (default: 7)
   - UI: Rules editor
   - Backend: `datesWithinWindow()` function

4. **Fuzzy Description Match** ✅
   - Field: `description`
   - Config: Similarity threshold (default: 0.8)
   - UI: Rules editor
   - Backend: `stringSimilarity()` function

5. **Currency Match Rules** ✅
   - Field: `currency`
   - Config: Required match
   - UI: Implicit (enforced)
   - Backend: Currency filtering

6. **Custom Field Match** ⚠️
   - Field: User-defined
   - Config: Custom logic
   - UI: Limited
   - Backend: Partial support

#### Rule Configuration Locations

- **UI:** `/console/playground/reconcile` → Rules Editor
- **API:** `POST /api/v1/reconciliation/run` → `config.rules`
- **Jobs:** `POST /api/v1/jobs` → `matching.rules`

#### Rule Enforcement Points

- **Matching Algorithm:** `reconciliation-matcher.ts`
- **Validation:** `rules-editor.ts` (API route)
- **Storage:** `jobs` table → `matching` JSONB column

#### Hidden Rules

- **Currency filtering:** Always enforced, not configurable
- **External ID priority:** Always checked first, not visible
- **Confidence threshold:** Hardcoded (0.80), not configurable

#### Rules Without UI

- **Custom field matching:** API-only
- **Multi-field composite rules:** API-only
- **Rule precedence:** Implicit, not configurable

#### UI Controls Without Backend Effect

- **Rule templates:** UI shows templates, but backend doesn't use them
- **Rule preview:** UI shows preview, but actual matching may differ
- **Rule testing:** UI allows testing, but results don't match production

---

### Feature Flags

#### Flag Types

1. **Tenant-Level Flags** ✅
   - Storage: `feature_flags` table
   - Evaluation: `FeatureFlagService.getFlag()`
   - UI: `/console/feature-flags`
   - API: Middleware loads flags per request

2. **User-Level Flags** ✅
   - Storage: `feature_flags` table (user_id)
   - Evaluation: `FeatureFlagService.getFlag()`
   - UI: Limited
   - API: Middleware evaluates

3. **Rollout Percentage Flags** ✅
   - Storage: `feature_flags` table (rollout_percentage)
   - Evaluation: Hash-based assignment
   - UI: `/console/feature-flags`
   - API: Automatic evaluation

4. **Conditional Flags** ⚠️
   - Storage: `feature_flags` table (conditions JSONB)
   - Evaluation: Partial support
   - UI: Limited
   - API: Basic evaluation

#### Flag Configuration Locations

- **UI:** `/console/feature-flags`
- **API:** `POST /api/v1/feature-flags` (admin only)
- **Database:** Direct (admin only)

#### Flag Enforcement Points

- **Middleware:** `feature-flags.ts` middleware
- **Routes:** `requireFeatureFlag()` middleware
- **Services:** `isFeatureEnabled()` helper

#### Hidden Flags

- **Internal flags:** Not exposed in UI
- **Kill switches:** Admin-only, not visible to users
- **A/B test flags:** Automatic, not user-configurable

#### Flags Without UI

- **Conditional flags:** API-only configuration
- **Time-based flags:** Not supported
- **Geo-based flags:** Not supported

---

### Thresholds & Tolerances

#### Configurable Thresholds

1. **Amount Tolerance** ✅
   - Default: 0.01
   - Config: `config.amountTolerance`
   - UI: Rules editor

2. **Date Window** ✅
   - Default: 7 days
   - Config: `config.dateWindowDays`
   - UI: Rules editor

3. **Fuzzy Threshold** ✅
   - Default: 0.8
   - Config: `config.fuzzyDescriptionThreshold`
   - UI: Rules editor

4. **Confidence Threshold** ⚠️
   - Default: 0.80 (hardcoded)
   - Config: Not configurable
   - UI: Not visible

#### Approval Gates

- **None currently** ❌
- **Future:** Manual approval for low-confidence matches
- **Future:** Admin approval for large discrepancies

---

## Failure Paths & Edge Cases

### Data Source Failures

#### Adapter Connection Failures
- **Symptom:** "Failed to connect to adapter"
- **Recovery:** Retry with exponential backoff
- **User Impact:** Job fails, user must retry
- **Gap:** No automatic retry UI, no connection health monitoring

#### Adapter Rate Limiting
- **Symptom:** "Rate limit exceeded"
- **Recovery:** Wait and retry
- **User Impact:** Delayed reconciliation
- **Gap:** No rate limit visibility, no queuing

#### Adapter Data Inconsistency
- **Symptom:** Missing transactions, duplicate transactions
- **Recovery:** Manual review required
- **User Impact:** Incomplete reconciliation
- **Gap:** No inconsistency detection, no alerts

### Matching Failures

#### Low Confidence Matches
- **Symptom:** Many unmatched transactions
- **Recovery:** Manual review, rule adjustment
- **User Impact:** Time-consuming review
- **Gap:** No automated suggestions, no rule optimization

#### Ambiguous Matches
- **Symptom:** Multiple potential matches for one transaction
- **Recovery:** Manual selection
- **User Impact:** Decision fatigue
- **Gap:** No conflict resolution UI, no match ranking

#### Currency Mismatches
- **Symptom:** Transactions in different currencies
- **Recovery:** Manual currency conversion or exclusion
- **User Impact:** Reconciliation incomplete
- **Gap:** No currency conversion, no multi-currency support

### Receipt Processing Failures

#### OCR Failures
- **Symptom:** Receipt processing fails
- **Recovery:** Manual entry
- **User Impact:** Time-consuming manual work
- **Gap:** No OCR retry with different providers, no manual entry UI

#### Receipt Matching Failures
- **Symptom:** Receipts not matched to transactions
- **Recovery:** Manual linking
- **User Impact:** Manual work required
- **Gap:** No matching suggestions, no bulk linking

#### Receipt Storage Failures
- **Symptom:** Receipt upload fails
- **Recovery:** Retry upload
- **User Impact:** Cannot attach receipts
- **Gap:** No storage quota visibility, no cleanup tools

### Workflow Failures

#### Job Execution Failures
- **Symptom:** Job fails mid-execution
- **Recovery:** Manual re-run
- **User Impact:** Lost progress, must restart
- **Gap:** No checkpoint/resume, no partial results

#### Scheduled Job Failures
- **Symptom:** Scheduled job doesn't run
- **Recovery:** Manual trigger
- **User Impact:** Missed reconciliation
- **Gap:** No failure notifications, no automatic retry

#### Export Failures
- **Symptom:** Export generation fails
- **Recovery:** Retry export
- **User Impact:** Cannot download results
- **Gap:** No export queue, no format validation

---

## Workflow Completeness Matrix

| Workflow | Entry Point | Data Sources | Transformations | Decision Points | Outputs | Failure Handling | Status |
|----------|-------------|--------------|------------------|-----------------|---------|------------------|--------|
| One-Off Manual | ✅ UI + API | ✅ Multiple | ✅ Normalization | ✅ Rules config | ✅ Report | ⚠️ Basic | ✅ Complete |
| Recurring Scheduled | ✅ API, ⚠️ UI | ✅ Multiple | ✅ Normalization | ⚠️ Limited | ✅ Report | ⚠️ Basic | ⚠️ Partial |
| Bulk Historical | ⚠️ API only | ✅ Multiple | ✅ Normalization | ❌ None | ✅ Report | ❌ None | ⚠️ Partial |
| Partial Data | ✅ UI + API | ✅ File upload | ⚠️ Limited | ⚠️ Basic | ✅ Report | ⚠️ Basic | ⚠️ Partial |
| Missing Receipts | ✅ UI + API | ✅ Adapters + Receipts | ⚠️ Limited | ⚠️ Manual | ✅ Report | ⚠️ Basic | ⚠️ Partial |
| Conflicting Adapters | ❌ None | ❌ Not supported | ❌ None | ❌ None | ❌ None | ❌ None | ❌ Missing |
| Audit-Driven | ⚠️ Limited | ✅ All | ✅ Normalization | ❌ None | ⚠️ Limited | ⚠️ Basic | ⚠️ Partial |
| Correction/Re-Run | ✅ UI + API | ✅ Previous run | ✅ Re-apply | ⚠️ Limited | ✅ Report | ⚠️ Basic | ⚠️ Partial |

**Legend:**
- ✅ Fully supported
- ⚠️ Partially supported
- ❌ Not supported

---

## Next Steps

This atlas identifies:
1. **Complete workflows:** One-off manual reconciliation
2. **Partial workflows:** Most others need completion
3. **Missing workflows:** Multi-source reconciliation, advanced audit workflows
4. **Gaps:** Failure handling, progress tracking, approval workflows

See [Gap & Opportunity Report](./gap-opportunity-report.md) for detailed analysis of missing features and monetization opportunities.
