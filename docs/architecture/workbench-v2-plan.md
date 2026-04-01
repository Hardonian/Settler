# Implementation Plan: Settler Enterprise Workbench Hardening

## 1. Vision & Objectives

Transform the current fragmented console into a **Canonical Operator Workbench**.

- **Consolidation**: Moving from 56+ sub-routes to a high-leverage "Command Center".
- **Activation**: Bringing `EvidenceArtifact`, `ProofPackage`, and `AdjudicationMemory` from schema-only to first-class UI citizens.
- **Aliveness**: Implementing real-time run monitoring and exception queue updates.
- **Trust**: Surfacing provenance and completeness metrics to provide "enterprise feel".

## 2. Workstream A: The Canonical Workbench

### A.1. Main Console Redesign

- **File**: `packages/web/src/app/console/page.tsx`
- **Action**: Replace the current "overview" with the **Operator Workbench v2**.
- **Features**:
  - **Live Run Ticker**: Real-time progress of active reconciliation jobs.
  - **Exception Pulse**: Visual indicators of incoming exceptions and urgency.
  - **Task Queue**: Prioritized list of exceptions needing manual adjudication.

### A.2. Route Consolidation

- **Action**: Redirect `console/operator`, `console/exceptions`, and `console/runs` to the main workbench or sub-panels within it.
- **Goal**: Reduce navigation friction for the operator.

## 3. Workstream B: Aliveness Substrate (Real-time)

### B.1. SSE API Expansion

- **File**: `packages/api/src/routes/realtime.ts`
- **Action**: Expand the SSE endpoint to stream `reconciliation_match` updates and `recon_result` progress.
- **Benefit**: Removes the need for manual refreshes and provides an "operationally alive" feel.

### B.2. Frontend SSE Integration

- **Hook**: Create `useWorkbenchRealtime` hook in `packages/web/src/hooks/use-workbench-realtime.ts`.

## 4. Workstream F: Moat Activation (Intelligence & Evidence)

### C.1. Intelligence Sidebar (Exception Detail)

- **File**: `packages/web/src/app/console/exceptions/[exceptionId]/page.tsx`
- **Action**: Add a right-rail sidebar for **Decision Support**.
- **Panels**:
  - **"Similar Cases"**: Matches from `AdjudicationMemory`.
  - **"Why Flagged"**: Evidence-backed explanation.
  - **"Policy Tuning"**: Interactive hints to prevent future similar exceptions.

### C.2. Evidence Trust Layer

- **Component**: Create `EvidenceTrustCard` to surface `EvidenceArtifact` reliability and `ProofPackage` completeness.
- **Grounding**: Ensure data is pulled from the canonical `EvidenceArtifact` model.

## 5. Workstream I: API Hardening

### D.1. Service Operationalization

- **File**: `packages/api/src/routes/exception-intelligence.ts`
- **Action**: Refactor routes to use `AdjudicationMemoryService` and `EvidenceArtifactService` methods rather than direct Prisma calls.
- **Goal**: Ensure logic parity and audit trail integrity.

### D.2. Tenant Guardrails

- **Action**: Audit all touched routes to ensure `req.tenantId` is strictly enforced and never drifted to `user.id` or generic queries.

## 6. Verification Plan

- **Lint & Typecheck**: `pnpm lint`, `pnpm typecheck`
- **Build**: `pnpm build`
- **Manual Verification**:
  - Verify real-time updates on the workbench.
  - Verify "Similar Cases" appear in exception detail.
  - Verify "Evidence Trust" metrics are accurate.
