# Technical Due Diligence: Security Posture

## Security Architecture

### Authentication

- **API Keys:** Scoped with expiration
- **JWT Tokens:** Short-lived with refresh
- **SSO:** OIDC env contracts (Okta, Entra ID, Google Workspace) are configuration-gated; SAML is not GA in this repository path. Use `pnpm run verify:enterprise-identity` for env-key posture only.

### Authorization

- **RBAC:** Role-based access control
- **RLS:** Row-level security for multi-tenancy
- **API Scopes:** Granular permission scopes

### Data Encryption

- **In Transit:** TLS 1.3
- **At Rest:** AES-256
- **BYOK:** Bring Your Own Key (enterprise)

## Multi-Tenancy Security

### Tenant Isolation

- Database-level RLS policies
- Application-level tenant filtering
- No cross-tenant data access
- Encrypted tenant configurations

### Audit Logging

- All API requests logged
- Configuration changes tracked
- Data access monitored
- User actions recorded

## Compliance

### Certifications (Target)

- **SOC 2 Type II:** In progress
- **GDPR:** Compliant
- **CCPA:** Compliant
- **HIPAA:** Ready (enterprise)

### Security Practices

- Regular security audits
- Penetration testing
- Vulnerability scanning
- Responsible disclosure program

## Security Controls

### Input Validation

- All inputs validated
- SQL injection prevention
- XSS prevention
- CSRF protection

### Secret Management

- Environment variables
- Encrypted storage
- Secret rotation
- No secrets in code

### Network Security

- Firewall rules
- DDoS protection
- Rate limiting
- IP whitelisting (enterprise)

---

**Next:** [Test Coverage & Reliability](./TEST_COVERAGE.md)
