# MSA Guide — Enterprise Contract Process

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## When to Use MSA

Use MSA for Enterprise customers requiring:

- Custom contract terms
- Negotiated SLAs
- Volume discounts
- Custom integrations
- Extended payment terms
- Legal review

**For pilots:** Use `PILOT_GUIDE.md`

---

## MSA Process

### Stage 1: Discovery

1. **Understand requirements**
   - What do they need?
   - What's their timeline?
   - Who has signing authority?
   - Legal review required?

2. **Gather information**
   - Company name
   - Entity type
   - Billing address
   - Technical contacts
   - Legal contacts

### Stage 2: Proposal

1. **Draft Order Form**
   - Services included
   - Pricing
   - Term (typically 1-2 years)
   - SLA commitments
   - Support level

2. **Send MSA + Order Form**
   - Use `/LEGAL/MSA_TEMPLATE.md` as base
   - Customize for deal specifics
   - Track redlines

### Stage 3: Negotiation

1. **Common negotiation points**
   - Payment terms (net-30 vs net-60)
   - Liability caps
   - Indemnification scope
   - Termination rights
   - SLA credits

2. **Decision matrix**
   | Item | Walk-away | Target | Ideal |
   |------|----------|--------|-------|
   | Payment | Net-30 | Net-30 | Net-30 + prepay discount |
   | Liability | 12 months fees | 12 months fees | 12 months fees |
   | IP | Standard | Standard | Standard |
   | Term | 1 year | 1 year | 2 year |
   | Discount | 0% | 15% | 25% |

3. **Approval workflow**
   - <$3K/month: Founder approval
   - $3K-10K/month: Founder + Legal
   - > $10K/month: Full review

### Stage 4: Signature

1. **Final documents**
   - MSA with redlines resolved
   - Order Form
   - DPA (if EU customer)

2. **Signature process**
   - Digital signature (DocuSign or similar)
   - Both parties signed
   - Executed copy to both parties

3. **Post-signature**
   - Provision account
   - Set up billing
   - Schedule kickoff
   - Add to enterprise tracking

---

## Key MSA Terms

### Standard Terms (Non-Negotiable)

- IP ownership (our IP)
- Data ownership (customer data)
- Confidentiality
- Indemnification mutual
- Governing law (Delaware)

### Negotiable Terms

- Payment terms
- Liability caps
- SLA credits
- Support level
- Training included

### Anti-Negotiables (Don't Give)

- Data ownership
- IP ownership
- Governing law
- Basic SLA commitment

---

## Common Redlines

### Customer asks for X

| Redline                   | Our Response                           |
| ------------------------- | -------------------------------------- |
| Net-60 payment            | Net-30 standard, net-60 for >$5K/month |
| Unlimited liability       | Cap at 12 months fees                  |
| Source code escrow        | Not available now                      |
| Most favored nation       | Not available                          |
| Auto-renewal cancellation | 30-day notice standard                 |
| Unlimited SLA credits     | 10% credit cap per month               |

---

## Related Documents

| Document                                  | Purpose                |
| ----------------------------------------- | ---------------------- |
| `/LEGAL/MSA_TEMPLATE.md`                  | MSA template           |
| `/LEGAL/DPA_TEMPLATE.md`                  | DPA template           |
| `/LEGAL/PILOT_AGREEMENT_TEMPLATE.md`      | Pilot template         |
| `PILOT_GUIDE.md`                          | Pilot process          |
| `../runbooks/FIRST_ENTERPRISE_RUNBOOK.md` | First enterprise guide |
