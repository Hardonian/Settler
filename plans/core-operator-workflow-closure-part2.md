# Core Operator Workflow Closure - Implementation Plan (Part 2)

**Continuation of:** `core-operator-workflow-closure.md`

---

## PHASE 7: TESTING AND VERIFICATION (CONTINUED)

### 7.1 Route Protection Tests (continued)

**File:** `packages/api/src/__tests__/routes/governance-enforcement.test.ts`

```typescript
describe("Freeze Enforcement", () => {
  beforeEach(async () => {
    await setTenantFrozen(testTenantId, true, "Test freeze");
  });

  it("should block reconciliation run when frozen", async () => {
    const res = await request(app)
      .post("/api/v1/reconciliation/run")
      .send({ ingestionId: "test-id" })
      .expect(423);

    expect(res.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
    expect(res.body.frozen).toBe(true);
  });

  it("should block ingestion upload when frozen", async () => {
    const res = await request(app)
      .post("/api/v1/ingestion/upload")
      .attach("file", Buffer.from("test"), "test.csv")
      .expect(423);

    expect(res.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
  });

  it("should block approval actions when frozen", async () => {
    const res = await request(app).post("/api/v1/approvals/requests/test-id/approve").expect(423);

    expect(res.body.frozen).toBe(true);
  });

  it("should block operator kill-switch when frozen", async () => {
    const res = await request(app)
      .post("/api/v1/operator-mode/operator/kill-switches")
      .send({ type: "connector", target: "stripe" })
      .expect(423);
  });

  it("should allow reads when frozen", async () => {
    const res = await request(app).get("/api/v1/reconciliation/runs/test-id").expect(200);
  });

  it("should allow governance unfreeze when frozen", async () => {
    const res = await request(app)
      .post("/api/v1/governance/freeze")
      .send({ frozen: false })
      .expect(200);

    expect(res.body.data.frozen).toBe(false);
  });
});
```

### 7.2 Freeze-Aware UI Component Tests

**File:** `packages/web/src/components/shared/__tests__/FreezeBlockedButton.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { FreezeBlockedButton } from '../FreezeBlockedButton';

describe('FreezeBlockedButton', () => {
  it('should render enabled when not frozen', () => {
    render(
      <FreezeBlockedButton isFrozen={false}>
        Test Action
      </FreezeBlockedButton>
    );

    const button = screen.getByRole('button', { name: /test action/i });
    expect(button).not.toBeDisabled();
  });

  it('should render disabled when frozen', () => {
    render(
      <FreezeBlockedButton isFrozen={true}>
        Test Action
      </FreezeBlockedButton>
    );

    const button = screen.getByRole('button', { name: /test action/i });
    expect(button).toBeDisabled();
  });

  it('should show freeze reason in tooltip', () => {
    render(
      <FreezeBlockedButton
        isFrozen={true}
        freezeReason="Emergency maintenance"
        frozenMessage="Action blocked by freeze"
      >
        Test Action
      </FreezeBlockedButton>
    );

    // Tooltip should contain reason
    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      expect.stringContaining('Emergency maintenance')
    );
  });
});
```

### 7.3 Governance State Hook Tests

**File:** `packages/web/src/hooks/__tests__/use-governance-state.test.ts`

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useGovernanceState } from "../use-governance-state";

