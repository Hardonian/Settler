# We open sourced our financial reconciliation engine

Hi r/programming,

We've spent the last year building **Settler**, an API infrastructure for financial reconciliation and evidence.

**Repo:** [Link to Repo]
**Docs:** https://settler.dev/docs

### Why?
In previous roles at fintech companies, we saw the same pattern:
1. Build a product.
2. Realize the numbers don't match the bank.
3. Panic.
4. Build a hasty "Recon Service" that scrapes CSVs and runs fragile SQL queries.
5. Spend 20% of engineering time maintaining it.

We decided to extract this problem into a standalone, robust infrastructure layer.

### Architecture
Settler is built on **Event Sourcing**. Every state change (Transaction Created, Match Attempted, Conflict Resolved) is an immutable event. This allows us to:
- Replay history to fix bugs without data loss.
- Provide a perfect audit trail for compliance (SOC2/ISO).
- Run deterministic "what-if" scenarios.

### Features
- **Reconciliation Engine**: Matches disparate data sources based on configurable heuristic rules.
- **Receipt Parsing**: Uses a specialized OCR model tuned for financial documents (receipts, invoices).
- **Convert**: A deterministic math library for currency and unit conversion, avoiding floating-point errors.

### Tech Stack
- Node.js / TypeScript
- PostgreSQL (Ledger)
- Redis (Queue)
- Edge Functions (Latency-sensitive ops)

We're looking for feedback on the SDK design and the reconciliation rules engine. Let us know what you think!
