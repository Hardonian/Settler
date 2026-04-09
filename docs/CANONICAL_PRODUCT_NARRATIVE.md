# Settler — Canonical Product Narrative

**Version:** 2.0
**Last Updated:** April 2026
**Status:** Canonical — All marketing, UI, docs, and external surfaces must align
**Owner:** Product + engineering leadership

---

## What This Document Is

This is the single source of truth for how Settler describes itself to operators, buyers, evaluators, and engineers. Every public claim, UI string, support response, and sales conversation must be consistent with this document.

If a surface contradicts this narrative, the surface is wrong. Fix the surface.

---

## Part 1: Identity

### What Settler Is

Settler is a **reconciliation-intelligence operating system** — a platform that matches financial transactions across data sources, produces verifiable evidence for every decision, preserves operator adjudication history, and makes reconciliation outcomes deterministic, replayable, and auditable.

Settler is not a dashboard. It is not a workflow automation tool. It is not an accounting system.

### One-Sentence Definition

Settler makes financial reconciliation deterministic, evidence-rich, and operationally auditable — so every matching decision can be replayed, explained, and trusted.

### 30-Second Explanation

Finance operations teams reconcile transactions across payment processors, banks, and accounting systems. This work is manual, error-prone, and produces no durable evidence. Settler replaces that with a deterministic reconciliation engine: it ingests transaction data from connected systems, applies rules-based matching with configurable tolerances, produces evidence artifacts for every decision, and gives operators a control plane for exception triage and adjudication. Every run is replayable. Every decision is auditable. Every proof can be independently verified.

### What Changes When Settler Exists

| Before Settler                                   | After Settler                                          |
| ------------------------------------------------ | ------------------------------------------------------ |
| Manual CSV matching in spreadsheets              | Deterministic engine with rules as code                |
| No evidence trail for matching decisions         | Hash-linked evidence manifests per run                 |
| Exceptions buried in email threads               | Structured exception queue with operator decisions     |
| No way to reproduce past reconciliations         | Full replay with deterministic hash verification       |
| Audit preparation is manual reconstruction       | Evidence artifacts are export-ready by default         |
| Reconciliation logic lives in spreadsheet macros | Policies are versioned, tenant-scoped, and inspectable |

---

## Part 2: Category Definition

### The Category Settler Occupies

**Reconciliation intelligence** — a category defined by:

1. Deterministic transaction matching with configurable policy
2. Evidence generation as a first-class output (not just reports)
3. Exception adjudication with operator decision memory
4. Replay capability for auditability and drift detection
5. Proof-chain integrity for compliance trust

### What Settler Is Not

| It is NOT                    | Why                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Accounting software          | Settler does not provide general ledger, chart of accounts, or financial reporting. Use QuickBooks, Xero, or NetSuite for that. |
| A payment processor          | Settler does not process payments. It reconciles payment data across systems.                                                   |
| General workflow automation  | Settler is not Zapier, Make, or n8n. It focuses exclusively on financial reconciliation with evidence semantics.                |
| A data warehouse             | Settler processes and matches data. It does not store raw source data indefinitely.                                             |
| A business intelligence tool | Settler produces reconciliation evidence, not BI dashboards.                                                                    |

### Why Comparison Tables Are Wrong

Settler optimizes for **evidence, determinism, and operator trust**. Competitors optimize for breadth, ease of use, or general automation. Feature counts are meaningless across these optimization axes.

The right evaluation question is not "how many features does it have" but "when this reconciliation is audited in 18 months, can I replay it, explain every decision, and produce verifiable proof?"

---

## Part 3: Architecture Identity

Settler is not a monolithic API. It is a layered operating system with explicit boundaries.

| Layer            | Technology                     | Purpose                                                              |
| ---------------- | ------------------------------ | -------------------------------------------------------------------- |
| Kernel           | Rust                           | Deterministic hashing, proof primitives, computational integrity     |
| Control Plane    | Node.js / Express / TypeScript | Orchestration, tenant management, API routes, policy enforcement     |
| Operator Console | Next.js                        | Visualization, exception triage, run inspection, evidence navigation |
| Ledger           | TigerBeetle                    | Immutable financial-grade transaction storage (optional)             |
| Persistence      | PostgreSQL (Supabase)          | Projections, metadata, audit logs, tenant configuration              |
| CLI              | TypeScript                     | Operator tooling, verification, foundry data generation              |