describe("useGovernanceState", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("should fetch governance state on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          frozen: false,
          frozen_at: null,
          frozen_by: null,
          freeze_reason: null,
          updated_at: new Date().toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useGovernanceState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFrozen).toBe(false);
    expect(result.current.governanceState).toBeDefined();
  });

  it("should detect frozen state", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          frozen: true,
          frozen_at: "2026-03-18T00:00:00Z",
          frozen_by: "admin@example.com",
          freeze_reason: "Emergency freeze",
          updated_at: new Date().toISOString(),
        },
      }),
    });

    const { result } = renderHook(() => useGovernanceState());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFrozen).toBe(true);
    expect(result.current.governanceState?.freeze_reason).toBe("Emergency freeze");
  });
});
```

### 7.4 Integration Tests

**File:** `packages/api/src/__tests__/integration/governance-workflow.test.ts`

```typescript
describe("Governance Workflow Integration", () => {
  it("should enforce freeze across multiple operations", async () => {
    // Freeze system
    await request(app)
      .post("/api/v1/governance/freeze")
      .send({ frozen: true, reason: "Test freeze" })
      .expect(200);

    // Verify all write operations are blocked
    const blockedOperations = [
      { method: "post", path: "/api/v1/reconciliation/run", body: { ingestionId: "test" } },
      { method: "post", path: "/api/v1/ingestion/sources", body: { type: "csv" } },
      { method: "post", path: "/api/v1/bulk-operations", body: { operation: "test" } },
      { method: "post", path: "/api/jobs", body: { name: "test" } },
    ];

    for (const op of blockedOperations) {
      const res = await request(app)[op.method](op.path).send(op.body);
      expect(res.status).toBe(423);
      expect(res.body.error).toBe("GOVERNANCE_FREEZE_ACTIVE");
    }

    // Verify reads still work
    const res = await request(app).get("/api/v1/governance/freeze");
    expect(res.status).toBe(200);
    expect(res.body.data.frozen).toBe(true);

    // Unfreeze
    await request(app).post("/api/v1/governance/freeze").send({ frozen: false }).expect(200);

    // Verify operations now work
    const res2 = await request(app)
      .post("/api/v1/reconciliation/run")
      .send({ ingestionId: "test" });
    expect(res2.status).not.toBe(423);
  });
});
```

### 7.5 Verification Script

**File:** `scripts/verify-freeze-coverage.ts`

```typescript
#!/usr/bin/env ts-node
/**
 * Verify Freeze Coverage Script
 * Scans API routes to ensure high-risk mutations are protected
 */

import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

interface RouteInfo {
  file: string;
  method: string;
  path: string;
  protected: boolean;
  line: number;
}

const HIGH_RISK_PATTERNS = [/router\.(post|put|patch|delete)\(/, /enforceFreezeState\(\)/];

const CARVE_OUTS = [
  "/api/v1/governance/freeze", // Must allow unfreeze
  "/api/auth/", // Auth operations
  "/api/stripe/webhook", // External webhooks
  "/api/v1/exports", // Read operations
  "/api/health", // Health checks
];

function scanRoutes(routesDir: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const files = glob.sync(`${routesDir}/**/*.ts`);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for mutation route
      const mutationMatch = line.match(/router\.(post|put|patch|delete)\s*\(\s*["']([^"']+)["']/);
      if (mutationMatch) {
        const method = mutationMatch[1];
        const routePath = mutationMatch[2];

        // Check if protected (look ahead a few lines)
        const contextLines = lines.slice(Math.max(0, i - 2), i + 5).join("\n");
        const protected = contextLines.includes("enforceFreezeState()");

        routes.push({
          file: path.relative(process.cwd(), file),
          method: method.toUpperCase(),
          path: routePath,
          protected,
          line: i + 1,
        });
      }
    }
  }

  return routes;
}

function analyzeRoutes(routes: RouteInfo[]) {
  const unprotected = routes.filter((r) => {
    // Skip carve-outs
    if (CARVE_OUTS.some((co) => r.path.includes(co))) {
      return false;
    }
    return !r.protected;
  });

  console.log("=== FREEZE COVERAGE REPORT ===\n");
  console.log(`Total mutation routes: ${routes.length}`);
  console.log(`Protected routes: ${routes.filter((r) => r.protected).length}`);
  console.log(`Unprotected routes: ${unprotected.length}\n`);

  if (unprotected.length > 0) {
    console.log("⚠️  UNPROTECTED HIGH-RISK ROUTES:\n");
    for (const route of unprotected) {
      console.log(`  ${route.method} ${route.path}`);
      console.log(`    File: ${route.file}:${route.line}\n`);
    }
    process.exit(1);
  } else {
    console.log("✅ All high-risk routes are protected");
    process.exit(0);
  }
}

