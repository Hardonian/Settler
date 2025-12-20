# Margin Monitoring

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Monitor margins and ensure profitability

## Overview

This document defines:
- **Margin metrics:** What margins to track
- **Cost drivers:** What drives costs
- **Profitability analysis:** How to analyze profitability
- **Optimization:** How to improve margins

**Philosophy:** Monitor margins, ensure profitability, optimize costs.

---

## Margin Metrics

### Gross Margin
**Definition:** % of revenue after cost of goods sold

**Calculation:**
```
Gross Margin = ((Revenue - COGS) / Revenue) × 100
```

**Components:**
- Revenue: Subscription fees
- COGS: Infrastructure costs (compute, storage, APIs)

**Target:** Gross margin > 70%

**Tracking:** Track monthly, monitor trends

---

### Contribution Margin
**Definition:** % of revenue after variable costs

**Calculation:**
```
Contribution Margin = ((Revenue - Variable Costs) / Revenue) × 100
```

**Components:**
- Revenue: Subscription fees
- Variable Costs: Support, infrastructure, APIs

**Target:** Contribution margin > 80%

**Tracking:** Track monthly, monitor trends

---

### Net Margin
**Definition:** % of revenue after all costs

**Calculation:**
```
Net Margin = ((Revenue - All Costs) / Revenue) × 100
```

**Components:**
- Revenue: Subscription fees
- All Costs: COGS, support, sales, marketing, overhead

**Target:** Net margin > 50%

**Tracking:** Track monthly, monitor trends

---

## Cost Drivers

### Infrastructure Costs
**Components:**
- Compute (servers, serverless)
- Storage (database, files)
- APIs (third-party APIs)
- Bandwidth

**Tracking:** Track by service, monitor trends

**Optimization:**
- Optimize compute usage
- Reduce storage costs
- Optimize API usage
- Reduce bandwidth

---

### Support Costs
**Components:**
- Support team time
- Support tools
- Support infrastructure

**Tracking:** Track by customer, monitor trends

**Optimization:**
- Improve self-service
- Reduce support tickets
- Automate support
- Scale support efficiently

---

### Sales Costs
**Components:**
- Sales team time
- Sales tools
- Sales infrastructure

**Tracking:** Track by customer, monitor trends

**Optimization:**
- Improve conversion rate
- Reduce sales cycle
- Automate sales
- Scale sales efficiently

---

### Marketing Costs
**Components:**
- Marketing campaigns
- Marketing tools
- Marketing infrastructure

**Tracking:** Track by channel, monitor trends

**Optimization:**
- Improve conversion rate
- Reduce CAC
- Optimize channels
- Scale marketing efficiently

---

## Profitability Analysis

### By Plan
**Analysis:** Profitability by subscription plan

**Example:**
- Starter ($99/month): 70% gross margin
- Professional ($499/month): 75% gross margin
- Enterprise (custom): 80%+ gross margin

**Action:** Focus on profitable plans, optimize unprofitable plans

---

### By Customer
**Analysis:** Profitability by customer segment

**Example:**
- High usage customers: 60% margin (high costs)
- Medium usage customers: 75% margin (optimal)
- Low usage customers: 85% margin (low costs)

**Action:** Optimize high-cost customers, encourage optimal usage

---

### By Use Case
**Analysis:** Profitability by use case

**Example:**
- E-commerce reconciliation: 75% margin
- Multi-currency reconciliation: 70% margin (higher costs)
- Receipt processing: 80% margin

**Action:** Focus on profitable use cases, optimize unprofitable use cases

---

## Margin Optimization

### Cost Optimization
**Actions:**
- Optimize infrastructure costs
- Reduce support costs
- Optimize sales costs
- Optimize marketing costs

**Metrics:**
- Cost per customer
- Cost per transaction
- Cost per reconciliation

---

### Pricing Optimization
**Actions:**
- Optimize plan pricing
- Optimize usage limits
- Optimize overage pricing
- Optimize plan features

**Metrics:**
- Revenue per customer
- Revenue per transaction
- Revenue per reconciliation

---

### Usage Optimization
**Actions:**
- Encourage optimal usage
- Discourage excessive usage
- Optimize usage patterns
- Upgrade high-usage customers

**Metrics:**
- Usage per customer
- Usage distribution
- Upgrade rate

---

## Margin Monitoring

### Daily Monitoring
- Infrastructure costs
- Support costs
- Sales costs
- Marketing costs

### Weekly Monitoring
- Gross margin
- Contribution margin
- Cost trends
- Revenue trends

### Monthly Monitoring
- Net margin
- Profitability by plan
- Profitability by customer
- Profitability by use case

---

## Margin Dashboard

### Revenue Dashboard
- MRR trend
- ARR trend
- Revenue by plan
- Revenue by customer

### Cost Dashboard
- Total costs
- Costs by category
- Cost trends
- Cost per customer

### Margin Dashboard
- Gross margin
- Contribution margin
- Net margin
- Margin trends

---

## Related Documents

- `/docs/PRICING_LOGIC.md` - Pricing logic
- `/docs/ECONOMICS.md` - Economics analysis
- `/kits/revenue-ops/METRICS_DEFINITION.md` - Metrics definition
