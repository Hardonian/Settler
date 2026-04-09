# Revenue Operations & Metrics

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Metrics to track revenue operations and inform decisions

## Overview

Revenue metrics help you:

- **Track progress:** Monitor revenue growth
- **Identify issues:** Spot problems early
- **Make decisions:** Data-driven decisions
- **Optimize:** Improve conversion, reduce churn

**Philosophy:** Metrics must inform decisions, not vanity.

---

## Activation Metrics

### Time-to-First-Value

**Definition:** Days from signup to first successful reconciliation

**Target:** <7 days
**Current:** [Track in analytics]

**Why It Matters:**

- Fast time-to-value = higher conversion
- Slow time-to-value = lower conversion

**Actions:**

- If >7 days: Improve onboarding, reduce setup steps
- If <7 days: Maintain, optimize further

---

### First-Value Rate

**Definition:** % of customers achieving first value

**Target:** 70%+
**Current:** [Track in analytics]

**Why It Matters:**

- High first-value rate = good product-market fit
- Low first-value rate = product issues or wrong customers

**Actions:**

- If <70%: Improve onboarding, better qualification
- If >70%: Maintain, optimize further

---

## Pilot → Paid Conversion Metrics

### Pilot Conversion Rate

**Definition:** % of pilots that convert to paid plans

**Target:** 30%+
**Current:** [Track in analytics]

**Why It Matters:**

- High conversion = good product-market fit
- Low conversion = product issues or wrong customers

**Actions:**

- If <30%: Improve pilot experience, better qualification
- If >30%: Maintain, optimize further

---

### Pilot → Paid Time-to-Convert

**Definition:** Days from pilot start to conversion

**Target:** <14 days (during pilot)
**Current:** [Track in analytics]

**Why It Matters:**

- Fast conversion = strong intent
- Slow conversion = weak intent or barriers

**Actions:**

- If >14 days: Reduce barriers, improve conversion flow
- If <14 days: Maintain, optimize further

---

## Churn Risk Signals

### Usage Decline

**Definition:** Drop in usage (reconciliations, API calls)

**Signal:** Usage drops >50% month-over-month
**Action:** Proactive outreach, understand why

---

### Engagement Decline

**Definition:** Drop in logins, Console usage

**Signal:** Logins drop >50% month-over-month
**Action:** Re-engagement campaign, check-in

---

### Support Tickets Increase

**Definition:** Increase in support tickets

**Signal:** Support tickets increase >100% month-over-month
**Action:** Investigate issues, fix problems

---

### Payment Failures

**Definition:** Failed payment attempts

**Signal:** Payment failures >5% of customers
**Action:** Payment retry, update payment method

---

## Usage vs Plan Metrics

### Usage vs Plan Limits

**Definition:** % of plan limits used

**Target:** 30-70% usage (healthy usage)
**Current:** [Track in analytics]

**Why It Matters:**

- Low usage (<30%): May downgrade or churn
- High usage (>70%): May upgrade or hit limits
- Optimal usage (30-70%): Healthy, likely to continue

**Actions:**

- If <30%: Re-engagement, show value
- If >70%: Upgrade prompt, prevent limit issues
- If 30-70%: Maintain, monitor

---

### Overage Usage

**Definition:** Usage exceeding plan limits

**Target:** <10% of customers
**Current:** [Track in analytics]

**Why It Matters:**

- High overage = upgrade opportunity
- Low overage = limits appropriate

**Actions:**

- If >10%: Upgrade prompts, overage pricing
- If <10%: Maintain, monitor

---

## Gross Margin Proxies

### Cost per Customer

**Definition:** Infrastructure + support costs per customer

**Target:** <30% of revenue
**Current:** [Track in analytics]

**Why It Matters:**

- Low cost = high margin
- High cost = low margin

**Actions:**

- If >30%: Optimize costs, increase prices
- If <30%: Maintain, optimize further

---

### Support Cost per Customer

**Definition:** Support costs per customer

**Target:** <10% of revenue
**Current:** [Track in analytics]

**Why It Matters:**

- Low support cost = scalable
- High support cost = not scalable

**Actions:**

- If >10%: Improve documentation, self-service
- If <10%: Maintain, optimize further

---

## Revenue Metrics Dashboard

### Key Metrics to Track

1. **MRR:** Monthly Recurring Revenue (target: $10K+ ARR)
2. **ARR:** Annual Recurring Revenue (target: $10K+)
3. **Churn Rate:** Monthly churn rate (target: <5%)
4. **LTV:** Lifetime Value (target: $1K+)
5. **CAC:** Customer Acquisition Cost (target: <$500)
6. **LTV/CAC:** Lifetime Value to CAC ratio (target: >3x)

### Weekly Review

- **Monday:** Review previous week's metrics
- **Identify:** Issues, opportunities, trends
- **Actions:** Prioritize improvements, fixes

---

## Related Documents

- `/docs/CUSTOMER_HEALTH_SIGNALS.md` - Customer health signals
- `/docs/PILOT_SUCCESS_CRITERIA.md` - Pilot success criteria
