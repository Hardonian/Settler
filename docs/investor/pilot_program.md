# Settler — Pilot Program: First 10 Customers

**Status:** Ready to Deploy
**Version:** 1.0
**Goal:** 10 paying customers within 4 months of launch

---

## Pilot Structure

### Offer

| Element                      | Detail                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Duration**                 | 60 days (2 billing cycles)                                                                                             |
| **Price**                    | $0 for first 30 days → Growth tier ($99/month) for Day 31–60                                                           |
| **Included**                 | 10,000 transactions/month, all adapters, priority email support, direct Slack access to founder                        |
| **Commitment from customer** | Must complete at least 2 full reconciliation runs, provide candid written feedback, agree to 30-minute exit interview  |
| **Commitment from Settler**  | Dedicated onboarding call (30 min), weekly check-in (15 min), 4-hour response SLA, feature priority for pilot feedback |
| **Conversion offer**         | Lock in Growth tier at $79/month (20% discount) for 12 months if converted by Day 60                                   |

### Why 60 Days

- Day 1–7: Onboarding, data source connection, first reconciliation run
- Day 8–30: Second run, exception handling, rule creation, proofpack generation
- Day 31–60: Paid tier activated. Customer has enough runs to evaluate match rate improvement and institutional memory value.
- Day 60: Exit interview. Convert or cancel. No pressure.

60 days is enough for a customer to see the compounding value (match rates improving, rules accumulating) without requiring excessive free usage.

---

## Target Pilot Customers

### Selection Criteria

| Criterion            | Requirement                                  | Reason                                                 |
| -------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Transaction volume   | 500–10,000/month                             | Enough to demonstrate value, within Growth tier limits |
| Payment processors   | 2+ (e.g., Stripe + PayPal, or Stripe + bank) | Must have multi-source reconciliation need             |
| Current process      | Spreadsheet or manual                        | Must feel the pain of current approach                 |
| Team size            | 1–5 on finance/ops                           | Decision-maker accessible, not committee-driven        |
| Industry             | B2B SaaS or e-commerce                       | Primary ICP alignment                                  |
| Willingness to share | Agrees to written feedback + exit interview  | Critical for PMF validation                            |

### Disqualification Criteria

| Criterion                                           | Why                                                        |
| --------------------------------------------------- | ---------------------------------------------------------- |
| Single data source                                  | No reconciliation need — they need reporting, not matching |
| Needs real-time matching                            | Settler is batch/periodic reconciliation, not real-time    |
| Requires regulatory compliance (SOC 2, HIPAA) TODAY | SOC 2 not yet certified — cannot promise compliance        |
| Requires on-premise deployment                      | Cloud-only at this stage                                   |
| Free tier sufficiency                               | If 100 txns/month is enough, they don't need a paid tier   |

---

## Pilot Onboarding Playbook

### Pre-Pilot (Day -7 to 0)

- [ ] Qualification call (20 min): Confirm ICP fit, current process, transaction volume, data sources
- [ ] Send pilot agreement (one-page terms: duration, pricing, commitments, data handling)
- [ ] Create workspace (tenant provisioning)
- [ ] Pre-configure adapters for their data sources (or prepare CSV import templates)

### Week 1 (Day 1–7)

- [ ] Onboarding call (30 min): Walk through console, upload first data set, run first reconciliation
- [ ] First reconciliation run completed
- [ ] Review results together: match rate, exceptions, proofpack
- [ ] Create 2–3 initial matching rules based on first-run exceptions

### Week 2 (Day 8–14)

- [ ] Second reconciliation run (customer-initiated, founder available for questions)
- [ ] 15-min check-in: What's working? What's confusing? What's missing?
- [ ] Document any feature requests or friction points

### Week 3–4 (Day 15–30)

- [ ] Customer running reconciliation independently
- [ ] Track: Are they logging in? Running reconciliations? Resolving exceptions?
- [ ] 15-min check-in: Match rate improvement visible? Rules accumulating?
- [ ] End of free period: Send billing reminder, conversion offer

### Week 5–8 (Day 31–60) — Paid

