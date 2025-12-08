# Security Policy

**Last Updated:** January 2026  
**Version:** 1.0

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Email:** security@settler.io  
**Subject:** `[SECURITY] Brief description of the issue`

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Initial Response:** Within 24 hours
- **Status Update:** Within 72 hours
- **Resolution:** Depends on severity (see below)

### Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **Critical** | Remote code execution, data breach, authentication bypass | 4 hours | SQL injection, RCE |
| **High** | Privilege escalation, sensitive data exposure | 24 hours | Authorization bypass, API key leak |
| **Medium** | Information disclosure, CSRF, XSS | 72 hours | IDOR, stored XSS |
| **Low** | Best practice violations, minor info leaks | 7 days | Missing security headers |

### Bug Bounty Program

We offer rewards for valid security vulnerabilities:

- **Critical:** $1,000 - $5,000
- **High:** $500 - $1,000
- **Medium:** $100 - $500
- **Low:** $50 - $100

Rewards are determined by impact, exploitability, and report quality.

---

## Security Practices

### Secrets Management

#### API Keys and Credentials

**Storage:**
- All API keys are encrypted at rest using AES-256
- Keys are stored in environment variables or secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Never commit secrets to version control
- Use `.env` files for local development (excluded from git)

**Rotation:**
- API keys can be rotated via the dashboard or API
- Old keys remain valid for 24 hours after rotation (grace period)
- We recommend rotating keys every 90 days
- Enterprise customers can enforce automatic rotation

**Access Control:**
- API keys are scoped by permissions (read-only, write, admin)
- Keys can be restricted by IP allowlist (Enterprise)
- All key usage is logged and auditable

**Best Practices for Users:**
```bash
# ✅ DO: Use environment variables
export SETTLER_API_KEY="sk_live_..."

# ✅ DO: Use secret management tools
# AWS Secrets Manager, HashiCorp Vault, etc.

# ❌ DON'T: Hardcode in source code
const apiKey = "sk_live_abc123"; // NEVER DO THIS

# ❌ DON'T: Commit to git
echo "SETTLER_API_KEY=sk_live_..." >> .env
git add .env  # NEVER DO THIS
```

#### Third-Party Credentials

**Adapter Credentials (Stripe, Shopify, etc.):**
- Credentials are encrypted before storage
- Credentials are never logged or exposed in API responses
- Credentials are transmitted only over TLS 1.3
- Users can revoke access at any time

**Webhook Secrets:**
- Webhook secrets are generated automatically
- Secrets are hashed using bcrypt before storage
- Secrets are never exposed in API responses
- Users can regenerate secrets via API

### Breach Notification Policy

#### Incident Response Plan

**Detection:**
- 24/7 monitoring via automated security tools
- Intrusion detection systems (IDS)
- Anomaly detection for unusual access patterns
- Regular security audits and penetration testing

**Response Timeline:**

1. **Detection (0-1 hour):**
   - Automated alerts trigger incident response
   - Security team is notified immediately
   - Incident is classified by severity

2. **Containment (1-4 hours):**
   - Isolate affected systems
   - Revoke compromised credentials
   - Preserve evidence for investigation

3. **Investigation (4-24 hours):**
   - Determine scope of breach
   - Identify affected customers
   - Document timeline and impact

4. **Notification (24-72 hours):**
   - Notify affected customers via email
   - Post public disclosure (if required)
   - Report to relevant authorities (if required by law)

#### Customer Notification

**When We Notify:**
- Any unauthorized access to customer data
- Any exposure of sensitive information (API keys, credentials)
- Any breach affecting customer reconciliation data
- Any incident requiring customer action

**Notification Method:**
- Email to registered account email
- In-app notification banner
- Public disclosure on status page (for public incidents)

**Notification Content:**
- What happened (clear, non-technical language)
- What data was affected
- What we're doing to fix it
- What customers should do (if anything)
- Timeline of events
- Contact information for questions

