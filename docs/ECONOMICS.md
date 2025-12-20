# Economics & Cost Model

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Transparent cost model and pricing economics for Settler

## Overview

This document defines Settler's cost structure, pricing model, and economic constraints. It is designed to help users understand pricing and help Settler operate sustainably.

**Philosophy:** Sustainable pricing requires understanding costs and aligning pricing with value delivery.

---

## Pricing Tiers

### Starter Plan: $99/month

**Included:**
- 100,000 reconciliations/month
- 10,000 receipt parses/month
- 1M feature flag evaluations/month
- Community support

**Overage Pricing:**
- Reconciliations: $0.01 per 1,000 over limit
- Receipt parses: $0.10 per 100 over limit
- Feature flags: $0.001 per 1,000 over limit

**Target Customer:** Small businesses, startups, individual developers

---

### Professional Plan: $499/month

**Included:**
- 1M reconciliations/month
- 100,000 receipt parses/month
- 10M feature flag evaluations/month
- Email support (24-48 hour response)

**Overage Pricing:**
- Reconciliations: $0.005 per 1,000 over limit
- Receipt parses: $0.08 per 100 over limit
- Feature flags: $0.0005 per 1,000 over limit

**Target Customer:** Growing businesses, mid-market companies

---

### Enterprise Plan: Custom Pricing

**Included:**
- Unlimited reconciliations
- Unlimited receipt parses
- Unlimited feature flag evaluations
- Dedicated support (SLA-backed)
- Custom integrations
- On-premise deployment options

**Pricing:** Custom based on usage, requirements, and support needs

**Target Customer:** Large enterprises, high-volume users

---

## Cost Drivers

### Infrastructure Costs

#### Compute (Vercel Serverless Functions)

**Cost per Reconciliation:**
- Average execution time: 500ms
- Memory: 1GB
- Cost: ~$0.00001 per reconciliation

**Cost per Receipt Parse:**
- Average execution time: 2s
- Memory: 2GB
- Cost: ~$0.00005 per receipt parse

**Cost per Feature Flag Evaluation:**
- Average execution time: 10ms
- Memory: 512MB
- Cost: ~$0.000001 per evaluation

**Monthly Baseline:** ~$500/month for infrastructure (before usage)

---

#### Database (Supabase PostgreSQL)

**Cost Structure:**
- Base plan: $25/month (up to 500MB storage)
- Storage: $0.125/GB/month
- Compute: Included in base plan

**Estimated Monthly Cost:** $100-500/month (depends on data volume)

---

#### Redis (Upstash)

**Cost Structure:**
- Free tier: 10K commands/day
- Pay-as-you-go: $0.20 per 100K commands

**Estimated Monthly Cost:** $50-200/month (depends on cache usage)

---

#### AI/ML Services (OCR, Matching)

**Cost per Receipt Parse:**
- OCR API: ~$0.01 per receipt (third-party)
- Processing: ~$0.001 per receipt (internal)

**Cost per Reconciliation:**
- Matching algorithm: ~$0.0001 per reconciliation (internal compute)
- No external AI costs for reconciliation

**Estimated Monthly Cost:** $100-1000/month (depends on receipt volume)

---

#### Storage (S3/Cloud Storage)

**Cost Structure:**
- Storage: $0.023/GB/month
- Transfer: $0.09/GB (outbound)

**Estimated Monthly Cost:** $50-200/month (depends on file storage)

---

### Support Costs

#### Community Support (Starter)

**Cost:** $0/month (community-driven)

**Coverage:** Documentation, community forums, GitHub issues

---

#### Email Support (Professional)

**Cost:** ~$50/user/month (estimated)

**Coverage:** Email support, 24-48 hour response time

---

#### Dedicated Support (Enterprise)

**Cost:** ~$500-2000/user/month (estimated)

**Coverage:** Dedicated support engineer, SLA-backed response times

---

### Operational Costs

#### Monitoring & Observability

**Cost:** ~$100/month (Sentry, monitoring tools)

---

#### Security & Compliance

**Cost:** ~$200/month (security tools, compliance audits)

---

#### Development & Maintenance

**Cost:** ~$10,000/month (engineering team, ongoing development)

**Note:** This is a fixed cost, not per-user.

---

## Unit Economics

### Starter Plan ($99/month)

**Revenue per User:** $99/month

**Cost per User:**
- Infrastructure: ~$5/month (assuming 50K reconciliations)
- Support: $0/month (community)
- **Total Cost:** ~$5/month

**Gross Margin:** ~95%

**CAC (Customer Acquisition Cost):** ~$50 (estimated)

**LTV (Lifetime Value):** ~$1,188 (12 months average)

**LTV/CAC Ratio:** ~24:1

**Churn Rate:** ~5% monthly (estimated)

---

### Professional Plan ($499/month)

**Revenue per User:** $499/month

**Cost per User:**
- Infrastructure: ~$25/month (assuming 500K reconciliations)
- Support: ~$50/month
- **Total Cost:** ~$75/month

**Gross Margin:** ~85%

**CAC:** ~$150 (estimated)

**LTV:** ~$5,988 (12 months average)

**LTV/CAC Ratio:** ~40:1

**Churn Rate:** ~3% monthly (estimated)

---

