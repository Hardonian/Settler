# Data Processing Addendum Guide

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## When DPA Is Required

### Required For

- EU-based customers (GDPR)
- UK-based customers (UK GDPR)
- California customers processing CA residents' data (CCPA)
- Customers with strict data governance policies
- Any customer formally requesting DPA

### Often Required For

- Healthcare-adjacent companies
- Financial services companies
- Government contractors
- Enterprise customers (standard procurement)

---

## DPA Overview

### Controller vs Processor Roles

| Role                       | We Are     | Customer Is |
| -------------------------- | ---------- | ----------- |
| **Self-service (ToS)**     | Controller | Controller  |
| **Enterprise (MSA + DPA)** | Processor  | Controller  |

### What DPA Covers

- **Data processed** — Transaction data, user info, credentials
- **Processing purposes** — Reconciliation, audit trails, reporting
- **Sub-processors** — AWS, Stripe, Supabase, analytics
- **Security measures** — Encryption, access controls, monitoring
- **Breach notification** — 72-hour requirement
- **Data subject rights** — Assistance obligations
- **Deletion/return** — Upon termination

---

## DPA Process

```
Request → Review → Agreement → Execution
    ↓         ↓          ↓          ↓
  1 day     2-3 days    1-2 days    1 day
```

---

## Stage 1: Request

### Initial Response

- Acknowledge within 24 hours
- Request specifics:
  - Customer legal entity
  - Contract type (MSA already? or DPA only?)
  - Specific requirements?
  - Point of contact for DPA

### Request Acknowledgment Template

```markdown
Subject: Re: DPA Request - Settler

Hi [Name],

Thank you for your DPA request. I've received it and will work with
our team to finalize the agreement.

To help us process this quickly, could you confirm:

1. Are you on an existing MSA with us, or is this standalone?
2. Any specific DPA addenda from your organization?
3. Primary contact for legal matters?

We'll have a DPA ready for your review within [X] business days.

Best,
[Founder/Legal Contact]
```

---

## Stage 2: Review

### Standard DPA Review Checklist

- [ ] Scope of processing defined
- [ ] Sub-processors listed
- [ ] Security measures documented
- [ ] Breach notification timeline (72 hours)
- [ ] Data subject rights assistance
- [ ] Deletion/return procedures
- [ ] Audit rights reasonable
- [ ] Governing law appropriate

### DPA Comparison

| Requirement         | Settler Standard      | Customer Request | Resolution      |
| ------------------- | --------------------- | ---------------- | --------------- |
| Breach notification | 72 hours              | [Customer]       | Accept          |
| Sub-processor list  | Public list           | [Customer]       | Provide list    |
| Audit rights        | Annual, 30-day notice | [Customer]       | Negotiate       |
| Data residency      | US standard           | [Customer]       | Enterprise only |
| Encryption          | At-rest + transit     | [Customer]       | Accept          |

---

## Stage 3: Agreement

### DPA Template

Use `/LEGAL/DPA_TEMPLATE.md`

### Common DPA Addenda

| Addendum        | When Required     | Notes                             |
| --------------- | ----------------- | --------------------------------- |
| EU SCCs         | EU data transfers | For EU customers                  |
| UK Addendum     | UK GDPR           | UK-specific terms                 |
| CCPA provisions | California        | Already in ToS, may need separate |
| Healthcare      | HIPAA             | Separate BAA required             |

---

## Stage 4: Execution

### Pre-Signature Checklist

- [ ] All redlines resolved
- [ ] SCCs added if needed (EU)
- [ ] Signature authority confirmed
- [ ] Fully executed MSA exists (if applicable)

### Signature Process

1. Clean DPA to both parties
2. CEO/Founder signature
3. Customer signature
4. Exchange copies
5. Store in `/contracts/dpa/`

---

## Sub-Processor List

### Current Sub-Processors

| Provider          | Purpose              | Data          | Security         |
| ----------------- | -------------------- | ------------- | ---------------- |
| AWS               | Cloud infrastructure | All           | SOC 2, ISO 27001 |
| Stripe            | Payment processing   | Billing only  | PCI DSS Level 1  |
| Supabase          | Database             | All           | SOC 2            |
| Twilio (SendGrid) | Email                | Transactional | SOC 2            |
| Datadog           | Monitoring           | Logs only     | SOC 2            |

### Adding Sub-Processors

**Process:**

1. Identify new sub-processor
2. Assess data access
3. Review security certifications
4. Update sub-processor list (30-day notice)
5. Notify customers (if material change)

---

## Data Subject Rights

### Our Obligations

| Right         | Our Obligation                  |
| ------------- | ------------------------------- |
| Access        | Provide data within 30 days     |
| Rectification | Correct data within 30 days     |
| Erasure       | Delete within 30 days           |
| Restriction   | Limit processing                |
| Portability   | Provide machine-readable format |
| Objection     | Stop processing for marketing   |

### Process for Rights Requests

1. Customer submits request
2. Verify identity
3. Locate data
4. Fulfill or explain limitation
5. Document response
6. Log in helpdesk

---

## Breach Notification

### What Constitutes a Breach

- Unauthorized access to personal data
- Accidental disclosure
- Loss of data
- Unauthorized alteration

### Notification Requirements

| Stakeholder           | Timeline            | Content                                 |
| --------------------- | ------------------- | --------------------------------------- |
| Customer (Controller) | 72 hours            | Nature, categories, approximate numbers |
| Supervisory authority | 72 hours            | Same as above                           |
| Data subjects         | Without undue delay | If high risk                            |

### Breach Response Process

```
Discovery → Assessment → Notification → Remediation → Review
    ↓           ↓             ↓             ↓            ↓
  Immediate   4 hours     72 hours     Ongoing      1 week
```

---

## DPA Compliance Checklist

### Technical Measures

- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Access controls (least privilege)
- [ ] Audit logging
- [ ] Regular security testing
- [ ] Vulnerability management

### Administrative Measures

- [ ] Privacy policy published
- [ ] DPA process documented
- [ ] Staff trained on GDPR
- [ ] Sub-processor agreements in place
- [ ] Data retention policies
- [ ] Breach response plan

---

## Enterprise-Specific DPA

### Additional Requirements for Enterprise

- [ ] EU Standard Contractual Clauses (if needed)
- [ ] UK GDPR Addendum
- [ ] Swiss arrangements
- [ ] Specific security attestations
- [ ] Custom data residency

### Enterprise DPA Timeline

- **Standard:** 2-4 weeks
- **With SCCs:** 4-8 weeks
- **With custom terms:** 8-12 weeks

---

## Related Documents

| Document                                | Purpose         |
| --------------------------------------- | --------------- |
| `/LEGAL/DPA_TEMPLATE.md`                | DPA template    |
| `/LEGAL/PRIVACY_POLICY.md`              | Privacy policy  |
| `/LEGAL/MSA_TEMPLATE.md`                | MSA template    |
| `TERMS_REFERENCE.md`                    | Terms summary   |
| `MSA_GUIDE.md`                          | MSA guide       |
| `../procurement/SECURITY_ASSESSMENT.md` | Security review |
