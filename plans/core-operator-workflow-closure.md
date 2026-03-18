# Core Operator Workflow Closure - Implementation Plan

**Date:** 2026-03-18  
**Milestone:** Core Operator Workflow Closure + Proactive Governance UX + Reconciliation Path Truth  
**Status:** Ready for Implementation

---

## EXECUTIVE SUMMARY

Settler has established foundational governance infrastructure but requires targeted improvements to deliver a fully credible operator workflow experience. This plan addresses the remaining high-value gaps across freeze-aware UI, mutation route protection, results/reconciliation usefulness, workflow continuity, and operator state quality.

**Current State:**

- ✅ Governance middleware exists (`enforceFreezeState`)
- ✅ Freeze state persistence (`tenant_governance` table)
- ✅ Governance API routes (`/api/v1/governance/freeze`)
- ✅ Frontend governance components (`FreezeToggle`, `GovernanceBanner`, `FreezeBlockedButton`)
- ✅ 11 high-value routes already protected (reconciliation, ingestion, approvals, bulk ops, jobs, exceptions, admin sagas)
- ⚠️ Proactive freeze-aware UI incomplete on mutation surfaces
- ⚠️ ~20+ mutation routes not yet freeze-protected
- ⚠️ Results/reconciliation workflow needs improvement
- ⚠️ Operator workflow continuity has gaps
- ⚠️ Blocked-action UX inconsistent

**Target State:**

- All high-risk mutation routes protected by freeze enforcement
- Proactive freeze-aware UI on all mutation-heavy surfaces
- Clear operator workflow paths: health → runs → results → reconciliation
- Consistent blocked-action UX with recovery guidance
- Meaningful empty/degraded states across operator surfaces
- Comprehensive test coverage for governance behavior

---

## PHASE 0: REALITY CHECK FINDINGS

### Freeze Enforcement Coverage (Backend)

**Currently Protected Routes (11 total):**

1. `/api/v1/reconciliation/run` - POST
2. `/api/v1/reconciliation/matches/:matchId` - PATCH
3. `/api/v1/multi-source-reconciliation/jobs/:jobId/run` - POST
4. `/api/v1/multi-source-reconciliation/conflicts/:conflictId/resolve` - POST
5. `/api/v1/ingestion/sources` - POST
6. `/api/v1/ingestion/upload` - POST
7. `/api/v1/ingestion/:ingestionId/retry` - POST
8. `/api/v1/bulk-operations` - POST
9. `/api/v1/automated-review/run/:runId` - POST
10. `/api/v1/automated-review/match/:matchId` - POST
11. `/api/v1/approvals/requests/:approvalId/approve` - POST
12. `/api/v1/approvals/requests/:approvalId/reject` - POST
13. `/api/jobs` - POST
14. `/api/jobs/:id/run` - POST
15. `/api/jobs/:id` - DELETE
16. `/api/exceptions/:id/resolve` - POST
17. `/api/exceptions/bulk-resolve` - POST
18. `/api/admin/sagas/:sagaType/:sagaId/resume` - POST
19. `/api/admin/sagas/:sagaType/:sagaId/retry` - POST
20. `/api/admin/sagas/:sagaType/:sagaId/cancel` - POST
21. `/api/admin/dead-letter-queue/:id/resolve` - POST
22. `/api/admin/dry-run` - POST

**High-Value Routes NOT Yet Protected:**

1. `/api/v1/operator-mode/operator/kill-switches` - POST (critical control)
2. `/api/v1/operator-mode/operator/kill-switches/connectors/:connectorType/disable` - POST
3. `/api/v1/operator-mode/operator/kill-switches/connectors/:connectorType/enable` - POST
4. `/api/v1/operator-mode/operator/kill-switches/jobs/:jobType/pause` - POST
5. `/api/v1/operator-mode/operator/kill-switches/jobs/:jobType/resume` - POST
6. `/api/v1/operator-mode/operator/backups/create` - POST
7. `/api/v1/operator-mode/operator/backups/:backupId/verify` - POST
8. `/api/v1/operator-mode/operator/cost-controls/usage-ceilings` - POST
9. `/api/v1/operator-mode/operator/cost-controls/job-limits` - POST
10. `/api/v1/advanced-matching-rules` - POST
11. `/api/v1/advanced-matching-rules/:ruleId/test` - POST
12. `/api/edge-ai/batch-ingestion` - POST
13. `/api/edge-ai/nodes` - POST
14. `/api/edge-ai/nodes/enroll` - POST
15. `/api/edge-ai/nodes/:id` - PATCH
16. `/api/edge-ai/nodes/:id` - DELETE
17. `/api/v1/custom-integrations` - POST
18. `/api/v1/custom-integrations/:integrationId` - PATCH
19. `/api/v1/dedicated-infrastructure` - POST
20. `/api/v1/dedicated-infrastructure/:infrastructureId` - DELETE
21. `/api/tenant-data/data` - DELETE (GDPR/data deletion)
22. `/api/v1/exports` - POST
23. `/api/v1/ingestion-exports` - POST

