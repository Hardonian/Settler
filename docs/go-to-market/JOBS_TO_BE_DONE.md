# Settler — Jobs To Be Done

## Core Jobs

### Job 1: Reconcile financial data across systems reliably

**When** I receive Stripe payouts, bank transactions, and ERP entries that should match,
**I want to** run a reconciliation that compares them using explicit rules,
**So that** I know immediately which records match, which don't, and why.

**Current alternatives:** Spreadsheets, SQL scripts, manual comparison, accounting tool exports
**Why they fail:** Fragile, not versioned, not reproducible, no evidence trail

---

### Job 2: Explain mismatches to auditors and stakeholders

**When** an auditor, regulator, or stakeholder asks "why does this line item differ?"
**I want to** produce evidence of exactly what data, rules, and logic produced the result,
**So that** I can answer immediately instead of spending days reconstructing what happened.

**Current alternatives:** Manual investigation, re-running scripts, searching email/Slack for context
**Why they fail:** Slow, incomplete, not trustworthy as evidence

---

### Job 3: Detect reconciliation problems before month-end

**When** a mismatch occurs between source systems,
**I want to** be notified immediately with full context,
**So that** I can resolve issues continuously instead of discovering them during close.

**Current alternatives:** Month-end manual review, batch reports, ad-hoc alerts
**Why they fail:** Too late, no context, no prioritization

---

### Job 4: Prove that reconciliation processes are controlled

**When** I need to demonstrate to auditors/regulators that reconciliation is a controlled process,
**I want to** show that rules are versioned, runs are deterministic, and evidence is generated automatically,
**So that** I can satisfy SOX controls, internal audit requirements, or regulatory inquiries.

**Current alternatives:** Process documentation, manual attestation, screenshot evidence
**Why they fail:** Static, not verifiable, not connected to actual execution

---

### Job 5: Debug reconciliation changes across releases

**When** a code change or data change causes different reconciliation results,
**I want to** replay a previous run and compare outputs,
**So that** I can isolate exactly what changed and whether the new behavior is correct.

**Current alternatives:** Diff logs, manual inspection, "it worked before" guessing
**Why they fail:** No deterministic baseline, no replay capability

---

## Supporting Jobs

### Job 6: Route mismatches to the right reviewer
Mismatches should be prioritized by risk and assigned to the appropriate team member, not dumped in a shared inbox.

### Job 7: Track exception resolution end-to-end
From detection through resolution, every mismatch should have an auditable history of who reviewed it, what they decided, and why.

### Job 8: Integrate reconciliation into existing workflows
Reconciliation runs should be triggerable via API/SDK and embeddable in CI/CD pipelines, not require a separate manual process.
