# Security Documentation - Settler Enterprise

**Last Updated:** March 2026
**Security Status:** Active Development (see caveats below)

---

## Security Overview

Settler Enterprise implements comprehensive security measures across all layers of the application, from database to API to frontend.

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal access required
3. **Zero Trust** - Verify everything
4. **Secure by Default** - Security built-in, not bolted on

---

## 1. Authentication & Authorization

### Authentication ✅

- **Provider:** Supabase Auth
- **Methods:** Email/password, OAuth (configurable)
- **Session Management:** JWT tokens with refresh tokens
- **Password Policy:** Enforced by Supabase (configurable)

**Implementation:**

- Location: `packages/web/src/lib/supabase/server.ts`
- Session handling: Server-side session management
- Token refresh: Automatic refresh token rotation

### Authorization ✅

- **Row-Level Security (RLS):** Enforced on all critical tables
- **Tenant Isolation:** Database-level and application-level
- **Role-Based Access:** Subscription-based access control
- **API Authorization:** All routes check authentication and tenant access

**RLS Policies:**

- Location: `supabase/migrations/20250122000000_rls_enforcement_critical.sql`
- Coverage: All critical tables (billing_accounts, subscriptions, usage_events, etc.)
- Enforcement: Database-level, cannot be bypassed

**Tenant Isolation:**

- All API routes validate `tenantId` from auth context
- Database queries filtered by tenant
- Service role usage constrained to server-only contexts

---

## 2. Data Protection

### Encryption ✅

- **In Transit:** TLS 1.3 (enforced by Vercel/Supabase)
- **At Rest:** Database encryption (Supabase managed)
- **Secrets:** Environment variables, never in code
- **Encryption Keys:** Managed by Supabase/Vercel

### PII Protection ✅

- **Structured Logging:** PII sanitization in logs
- **Error Messages:** No PII in error responses
- **Audit Trails:** PII stored securely, access logged
- **Data Retention:** Configurable retention policies

**Implementation:**

- Logging: `packages/web/src/lib/observability/logger.ts`
- Error handling: Graceful error handling, no PII leaks
- Audit: Event sourcing for audit trails

### Data Isolation

- **Multi-Tenancy:** Tenant isolation via RLS policies on critical tables
- **Data Segregation:** Each tenant's data filtered at database level via RLS
- **Cross-Tenant Access:** Prevented by RLS for non-service-role connections; service role bypasses RLS by design and must only be used in server-only contexts with explicit tenant scoping
- **Service Role:** Restricted to server-only contexts; code-level guardrails verified by `verify:security`

---

## 3. API Security

### API Authentication ✅

- **API Keys:** Supported for programmatic access
- **JWT Tokens:** For user-initiated requests
- **Webhook Signatures:** For webhook endpoints (Stripe)

**Implementation:**

- API routes: `packages/web/src/app/api/**/route.ts`
- Auth middleware: Checks authentication on all protected routes
- API keys: Managed via console, stored securely

### Input Validation ✅

- **Schema Validation:** Zod schemas for all inputs
- **SQL Injection Prevention:** Prisma ORM (parameterized queries)
- **XSS Prevention:** React auto-escaping, Content Security Policy
- **CSRF Protection:** SameSite cookies, origin validation

**Implementation:**

- Validation: Zod schemas throughout codebase
- Database: Prisma ORM prevents SQL injection
- Frontend: React XSS protection, CSP headers

### Rate Limiting

- **API Rate Limits:** Configurable per endpoint
- **IP-Based Limiting:** Protection against abuse
- **User-Based Limiting:** Per-user limits
- **Redis-Backed (optional):** Distributed rate limiting via Upstash Redis

**Implementation:**

