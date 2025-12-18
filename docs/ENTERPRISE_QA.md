# Enterprise Security Questionnaire - Pre-filled Answers

**Last Updated:** January 2025  
**Version:** 1.0

This document provides pre-filled answers to common enterprise security questionnaires. Use this document to quickly respond to security questionnaires from enterprise prospects.

## Company Information

**Company Name:** Settler, Inc.  
**Product/Service:** Financial reconciliation and data matching platform  
**Website:** https://settler.dev  
**Security Contact:** security@settler.dev  
**Privacy Contact:** privacy@settler.dev  
**Enterprise Sales:** enterprise@settler.dev

## Data Security

### Q: What encryption is used for data at rest?
**A:** AES-256 encryption is used for all data at rest. Database data is encrypted using PostgreSQL's built-in encryption. Files stored in S3 are encrypted using AES-256 server-side encryption. Encryption keys are managed via environment variables (production uses AWS KMS).

### Q: What encryption is used for data in transit?
**A:** TLS 1.3 is required for all API endpoints and web interfaces. All API-to-API communication uses TLS. Webhook delivery uses HTTPS with signature verification.

### Q: How are encryption keys managed?
**A:** Encryption keys are stored in environment variables, never in code. Production environments use AWS KMS for key management. Keys are rotated regularly. Access to production keys is restricted to authorized personnel only.

### Q: Do you support Bring Your Own Key (BYOK)?
**A:** BYOK is available for enterprise customers. Contact enterprise@settler.dev to discuss BYOK implementation.

### Q: How is sensitive data (e.g., API keys, credentials) stored?
**A:** Integration credentials are encrypted using AES-256 before storage. API keys are hashed using bcrypt. Secrets are never stored in plaintext. Access to decrypted credentials is restricted to authorized services only.

## Access Controls

### Q: What authentication methods are supported?
**A:** Settler supports API key authentication, JWT tokens, and SAML 2.0/OIDC SSO for enterprise customers. Multi-factor authentication (MFA) is available for enterprise accounts.

### Q: How is access control implemented?
**A:** Settler implements Role-Based Access Control (RBAC) with four roles: Owner, Admin, Developer, and Viewer. Permissions are enforced at the API middleware level. API keys can have scoped permissions independent of user role.

### Q: How is multi-tenancy secured?
**A:** Multi-tenancy is secured through multiple layers:
- **Database:** Row-Level Security (RLS) policies enforce tenant isolation at the database level
- **API:** All API routes filter by tenant_id, preventing cross-tenant access
- **Application:** Tenant context is validated on every request
- **Testing:** Automated tests verify tenant isolation

### Q: Can users access data from other tenants?
**A:** No. Tenant isolation is enforced at the database, API, and application layers. No user can access data from another tenant. This is verified through automated testing.

### Q: How are permissions managed?
**A:** Permissions are defined in code and enforced via middleware. Role-to-permission mappings are centralized. API keys can have custom scopes. All permission checks are logged in the audit trail.

## Audit & Logging

### Q: What audit logging is available?
**A:** Settler maintains comprehensive audit logs of all sensitive operations, including:
- User authentication and authorization
- Data access (reads, writes, exports)
- Configuration changes
- Data deletion requests
- API key creation/revocation
- Integration credential changes
- Billing operations

### Q: How long are audit logs retained?
**A:** Audit logs are retained for 7 years. This can be extended for enterprise customers.

### Q: Can audit logs be exported?
**A:** Yes. Audit logs can be accessed via `GET /api/v1/audit-trail` and exported in CSV or JSON format. Filters are available by resource type, date range, event type, and user.

### Q: Are audit logs immutable?
**A:** Yes. Audit logs are append-only and cannot be modified or deleted by users or administrators.

### Q: Who can access audit logs?
**A:** Tenant administrators can view all audit logs for their tenant. Audit log access requires ADMIN_AUDIT permission.

## Data Privacy & Compliance

