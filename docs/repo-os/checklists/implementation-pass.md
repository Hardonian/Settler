# Implementation Pass Checklist & Report Template

Status: **CANONICAL**  
Last updated: 2026-03-29

Use this checklist for every meaningful implementation pass (human or agent).

## A. Pre-implementation checklist

- [ ] Classified work as **Maintenance**, **Leverage**, or **Moat**.
- [ ] Identified canonical docs/contracts that own the changed behavior.
- [ ] Identified tenant, auth, RLS, cache, and evidence impacts.
- [ ] Identified degraded-state semantics and fallback behavior.
- [ ] Selected verification commands from `docs/repo-os/verification-matrix.md`.

## B. Mandatory execution header (copy into implementation prompt/report)

```md
PROJECT: SETTLER
WORK CLASSIFICATION: <Maintenance|Leverage|Moat>
TRUTH SURFACES IMPACTED: <run detail / evidence / policy / API contract / docs>
TENANT/SECURITY IMPACT: <none|describe>
DEGRADED-STATE IMPACT: <none|describe>
VERIFICATION PROFILE: <commands to run>
NON-NEGOTIABLES:

- no silent contract drift
- no cross-tenant leakage
- evidence before claims
- deterministic behavior or explicit boundary
- truthful degraded states
```

## C. Moat pressure-test block (required when classification is Moat)

- [ ] What compounding operational data is captured?
- [ ] What reusable policy memory/intelligence is added?
- [ ] What workflow lock-in/switching cost increases?
- [ ] What evidence/audit trust depth improves?
- [ ] Why this cannot be easily copied from UI alone?

## D. Verification checklist

- [ ] Lint/type/build/tests (scoped or full) completed.
- [ ] Route/policy/contract verification run when applicable.
- [ ] Tenant/security verification run when applicable.
- [ ] Determinism/replay verification run when applicable.
- [ ] Docs/link verification run for doc changes.
- [ ] Residual risk documented explicitly.

## E. Required final report format

1. **EXECUTIVE SUMMARY**
2. **WHAT WAS ALREADY PRESENT**
3. **ROOT GAPS FOUND**
4. **FILES CREATED / CHANGED**
5. **CANONICAL OWNERSHIP DECISIONS**
6. **VERIFICATION RUN**
7. **REMAINING GAPS OR FOLLOW-UPS**
8. **NEXT HIGHEST-LEVERAGE TASK AFTER THIS PASS**

For each verification command include status icon:

- ✅ pass
- ⚠️ warning/environment-limited
- ❌ fail