**Example Notification:**
```
Subject: Security Incident Notification - [Date]

Dear [Customer Name],

We are writing to inform you of a security incident that may have affected your account.

What Happened:
On [Date], we detected unauthorized access to our systems. Our security team immediately contained the incident and began an investigation.

What Data Was Affected:
- API keys created before [Date] may have been exposed
- Reconciliation job metadata (names, schedules) may have been accessed
- No financial transaction data was accessed

What We're Doing:
- Revoked all potentially compromised API keys
- Implemented additional security measures
- Conducting a full security audit
- Working with external security experts

What You Should Do:
1. Rotate your API keys immediately via the dashboard
2. Review your reconciliation jobs for any unauthorized changes
3. Enable two-factor authentication (if not already enabled)

We take this incident seriously and apologize for any inconvenience.

Questions? Contact security@settler.io

- The Settler Security Team
```

#### Regulatory Compliance

**GDPR (EU):**
- Notify supervisory authority within 72 hours
- Notify affected individuals without undue delay
- Document all breaches in incident log

**SOC 2:**
- Document incident in security log
- Report to auditors during annual audit
- Maintain incident response documentation

**HIPAA (if applicable):**
- Notify affected individuals within 60 days
- Notify HHS within 60 days (if >500 affected)
- Provide credit monitoring if PHI was exposed

### Input Validation

#### API Input Validation

**All API endpoints validate input using Zod schemas:**

```typescript
// Example: Job creation validation
const jobSchema = z.object({
  name: z.string().min(1).max(255),
  source: z.object({
    adapter: z.enum(['stripe', 'shopify', 'quickbooks', 'paypal']),
    config: z.record(z.string(), z.unknown())
  }),
  target: z.object({
    adapter: z.enum(['stripe', 'shopify', 'quickbooks', 'paypal']),
    config: z.record(z.string(), z.unknown())
  }),
  rules: z.object({
    matching: z.array(z.object({
      field: z.string(),
      type: z.enum(['exact', 'fuzzy', 'range']),
      tolerance: z.number().optional()
    })),
    conflictResolution: z.enum(['first-wins', 'last-wins', 'manual'])
  })
});
```

**Validation Rules:**
- All strings are sanitized to prevent injection attacks
- Numbers are validated for range and type
- Dates are validated for format and range
- Enums are strictly validated against allowed values
- Nested objects are validated recursively
- Arrays are validated for length limits

**Common Validations:**

| Input Type | Validation | Example |
|------------|------------|---------|
| **Strings** | Length, character set, sanitization | `name: z.string().min(1).max(255)` |
| **Numbers** | Range, type, precision | `amount: z.number().positive().max(999999999)` |
| **Dates** | ISO 8601 format, range | `date: z.string().datetime()` |
| **URLs** | Valid URL format, HTTPS only | `url: z.string().url().startsWith('https://')` |
| **Emails** | Valid email format | `email: z.string().email()` |
| **API Keys** | Format validation | `apiKey: z.string().regex(/^sk_(live|test)_[a-zA-Z0-9]+$/)` |

#### SQL Injection Prevention

**We use parameterized queries exclusively:**

```typescript
// ✅ DO: Parameterized queries
const job = await db.query(
  'SELECT * FROM jobs WHERE id = $1 AND user_id = $2',
  [jobId, userId]
);

// ❌ DON'T: String concatenation
const job = await db.query(
  `SELECT * FROM jobs WHERE id = '${jobId}'` // NEVER DO THIS
);
```

**ORM Usage:**
- We use Prisma ORM which automatically parameterizes queries
- Raw SQL queries are avoided when possible
- If raw SQL is needed, parameters are always used

#### XSS Prevention

**Output Encoding:**
- All user input is HTML-encoded before rendering
- We use React's built-in XSS protection
- Content Security Policy (CSP) headers are enforced

**CSP Headers:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

#### CSRF Protection

**API Protection:**
- CSRF tokens for state-changing operations
- SameSite cookies for session management
- Origin header validation

**Implementation:**
```typescript
// CSRF token validation middleware
const validateCSRF = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};
```

#### Rate Limiting

**Per API Key:**
- 100 requests per 15 minutes (Free tier)
- 500 requests per 15 minutes (Starter)
- 2,000 requests per 15 minutes (Growth)
- 10,000 requests per 15 minutes (Scale)
- Custom limits (Enterprise)

**Per IP Address:**
- 1,000 requests per hour (prevents abuse)
- Exponential backoff on rate limit exceeded

