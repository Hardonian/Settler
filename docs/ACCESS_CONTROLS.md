# Access Controls & Permissions

**Last Updated:** January 2025  
**Version:** 1.0

## Overview

This document maps roles to permissions and describes how access controls are enforced in Settler.

## Role Hierarchy

Settler implements a hierarchical role-based access control (RBAC) system with four roles:

### OWNER

- **Description:** Full access to tenant, including billing and deletion
- **Use Case:** Tenant creator, account owner
- **Special Permissions:** Can delete tenant, manage billing

### ADMIN

- **Description:** Full operational access, cannot delete tenant
- **Use Case:** Operations manager, team lead
- **Limitations:** Cannot delete tenant or manage billing

### DEVELOPER

- **Description:** Can create/manage jobs and integrations
- **Use Case:** Developer, integration specialist
- **Limitations:** Read-only access to tenant settings, cannot manage users

### VIEWER

- **Description:** Read-only access
- **Use Case:** Auditor, analyst
- **Limitations:** Cannot create or modify resources

## Permission Mapping

### Jobs Permissions

| Permission     | OWNER | ADMIN | DEVELOPER | VIEWER |
| -------------- | ----- | ----- | --------- | ------ |
| `JOBS_READ`    | ✅    | ✅    | ✅        | ✅     |
| `JOBS_WRITE`   | ✅    | ✅    | ✅        | ❌     |
| `JOBS_DELETE`  | ✅    | ✅    | ✅        | ❌     |
| `JOBS_EXECUTE` | ✅    | ✅    | ✅        | ❌     |

### Reports Permissions

| Permission       | OWNER | ADMIN | DEVELOPER | VIEWER |
| ---------------- | ----- | ----- | --------- | ------ |
| `REPORTS_READ`   | ✅    | ✅    | ✅        | ✅     |
| `REPORTS_EXPORT` | ✅    | ✅    | ✅        | ❌     |

### Webhooks Permissions

| Permission        | OWNER | ADMIN | DEVELOPER | VIEWER |
| ----------------- | ----- | ----- | --------- | ------ |
| `WEBHOOKS_READ`   | ✅    | ✅    | ✅        | ✅     |
| `WEBHOOKS_WRITE`  | ✅    | ✅    | ✅        | ❌     |
| `WEBHOOKS_DELETE` | ✅    | ✅    | ✅        | ❌     |

### Users Permissions

| Permission     | OWNER | ADMIN | DEVELOPER | VIEWER |
| -------------- | ----- | ----- | --------- | ------ |
| `USERS_READ`   | ✅    | ✅    | ✅        | ✅     |
| `USERS_WRITE`  | ✅    | ✅    | ❌        | ❌     |
| `USERS_DELETE` | ✅    | ❌    | ❌        | ❌     |

### Tenant Permissions

| Permission       | OWNER | ADMIN | DEVELOPER | VIEWER |
| ---------------- | ----- | ----- | --------- | ------ |
| `TENANT_READ`    | ✅    | ✅    | ❌        | ❌     |
| `TENANT_WRITE`   | ✅    | ✅    | ❌        | ❌     |
| `TENANT_DELETE`  | ✅    | ❌    | ❌        | ❌     |
| `TENANT_BILLING` | ✅    | ❌    | ❌        | ❌     |

### Admin Permissions

| Permission    | OWNER | ADMIN | DEVELOPER | VIEWER |
| ------------- | ----- | ----- | --------- | ------ |
| `ADMIN_READ`  | ✅    | ❌    | ❌        | ❌     |
| `ADMIN_WRITE` | ✅    | ❌    | ❌        | ❌     |
| `ADMIN_AUDIT` | ✅    | ✅    | ❌        | ❌     |

### Edge AI Permissions

| Permission         | OWNER | ADMIN | DEVELOPER | VIEWER |
| ------------------ | ----- | ----- | --------- | ------ |
| `EDGE_AIAS_ACCESS` | ✅    | ✅    | ✅        | ❌     |
| `EDGE_MODELS_READ` | ✅    | ✅    | ✅        | ✅     |
| `EDGE_NODES_READ`  | ✅    | ✅    | ✅        | ✅     |
| `EDGE_NODES_WRITE` | ✅    | ✅    | ✅        | ❌     |

## Permission Enforcement

### API Layer

- All API routes use `requirePermission` middleware
- Permissions are checked before request processing
- Unauthorized access attempts are logged in audit trail

### Database Layer

- Row-Level Security (RLS) policies enforce tenant isolation
- Queries are automatically filtered by tenant_id
- Users can only access data from their tenant

### UI Layer

- Components check permissions before rendering
- Actions are disabled for users without permissions
- Permission errors are displayed to users

## API Key Scopes

API keys can have custom scopes independent of user role:

- **Wildcard (`*`):** All permissions
- **Specific Permissions:** Comma-separated list (e.g., `jobs:read,jobs:write`)
- **Role-Based:** Inherit permissions from associated user role

## Tenant Isolation

### Database Level

- All tables have `tenant_id` column
- RLS policies filter by tenant_id
- No cross-tenant queries possible

### API Level

- `tenantMiddleware` extracts tenant context
- All queries include tenant_id filter
- No API endpoint can access multiple tenants

### Application Level

- Tenant context validated on every request
- User-tenant membership verified
- Cross-tenant access prevented

## Permission Checks

### Example: Job Creation

```typescript
// Route requires JOBS_WRITE permission
router.post("/jobs", requirePermission(Permission.JOBS_WRITE), async (req, res) => {
  // Permission check passed, process request
  // Query automatically filtered by req.tenantId
});
```

### Example: Tenant Deletion

```typescript
// Route requires TENANT_DELETE permission (OWNER only)
router.delete("/tenant/data", requirePermission(Permission.TENANT_DELETE), async (req, res) => {
  // Additional check: verify user is OWNER
  // Process deletion
});
```

## Audit Trail

All permission checks are logged:

- Successful authorization
- Failed authorization attempts
- Permission changes
- Role assignments

## Custom Permissions

Enterprise customers can request custom permissions. Contact enterprise@settler.dev to discuss.

## Implementation Details

### Code Location

- **Permission Definitions:** `packages/api/src/infrastructure/security/Permissions.ts`
- **Role Definitions:** `packages/api/src/domain/entities/User.ts`
- **Middleware:** `packages/api/src/middleware/authorization.ts`
- **Web Permissions:** `packages/web/src/shared/auth/roles.ts`

### Permission Check Flow

1. Request arrives at API
2. Authentication middleware validates user
3. Tenant middleware extracts tenant context
4. Authorization middleware checks permissions
5. Request processed if authorized
6. Audit log entry created

## Best Practices

1. **Least Privilege:** Grant minimum permissions necessary
2. **Regular Review:** Review user permissions quarterly
3. **Audit Logs:** Monitor permission changes
4. **Role-Based:** Use roles instead of individual permissions when possible
5. **API Keys:** Use scoped API keys for automation

## Troubleshooting

### Permission Denied Errors

- Check user role and permissions
- Verify tenant membership
- Review audit logs for failed attempts
- Contact support if issue persists

### Cross-Tenant Access Attempts

- Verify tenant context is set correctly
- Check RLS policies are enabled
- Review middleware configuration
- Report security issue if cross-tenant access succeeds

## Document Control

This document is reviewed and updated when permissions change.

**Document Owner:** Security Team  
**Review Frequency:** As needed  
**Last Updated:** January 2025
