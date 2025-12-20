# Revenue Metrics Definition

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Define key revenue metrics and how to track them

## Overview

This document defines:
- **Key metrics:** What to track and why
- **Calculation methods:** How to calculate each metric
- **Targets:** What good looks like
- **Tracking:** How to track and monitor

**Philosophy:** Metrics drive decisions, not vanity.

---

## Core Revenue Metrics

### Monthly Recurring Revenue (MRR)
**Definition:** Total monthly recurring revenue from all active subscriptions

**Calculation:**
```
MRR = Sum of all active subscription monthly fees
```

**Example:**
- 10 Starter plans ($99/month) = $990
- 2 Professional plans ($499/month) = $998
- **Total MRR:** $1,988/month

**Target:** $10K MRR within 90 days

**Tracking:** Track in Stripe, aggregate in dashboard

---

### Annual Recurring Revenue (ARR)
**Definition:** MRR × 12

**Calculation:**
```
ARR = MRR × 12
```

**Example:**
- MRR: $1,988/month
- **ARR:** $23,856/year

**Target:** $120K ARR within 12 months

**Tracking:** Calculate from MRR

---

### Customer Acquisition Cost (CAC)
**Definition:** Total sales and marketing costs / New customers acquired

**Calculation:**
```
CAC = (Sales costs + Marketing costs) / New customers
```

**Example:**
- Sales costs: $2,000
- Marketing costs: $1,000
- New customers: 10
- **CAC:** $300/customer

**Target:** CAC < $500 (for Starter plan)

**Tracking:** Track sales/marketing costs, divide by new customers

---

### Lifetime Value (LTV)
**Definition:** Average revenue per customer × Average customer lifetime

**Calculation:**
```
LTV = Average monthly revenue × Average months retained
```

**Example:**
- Average monthly revenue: $99
- Average months retained: 24
- **LTV:** $2,376

**Target:** LTV > $2,000

**Tracking:** Track average revenue, average retention period

---

### LTV:CAC Ratio
**Definition:** LTV / CAC

**Calculation:**
```
LTV:CAC = LTV / CAC
```

**Example:**
- LTV: $2,376
- CAC: $300
- **LTV:CAC:** 7.9x

**Target:** LTV:CAC > 3x

**Tracking:** Calculate from LTV and CAC

---

## Conversion Metrics

### Pilot-to-Paid Conversion Rate
**Definition:** % of pilots that convert to paid plans

**Calculation:**
```
Conversion Rate = (Pilots converted / Total pilots) × 100
```

**Example:**
- Total pilots: 30
- Pilots converted: 9
- **Conversion Rate:** 30%

**Target:** Conversion rate > 30%

**Tracking:** Track pilots, conversions in CRM

---

### Time-to-Convert
**Definition:** Average days from pilot start to conversion

**Calculation:**
```
Time-to-Convert = Sum of (Conversion date - Pilot start date) / Conversions
```

**Example:**
- Average days to convert: 18 days
- **Time-to-Convert:** 18 days

**Target:** Time-to-convert < 30 days

**Tracking:** Track pilot start dates, conversion dates

---

### First Value Rate
**Definition:** % of customers achieving first value milestone

**Calculation:**
```
First Value Rate = (Customers achieving first value / Total customers) × 100
```

**Example:**
- Total customers: 20
- Customers achieving first value: 14
- **First Value Rate:** 70%

**Target:** First value rate > 70%

**Tracking:** Track first value achievement in analytics

---

### Time-to-First-Value
**Definition:** Average days from signup to first value

**Calculation:**
```
Time-to-First-Value = Sum of (First value date - Signup date) / Customers
```

**Example:**
- Average days to first value: 3 days
- **Time-to-First-Value:** 3 days

**Target:** Time-to-first-value < 7 days

**Tracking:** Track signup dates, first value dates

---

## Churn Metrics

### Monthly Churn Rate
**Definition:** % of customers who cancel each month

**Calculation:**
```
Churn Rate = (Customers lost / Customers at start of month) × 100
```

**Example:**
- Customers at start: 100
- Customers lost: 3
- **Churn Rate:** 3%

**Target:** Churn rate < 5%

**Tracking:** Track cancellations, calculate monthly

---

### Annual Churn Rate
**Definition:** % of customers who cancel annually

