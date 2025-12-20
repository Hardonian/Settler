# Churn Risk Signals

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Identify customers at risk of churning and take preventive action

## Overview

This document defines:
- **Risk signals:** Indicators that a customer is at risk
- **Risk levels:** Low, medium, high risk
- **Preventive actions:** What to do when risk is identified
- **Intervention playbook:** How to intervene and prevent churn

**Philosophy:** Prevent churn, don't react to it.

---

## Churn Risk Signals

### Usage-Based Signals

#### Low Usage
**Signal:** Usage <20% of plan limit

**Risk Level:** Medium

**Indicators:**
- Low reconciliation volume
- Low receipt parse volume
- Low feature flag evaluations

**Action:** Check-in, understand why usage is low, offer help

---

#### Declining Usage
**Signal:** Usage declining month-over-month

**Risk Level:** High

**Indicators:**
- Usage down 20%+ month-over-month
- Consistent decline over 2+ months
- Usage approaching zero

**Action:** Immediate check-in, understand reason, offer help or downgrade

---

#### No Usage
**Signal:** No usage for 30+ days

**Risk Level:** High

**Indicators:**
- No reconciliations in 30+ days
- No API calls in 30+ days
- Account inactive

**Action:** Immediate check-in, understand reason, offer help or cancel

---

### Engagement-Based Signals

#### Low Login Frequency
**Signal:** Logins <2 per month

**Risk Level:** Medium

**Indicators:**
- Infrequent Console access
- No recent activity
- Low engagement

**Action:** Check-in, understand why engagement is low, offer help

---

#### No Login
**Signal:** No login for 30+ days

**Risk Level:** High

**Indicators:**
- No Console access in 30+ days
- Account appears abandoned
- No response to emails

**Action:** Immediate check-in, understand reason, offer help or cancel

---

### Support-Based Signals

#### High Support Tickets
**Signal:** 3+ support tickets in 30 days

**Risk Level:** Medium

**Indicators:**
- Frequent support requests
- Recurring issues
- Frustration signals

**Action:** Proactive check-in, resolve issues, improve experience

---

#### Unresolved Issues
**Signal:** Support tickets unresolved for 7+ days

**Risk Level:** High

**Indicators:**
- Open support tickets
- Unresolved issues
- Customer frustration

**Action:** Immediate resolution, escalate if needed, follow up

---

### Payment-Based Signals

#### Payment Failure
**Signal:** Payment failed, account past due

**Risk Level:** High

**Indicators:**
- Payment declined
- Account past due
- Billing issues

**Action:** Immediate contact, resolve billing issue, prevent cancellation

---

#### Payment Retry
**Signal:** Multiple payment retries

**Risk Level:** Medium

**Indicators:**
- Payment retry attempts
- Billing issues
- Account issues

**Action:** Proactive contact, resolve billing issue, prevent cancellation

---

### Value-Based Signals

#### Low Value Realization
**Signal:** Customer not seeing value

**Risk Level:** High

**Indicators:**
- Low time savings
- Low accuracy improvement
- No ROI realized
- Negative feedback

**Action:** Immediate check-in, understand why value not realized, offer help or cancel

---

#### Wrong Use Case
**Signal:** Customer using product for wrong use case

**Risk Level:** High

**Indicators:**
- Usage patterns don't match ICP
- Low success criteria met
- Negative feedback

**Action:** Immediate check-in, understand use case, offer help or cancel

---

## Risk Level Assessment

### Low Risk
**Signals:**
- Normal usage patterns
- Regular engagement
- No support issues
- Value realized

**Action:** Monitor, maintain relationship

---

### Medium Risk
**Signals:**
- Some risk signals present
- Usage declining
- Engagement low
- Some support issues

**Action:** Proactive check-in, address issues, prevent escalation

---

### High Risk
**Signals:**
- Multiple risk signals
- Usage declining rapidly
- No engagement
- Payment issues
- Value not realized

**Action:** Immediate intervention, understand reason, prevent churn

---

## Intervention Playbook

### Low Risk Intervention
**Action:**
- Monitor usage and engagement
- Regular check-ins (monthly)
- Provide value-add content
- Maintain relationship

**Goal:** Prevent escalation to medium risk

---

### Medium Risk Intervention
**Action:**
- Proactive check-in call/email
- Understand why risk signals present
- Address issues proactively
- Offer help or solutions
- Follow up within 7 days

**Goal:** Prevent escalation to high risk

---

### High Risk Intervention
**Action:**
- Immediate check-in call/email
- Understand root cause
- Resolve issues immediately
- Offer solutions (downgrade, pause, cancel)
- Follow up within 24 hours

**Goal:** Prevent churn, save customer

---

## Intervention Scripts

### Medium Risk Check-In
**Email Template:**
```
Hi [Name],

I noticed your usage has been [declining / low] recently. Is everything okay? Are you getting value from Settler?

If you're facing any challenges or have questions, I'm here to help. Let me know if you'd like to schedule a call.

[Your Name]
```

---

### High Risk Intervention
**Email Template:**
```
Hi [Name],

I noticed [specific risk signal]. I want to make sure Settler is working well for you.

Can we schedule a quick call to discuss? I'd love to understand what's happening and see how we can help.

[Calendar Link]

[Your Name]
```

---

### Churn Prevention
**Email Template:**
```
Hi [Name],

I see you're considering cancelling. Before you go, I'd love to understand why and see if we can address any concerns.

Can we schedule a quick call? I want to make sure you're getting value from Settler.

[Calendar Link]

[Your Name]
```

---

## Churn Prevention Metrics

### Risk Signal Detection Rate
**Definition:** % of at-risk customers identified

**Target:** 90%+ detection rate

**Tracking:** Monitor risk signals, track detection rate

---

### Intervention Success Rate
**Definition:** % of interventions that prevent churn

**Target:** 50%+ success rate

**Tracking:** Track interventions, track churn prevention

---

### Churn Rate Reduction
**Definition:** Reduction in churn rate from interventions

**Target:** 20%+ reduction

**Tracking:** Track churn rate, measure improvement

---

## Related Documents

- `/docs/CUSTOMER_HEALTH_SIGNALS.md` - Customer health signals
- `/kits/customer-success/WEEKLY_CHECK-IN_TEMPLATE.md` - Check-in templates
- `/kits/revenue-ops/METRICS_DEFINITION.md` - Metrics definition