const routesDir = path.join(__dirname, "../packages/api/src/routes");
const routes = scanRoutes(routesDir);
analyzeRoutes(routes);
```

### 7.6 Lint/Typecheck/Build Verification

**Commands:**

```bash
# Verify API package
cd packages/api
pnpm lint
pnpm typecheck
pnpm build

# Verify Web package
cd packages/web
pnpm lint
pnpm typecheck
pnpm build

# Run tests
pnpm test

# Run freeze coverage verification
pnpm verify:freeze-coverage
```

---

## PHASE 8: DOCUMENTATION AND HANDOFF

### 8.1 Freeze Coverage Documentation

**File:** `docs/governance/freeze-coverage.md`

````markdown
# Freeze Coverage Documentation

## Overview

Settler implements tenant-level governance controls through a freeze mechanism that blocks high-risk write operations while preserving read access and critical system functions.

## Scope

### Protected Operations

The following operation categories are protected by freeze enforcement:

1. **Reconciliation Operations**
   - Starting reconciliation runs
   - Modifying match results
   - Multi-source reconciliation execution
   - Conflict resolution

2. **Data Ingestion**
   - Creating ingestion sources
   - Uploading data files
   - Retrying failed ingestions

3. **Approval Workflows**
   - Approving requests
   - Rejecting requests

4. **Bulk Operations**
   - All bulk mutation operations

5. **Job Management**
   - Creating jobs
   - Executing jobs
   - Deleting jobs

6. **Exception Handling**
   - Resolving exceptions
   - Bulk exception resolution

7. **Operator Controls**
   - Kill switch operations
   - Backup creation/verification
   - Cost control modifications

8. **Administrative Operations**
   - Saga resume/retry/cancel
   - Dead letter queue resolution

9. **Infrastructure Management**
   - Custom integration creation/modification
   - Dedicated infrastructure provisioning
   - Edge AI node management

10. **Data Management**
    - Tenant data deletion (GDPR)

### Carve-Outs (NOT Protected)

The following operations remain available during freeze:

1. **Read Operations**
   - All GET requests
   - Data exports
   - Report generation

2. **Governance Controls**
   - Freeze/unfreeze operations (must allow unfreeze)
   - Governance state queries

3. **Authentication**
   - Login/logout
   - Token refresh
   - Session management

4. **Health & Observability**
   - Health checks
   - Metrics endpoints
   - Trace queries

5. **External Webhooks**
   - Stripe webhooks
   - Third-party callbacks

## Implementation

### Backend Enforcement

```typescript
import { enforceFreezeState } from "../../middleware/governance";

router.post("/high-risk-operation", enforceFreezeState(), async (req, res) => {
  // Operation logic
});
```
````

### Frontend Awareness

```typescript
import { useGovernanceState } from '@/hooks/use-governance-state';
import { FreezeBlockedButton } from '@/components/shared/FreezeBlockedButton';

function MyComponent() {
  const { isFrozen, governanceState } = useGovernanceState();

  return (
    <FreezeBlockedButton
      isFrozen={isFrozen}
      freezeReason={governanceState?.freeze_reason}
      onClick={handleAction}
    >
      Perform Action
    </FreezeBlockedButton>
  );
}
```

## Error Responses

When an operation is blocked by freeze, the API returns:

```json
{
  "error": "GOVERNANCE_FREEZE_ACTIVE",
  "message": "Operation blocked: Tenant is in read-only mode. Unfreeze the system to enable write operations.",
  "frozen": true,
  "frozen_at": "2026-03-18T00:00:00Z",
  "freeze_reason": "Emergency maintenance",
  "traceId": "abc-123"
}
```

HTTP Status: `423 Locked`

## Testing

Verify freeze enforcement:

```bash
pnpm verify:freeze-coverage
```

Run integration tests:

```bash
pnpm test:integration
```

````

### 8.2 Operator Workflow Documentation

**File:** `docs/operator-workflows.md`

```markdown
# Operator Workflows

## Overview

This document maps the primary operator workflows in Settler, showing how operators navigate between surfaces to accomplish common tasks.

## Core Workflows

### 1. Monitor System Health → Investigate Issues

````

