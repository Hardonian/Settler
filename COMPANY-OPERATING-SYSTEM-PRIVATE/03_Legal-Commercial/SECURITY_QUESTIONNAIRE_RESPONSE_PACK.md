# Security Questionnaire Response Pack (Reusable)

## Truth source references

- Tenant isolation and RLS: `docs/security/RLS_VERIFICATION.md`
- Security model: `docs/security/VERIFICATION_MODEL.md`
- API route/security surfaces: `docs/api/route-classes.md`

## Standard response blocks

### AuthN/AuthZ

Settler uses authenticated access controls and tenant-scoped authorization controls with route-level and data-level protections.

### Tenant isolation

Tenant data is partitioned and guarded by application and database controls. Cross-tenant access is prohibited by policy and verification checks.

### Logging/Audit

Operational and security-relevant events are logged for investigation and audit support.

### Backups/Recovery

Backups and recovery posture follow current infrastructure capabilities; RTO/RPO commitments must match signed contract language only.

### Data handling

Customer data is processed for service delivery and retained per contract/policy terms.

### Monitoring

Service health and error monitoring are active; incident handling follows runbooks.

## Explicit not-yet-supported language

Use: "Not currently supported in standard offering" instead of implied roadmap commitments.
