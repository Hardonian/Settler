# Settler × Gemini 3: Cognitive Proposer / Deterministic Verifier Architecture

## Executive Summary

Settler pairs the cognitive fluidity and multimodal reasoning of **Gemini 3** (specifically Gemini 3.8 Flash) with the cryptographic rigor of Settler's **deterministic Rust kernel, Content-Addressable Storage (CAS), and WebAssembly verifier**.

In mission-critical financial infrastructure and treasury management, probabilistic models cannot directly mutate or balance ledgers because a 0.01% hallucination rate on a $10B balance sheet is catastrophic. Settler resolves this fundamental tension by establishing a strict architectural boundary:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   GEMINI 3 COGNITIVE PERIMETER LAYER                        │
│                                                                             │
│  - 1M+ Token Multimodal Document & Unstructured Statement Ingestion         │
│  - Causal Counterfactual Exception Adjudication                             │
│  - Zero-Shot Synthetic Connector Synthesis (OpenAPI / PDF docs)             │
│  - Conversational Big-4 Auditor Copilot (Natural Language → Proof Planning) │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Proposes typed candidate actions
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SETTLER DETERMINISTIC VERIFICATION KERNEL                   │
│                                                                             │
│  - Rust Fixed-Point Math & Zero-Float-Drift Assertions                      │
│  - 100% Tenant Isolation (assertTenantScoped & PostgreSQL RLS)              │
│  - SHA-256 Merkle Evidence Trees (RFC 6962)                                 │
│  - Browser Client-Side WASM Proofpack Verifier                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Four Cognitive Pillars

### 1. Multimodal 1M+ Token Universal Ingestion
* **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts)
* **API Route:** `POST /api/v1/cognitive/ingest`
* **Functionality:**
  - Bypasses legacy, brittle OCR and custom regex scrapers.
  - Ingests raw unstructured bank statement exports, scanned remittance slips, SWIFT MT940, and CAMT.053 XML files.
  - Normalizes transactions into strictly typed `NormalizedExtractedRecord` objects with bounding-box provenance.
  - Evaluates mathematical net totals against declared statement headers, reporting exact delta breaks if any drift is detected.

### 2. Autonomous Closed-Loop Exception Adjudication
* **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts) & [`packages/reconciliation-core/src/pattern-learning-engine.ts`](../packages/reconciliation-core/src/pattern-learning-engine.ts)
* **API Route:** `POST /api/v1/cognitive/adjudicate`
* **Functionality:**
  - Performs causal counterfactual reasoning across reconciliation exceptions.
  - Distinguishes settlement calendar cutoff lags (e.g. UK bank holidays) and micro-cent FX rounding variances from fraudulent leakage.
  - Emits cryptographically bounded `SelfHealingPlan` candidates.
  - Simulates proposed plans against historical run data, guaranteeing zero cents of float drift before policies are enacted.

### 3. Zero-Knowledge Conversational Auditor OS
* **Location:** [`packages/reconciliation-core/src/gemini-cognitive-engine.ts`](../packages/reconciliation-core/src/gemini-cognitive-engine.ts) & [`crates/settler-verify-wasm`](../crates/settler-verify-wasm)
* **API Route:** `POST /api/v1/cognitive/audit`
* **Functionality:**
  - Translates natural language inquiries into multi-run Merkle traversals.
  - Replaces traditional statistical sampling (100 sample checks out of 5 million) with **100% complete census verification**.
  - Emits a Big-4 audit memorandum, SHA-256 Merkle root hash, and a self-contained browser script invoking Settler's WebAssembly verification engine.

### 4. Zero-Shot Connector Synthesizer
* **Location:** [`packages/adapters/src/gemini-adapter-synthesizer.ts`](../packages/adapters/src/gemini-adapter-synthesizer.ts)
* **API Route:** `POST /api/v1/cognitive/synthesize-adapter`
* **Functionality:**
  - Ingests raw OpenAPI v3 schemas, Postman collections, or PDF API documentation.
  - Synthesizes a fully-typed TypeScript `Connector` implementation with rate limiting, idempotent pagination, and tenant isolation.
  - Generates automated Jest test suites and mock vectors for immediate integration into CI.

---

## Security Invariants

1. **Mandatory Tenant Scoping:** Every cognitive method requires a valid, non-empty `tenantId`. Cross-tenant queries are blocked at the middleware and service boundaries.
2. **Audit Logging:** Every cognitive action records an immutable audit log entry in PostgreSQL with SHA-256 payload digests.
3. **Zero-Float Drift:** All monetary arithmetic uses integer cents (`BigInt` / fixed-point), completely eliminating floating-point rounding errors.
4. **Replay Validation:** Policy changes proposed by AI must pass deterministic historical simulation before being promoted to live matching rules.