This layered architecture is not decorative. Each layer has explicit contracts, and degradation in any layer produces explicit, operator-visible state rather than silent failure.

---

## Part 4: Differentiation (Grounded)

These are claims Settler can make with implementation evidence in this repository.

### 1. Deterministic Replay

Every reconciliation run can be re-executed and verified. Replay produces deterministic hash outcomes that detect drift from the original execution.

**Evidence:** `packages/api/src/services/replay/`, `/console/replay`, `/api/v1/runs/:id/replay`

### 2. Evidence as First-Class Output

Each run produces structured evidence artifacts — not just reports, but hash-linked JSON manifests with execution provenance, policy context, and match decisions.

**Evidence:** `packages/api/src/services/evidence/`, `/api/v1/runs/:id/evidence`, `/console/proof-explorer`

### 3. Operator Exception Intelligence

Exceptions are not just error states. They carry deterministic "why" context, operator decision history, and state machine transitions (created → investigating → resolved/ignored).

**Evidence:** `/console/exceptions`, `packages/api/src/services/exceptions/`

### 4. Policy Memory

Matching rules are versioned, tenant-scoped, and inspectable. Policy changes produce impact analysis. This is not just configuration — it is institutional memory about how reconciliation decisions are made.

**Evidence:** `/console/policies`, trust explorer policy impact panel

### 5. Proof-Chain Navigation

The truth/lineage explorer lets operators trace artifacts through the execution graph — from source data through matching decisions to evidence output.

**Evidence:** `/console/proof-explorer`, `/api/v1/runs/:id/trust-explorer/*`

### 6. Tenant-Isolated Multi-Tenancy

Row-level security on all tenant-scoped tables. API middleware enforces tenant binding. Ledger partitioning by tenant. Cross-tenant data access is mechanically prevented.

**Evidence:** RLS policies in `supabase/migrations/`, `packages/api/src/middleware/`, `SECURITY_INVARIANTS.md`

### 7. Explicit Degraded States

When infrastructure dependencies are missing or misconfigured, surfaces display explicit degraded-state notices. The system never silently presents partial data as complete.

**Evidence:** Route maturity registry in `packages/web/src/lib/console/route-maturity.ts`, `OperationalRouteNotice` component

---

## Part 5: What Settler Does Not Claim

These boundaries are non-negotiable. No surface may imply these capabilities exist.

### Capability Boundaries

| Boundary               | Status                             | Detail                                                                                                                                         |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| SOC 2 Type II          | **In preparation**                 | Not certified. Do not claim certification.                                                                                                     |
| Platform adapter count | **7 verified adapters**            | Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite. Do not claim "50+" or "unlimited."                                                |
| Uptime SLA             | **Best-effort for non-Enterprise** | Target 99.5%. SLA-backed only for Enterprise tier.                                                                                             |
| Real-time matching     | **Not supported**                  | Settler uses batch/scheduled reconciliation. No real-time streaming match.                                                                     |
| 100% accuracy          | **Never claim**                    | Settler provides deterministic matching with confidence indicators. Exceptions require human review.                                           |
| AI/ML matching         | **Advisory only when configured**  | AI features are advisory, evidence-linked, and bounded. Humans retain final authority. AI is not default — it requires provider configuration. |
| HIPAA / FedRAMP        | **Not certified**                  | Do not imply healthcare or government compliance.                                                                                              |
| Public security audit  | **Not available**                  | No third-party penetration test results are published.                                                                                         |
| Customer references    | **Limited**                        | Do not claim broad adoption until public case studies exist.                                                                                   |
| Guaranteed support     | **Enterprise only**                | Non-Enterprise support is best-effort with no response time commitments.                                                                       |

### Language Rules

