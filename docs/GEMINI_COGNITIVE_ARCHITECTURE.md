# Settler Cognitive Architecture: Heuristic Proposer / Deterministic Verifier

## 1. Executive Summary

Settler pairs high-throughput heuristic and statistical statement parsing with the cryptographic rigor of Settler's **deterministic Rust kernel, Content-Addressable Storage (CAS), Sparse Merkle Trees (SMT), and zero-float-drift ledger invariants**.

In mission-critical financial infrastructure and corporate treasury management, probabilistic models cannot directly mutate or balance ledgers: any hallucination rate on an enterprise balance sheet is unacceptable. Settler resolves this fundamental tension by establishing a strict architectural boundary: **The Cognitive Layer Proposes; The Cryptographic Kernel Verifies and Enforces**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   COGNITIVE & HEURISTIC PROPOSER LAYER                      │
│                                                                             │
│  - Multi-Modal & Statement Ingestion (CAMT.053, MT940, CSV, Scanned PDFs)  │
│  - Causal DAG Exception Root-Cause Disambiguation                           │
│  - Counterfactual Policy Sandbox & Predictive Simulation                    │
│  - SOX-404 Dual-Signature Policy Promotion (Maker / Checker Separation)    │
│  - Zero-Shot Synthetic Connector Synthesis (OpenAPI / schema specs)         │
│  - Zero-Knowledge Bilateral Reconciliation Prover (ZK-Recon)                │
│  - Adversarial Metamorphic Attack Vector Fuzzer                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Proposes typed candidate actions & proofs
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SETTLER DETERMINISTIC VERIFICATION KERNEL                   │
│                                                                             │
│  - Rust Fixed-Point Math (i64 / BigInt Minor Units, Zero-Float-Drift)       │
│  - 100% Tenant Isolation (assertTenantScoped & PostgreSQL RLS)              │
│  - Sparse Merkle Tree (SMT-256) Inclusion & Non-Inclusion Proofs            │
│  - RFC 6962 SHA-256 Merkle Evidence Trees & Double-Entry Journal Sealing   │
│  - Browser Client-Side Offline Proofpack Verifier (Web Crypto API & WASM)   │
│  - Immutable SHA-256 Cryptographic Policy Certificates (0x... State Roots)  │
│  - TigerBeetle Continuous T+0 State Machine Replication                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Six Pillars of Best-in-Class Sovereign Financial Architecture

To achieve undisputed market leadership over legacy treasury platforms (BlackLine, Trintech) and modern fintech ledgers, Settler implements six architectural pillars:

### Pillar 1: Cryptographic Ledger & Audit Verifiability

- **Sparse Merkle Trees (SMT-256):** Implemented in `crates/settler-kernel/src/smt.rs`. Provides $O(256)$ cryptographic inclusion and **non-inclusion proofs**. External auditors can mathematically verify that a disputed transaction or fraudulent replayed nonce does not exist within a committed ledger state without inspecting other records.
- **Zero-Knowledge Bilateral Reconciliation (ZK-Recon):** When two enterprise counterparties reconcile intercompany or marketplace accounts, ZK-SNARK commitments prove that $\sum \text{Settled}_A - \sum \text{Settled}_B = 0$ and matching transaction sets exist without either party exposing customer PII, secret merchant volume discounts, or proprietary ledger balances.
- **RFC 3161 / Public Ledger Anchoring (OpenTimestamps):** State roots and proofpack hashes are periodically committed to cryptographic Time Stamping Authorities (TSA) and public block headers, guaranteeing third-party verifiable tamper-proof timing.

### Pillar 2: Autonomous Cognitive Loop & Causal Reasoning

- **Causal Directed Acyclic Graphs (DAGs):** Rather than simple threshold heuristics, exceptions are analyzed using causal DAGs to isolate true root causes:
  - FX spot volatility vs. processor markup spread.
  - Settlement calendar cutoff lags (weekend/holiday banking cutoffs) vs. counterparty float withholding.
  - Interchange qualification downgrades (e.g., standard vs commercial card-not-present).
