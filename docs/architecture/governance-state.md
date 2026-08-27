# Governance State Architecture

Settler's governance layer provides a tenant-scoped freeze state that fails closed on the backend and is surfaced proactively in the console.

## Backend Flow

1. Mutation routes attach `enforceFreezeState()`.
2. The middleware resolves tenant freeze state from the governance cache or database.
3. If the tenant is frozen, the route returns `423 Locked` with the freeze reason and timestamp.
4. Governance write routes use `bypassFreeze` so authorized operators can unfreeze the tenant.

## Persistence

- Table: `tenant_governance`
- Key fields:
  - `tenant_id`
  - `frozen`
  - `frozen_at`
  - `frozen_by`
  - `freeze_reason`
  - `updated_at`

## Frontend Flow

1. `useGovernanceState()` polls `/api/v1/governance/freeze`.
2. Mutation-heavy surfaces use `FreezeBlockedButton` for proactive disablement.
3. Reactive failures parse the canonical `423` payload through `parseGovernanceFreezeError()`.
4. Recovery guidance is standardized through `FreezeErrorAlert` and the governance recovery href.

## UX Guarantees

- Operators can still inspect runs, results, diagnostics, and settings during freeze.
- Blocked mutations explain why they are blocked and where to recover.
- Governance recovery lands on `/console/settings?tab=governance#governance`.

## Verification Surfaces

- `scripts/verify-freeze-coverage.ts`
- Backend route tests for freeze-protected mutations
- Frontend tests for governance hook and freeze-aware controls