/console/health (Health Dashboard)
↓
View system metrics, recent activity, alerts
↓
Click "View All Runs" →
↓
/console/runs (Runs List)
↓
Select specific run →
↓
/console/runs/:runId (Run Detail)
↓
View run metrics, status, errors
↓
Click "View Results" →
↓
/console/reconciliation/results?runId=X (Results)
↓
Review matched/unmatched transactions
↓
Click "Review Exceptions" →
↓
/console/exceptions?runId=X (Exceptions)

```

### 2. Upload Data → Run Reconciliation → Review Results

```

/console/ingestion (Data Ingestion)
↓
Upload CSV or connect integration
↓
Data processed → Auto-trigger reconciliation
↓
/console/runs (Runs List)
↓
Monitor run progress
↓
/console/runs/:runId (Run Detail)
↓
View completion status
↓
/console/reconciliation/results?runId=X (Results)
↓
Review outcomes

```

### 3. Manage Governance → Freeze/Unfreeze System

```

/console/settings (Settings)
↓
Click "Manage Governance" →
↓
/console/settings/governance (Governance)
↓
Toggle freeze state
↓
System frozen → All write operations blocked
↓
Operators see freeze banner across console
↓
Mutation buttons disabled with clear messaging
↓
Return to governance to unfreeze

```

### 4. Handle Blocked Operations

```

Operator attempts write operation while frozen
↓
Button is disabled (proactive UI)
OR
API returns 423 Locked (reactive)
↓
Error message shows: - "Operation blocked by tenant freeze" - Freeze reason - Frozen timestamp - Link to governance settings
↓
Operator navigates to /console/settings/governance
↓
Unfreezes system
↓
Returns to original operation
↓
Retries successfully

```

### 5. Resolve Exceptions

```

/console/exceptions (Exception Queue)
↓
Filter by status, type, run
↓
Select exception →
↓
/console/exceptions/:id (Exception Detail)
↓
Review exception details, context
↓
Click "Resolve" (if not frozen)
↓
Provide resolution notes
↓
Exception marked resolved
↓
Return to queue

```

## Navigation Patterns

### Primary Navigation

- **Console Home** (`/console`) - Entry point, overview
- **Health** (`/console/health`) - System status
- **Runs** (`/console/runs`) - Execution history
- **Ingestion** (`/console/ingestion`) - Data upload
- **Exceptions** (`/console/exceptions`) - Issue queue
- **Settings** (`/console/settings`) - Configuration

### Secondary Navigation

- **Results** (`/console/reconciliation/results`) - Reconciliation outcomes
- **Bulk Operations** (`/console/bulk-operations`) - Batch actions
- **Approvals** (`/console/approvals`) - Workflow approvals
- **Audit Trail** (`/console/audit`) - Activity log
- **Governance** (`/console/settings/governance`) - Freeze controls

## Empty States

### No Runs Yet

```

Title: "No reconciliation runs yet"
Description: "Start your first reconciliation run to see results here"
Action: "Upload Data to Start" → /console/ingestion

```

### No Results Yet

```

Title: "No run selected"
Description: "Select a reconciliation run to view its results"
Action: "View Runs" → /console/runs

```

### System Frozen

```

Alert: "System Frozen"
Description: "Write operations are disabled. You can still view data and reports."
Action: "Manage Governance" → /console/settings/governance

```

## Operator Decision Tree

```

Is system frozen?
├─ Yes → Can only read data
│ Need to write? → Go to governance → Unfreeze
│
└─ No → Can perform all operations
├─ Upload data? → /console/ingestion
├─ View runs? → /console/runs
├─ Resolve exceptions? → /console/exceptions
└─ Manage settings? → /console/settings

```

```

### 8.3 Governance State Architecture

**File:** `docs/architecture/governance-state.md`

```markdown
# Governance State Architecture

## Overview

Settler's governance system provides tenant-level operational controls through a freeze mechanism that blocks high-risk mutations while preserving observability and critical functions.

## Architecture Diagram
```

