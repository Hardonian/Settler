# Customer Onboarding Playbook

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This playbook covers customer onboarding from signup to first value. The goal: get customers to experience value as quickly as possible.

**Target: Time to First Value < 7 days**

---

## Onboarding Phases

### Phase 1: Day 0 — Welcome

**Goal:** First login, account configured

**Day 0 Email (Trial)**

```
Subject: Welcome to Settler - Let's Get Started

Hi [First Name],

Welcome to Settler! You're ready to automate reconciliation.

**Quick Start (5 minutes):**
1. Log in: [URL]
2. Connect Stripe: [URL]
3. Run your first reconciliation

**Need Help?**
- Docs: [URL]
- Support: [EMAIL]

Let's automate your reconciliation!
```

**Day 0 Actions:**

- [ ] Send welcome email
- [ ] Verify account created
- [ ] Check integration status
- [ ] Prepare onboarding call (if Enterprise)

---

### Phase 2: Day 1-3 — First Integration

**Goal:** First integration connected

**Day 2 Email**

```
Subject: How's Your First Reconciliation Going?

Hi [First Name],

Quick check-in! Have you connected your first platform?

**Most Popular Integrations:**
- Stripe (most common)
- Shopify
- QuickBooks
- PayPal

Need help connecting? I'm here: [EMAIL]

Best,
[Name]
```

**Day 3 Actions:**

- [ ] Verify first integration
- [ ] Check if run first reconciliation
- [ ] Send Day 2 email (if no activity)
- [ ] Schedule call if needed

---

### Phase 3: Day 4-7 — First Value

**Goal:** Experience meaningful value

**Day 7 Email**

```
Subject: You're Ready for More

Hi [First Name],

Great progress! You've completed [X] reconciliations with [X]% match rate.

**What's Next:**
- Try multi-platform reconciliation
- Set up scheduled jobs
- Explore advanced matching rules

[EXPLORE MORE]

Or upgrade to unlock more features:
[UPGRADE LINK]

Questions? Reply to this email.
```

**Day 7 Actions:**

- [ ] Review usage data
- [ ] Verify meaningful value achieved
- [ ] Send Day 7 email
- [ ] Schedule success call (if Enterprise)

---

### Phase 4: Day 14-30 — Conversion

**Goal:** Convert trial to paid

**Day 14 Email**

```
Subject: Your Trial is Ending Soon

Hi [First Name],

Your trial ends in [X] days. Ready to continue?

**Your Stats:**
- Reconciliations: [X]
- Time saved: [X] hours
- Match rate: [X]%

**Keep Going:**
- Starter: $29/month
- Growth: $99/month

[UPGRADE NOW]

Questions? Let's chat: [CALENDAR LINK]
```

**Day 30 Actions:**

- [ ] Check conversion status
- [ ] Send Day 14/21/27/28 emails (per cadence)
- [ ] Make final conversion offer
- [ ] Begin offboarding if no conversion

---

## Onboarding Metrics

| Metric                  | Target  | Minimum  |
| ----------------------- | ------- | -------- |
| Day 1 login rate        | 80%     | 60%      |
| Day 3 first integration | 50%     | 30%      |
| Day 7 first value       | 40%     | 20%      |
| Day 30 conversion       | 10%     | 5%       |
| Time to first value     | <7 days | <14 days |

---

## Enterprise Onboarding

### Week 1: Technical Setup

- [ ] Technical kickoff call
- [ ] Integration configuration
- [ ] Testing and validation
- [ ] User training

### Week 2: Pilot

- [ ] Run parallel reconciliation
- [ ] Compare Settler vs manual
- [ ] Fine-tune matching rules
- [ ] Document issues

### Week 3: Go Live

- [ ] Production cutover
- [ ] Team training
- [ ] Monitoring setup
- [ ] Success metrics defined

### Week 4: Review

- [ ] Results review
- [ ] ROI calculation
- [ ] Expansion discussion
- [ ] 30-day check-in scheduled

---

## Support Escalation

| Issue               | Response | Escalation       |
| ------------------- | -------- | ---------------- |
| Setup help          | Day 0-3  | Email, docs      |
| Integration failure | Day 1    | Email, then call |
| Matching errors     | Day 3+   | Email, priority  |
| Feature request     | Any      | Track in backlog |
| Billing issue       | Any      | Immediate        |

---

## Email Templates

All lifecycle email templates are in `/emails/lifecycle/`:

| Template             | Day | Purpose              |
| -------------------- | --- | -------------------- |
| `trial_welcome.html` | 0   | Welcome, quick start |
| `trial_day2.html`    | 2   | First value demo     |
| `trial_day7.html`    | 7   | Feature discovery    |
| `trial_day14.html`   | 14  | Success celebration  |
| `trial_day21.html`   | 21  | Missing features     |
| `trial_day27.html`   | 27  | Urgency (3 days)     |
| `trial_day28.html`   | 28  | Last chance (1 day)  |
| `trial_day29.html`   | 29  | Final reminder       |
| `trial_ended.html`   | 30  | Trial ended          |
| `paid_welcome.html`  | 0   | Welcome to paid      |

---

## Related Documents

| Document                             | Purpose             |
| ------------------------------------ | ------------------- |
| `/emails/lifecycle/`                 | Email templates     |
| `EMPLOYEE_HANDOVER.md`               | Internal onboarding |
| `../legal-commercial/PILOT_GUIDE.md` | Pilot process       |
| `../runbooks/FIRST_SALE_RUNBOOK.md`  | First sale process  |
