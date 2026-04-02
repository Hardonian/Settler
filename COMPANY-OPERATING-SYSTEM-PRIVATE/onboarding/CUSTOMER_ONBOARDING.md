# Customer Onboarding Playbook

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This playbook covers the complete customer onboarding journey from signup to first value and conversion.

---

## Onboarding Timeline

| Day | Milestone      | Owner    | Action                        |
| --- | -------------- | -------- | ----------------------------- |
| 0   | Signup         | Customer | Account created               |
| 0   | Welcome        | Settler  | Welcome email sent            |
| 1-3 | Quick Start    | Customer | API key, first integration    |
| 7   | First Value    | Settler  | Check-in, success确认         |
| 14  | Gated Features | Settler  | Feature teaser                |
| 21  | Case Study     | Settler  | Social proof                  |
| 28  | Conversion     | Settler  | Trial ending, conversion push |

---

## Day 0: Signup

### Automated Welcome Sequence

1. **Signup confirmation** — Email receipt, next steps
2. **Welcome email** — Quick start guide, resources
3. **Dashboard access** — UI tour, key features highlighted

### Welcome Email Template

See `/emails/lifecycle/trial_welcome.html`

### Day 0 Resources

- Quick start guide
- Video tutorial (if available)
- API documentation
- Sample data for testing

---

## Day 1-3: Quick Start

### Quick Start Checklist

For customer:

- [ ] Get API key
- [ ] Connect first platform (Stripe recommended)
- [ ] Run first reconciliation
- [ ] Review first report
- [ ] Schedule onboarding call (optional)

### Connect First Integration Guide

**Recommended: Stripe**

1. Get Stripe API keys
2. Enter in Settler dashboard
3. Select reconciliation rules
4. Run first job
5. Review matches

### Common Day 1 Issues

| Issue                | Resolution                         |
| -------------------- | ---------------------------------- |
| Can't find API keys  | Provide Stripe docs link           |
| First match rate low | Adjust tolerance settings          |
| Dashboard confusing  | Schedule screen share              |
| API errors           | Check credentials, contact support |

---

## Day 2-3: First Value Demonstration

### At This Point, Customer Should Have

- 1+ platform connected
- 100+ transactions reconciled
- Match rate >90%
- Report generated

### Check-In Email

See `/emails/lifecycle/trial_day2.html`

### If Behind Schedule

| Situation      | Action                 |
| -------------- | ---------------------- |
| Not connected  | Re-engage, offer call  |
| Low match rate | Troubleshooting guide  |
| Not logging in | Check engagement email |

### Success Metrics

| Metric                  | Target | Good | At Risk |
| ----------------------- | ------ | ---- | ------- |
| Platforms connected     | 1+     | 2+   | 0       |
| Transactions reconciled | 100+   | 500+ | <50     |
| Match rate              | >90%   | >95% | <80%    |
| Logins in 3 days        | 3+     | 5+   | 1-2     |

---

## Day 7: Feature Introduction

### Gated Features Preview

- Advanced matching rules
- Multi-currency support
- Custom webhooks
- Scheduled jobs
- Historical reconciliation

### Day 7 Email

See `/emails/lifecycle/trial_day7.html`

### Value Confirmation

```
"By using Settler, you've saved approximately:
- X hours of manual reconciliation
- $Y in potential errors
- Z compliance reviews"
```

---

## Day 14: Success Story / Case Study

### Social Proof

- Similar customer case study
- Industry-specific results
- Measurable outcomes

### Day 14 Email

See `/emails/lifecycle/trial_day14.html`

### For High-Engagement Customers

- Schedule success call
- Identify expansion opportunities
- Discuss paid plan fit

---

## Day 21: "What You're Missing" Comparison

### Upgrade Teaser

- Advanced features coming soon
- What's available on paid plans
- Value of upgrading

### Day 21 Email

See `/emails/lifecycle/trial_day21.html`