### Governance UI Components (Frontend)

**Existing Components:**

- ✅ `FreezeToggle` - Full governance control with confirmation
- ✅ `GovernanceBanner` - Prominent freeze warning banner
- ✅ `FreezeBlockedButton` - Proactive button disable component
- ✅ `FreezeAwareSection` - Section-level freeze indication
- ✅ `useGovernanceState` hook exists (found in ReceiptMatching.tsx usage)

**UI Surfaces Needing Freeze-Aware Controls:**

- ⚠️ Ingestion upload/retry controls
- ⚠️ Reconciliation run/rerun controls
- ⚠️ Bulk operations interface
- ⚠️ Approval approve/reject actions (backend protected, UI not proactive)
- ⚠️ Exception resolution controls
- ⚠️ Job execution controls (backend protected, UI not proactive)
- ⚠️ Operator mode kill-switch controls
- ⚠️ Advanced matching rules creation

### Results/Reconciliation Workflow

**Current State:**

- Reconciliation runs API exists (`/api/v1/reconciliation/runs/:runId`)
- Run detail route returns comprehensive data
- UI component `ReconResultExplainer.tsx` exists but minimal
- No clear path from health → runs → results → reconciliation outcome

**Gaps:**

- Results surface feels like dead-end
- No meaningful empty states for "no runs yet"
- No clear linkage between run detail and reconciliation outcomes
- Operator cannot easily understand: what ran, what failed, what to do next

---

## PHASE 1: EXTEND FREEZE COVERAGE TO HIGH-VALUE MUTATION ROUTES

**Objective:** Protect remaining high-risk mutation routes with freeze enforcement.

### 1.1 Operator Mode Control Routes

**File:** `packages/api/src/routes/v1/operator-mode.ts`

**Routes to Protect:**

```typescript
// Kill switches - CRITICAL
router.post("/operator/kill-switches", enforceFreezeState(), ...)
router.post("/operator/kill-switches/connectors/:connectorType/disable", enforceFreezeState(), ...)
router.post("/operator/kill-switches/connectors/:connectorType/enable", enforceFreezeState(), ...)
router.post("/operator/kill-switches/jobs/:jobType/pause", enforceFreezeState(), ...)
router.post("/operator/kill-switches/jobs/:jobType/resume", enforceFreezeState(), ...)

// Backups
router.post("/operator/backups/create", enforceFreezeState(), ...)
router.post("/operator/backups/:backupId/verify", enforceFreezeState(), ...)

// Cost controls
router.post("/operator/cost-controls/usage-ceilings", enforceFreezeState(), ...)
router.post("/operator/cost-controls/job-limits", enforceFreezeState(), ...)
```

**Rationale:** Kill switches and backup operations are critical control plane mutations that should respect freeze state.

### 1.2 Advanced Matching Rules

**File:** `packages/api/src/routes/v1/advanced-matching-rules.ts`

**Routes to Protect:**

```typescript
router.post("/", enforceFreezeState(), ...) // Create rule
router.post("/:ruleId/test", enforceFreezeState(), ...) // Test rule (writes test results)
```

**Rationale:** Rule creation/modification affects reconciliation behavior and should be frozen during operational freeze.

### 1.3 Edge AI Routes

**File:** `packages/api/src/routes/edge-ai.ts`

**Routes to Protect:**