**Implementation:**
```typescript
// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Data Encryption

#### Encryption at Rest

**Database:**
- All databases use AES-256 encryption
- Encryption keys are managed by cloud provider (AWS KMS, GCP KMS)
- Backups are encrypted automatically

**Object Storage:**
- All files stored in S3/R2 are encrypted (SSE-S3 or SSE-KMS)
- Encryption is enabled by default
- Keys are rotated annually

**Secrets:**
- API keys and credentials are encrypted before storage
- Encryption keys are stored separately from encrypted data
- Key rotation is supported without re-encryption

#### Encryption in Transit

**TLS Configuration:**
- TLS 1.3 only (TLS 1.2 deprecated)
- Strong cipher suites only
- Perfect Forward Secrecy (PFS) enabled
- HSTS headers enforced

**Certificate Management:**
- Certificates from Let's Encrypt (automated renewal)
- Enterprise customers can use custom certificates
- Certificate pinning supported (mobile SDKs)

### Access Control

#### Authentication

**API Keys:**
- Scoped by permissions (read, write, admin)
- Can be restricted by IP allowlist (Enterprise)
- All usage is logged and auditable

**OAuth 2.0:**
- Support for GitHub, Google, Microsoft
- PKCE flow for mobile/SPA
- Refresh tokens with rotation

**Multi-Factor Authentication (MFA):**
- TOTP-based (Google Authenticator, Authy)
- SMS-based (optional)
- Hardware keys (FIDO2/WebAuthn) - Enterprise

#### Authorization

**Role-Based Access Control (RBAC):**
- **Owner:** Full access
- **Admin:** Manage users, jobs, settings
- **Developer:** Create/edit jobs, view reports
- **Viewer:** Read-only access

**Resource-Level Permissions:**
- Permissions can be scoped to specific jobs
- Permissions can be scoped to specific adapters
- Permissions are enforced at API level

### Security Monitoring

#### Logging

**What We Log:**
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

**Log Storage:**
- Logs are stored in encrypted storage
- Logs are immutable (append-only)
- Logs are searchable via API

#### Monitoring

**Security Monitoring:**
- Intrusion detection systems (IDS)
- Anomaly detection (unusual access patterns)
- Failed login attempt tracking
- API abuse detection

**Alerting:**
- Real-time alerts for critical security events
- Daily security summary reports
- Weekly vulnerability scan reports

### Compliance

#### SOC 2 Type II

**Status:** In Progress (Target: Q2 2026)

**Controls:**
- Access controls (RBAC, MFA)
- Encryption (at rest, in transit)
- Logging and monitoring
- Incident response
- Change management

#### GDPR Compliance

**Data Processing:**
- Data minimization (only collect necessary data)
- Right to access (data export API)
- Right to erasure (data deletion API)
- Data Processing Agreement (DPA) available

**Data Residency:**
- EU data stored in EU regions (Enterprise)
- Data transfer agreements (SCCs) in place

#### PCI-DSS

**Status:** Not applicable (we don't store card data)

**If Required:**
- Scope reduction (never store card data)
- Network segmentation
- Access controls
- Monitoring and logging

### Security Best Practices for Users

#### API Key Management

1. **Rotate keys regularly** (every 90 days)
2. **Use scoped keys** (minimum permissions needed)
3. **Never commit keys to git**
4. **Use environment variables** or secret management tools
5. **Monitor key usage** for suspicious activity

#### Webhook Security

1. **Use webhook secrets** to verify signatures
2. **Validate webhook signatures** before processing
3. **Use HTTPS only** for webhook endpoints
4. **Implement idempotency** to prevent duplicate processing

#### General Security

1. **Enable MFA** on your account
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Review access logs** regularly
4. **Report suspicious activity** immediately
5. **Keep SDKs updated** to latest versions

### Security Resources

**Documentation:**
- [API Security Guide](./docs/api-security.md)
- [Webhook Security Guide](./docs/webhook-security.md)
- [Compliance Documentation](./docs/compliance.md)

**Support:**
- **Security Issues:** security@settler.io
- **General Support:** support@settler.io
- **Status Page:** status.settler.io

**External Resources:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**This security policy is reviewed and updated quarterly. Last review: January 2026.**
