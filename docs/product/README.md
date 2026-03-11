# Product

## One-sentence definition

Settler is an open-source reconciliation engine that matches financial records across systems, surfaces every mismatch with full context, and produces verifiable evidence for each run.

## Category explanation

Settler sits between data ingestion tools and accounting/ERP systems. It is not a generic ETL layer and not an autonomous accounting agent: it is a reconciliation engine built for repeatable results, traceable evidence, and structured exception handling.

## Three core value propositions

1. **Verifiable evidence:** same inputs + same rules = same outputs, replayable and exportable as evidence packs.
2. **Faster exception handling:** exception queues and review workflows prevent silent drift while reducing manual triage.
3. **API and SDK integration:** API, SDK, and CLI let teams embed reconciliation into production workflows.

## AI role boundary

AI is used to assist exception triage and operator prioritization. Final reconciliation outcomes remain rule-driven and human-reviewable where required.

## Why not adjacent substitutes?

- **Not spreadsheets:** lacks scale, repeatability, and controlled audit trails.
- **Not generic ETL pipelines:** can move data but do not provide domain primitives for reconciliation decisions and evidence exports.
- **Not LLM-only automation:** probabilistic output is insufficient for financial controls without deterministic proof layers.

## Pricing explanation (canonical)

Pricing is usage and capability based: OSS core is self-hostable; hosted and enterprise tiers add governance, advanced controls, and support. See product pricing page for current plans, and keep implementation claims bounded to currently shipped features.


## Canonical links

- [Docs hub](../README.md)
- [Architecture hub](../architecture/README.md)
- [Operations hub](../operations/README.md)
- [Strategy hub](../strategy/README.md)