**Calculation:**
```
Annual Churn Rate = Monthly Churn Rate × 12
```

**Example:**
- Monthly churn: 3%
- **Annual Churn:** 36%

**Target:** Annual churn < 30%

**Tracking:** Calculate from monthly churn

---

### Customer Retention Rate
**Definition:** % of customers retained

**Calculation:**
```
Retention Rate = 100% - Churn Rate
```

**Example:**
- Churn rate: 3%
- **Retention Rate:** 97%

**Target:** Retention rate > 95%

**Tracking:** Calculate from churn rate

---

## Growth Metrics

### New Customer Rate
**Definition:** Number of new customers per month

**Calculation:**
```
New Customer Rate = New customers in month
```

**Example:**
- New customers: 10/month
- **New Customer Rate:** 10/month

**Target:** 10+ new customers/month

**Tracking:** Track new signups, conversions

---

### Growth Rate
**Definition:** % increase in MRR month-over-month

**Calculation:**
```
Growth Rate = ((Current MRR - Previous MRR) / Previous MRR) × 100
```

**Example:**
- Previous MRR: $1,000
- Current MRR: $1,200
- **Growth Rate:** 20%

**Target:** Growth rate > 10%/month

**Tracking:** Track MRR, calculate month-over-month

---

### Net Revenue Retention (NRR)
**Definition:** % of revenue retained from existing customers

**Calculation:**
```
NRR = ((Starting MRR + Expansion - Churn) / Starting MRR) × 100
```

**Example:**
- Starting MRR: $1,000
- Expansion: $200
- Churn: $100
- **NRR:** 110%

**Target:** NRR > 100%

**Tracking:** Track MRR changes, expansions, churn

---

## Usage Metrics

### Average Usage per Customer
**Definition:** Average reconciliations/receipts per customer per month

**Calculation:**
```
Average Usage = Total usage / Active customers
```

**Example:**
- Total reconciliations: 500K
- Active customers: 50
- **Average Usage:** 10K reconciliations/customer/month

**Target:** Track usage, identify trends

**Tracking:** Track usage in `usage_events` table

---

### Usage Distribution
**Definition:** Distribution of usage across customers

**Calculation:**
```
Usage Distribution = Customers by usage tier
```

**Example:**
- Low usage (<50% of limit): 30%
- Medium usage (50-80% of limit): 50%
- High usage (>80% of limit): 20%

**Target:** Monitor distribution, identify upgrade opportunities

**Tracking:** Track usage per customer, categorize

---

## Margin Metrics

### Gross Margin
**Definition:** % of revenue after cost of goods sold

**Calculation:**
```
Gross Margin = ((Revenue - COGS) / Revenue) × 100
```

**Example:**
- Revenue: $1,000
- COGS: $300
- **Gross Margin:** 70%

**Target:** Gross margin > 70%

**Tracking:** Track revenue, infrastructure costs

---

### Contribution Margin
**Definition:** % of revenue after variable costs

**Calculation:**
```
Contribution Margin = ((Revenue - Variable Costs) / Revenue) × 100
```

**Example:**
- Revenue: $1,000
- Variable costs: $200
- **Contribution Margin:** 80%

**Target:** Contribution margin > 80%

**Tracking:** Track revenue, variable costs (support, infrastructure)

---

## Tracking & Reporting

### Daily Metrics
- New signups
- New conversions
- Churn events
- Usage (reconciliations, receipts)

### Weekly Metrics
- MRR
- Conversion rate
- Churn rate
- First value rate

### Monthly Metrics
- ARR
- CAC
- LTV
- LTV:CAC
- Growth rate
- NRR
- Gross margin
- Contribution margin

---

## Dashboard Requirements

### Revenue Dashboard
- MRR trend
- ARR trend
- New customers
- Churn rate
- Conversion rate

### Customer Dashboard
- Active customers
- Pilot customers
- Churned customers
- Customer health scores

### Usage Dashboard
- Total usage
- Usage per customer
- Usage distribution
- Upgrade opportunities

---

## Related Documents

- `/docs/REVENUE_METRICS.md` - Detailed revenue metrics
- `/kits/revenue-ops/ACTIVATION_FUNNEL.md` - Activation funnel
- `/kits/revenue-ops/PILOT_TO_PAID_CONVERSION_TRACKER.md` - Conversion tracker