```typescript
router.post("/batch-ingestion", enforceFreezeState(), ...)
router.post("/nodes", enforceFreezeState(), ...)
router.post("/nodes/enroll", enforceFreezeState(), ...)
router.patch("/nodes/:id", enforceFreezeState(), ...)
router.delete("/nodes/:id", enforceFreezeState(), ...)
```

**Rationale:** Edge AI node management and batch ingestion are high-risk mutations.

### 1.4 Custom Integrations & Infrastructure

**Files:**

- `packages/api/src/routes/v1/custom-integrations.ts`
- `packages/api/src/routes/v1/dedicated-infrastructure.ts`

**Routes to Protect:**

```typescript
// Custom integrations
router.post("/", enforceFreezeState(), ...)
router.patch("/:integrationId", enforceFreezeState(), ...)

// Dedicated infrastructure
router.post("/", enforceFreezeState(), ...)
router.delete("/:infrastructureId", enforceFreezeState(), ...)
```

**Rationale:** Infrastructure provisioning and integration changes are high-risk operations.

### 1.5 Tenant Data Deletion (GDPR)

**File:** `packages/api/src/routes/tenant-data.ts`

**Route to Protect:**

```typescript
router.delete("/data", enforceFreezeState(), ...)
```

**Rationale:** Tenant data deletion is irreversible and should be blocked during freeze.

### 1.6 Export Routes

**Files:**

- `packages/api/src/routes/v1/exports.ts`
- `packages/api/src/routes/v1/ingestion-exports.ts`

**Decision:** DO NOT protect export routes - exports are read operations that should remain available during freeze.

---

## PHASE 2: PROACTIVE GOVERNANCE-AWARE UI IMPLEMENTATION

**Objective:** Add proactive freeze-aware UI to all mutation-heavy surfaces.

### 2.1 Create/Verify useGovernanceState Hook

**File:** `packages/web/src/hooks/use-governance-state.ts`

**Implementation:**

```typescript
import { useState, useEffect } from "react";

export interface GovernanceState {
  frozen: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
  updated_at: string;
}

export function useGovernanceState() {
  const [governanceState, setGovernanceState] = useState<GovernanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGovernanceState();
    // Poll every 30 seconds
    const interval = setInterval(fetchGovernanceState, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchGovernanceState() {
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch governance state");
      const data = await res.json();
      setGovernanceState(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return {
    governanceState,
    isFrozen: governanceState?.frozen ?? false,
    loading,
    error,
    refetch: fetchGovernanceState,
  };
}
```

### 2.2 Ingestion Upload/Retry Controls

**File:** `packages/web/src/components/console/IngestionUpload.tsx` (or similar)

**Pattern:**

```typescript
import { useGovernanceState } from '@/hooks/use-governance-state';
import { FreezeBlockedButton } from '@/components/shared/FreezeBlockedButton';

export function IngestionUpload() {
  const { isFrozen, governanceState } = useGovernanceState();

  return (
    <FreezeBlockedButton
      isFrozen={isFrozen}
      freezeReason={governanceState?.freeze_reason}
      frozenMessage="Upload blocked by tenant freeze"
      onClick={handleUpload}
    >
      Upload Data
    </FreezeBlockedButton>
  );
}
```

### 2.3 Reconciliation Run/Rerun Controls

**File:** `packages/web/src/components/console/ReconciliationControls.tsx`

**Pattern:**

```typescript
<FreezeBlockedButton
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  frozenMessage="Reconciliation run blocked by tenant freeze"
  onClick={handleRunReconciliation}
>
  Run Reconciliation
</FreezeBlockedButton>
```

### 2.4 Bulk Operations Interface

**File:** `packages/web/src/app/console/bulk-operations/page.tsx`

**Pattern:**

```typescript
<FreezeAwareSection
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  title="Bulk Operations"
  frozenMessage="Bulk operations are disabled during tenant freeze"
>
  {/* Bulk operation controls */}
</FreezeAwareSection>
```

### 2.5 Approval Actions

**File:** `packages/web/src/components/console/ApprovalActions.tsx`

**Pattern:**

```typescript
<FreezeBlockedButton
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  frozenMessage="Approval actions blocked by tenant freeze"
  onClick={handleApprove}
  variant="default"
>
  Approve
</FreezeBlockedButton>

<FreezeBlockedButton
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  frozenMessage="Rejection blocked by tenant freeze"
  onClick={handleReject}
  variant="destructive"
>
  Reject
</FreezeBlockedButton>
```

