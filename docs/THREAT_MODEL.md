# Threat Model

**Last Updated:** January 2026  
**Status:** Active

This document outlines the threat model for Settler Enterprise, identifying assets, actors, threats, and mitigations.

---

## Assets

### Data Assets

1. **Customer Financial Data**
   - Transaction records
   - Reconciliation data
   - Receipt images and parsed data
   - **Sensitivity:** High
   - **Impact if Compromised:** Financial loss, regulatory violations, customer trust

2. **Authentication Credentials**
   - API keys
   - User passwords (hashed)
   - Session tokens
   - **Sensitivity:** Critical
   - **Impact if Compromised:** Unauthorized access, data breach

3. **Configuration Data**
   - Adapter credentials (Stripe, Shopify, etc.)
   - Webhook secrets
   - Encryption keys
   - **Sensitivity:** Critical
   - **Impact if Compromised:** Unauthorized access to third-party systems

4. **Metadata**
   - Usage statistics
   - Logs (may contain PII)
   - Audit trails
   - **Sensitivity:** Medium
   - **Impact if Compromised:** Privacy violations, competitive intelligence

### System Assets

1. **API Infrastructure**
   - API endpoints
   - Rate limiting
   - Authentication/authorization
   - **Sensitivity:** High
   - **Impact if Compromised:** Service disruption, unauthorized access

2. **Database**
   - PostgreSQL (Supabase)
   - Row-Level Security (RLS) policies
   - Backup systems
   - **Sensitivity:** Critical
   - **Impact if Compromised:** Data loss, unauthorized access

3. **Developer Console**
   - Web application
   - Session management
   - API key management
   - **Sensitivity:** High
   - **Impact if Compromised:** Unauthorized access, credential theft

---

## Actors

### External Actors

1. **Malicious Users**
   - **Capabilities:** Attempt unauthorized access, data exfiltration, service disruption
   - **Motivation:** Financial gain, competitive advantage, disruption
   - **Threat Level:** High

2. **Competitors**
   - **Capabilities:** Competitive intelligence gathering, service disruption
   - **Motivation:** Competitive advantage
   - **Threat Level:** Medium

3. **Script Kiddies**
   - **Capabilities:** Automated attacks, DDoS, credential stuffing
   - **Motivation:** Notoriety, disruption
   - **Threat Level:** Medium

4. **Nation-State Actors**
   - **Capabilities:** Advanced persistent threats, zero-day exploits
   - **Motivation:** Espionage, disruption
   - **Threat Level:** Low (but high impact if successful)

### Internal Actors

1. **Developers**
   - **Capabilities:** Code access, database access (with proper controls)
   - **Motivation:** Legitimate development, accidental mistakes
   - **Threat Level:** Low (but potential for accidental exposure)

2. **Support Staff**
   - **Capabilities:** Limited access to customer data (with proper controls)
   - **Motivation:** Customer support, accidental mistakes
   - **Threat Level:** Low (but potential for accidental exposure)

3. **Admins**
   - **Capabilities:** Full system access
   - **Motivation:** System administration, potential for abuse
   - **Threat Level:** Medium (requires strong controls)

---

## Threats

### Authentication & Authorization

**Threat:** Unauthorized access via credential theft or weak authentication

**Attack Vectors:**
- Credential stuffing
- Password brute force
- API key theft
- Session hijacking
- Privilege escalation

**Mitigations:**
- ✅ Strong password requirements
- ✅ Multi-factor authentication (MFA) support
- ✅ API key rotation
- ✅ Session management with secure cookies
- ✅ Rate limiting on authentication endpoints
- ✅ Row-Level Security (RLS) for multi-tenant isolation
- ✅ Principle of least privilege

### Data Exposure

**Threat:** Unauthorized access to customer financial data

**Attack Vectors:**
- SQL injection
- Insecure API endpoints
- Insufficient access controls
- Logging PII
- Data leakage in error messages

**Mitigations:**
- ✅ Parameterized queries (Prisma ORM)
- ✅ Input validation (Zod schemas)
- ✅ Row-Level Security (RLS) policies
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Logging hygiene (no PII in logs)
- ✅ Error message sanitization

### Injection Attacks

**Threat:** Code injection via user input

**Attack Vectors:**
- SQL injection
- Command injection
- XSS (Cross-Site Scripting)
- SSRF (Server-Side Request Forgery)

**Mitigations:**
- ✅ Parameterized queries (Prisma)
- ✅ Input validation (Zod)
- ✅ Output encoding (React XSS protection)
- ✅ SSRF protection (URL validation)
- ✅ Content Security Policy (CSP) headers

