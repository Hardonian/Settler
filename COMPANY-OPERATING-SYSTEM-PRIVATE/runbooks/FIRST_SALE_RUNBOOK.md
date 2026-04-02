# First Sale Runbook

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This runbook guides the process for closing the first paid customer sale.

---

## Pre-Sale Checklist

### Before First Customer

- [ ] Stripe billing configured
- [ ] Payment methods tested
- [ ] Email templates ready
- [ ] Support process defined
- [ ] Terms of Service in place
- [ ] Privacy Policy published

### Technical Readiness

- [ ] Production environment stable
- [ ] Integration working (Stripe)
- [ ] Webhooks configured
- [ ] Monitoring in place
- [ ] Rollback plan ready

---

## First Sale Process

### Stage 1: Customer Identification

1. **Identify first customer**
   - Warm lead (network)
   - Inbound interest
   - Product Hunt launch
   - Partnership referral

2. **Initial outreach**
   - Personal outreach (founder-led)
   - Value proposition clear
   - Use case match confirmed

### Stage 2: Qualification

1. **Discovery call (30 min)**
   - Current reconciliation process
   - Pain points
   - Volume/frequency
   - Decision maker
   - Timeline

2. **Qualification criteria**
   - [ ] Clear use case
   - [ ] Budget identified
   - [ ] Decision authority
   - [ ] Realistic timeline
   - [ ] Good fit for product

### Stage 3: Demo

1. **Demo call (45-60 min)**
   - Show the problem
   - Live demo of solution
   - Use case customization
   - Q&A

2. **Demo follow-up**
   - Send recording if requested
   - Share relevant docs
   - Answer remaining questions
   - Propose next steps

### Stage 4: Proposal

1. **Send proposal**
   - Recommended tier
   - Pricing
   - Timeline
   - Next steps

2. **Proposal template**

```markdown
# Settler Proposal - [Customer Name]

## Summary

[1 paragraph about their needs and how Settler addresses them]

## Proposed Solution

- Plan: [Tier]
- Price: $[X]/month or $[X]/year
- Term: [Monthly/Annual]

## What's Included

[Brief feature list]

## Implementation Timeline

1. Week 1: Setup and integration
2. Week 2: Testing and training
3. Week 3: Go live

## Next Steps

1. Questions? [Date]
2. Decision: [Date]
3. Contract: [Date]
4. Go live: [Date]

## Terms

- Payment: Net-30
- Cancellation: 30 days
- Terms of Service apply
```

### Stage 5: Close

1. **Handle objections**
   - Price too high? → Offer annual discount
   - Need more features? → Timeline for roadmap
   - Need to think about it? → Set clear deadline

2. **Close the deal**
   - Send invoice
   - Collect payment
   - Send welcome email

3. **Post-sale handoff**
   - Notify team
   - Provision account
   - Schedule onboarding

---

## First Sale Checklist

### Pre-Sale

- [ ] Customer qualified
- [ ] Demo completed
- [ ] Questions answered
- [ ] Proposal sent
- [ ] Decision timeline set

### Close

- [ ] Customer confirmed
- [ ] Invoice sent
- [ ] Payment received
- [ ] Welcome email sent
- [ ] Account provisioned
- [ ] Onboarding scheduled

### Post-Sale

- [ ] Customer onboarded
- [ ] First value achieved
- [ ] Success criteria tracked
- [ ] Feedback collected

---

## First Sale Email Templates

### Discovery Call Invitation

```
Subject: Quick Chat About Reconciliation Automation?

Hi [Name],

I saw you're working on [company] and thought Settler might be
helpful. We automate reconciliation across Stripe, Shopify, and
50+ other platforms.

Would you have 20 minutes this week for a quick chat?

Best,
[Scott]
```

### Proposal Follow-Up

```
Subject: Settler Proposal for [Company]

Hi [Name],

Following up on our conversation. Here's the proposal we discussed:

[Attached or linked proposal]

Happy to answer any questions.

Best,
[Scott]
```

### Payment Received

```
Subject: Welcome to Settler! 🚀

Hi [Name],

Payment confirmed. You're all set!

Your account: [URL]
Quick start guide: [URL]

Let me know if you need anything.

Best,
[Scott]
```

---

## Post-First-Sale Actions

### Document Learnings

1. **What worked?**
2. **What would we do differently?**
3. **What questions did customer ask?**
4. **What objections did we face?**

### Log Decision

Log the first sale as a milestone in `../decisions/`

### Update Playbooks

Update this runbook with any improvements based on experience.

---

## Related Documents

| Document                                 | Purpose             |
| ---------------------------------------- | ------------------- |
| `FIRST_PILOT_RUNBOOK.md`                 | Pilot process       |
| `FIRST_ENTERPRISE_RUNBOOK.md`            | Enterprise process  |
| `../onboarding/CUSTOMER_ONBOARDING.md`   | Onboarding playbook |
| `../pricing/00_PRICING_CANONICAL.md`     | Pricing reference   |
| `../monetization/BILLING_OPS.md`         | Billing setup       |
| `../legal-commercial/TERMS_REFERENCE.md` | Terms reference     |
