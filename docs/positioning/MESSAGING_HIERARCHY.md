# Settler — Messaging Hierarchy

## Layer 1: Instant Recognition (< 5 seconds)

**Tagline:** Open Source Reconciliation Engine

**Hero:** Reconcile financial data across systems. Surface mismatches. Prove every result.

**Problem hook:** Stripe says one thing. Your bank says another. Your ledger says something else. Who's right?

## Layer 2: Value Comprehension (< 30 seconds)

**Three value props:**

1. Replayable reconciliation — same inputs, same rules, same results
2. Evidence-first — every run produces a verifiable proof pack
3. Rules as code — matching logic is versioned, reviewed, and tested

**Differentiation:** Unlike spreadsheets and scripts, Settler makes reconciliation repeatable, explainable, and audit-ready.

## Layer 3: Operational Understanding (< 2 minutes)

**The Settler Loop:**

```
Ingest → Reconcile → Detect → Prove → Replay
```

**Key concepts:**

- Connections: data sources (Stripe, banks, ERPs)
- Pipelines: reconciliation workflow configurations
- Runs: individual reconciliation executions (immutable, replayable)
- Evidence: audit-ready proof bundles per run

## Layer 4: Technical Depth (5+ minutes)

- Deterministic execution with fingerprinted runs
- Tenant isolation via row-level security
- Policy checks as part of run execution
- Cryptographic hashing of inputs and outputs
- Replayable evidence bundles for compliance

## Surface-Specific Guidelines

### Homepage

- Lead with problem, not technology
- Show the loop visually
- CTAs: See How It Works, Read Docs, Book a Demo
- Avoid: "control plane," "provable financial truth," "deterministic pipeline"

### README

- Lead with one-sentence positioning
- Problem → Solution → Demo path → Architecture → Docs
- Keep technical but accessible

### Docs Landing

- Orient by role: getting started, API reference, deployment, contributing
- Link to quickstart within first screen

### App Shell / Dashboard

- Operational language: runs, mismatches, evidence, review queue
- Avoid marketing language inside the product

### Error / Empty States

- Always explain what the user can do next
- Never show raw error codes without context
- Empty states should guide toward first action

## Terminology Rules

| Use                          | Avoid                                                  |
| ---------------------------- | ------------------------------------------------------ |
| engine                       | control plane                                          |
| evidence                     | provable truth                                         |
| replayable                   | deterministic (in user-facing copy)                    |
| matching rules               | reconciliation policy framework                        |
| mismatch                     | variance/discrepancy (prefer mismatch for consistency) |
| run                          | execution/pipeline run                                 |
| proof pack / evidence bundle | audit artifact                                         |