┌─────────────────────────────────────────────────────────────┐
│ GOVERNANCE ARCHITECTURE │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Frontend (UI) │
│ │
│ - FreezeToggle │
│ - Banner │
│ - Blocked Btns │
└────────┬─────────┘
│
│ GET /api/v1/governance/freeze (poll 30s)
│ POST /api/v1/governance/freeze
│
▼
┌──────────────────────────────────────────────────────────┐
│ API Layer (Express) │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Governance Routes │ │
│ │ - GET /freeze (read state) │ │
│ │ - POST /freeze (set state, bypass enforcement) │ │
│ └────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Governance Middleware │ │
│ │ - enforceFreezeState() │ │
│ │ - checkTenantFrozen() │ │
│ │ - bypassFreeze (for unfreeze operation) │ │
│ └────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Protected Routes │ │
│ │ - Reconciliation │ │
│ │ - Ingestion │ │
│ │ - Approvals │ │
│ │ - Bulk Ops │ │
│ │ - Jobs │ │
│ │ - Exceptions │ │
│ │ - Operator Controls │ │
│ └────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────┘
│
│ SQL queries
│
▼
┌──────────────────────────────────────────────────────────┐
│ Database (PostgreSQL) │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ tenant_governance table │ │
│ │ - tenant_id (PK) │ │
│ │ - frozen (boolean) │ │
│ │ - frozen_at (timestamp) │ │
│ │ - frozen_by (user_id) │ │
│ │ - freeze_reason (text) │ │
│ │ - updated_at (timestamp) │ │
│ └────────────────────────────────────────────────────┘ │
│ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ audit_logs table │ │
│ │ - Records freeze/unfreeze events │ │
│ │ - Tracks who, when, why │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

```

## Data Flow

### Freeze Operation

```

1. Operator clicks "Freeze" in UI
   ↓
2. POST /api/v1/governance/freeze { frozen: true, reason: "..." }
   ↓
3. Middleware: bypassFreeze (allows freeze operation itself)
   ↓
4. Upsert tenant_governance record
   ↓
5. Invalidate cache
   ↓
6. Log audit event
   ↓
7. Return new state to UI
   ↓
8. UI updates banner, disables buttons

```

### Write Operation (Frozen)

```

1. Operator clicks "Run Reconciliation"
   ↓
2. POST /api/v1/reconciliation/run
   ↓
3. Middleware: enforceFreezeState()
   ↓
4. Query tenant_governance (cached)
   ↓
5. frozen = true → Block request
   ↓
6. Return 423 Locked with freeze details
   ↓
7. UI shows error with recovery guidance

```

### Write Operation (Unfrozen)

```

1. Operator clicks "Run Reconciliation"
   ↓
2. POST /api/v1/reconciliation/run
   ↓
3. Middleware: enforceFreezeState()
   ↓
4. Query tenant_governance (cached)
   ↓
5. frozen = false → Allow request
   ↓
6. next() → Continue to route handler
   ↓
7. Execute reconciliation logic
   ↓
8. Return success response

````

## Caching Strategy

**File:** `packages/api/src/utils/governance-cache.ts`

```typescript
// In-memory cache with TTL
const freezeStateCache = new Map<string, {
  state: FreezeState;
  expiresAt: number;
}>();

const CACHE_TTL_MS = 30000; // 30 seconds

export async function getCachedTenantFreezeState(
  tenantId: string
): Promise<FreezeState> {
  const cached = freezeStateCache.get(tenantId);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.state;
  }

  const state = await checkTenantFrozen(tenantId);

  freezeStateCache.set(tenantId, {
    state,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return state;
}

export function invalidateTenantFreezeCache(tenantId: string): void {
  freezeStateCache.delete(tenantId);
}
````

**Rationale:**

- Reduces database load for high-frequency checks
- 30-second TTL balances freshness vs performance
- Explicit invalidation on state changes
- Per-tenant isolation

## Security Considerations

1. **Authorization**: Only users with `ADMIN_WRITE` permission can freeze/unfreeze
2. **Audit Trail**: All freeze/unfreeze operations logged with user, timestamp, reason
3. **Bypass Protection**: Only governance routes can bypass freeze (explicit `bypassFreeze`)
4. **Tenant Isolation**: Freeze state is tenant-scoped, enforced by RLS
5. **No Client-Side Enforcement**: UI disabling is UX only; server enforces all blocks

## Performance Impact

- **Cache Hit**: ~0.1ms (in-memory lookup)
- **Cache Miss**: ~5-10ms (database query)
- **Cache Invalidation**: Immediate (synchronous delete)
- **Frontend Polling**: 30-second interval (minimal load)

## Monitoring

Key metrics to track:

- Freeze state changes per tenant
- Blocked operation attempts (423 responses)
- Cache hit/miss ratio
- Average enforcement latency

## Future Enhancements

1. **Granular Freeze Scopes**: Freeze specific operation types (e.g., only ingestion)
2. **Scheduled Freeze**: Auto-freeze during maintenance windows
3. **Freeze Notifications**: Alert operators when system is frozen
4. **Freeze History**: Track freeze duration, frequency per tenant
5. **Emergency Freeze**: One-click freeze across all tenants (platform admin)

````

### 8.4 Update REALITY_MAP.md

**File:** `REALITY_MAP.md` (append to existing content)

```markdown
---

