# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: security@settler.io
2. **PGP Key**: [Link to PGP key for encrypted reports]

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., XSS, SQL injection)
- Full paths of affected files
- Step-by-step instructions to reproduce
- Proof-of-concept code (if applicable)
- Impact assessment
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 24 hours
- **Status Update**: Within 72 hours
- **Fix Timeline**: Depends on severity (see below)

### Severity Levels

- **Critical**: Remote code execution, authentication bypass, data breach
  - Fix timeline: 24-48 hours
- **High**: Privilege escalation, sensitive data exposure
  - Fix timeline: 1 week
- **Medium**: Information disclosure, CSRF, XSS
  - Fix timeline: 2-4 weeks
- **Low**: Best practice violations, minor information leaks
  - Fix timeline: Next release

## Security Features

### Encryption

**At Rest:**
- Database: AES-256 encryption (managed by cloud provider)
- Sensitive fields: AES-256-GCM application-level encryption
- API keys: bcrypt hashing (12 rounds)

**In Transit:**
- TLS 1.3 for all API traffic
- mTLS for service-to-service communication (enterprise)
- HSTS headers enforced

### Authentication

- **JWT Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration with rotation
- **API Keys**: Hashed with bcrypt, scoped permissions
- **MFA**: Supported for enterprise tenants

### Authorization

- Role-Based Access Control (RBAC)
- Scope-based permissions for API keys
- Row-Level Security (RLS) in database
- Least privilege principle

### Input Validation

- Zod schema validation for all inputs
- Request size limits (1 MB body, 10 MB files)
- Field length limits
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### Secrets Management

- No secrets in code or logs
- Environment variable validation at startup
- Secrets rotation support
- Encrypted secrets storage

## Supported Encryption Protocols

### TLS

- **Minimum Version**: TLS 1.2
- **Preferred**: TLS 1.3
- **Cipher Suites**: 
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256

### Encryption Algorithms

- **Symmetric**: AES-256-GCM
- **Hashing**: SHA-256, SHA-512
- **Password Hashing**: bcrypt (12 rounds), Argon2 (future)
- **JWT Signing**: HS256 (HMAC-SHA256)

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use environment variables
2. **Validate all inputs**: Use Zod schemas
3. **Use parameterized queries**: Prevent SQL injection
4. **Sanitize outputs**: Prevent XSS
5. **Follow least privilege**: Grant minimum required permissions
6. **Keep dependencies updated**: Run `npm audit` regularly
7. **Review security logs**: Monitor audit logs

### For Users

1. **Use strong passwords**: Minimum 12 characters, mixed case, numbers, symbols
2. **Enable MFA**: When available
3. **Rotate API keys**: Every 90 days
4. **Use scoped API keys**: Grant minimum required permissions
5. **Monitor usage**: Review audit logs regularly
6. **Report suspicious activity**: Contact security@settler.io

## Security Compliance

- **SOC 2 Type II**: In progress
- **GDPR**: Compliant
- **PCI-DSS**: Not applicable (we don't store card data)
- **HIPAA**: Available for enterprise (BAA required)

## Security Updates

Security updates are released as:
- **Critical**: Immediate patch release
- **High**: Next patch release (within 1 week)
- **Medium/Low**: Next minor release

Subscribe to security advisories: security-advisories@settler.io

## Bug Bounty

We operate a responsible disclosure program. Bounties are awarded based on:
- Severity of vulnerability
- Quality of report
- Impact assessment

**Scope**: settler.io and api.settler.io
**Out of Scope**: Third-party services, social engineering

## Security Contact

- **Email**: security@settler.io
- **PGP**: [Link to PGP key]
- **Response Time**: 24 hours

## Disclosure Policy

We follow responsible disclosure:
1. Reporter notifies security@settler.io
2. We acknowledge within 24 hours
3. We investigate and develop fix
4. We notify reporter of fix timeline
5. We release fix and credit reporter (if desired)
6. Public disclosure after fix is deployed

## Security Changelog

See [CHANGELOG.md](./CHANGELOG.md) for security-related changes.
