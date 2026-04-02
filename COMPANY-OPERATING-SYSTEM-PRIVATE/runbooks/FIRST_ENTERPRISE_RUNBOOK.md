# First Enterprise Runbook

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This runbook guides the process for onboarding the first Enterprise customer.

---

## Pre-Enterprise Checklist

### Before First Enterprise

- [ ] MSA template ready
- [ ] DPA template ready
- [ ] Enterprise pricing defined
- [ ] SLA terms defined
- [ ] Security documentation ready
- [ ] SOC 2 (or roadmap)
- [ ] Enterprise support process

### Technical Readiness

- [ ] Enterprise tier provisioning ready
- [ ] SSO/SAML testing
- [ ] Custom integrations available
- [ ] Dedicated support process
- [ ] Enterprise monitoring

---

## First Enterprise Process

### Stage 1: Initial Contact

1. **Identify enterprise lead**
   - Inbound (enterprise inquiry)
   - Outbound (targeted)
   - Partnership referral

2. **Initial outreach (founder-led)**
   - Research company
   - Identify key stakeholders
   - Personalized message

### Stage 2: Discovery & Qualification

**Duration:** 1-2 weeks

**Discovery Call (60 min):**

1. **Understand (30 min)**
   - Current reconciliation setup
   - Pain points and costs
   - Requirements
   - Timeline
   - Decision process

2. **Qualification (15 min)**
   - Technical fit
   - Budget confirmed
   - Authority identified
   - Timeline realistic

3. **Position (15 min)**
   - Settler value proposition
   - Enterprise capabilities
   - How we differ from competitors

**Enterprise Qualification Matrix:**
| Criteria | Must Have | Nice to Have |
|----------|-----------|---------------|
| Volume >100K jobs/mo | ✅ | |
| Enterprise budget | ✅ | |
| Decision authority | ✅ | |
| SOC 2 requirement | | ✅ |
| Custom integrations | | ✅ |
| Dedicated support | | ✅ |

### Stage 3: Security Review

**Duration:** 2-4 weeks

1. **Customer security questionnaire**
   - Send questionnaire
   - Answer within 5 days
   - Follow up on questions

2. **Our security presentation**
   - SOC 2 report (if available)
   - Security practices
   - Data handling
   - Compliance certifications

3. **Customer assessment**
   - They review us
   - Questions answered
   - Site visit (if required)

### Stage 4: Proposal & Negotiation

**Duration:** 2-4 weeks

1. **Solution design**
   - Architecture fit
   - Integration plan
   - Implementation timeline
   - Training plan

2. **Commercial proposal**
   - Tier: Enterprise
   - Price: Custom (typically $1K-10K/month)
   - Term: 1-2 years
   - SLA: 99.99%
   - Support: Dedicated

3. **Negotiation**
   - Expect to negotiate
   - Know your limits
   - Trade, don't give

### Stage 5: Legal

**Duration:** 2-6 weeks

1. **MSA negotiation**
   - Use `/LEGAL/MSA_TEMPLATE.md`
   - Negotiate terms
   - Legal review (both sides)

2. **DPA (if EU data)**
   - Use `/LEGAL/DPA_TEMPLATE.md`
   - SCCs if needed
   - Both parties sign

3. **Final agreement**
   - All terms agreed
   - Both parties sign
   - Contracts archived

### Stage 6: Implementation

**Duration:** 2-4 weeks

**Week 1: Setup**

- [ ] Accounts provisioned
- [ ] SSO/SAML configured
- [ ] Custom integrations set up
- [ ] Team access configured
- [ ] Monitoring enabled

**Week 2: Testing**

- [ ] Parallel run
- [ ] Data validation
- [ ] Match rate verification
- [ ] User acceptance testing

**Week 3: Training**

- [ ] Admin training
- [ ] User training
- [ ] Documentation handover
- [ ] Runbook creation

**Week 4: Go Live**

- [ ] Cutover plan executed
- [ ] Monitoring in place
- [ ] Support handoff
- [ ] Success review

---

## Enterprise Checklist

### Sales

- [ ] Lead qualified
- [ ] Discovery complete
- [ ] Proposal sent
- [ ] Negotiation complete
- [ ] Contract signed

### Technical

- [ ] Environment provisioned
- [ ] SSO/SAML working
- [ ] Integrations tested
- [ ] Data migrated
- [ ] Monitoring ready

### Legal

- [ ] MSA signed
- [ ] DPA signed (if applicable)
- [ ] SOW defined (if applicable)
- [ ] Insurance verified

### Operations

- [ ] Support account created
- [ ] SLA tracking enabled
- [ ] Success manager assigned
- [ ] Regular check-ins scheduled

---

## Enterprise Success Criteria

### Technical Success

| Metric             | Target   | Measure                |
| ------------------ | -------- | ---------------------- |
| Match rate         | >98%     | Reconciliation reports |
| Integration uptime | 99.99%   | SLA monitoring         |
| Response time      | <4 hours | Support tickets        |

### Business Success

| Metric          | Target         | Measure           |
| --------------- | -------------- | ----------------- |
| Time saved      | >10 hours/week | User reports      |
| Error reduction | >50%           | Exception reports |
| Team adoption   | >80%           | Active users      |

### Relationship Success

| Metric                | Target | Measure          |
| --------------------- | ------ | ---------------- |
| NPS                   | >50    | Survey           |
| Reference willingness | Yes    | Conversation     |
| Expansion potential   | Yes    | Needs identified |

---

## Enterprise Tracking

### Deal Tracking

```markdown
# Enterprise Deal: [Customer]

**Date:** [Date]
**Stage:** [Discovery/Negotiation/Legal/Implementation]

## Deal Summary

- Company: [Name]
- ARR: $[X]
- Term: [X years]
- Close date: [Date]

## Stakeholders

| Role              | Name | Contact |
| ----------------- | ---- | ------- |
| Economic buyer    |      |         |
| Technical sponsor |      |         |
| End users         |      |         |

## Timeline

- [ ] Discovery: [Date]
- [ ] Proposal: [Date]
- [ ] Negotiation: [Date]
- [ ] Legal: [Date]
- [ ] Signature: [Date]
- [ ] Go live: [Date]

## Key Terms

- Price: $[X]
- SLA: 99.99%
- Support: Dedicated
- Integrations: [List]

## Risks

1. [Risk] - [Mitigation]

## Status Updates

[Date] - [Update]
```

---

## Post-Enterprise Actions

### Document Learnings

1. **What worked in sales?**
2. **What worked in implementation?**
3. **What would we do differently?**
4. **What should become standard process?**

### Update Playbooks

Update this runbook with improvements.

### Log Decisions

Log enterprise program decisions in `../decisions/`

---

## Related Documents

| Document                               | Purpose             |
| -------------------------------------- | ------------------- |
| `FIRST_SALE_RUNBOOK.md`                | First sale process  |
| `FIRST_PILOT_RUNBOOK.md`               | Pilot process       |
| `/LEGAL/MSA_TEMPLATE.md`               | MSA template        |
| `/LEGAL/DPA_TEMPLATE.md`               | DPA template        |
| `../legal-commercial/MSA_GUIDE.md`     | MSA process guide   |
| `../legal-commercial/DPA_GUIDE.md`     | DPA guide           |
| `../pricing/00_PRICING_CANONICAL.md`   | Enterprise pricing  |
| `../onboarding/CUSTOMER_ONBOARDING.md` | Onboarding playbook |
