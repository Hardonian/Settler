# Security, Trust & SOC 2 Buyer FAQ

**Last Updated:** January 2026  
**Audience:** Enterprise Customers, Procurement Teams, Security Teams, InfoSec

---

## Top 10 Pre-Sale / InfoSec Questions

### 1. Is Settler SOC 2 Type II certified?

**Status:** In Progress (Target: Q2 2026)

**Current State:**

- All SOC 2 controls implemented from day one
- Access controls (RBAC, MFA)
- Encryption (at rest, in transit)
- Logging and monitoring
- Incident response procedures

**Certification Timeline:**

- Audit started: Q1 2026
- Target certification: Q2 2026
- Annual audits thereafter

**For Customers:**

- We can provide security questionnaires
- We can schedule security review calls
- We can provide audit reports (once certified)
- We can provide SOC 2 readiness documentation

**Contact:** security@settler.io

---

### 2. What encryption is used for data at rest and in transit?

**Encryption at Rest:**

- AES-256 encryption (default)
- Database encryption (managed by cloud provider)
- Object storage encryption (SSE-S3 or SSE-KMS)
- Customer-managed keys available (Enterprise)

**Encryption in Transit:**

- TLS 1.3 only (TLS 1.2 deprecated)
- Strong cipher suites only
- Perfect Forward Secrecy (PFS) enabled
- HSTS headers enforced

**Application-Level:**

- API keys encrypted before storage
- Credentials encrypted before storage
- Key rotation supported without downtime

**Compliance:**

- FIPS 140-2 Level 3 compliant (where applicable)
- Key management: AWS KMS, Azure Key Vault, Google Cloud KMS

---

### 3. How is access controlled and authenticated?

**Authentication:**

- API keys (scoped by permissions)
- OAuth 2.0 (GitHub, Google, Microsoft)
- SSO (SAML, OIDC) - Enterprise
- Multi-factor authentication (MFA) required

**Authorization:**

- Role-based access control (RBAC)
- Resource-level permissions (per job, per adapter)
- IP allowlisting (Enterprise)
- Audit logs for all access

**Roles:**

- **Owner:** Full access
- **Admin:** Manage users, jobs, settings
- **Developer:** Create/edit jobs, view reports
- **Viewer:** Read-only access

**Access Controls:**

- Least privilege principle
- Regular access reviews
- Automated access revocation
- Session management (timeout, refresh)

---

### 4. What audit logging and monitoring is available?

**What's Logged:**

- All API requests (endpoint, method, user, IP, timestamp)
- Authentication events (logins, failures, MFA)
- Authorization events (permission denials)
- Configuration changes (job creation, updates, deletions)
- Data access (PII, sensitive data)
- Security events (failed logins, suspicious activity)

**Log Retention:**

- 7 days (Free tier)
- 30 days (Starter)
- 90 days (Growth)
- 1 year (Scale)
- Custom (Enterprise, up to 7 years)

**Log Access:**

- Queryable via API (`GET /api/v1/audit-logs`)
- Exportable (JSON, CSV)
- Immutable (append-only)
- Encrypted at rest

**Monitoring:**

- 24/7 security monitoring
- Intrusion detection systems (IDS)
- Anomaly detection for unusual access patterns
- Automated alerts for security events

---

### 5. What's your breach notification policy and incident response plan?

**Detection:**

- 24/7 monitoring via automated security tools
- Intrusion detection systems (IDS)
- Anomaly detection for unusual access patterns
- Security information and event management (SIEM)

**Response Timeline:**

- **Detection:** 0-1 hour
- **Containment:** 1-4 hours
- **Investigation:** 4-24 hours
- **Notification:** 24-72 hours

**Customer Notification:**

- Email to registered account email
- In-app notification banner
- Public disclosure on status page (for public incidents)
- Detailed incident report

**Regulatory Compliance:**

- GDPR: 72-hour notification to supervisory authority
- SOC 2: Documented in security log
- HIPAA: 60-day notification (if applicable)
- CCPA: 72-hour notification (if applicable)

**Incident Response Plan:**

- Documented incident response procedures
- Designated incident response team
- Regular incident response drills
- Post-incident reviews and improvements

---

### 6. Is Settler GDPR compliant?

**Yes, GDPR compliant by design:**

**Data Processing:**

- Data minimization (only collect necessary data)
- Right to access (data export API)
- Right to erasure (data deletion API)
- Right to rectification (data update API)
- Right to portability (data export API)
- Data Processing Agreement (DPA) available

**Data Residency:**

- EU data stored in EU regions (Enterprise)
- Data transfer agreements (SCCs) in place
- Compliance with local data protection laws

**Customer Rights:**

- Export all data via API (`GET /api/v1/users/{id}/data-export`)
- Delete all data via API (`DELETE /api/v1/users/{id}/data`)
- Request data processing information
- Object to processing (opt-out)

**Privacy by Design:**

- Privacy impact assessments (PIAs)
- Data protection by design and by default
- Regular privacy audits

---

### 7. Is Settler PCI-DSS compliant?