- [ ] Growth tier activated ($99/month)
- [ ] Continued 15-min weekly check-ins
- [ ] Track: Transaction volume, match rate, exception count, rules created
- [ ] Day 45: Pulse check — are they getting value? Any churn signals?

### Day 60 — Exit Interview

- [ ] 30-minute structured interview:
  1. What was your reconciliation process before Settler?
  2. How much time did you spend? How much do you spend now?
  3. What matched automatically that you expected to match?
  4. What didn't work that you expected to work?
  5. Would you recommend Settler to a peer? Why or why not?
  6. What would make you cancel?
  7. What's the #1 feature you wish we had?
  8. Can we use your feedback as a testimonial? (with approval)
- [ ] Conversion decision: Continue at $79/month (pilot rate) or cancel?
- [ ] If converting: Confirm billing, remove pilot restrictions
- [ ] If canceling: Document reasons, ask if they'd reconsider in 3 months, ensure clean data export

---

## Success Metrics

| Metric                            | Target             | Measured How                           |
| --------------------------------- | ------------------ | -------------------------------------- |
| Pilots started                    | 10                 | Count of provisioned pilot workspaces  |
| Pilots completing 2+ runs         | 8/10 (80%)         | Reconciliation run count per workspace |
| Match rate (second run vs. first) | +5–10% improvement | Automated tracking                     |
| Paid conversion (Day 60)          | 5/10 (50%)         | Billing activation                     |
| NPS at exit interview             | >40                | Survey question                        |
| Time saved (self-reported)        | >10 hours/month    | Exit interview Q2                      |
| Feature requests logged           | 3+ per pilot       | Internal tracker                       |
| Willingness to refer              | 6/10 (60%)         | Exit interview Q5                      |

## Pilot Economics

| Item                                   | Value                                  |
| -------------------------------------- | -------------------------------------- |
| Cost of 30-day free period             | $0 revenue + ~$10 infra cost per pilot |
| Cost of founder time per pilot         | ~10 hours over 60 days                 |
| Revenue per converted pilot (Year 1)   | $79 × 11 months = $869                 |
| Revenue from 5 conversions (Year 1)    | $4,345                                 |
| Total founder time for 10 pilots       | ~100 hours                             |
| Effective "CAC" per converted customer | $0 (founder time only)                 |

---

## Pilot Outreach Channels

| Channel                                                 | Approach                                                                     | Volume      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| **Founder network**                                     | Direct outreach to 1st/2nd connections running e-commerce or SaaS            | 20 contacts |
| **Twitter/X**                                           | Share "building in public" + invite early testers                            | 5 leads     |
| **Indie Hackers / HN**                                  | Show HN post, detailed product walkthrough                                   | 3 leads     |
| **Reddit** (r/smallbusiness, r/ecommerce, r/accounting) | Value-first posts about reconciliation pain                                  | 2 leads     |
| **LinkedIn**                                            | Direct messages to finance managers at target companies                      | 10 contacts |
| **Cold email**                                          | Personalized outreach to ICP-matched companies found via Crunchbase/LinkedIn | 15 contacts |

**Total outreach target:** ~55 contacts → 15 qualification calls → 10 pilots → 5 paid conversions

---

## Pilot Agreement Template (One-Page)

```
SETTLER PILOT PROGRAM AGREEMENT

Company: ___________________
Contact: ___________________
Date: ___________________

TERMS:
1. Duration: 60 days from workspace provisioning date.
2. First 30 days: Free access to Growth tier features (10,000 txns/month).
3. Days 31-60: Billed at Growth tier ($99/month).
4. If converting by Day 60: 20% discount ($79/month) locked for 12 months.

COMMITMENTS:
- Customer will complete at least 2 full reconciliation runs during the pilot.
- Customer will provide written feedback and participate in a 30-minute exit interview.
- Customer data is tenant-isolated and encrypted in transit and at rest.

TERMINATION:
- Either party may terminate at any time with 7 days notice.
- Customer data exported within 14 days of termination.
- No cancellation fees.

SIGNATURES:
Customer: ___________________  Date: ___
Settler:  ___________________  Date: ___
```
