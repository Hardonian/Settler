# DPA Guide — Data Processing Addendum Process

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## When DPA Is Required

DPA required when customer is:

- EU-based company
- Processing EU personal data
- Subject to GDPR
- Subject to UK GDPR
- Requesting DPA for compliance

---

## DPA Overview

| Element             | Standard Terms           |
| ------------------- | ------------------------ |
| Legal Basis         | GDPR Article 28          |
| Processor           | Settler                  |
| Controller          | Customer                 |
| Scope               | Personal data in Settler |
| Sub-processors      | Listed in DPA            |
| Transfer Mechanism  | SCCs (if applicable)     |
| Breach Notification | 72 hours                 |
| Audit Rights        | Annually                 |

---

## DPA Process

### Stage 1: Request

1. **Customer requests DPA**
   - Usually during procurement
   - Sometimes during negotiation

2. **Verify requirement**
   - EU/UK customer?
   - Processing personal data?
   - Subject to GDPR?

### Stage 2: Review

1. **Review DPA template**
   - Use `/LEGAL/DPA_TEMPLATE.md`
   - Standard terms are generally acceptable

2. **Identify issues**
   - Additional customer requirements
   - Sub-processor restrictions
   - Audit frequency
   - Specific SCCs needed

### Stage 3: Execution

1. **Fill template**
   - Customer details
   - Processing details
   - Sub-processor list
   - Security measures

2. **Sign DPA**
   - Usually part of MSA process
   - Can be standalone
   - Both parties signed

### Stage 4: Ongoing

1. **Notify of changes**
   - Sub-processor changes
   - Security changes
   - Breach notification

2. **Maintain records**
   - Log all processing
   - Document lawful basis
   - Keep SCCs current

---

## Key DPA Terms

### Standard Processing

| Element         | Settler Commitment           |
| --------------- | ---------------------------- |
| Purpose         | Reconciliation services only |
| Duration        | Term of service + 30 days    |
| Nature          | Automated processing         |
| Data Categories | Financial transaction data   |
| Data Subjects   | Customer's end users         |

### Security Measures

| Measure           | Implementation                       |
| ----------------- | ------------------------------------ |
| Encryption        | AES-256 at rest, TLS 1.2+ in transit |
| Access Control    | Role-based, least privilege          |
| Monitoring        | Audit logs, alerts                   |
| Incident Response | 72-hour notification                 |

### Sub-processors

| Processor | Purpose            |
| --------- | ------------------ |
| AWS       | Infrastructure     |
| Stripe    | Payment processing |
| SendGrid  | Email delivery     |
| [Others]  | [As needed]        |

---

## International Transfers

### Standard Contractual Clauses (SCCs)

Required for:

- EU → US transfers
- UK → US transfers
- Other restricted transfers

### SCC Implementation

1. **Identify transfer mechanism**
2. **Complete SCCs**
3. **Attach to DPA**
4. **Maintain documentation**

---

## Compliance Checklist

- [ ] DPA requested by customer
- [ ] Verified GDPR applicability
- [ ] Review template terms
- [ ] Address customer redlines
- [ ] Execute DPA (with MSA or standalone)
- [ ] Log in customer record
- [ ] Notify of sub-processor changes

---

## Related Documents

| Document                                | Purpose            |
| --------------------------------------- | ------------------ |
| `/LEGAL/DPA_TEMPLATE.md`                | DPA template       |
| `/LEGAL/MSA_TEMPLATE.md`                | MSA template       |
| `MSA_GUIDE.md`                          | Enterprise process |
| `../procurement/SECURITY_ASSESSMENT.md` | Security review    |
