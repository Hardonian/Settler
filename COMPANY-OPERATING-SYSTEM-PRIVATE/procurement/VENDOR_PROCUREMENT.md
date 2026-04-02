# Vendor Procurement Guide

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This guide covers vendor procurement from initial vendor selection through contract execution.

---

## Vendor Categories

| Category           | Examples              | Procurement Approach        |
| ------------------ | --------------------- | --------------------------- |
| **Infrastructure** | AWS, Supabase, Stripe | Standard terms, usage-based |
| **Tools**          | Datadog, PagerDuty    | Annual subscription         |
| **Services**       | Legal, CPA, Security  | Retainer or project         |
| **Marketing**      | Ads, agencies         | Performance-based           |
| **Operations**     | Contractors           | Project or hourly           |

---

## Procurement Process

### Stage 1: Identify Need

**Questions to Answer:**

- What problem does this solve?
- What's the expected ROI?
- Can existing tools handle this?
- Is this a strategic dependency?

**Decision Framework:**
| Need Type | Approval | Timeline |
|-----------|----------|----------|
| <$500/month | Founder | 1 week |
| $500-2K/month | Founder | 2 weeks |
| $2K-10K/month | Founder + review | 3 weeks |
| >$10K/month | Full review | 4+ weeks |

---

### Stage 2: Vendor Research

**Evaluation Criteria:**
| Criteria | Weight | Questions |
|----------|--------|-----------|
| Security | 30% | SOC 2? Data handling? |
| Reliability | 25% | Uptime track record? SLA? |
| Cost | 20% | Value for money? Hidden fees? |
| Integration | 15% | API quality? Docs? |
| Support | 10% | Response time? Quality? |

**Research Checklist:**

- [ ] Read vendor website
- [ ] Check reviews (G2, Capterra)
- [ ] Ask for customer references
- [ ] Review security documentation
- [ ] Check for vendor lock-in
- [ ] Understand pricing structure

---

### Stage 3: Security Review

See `SECURITY_ASSESSMENT.md` for full security review process.

**Quick Security Checklist:**

- [ ] SOC 2 Type II certification
- [ ] Data encryption (at rest and transit)
- [ ] Access controls
- [ ] Incident response
- [ ] Sub-processor list

**For Critical Vendors:**

- [ ] Security questionnaire
- [ ] Penetration test results
- [ ] Data Processing Addendum
- [ ] Audit rights

---

### Stage 4: Negotiation

**Negotiation Targets:**
| Item | Target | Walk-away |
|------|--------|----------|
| Price | 20% off | List price |
| Term | Monthly | 1 year minimum |
| Trial | 30 days | No trial |
| SLA | 99.9% | 99% |
| Support | Business hours | Best effort |

**Negotiation Principles:**

1. Get multiple quotes
2. Know your BATNA
3. Bundle services if possible
4. Offer annual prepayment for discount
5. Trade, don't give

---

### Stage 5: Contract

**Contract Checklist:**

- [ ] Scope of services
- [ ] Pricing and payment terms
- [ ] Term and termination
- [ ] SLA and credits
- [ ] Data handling
- [ ] Confidentiality
- [ ] Liability and indemnification
- [ ] Intellectual property

**Standard Contract Terms:**
| Item | Settler Standard |
|------|-----------------|
| Payment | Net-30 |
| Term | Monthly or 1 year |
| Termination | 30-day notice |
| SLA | Per vendor standard |
| Data | DPA if personal data |

---

### Stage 6: Onboarding

**Vendor Onboarding Checklist:**

- [ ] Contract signed
- [ ] Accounts provisioned
- [ ] Team access configured
- [ ] Billing set up
- [ ] Monitoring configured
- [ ] Runbook created
- [ ] Point of contact identified

---

## Critical Vendors

### Infrastructure Vendors

| Vendor     | Service       | Monthly Cost | Criticality |
| ---------- | ------------- | ------------ | ----------- |
| AWS        | Cloud hosting | $300-2K      | Critical    |
| Supabase   | Database      | $100-500     | Critical    |
| Stripe     | Payments      | ~3% revenue  | Critical    |
| Cloudflare | CDN/DNS       | $20-100      | High        |

### Tool Vendors

| Vendor    | Service      | Monthly Cost | Criticality |
| --------- | ------------ | ------------ | ----------- |
| Datadog   | Monitoring   | $100-500     | High        |
| PagerDuty | Alerting     | $50-100      | High        |
| SendGrid  | Email        | $50-200      | Medium      |
| GitHub    | Code hosting | $0-100       | High        |

---

## Vendor Risk Assessment

### Risk Matrix

| Vendor Risk | Indicators                                    | Mitigation                            |
| ----------- | --------------------------------------------- | ------------------------------------- |
| **High**    | Single vendor, critical data, no alternatives | Multi-vendor, backup, contract limits |
| **Medium**  | Important service, some alternatives          | Contract terms, exit plan             |
| **Low**     | Non-critical, many alternatives               | Standard monitoring                   |

### Exit Planning

| Vendor   | Exit Complexity | Exit Plan                   |
| -------- | --------------- | --------------------------- |
| AWS      | Medium          | Multi-region, containerized |
| Supabase | Medium          | Export, migrate             |
| Stripe   | High            | Careful data portability    |
| Datadog  | Low             | Alternative monitoring      |

---

## Checklist: New Vendor

### Pre-Commitment

- [ ] Need clearly defined
- [ ] Vendor researched
- [ ] Security reviewed
- [ ] Pricing negotiated
- [ ] Contract reviewed

### Commitment

- [ ] Contract signed
- [ ] Billing set up
- [ ] Access provisioned
- [ ] Team trained

### Post-Commitment

- [ ] Monitoring in place
- [ ] Runbook created
- [ ] Point of contact established
- [ ] Regular review scheduled

---

## Related Documents

| Document                                 | Purpose                  |
| ---------------------------------------- | ------------------------ |
| `SECURITY_ASSESSMENT.md`                 | Security review process  |
| `../legal-commercial/DPA_GUIDE.md`       | DPA requirements         |
| `../legal-commercial/TERMS_REFERENCE.md` | Contract terms reference |
