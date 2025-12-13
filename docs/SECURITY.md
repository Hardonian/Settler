# Security Documentation

**Last Updated:** 2025-01-20  
**Status:** Production-Ready

## Overview

This document outlines security measures implemented in the Settler platform, including authentication, authorization, data protection, and compliance considerations.

## Authentication & Authorization

### Authentication Methods

1. **Supabase Auth** (Primary)
   - Email/password authentication
   - OAuth providers (Google, GitHub, etc.)
   - JWT tokens stored in HTTP-only cookies
   - Session refresh handled by middleware

2. **API Key Authentication**
   - For programmatic API access
   - Stored encrypted in database
   - Scoped to billing account
   - Rate limited per key

### Authorization Levels

- **Public**: No authentication required (marketing pages, docs)
- **Authenticated**: Valid Supabase session required (`/console/*`, `/dashboard/*`)
- **Admin**: Admin role in user metadata (`/admin/*`)
- **API Key**: Valid API key with proper scopes

### Route Protection

Protected routes are enforced via:
- Next.js middleware (`packages/web/middleware.ts`)
- Server-side route handlers checking `supabase.auth.getUser()`
- API route middleware for API key validation

## Data Protection

### Encryption

- **At Rest**: Supabase encryption (AES-256)
- **In Transit**: TLS/HTTPS everywhere
- **Sensitive Fields**: Encrypted with `ENCRYPTION_KEY` (AES-256-GCM)
  - API keys
  - Integration credentials
  - Webhook secrets

### Row-Level Security (RLS)

Supabase RLS policies enforce tenant isolation:
- Users can only access their own tenant's data
- Service role key only used server-side (bypasses RLS)
- Anon key used client-side (with RLS enforcement)

### PII Handling

- No PII logged in production logs
- Email addresses encrypted in audit logs
- User IDs used instead of emails in analytics

## API Security

### Rate Limiting

Rate limits configured per endpoint type:
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Billing endpoints**: 20 requests per minute
- **Webhook endpoints**: 10 requests per minute
- **Public endpoints**: 200 requests per minute

Rate limiting uses:
- In-memory store (serverless-friendly)
- Optional Redis for distributed rate limiting
- Per-IP, per-user, or per-API-key tracking

### Request Size Limits

- **Webhook endpoints**: 500KB max
- **API endpoints**: 10MB max (configurable)
- **File uploads**: Per-service limits

### Input Validation

- Zod schemas for all API inputs
- Type checking via TypeScript
- SQL injection prevention via Prisma ORM
- XSS prevention via React's built-in escaping

## Webhook Security

### Stripe Webhooks

- **Signature Verification**: Uses raw body + Stripe signature
- **Idempotency**: Database-backed event deduplication
- **Node.js Runtime**: Required for raw body access
- **Request Size Limit**: 500KB

### Custom Webhooks

- HMAC signature verification
- Secret stored encrypted
- Retry logic with exponential backoff
- Event log for audit trail

## Security Headers

Security headers configured in `next.config.js`:

- **Strict-Transport-Security**: HSTS with preload
- **X-Frame-Options**: DENY (prevent clickjacking)
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restrict geolocation, microphone, camera
- **Content-Security-Policy**: Restrict script sources, frame sources

## Secrets Management

### Environment Variables

- Secrets stored in Vercel environment variables
- Never committed to git
- Validated at runtime via `config/env.schema.ts`
- Different values for dev/staging/production

### Required Secrets

- `SUPABASE_SERVICE_ROLE_KEY`: Server-side only
- `STRIPE_SECRET_KEY`: Server-side only
- `STRIPE_WEBHOOK_SECRET`: Server-side only
- `JWT_SECRET`: Server-side only
- `ENCRYPTION_KEY`: Server-side only

### Public Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Safe for client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Safe for client (with RLS)

## Compliance

### SOC 2 Ready

- Audit logging for all sensitive operations
- Immutable audit logs
- Access controls and least privilege
- Encryption at rest and in transit

### ISO 27001 Ready

- Security policies documented
- Incident response procedures
- Regular security audits
- Vulnerability management

### GDPR Compliance

- Data minimization
- Right to deletion
- Data portability
- Privacy by design

## Vulnerability Management

### Reporting

Report security vulnerabilities to: **security@settler.io**

### Response Process

1. Acknowledge receipt within 24 hours
2. Assess severity within 48 hours
3. Fix and deploy within SLA (based on severity)
4. Public disclosure after fix deployed

### Severity Levels

- **Critical**: Remote code execution, data breach
- **High**: Privilege escalation, authentication bypass
- **Medium**: Information disclosure, CSRF
- **Low**: Information leakage, minor issues

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use environment variables
   - Use `.env.example` for documentation
   - Rotate secrets regularly

2. **Validate all inputs**
   - Use Zod schemas
   - Sanitize user input
   - Validate file uploads

3. **Use parameterized queries**
   - Prisma ORM prevents SQL injection
   - Never concatenate SQL strings

4. **Follow least privilege**
   - Use anon key client-side
   - Use service role key only server-side
   - Scope API keys to minimum required permissions

5. **Log security events**
   - Failed authentication attempts
   - Rate limit violations
   - Unusual access patterns

### For Operations

1. **Monitor security events**
   - Failed logins
   - Rate limit violations
   - Unusual API usage

2. **Regular audits**
   - Review access logs
   - Check for unused API keys
   - Verify RLS policies

3. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update dependencies promptly
   - Monitor security advisories

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] RLS policies verified
- [ ] Audit logging enabled
- [ ] Error messages don't leak sensitive info

### Post-Deployment

- [ ] Monitor security events
- [ ] Review access logs
- [ ] Check for failed authentications
- [ ] Verify rate limiting working
- [ ] Test webhook signature verification

## Incident Response

### Detection

- Monitor error rates
- Review access logs
- Check security alerts
- Monitor failed authentications

### Response

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Remediate**: Fix vulnerability
4. **Communicate**: Notify affected users
5. **Document**: Update runbooks

### Recovery

- Restore from backups if needed
- Rotate compromised secrets
- Review and update security measures
- Post-mortem and lessons learned

## Security Tools

### Static Analysis

- ESLint security plugins
- TypeScript strict mode
- Dependency vulnerability scanning (`npm audit`)

### Runtime Monitoring

- Sentry for error tracking
- Vercel Analytics for traffic patterns
- Custom audit logging

### Testing

- Security-focused unit tests
- Integration tests for auth flows
- E2E tests for critical paths

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [Stripe Security](https://stripe.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
