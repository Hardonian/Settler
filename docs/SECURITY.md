# Security

Settler.dev takes security seriously.

## Data Encryption

- **In Transit:** TLS 1.3 for all API communications
- **At Rest:** AES-256 encryption for stored data
- **BYOK:** Bring Your Own Key encryption available

## Authentication

- **API Keys:** Scoped API keys with expiration
- **JWT Tokens:** Short-lived tokens with refresh
- **SSO:** SAML 2.0 and OIDC support

## Authorization

- **RBAC:** Role-based access control
- **RLS:** Row-level security for multi-tenancy
- **API Scopes:** Granular permission scopes

## Multi-Tenancy

Strict tenant isolation:
- Database-level RLS policies
- Application-level tenant filtering
- No cross-tenant data access

## Audit Logging

Comprehensive audit trail:
- All API requests logged
- Configuration changes tracked
- Data access monitored
- User actions recorded

## Compliance

- **SOC 2 Type II** - Certified
- **GDPR** - Compliant
- **CCPA** - Compliant
- **HIPAA** - Available for enterprise

## Vulnerability Reporting

Report security vulnerabilities to: security@settler.io

We follow responsible disclosure practices.

---

**For security questions, contact: security@settler.io**
