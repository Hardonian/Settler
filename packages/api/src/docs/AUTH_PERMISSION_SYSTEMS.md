# Authentication and Authorization Systems

This document describes the three permission systems used in the Settler API and when each applies.

## Overview

The Settler API uses three distinct authorization mechanisms:

1. **Permission-Based Authorization** (Recommended)
2. **Role-Based Access Control (RBAC)**
3. **Status-Based Authorization**

---

## 1. Permission-Based Authorization (Recommended)

**Location**: `packages/api/src/infrastructure/security/Permissions.ts`

**Description**: Granular permissions using the `Permission` enum. Routes use `requirePermission()` middleware to enforce specific permissions.

**Usage**:

```typescript
import { requirePermission } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";

// Route-level permission enforcement
router.get("/dashboards/usage", requirePermission(Permission.REPORTS_READ), async (req, res) => {
  /* ... */
});
```

**Permission Types**:

- `jobs:read`, `jobs:write`, `jobs:delete`, `jobs:execute`
- `reports:read`, `reports:export`
- `webhooks:read`, `webhooks:write`, `webhooks:delete`
- `users:read`, `users:write`, `users:delete`
- `tenant:read`, `tenant:write`, `tenant:delete`, `tenant:billing`
- `admin:read`, `admin:write`, `admin:audit`
- `edge:aias:access`, `edge:models:read`, `edge:nodes:read`, `edge:nodes:write`
- `operator:read`, `operator:write`

**When to Use**: All new routes should use permission-based authorization for fine-grained access control.

---

## 2. Role-Based Access Control (RBAC)

**Location**: `packages/api/src/domain/entities/User.ts`

**Description**: User roles that define broad access levels within a tenant. Roles are stored in the `users.role` field.

**Roles**:

- `OWNER` - Full access to all tenant resources
- `ADMIN` - Administrative access with some owner privileges
- `DEVELOPER` - Developer access to jobs and webhooks
- `VIEWER` - Read-only access

**Usage**:

```typescript
import { UserRole } from "../domain/entities/User";

// Check role directly
if (user.role === UserRole.OWNER) {
  // Grant owner access
}

// RBAC is also used by PermissionChecker internally
const hasAccess = PermissionChecker.hasPermission(userRole, scopes, requiredPermission);
```

**When to Use**:

- Legacy routes that haven't been migrated to permission-based auth
- Cross-tenant impersonation checks (only OWNER/ADMIN can impersonate)
- Role-specific features (e.g., billing only for OWNER)

---

## 3. Status-Based Authorization

**Description**: Resource status checks for lifecycle management. Used for state machine transitions.

**Examples**:

```typescript
// Job status checks
if (job.status === "running") {
  return res.status(409).json({ error: "Job is already running" });
}

// Tenant status checks in middleware
if (tenant.status === "suspended" || tenant.status === "cancelled") {
  return res.status(403).json({ error: "Tenant suspended" });
}

// Exception status
if (exception.status === "resolved") {
  // Cannot modify resolved exceptions
}
```

**When to Use**:

- Preventing invalid state transitions
- Enforcement of resource lifecycle rules
- Graceful degradation for suspended tenants

---

## Request Interface Hierarchy

The middleware defines a hierarchy of request types:

```
AuthRequest
  └── tenantId?: string (from auth middleware)
  └── userId?: string

TenantRequest extends AuthRequest
  └── tenant?: { id, name, slug, status, tier }

AuthorizedRequest extends TenantRequest
  └── permissions?: Permission[] (populated by requirePermission)
```

**Choosing the Right Type**:

- Use `AuthRequest` for routes that only need authentication (no tenant required)
- Use `TenantRequest` for routes that need full tenant context
- Use `AuthorizedRequest` when you need permission checks

---

## Tenant Resolution

**API Layer** (`packages/api/src/middleware/tenant.ts`):

1. Check custom domain
2. Check subdomain
3. Check `X-Tenant-ID` header
4. Fall back to user's tenant from auth token

**Web Layer** (`packages/web/src/lib/supabase/tenant-membership.ts`):

1. Query `tenant_users` table for user's tenant memberships
2. Use first tenant or require explicit tenant selection

**Security Note**: Always use `tenant_id` for multi-tenant queries, never `user_id`.

---

## Best Practices

1. **Always use `requirePermission`** for new routes
2. **Filter queries by `tenant_id`** - never rely on user_id for tenant isolation
3. **Check tenant status** before allowing operations on suspended/cancelled tenants
4. **Use the middleware chain**: `authMiddleware` → `tenantMiddleware` → `requirePermission`
5. **Log unauthorized access attempts** for security auditing

---

## Migration Guide

To migrate from role-based to permission-based:

1. Identify the required permission(s) for the route
2. Add `requirePermission(Permission.XXX)` to the route
3. Ensure the route uses `TenantRequest` or `AuthorizedRequest`
4. Change any `userId` queries to use `tenantId` instead
5. Test with different roles to verify permission enforcement
