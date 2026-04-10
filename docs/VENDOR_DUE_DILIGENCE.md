# Vendor Due Diligence Packet - Settler

**Date:** 2026-04-10  
**Classification:** Confidential - Enterprise Procurement

---

## 1. Security Overview

### Security Posture

Settler maintains enterprise-grade security through:

- **Infrastructure:** AWS (SOC2 Type II attested) with Supabase
- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Authentication:** Session-based with RBAC
- **Isolation:** PostgreSQL RLS + tenant-scoped queries
- **Monitoring:** Continuous audit logging

### Security Certifications

| Certification | Status | Evidence |
|--------------|--------|----------|
| SOC2 Type II | In progress | Control mapping doc |
| GDPR | Compliant | Privacy policy |
| PCI-DSS | Merchant services via Stripe | Stripe certification |
| ISO 27001 | Not certified | AWS upstream |

---

## 2. Technical Security Controls

### Access Management

- **Authentication:** Email/password with salted SHA-256 hashes
- **Sessions:** HTTP-only secure cookies, 24-hour expiry
- **RBAC:** 5 roles (Owner, Admin, Developer, Auditor, Reviewer)
- **MFA:** Available on Enterprise tier

### Data Protection

- **Encryption:** TLS 1.3 (transit), AWS encryption (rest)
- **Key Management:** AWS KMS
- **PII Handling:** Minimal collection, no credit card PANs stored
- **Backup:** Daily, 30-day retention

### Network Security

- **WAF:** AWS WAF enabled
- **DDoS:** CloudFlare/ AWS Shield
- **Logging:** Full request/response audit

---

## 3. Due Diligence Artifacts

### Available Upon Request

| Artifact | Description | Turnaround |
|----------|-------------|----------|
| SOC2 Type II Report | Last audit report | 2 weeks |
| Penetration Test | Annual pen test results | 1 week |
| Architecture Diagram | System design | Immediate |
| Security Whitepaper | Full security posture | 1 week |
| Privacy Policy | Data handling practices | Immediate |
| DPA | Data Processing Agreement | 3 business days |
| MSA | Master Service Agreement | 5 business days |
| SLA | Service Level Agreement | 3 business days |
| Insurance Certificate | Cyber liability | 1 week |

### RLS Verification Evidence

```bash
# Tenant isolation proof
psql> SELECT * FROM reconciliation_runs 
      WHERE organization_id = 'org_xxx' 
      AND tenant_isolation_enforced = true;
```

---

## 4. Enterprise Readiness Checklist

| Capability | Status | Notes |
|------------|--------|-------|
| SSO/SAML | Enterprise only | Okta, Azure AD, Google |
| Custom contracts | ✅ Available | Enterprise tier |
| Invoice billing | ✅ Available | ACH/wire |
| Dedicated support | ✅ Available | Enterprise tier |
| On-premise option | ✅ Available | Contact sales |
| API rate limits | ✅ Enforced | Per tier |
| Data residency | ⚠️ US-only | EU on request |
| Custom SLA | ✅ Available | Enterprise |

---

## 5. Vendor Risk Assessment Matrix

### Inherent Risk (Standard Tier)

| Risk Category | Inherent Rating | Residual Rating | Mitigation |
|--------------|----------------|---------------|------------|
| Data breach | Medium | Low | Encryption, access controls |
| Service disruption | Medium | Low | AWS redundancy |
| Supply chain | Low | Low | AWS/Supabase SOC2 |
| Regulatory | Medium | Low | GDPR compliance |
| Financial | Low | Low | Stripe billing |

### Mitigation Practices

- Annual penetration testing
- Quarterly vulnerability scans
- Real-time audit logging
- Documented incident response
- Encrypted data at rest/transit

---

## 6. Insurance

| Type | Coverage | Provider |
|------|---------|----------|
| Cyber Liability | $5M | Coalition |
| E&O | $2M | Hiscox |
| Workers Comp | Required | State minimum |

---

## 7. Contact

**Security Questions:** security@settler.dev  
**Legal/DPA:** legal@settler.dev  
**Sales:** sales@settler.dev  
**On-Call:** enterprise@settler.dev  

---

## 8. Response SLAs

| Request Type | SLA |
|------------|-----|
| Security inquiry | 24 hours |
| Penetration report | 1 week |
| DPA execution | 3 business days |
| Contract negotiation | 5 business days |
| Critical vulnerability | 24 hours |
| Incident notification | Per breach SLA |

---

## 9. Attestation

Settler attests that:

1. All security controls documented in SOC2 control mapping are operational
2. Annual penetration test conducted by independent firm
3. Incident response plan tested annually
4. All customer data encrypted at rest and in transit
5. No PII transfer outside documented subprocessors
6. 24-hour breach notification commitment

**Attestation Date:** 2026-04-10  
**Authorized Signatory:** [Legal - to be signed]

---

*This document is updated quarterly. Last update: 2026-04-10*