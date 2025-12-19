# Builder Fallacy Audit - Phase 1

**Date**: 2025-01-XX  
**Purpose**: Identify and remove features that exist because they were buildable, not because users need them.

## Core Invariant

**"Reconciliation is a system behavior, not a human task."**

Anything that violates this must be removed, simplified, renamed, or rebuilt.

## Findings

### 1. Exposed Internals (CRITICAL)

**Problem**: UI exposes implementation details that users shouldn't care about:
- "Jobs", "pipelines", "agents", "workflows", "processors"
- These are system internals, not user-facing concepts

**Files Affected**:
- `/console/activity/page.tsx` - References "reconciliation jobs"
- `/console/inspector/page.tsx` - Shows "job attempts"
- `/api/runs/create/route.ts` - Exposes "job" concept
- Various components referencing "workflows", "pipelines"

**Action**: Replace with user-facing abstractions:
- "Jobs" → "Reconciliation runs" or just "Reconciliations"
- "Pipelines" → Remove entirely (internal concept)
- "Agents" → Remove entirely (internal concept)
- "Workflows" → Only if user-created automation, otherwise remove

### 2. Mock Data & Placeholders (CRITICAL)

**Problem**: Production code contains mock data and "coming soon" placeholders

**Files Affected**:
- `/console/activity/page.tsx` - `generateMockEvents()`
- `/console/inspector/page.tsx` - `generateMockWebhooks()`, `generateMockJobs()`
- `/console/control-plane/page.tsx` - Mock data fallback
- `/console/runs/[runId]/page.tsx` - `generateMockRun()`
- `/console/workflows/page.tsx` - Mock data
- `/admin/branding/page.tsx` - "coming soon"
- `/admin/settings/page.tsx` - "coming soon"
- `/admin/flags/page.tsx` - "coming soon"
- `/components/ops/tabs/*.tsx` - Multiple "coming soon" messages

**Action**: 
- Remove all mock data generators
- Replace with real data or remove the feature entirely
- Remove "coming soon" pages - either implement or delete

### 3. Unnecessary Configuration Complexity

**Problem**: Too many configuration options exposed to users

**Files Affected**:
- `/console/control-plane/page.tsx` - "Configure workspace policies"
- Various settings pages with complex configs

**Action**: Simplify to only essential configuration. Most should be automatic.

### 4. Complex Terminology

**Problem**: Technical jargon that obscures simple concepts

**Examples**:
- "Ingestion sources" → Should be "Data sources" or just "Sources"
- "Normalized transactions" → Should be "Transactions"
- "Reconciliation runs" → Should be "Reconciliations"
- "Mapping templates" → Should be "Mappings" or removed if not user-facing

**Action**: Rename to simpler, clearer terms throughout UI and docs.

### 5. Empty/Placeholder Features

**Problem**: Features that exist but don't work

**Files Affected**:
- `/admin/*` pages - Multiple "coming soon"
- `/components/ops/tabs/OpsUsage.tsx` - "Usage analytics coming soon"
- `/components/ops/tabs/OpsBilling.tsx` - "Billing management coming soon"
- `/components/ops/tabs/OpsErrors.tsx` - "Error monitoring coming soon"
- `/components/ops/tabs/OpsWebhooks.tsx` - "Webhook monitoring coming soon"
- `/components/ops/tabs/OpsJobs.tsx` - "Job queue monitoring coming soon"

**Action**: Either implement fully or remove entirely.

## Removal Plan

### Phase 1.1: Remove Mock Data
1. Remove all `generateMock*` functions
2. Replace with real data fetches or remove features
3. Ensure graceful degradation (empty states, not errors)

### Phase 1.2: Remove "Coming Soon" Pages
1. Audit all "coming soon" pages
2. Implement critical features or remove pages
3. Redirect removed pages to appropriate alternatives

### Phase 1.3: Simplify Terminology
1. Create terminology mapping
2. Update all UI text
3. Update all documentation
4. Update API responses (if user-facing)

### Phase 1.4: Hide Internals
1. Remove references to "jobs", "pipelines", "agents" from UI
2. Replace with user-facing abstractions
3. Keep internals in code but not in user-facing text

## Success Criteria

- [ ] No mock data in production code
- [ ] No "coming soon" pages
- [ ] No exposed internals in UI
- [ ] All terminology is simple and clear
- [ ] Every feature works or is removed
