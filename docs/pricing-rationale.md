# Pricing Rationale

**Last Updated:** 2025-12-24  
**Status:** Investor-Grade Defensible Pricing Model

## Model: Base Plan + Metered Add-Ons

### Core Principle
- **One primary paid tier** that is immediately compelling
- **Usage-based add-ons** tied to measurable compute/storage
- **Clear upgrade paths** with minimal cognitive load

## Plan Structure

### Free Tier
- **Purpose**: Proof of concept, not free-forever trap
- **Limits**: 
  - 100 reconciliations/month (hard cap)
  - 10 receipts/month
  - 1 export/month
  - 1 connector
  - 7-day audit trail
- **Upgrade Pressure**: Clear limits force upgrade decision at ~100 reconciliations

### Starter Plan ($99/month)
- **Target**: Small businesses processing 5k-10k transactions/month
- **Volume**: 10,000 reconciliations/month included
- **Add-ons**: 
  - $0.10 per exception requiring manual review (beyond 1% exception rate)
  - Additional connectors: $20/month each (beyond 5 included)
- **Value Prop**: Automates reconciliation for ~$0.01 per transaction

### Growth Plan ($299/month)
- **Target**: Scaling businesses processing 50k-100k transactions/month
- **Volume**: 100,000 reconciliations/month included
- **Add-ons**: Same exception pricing, unlimited connectors
- **Value Prop**: Volume discount brings cost per transaction to ~$0.003

### Enterprise (Custom)
- **Target**: Large organizations with custom requirements
- **Volume**: Unlimited
- **Add-ons**: Custom pricing for exceptions, connectors, retention, SLA
- **Value Prop**: Dedicated support, custom integrations, 7-year retention

## Cost Drivers (What We Actually Pay For)

1. **Compute**: Reconciliation runs consume CPU/memory
2. **Storage**: Transaction data, audit trails, exports
3. **AI Processing**: Receipt parsing, exception explanations
4. **Support**: Response time scales with plan tier
5. **Retention**: Longer retention = more storage costs

## Enforcement Points

All limits enforced in code via `packages/web/src/lib/entitlements/index.ts`:
- Reconciliations: `UsageCounter` table tracks monthly usage
- Receipts: `ReceiptUpload` table tracks monthly usage
- Exports: `Export` table tracks monthly usage
- Connectors: `IngestionSource` table enforces count limits
- API Calls: `UsageCounter` tracks API usage

## Upgrade Triggers

1. **Volume exceeded**: User hits reconciliation limit → Upgrade prompt
2. **Feature needed**: User needs scheduled jobs → Upgrade prompt
3. **Support needed**: User needs faster support → Upgrade prompt
4. **Retention needed**: User needs longer audit trail → Upgrade prompt

## Defensibility

- **Transparent**: All limits visible in UI and enforced in code
- **Measurable**: Usage tracked in real-time, visible to user
- **Fair**: Pay for what you use, with clear base plan + add-ons
- **Scalable**: Revenue grows with customer usage, not headcount

## One-Liner

"Settler automates financial reconciliation at $0.01 per transaction, with clear limits and upgrade paths tied to actual usage."
