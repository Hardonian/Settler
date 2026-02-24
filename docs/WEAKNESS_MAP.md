# Settler Weakness Map & Risk Classification

**Generated:** 2026-02-24
**Audit Scope:** Production-grade Reconciliation Control Plane hardening

---

## Executive Summary

Settler has a solid architectural foundation with proper separation between marketing and authenticated routes. The reconciliation engine is functional but lacks production-grade determinism guarantees and evidence traceability. This document maps identified weaknesses and their risk classifications.

---

## Architecture Mapping

### Confirmed Layers

| Layer | Location | Status |
|-------|----------|--------|
| Public Marketing | `packages/web/src/app/(marketing)`, top-level routes | ✅ Clean - No Supabase imports |
| Authenticated App Shell | `packages/web/src/app/app/*` | ✅ Properly gated |
| Reconciliation Engine | `packages/api/src/services/recon-core/` | ⚠️ Needs determinism |
| Rule System | `packages/api/src/services/confidence-scoring.ts` | ⚠️ Missing versioning |
| Run Orchestration | `packages/web/src/app/app/runs/` | ✅ UI present |
| Review Workflow | `packages/web/src/app/app/review/` | ⚠️ Needs audit trail |
| Evidence Tracking | `prisma/schema.prisma` - ReconAudit, DriftEvent | ⚠️ Incomplete |
| Evaluation Layer | `packages/api/src/services/drift/` | ⚠️ TODO placeholders |
| Governance/RLS | Tenant model, RLS policies | ✅ Present |
| Connections Abstraction | `packages/adapters/` | ✅ Modular |
| CI Scripts | `scripts/` | ✅ Extensive |

---

## Weakness Map

### 1. DETERMINISM GAPS (Risk: HIGH)

**Issue:** Reconciliation runs are not fully reproducible.

| Gap | Location | Impact |
|-----|----------|--------|
| No input hash fingerprinting | `recon-core-engine.ts` | Same inputs may produce different results if data changes |
| No rule version locking | `confidence-scoring.ts` | Rule changes affect historical runs |
| No execution provenance log | Missing | Cannot reconstruct decision chain |
| Match order not explicitly versioned | `performReconciliation()` | Order-dependent results |

**Evidence:**
```typescript
// recon-core-engine.ts:42-51
export interface ReconMatch {
  id: string;
  sourceId: string;
  targetId: string;
  confidence: number;
  // MISSING: ruleId, ruleVersion, timestamp, actor
}
```

### 2. EVIDENCE TRACEABILITY GAPS (Risk: HIGH)

**Issue:** Match decisions lack complete audit trail.

| Gap | Location | Impact |
|-----|----------|--------|
| No rule ID in match record | `types.ts` | Cannot trace which rule produced match |
| No rule version in match | `types.ts` | Cannot reproduce historical decisions |
| No actor tracking | Missing | Cannot distinguish system vs human decisions |
| No status transition log | Missing | Cannot track review workflow state changes |

**Evidence:**
```typescript
// recon-core-engine.ts:562-577
matches.push({
  id: `match_${source.id}_${target.id}`,
  sourceId: source.id,
  targetId: target.id,
  confidence: 1.0,
  // MISSING: ruleId, ruleVersion, matchedAt, actor
});
```

### 3. TODO PLACEHOLDERS (Risk: MEDIUM)

**Issue:** 102 TODO comments in API code indicate incomplete implementations.

| Category | Count | Critical Examples |
|----------|-------|-------------------|
| Encryption/Security | 4 | `encryptConfig` uses JSON.stringify instead of encryption |
| Adapter Integration | 8 | Real adapters not implemented |
| Validation Logic | 6 | Schema validation returns `true` unconditionally |
| AI/ML Features | 12 | Model execution placeholders |

**Critical TODOs:**
- `packages/api/src/services/ingestion/stripe-connector.ts:42-53` - No encryption
- `packages/api/src/services/recon-core/recon-core-engine.ts:429` - Export broken
- `packages/api/src/services/drift/drift-detector.ts:196` - Statistical drift not implemented

### 4. BOUNDARY ENFORCEMENT (Risk: MEDIUM)

**Issue:** Marketing/App boundary enforced by convention, not validation.

| Gap | Status |
|-----|--------|
| No automated boundary check | ❌ Missing |
| Supabase in marketing routes | ✅ Not found (good) |
| Server-only env in client | ⚠️ Not validated |
| Marketing bundle includes recon engine | ⚠️ Not validated |

### 5. EVALUATION LAYER (Risk: LOW)

**Issue:** Evaluation metrics incomplete.

| Gap | Location |
|-----|----------|
| No weighted scoring | `confidence-scoring.ts` - basic implementation |
| No grounding metrics | Missing |
| No FP/FN tracking | Missing |
| No historical comparison | Missing |

---

## Risk Classification

### HIGH RISK (Blocks Production)

1. **Non-deterministic execution** - Same inputs must produce same outputs
2. **Missing evidence chain** - Cannot audit match decisions

### MEDIUM RISK (Degrades Reliability)

3. **TODO placeholders** - Incomplete implementations may fail in production
4. **No boundary enforcement** - Risk of accidental leakage

### LOW RISK (Nice to Have)

5. **Evaluation metrics** - Can operate without, but limits optimization

---

## Drift from Canonical Model

| Component | Expected | Actual | Delta |
|-----------|----------|--------|-------|
| Run Snapshot | Immutable input capture | Not implemented | Missing |
| Rule Versioning | Version-locked per run | Single version field | Incomplete |
| Match Evidence | Full provenance | Basic confidence only | Incomplete |
| Review Audit | Decision trail | Basic audit table | Incomplete |

---

## Recommended Actions

### Phase 2: Determinism Hardening
1. Add `RunSnapshot` model with input hash
2. Implement rule version locking
3. Add deterministic ordering guarantees
4. Create execution provenance log

### Phase 3: Evidence & Traceability
1. Extend `ReconMatch` with rule metadata
2. Add actor tracking to all decisions
3. Implement status transition logging
4. Create evidence schema normalization

### Phase 4: Boundary Enforcement
1. Create `scripts/validate-boundaries.ts`
2. Add CI gate for boundary violations
3. Document allowed imports per layer

### Phase 5: Evaluation Engine
1. Implement weighted scoring
2. Add FP/FN tracking
3. Create historical comparison

---

## Files Requiring Modification

| File | Changes Needed |
|------|----------------|
| `prisma/schema.prisma` | Add RunSnapshot, extend ReconMatch |
| `packages/api/src/services/recon-core/types.ts` | Add evidence fields |
| `packages/api/src/services/recon-core/recon-core-engine.ts` | Add determinism |
| `packages/api/src/services/confidence-scoring.ts` | Add rule versioning |
| `packages/web/src/app/app/review/page.tsx` | Add audit trail UI |

---

## Scripts to Add

| Script | Purpose |
|--------|---------|
| `scripts/verify-determinism.ts` | Validate run reproducibility |
| `scripts/validate-boundaries.ts` | Enforce layer separation |

---

## Conclusion

Settler's architecture is sound but requires hardening in two critical areas:
1. **Determinism** - Runs must be reproducible
2. **Evidence** - Decisions must be traceable

The codebase is free of merge conflicts and has proper marketing/app separation by convention. Adding automated enforcement and completing the determinism/evidence gaps will make Settler production-ready.
