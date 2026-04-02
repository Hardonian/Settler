# First Pilot Runbook

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This runbook guides the process for conducting the first customer pilot.

---

## Pre-Pilot Checklist

### Before First Pilot

- [ ] Pilot agreement template ready
- [ ] Staging environment prepared
- [ ] Email templates prepared
- [ ] Success criteria defined
- [ ] Support process ready
- [ ] Internal tracking set up

### Technical Readiness

- [ ] Staging environment stable
- [ ] Test data available
- [ ] Integration tested
- [ ] Monitoring ready
- [ ] Logging configured

---

## First Pilot Process

### Stage 1: Prospect Qualification

1. **Identify pilot candidate**
   - Clear reconciliation need
   - Technical capability
   - Decision authority
   - Timeline fit

2. **Initial outreach**
   - Personal (founder-led)
   - Clear value proposition
   - No-pressure conversation

### Stage 2: Discovery Call

**Duration:** 30 minutes

**Agenda:**

1. **Understand (15 min)**
   - Current reconciliation process
   - Pain points and costs
   - Goals for pilot
   - Decision criteria

2. **Explain (10 min)**
   - How Settler works
   - Pilot program overview
   - Success criteria
   - Timeline

3. **Next steps (5 min)**
   - Confirm pilot fit
   - Send pilot agreement
   - Schedule kickoff

### Stage 3: Agreement

1. **Send pilot agreement**
   - Use `/LEGAL/PILOT_AGREEMENT_TEMPLATE.md`
   - Customize dates and scope
   - Review together

2. **Agreement checklist**
   - [ ] Scope defined
   - [ ] Timeline set (14 days)
   - [ ] Success criteria documented
   - [ ] Support level confirmed
   - [ ] Both parties signed

### Stage 4: Kickoff

**Day 0**

1. **Send welcome email**

```
Subject: Welcome to Your Settler Pilot!

Hi [Name],

Welcome! Here's everything you need to get started:

**Your Pilot Details:**
- Duration: 14 days (ending [DATE])
- Access: [URL]
- Success criteria: 95%+ match rate

**Getting Started:**
1. Create your account: [URL]
2. Connect Stripe: [LINK]
3. Run your first reconciliation: [LINK]

**Questions?**
Reply to this email or contact [EMAIL].

Excited to see Settler in action!

[Scott]
```

2. **Kickoff call (30 min)**
   - Welcome and introductions
   - Technical setup walkthrough
   - Success criteria review
   - Check-in schedule

### Stage 5: Pilot Execution

#### Day 3 Check-In

- Setup issues?
- Questions?
- Need help?

#### Day 7 Mid-Point Review

- Progress vs success criteria
- Technical results
- Next steps

#### Day 14 Final Review

- Results summary
- Success criteria assessment
- Conversion discussion

### Stage 6: Conversion or Close

#### If Converting

1. **Conversion proposal**
   - Recommended plan
   - Pricing
   - Timeline

2. **Contract**
   - Standard terms or MSA
   - Payment
   - Go-live

3. **Post-conversion**
   - Welcome email
   - Account upgrade
   - Full onboarding

#### If Not Converting

1. **Grace period**
   - 7 days to export data

2. **Offboarding**
   - Export assistance
   - Feedback collection
   - Keep in touch

---

## First Pilot Checklist

### Qualification

- [ ] Clear use case identified
- [ ] Technical capability confirmed
- [ ] Decision maker involved
- [ ] Timeline reasonable

### Agreement

- [ ] Pilot agreement sent
- [ ] Scope defined
- [ ] Timeline set
- [ ] Both parties signed

### Kickoff

- [ ] Welcome email sent
- [ ] Accounts provisioned
- [ ] Access credentials sent
- [ ] Kickoff call scheduled
- [ ] Success criteria confirmed

### Execution

- [ ] Day 3 check-in completed
- [ ] Day 7 review completed
- [ ] Day 14 review completed
- [ ] Results documented

### Close

- [ ] Decision received
- [ ] Contract signed (if converting)
- [ ] Offboarding complete (if not)
- [ ] Feedback collected

---

## Pilot Success Criteria

### Technical Criteria

| Metric              | Target | Minimum |
| ------------------- | ------ | ------- |
| Match rate          | >98%   | >95%    |
| Reconciliation time | <5 min | <30 min |
| Errors identified   | 5+     | 1+      |
| Integrations        | 2+     | 1+      |

### Business Criteria

| Metric           | Target   | Minimum         |
| ---------------- | -------- | --------------- |
| Time saved/week  | 5+ hours | 1 hour          |
| ROI demonstrated | Yes      | Potential       |
| Team approval    | All      | Key stakeholder |

### Engagement Criteria

| Metric                | Target | Minimum |
| --------------------- | ------ | ------- |
| Daily logins (week 1) | 5+     | 2+      |
| Team trained          | 3+     | 1+      |
| Report sharing        | Yes    | -       |

---

## Pilot Tracking

### Day-by-Day Tracking

```markdown
# Pilot Day Tracker - [Customer]

**Customer:** [Name]
**Pilot Start:** [Date]
**Pilot End:** [Date]

| Day | Activity             | Status | Notes            |
| --- | -------------------- | ------ | ---------------- |
| 1   | Account created      | ✅     |                  |
| 2   | First integration    | ✅     | Stripe connected |
| 3   | Check-in             | ✅     | Minor issues     |
| 5   | First reconciliation | ✅     | 97% match        |
| 7   | Mid-review           | ✅     | On track         |
| 10  | Technical verified   | ✅     |                  |
| 14  | Final review         | ⏳     | Scheduled        |

## Issues Logged

1. [Issue] - [Status]
2. [Issue] - [Status]

## Decision

[Pending / Converting / Declining]
```

---

## Post-Pilot Actions

### Document Learnings

1. **What worked?**
2. **What would we do differently?**
3. **What objections came up?**
4. **How can we improve pilot?**

### Update Playbooks

Update this runbook with any improvements.

### Log Decision

Log pilot program decisions in `../decisions/`

---

## Related Documents

| Document                               | Purpose             |
| -------------------------------------- | ------------------- |
| `FIRST_SALE_RUNBOOK.md`                | First sale process  |
| `FIRST_ENTERPRISE_RUNBOOK.md`          | Enterprise process  |
| `/LEGAL/PILOT_AGREEMENT_TEMPLATE.md`   | Pilot agreement     |
| `../onboarding/CUSTOMER_ONBOARDING.md` | Onboarding playbook |
| `../legal-commercial/PILOT_GUIDE.md`   | Pilot process guide |