| Never write                        | Instead write                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| "Eliminates errors"                | "Reduces errors through deterministic matching"                                      |
| "100% accuracy"                    | "Deterministic matching with confidence indicators"                                  |
| "Never fails"                      | "Designed for reliability with explicit degraded states"                             |
| "Guaranteed uptime"                | "Target 99.5% availability (SLA-backed for Enterprise)"                              |
| "Automatically handles everything" | "Matches transactions based on configured rules; exceptions require operator review" |
| "50+ integrations"                 | "7 verified platform adapters with custom adapter support"                           |
| "AI-powered"                       | "Rules-based with optional AI advisory (when configured)"                            |
| "Enterprise-grade"                 | State specific capabilities without the umbrella claim                               |

---

## Part 6: Buyer Mental Model

### Who Should Use Settler

| Buyer Profile                                        | Why Settler Fits                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Finance ops teams processing 10K+ transactions/month | Manual reconciliation does not scale. Settler automates matching with evidence. |
| Engineering teams building financial products        | Need deterministic transaction matching with API-first integration.             |
| Compliance teams needing audit-ready evidence        | Every run produces replayable, hash-verified evidence artifacts.                |
| Teams running multi-provider payment stacks          | Need to reconcile across Stripe, PayPal, banks, and accounting systems.         |

### Who Should Not Use Settler

| Profile                                           | Why Not                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| Teams needing general workflow automation         | Use Zapier, Make, or n8n instead.                 |
| Teams needing accounting software                 | Use QuickBooks, Xero, or NetSuite.                |
| Teams processing fewer than 1K transactions/month | Manual reconciliation may be sufficient.          |
| Teams needing real-time streaming matching        | Settler uses batch reconciliation, not streaming. |

### What Remains the Operator's Responsibility

1. API credentials for connected platforms
2. Data quality in source systems
3. Matching rule configuration and tuning
4. Exception review and adjudication decisions
5. Compliance interpretation for their industry
6. Webhook delivery failure handling and retry logic
7. Monitoring reconciliation results

---

## Part 7: Procurement Calming

### What Makes Procurement Calmer

1. **Bounded claims.** Settler's trust packet explicitly states what is and is not implemented.
2. **Evidence-linked capabilities.** Every claimed capability references verifiable code, routes, or artifacts in the repository.
3. **Explicit limitations.** Known limitations, intentional boundaries, and maturity states are documented.
4. **Teardown path.** Full data export and clean removal are documented and functional.
5. **No vendor lock-in on data.** All reconciliation data, evidence, and audit logs are exportable in standard formats.

### Trust Surfaces Available

| Surface                 | Location                           | Purpose                                           |
| ----------------------- | ---------------------------------- | ------------------------------------------------- |
| Trust Packet            | `docs/trust-packet.md`             | Procurement-ready security and capability summary |
| Capability Truth Matrix | `docs/CAPABILITY_TRUTH_MATRIX.md`  | Evidence-verified capability maturity per surface |
| Security Invariants     | `SECURITY_INVARIANTS.md`           | Tenant isolation and security boundary guarantees |
| Known Limitations       | `docs/KNOWN_LIMITATIONS.md`        | Honest assessment of current boundaries           |
| Data Portability        | `DATA_PORTABILITY.md`              | Export and offboarding procedures                 |
| Teardown Guide          | `docs/getting-started/teardown.md` | Clean removal and data deletion                   |

---

## Part 8: Alignment Enforcement

### Before Publishing Any Surface

1. Does every claim have implementation evidence in this repository?
2. Are capability maturity states (mature, partial, planned) explicit?
3. Are limitations stated before features?
4. Is AI positioning bounded and advisory-only?
5. Are compliance claims restricted to what is actually certified?
6. Is pricing language tied to value outcomes, not feature counts?
7. Do empty states explain what is missing and what to do next?

### Copy Review Checklist

- [ ] No "eliminates" without qualification
- [ ] No "100%" claims
- [ ] No "guaranteed" for non-Enterprise
- [ ] No "never" claims
- [ ] No unverified platform counts
- [ ] No "AI-powered" without bounded disclosure
- [ ] All capability claims reference implementation evidence
- [ ] Degraded states are described, not hidden
