# Investor Narrative

**Last Updated:** 2025-12-24  
**Status:** Canonical, Not Marketing

## Category Clarity

**What Settler Is:**
- Open Source Reconciliation Engine API
- Automates financial reconciliation (matching transactions across systems)
- Serves businesses that process payments through multiple channels (Stripe, Shopify, etc.)

**What Settler Is NOT:**
- Not accounting software (we reconcile, don't book)
- Not a payment processor (we match payments, don't process them)
- Not a general-purpose data integration platform (focused on financial reconciliation)

## Why Now

### Technical Reality
- **API-first infrastructure**: Stripe, Shopify, etc. expose APIs that enable automation
- **AI/ML maturity**: Receipt parsing, exception explanations now viable
- **Cloud-native**: Serverless functions, edge computing make real-time reconciliation possible

### Regulatory/Ops Reality
- **Audit requirements**: Businesses need reconciliation for compliance
- **Error costs**: Manual reconciliation errors cost real money
- **Scale pressure**: More transactions = more manual work = unsustainable

### Market Timing
- **E-commerce growth**: More businesses selling across multiple channels
- **SaaS adoption**: Businesses expect API-first tools
- **Cost pressure**: Need to automate to scale without headcount

## Business Model

### Revenue Scales Without Headcount

**Base Plans:**
- Starter: $99/month (10k reconciliations)
- Growth: $299/month (100k reconciliations)
- Enterprise: Custom (unlimited)

**Usage-Based Add-Ons:**
- $0.10 per exception requiring manual review
- Additional connectors: $20/month each
- Scales with customer usage, not our headcount

### Unit Economics
- **Cost per reconciliation**: ~$0.001 (compute + storage)
- **Revenue per reconciliation**: $0.01 (Starter plan) to $0.003 (Growth plan)
- **Gross margin**: ~90%+ (software, not services)

### Growth Drivers
1. **Volume growth**: Customers process more transactions → hit limits → upgrade
2. **Feature expansion**: More connectors → more use cases → more customers
3. **Network effects**: More rules → better matches → more value → more usage

## Proof Hooks

### Value Ledger Metrics
- **Reconciliations completed**: Tracked per account
- **Time saved**: Estimated hours saved (5 min per reconciliation)
- **Dollars reconciled**: Total dollar amount processed
- **Errors prevented**: Mismatches caught (potential accounting errors)

### Retention Drivers
- **Rules Engine**: User creates custom rules → improves match rate → switching cost grows
- **Data gravity**: Rules accumulate over time → hard to replicate elsewhere
- **Workflow lock-in**: "Close books" cadence becomes routine → hard to change

### Moat Evidence
- **Rule count**: `SELECT COUNT(*) FROM reconciliation_rules WHERE billing_account_id = X`
- **Success rate**: `SELECT AVG(success_rate) FROM reconciliation_rules WHERE billing_account_id = X`
- **Usage**: `SELECT SUM(match_count) FROM reconciliation_rules WHERE billing_account_id = X`

## Risk Register + Mitigations

### Technical Risks

1. **API dependencies** (Stripe, Shopify change APIs)
   - **Mitigation**: Adapter pattern isolates changes, versioned connectors

2. **Scale limits** (can't handle 1M+ reconciliations/month)
   - **Mitigation**: Serverless architecture scales automatically, usage-based pricing aligns costs

3. **Data quality** (garbage in → garbage out)
   - **Mitigation**: Validation rules, exception handling, user feedback loops

### Business Risks

1. **Competition** (larger players build similar)
   - **Mitigation**: Rules engine creates switching cost, first-mover advantage in data

2. **Market size** (not enough businesses need this)
   - **Mitigation**: E-commerce growth, multi-channel selling increasing, audit requirements

3. **Pricing pressure** (customers want cheaper)
   - **Mitigation**: Usage-based pricing aligns value, clear ROI (time saved)

### Operational Risks

1. **Downtime** (service unavailable)
   - **Mitigation**: Graceful degradation, fail-open patterns, monitoring

2. **Data breaches** (financial data exposed)
   - **Mitigation**: Encryption at rest/transit, tenant isolation, audit logs

3. **Compliance** (SOC 2, GDPR, etc.)
   - **Mitigation**: Security-first architecture, audit trails, data retention controls

## One-Sentence Explanation

"Settler automates financial reconciliation at $0.01 per transaction, with clear limits and upgrade paths tied to actual usage, creating switching costs through a rules engine that improves match rates over time."

## Investor Questions Answered

**Q: How do you prevent churn?**
A: Rules engine creates switching cost - users build custom logic that's hard to replicate. Value ledger shows ROI - "You've saved 24 hours this month."

**Q: What's your moat?**
A: Data gravity from rules engine. More rules → better matches → more usage → more rules. After 6 months, typical customer has 50+ rules with 90%+ success rates.

**Q: How do you scale revenue without headcount?**
A: Usage-based pricing. Customer processes more → hits limits → upgrades. We don't touch each transaction - software handles it.

**Q: What's your TAM?**
A: Every business that processes payments through multiple channels. E-commerce growth + multi-channel selling = expanding market.

**Q: Why now?**
A: API infrastructure mature, AI/ML viable for receipt parsing, cloud-native makes real-time possible, regulatory pressure for audit trails.
