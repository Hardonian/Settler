# Settler × Gemini 3: Cognitive Proposer / Deterministic Verifier Architecture

## Executive Summary

Settler pairs the cognitive fluidity and multimodal reasoning of **Gemini 3** (specifically Gemini 3.8 Flash) with the cryptographic rigor of Settler's **deterministic Rust kernel, Content-Addressable Storage (CAS), and WebAssembly verifier**.

In mission-critical financial infrastructure and treasury management, probabilistic models cannot directly mutate or balance ledgers because a 0.01% hallucination rate on a $10B balance sheet is catastrophic. Settler resolves this fundamental tension by establishing a strict architectural boundary:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   GEMINI 3 COGNITIVE PERIMETER LAYER                        │
│                                                                             │
│  - 1M+ Token Multimodal Document & Unstructured Statement Ingestion         │
│  - Causal Counterfactual Exception Adjudication                             │
│  - SOX-404 Dual-Signature Policy Promotion (Maker / Checker Separation)    │
│  - Zero-Shot Synthetic Connector Synthesis (OpenAPI / PDF docs)             │
│  - Conversational Big-4 Auditor Copilot (Natural Language → Proof Planning) │
│  - Adversarial Metamorphic Attack Vector Fuzzer                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Proposes typed candidate actions
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SETTLER DETERMINISTIC VERIFICATION KERNEL                   │
│                                                                             │
│  - Rust Fixed-Point Math & Zero-Float-Drift Assertions                      │
│  - 100% Tenant Isolation (assertTenantScoped & PostgreSQL RLS)              │
│  - SHA-256 Merkle Evidence Trees (RFC 6962)                                 │
│  - Browser Client-Side Offline Proofpack Verifier (Web Crypto API & WASM)   │
│  - Immutable SHA-256 Cryptographic Policy Certificates (0x... State Roots)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Seven Cognitive Pillars

### 1. Multimodal 1M+ Token Universal Ingestion
- **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts)
- **API Route:** `POST /api/v1/cognitive/ingest`
- **Functionality:**
  - Bypasses legacy, brittle OCR and custom regex scrapers.
  - Ingests raw unstructured bank statement exports, scanned remittance slips, SWIFT MT940, and CAMT.053 XML files.
  - Normalizes transactions into strictly typed `NormalizedExtractedRecord` objects with bounding-box provenance.
  - Evaluates mathematical net totals against declared statement headers, reporting exact delta breaks if any drift is detected.

### 2. Autonomous Closed-Loop Exception Adjudication
- **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts) & [`packages/reconciliation-core/src/pattern-learning-engine.ts`](../packages/reconciliation-core/src/pattern-learning-engine.ts)
- **API Route:** `POST /api/v1/cognitive/adjudicate`
- **Functionality:**
  - Performs causal counterfactual reasoning across reconciliation exceptions.
  - Distinguishes settlement calendar cutoff lags (e.g. UK bank holidays) and micro-cent FX rounding variances from fraudulent leakage.
  - Emits cryptographically bounded `SelfHealingPlan` candidates.
  - Simulates proposed plans against historical run data, guaranteeing zero cents of float drift before policies are enacted.

### 3. SOX-404 Dual-Signature Policy Governance & State Machine
- **Location:** [`packages/reconciliation-core/src/cognitive-policy-registry.ts`](../packages/reconciliation-core/src/cognitive-policy-registry.ts)
- **API Routes:**
  - `POST /api/v1/cognitive/policy/propose`: Proposes candidate self-healing rule with bounded parameters.
  - `POST /api/v1/cognitive/policy/approve`: Dual-signature approval. Enforces invariant that **Checker identity $\neq$ Proposer identity**; generates immutable SHA-256 policy freeze certificate (`0x...`).
  - `GET /api/v1/cognitive/policy/registry`: Lists active and proposed tenant policies.
- **Functionality:**
  - State machine transitions: `proposed` $\rightarrow$ `controller_approved` $\rightarrow$ `active` / `rejected`.
  - Hard bounds: Window multipliers capped at 7 days; delta tolerance capped at 50 cents.
  - Generates immutable cryptographic certificate hash linking tenant, proposer, checker, and rule payload.

### 4. Zero-Knowledge Conversational Auditor OS & Proofpacks
- **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts) & [`crates/settler-verify-wasm`](../crates/settler-verify-wasm)
- **API Route:** `POST /api/v1/cognitive/audit`
- **Functionality:**
  - Translates natural language inquiries into multi-run Merkle traversals.
  - Replaces traditional statistical sampling with **100% complete census verification** (zero sampling error).
  - Emits a Big-4 audit memorandum, SHA-256 Merkle root hash, and a self-contained browser script invoking Settler's WebAssembly verification engine.

### 5. Live In-Browser Zero-Trust Proofpack Verifier Studio
- **Location:** [`packages/web/src/components/cognitive/zero-trust-verifier.tsx`](../packages/web/src/components/cognitive/zero-trust-verifier.tsx)
- **Console Route:** Embedded in `/cognitive` Operator Console under Auditor OS tab.
- **Functionality:**
  - Zero server network calls (air-gap capable).
  - Verifies leaf hashes and Merkle tree roots client-side in under 2ms using the Web Crypto API (`crypto.subtle.digest("SHA-256", ...)`).
  - Instant presets for valid settlement runs and adversarial tampered leaf detection.

### 6. Staged Multimodal Reconciliation Pipeline
- **Location:** [`packages/reconciliation-core/src/batch-settlement-engine.ts`](../packages/reconciliation-core/src/batch-settlement-engine.ts)
- **API Route:** `POST /api/v1/cognitive/reconcile-staged`
- **Functionality:**
  - Bridges extracted raw statement items directly into deterministic batch settlement decomposition.
  - Computes net sales, refund volumes, fee slippage, and RFC 6962 Merkle root state.
  - Injects verifiable audit log events (`cognitive_staged_reconciliation_executed`).

### 7. Metamorphic & Cognitive Adversarial CI Fuzzer
- **Location:** [`packages/cli/src/commands/foundry.ts`](../packages/cli/src/commands/foundry.ts)
- **CI Script:** `pnpm run verify:foundry:adversarial`
- **Functionality:**
  - Generates synthetic adversarial vectors attacking sub-cent rounding, clearing lag, and replay nonces.
  - Evaluates engine resilience, asserting 100% defense rate, automated quarantine, and zero float leakage.

---

## Security Invariants

1. **Mandatory Tenant Scoping:** Every cognitive method requires a valid, non-empty `tenantId`. Cross-tenant queries are blocked at the middleware and service boundaries.
2. **Audit Logging:** Every cognitive action records an immutable audit log entry in PostgreSQL with SHA-256 payload digests.
3. **Zero-Float Drift:** All monetary arithmetic uses integer cents (`BigInt` / fixed-point), completely eliminating floating-point rounding errors.
4. **SOX-404 Maker-Checker Invariant:** Self-healing policies cannot be approved by their proposer. All approvals require distinct controller authorization.
5. **Replay Validation:** Policy changes proposed by AI must pass deterministic historical simulation before being promoted to live matching rules.
