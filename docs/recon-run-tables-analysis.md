# Run Tables Analysis and Consolidation Proposal

## Executive Summary

After analyzing the codebase, I found **three distinct tables** that store reconciliation run data:

1. **`executions`** - Legacy table (SQL-based, managed in `packages/api/src/db/index.ts`)
2. **`recon_results`** - New Recon Core Engine (Prisma-managed)
3. **`reconciliation_runs`** - Public API-facing records (Prisma-managed)

**Recommendation: Consolidation is NOT recommended at this time.** The three tables serve distinct purposes with legitimate architectural reasons for separation. However, there are improvements that could be made to reduce confusion and improve data consistency.

---

## 1. Schema Analysis

### 1.1 `executions` Table (Legacy)

**Location:** `packages/api/src/db/index.ts` (lines 338-347)

**Purpose:** General execution tracking for the legacy jobs system

**Schema:**

```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT,
  summary JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

**Key Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `job_id` | UUID | FK to legacy `jobs` table |
| `status` | VARCHAR | Execution status |
| `started_at` | TIMESTAMP | When execution started |
| `completed_at` | TIMESTAMP | When execution finished |
| `error` | TEXT | Error message if failed |
| `summary` | JSONB | Execution summary data |
| `created_at` | TIMESTAMP | Record creation time |

**Relationships:**

- → `jobs` (legacy jobs table)
- ← `matches`, `unmatched`, `reports` (child tables)

**Used By:**

- `packages/api/src/routes/jobs.ts` - Job execution management
- `packages/api/src/routes/reports.ts` - Report generation
- `packages/api/src/services/analytics/*` - Analytics services
- `packages/api/src/services/ai-insights/*` - AI insights
- `packages/api/src/middleware/pricing.ts` - Billing calculations

**⚠️ Issue:** Does NOT have `tenantId` column - relies on JOIN with `jobs` table for tenant scoping.

---

### 1.2 `recon_results` Table (Recon Core Engine)

**Location:** `prisma/schema.prisma` (lines 262-301)

**Purpose:** Store reconciliation results with provenance for the new Recon Core Engine

**Schema:**

```prisma
model ReconResult {
  id                    String    @id @default(uuid())
  reconJobId            String    @db.Uuid
  tenantId              String    @db.Uuid
  executionId           String?   @db.Uuid       -- Optional link to legacy executions
  status                String    @default("running")
  startedAt             DateTime  @default(now())
  completedAt           DateTime?

  -- Count metrics
  sourceCount           Int       @default(0)
  targetCount           Int       @default(0)
  matchedCount          Int       @default(0)
  unmatchedSourceCount  Int       @default(0)
  unmatchedTargetCount  Int       @default(0)
  conflictCount         Int       @default(0)

  -- Financial metrics
  totalAmountSource     Decimal?  @db.Decimal(15, 2)
  totalAmountTarget     Decimal?  @db.Decimal(15, 2)
  totalAmountMatched    Decimal?  @db.Decimal(15, 2)
  totalAmountUnmatched  Decimal?  @db.Decimal(15, 2)
  currency              String?

  -- Confidence metrics
  confidenceAvg         Decimal?  @db.Decimal(5, 4)
  confidenceMin         Decimal?  @db.Decimal(5, 4)
  confidenceMax         Decimal?  @db.Decimal(5, 4)

  durationMs            BigInt?
  errorMessage          String?   @db.Text
  errorStack            String?   @db.Text

  -- Extended data
  summary               Json      @default("{}")
  metadata              Json      @default("{}")
  proofCapsule          Json?     @default("{}")

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  reconJob              ReconJob  @relation(...)
  audits                ReconAudit[]
}
```

**Key Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `reconJobId` | UUID | FK to ReconJob (new) |
| `tenantId` | UUID | Tenant isolation |
| `executionId` | UUID? | Optional link to legacy executions |
| `status` | String | running/completed/failed |
| `sourceCount` | Int | Records from source |
| `targetCount` | Int | Records from target |
| `matchedCount` | Int | Successfully matched |
| `unmatchedSourceCount` | Int | Unmatched source records |
| `unmatchedTargetCount` | Int | Unmatched target records |
| `conflictCount` | Int | Conflicts detected |
| `totalAmountSource` | Decimal | Sum of source amounts |
| `totalAmountTarget` | Decimal | Sum of target amounts |
| `confidenceAvg/Min/Max` | Decimal | Confidence metrics |
| `summary` | JSON | Contains provenance data |
| `proofCapsule` | JSON? | Cryptographic proofs |

**Relationships:**

- → `ReconJob` (Prisma model)
- → `executions` (optional via executionId)
- ← `ReconAudit` (child)

**Used By:**

- `packages/api/src/services/recon-core/recon-core-engine.ts` - Core reconciliation engine
- `packages/api/src/routes/v1/runs.ts` - Joined with reconciliation_runs for provenance

---

### 1.3 `reconciliation_runs` Table (Public API)

**Location:** `prisma/schema.prisma` (lines 1270-1300)

**Purpose:** Public API-facing run records, tied to ingestion workflow

**Schema:**

```prisma
model ReconciliationRun {
  id                String    @id @default(uuid())
  ingestionId       String?   @db.Uuid
  tenantId          String    @db.Uuid
  userId            String    @db.Uuid
  name              String?
  status            String    @default("pending")
  startedAt         DateTime  @default(now())
  completedAt       DateTime?

  sourceCount       Int       @default(0)
  targetCount       Int       @default(0)
  matchedCount      Int       @default(0)
  unmatchedSourceCount Int    @default(0)
  unmatchedTargetCount Int    @default(0)

  confidenceAvg     Decimal?  @db.Decimal(5, 4)
  errorMessage      String?   @db.Text
  traceId           String?
  metadata          Json      @default("{}")

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  ingestion         Ingestion? @relation(...)
  matches           ReconciliationMatch[]
}
```

**Key Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `ingestionId` | UUID? | FK to Ingestion (source data) |
| `tenantId` | UUID | Tenant isolation |
| `userId` | UUID | User who triggered |
| `name` | String? | Optional run name |
| `status` | String | pending/running/completed/failed |
| `traceId` | String? | Observability trace |

**Relationships:**

- → `Ingestion` (Prisma model)
- ← `ReconciliationMatch` (child)

**Used By:**

- `packages/api/src/routes/v1/runs.ts` - Public API endpoint

---

## 2. Current Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT STATE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

    LEGACY SYSTEM                         RECON CORE ENGINE                 PUBLIC API
    ─────────────                         ─────────────────                 ─────────

┌──────────────┐                      ┌─────────────────┐            ┌──────────────────┐
│    jobs      │                      │    ReconJob     │            │    Ingestion     │
│  (legacy)    │                      │   (Prisma)      │            │    (Prisma)      │
└──────┬───────┘                      └────────┬────────┘            └────────┬─────────┘
       │                                        │                              │
       │                                        │                              │
       ▼                                        ▼                              ▼
┌──────────────┐                      ┌─────────────────┐            ┌──────────────────┐
│  executions  │◄───────────────────►│   recon_results │            │reconciliation_runs│
│              │   executionId         │                 │            │                  │
│ - job_id     │   (optional)          │ - reconJobId    │            │ - ingestionId    │
│ - status     │                       │ - tenantId      │            │ - tenantId       │
│ - started_at │                       │ - executionId   │            │ - userId         │
│ - completed  │                       │ - sourceCount   │            │ - name           │
│ - error      │                       │ - targetCount   │            │ - status         │
│ - summary    │                       │ - matchedCount  │            │ - traceId        │
└──────────────┘                       │ - confidenceAvg │            └────────┬─────────┘
                                       │ - provenance    │                     │
┌──────────────┐                       │   (in summary)  │                     │
│   matches    │                       └─────────────────┘                     │
│   unmatched  │                                                        ┌──────────────────┐
│   reports    │                                                        │ReconciliationMatch│
└──────────────┘                                                        └──────────────────┘


API ACCESS PATTERN:
─────────────────────────────────────────────────────────────────────────────────

GET /api/v1/runs           →  reconciliation_runs
GET /api/v1/runs/:id       →  reconciliation_runs + LEFT JOIN recon_results (for provenance)

GET /api/runs              →  executions + JOIN jobs
GET /api/runs/:id          →  executions + JOIN jobs
```

---

## 3. Redundancy Assessment

### 3.1 Duplicate/Overlapping Columns

| Column Group     | executions        | recon_results    | reconciliation_runs |
| ---------------- | ----------------- | ---------------- | ------------------- |
| ID               | ✓                 | ✓                | ✓                   |
| Status           | ✓ (status)        | ✓ (status)       | ✓ (status)          |
| Start Time       | ✓ (started_at)    | ✓ (startedAt)    | ✓ (startedAt)       |
| End Time         | ✓ (completed_at)  | ✓ (completedAt)  | ✓ (completedAt)     |
| Error Message    | ✓ (error)         | ✓ (errorMessage) | ✓ (errorMessage)    |
| Tenant ID        | ✗                 | ✓                | ✓                   |
| User ID          | ✗                 | ✗                | ✓                   |
| Source Count     | ✗                 | ✓                | ✓                   |
| Target Count     | ✗                 | ✓                | ✓                   |
| Matched Count    | ✗                 | ✓                | ✓                   |
| Unmatched Counts | ✗                 | ✓ (x2)           | ✓ (x2)              |
| Confidence       | ✗                 | ✓ (avg/min/max)  | ✓ (avg)             |
| Metadata         | ✓ (summary JSONB) | ✓                | ✓                   |

### 3.2 Key Differences

1. **Tenant Isolation:**
   - `executions`: NONE (relies on jobs table)
   - `recon_results`: ✓ tenantId
   - `reconciliation_runs`: ✓ tenantId + userId

2. **Financial Data:**
   - `executions`: No
   - `recon_results`: ✓ (totalAmount\*, currency)
   - `reconciliation_runs`: No

3. **Provenance Data:**
   - `executions`: No
   - `recon_results`: ✓ (stored in summary JSON)
   - `reconciliation_runs`: No (fetched via JOIN)

4. **Proof/Cryptography:**
   - `executions`: No
   - `recon_results`: ✓ (proofCapsule)
   - `reconciliation_runs`: No

### 3.3 Inconsistent Naming Conventions

| Concept    | executions     | recon_results  | reconciliation_runs |
| ---------- | -------------- | -------------- | ------------------- |
| Start Time | `started_at`   | `startedAt`    | `startedAt`         |
| End Time   | `completed_at` | `completedAt`  | `completedAt`       |
| Error      | `error`        | `errorMessage` | `errorMessage`      |
| Summary    | `summary`      | `summary`      | `metadata`          |

---

## 4. Why Three Tables Exist (Legitimate Reasons)

### 4.1 Historical Evolution

The system evolved through phases:

1. **Phase 1 (Legacy):** Simple job execution with `executions` table
2. **Phase 2 (Recon Core):** New reconciliation engine with `recon_results` - more sophisticated tracking
3. **Phase 3 (Public API):** Separate tracking for ingestion-based reconciliation with `reconciliation_runs`

### 4.2 Different Access Patterns

| Table                 | Primary Access Pattern          | Use Case                 |
| --------------------- | ------------------------------- | ------------------------ |
| `executions`          | job_id lookups                  | Internal job processing  |
| `recon_results`       | reconJobId + tenantId           | Recon Core Engine        |
| `reconciliation_runs` | ingestionId + tenantId + userId | Public API / User-facing |

### 4.3 Different Data Models

- **executions**: Linked to `jobs` (legacy)
- **recon_results**: Linked to `ReconJob` (new Prisma model)
- **reconciliation_runs**: Linked to `Ingestion` (data ingestion workflow)

### 4.4 Tenant Isolation Requirements

- `executions`: Pre-dates tenant isolation (no tenantId)
- `recon_results`: Built with tenant isolation
- `reconciliation_runs`: Built with tenant + user isolation

---

## 5. Consolidation Proposal

### 5.1 Recommendation: Maintain Status Quo (With Improvements)

**Reason:** The three tables serve genuinely different purposes:

1. **executions** - Legacy but still actively used for internal job processing
2. **recon_results** - Rich provenance and proof data for Recon Core Engine
3. **reconciliation_runs** - Ingestion-based workflow, public API

Consolidating would require:

- Massive migration of historical data
- Breaking changes to multiple APIs
- Loss of the ingestion-based workflow model

### 5.2 Recommended Improvements

Instead of consolidation, implement these improvements:

#### 5.2.1 Add tenantId to executions (Critical)

The `executions` table lacks tenant isolation - this is a security issue:

```sql
-- Add tenant_id column to executions
ALTER TABLE executions ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Backfill from jobs table
UPDATE executions e
SET tenant_id = j.tenant_id
FROM jobs j
WHERE e.job_id = j.id;

-- Add index
CREATE INDEX idx_executions_tenant_id ON executions(tenant_id);
```

#### 5.2.2 Standardize Naming Conventions

Create a view or migration to standardize:

- `startedAt` / `started_at` → `startedAt`
- `completedAt` / `completed_at` → `completedAt`
- `error` / `errorMessage` → `errorMessage`

#### 5.2.3 Deprecation Path for executions

If the legacy jobs system is being deprecated:

1. Continue supporting `executions` for backward compatibility
2. New code should use `recon_results` or `reconciliation_runs`
3. Add deprecation warnings to `executions`-based APIs

#### 5.2.4 Provenance in reconciliation_runs

The current JOIN between `reconciliation_runs` and `recon_results` works but could be improved:

```prisma
// In ReconciliationRun model, add provenance fields directly
model ReconciliationRun {
  // ... existing fields ...

  // Provenance fields (denormalized for API performance)
  provenanceAmountTolerance   String?
  provenanceDateToleranceDays String?
  provenanceConfigVersion    String?
  provenanceConfigSource     String?
  provenanceTemplateId       String?
  provenanceMatchingRuleIds  String?
}
```

---

## 6. Proposed Unified Structure (Future State)

If consolidation were to be pursued in the future, here's the proposed structure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROPOSED UNIFIED STRUCTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         unified_reconciliation_runs                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ id                    UUID                                                 │
│ tenant_id             UUID                                                │
│ user_id               UUID                                                │
│                                                                             │
│ -- Source identification (polymorphic)                                     │
│ job_id                UUID?  (legacy jobs)                                │
│ recon_job_id          UUID?  (recon core)                                  │
│ ingestion_id          UUID?  (ingestion workflow)                         │
│                                                                             │
│ -- Workflow type                                                         │
│ workflow_type         VARCHAR  -- 'legacy' | 'recon_core' | 'ingestion'  │
│                                                                             │
│ -- Status & timing                                                       │
│ status                VARCHAR  -- pending/running/completed/failed        │
│ started_at            TIMESTAMP                                          │
│ completed_at          TIMESTAMP                                           │
│                                                                             │
│ -- Counts                                                                │
│ source_count          INT                                                 │
│ target_count          INT                                                 │
│ matched_count         INT                                                 │
│ unmatched_source_count INT                                                │
│ unmatched_target_count INT                                                │
│ conflict_count        INT                                                 │
│                                                                             │
│ -- Financial                                                            │
│ total_amount_source   DECIMAL(15,2)                                       │
│ total_amount_target   DECIMAL(15,2)                                       │
│ total_amount_matched  DECIMAL(15,2)                                       │
│ total_amount_unmatched DECIMAL(15,2)                                      │
│ currency              VARCHAR                                            │
│                                                                             │
│ -- Confidence                                                           │
│ confidence_avg        DECIMAL(5,4)                                        │
│ confidence_min        DECIMAL(5,4)                                        │
│ confidence_max        DECIMAL(5,4)                                        │
│                                                                             │
│ -- Error handling                                                        │
│ error_message         TEXT                                                │
│ error_stack           TEXT                                                │
│                                                                             │
│ -- Provenance (denormalized for performance)                              │
│ provenance_config_version   VARCHAR                                       │
│ provenance_config_source    VARCHAR                                       │
│ provenance_template_id      UUID                                         │
│ provenance_matching_rule_ids JSON                                        │
│ provenance_amount_tolerance  VARCHAR                                      │
│ provenance_date_tolerance_days VARCHAR                                   │
│                                                                             │
│ -- Extended data                                                         │
│ metadata              JSONB                                                │
│ proof_capsule        JSONB                                                │
│                                                                             │
│ -- Audit                                                                │
│ created_at           TIMESTAMP                                           │
│ updated_at           TIMESTAMP                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Migration Strategy (If Pursued)

### Phase 1: Preparation

1. Add all new columns to `reconciliation_runs` (the target table)
2. Create migration scripts to copy data

### Phase 2: Data Migration

```sql
-- Copy from executions
INSERT INTO reconciliation_runs
  (id, tenant_id, user_id, job_id, workflow_type, status,
   started_at, completed_at, error_message, metadata, created_at)
SELECT
  e.id, j.tenant_id, j.user_id, e.job_id, 'legacy', e.status,
  e.started_at, e.completed_at, e.error, e.summary, e.created_at
FROM executions e
JOIN jobs j ON e.job_id = j.id;

-- Copy from recon_results
UPDATE reconciliation_runs rr
SET
  source_count = rr2.source_count,
  target_count = rr2.target_count,
  matched_count = rr2.matched_count,
  unmatched_source_count = rr2.unmatched_source_count,
  unmatched_target_count = rr2.unmatched_target_count,
  total_amount_source = rr2.total_amount_source,
  total_amount_target = rr2.total_amount_target,
  total_amount_matched = rr2.total_amount_matched,
  total_amount_unmatched = rr2.total_amount_unmatched,
  confidence_avg = rr2.confidence_avg,
  provenance_config_version = rr2.summary->>'provenance'->>'configVersion',
  provenance_config_source = rr2.summary->>'provenance'->>'configSource',
  provenance_template_id = rr2.summary->>'provenance'->>'templateId',
  provenance_matching_rule_ids = rr2.summary->>'provenance'->>'matchingRuleIds',
  proof_capsule = rr2.proof_capsule
FROM recon_results rr2
WHERE rr.id = rr2.execution_id;
```

### Phase 3: API Updates

1. Update routes to use unified table
2. Add backward-compatible views

### Phase 4: Deprecation

1. Mark old tables as deprecated
2. Monitor usage
3. Remove after 6-12 months

---

## 8. Conclusion

**The current three-table architecture, while confusing, has legitimate reasons for existence:**

1. **Historical evolution** - Tables were added as the system evolved
2. **Different access patterns** - Each serves different API endpoints
3. **Different data models** - Linked to different parent entities
4. **Different isolation requirements** - Varying levels of tenant/user scoping

**Recommended Actions:**

1. ✅ **Add tenantId to executions** (security critical)
2. ✅ **Document the table purposes clearly** (this document)
3. ✅ **Standardize naming** in new code
4. ❌ **Do NOT consolidate** at this time - too disruptive
5. ⚠️ **Consider deprecation path** for legacy `executions` table

The JOIN between `reconciliation_runs` and `recon_results` in the v1/runs.ts API is actually a good pattern - it keeps the public API lean while allowing rich provenance data to be available when needed.

---

_Analysis Date: 2026-03-18_
_Files Analyzed:_

- `prisma/schema.prisma`
- `packages/api/src/db/index.ts`
- `packages/api/src/routes/v1/runs.ts`
- `packages/api/src/routes/runs.ts`
- `packages/api/src/routes/jobs.ts`
- `packages/api/src/services/recon-core/recon-core-engine.ts`