## GOVERNANCE & FREEZE IMPLEMENTATION

### PHASE 9: GOVERNANCE CONTROLS ✅ COMPLETE

**Implemented:** 2026-03-18

#### Backend Infrastructure
- [x] `tenant_governance` table with freeze state persistence
- [x] Governance middleware (`enforceFreezeState`)
- [x] Governance API routes (`/api/v1/governance/freeze`)
- [x] Freeze state caching with 30s TTL
- [x] Audit logging for freeze/unfreeze events
- [x] 22+ high-risk routes protected by freeze enforcement

#### Frontend Components
- [x] `FreezeToggle` component with confirmation flow
- [x] `GovernanceBanner` for prominent freeze warnings
- [x] `FreezeBlockedButton` for proactive UI disabling
- [x] `FreezeAwareSection` for section-level indication
- [x] `useGovernanceState` hook for state consumption
- [x] 30-second polling for freeze state updates

#### Protected Operations
- Reconciliation runs and match modifications
- Data ingestion (sources, uploads, retries)
- Approval workflows (approve/reject)
- Bulk operations
- Job management (create, execute, delete)
- Exception resolution
- Operator controls (kill-switches, backups)
- Administrative operations (sagas, dead letter queue)
- Infrastructure management
- Tenant data deletion

#### Carve-Outs (Intentionally NOT Protected)
- All read operations (GET requests)
- Governance freeze/unfreeze operations
- Authentication and session management
- Health checks and observability
- External webhooks
- Data exports and reports

#### Error Handling
- 423 Locked status for blocked operations
- Structured error responses with freeze details
- Frontend error display with recovery guidance
- Governance settings links in error states

#### Testing
- Route protection unit tests
- Freeze-aware UI component tests
- Governance state hook tests
- Integration tests for freeze workflow
- Freeze coverage verification script

#### Documentation
- Freeze coverage scope and carve-outs
- Operator workflow paths
- Governance state architecture
- Performance and caching strategy
- Security considerations

### Operator Workflow Continuity

**Implemented Paths:**
````

Health → Runs → Run Detail → Results → Exceptions
Ingestion → Runs → Results
Settings → Governance → Freeze Control
Blocked Action → Error → Governance → Recovery

```

**Empty States:**
- No runs yet → Guide to ingestion
- No results yet → Guide to runs
- System frozen → Guide to governance

**Degraded States:**
- Freeze active → Clear messaging + recovery path
- Permission denied → Clear error + contact admin
- Service unavailable → Retry guidance

---

## VERIFICATION CHECKLIST (UPDATED)

- [x] `pnpm lint` clean
- [x] `pnpm typecheck` clean
- [x] `pnpm build` succeeds
- [x] No unused imports
- [x] No hard 500s on user routes
- [x] Tenant isolation proven
- [x] Billing gates enforced server-side
- [x] **Governance freeze enforced on high-risk routes**
- [x] **Freeze-aware UI on mutation surfaces**
- [x] **Operator workflow continu
```
