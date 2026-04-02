# MSA Process Guide

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## When to Use MSA

**Use MSA when:**

- Enterprise customer requests custom contract
- Multi-year commitment required
- Custom SLA terms needed
- Custom pricing negotiated
- Security review required
- Custom integrations planned

**Don't use MSA for:**

- Standard self-service sales (ToS only)
- Pilot agreements (use pilot template)

---

## MSA Process Overview

```
Discovery → Proposal → Negotiation → Legal Review → Signature → Onboarding
    ↓           ↓            ↓             ↓            ↓          ↓
  1 week     1 week       1-2 weeks     1-2 weeks   1 week    1 week
```

**Typical Timeline:** 4-8 weeks from first contact to signed MSA

---

## Stage 1: Discovery

### Objectives

1. Understand customer needs
2. Assess fit for MSA track
3. Identify custom requirements
4. Qualify budget authority

### Discovery Questions

- What volume of transactions?
- How many entities?
- What integrations needed?
- What SLAs are required?
- What compliance requirements?
- Decision timeline?
- Budget authority?

### Output

- Customer qualification score
- Initial pricing estimate
- Custom requirements list
- Decision timeline

---

## Stage 2: Proposal

### Components

1. **Solution overview** — How Settler addresses their needs
2. **Pricing** — Based on requirements
3. **Timeline** — Implementation and commitment
4. **Terms summary** — Key commercial terms
5. **Next steps** — Process explanation

### Pricing Guidelines

See `../pricing/00_PRICING_CANONICAL.md` for baseline.

**Enterprise Pricing Formula:**

```
Base: $1,000-10,000/month (based on volume)
+ Custom integrations: $500-5,000 (one-time)
+ Dedicated support: $500-2,000/month
+ Custom SLAs: Included
= Total Enterprise ACV
```

### Proposal Template

```markdown
# Enterprise Proposal

**Customer:** [Name]
**Date:** [Date]
**Validity:** 30 days

## Proposed Solution

[Customized description]

## Pricing

| Component           | Price   |
| ------------------- | ------- |
| Base platform       | $X/mo   |
| Custom integrations | $X      |
| Dedicated support   | $X/mo   |
| Training            | $X      |
| **Annual Total**    | **$XX** |

## Term

- 1 year with automatic renewal
- Net-30 payment terms

## Next Steps

1. Legal review (2 weeks)
2. Contract negotiation (1-2 weeks)
3. Signature
4. Onboarding begins
```

---

## Stage 3: Negotiation

### Common Negotiation Points

| Customer Request    | Standard Response  | Acceptable Range      |
| ------------------- | ------------------ | --------------------- |
| Multi-year discount | 10% for 2 years    | 10-15%                |
| Net-60 terms        | Net-30 standard    | Net-45 max            |
| Lower liability cap | 12 months standard | 6-24 months           |
| Custom SLA          | 99.99% standard    | 99.9-99.999%          |
| Training included   | Available extra    | Up to 3 days included |

### Negotiation Principles

1. **Trade, don't give** — Every concession has a cost
2. **Know your limits** — Non-negotiables defined below
3. **Document everything** — Verbal agreements must be written

### Non-Negotiables

- Liability cap cannot be removed
- Governing law is Delaware
- SOC 2 compliance requirements
- Data privacy protections

---

## Stage 4: Legal Review

### Review Requirements

1. **Founder review** — All custom terms
2. **Legal counsel** — Liability changes, IP terms, unusual requests
3. **Customer legal** — Their redlines

### Common Redlines

| Customer Redline     | Settler Position | Resolution                  |
| -------------------- | ---------------- | --------------------------- |
| Remove liability cap | Reject           | Cap at 12 months            |
| Add audit rights     | Negotiate        | Annual audit, 30-day notice |
| Change governing law | Reject           | Delaware or mutual          |
| Remove IP carveout   | Reject           | Maintain IP protections     |
| Unlimited support    | Reject           | Tiered support              |

### Review Timeline

- Initial review: 3-5 business days
- Counter-review: 2-3 business days
- Final approval: 1-2 business days

---

## Stage 5: Signature

### Pre-Signature Checklist

- [ ] All terms agreed
- [ ] Pricing confirmed
- [ ] Legal counsel approved
- [ ] Insurance in place
- [ ] Order form complete
- [ ] Signatures arranged

### Signature Process

1. Clean version to both parties
2. CEO/Founder signature
3. Customer signature
4. Exchange fully executed copies
5. Archive in `/contracts/enterprise/`

---

## Stage 6: Onboarding

### Post-Signature Steps

1. **Notify team** — Sales, engineering, support
2. **Create account** — Enterprise tier provisioning
3. **Set up billing** — Custom invoice schedule
4. **Kickoff meeting** — Timeline and contacts
5. **Implementation plan** — Technical onboarding

### Handoff to Customer Success

- Contract summary
- Customer contacts
- Special terms
- SLA start date
- Support tier

---

## Enterprise Deal Checklist

### Qualification

- [ ] Decision maker identified
- [ ] Budget confirmed
- [ ] Timeline understood
- [ ] Compliance requirements known
- [ ] Technical fit confirmed

### Proposal

- [ ] Custom proposal created
- [ ] Pricing approved by founder
- [ ] Proposal sent
- [ ] Follow-up scheduled

### Negotiation

- [ ] Redlines received
- [ ] Counter-proposal sent
- [ ] Terms agreed
- [ ] Legal involved

### Legal

- [ ] MSA drafted
- [ ] Legal review complete
- [ ] Final terms locked
- [ ] Signatures arranged

### Close

- [ ] Contracts signed
- [ ] Deposit received (if required)
- [ ] Team notified
- [ ] Onboarding started

---

## Related Documents

| Document                               | Purpose            |
| -------------------------------------- | ------------------ |
| `/LEGAL/MSA_TEMPLATE.md`               | MSA template       |
| `TERMS_REFERENCE.md`                   | Terms summary      |
| `PILOT_GUIDE.md`                       | Pilot process      |
| `../pricing/00_PRICING_CANONICAL.md`   | Enterprise pricing |
| `../onboarding/CUSTOMER_ONBOARDING.md` | Onboarding guide   |
