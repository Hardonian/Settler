# Customer Health Review

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Template for reviewing customer health

## Overview

This template helps you:

- **Assess health:** Evaluate customer health scores
- **Identify risks:** Find at-risk customers
- **Prevent churn:** Take preventive action
- **Improve retention:** Improve customer retention

**Philosophy:** Healthy customers don't churn.

---

## Customer Health Score

### Health Score Components

**Score:** 0-100 (weighted average)

**Components:**

- Usage (30%): Usage vs plan limits
- Engagement (25%): Login frequency, activity
- Value (25%): Value realized, ROI
- Support (20%): Support tickets, issues

**Health Levels:**

- **Healthy (80-100):** Low churn risk
- **At Risk (50-79):** Medium churn risk
- **Critical (<50):** High churn risk

---

## Health Score Calculation

### Usage Score (30%)

**Calculation:**

```
Usage Score = (Current Usage / Plan Limit) × 100
```

**Scoring:**

- > 80% of limit: 100 points
- 50-80% of limit: 75 points
- 20-50% of limit: 50 points
- <20% of limit: 25 points

**Example:**

- Usage: 60K/100K = 60%
- **Usage Score:** 75 points

---

### Engagement Score (25%)

**Calculation:**

```
Engagement Score = (Logins / Target Logins) × 100
```

**Scoring:**

- > 5 logins/month: 100 points
- 3-5 logins/month: 75 points
- 1-3 logins/month: 50 points
- <1 login/month: 25 points

**Example:**

- Logins: 4/month
- **Engagement Score:** 75 points

---

### Value Score (25%)

**Calculation:**

```
Value Score = (Value Realized / Expected Value) × 100
```

**Scoring:**

- > 100% of expected: 100 points
- 75-100% of expected: 75 points
- 50-75% of expected: 50 points
- <50% of expected: 25 points

**Example:**

- Value realized: 80% of expected
- **Value Score:** 75 points

---

### Support Score (20%)

**Calculation:**

```
Support Score = 100 - (Support Tickets × 10)
```

**Scoring:**

- 0 tickets: 100 points
- 1-2 tickets: 80 points
- 3-5 tickets: 60 points
- > 5 tickets: 40 points

**Example:**

- Support tickets: 2
- **Support Score:** 80 points

---

## Health Score Example

### Customer: ABC Company

**Usage Score:** 75 points (60% of limit)
**Engagement Score:** 75 points (4 logins/month)
**Value Score:** 75 points (80% of expected)
**Support Score:** 80 points (2 tickets)

**Weighted Average:**

- Usage: 75 × 30% = 22.5
- Engagement: 75 × 25% = 18.75
- Value: 75 × 25% = 18.75
- Support: 80 × 20% = 16
- **Total Health Score:** 76 (At Risk)

---

## Health Review Template

### Customer Health Summary

**Date:** YYYY-MM-DD

**Total Customers:** [X]
**Healthy Customers:** [X] ([Y]%)
**At-Risk Customers:** [X] ([Y]%)
**Critical Customers:** [X] ([Y]%)

---

### Healthy Customers ([X])

**Criteria:** Health score 80-100

**Actions:**

- Monitor health
- Maintain relationship
- Upsell opportunities
- Ask for referrals

**List:**

- Customer 1: Health score 85
- Customer 2: Health score 90
- Customer 3: Health score 82

---

### At-Risk Customers ([X])

**Criteria:** Health score 50-79

**Actions:**

- Proactive check-in
- Understand issues
- Address concerns
- Prevent escalation

**List:**

- Customer 1: Health score 65 (low usage)
- Customer 2: Health score 70 (low engagement)
- Customer 3: Health score 60 (support issues)

---

### Critical Customers ([X])

**Criteria:** Health score <50

**Actions:**

- Immediate intervention
- Understand root cause
- Resolve issues
- Prevent churn

**List:**

- Customer 1: Health score 40 (no usage)
- Customer 2: Health score 35 (payment issues)
- Customer 3: Health score 45 (value not realized)

---

## Intervention Actions

### Healthy Customers

**Actions:**

- Monthly check-in
- Value-add content
- Upsell opportunities
- Referral requests

---

### At-Risk Customers

**Actions:**

- Weekly check-in
- Understand issues
- Address concerns
- Offer help

**Email Template:**

```
Hi [Name],

I noticed [specific issue]. Is everything okay? Are you getting value from Settler?

If you're facing any challenges, I'm here to help. Let me know if you'd like to schedule a call.

[Your Name]
```

---

### Critical Customers

**Actions:**

- Immediate check-in
- Understand root cause
- Resolve issues
- Prevent churn

**Email Template:**

```
Hi [Name],

I noticed [specific issue]. I want to make sure Settler is working well for you.

Can we schedule a quick call to discuss? I'd love to understand what's happening and see how we can help.

[Calendar Link]

[Your Name]
```

---

## Health Improvement Actions

### Usage Improvement

**Actions:**

- Understand why usage is low
- Provide use case examples
- Offer help with setup
- Encourage optimal usage

---

### Engagement Improvement

**Actions:**

- Understand why engagement is low
- Provide value-add content
- Offer training/resources
- Improve onboarding

---

### Value Improvement

**Actions:**

- Understand why value not realized
- Show value metrics
- Provide use case examples
- Offer help/support

---

### Support Improvement

**Actions:**

- Resolve support issues quickly
- Improve self-service
- Provide better documentation
- Reduce support burden

---

## Related Documents

- `/docs/CUSTOMER_HEALTH_SIGNALS.md` - Customer health signals
- `/kits/revenue-ops/CHURN_RISK_SIGNALS.md` - Churn risk signals
- `/kits/customer-success/WEEKLY_CHECK-IN_TEMPLATE.md` - Check-in templates
