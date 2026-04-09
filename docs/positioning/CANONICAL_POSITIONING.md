# Settler — Canonical Positioning

## One-Line Hero

> **Open-source engine that reconciles financial data across systems, surfaces mismatches, and proves every result.**

## Positioning Statement

Settler is the open-source reconciliation engine for engineering, finance, and operations teams who need to match records across systems (Stripe, banks, ERPs, ledgers), detect mismatches immediately, and produce verifiable evidence for every run. Unlike spreadsheets, scripts, and black-box tools, Settler makes reconciliation replayable, explainable, and audit-ready.

## Three-Bullet Value Proposition

1. **Replayable reconciliation** — Same inputs and rules always produce the same results. Replay any run to verify or debug.
2. **Evidence-first operations** — Every run generates a proof pack: what data went in, what rules applied, what matched, what didn't, and why.
3. **Rules as code** — Matching rules live in version control, go through pull requests, and run in CI. No hidden logic.

## For Who / Not For Who

### Built for

- **Engineering teams** building financial data pipelines who need deterministic, testable reconciliation
- **Finance and operations teams** who reconcile across Stripe, banks, ERPs, and ledgers and need audit-ready evidence
- **Compliance and risk teams** who need to prove that reconciliation processes are controlled, repeatable, and inspectable
- **Platform teams** evaluating infrastructure for financial workflow correctness

### Not built for

- Teams looking for a general-purpose data pipeline or ETL tool
- Teams that need real-time payment processing (Settler is post-transaction reconciliation)
- Teams with no reconciliation pain — if your current process works and is auditable, you may not need Settler

## How It Works (Plain Language)

1. **Ingest** — Pull records from your financial systems (Stripe charges, bank transactions, ERP entries, ledger lines)
2. **Reconcile** — Apply your matching rules to find agreements and mismatches across sources
3. **Detect** — Surface mismatches with full context: what didn't match, which records, what the delta is
4. **Prove** — Generate an evidence bundle for the run: inputs, rules applied, outputs, cryptographic hashes
5. **Replay** — Re-run any historical reconciliation to verify results or isolate what changed

## Technical Depth (For Engineers Who Care)

Settler's engine executes reconciliation runs as deterministic, fingerprinted operations. Each run records:

- **Input snapshot** — The exact records ingested from each source, with content hashes
- **Rule configuration** — The matching rules and tolerance thresholds applied, versioned in code
- **Execution trace** — Step-by-step record of how each record was matched, routed, or flagged
- **Output fingerprint** — A stable hash of the run output, enabling bitwise replay verification
- **Evidence bundle** — Exportable proof pack for audit, incident response, or compliance review

The engine enforces tenant isolation via row-level security. Policy checks run as part of execution, not as an afterthought. Runs are immutable once committed — you can replay them, but not silently alter results.

## Category

**Open-source reconciliation engine** — not a data pipeline, not an accounting tool, not a generic orchestrator. Settler sits in the operational layer between source systems and the teams who need to trust the numbers match.
