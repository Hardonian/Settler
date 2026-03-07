# Settler — Persona Map

## Primary Personas

### 1. Engineering Lead / Backend Engineer

**Who:** Senior engineers building or maintaining financial data pipelines. Responsible for data integrity between systems.

**Pain:**
- Reconciliation logic is scattered across scripts, cron jobs, and manual processes
- When numbers don't match, debugging is manual and slow
- No test coverage or version control for reconciliation logic
- Auditors ask "why did this differ?" and the answer requires archaeology

**What Settler gives them:**
- Reconciliation as code — matching rules in version control, testable in CI
- Deterministic runs with replay — re-run any reconciliation, get identical results
- API and SDK first — trigger runs programmatically, embed in workflows
- Evidence generation — every run produces exportable proof

**Path to first value:**
1. Clone repo, run demo (`pnpm demo`)
2. See reconciliation output with mismatches and evidence
3. Define custom matching rules for their systems
4. Integrate via API/SDK into existing pipeline

**Key message:** "Reconciliation that works like your CI pipeline — versioned, testable, reproducible."

---

### 2. Finance / Operations Lead

**Who:** Controllers, ops managers, or finance team leads who reconcile Stripe payouts, bank statements, and ledger entries monthly.

**Pain:**
- Month-end close takes days because of manual reconciliation
- Mismatches are discovered late, often during audit prep
- No way to explain why numbers diverged — the spreadsheet was overwritten
- Audit responses require manual evidence collection after the fact

**What Settler gives them:**
- Automated mismatch detection — problems surface immediately, not at month-end
- Evidence bundles — audit answers are generated as part of the run, not collected afterward
- Exception workflow — mismatches route to a review queue with assignment and tracking
- Replayable runs — "what happened?" is answerable instantly

**Path to first value:**
1. See the demo walkthrough showing mismatch detection and evidence
2. Connect Stripe + bank data via adapters
3. Run first reconciliation, review mismatch queue
4. Export evidence pack for an audit scenario

**Key message:** "Stop reconciling in spreadsheets. Get answers the moment numbers don't match."

---

### 3. Compliance / Risk / Audit

**Who:** Internal audit, compliance officers, or risk managers who need to verify that financial controls are operating correctly.

**Pain:**
- Controls are implicit — no one can prove what process ran or what rules applied
- Evidence for audit is collected manually, after the fact, and often incomplete
- Run-to-run drift is undetectable — was the same process applied consistently?
- Regulatory requirements (SOX, internal controls) demand reproducible processes

**What Settler gives them:**
- Policy checks as part of run execution — controls are explicit and enforceable
- Evidence bundles with cryptographic hashes — tamper-evident proof of what happened
- Replay capability — re-run any historical reconciliation to verify consistency
- Immutable run records — results cannot be silently altered

**Path to first value:**
1. Review evidence bundle format and what it contains
2. See replay verification (same inputs → same outputs)
3. Inspect policy check configuration and enforcement
4. Evaluate evidence export for integration with audit workflows

**Key message:** "Every reconciliation run produces the evidence you need. Before the auditor asks."

---

### 4. Platform / DevTools Evaluator

**Who:** Technical decision-makers evaluating infrastructure for financial workflow correctness. Often at fintech, neobanks, or scaling startups.

**Pain:**
- Building reconciliation from scratch is expensive and error-prone
- Off-the-shelf accounting tools don't handle multi-system reconciliation well
- Need infrastructure that is self-hostable, auditable, and extensible
- Vendor lock-in risk with proprietary reconciliation platforms

**What Settler gives them:**
- Open source (Apache 2.0) — no vendor lock-in, full auditability
- Self-hostable — data stays in their infrastructure
- Extensible adapters — connect any source system
- SDK ecosystem — Go, Python, TypeScript, Ruby, Java

**Path to first value:**
1. Review architecture and engine design
2. Run demo and inspect evidence output
3. Evaluate adapter extensibility for their systems
4. Assess deployment model (self-hosted, Vercel, etc.)

**Key message:** "Open-source reconciliation infrastructure you can audit, extend, and own."

---

### 5. OSS Developer / Contributor

**Who:** Developers assessing the project for trustworthiness, contribution potential, or integration into their stack.

**Pain:**
- Is this project maintained? Is it real?
- Is the architecture sound enough to build on?
- Can I contribute without getting lost in a sprawling codebase?
- Is the community welcoming and responsive?

**What Settler gives them:**
- Clear CONTRIBUTING.md with setup, quality gates, and safe-change guidelines
- Issue templates for bugs, features, docs, and security
- Architecture documentation and engine deep-dives
- Active maintainer response and issue triage

**Path to first value:**
1. Read README, understand what Settler does
2. Run locally following quickstart
3. Check CONTRIBUTING.md and issue templates
4. Find a "good first issue" or docs improvement

**Key message:** "A well-maintained OSS project you can understand, run, and contribute to."