- **Confidence-Tiered Autonomous Remediation Matrix:**
  - **Tier 0 ($C \ge 99.99\%$, Impact $< \$25$):** Autonomous self-balancing with zero-sum synthetic clearing adjustments and Merkle leaf tags.
  - **Tier 1 ($95\% \le C < 99.99\%$, Impact $< \$2,500$):** One-click operator proposal with pre-computed counterfactual P&L simulation.
  - **Tier 2 ($C < 95\%$ or High Value):** Escalated to SOX-404 Maker-Checker queue with causal reasoning breakdown.
- **Model Risk Management (SR 11-7 / OCC 2011-12):** Engine continuously monitors statistical feature drift across fiscal close cycles to prevent model degradation during anomalous seasonal volumes.

### Pillar 3: Continuous T+0 Streaming & Low-Latency Kernel Acceleration

- **TigerBeetle Native Bridge:** Complements scheduled batch runs with continuous micro-batch streaming over TigerBeetle's two-phase transfers (`pending` $\rightarrow$ `posted` / `voided`), scaling to **700k+ transfers/sec** with deterministic crash-safety.
- **Rust Kernel SIMD Acceleration:** Critical mathematical primitives (Levenshtein distance, Luhn ARN verification, SHA-256 Merkle leaf nodes) leverage Rust SIMD operations, allowing client-side and serverless verification of 1,000,000+ line statements in under 2 seconds.

### Pillar 4: Multi-Modal Statement Ingestion Moat

- **Layout-Aware Multi-Modal Vision:** Scanned PDF remittance advice, lockbox checks, and multi-page wire notices are parsed with **coordinate-anchored visual provenance**. Every extracted number carries an exact bounding-box polygon and image slice hash, eliminating visual hallucination.
- **Native ISO 20022 Universal Semantic Graph:** Formats such as CAMT.053, PAIN.001, PACS.008, MT940, and BAI2 are transformed into a canonical financial semantic graph preserving complete clearing references (`EndToEndId`, `UETR`, `MandateId`, `ChargeBearer`) rather than collapsing into flattened description text.

### Pillar 5: Big-4 Ready "Auditor OS" & Proofpacks

- **100% Census Cryptographic Verification:** Replaces traditional audit sampling error with complete algorithmic verification. Auditors execute offline WASM verification scripts against the company's full transaction history.
- **Self-Contained Audit Dossiers:** Generates signed AICPA / PCAOB compliant audit memorandums, complete Merkle proof paths, and offline verification bundles in single-file artifacts.

### Pillar 6: Developer & Operator Experience ("The Flight Recorder")

- **Time-Travel Replay Studio:** Interactive visual flight recorder in Next.js console allowing operators to inspect matching steps, rule evaluations, and ledger postings backward and forward in time.
- **Counterfactual Policy Sandbox ("What-If" Engine):** Simulates proposed tolerance changes, ARN activation, or healing rules against historical tenant ingestions before promoting them to production, measuring exact match rate lift and float delta down to the minor cent.

---

## 3. Mathematical Foundations & Formal Specifications

### 3.1 Sparse Merkle Tree (SMT-256) Formalism

Let $\mathcal{K} = \{0, 1\}^{256}$ be the 256-bit key space, and $\mathcal{V} = \{0, 1\}^{256}$ be the 256-bit value space.
Let $\mathcal{H}: \{0, 1\}^* \rightarrow \{0, 1\}^{256}$ be the SHA-256 cryptographic hash function.

The tree has depth $D = 256$. The default empty subtree hashes are defined recursively:
$$E_{256} = 0^{256}$$
$$E_d = \mathcal{H}(E_{d+1} \parallel E_{d+1}) \quad \text{for } d \in [0, 255]$$

For a key-value pair $(k, v)$, the leaf hash is:
$$L(k, v) = \mathcal{H}(0x00 \parallel k \parallel v)$$

An inclusion proof $\pi_{\text{inc}}(k)$ consists of sibling hashes $(s_0, s_1, \dots, s_{255})$. The verification function verifies that:
$$h_{256} = L(k, v)$$
$$h_d = \begin{cases} \mathcal{H}(h_{d+1} \parallel s_d) & \text{if } \text{bit}_d(k) = 0 \\ \mathcal{H}(s_d \parallel h_{d+1}) & \text{if } \text{bit}_d(k) = 1 \end{cases}$$
$$h_0 = \text{Root}$$