### Q: Are you GDPR compliant?
**A:** Yes. Settler is GDPR compliant. We provide:
- Full account data export (`GET /api/v1/tenant/data-export`)
- Right to erasure with 30-day grace period
- Data Processing Agreements (DPAs) for enterprise customers
- Privacy policy at `/legal/privacy`

### Q: Are you CCPA compliant?
**A:** Yes. Settler is CCPA compliant. California residents can export and delete their data. We do not sell customer data.

### Q: Do you have SOC 2 Type II certification?
**A:** SOC 2 Type II certification is planned for Q3 2026. Our infrastructure and processes are designed in alignment with SOC 2 Trust Service Criteria. We maintain continuous monitoring of security controls.

### Q: Do you have ISO 27001 certification?
**A:** ISO 27001 certification is planned for future implementation. We follow ISO 27001 standards for information security management.

### Q: What sub-processors do you use?
**A:** Settler engages the following sub-processors:
- **Infrastructure:** AWS, Vercel, Supabase, Upstash
- **Services:** Stripe, Resend, OpenAI (opt-in)

All sub-processors undergo security and privacy diligence. Data Processing Agreements (DPAs) are maintained with all sub-processors handling customer data. See `/legal/subprocessors` for complete list.

### Q: Where is customer data stored?
**A:** Customer data is stored in AWS regions:
- **US Customers:** US regions (us-east-1, us-west-2)
- **EU Customers:** EU regions (eu-west-1, eu-central-1)

Enterprise customers can request specific data residency regions.

### Q: Is data transferred outside the EU?
**A:** For EU customers, data is processed in EU regions. Data is not transferred outside the EU without customer consent. Standard Contractual Clauses (SCCs) are used for any necessary transfers.

## Data Retention & Deletion

### Q: How long is customer data retained?
**A:** Customer data is retained while the account is active. Deleted accounts have a 30-day grace period before hard deletion. Audit logs are retained for 7 years.

### Q: How is data deleted?
**A:** Data deletion follows a two-phase process:
1. **Soft Delete:** Data is immediately marked as deleted
2. **Hard Delete:** Data is permanently deleted after 30-day grace period

Deletion operations are logged and verified. Backups are deleted after retention period.

### Q: Can customers export their data?
**A:** Yes. Full account data export is available via `GET /api/v1/tenant/data-export` (JSON or CSV). User-specific exports are available via `GET /api/v1/users/:id/data-export`.

### Q: Is deleted data recoverable?
**A:** During the 30-day grace period, deleted data can be recovered. After hard deletion, data cannot be recovered. Backups are deleted after retention period.

## Incident Response

### Q: What is your incident response process?
**A:** Settler's incident response process:
1. Detection and initial assessment within 1 hour
2. Containment and mitigation actions immediately
3. Root cause analysis and impact assessment
4. Customer notification within 72 hours for incidents affecting customer data
5. Post-incident review and process improvements

### Q: How are security incidents communicated?
**A:** Security incidents are reported to security@settler.dev. Status updates are posted at https://settler.dev/status. Enterprise customers receive direct notification via account contacts.

### Q: Do you have a responsible disclosure program?
**A:** Yes. Security vulnerabilities can be reported to security@settler.dev. Security.txt file is available at `/.well-known/security.txt`. Bug bounty program is planned.

## Business Continuity & Availability

### Q: What is your uptime SLA?
**A:** Settler provides the following SLAs:
- **API Availability:** 99.9%
- **Console Availability:** 99.5%
- **Data Processing:** 99.95%

Enterprise customers can negotiate custom SLAs.

### Q: What is your backup strategy?
**A:** Settler implements:
- Automated daily full backups
- Continuous point-in-time recovery (PITR)
- Multi-region backup replication
- Encrypted backups with separate keys
- 30-day retention (extendable for enterprise)

### Q: What are your recovery objectives?
**A:** 
- **RPO (Recovery Point Objective):** 5 minutes
- **RTO (Recovery Time Objective):** 1 hour