### Enterprise Plan (Custom)

**Revenue per User:** $2,000-10,000/month (estimated)

**Cost per User:**
- Infrastructure: Variable (depends on usage)
- Support: ~$500-2000/month
- **Total Cost:** Variable

**Gross Margin:** ~75-85% (depends on usage)

**CAC:** ~$5,000 (estimated)

**LTV:** ~$60,000-120,000 (12-24 months average)

**LTV/CAC Ratio:** ~12-24:1

**Churn Rate:** ~1% monthly (estimated)

---

## Abuse Prevention

### Rate Limiting

**Purpose:** Prevent abuse and ensure fair usage

**Limits:**
- API requests: 100 requests/second per API key
- Reconciliation runs: 10 concurrent runs per tenant
- Receipt uploads: 100 uploads/minute per tenant

**Enforcement:**
- Redis-backed rate limiting (falls back to in-memory)
- Automatic throttling when limits exceeded
- 429 status code returned when rate limited

---

### Quota Enforcement

**Purpose:** Prevent cost overruns and ensure sustainable operations

**Enforcement:**
- Usage tracked in real-time (best-effort)
- Quota checks before processing requests
- Graceful degradation when quotas exceeded

**Overage Handling:**
- Overage charges apply automatically
- Users notified when approaching limits
- Upgrade prompts shown when limits exceeded

---

### Cost Monitoring

**Purpose:** Track costs and prevent abuse

**Monitoring:**
- Per-tenant cost tracking
- Usage analytics and reporting
- Cost alerts for high-usage tenants

**Actions:**
- Automatic throttling for high-cost operations
- Manual review for unusual usage patterns
- Cost-based rate limiting for expensive operations

---

## Pricing Philosophy

### Value-Based Pricing

**Principle:** Price based on value delivered, not cost incurred

**Rationale:**
- Reconciliation saves time and reduces errors
- Receipt parsing automates manual data entry
- Feature flags enable faster development

**Pricing Tiers:** Aligned with usage patterns and value delivery

---

### Usage-Based Overage

**Principle:** Charge for usage beyond included limits

**Rationale:**
- Prevents abuse and ensures sustainable operations
- Aligns pricing with actual usage
- Enables flexible scaling

**Overage Pricing:** Set to cover marginal costs plus margin

---

### Transparent Pricing

**Principle:** Clear, predictable pricing with no hidden fees

**Rationale:**
- Builds trust with users
- Enables accurate budgeting
- Reduces support burden

**Pricing Structure:** Public pricing with clear overage rates

---

## Economic Constraints

### Minimum Viable Pricing

**Constraint:** Pricing must cover costs plus margin

**Current Status:** ✅ All plans profitable at current pricing

**Risk:** High infrastructure costs for high-usage tenants

**Mitigation:** Overage pricing and usage monitoring

---

### Scalability Limits

**Constraint:** Infrastructure costs scale with usage

**Current Status:** ✅ Serverless architecture enables cost-effective scaling

**Risk:** High-usage tenants may be unprofitable

**Mitigation:** Enterprise pricing and usage-based overage

---

### Support Capacity

**Constraint:** Support costs scale with user count

**Current Status:** ✅ Community support for Starter, email for Professional

**Risk:** Support costs may exceed revenue for low-tier plans

**Mitigation:** Self-service documentation and community support

---

## Cost Optimization

### Infrastructure Optimization

**Strategies:**
- Serverless architecture (pay-per-use)
- Caching to reduce database queries
- Batch processing for high-volume operations

**Impact:** Reduces infrastructure costs by ~30-50%

---

### Support Optimization

**Strategies:**
- Self-service documentation
- Community support for lower tiers
- Automated responses for common questions

**Impact:** Reduces support costs by ~50-70%

---

### Operational Optimization

**Strategies:**
- Automated monitoring and alerting
- Self-healing systems
- Efficient resource utilization

**Impact:** Reduces operational costs by ~20-30%

---

## Pricing Adjustments

### When Prices May Change

**Scenarios:**
- Infrastructure costs increase significantly
- Support costs exceed revenue
- Market conditions change

**Process:**
- 30-day notice for existing customers
- Grandfathered pricing for annual contracts
- Transparent communication about changes

---

### Price Protection

**Guarantee:** Prices locked for 12 months for annual contracts

**Rationale:**
- Enables accurate budgeting
- Builds trust with users
- Reduces churn risk

**Exception:** Infrastructure cost increases may trigger adjustments

---

## Summary

Settler's pricing is designed to be:
- ✅ **Sustainable:** Covers costs plus margin
- ✅ **Transparent:** Clear pricing with no hidden fees
- ✅ **Scalable:** Usage-based overage enables growth
- ✅ **Fair:** Value-based pricing aligned with usage

**Key Metrics:**
- Gross margin: 75-95% (depends on plan)
- LTV/CAC ratio: 12-40:1 (depends on plan)
- Churn rate: 1-5% monthly (depends on plan)

**Economic Health:** ✅ All plans profitable at current pricing

**Risk Factors:**
- High-usage tenants may be unprofitable (mitigated by overage pricing)
- Infrastructure costs may increase (mitigated by serverless architecture)
- Support costs may exceed revenue (mitigated by self-service and community support)