- Rate limiting: Redis/Upstash for distributed limiting when configured; process-local in-memory fallback otherwise
- Configuration: `RATE_LIMIT_DEFAULT`, `RATE_LIMIT_WINDOW_MS`
- **Caveat:** Without Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`), rate limits are per-process and will drift across instances. See `docs/security/VERIFICATION_SURFACES.md` for production guidance.

---

## 4. Infrastructure Security

### Hosting Security ✅

- **Provider:** Vercel (SOC 2 Type II certified)
- **DDoS Protection:** Built-in Vercel protection
- **SSL/TLS:** Automatic certificate management
- **Edge Security:** Vercel Edge Network security

### Database Security ✅

- **Provider:** Supabase (SOC 2 compliant)
- **Connection Security:** TLS-encrypted connections
- **Access Control:** RLS policies, service role isolation
- **Backups:** Automated backups, point-in-time recovery

### Secrets Management ✅

- **Environment Variables:** Never committed to git
- **Vercel Secrets:** Managed via Vercel dashboard
- **Supabase Secrets:** Managed via Supabase dashboard
- **Rotation:** Manual rotation process documented

**Best Practices:**

- `.env.example` documents all required variables
- No secrets in code or logs
- Secrets rotated regularly

---

## 5. Webhook Security

### Stripe Webhooks ✅

- **Signature Verification:** HMAC-SHA256 signature verification
- **Raw Body:** Preserved for signature verification
- **Idempotency:** Database-backed idempotency
- **Replay Protection:** Timestamp validation

**Implementation:**

- Location: `packages/web/src/app/api/stripe/webhook/route.ts`
- Runtime: Node.js (required for raw body access)
- Verification: Stripe signature verification
- Idempotency: `stripe_events` table prevents duplicate processing

### Custom Webhooks ✅

- **Signature Verification:** HMAC-SHA256
- **Timestamp Validation:** Replay attack prevention
- **Secret Management:** Per-webhook secrets

**Implementation:**

- SDK: `packages/sdk/src/utils/webhook-signature.ts`
- Verification: Constant-time comparison
- Timestamp: Configurable max age

---

## 6. Compliance

### GDPR Compliance ✅

- **Data Processing Agreements:** DPA template available
- **Privacy Policy:** Comprehensive privacy policy
- **Right to Access:** Data export functionality
- **Right to Deletion:** Data deletion process
- **Data Portability:** Export functionality

**Evidence:**

- Legal pages: `/legal/privacy`, `/legal/dpa`
- Data export: API endpoints for data export
- Deletion: Process documented

### SOC 2 Readiness (Partial)

- **Access Controls:** RLS policies, authentication
- **Monitoring:** Structured logging, Sentry error tracking
- **Incident Response:** Health check endpoints
- **Change Management:** Version control, migration pipeline

**Note:** This describes architectural alignment with SOC 2 control families, not a completed SOC 2 audit. A formal audit has not been performed.

---

## 7. Security Monitoring

### Logging ✅

- **Structured Logging:** JSON-formatted logs
- **PII Sanitization:** Automatic PII removal
- **Log Retention:** Configurable retention
- **Log Analysis:** Sentry integration

**Implementation:**

- Logger: `packages/web/src/lib/observability/logger.ts`
- Sentry: Error tracking and monitoring
- Logs: Structured, searchable, secure

### Error Tracking ✅

- **Sentry Integration:** Comprehensive error tracking
- **Error Sanitization:** No PII in error reports
- **Alerting:** Configurable alerts
- **Incident Response:** Health check endpoints

**Implementation:**

- Sentry: `@sentry/nextjs` integration
- Error boundaries: 7 error.tsx files
- Health checks: `/api/health`, `/api/admin/health`

---

## 8. Threat Model

### Identified Threats

1. **Unauthorized Access**
   - Mitigation: RLS policies, authentication, authorization
   - Monitoring: Access logs, failed login attempts

2. **Data Breach**
   - Mitigation: Encryption, tenant isolation, PII sanitization
   - Monitoring: Unusual access patterns, data exports

3. **API Abuse**
   - Mitigation: Rate limiting, input validation, monitoring
   - Monitoring: Rate limit violations, unusual API patterns

4. **Webhook Replay**
   - Mitigation: Signature verification, idempotency, timestamp validation
   - Monitoring: Duplicate webhook attempts

5. **SQL Injection**
   - Mitigation: Prisma ORM (parameterized queries)
   - Monitoring: Unusual database queries

6. **XSS Attacks**
   - Mitigation: React auto-escaping, CSP headers
   - Monitoring: XSS attempts in logs

---

## 9. Security Best Practices

### For Developers

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas
3. **Use Prisma ORM** - Prevents SQL injection
4. **Check tenant access** - Always validate tenantId
5. **Sanitize logs** - Remove PII from logs
6. **Use HTTPS** - Always in production
7. **Rotate secrets** - Regularly rotate API keys and secrets

### For Operations

1. **Monitor access logs** - Review regularly
2. **Review error logs** - Investigate anomalies
3. **Update dependencies** - Keep dependencies updated
4. **Review RLS policies** - Ensure comprehensive coverage
5. **Test backups** - Verify backup and recovery
6. **Incident response** - Document and practice

---

## 10. Security Checklist

### Pre-Launch

- [x] RLS policies enabled on critical tables
- [x] Tenant isolation guardrails verified on high-risk routes (static check; see `verify:security`)
- [x] Authentication required on protected routes
- [x] Input validation via Zod schemas on API endpoints
- [x] Webhook signature verification implemented (Stripe)
- [x] PII sanitization in structured logger
- [x] Error boundaries implemented
- [x] Health check endpoints configured
- [x] Monitoring integration (Sentry)
- [ ] Full runtime tenant-isolation test with cross-tenant fixtures
- [ ] Formal penetration test

### Ongoing

- [ ] Regular security audits
- [ ] Dependency updates (automated via `verify:security:supply-chain`)
- [ ] Access log reviews
- [ ] Penetration testing (annual)
- [ ] Security training for team
- [ ] Incident response drills

---

## 11. Security Contacts

**Security Issues:** [security@settler.dev]  
**Security Policy:** See `/legal/security`  
**Responsible Disclosure:** See security policy

---

**Last Updated:** March 2026
**Next Review:** Quarterly