---

## Day 27-30: Conversion Push

### Urgency Sequence

| Day | Email       | Focus            |
| --- | ----------- | ---------------- |
| 27  | Urgency     | 3 days left      |
| 28  | Last chance | 1 day left       |
| 29  | Final       | Trial ended      |
| 30  | Choose plan | Post-trial offer |

### Day 27 Email

See `/emails/lifecycle/trial_day27.html`

### Day 28 Email

See `/emails/lifecycle/trial_day28.html`

---

## Day 30: Trial Ended

### Post-Trial Options

1. Choose paid plan
2. Downgrade to Free
3. Request extension
4. Cancel

### Day 30 Email

See `/emails/lifecycle/trial_ended.html`

### Extension Requests

- Consider for technical issues (our fault)
- Decline for low engagement
- Standard extension: 7 days

---

## Onboarding Success Criteria

### Technical Success

| Metric               | Target | Measure          |
| -------------------- | ------ | ---------------- |
| API integration      | Day 1  | First API call   |
| Data connected       | Day 3  | Platform linked  |
| First reconciliation | Day 3  | Job completed    |
| Match rate           | >90%   | Report generated |

### Engagement Success

| Metric                | Target      | Measure        |
| --------------------- | ----------- | -------------- |
| Daily logins (week 1) | 3+          | Login tracking |
| Feature discovery     | 5+ features | Feature flags  |
| Report sharing        | 1+ share    | Share events   |
| Team adoption         | 2+ users    | User count     |

### Business Success

| Metric          | Target        | Measure               |
| --------------- | ------------- | --------------------- |
| Match rate      | >95%          | Reconciliation report |
| Time saved      | 1+ hours/week | User survey           |
| Error detection | 3+ found      | Exception alerts      |
| Conversion      | Paid plan     | Billing               |

---

## Onboarding Health Scoring

### Score Calculation

| Component       | Weight | Scoring     |
| --------------- | ------ | ----------- |
| Technical setup | 30%    | 0-30 points |
| Engagement      | 30%    | 0-30 points |
| Outcomes        | 40%    | 0-40 points |

### Score Thresholds

| Score  | Status     | Action                  |
| ------ | ---------- | ----------------------- |
| 80-100 | Excellent  | Nurture to conversion   |
| 60-79  | Good       | Support, encourage      |
| 40-59  | At Risk    | Re-engage, troubleshoot |
| 0-39   | Churn Risk | Intervention needed     |

---

## Low Activity Intervention

### Day 7-10 No Activity

**Email:** See `/emails/lifecycle/low_activity.html`

**Outreach:**

1. Troubleshooting email
2. Offer onboarding call
3. Send setup guide
4. Check for technical blockers

---

## Conversion Checklist

### Pre-Conversion

- [ ] All technical criteria met
- [ ] Team trained
- [ ] ROI demonstrated
- [ ] Decision maker engaged
- [ ] Pricing tier confirmed

### Conversion Actions

- [ ] Send conversion email
- [ ] Share pricing page
- [ ] Offer 17% annual discount
- [ ] Handle objections
- [ ] Process payment
- [ ] Send paid welcome email

### Post-Conversion

- [ ] Paid welcome email
- [ ] Upgrade onboarding call
- [ ] Training scheduled
- [ ] Success plan created
- [ ] Regular check-ins scheduled

---

## Related Documents

| Document                                                               | Purpose           |
| ---------------------------------------------------------------------- | ----------------- |
| `/emails/lifecycle/`                                                   | Email templates   |
| `/INVESTOR-RELATIONS-PRIVATE/business/03-customer-onboarding-success/` | CS playbooks      |
| `../legal-commercial/PILOT_GUIDE.md`                                   | Pilot process     |
| `../pricing/00_PRICING_CANONICAL.md`                                   | Pricing reference |
| `../monetization/BILLING_OPS.md`                                       | Billing setup     |