Recovery procedures are tested quarterly.

### Q: Do you have a disaster recovery plan?
**A:** Yes. Settler maintains a comprehensive disaster recovery plan with:
- Multi-region backups
- Automated failover procedures
- Regular testing and validation
- Documented recovery procedures

## Change Management

### Q: How are changes to the system managed?
**A:** All changes go through:
- Code review and automated testing
- Staged deployments (dev → staging → production)
- Canary deployments for high-risk changes
- Automated rollback on error detection
- Post-deployment monitoring

### Q: How are customers notified of changes?
**A:** Changes are communicated via:
- Changelog at `/changelog`
- Email notifications for critical changes
- Breaking changes announced 30 days in advance
- Enterprise customers receive direct communication

### Q: Do you have a change management process?
**A:** Yes. Settler maintains documented change management procedures with:
- Change request process
- Risk assessment
- Approval workflows
- Rollback procedures
- Change communication

## Security Testing

### Q: Do you perform security testing?
**A:** Yes. Settler performs:
- Weekly automated vulnerability scanning
- Code review for all changes
- Security tests in CI/CD pipeline
- Annual penetration testing (planned)
- Regular security audits

### Q: Do you perform penetration testing?
**A:** Annual penetration testing is planned. Previous test results are available for enterprise customers under NDA.

### Q: How are vulnerabilities managed?
**A:** Vulnerabilities are:
- Tracked in a vulnerability management system
- Prioritized by severity
- Patched within 48 hours for critical vulnerabilities
- Communicated to customers when applicable

## Vendor Management

### Q: How are vendors/sub-processors evaluated?
**A:** All vendors/sub-processors undergo:
- Security and privacy diligence
- Review of security certifications
- Assessment of data handling practices
- Contract review including DPAs

### Q: How are vendor relationships managed?
**A:** Vendor relationships are managed through:
- Regular security reviews
- Contract compliance monitoring
- Incident notification procedures
- Vendor security questionnaires

## Employee Security

### Q: What security training do employees receive?
**A:** Employees receive:
- Security awareness training upon hire
- Annual security training
- Privacy training
- Incident response training

### Q: How is employee access to customer data controlled?
**A:** Employee access to customer data is:
- Restricted to authorized personnel only
- Logged and monitored
- Reviewed regularly
- Revoked upon termination

### Q: Do employees sign confidentiality agreements?
**A:** Yes. All employees sign confidentiality agreements covering customer data and proprietary information.

## Insurance & Liability

### Q: Do you have cyber liability insurance?
**A:** Yes. Settler maintains cyber liability insurance. Details available for enterprise customers under NDA.

### Q: What is your liability limit?
**A:** Liability limits are specified in our Terms of Service and can be negotiated for enterprise customers.

## Additional Questions

### Q: Can we conduct our own security assessment?
**A:** Yes. Enterprise customers can conduct security assessments with advance notice. Contact enterprise@settler.dev to schedule.

### Q: Do you provide security documentation?
**A:** Yes. Security documentation is available:
- `/docs/SECURITY.md` - Security posture
- `/docs/PRIVACY_MODEL.md` - Privacy model
- `/security` - Public security page
- `/trust` - Trust and reliability page

### Q: Can we request custom security controls?
**A:** Yes. Enterprise customers can request custom security controls. Contact enterprise@settler.dev to discuss.

### Q: Do you provide compliance reports?
**A:** Yes. Enterprise customers can request:
- Monthly uptime reports
- Incident post-mortems
- Security audit summaries
- Change management logs
- Backup verification reports

## Contact Information

**Security Issues:** security@settler.dev  
**Privacy Inquiries:** privacy@settler.dev  
**Enterprise Sales:** enterprise@settler.dev  
**General Support:** support@settler.dev

## Document Control

This document is reviewed and updated quarterly. Enterprise customers will be notified of material changes.

**Document Owner:** Security Team  
**Review Frequency:** Quarterly  
**Next Review:** April 2025