### 2.6 Exception Resolution Controls

**File:** `packages/web/src/components/console/ExceptionResolution.tsx`

**Pattern:**

```typescript
<FreezeBlockedButton
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  frozenMessage="Exception resolution blocked by tenant freeze"
  onClick={handleResolve}
>
  Resolve Exception
</FreezeBlockedButton>
```

### 2.7 Job Execution Controls

**File:** `packages/web/src/components/console/JobControls.tsx`

**Pattern:**

```typescript
<FreezeBlockedButton
  isFrozen={isFrozen}
  freezeReason={governanceState?.freeze_reason}
  frozenMessage="Job execution blocked by tenant freeze"
  onClick={handleRunJob}
>
  Run Job
</FreezeBlockedButton>
```

---

## PHASE 3: RESULTS/RECONCILIATION WORKFLOW IMPROVEMENTS

**Objective:** Make results/reconciliation surface useful and discoverable.

### 3.1 Audit Current Implementation

**Files to Review:**

- `ui/explainers/ReconResultExplainer.tsx`
- `packages/web/src/app/console/reconciliation/*`
- `packages/web/src/app/console/runs/*`

**Questions:**

- Where do reconciliation results currently surface?
- Is there a dedicated results page?
- How does operator navigate from run → results?

### 3.2 Implement Run Detail → Results Linkage

**File:** `packages/web/src/app/console/runs/[runId]/page.tsx`

**Implementation:**

```typescript
export default function RunDetailPage({ params }: { params: { runId: string } }) {
  const { data: run, loading } = useRun(params.runId);

  return (
    <div>
      <RunHeader run={run} />
      <RunMetrics run={run} />

      {/* Clear path to results */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Results</CardTitle>
          <CardDescription>
            View matched and unmatched transactions from this run
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/console/reconciliation/results?runId=${params.runId}`}>
            <Button>View Results →</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3.3 Meaningful Empty States

**File:** `packages/web/src/app/console/runs/page.tsx`

**No Runs Yet State:**

```typescript
{runs.length === 0 && !loading && (
  <EmptyState
    icon={PlayCircle}
    title="No reconciliation runs yet"
    description="Start your first reconciliation run to see results here"
    action={
      <Link href="/console/ingestion">
        <Button>Upload Data to Start</Button>
      </Link>
    }
  />
)}
```

**File:** `packages/web/src/app/console/reconciliation/results/page.tsx`

**No Results Yet State:**

```typescript
{!runId && (
  <EmptyState
    icon={FileSearch}
    title="No run selected"
    description="Select a reconciliation run to view its results"
    action={
      <Link href="/console/runs">
        <Button>View Runs</Button>
      </Link>
    }
  />
)}
```

### 3.4 Improve Reconciliation Outcome Discoverability

**File:** `packages/web/src/app/console/reconciliation/results/page.tsx`

**Implementation:**

```typescript
export default function ReconciliationResultsPage() {
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const { data: results, loading } = useReconciliationResults(runId);

  return (
    <div>
      <PageHeader
        title="Reconciliation Results"
        description="View matched and unmatched transactions"
        breadcrumbs={[
          { label: 'Console', href: '/console' },
          { label: 'Runs', href: '/console/runs' },
          { label: 'Results', href: '/console/reconciliation/results' },
        ]}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Matched"
          value={results?.matched_count ?? 0}
          icon={CheckCircle}
          variant="success"
        />
        <MetricCard
          title="Unmatched Source"
          value={results?.unmatched_source_count ?? 0}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="Unmatched Target"
          value={results?.unmatched_target_count ?? 0}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Results table */}
      <ResultsTable results={results} />

      {/* Next actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link href="/console/exceptions">
              <Button variant="outline">Review Exceptions →</Button>
            </Link>
            <Link href="/console/runs">
              <Button variant="outline">View All Runs →</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## PHASE 4: WORKFLOW CONTINUITY ENHANCEMENTS

**Objective:** Close operator workflow gaps between key surfaces.

### 4.1 Health → Runs Navigation

**File:** `packages/web/src/app/console/health/page.tsx`

**Implementation:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <Link href="/console/runs">
      <Button variant="outline">View All Runs →</Button>
    </Link>
  </CardContent>
</Card>
```