For non-inclusion proof $\pi_{\text{non}}(k)$, the leaf value is set to the empty leaf hash:
$$h_{256} = E_{256}$$
Verification evaluates to $\text{Root}$, proving that no entry exists at path $k$.

### 3.2 Zero-Knowledge Bilateral Reconciliation Relation

The ZK-Recon relation $\mathcal{R}_{\text{recon}}$ is formally defined as:
$$\mathcal{R}_{\text{recon}} = \left\{ (x, w) :
\sum_{i \in A} \text{amount}(i) = \sum_{j \in B} \text{amount}(j)
\;\land\; \forall i \in A, \exists j \in B \text{ s.t. } \text{ref}(i) = \text{ref}(j)
\;\land\; \text{Root}_A = \text{SMT}(A) \;\land\; \text{Root}_B = \text{SMT}(B) \right\}$$
where $x = (\text{Root}_A, \text{Root}_B, \text{NetBalance})$ is the public statement and $w = (A, B)$ is the private witness.

### 3.3 Counterfactual Policy Float Invariant

Let $\mathcal{T}$ be the transaction dataset. Let $M(\mathcal{T}, \mathcal{R})$ be the set of matched transaction pairs under ruleset $\mathcal{R}$.
The counterfactual net float delta $\Delta \Phi$ between proposed policy $\mathcal{R}_{\text{prop}}$ and baseline $\mathcal{R}_{\text{base}}$ is:
$$\Delta \Phi = \sum_{m \in M(\mathcal{T}, \mathcal{R}_{\text{prop}})} \text{amount}(m) - \sum_{m \in M(\mathcal{T}, \mathcal{R}_{\text{base}})} \text{amount}(m)$$
The policy sandbox enforces that $\Delta \Phi \in \mathbb{Z}$ (exact integer cents) and flags any unhedged float variance exceeding tenant-defined risk thresholds.

---

## 4. Active API Route Map

| Method | Endpoint | Description | Verification / Guard |
|---|---|---|---|
| `POST` | `/api/v1/cognitive/ingest` | Normalizes unstructured bank statements & CAMT.053 XML | Deterministic tokenization & balance check |
| `POST` | `/api/v1/cognitive/adjudicate` | Causal counterfactual exception adjudication | Self-healing candidate generation |
| `POST` | `/api/v1/cognitive/policy/propose` | Proposes candidate self-healing rule | SOX-404 bounded parameter validation |
| `POST` | `/api/v1/cognitive/policy/approve` | Controller approval of proposed policy | Enforces Proposer $\neq$ Checker; SHA-256 certificate |
| `POST` | `/api/v1/cognitive/policy/simulate` | Counterfactual policy simulation | Zero-float calculation, SOX checks, Merkle trace |
| `GET` | `/api/v1/cognitive/policy/registry` | Lists active and proposed tenant policies | 100% Tenant Isolation |
| `POST` | `/api/v1/cognitive/audit` | 100% census conversational auditor dossier | Merkle proof paths & WASM verifier |
| `POST` | `/api/v1/cognitive/reconcile-staged` | Staged multimodal batch settlement | RFC 6962 Merkle tree state sealing |

---

## 5. Security & Non-Negotiable Invariants

1. **Mandatory Tenant Scoping:** Every cognitive method requires a valid, authenticated `tenantId`. Cross-tenant queries are blocked at middleware, SQL (`assertTenantScoped()`), and entity levels.
2. **Deterministic Arithmetic:** All calculations use integer minor units (`i64` / `BigInt` cents). Zero floating-point operations are permitted in settlement and reconciliation code.
3. **SOX-404 Maker-Checker Separation:** Self-healing policies cannot be approved by their proposer. All promotions require distinct controller authorization.
4. **Immutable Evidence Sealing:** Every reconciliation run computes an RFC 6962 Merkle root and double-entry journal balance before completion.
5. **Client-Side Air-Gap Verification:** Proofpack verification must be executable entirely offline in browser WebAssembly without sending sensitive records to third-party cloud servers.
