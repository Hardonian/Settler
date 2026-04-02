# Security Assessment Guide

**Status:** ✅ Active  
**Last Updated:** 2026-04-02  
**Owner:** Founder/Operator

---

## Overview

This guide covers security assessment for vendors who will have access to Settler systems or data.

---

## When Security Assessment Is Required

| Vendor Type         | Assessment Required       |
| ------------------- | ------------------------- |
| Infrastructure      | Full assessment           |
| Payment processing  | Full assessment           |
| Data storage        | Full assessment           |
| Email/communication | Basic assessment          |
| Analytics           | Basic assessment          |
| Marketing tools     | Minimal assessment        |
| Enterprise deals    | Customer assessment of us |

---

## Assessment Levels

### Level 1: Basic Review

For low-risk vendors (no data access):

- [ ] Check vendor website
- [ ] Review privacy policy
- [ ] Verify basic security practices

**Time Required:** 1-2 hours

### Level 2: Standard Review

For medium-risk vendors (non-sensitive data):

- [ ] Level 1 items
- [ ] Security questionnaire
- [ ] Check certifications
- [ ] Review data handling

**Time Required:** 1-3 days

### Level 3: Full Assessment

For high-risk vendors (sensitive data):

- [ ] Level 2 items
- [ ] SOC 2 report review
- [ ] Penetration test results
- [ ] DPA negotiation
- [ ] Legal review

**Time Required:** 1-4 weeks

---

## Security Questionnaire

### Basic Questionnaire Template

```markdown
# Security Questionnaire - [Vendor Name]

**Date:** [Date]
**Submitted by:** [Name]

## Company Security

1. Do you have a written security policy? Yes/No
2. Do you conduct regular security training? Yes/No
3. Do you have a designated security team? Yes/No

## Data Protection

4. How is data encrypted at rest? [Answer]
5. How is data encrypted in transit? [Answer]
6. Who has access to customer data? [Answer]
7. Do you use sub-processors? Yes/No
   - If yes, list them: [List]

## Compliance

8. Do you have SOC 2 certification? Yes/No
   - If yes, provide report: [Attach]
9. Do you have ISO 27001? Yes/No
10. Do you comply with GDPR? Yes/No

## Incidents

11. Have you had any security incidents in the past 2 years? Yes/No
    - If yes, describe: [Details]

## Certifications

12. List all security certifications: [List]
13. Date of last security audit: [Date]
```

---

## Certification Checklist

### Required Certifications

| Certification | Required For             | Verification        |
| ------------- | ------------------------ | ------------------- |
| SOC 2 Type II | Infrastructure, payments | Request report      |
| PCI DSS       | Payment processing       | Check level         |
| ISO 27001     | Enterprise contracts     | Request certificate |

### Nice-to-Have Certifications

| Certification | Value          |
| ------------- | -------------- |
| ISO 27017     | Cloud security |
| ISO 27018     | Cloud privacy  |
| CSA STAR      | Cloud security |
| HITRUST       | Healthcare     |

---

## Data Handling Assessment

### Questions to Answer

1. **What data will vendor access?**
   - Production data
   - Customer data
   - Payment data
   - Personal data

2. **How will data be stored?**
   - Location (country/region)
   - Encryption method
   - Retention period

3. **Who has access?**
   - Vendor employees
   - Third parties
   - Geographic restrictions

4. **What's the exit plan?**
   - Data export
   - Data deletion
   - Transition support

---

## Risk Classification

### Risk Matrix

| Data Type     | Access Level | Risk Level |
| ------------- | ------------ | ---------- |
| Public        | Read         | Low        |
| Internal      | Read         | Medium     |
| Customer      | Read/Write   | High       |
| Personal data | Any          | Critical   |
| Payment data  | Any          | Critical   |

### Assessment Result

| Risk Level | Decision                                    |
| ---------- | ------------------------------------------- |
| Low        | Approve, minimal monitoring                 |
| Medium     | Approve with DPA, periodic review           |
| High       | Approve with full assessment, annual review |
| Critical   | Reject or implement controls                |

---

## DPA Requirements

### When DPA Is Required

- EU personal data
- UK personal data
- California personal data
- Any personal data

### DPA Checklist

- [ ] Scope of processing defined
- [ ] Security measures documented
- [ ] Breach notification timeline (72 hours)
- [ ] Sub-processor list provided
- [ ] Deletion/return procedures
- [ ] Audit rights defined

---

## Enterprise Customer Assessments

### Our Obligations

When enterprise customers assess Settler:

1. **Provide documentation**
   - SOC 2 Type II report (if available)
   - Security questionnaire responses
   - Penetration test results
   - Compliance documentation

2. **Support their review**
   - Answer questions
   - Schedule calls
   - Provide evidence

3. **Negotiate terms**
   - Custom DPA
   - Security requirements
   - Audit rights

### Assessment Response Timeline

| Item                  | Timeline        |
| --------------------- | --------------- |
| Initial questionnaire | 5 business days |
| Follow-up questions   | 3 business days |
| Evidence requests     | 5 business days |
| DPA negotiation       | 2-4 weeks       |

---

## Checklist: Vendor Security Assessment

### Initial Review

- [ ] Identify vendor risk level
- [ ] Send security questionnaire
- [ ] Review certifications
- [ ] Assess data handling

### Documentation

- [ ] Security questionnaire responses
- [ ] SOC 2 report (if applicable)
- [ ] Penetration test results
- [ ] DPA signed (if applicable)

### Approval

- [ ] Risk assessment complete
- [ ] Decision documented
- [ ] Contract negotiated
- [ ] Approval obtained

### Ongoing

- [ ] Annual review scheduled
- [ ] Monitoring in place
- [ ] Incident contacts established

---

## Related Documents

| Document                                 | Purpose             |
| ---------------------------------------- | ------------------- |
| `VENDOR_PROCUREMENT.md`                  | Procurement process |
| `../legal-commercial/DPA_GUIDE.md`       | DPA requirements    |
| `../legal-commercial/TERMS_REFERENCE.md` | Contract terms      |
