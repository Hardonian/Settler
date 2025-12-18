# Settler Security Posture

**Last Updated:** January 2025  
**Version:** 1.0

## Overview

This document describes Settler's security controls, architecture, and compliance posture. It is designed to help enterprise customers understand our security practices and complete security questionnaires.

## Security Architecture

### Tenant Isolation

Settler implements multi-layer tenant isolation to ensure complete data separation:

#### Database Layer (Row-Level Security)
- **PostgreSQL RLS Policies:** All tables have Row-Level Security (RLS) enabled
- **Tenant Context:** Every query is scoped to the authenticated tenant via `tenant_id`
- **Policy Enforcement:** RLS policies prevent cross-tenant data access at the database level
- **Verification:** Automated tests verify tenant isolation (`packages/api/src/__tests__/multi-tenancy/tenant-isolation.test.ts`)

#### API Layer
- **Tenant Middleware:** All API routes use `tenantMiddleware` to extract and validate tenant context
- **Request Scoping:** Every database query includes `tenant_id` filter
- **Authorization:** Permission checks verify user belongs to the tenant before granting access
- **No Cross-Tenant Routes:** No API endpoint can access data from multiple tenants

#### UI Layer
- **Tenant Context:** Frontend applications receive tenant context from authentication
- **Client-Side Filtering:** All API calls include tenant context
- **Route Protection:** UI routes verify tenant membership before rendering

### Encryption

#### Encryption at Rest
- **Database:** PostgreSQL data encrypted using AES-256
- **Storage:** AWS S3 buckets encrypted with AES-256 server-side encryption
- **Key Management:** Encryption keys managed via environment variables (production uses AWS KMS)
- **Backup Encryption:** All backups encrypted with separate encryption keys
- **Credential Storage:** Integration credentials encrypted using AES-256 before storage

#### Encryption in Transit
- **TLS 1.3:** All API endpoints require TLS 1.3
- **HTTPS Only:** HTTP traffic redirected to HTTPS
- **Certificate Management:** Automated certificate renewal via Let's Encrypt
- **API Communication:** All API-to-API communication uses TLS
- **Webhook Delivery:** Webhooks delivered over HTTPS with signature verification

### Access Controls

#### Role-Based Access Control (RBAC)
Settler implements a hierarchical RBAC system:

**Roles:**
- **OWNER:** Full access to tenant, including billing and deletion
- **ADMIN:** Full operational access, cannot delete tenant
- **DEVELOPER:** Can create/manage jobs and integrations
- **VIEWER:** Read-only access

**Permission System:**
- Permissions defined in `packages/api/src/infrastructure/security/Permissions.ts`
- Role-to-permission mapping enforced at API middleware level
- API keys can have scoped permissions independent of user role

**Access Enforcement:**
- All API routes protected by `requirePermission` middleware
- Database queries filtered by tenant_id and user permissions
- UI components check permissions before rendering actions

#### Authentication
- **API Keys:** Scoped API keys with expiration and rate limits
- **JWT Tokens:** Short-lived tokens (15 min) with refresh tokens
- **Password Policy:** Minimum 8 characters, complexity requirements
- **MFA:** Multi-factor authentication available for enterprise accounts
- **SSO:** SAML 2.0 and OIDC support (enterprise)

### Audit Trail

#### Comprehensive Logging
- **All Actions Logged:** Every sensitive operation recorded in `audit_logs` table
- **Immutable Logs:** Audit logs are append-only and cannot be modified
- **Tenant-Scoped:** Audit logs filtered by tenant_id for isolation
- **Admin Visibility:** Tenant admins can view all audit logs for their tenant

#### Logged Events
- User authentication and authorization
- Data access (reads, writes, exports)
- Configuration changes
- Data deletion requests
- API key creation/revocation
- Integration credential changes
- Billing operations

#### Audit Log Access
- **API Endpoint:** `GET /api/v1/audit-trail` (requires ADMIN_AUDIT permission)
- **Filters:** By resource type, date range, event type, user
- **Export:** Audit logs can be exported in CSV or JSON format
- **Retention:** Audit logs retained for 7 years (configurable for enterprise)

## Data Protection

### Data Handling

#### Data Processing
- Customer data processed only for reconciliation services
- No use of customer data for AI model training without explicit consent
- Data residency options available (US, EU) for enterprise customers
- Tenant-isolated data storage with no cross-tenant access

#### Data Retention
- **Active Data:** Retained while customer account is active
- **Deleted Accounts:** Soft-deleted data retained for 30 days, then hard-deleted
- **Backups:** Backup retention of 30 days (extendable for enterprise)
- **Audit Logs:** Retained for 7 years for compliance

#### Data Deletion
- **Soft Delete:** Immediate soft deletion marks data as deleted
- **Hard Delete:** Scheduled hard deletion after 30-day grace period
- **Cryptographic Erasure:** Deleted data cryptographically erased from backups
- **Verification:** Deletion operations logged and verified