### Denial of Service (DoS)

**Threat:** Service disruption via resource exhaustion

**Attack Vectors:**
- DDoS attacks
- Rate limit bypass
- Resource exhaustion (CPU, memory, database connections)
- API abuse

**Mitigations:**
- ✅ Rate limiting (per API key, per IP)
- ✅ DDoS protection (Vercel, Cloudflare)
- ✅ Request size limits
- ✅ Connection pooling
- ✅ Circuit breakers
- ✅ Monitoring and alerting

### Man-in-the-Middle (MITM)

**Threat:** Interception of data in transit

**Attack Vectors:**
- TLS downgrade attacks
- Certificate spoofing
- Unencrypted connections

**Mitigations:**
- ✅ TLS 1.3 only (TLS 1.2 deprecated)
- ✅ Certificate pinning (mobile SDKs)
- ✅ HSTS headers
- ✅ Strong cipher suites
- ✅ Perfect Forward Secrecy (PFS)

### Supply Chain Attacks

**Threat:** Compromised dependencies or third-party services

**Attack Vectors:**
- Malicious npm packages
- Compromised third-party services (Supabase, Stripe, etc.)
- Dependency confusion

**Mitigations:**
- ✅ Dependency auditing (`npm audit`)
- ✅ Lock files (package-lock.json)
- ✅ Regular dependency updates
- ✅ Vendor security assessments
- ✅ Monitoring for suspicious activity

### Insider Threats

**Threat:** Malicious or accidental actions by internal actors

**Attack Vectors:**
- Privilege abuse
- Accidental data exposure
- Code injection by developers
- Credential sharing

**Mitigations:**
- ✅ Principle of least privilege
- ✅ Audit logging (all actions logged)
- ✅ Code review process
- ✅ Separation of duties
- ✅ Regular access reviews
- ✅ Security training

---

## Risk Assessment

### High Risk

1. **Unauthorized Access to Financial Data**
   - **Likelihood:** Medium
   - **Impact:** Critical
   - **Risk Level:** High
   - **Mitigation Priority:** Critical

2. **Credential Theft**
   - **Likelihood:** Medium
   - **Impact:** High
   - **Risk Level:** High
   - **Mitigation Priority:** High

### Medium Risk

1. **DoS Attacks**
   - **Likelihood:** Medium
   - **Impact:** Medium
   - **Risk Level:** Medium
   - **Mitigation Priority:** Medium

2. **Data Leakage via Logs**
   - **Likelihood:** Low
   - **Impact:** Medium
   - **Risk Level:** Medium
   - **Mitigation Priority:** Medium

### Low Risk

1. **Nation-State Attacks**
   - **Likelihood:** Low
   - **Impact:** Critical
   - **Risk Level:** Low (but high impact)
   - **Mitigation Priority:** Low (but monitor)

---

## Security Controls

### Preventive Controls

- ✅ Authentication and authorization
- ✅ Input validation
- ✅ Encryption (at rest, in transit)
- ✅ Rate limiting
- ✅ Access controls (RLS)

### Detective Controls

- ✅ Logging and monitoring
- ✅ Intrusion detection
- ✅ Anomaly detection
- ✅ Security audits

### Corrective Controls

- ✅ Incident response plan
- ✅ Backup and recovery
- ✅ Patch management
- ✅ Security updates

---

## Compliance Considerations

### SOC 2

- **Controls:** Access controls, encryption, logging, incident response
- **Status:** In progress (Target: Q2 2026)

### GDPR

- **Controls:** Data minimization, right to access, right to erasure, data processing agreements
- **Status:** Compliant

### PCI-DSS

- **Controls:** Not applicable (we don't store card data)
- **Status:** Scope reduction (never store card data)

---

## Security Monitoring

### What We Monitor

- Authentication failures
- Authorization denials
- API abuse patterns
- Unusual access patterns
- Error rates
- Performance degradation

### Alerting

- Real-time alerts for critical security events
- Daily security summary reports
- Weekly vulnerability scan reports

---

## Incident Response

See `/SECURITY.md` for detailed incident response procedures.

**Key Steps:**
1. Detection (0-1 hour)
2. Containment (1-4 hours)
3. Investigation (4-24 hours)
4. Notification (24-72 hours)

---

## Questions?

**Security Issues:** security@settler.io  
**Documentation:** See `/SECURITY.md` for detailed security practices

---

**This threat model is reviewed and updated quarterly. Last review: January 2026.**
