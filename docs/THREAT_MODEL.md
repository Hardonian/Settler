# Settler Threat Model

This document outlines the threat model for Settler, identifying assets, trust boundaries, major threats, and mitigations.

## Assets

### High Value Assets

1. **Customer Financial Data**
   - Billing account information
   - Payment method details (stored by Stripe, not us)
   - Subscription data
   - Usage metrics

2. **API Keys**
   - Customer API keys for authentication
   - Service API keys for integrations

3. **User Credentials**
   - Supabase Auth handles authentication
   - We don't store passwords directly

4. **Tenant Data**
   - Reconciliation data
   - Receipt data
   - Feature flag configurations

### Medium Value Assets

1. **Application Code**
   - Source code repository
   - Deployment configurations

2. **Infrastructure**
   - Database access
   - API endpoints
   - Webhook endpoints

## Trust Boundaries

### External → Edge (Internet → Vercel)

- **Threats**: DDoS, malicious requests, injection attacks
- **Mitigations**:
  - Vercel DDoS protection
  - Rate limiting middleware
  - Request size limits
  - Security headers (CSP, HSTS, etc.)

### Edge → Application (Vercel → Next.js)

- **Threats**: Unauthorized access, privilege escalation
- **Mitigations**:
  - Authentication middleware
  - RLS policies in database
  - Auth gating on protected endpoints

### Application → Database (Next.js → Supabase)

- **Threats**: SQL injection, unauthorized data access
- **Mitigations**:
  - Prisma ORM (parameterized queries)
  - RLS policies
  - Service role only on server-side

### Application → External Services (Next.js → Stripe, etc.)

- **Threats**: API key leakage, webhook replay attacks
- **Mitigations**:
  - Environment variables (never in code)
  - Webhook signature verification
  - Idempotency checks

## Major Threats

### 1. Unauthorized Access

**Description**: Attacker gains access to customer data or admin functions.

**Attack Vectors**:
- Stolen API keys
- Weak authentication
- Session hijacking
- Privilege escalation

**Mitigations**:
- Strong API key generation (cryptographically secure)
- Supabase Auth with secure sessions
- RLS policies enforce tenant isolation
- Auth gating on admin endpoints
- Regular security audits

**Detection**:
- Monitor for unusual access patterns
- Audit logs track all access
- Alert on failed authentication attempts

### 2. Data Leakage

**Description**: Customer data exposed to unauthorized parties.

**Attack Vectors**:
- SQL injection
- Broken RLS policies
- Misconfigured CORS
- Logging sensitive data

**Mitigations**:
- Prisma ORM prevents SQL injection
- RLS policies tested and verified
- CORS configured correctly
- No sensitive data in logs
- Trace IDs don't contain sensitive info

**Detection**:
- Regular RLS policy audits
- Log monitoring for sensitive data patterns
- Database access logs

### 3. Webhook Replay Attacks

**Description**: Attacker replays Stripe webhooks to cause duplicate processing.

**Attack Vectors**:
- Intercepting webhook requests
- Replaying old webhooks
- Signature forgery

**Mitigations**:
- Webhook signature verification (Stripe)
- Database-backed idempotency (`stripe_events` table)
- Event ID uniqueness constraint
- Processed status tracking

**Detection**:
- Monitor for duplicate event processing
- Alert on signature verification failures
- Track webhook processing times

### 4. Billing Fraud

**Description**: Attacker manipulates billing or subscription data.

**Attack Vectors**:
- Modifying subscription status
- Bypassing usage limits
- Creating fake subscriptions

**Mitigations**:
- Stripe is source of truth for billing
- Webhook-only updates to subscription data
- Usage limits enforced server-side
- Audit logging for all billing changes

**Detection**:
- Monitor subscription changes
- Alert on unexpected billing events
- Regular reconciliation with Stripe

### 5. Dependency Vulnerabilities

**Description**: Vulnerable dependencies expose application to attacks.

**Attack Vectors**:
- Known CVEs in dependencies
- Supply chain attacks
- Outdated packages

**Mitigations**:
- Regular dependency audits (`npm audit`)
- Automated security scanning in CI
- Dependabot for updates
- Pin dependency versions

**Detection**:
- Weekly dependency audits
- CI fails on critical vulnerabilities
- Security alerts from GitHub

### 6. Denial of Service

**Description**: Attacker overwhelms system to make it unavailable.

**Attack Vectors**:
- DDoS attacks
- Resource exhaustion
- Rate limit bypass

**Mitigations**:
- Vercel DDoS protection
- Rate limiting middleware
- Request size limits
- Database connection pooling
- Timeout configurations

**Detection**:
- Monitor request rates
- Alert on unusual traffic patterns
- Track error rates

## Security Controls

### Authentication & Authorization

- **Supabase Auth**: Handles user authentication
- **API Keys**: For programmatic access
- **RLS Policies**: Database-level access control
- **Auth Gating**: Application-level access control

### Data Protection

- **Encryption at Rest**: Supabase encrypts database
- **Encryption in Transit**: TLS/HTTPS everywhere
- **No Sensitive Data in Logs**: Trace IDs only
- **Environment Variables**: Secrets never in code

### Monitoring & Detection

- **Structured Logging**: All logs include trace_id
- **Error Tracking**: Errors logged with context
- **Audit Logging**: Billing and settings changes tracked
- **Metrics Endpoint**: Performance monitoring

### Incident Response

- **Runbook**: Step-by-step procedures
- **Trace ID Correlation**: Easy debugging
- **Rollback Procedures**: Quick recovery
- **Emergency Contacts**: On-call rotation

## Compliance Considerations

### PCI DSS

- We don't store payment card data (Stripe handles this)
- API keys are treated as sensitive data
- Audit logging for billing changes

### GDPR

- User data can be deleted (soft delete)
- Audit logs track data access
- RLS ensures data isolation

### SOC 2

- Access controls in place
- Audit logging enabled
- Security monitoring active
- Incident response procedures documented

## Regular Security Tasks

### Weekly

- Review dependency vulnerabilities
- Check security alerts
- Review access logs

### Monthly

- Audit RLS policies
- Review webhook processing logs
- Security dependency updates

### Quarterly

- Full security audit
- Penetration testing (if applicable)
- Review and update threat model

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email security@settler.dev
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.