### Data Export

#### Full Account Export
- **Endpoint:** `GET /api/v1/tenant/data-export`
- **Format:** JSON or CSV
- **Scope:** All tenant data including users, jobs, webhooks, audit logs
- **Access:** Requires TENANT_READ permission (owner/admin only)
- **Logging:** Export operations logged in audit trail

#### User Data Export
- **Endpoint:** `GET /api/v1/users/:id/data-export`
- **Scope:** All data associated with specific user
- **Access:** Users can export their own data, admins can export any user's data

## Infrastructure Security

### Network Security
- **Zero-Trust Architecture:** No implicit trust between services
- **Firewall Rules:** Restrictive firewall rules, only necessary ports open
- **DDoS Protection:** Cloudflare DDoS protection for public endpoints
- **Rate Limiting:** Per-IP, per-user, and per-API-key rate limiting
- **IP Whitelisting:** Available for enterprise customers

### Application Security
- **Input Validation:** All inputs validated using Zod schemas
- **SQL Injection Prevention:** Parameterized queries, no raw SQL
- **XSS Prevention:** Content Security Policy (CSP) headers, input sanitization
- **CSRF Protection:** CSRF tokens required for state-changing operations
- **Security Headers:** Helmet.js configured with security headers

### Dependency Management
- **Automated Scanning:** Dependabot and Snyk scan dependencies weekly
- **Vulnerability Alerts:** Immediate alerts for critical vulnerabilities
- **Patch Management:** Security patches applied within 48 hours
- **License Compliance:** All dependencies checked for license compatibility

### Secret Management
- **Environment Variables:** Secrets stored in environment variables
- **No Secrets in Code:** No secrets committed to version control
- **Rotation:** Secrets rotated regularly (API keys, database passwords)
- **Access Control:** Limited access to production secrets

## Compliance

### Certifications & Standards

#### SOC 2 Type II (Planned Q3 2026)
- Infrastructure and processes designed in alignment with SOC 2 Trust Service Criteria
- Continuous monitoring of security controls
- Regular internal audits

#### ISO 27001 Aligned (Planned)
- Information security management system (ISMS) following ISO 27001 standards
- Risk management processes
- Security control documentation

#### GDPR Compliance
- **Data Export:** Full account data export available
- **Data Deletion:** Right to erasure implemented with 30-day grace period
- **Data Processing Agreements:** DPAs available for enterprise customers
- **Privacy Policy:** Comprehensive privacy policy at `/legal/privacy`

#### CCPA Compliance
- **Data Export:** California residents can export their data
- **Data Deletion:** Right to deletion implemented
- **Do Not Sell:** Settler does not sell customer data

### Sub-processors

Settler engages the following sub-processors:

**Infrastructure:**
- Amazon Web Services (AWS) - Cloud hosting
- Vercel - Frontend hosting & edge functions
- Supabase - Database & authentication
- Upstash - Redis & Kafka (serverless)

**Services:**
- Stripe - Payment processing
- Resend - Transactional emails
- OpenAI - LLM processing (opt-in features)

All sub-processors undergo security and privacy diligence. Data Processing Agreements (DPAs) maintained with all sub-processors handling customer data.

See `/legal/subprocessors` for complete list.

## Incident Response

### Response Process
1. **Detection:** Automated monitoring detects incidents within 1 hour
2. **Containment:** Immediate containment and mitigation actions
3. **Investigation:** Root cause analysis and impact assessment
4. **Notification:** Customer notification within 72 hours for incidents affecting customer data
5. **Remediation:** Fix implementation and verification
6. **Post-Mortem:** Post-incident review and process improvements

### Communication
- **Security Contact:** security@settler.dev
- **Status Page:** https://settler.dev/status
- **Enterprise Customers:** Direct notification via account contacts
- **Public Disclosure:** Follows responsible disclosure principles

### Responsible Disclosure
- Security vulnerabilities can be reported to security@settler.dev
- Security.txt file available at `/.well-known/security.txt`
- Bug bounty program (planned)

## Security Monitoring

### Continuous Monitoring
- **24/7 Monitoring:** Automated monitoring of all services
- **Alerting:** Real-time alerts for security events
- **Log Aggregation:** Centralized logging for security events
- **Threat Detection:** Automated threat detection and response

### Security Testing
- **Penetration Testing:** Annual penetration testing (planned)
- **Vulnerability Scanning:** Weekly automated vulnerability scans
- **Code Review:** All code changes require security review
- **Automated Testing:** Security tests in CI/CD pipeline

## Security Contacts

- **Security Issues:** security@settler.dev
- **Enterprise Security:** enterprise@settler.dev
- **General Inquiries:** support@settler.dev

## Document Control

This document is reviewed and updated quarterly or when significant changes occur. Enterprise customers will be notified of material changes.

**Document Owner:** Security Team  
**Review Frequency:** Quarterly  
**Next Review:** April 2025
