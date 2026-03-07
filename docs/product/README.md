# Product

## One-sentence definition

Settler is a deterministic reconciliation engine that ingests financial records, applies explicit policy-aware matching rules, and produces auditable outputs with operator-managed exceptions.

## Category explanation

Settler sits between data ingestion tools and accounting/ERP systems. It is not a generic ETL layer and not an autonomous accounting agent: it is a reconciliation and financial-controls plane built for reproducibility, evidence traceability, and high-throughput exception operations.

## Three core value propositions

1. **Deterministic evidence chain:** same inputs + same rules = same outputs, replayable and exportable.
2. **Operator leverage:** exception queues and review lifecycle prevent silent drift while reducing manual triage load.
3. **Control-plane integration:** API/SDK/CLI and policy surfaces let teams embed reconciliation into governed production workflows.

## AI role boundary

AI is used to assist exception triage and operator prioritization. Final reconciliation outcomes remain rule-driven and human-reviewable where required.

## Why not adjacent substitutes?

- **Not spreadsheets:** lacks scale, repeatability, and controlled audit trails.
- **Not generic ETL pipelines:** can move data but do not provide domain primitives for reconciliation decisions and evidence exports.
- **Not LLM-only automation:** probabilistic output is insufficient for financial controls without deterministic proof layers.

## Pricing explanation (canonical)

Pricing is usage and capability based: OSS core is self-hostable; hosted and enterprise tiers add governance, advanced controls, and support. See product pricing page for current plans, and keep implementation claims bounded to currently shipped features.
