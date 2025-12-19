# Invariant Enforcement - Critical Rules

**MANDATORY**: All changes must comply with these invariants.

## Core Invariant

**"Reconciliation is a system behavior, not a human task."**

## Enforcement Rules

### ❌ REJECT If It:

1. **Increases configuration burden** → Remove or collapse
2. **Exposes internal mechanics** (AI, agents, pipelines) → Hide or rename
3. **Requires user vigilance** to prevent failure → Redesign
4. **Introduces periodic/manual reconciliation** → Reject
5. **Cannot survive staff absence/turnover/weekends** → Incomplete

### ❌ EXPLICITLY REJECT:

- Dashboards without decision authority
- Controls without necessity
- Flexibility that weakens inevitability
- "Power user" complexity to solve design flaws

### ✅ VERIFY Before Committing:

- System explains mismatches automatically
- Exceptions are explicit, auditable, and bounded
- Users feel upgraded, not replaced
- Product feels calmer, not busier

## Violations Fixed

### 1. Hidden AI Internals ✅
- **Before**: "AI Insights Panel", "AI Analysis"
- **After**: "Insights Panel", "Analysis"
- **Files**: 
  - `components/console/AIInsightsPanel.tsx` → renamed function
  - `app/console/ai-analysis/page.tsx` → removed "AI" from UI
  - `components/console/AIAnalysisPanel.tsx` → renamed function

### 2. Removed Monitoring Language ✅
- **Before**: "monitor usage", "watch for", "alert on"
- **After**: Removed monitoring implications
- **Files**:
  - `app/console/page.tsx` → removed "monitor usage"

### 3. Removed Configuration Language ✅
- **Before**: "configure feature flags", "setup required"
- **After**: "create feature flags"
- **Files**:
  - `app/console/page.tsx` → "configure" → "create"

## Remaining Audits

### Workflows
- **Status**: User-created automation (OK)
- **Action**: Verify they don't require vigilance
- **File**: `app/console/workflows/page.tsx`

### Control Plane
- **Status**: Policies may be necessary
- **Action**: Audit if policies are required or optional complexity
- **File**: `app/console/control-plane/page.tsx`

### Dashboards
- **Status**: Need to verify decision authority
- **Action**: Audit each dashboard for actionable decisions
- **Files**: All dashboard pages

### Exception Handling
- **Status**: Need to verify automatic explanation
- **Action**: Ensure system explains mismatches automatically
- **Files**: Error handling, exception pages

## Language Rules

### ❌ FORBIDDEN Words:
- "monitor" (implies vigilance)
- "watch" (implies vigilance)
- "configure" (implies burden)
- "setup" (implies burden)
- "tuning" (implies manual work)
- "AI" (exposes internals)
- "agent" (exposes internals)
- "pipeline" (exposes internals)

### ✅ PREFERRED Language:
- "automatic"
- "continuous"
- "system-native"
- "exception supervision"
- "insights" (not "AI insights")
- "analysis" (not "AI analysis")

## Testing Checklist

Before any commit:

- [ ] No new configuration burden
- [ ] No exposed internals (AI/agents/pipelines)
- [ ] No vigilance requirements
- [ ] No manual/periodic reconciliation
- [ ] Works without staff presence
- [ ] Dashboards enable decisions
- [ ] Controls are necessary
- [ ] System explains mismatches
- [ ] Exceptions are explicit
- [ ] Users feel upgraded
- [ ] Product feels calmer

## Rollback Protocol

If an invariant is violated:
1. **STOP** immediately
2. **ROLLBACK** the change
3. **SIMPLIFY** the approach
4. **VERIFY** against all invariants
5. **RETRY** with simpler design
