# Breach Notification SLA - Settler

**Effective Date:** 2026-04-10  
**Status:** Contract Commitment

---

## 1. Commitment

Settler commits to transparent breach notification within defined timeframes.

---

## 2. Classification

### Incident Types

| Type              | Definition                                     | Notification      |
| ----------------- | ---------------------------------------------- | ----------------- |
| **P1 - Critical** | Confirmed unauthorized access to customer data | 24 hours          |
| **P2 - High**     | Suspected breach, evidence gathering           | 72 hours          |
| **P3 - Medium**   | Policy violation, no data impact               | Next business day |
| **P4 - Low**      | Attempted scan/probe                           | Weekly summary    |

---

## 3. Response SLAs

### P1: Confirmed Breach

| Phase                       | Commitment | Timeline          |
| --------------------------- | ---------- | ----------------- |
| Detection → Internal Triage | 4 hours    | From discovery    |
| Customer Notification       | 24 hours   | From confirmation |
| Regulatory Notification     | 72 hours   | From confirmation |
| Root Cause Analysis         | 7 days     | From confirmation |
| Remediation Plan            | 14 days    | From confirmation |

### P2: Suspected Breach

| Phase                  | Commitment | Timeline        |
| ---------------------- | ---------- | --------------- |
| Detection → Assessment | 24 hours   | From discovery  |
| Customer Update        | 72 hours   | If escalates    |
| Resolution             | 14 days    | From assessment |

---

## 4. Notification Contents

### Customer Notification

```markdown
# Security Incident Notification

**Incident ID:** INC-2026-0042
**Classification:** P1 - Confirmed Breach
**Discovered:** 2026-04-10T14:30:00Z
**Affected Customers:** [List or count]

## What Happened

[Brief description]

## What Data Was Involved

[Data types]

## What We Are Doing

[Remediation steps]

## What You Should Do

[Recommended actions for affected customers]

## Contact

security@settler.dev

We will provide updates every 24 hours.
```

### Regulatory Notification

Required elements:

- Nature of the breach
- Categories of data affected
- Approximate number of individuals
- Likely consequences
- Measures taken to address

---

## 5. Escalation Paths

### Internal Escalation

```
Discovery (0-4h)
    ↓
Security Lead + Legal (4-8h)
    ↓
CEO + Legal (8-24h)
    ↓
Customer Notification (24h)
    ↓
Regulatory (72h)
```

### Contact Matrix

| Role          | Contact              | Availability   |
| ------------- | -------------------- | -------------- |
| Security Lead | security@settler.dev | 24/7           |
| Legal Counsel | legal@settler.dev    | Business hours |
| CEO           | ceo@settler.dev      | P1 only        |
| Press         | press@settler.dev    | All            |

---

## 6. Containment

### Immediate Containment (0-4 hours)

1. Isolate affected systems
2. Preserve evidence
3. Disable compromised accounts
4. Rotate credentials
5. Enable enhanced monitoring

### Long-term Containment (4-24 hours)

1. Patch vulnerabilities
2. Verify no lateral movement
3. Update firewall rules
4. Enhanced logging

---

## 7. Communication Channels

### Primary Channels

| Channel              | Use Case            |
| -------------------- | ------------------- |
| Email                | Formal notification |
| Status page          | Real-time updates   |
| Console notification | Account-specific    |
| API webhook          | Automated customers |

### Status Page

- URL: https://status.settler.dev
- Subscription available
- RSS feed available

---

## 8. Credit Monitoring

### P1 Breach Credit Monitoring

| Tier       | Credit Monitoring    |
| ---------- | -------------------- |
| Free       | N/A                  |
| Starter    | 12 months, 2 bureaus |
| Growth     | 24 months, 3 bureaus |
| Enterprise | Custom               |

### Enrollment

- Settler provides enrollment link within 7 days
- Credit monitoring activated within 14 days

---

## 9. Contractual Commitment

### Notification Terms

> UPON DISCOVERY OF AN ACTUAL OR SUSPECTED BREACH INVOLVING CUSTOMER DATA, SETTLER WILL NOTIFY AFFECTED CUSTOMERS WITHIN 24 HOURS. NOTIFICATION WILL BE SENT TO THE DESIGNATED SECURITY CONTACTS AND VIA THE PRIMARY ACCOUNT EMAIL.

### Delay Conditions

Notification may be delayed if:

- Law enforcement requests delay
- Immediate disclosure would cause further harm
- Ongoing forensic investigation

> IF NOTIFICATION IS DELAYED, SETTLER WILL PROVIDE WRITTEN REASON WITHIN THE NOTIFICATION WINDOW.

---

## 10. Post-Incident

### Required Post-Incident Actions

| Action              | Timeline |
| ------------------- | -------- |
| Root cause analysis | 7 days   |
| Remediation plan    | 14 days  |
| Customer report     | 30 days  |
| Process improvement | 60 days  |

### Annual Review

- Review all P1/P2 incidents annually
- Update response procedures
- Test incident response plan

---

## 11. Contact

**Security Incidents:** security@settler.dev  
**Emergency:** +1-555-SETTLER (24/7)  
**Legal:** legal@settler.dev

---

_Document Version: 1.0_
_Effective: 2026-04-10_
_Review: Annual_