**Status:** Not applicable (we don't store card data)

**Scope Reduction:**

- We never store payment card data
- We only pass through webhook data (if customers send card data)
- We use tokenization when possible
- We don't process, store, or transmit cardholder data

**If Required:**

- We can pursue PCI-DSS Level 1 certification (on-demand)
- Timeline: 6-12 months
- Cost: Included in Enterprise plan

**Compliance:**

- We follow PCI-DSS best practices
- We use secure coding practices
- We conduct regular security assessments
- We maintain secure network architecture

---

### 8. Is Settler HIPAA compliant?

**Status:** HIPAA-ready (on-demand)

**If Required:**

- Business Associate Agreement (BAA) available
- End-to-end encryption for PHI
- Access controls and audit logs
- Breach notification (72-hour SLA)

**Timeline:**

- BAA available immediately
- Full HIPAA compliance: 3-6 months
- Cost: Included in Enterprise plan

**Compliance:**

- Administrative safeguards (policies, procedures)
- Physical safeguards (data center security)
- Technical safeguards (encryption, access controls)
- Breach notification procedures

---

### 9. What data residency and geographic restrictions are available?

**Standard Plans:**

- Data stored in US regions (default)
- Data may be processed globally (for performance)

**Enterprise Plans:**

- Regional data residency available (US, EU, APAC)
- Data stored in specified region only
- No cross-region data transfer (unless explicitly configured)
- Compliance with local data protection laws

**Data Transfer:**

- Standard Contractual Clauses (SCCs) for EU data transfers
- Data Processing Agreements (DPAs) available
- Regional compliance (GDPR, CCPA, PIPEDA)

**Contact:** enterprise@settler.io for data residency options

---

### 10. What security certifications and compliance frameworks do you support?

**Current Certifications:**

- SOC 2 Type II (in progress, target: Q2 2026)
- GDPR compliant
- PCI-DSS Level 1 (on-demand, Enterprise)
- HIPAA-ready (on-demand, Enterprise)

**Compliance Frameworks:**

- SOC 2 (Type I, Type II)
- GDPR (EU General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PIPEDA (Personal Information Protection and Electronic Documents Act)
- PCI-DSS (Payment Card Industry Data Security Standard)
- HIPAA (Health Insurance Portability and Accountability Act)
- ISO 27001 (on roadmap)

**Security Standards:**

- OWASP Top 10 compliance
- NIST Cybersecurity Framework
- CIS Controls
- Secure coding practices (OWASP ASVS)

**Regular Assessments:**

- Annual security audits
- Penetration testing (quarterly)
- Vulnerability assessments (monthly)
- Code security reviews (continuous)

---

## Additional Security Questions

### 11. How do you handle API key security?

**API Key Security:**

- API keys encrypted before storage
- Scoped by permissions (read, write, admin)
- Key rotation supported without downtime
- Revocation available immediately
- Rate limiting per API key
- IP allowlisting (Enterprise)

**Best Practices:**

- Never log API keys
- Never expose API keys in URLs
- Use environment variables for storage
- Rotate keys regularly (recommended: every 90 days)

---

### 12. What penetration testing and security assessments do you conduct?

**Penetration Testing:**

- Quarterly external penetration testing
- Annual comprehensive security assessment
- Bug bounty program (planned)

**Vulnerability Assessments:**

- Monthly automated vulnerability scans
- Continuous dependency scanning
- Regular security code reviews

**Security Audits:**

- Annual SOC 2 audits
- Regular compliance audits
- Third-party security assessments

---

### 13. How do you handle third-party dependencies and supply chain security?

**Dependency Management:**

- Regular dependency updates
- Automated dependency scanning
- Vulnerability monitoring (Snyk, Dependabot)
- Secure coding practices

**Supply Chain Security:**

- Vendor security assessments
- Third-party risk management
- Secure software development lifecycle (SDLC)
- Code signing and verification

---

### 14. What disaster recovery and business continuity plans do you have?

**Disaster Recovery:**

- Automated backups (daily)
- Multi-region replication
- Recovery time objective (RTO): <4 hours
- Recovery point objective (RPO): <1 hour

**Business Continuity:**

- Documented business continuity plan
- Regular disaster recovery drills
- High availability architecture
- 99.99% uptime SLA (Enterprise)

---

### 15. How do you handle customer data deletion and retention?

**Data Deletion:**

- GDPR right to erasure compliant
- Data deletion API available (`DELETE /api/v1/users/{id}/data`)
- 30-day grace period (recoverable)
- Permanent deletion after 30 days

**Data Retention:**

- Configurable retention periods (7 days to 7 years)
- Automatic deletion after retention period
- Compliance with legal requirements
- Audit logs retained per plan limits

---

## Security Documentation

**Available Upon Request:**

- Security questionnaire responses
- SOC 2 readiness documentation
- Penetration test reports (redacted)
- Vulnerability assessment reports (redacted)
- Incident response plan (summary)
- Disaster recovery plan (summary)
- Data Processing Agreement (DPA)
- Business Associate Agreement (BAA)

**Contact:** security@settler.io

---

## Security Contact

**Security Team:** security@settler.io  
**Enterprise Security:** enterprise-security@settler.io  
**Incident Reporting:** security-incident@settler.io

**Response Time:**

- Security inquiries: 24 hours
- Security incidents: 1 hour (Enterprise), 4 hours (Standard)

---

**Last Updated:** January 2026