### 4.2 Runs → Run Detail → Results Navigation

**Already covered in Phase 3.2**

### 4.3 Governance → Blocked Action Recovery

**File:** `packages/web/src/app/console/settings/governance/page.tsx`

**Implementation:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Freeze State</CardTitle>
    <CardDescription>
      Control tenant-wide write operations
    </CardDescription>
  </CardHeader>
  <CardContent>
    <FreezeToggle />

    {isFrozen && (
      <Alert className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>System Frozen</AlertTitle>
        <AlertDescription>
          Write operations are currently blocked. Unfreeze the system to enable:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Reconciliation runs</li>
            <li>Data ingestion</li>
            <li>Approval actions</li>
            <li>Exception resolution</li>
            <li>Bulk operations</li>
          </ul>
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
</Card>
```

### 4.4 Settings → Governance Operational Awareness

**File:** `packages/web/src/app/console/settings/page.tsx`

**Implementation:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Governance</CardTitle>
    <CardDescription>
      Tenant-level operational controls
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Link href="/console/settings/governance">
      <Button variant="outline">Manage Governance →</Button>
    </Link>
  </CardContent>
</Card>
```

### 4.5 Operator Workflow Continuity Map

**Create visual diagram showing operator paths:**

```
┌─────────────────────────────────────────────────────────────┐
│                    OPERATOR WORKFLOW MAP                     │
└─────────────────────────────────────────────────────────────┘

Health Dashboard (/console/health)
    │
    ├─→ System Status
    ├─→ Recent Activity → View All Runs (/console/runs)
    └─→ Alerts

Runs (/console/runs)
    │
    ├─→ Run Detail (/console/runs/:runId)
    │       │
    │       ├─→ View Results (/console/reconciliation/results?runId=X)
    │       ├─→ View Exceptions (/console/exceptions?runId=X)
    │       └─→ Rerun (if not frozen)
    │
    └─→ Start New Run (/console/ingestion)

Results (/console/reconciliation/results)
    │
    ├─→ Matched Transactions
    ├─→ Unmatched Source
    ├─→ Unmatched Target
    └─→ Next Actions
            ├─→ Review Exceptions
            └─→ View All Runs

Governance (/console/settings/governance)
    │
    ├─→ Freeze Toggle
    ├─→ Blocked Action Recovery Guidance
    └─→ Audit Trail

Exceptions (/console/exceptions)
    │
    ├─→ Exception Detail
    ├─→ Resolve (if not frozen)
    └─→ Bulk Resolve (if not frozen)
```

---

## PHASE 5: BLOCKED-ACTION ERROR UX STANDARDIZATION

**Objective:** Normalize blocked-by-freeze behavior across all surfaces.

### 5.1 Standardized Freeze-Blocked Error Response

**File:** `packages/api/src/middleware/governance.ts`

**Current Implementation (already good):**

```typescript
res.status(423).json({
  error: "GOVERNANCE_FREEZE_ACTIVE",
  message: "Operation blocked: Tenant is in read-only mode...",
  frozen: true,
  frozen_at: freezeState.frozen_at,
  freeze_reason: freezeState.freeze_reason,
  traceId: req.traceId,
});
```

**Ensure all protected routes use this format.**

### 5.2 Consistent 423 Locked Response Handling in UI

**File:** `packages/web/src/lib/api-client.ts`

**Implementation:**

```typescript
export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 423) {
    const data = await res.json();
    throw new GovernanceFreezeError(data.message, data.freeze_reason, data.frozen_at);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.json());
  }

  return res.json();
}

export class GovernanceFreezeError extends Error {
  constructor(
    message: string,
    public freezeReason?: string,
    public frozenAt?: string
  ) {
    super(message);
    this.name = "GovernanceFreezeError";
  }
}
```

### 5.3 Freeze Reason Display in Error States

**File:** `packages/web/src/components/shared/ErrorDisplay.tsx`

**Implementation:**

```typescript
export function ErrorDisplay({ error }: { error: Error }) {
  if (error instanceof GovernanceFreezeError) {
    return (
```
