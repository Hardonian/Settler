# Authentication & Authorization Guide

## Overview

Settler uses Supabase Auth for authentication with role-based access control (RBAC) and subscription-based feature gating.

## Authentication Methods

### Session-Based Auth (Web UI)
- Uses Supabase session cookies
- Automatic token refresh
- Server-side session validation

### API Key Auth (Programmatic Access)
- Bearer token authentication
- Long-lived tokens
- Managed via Developer Console

## Access Control

### Console Access Levels

1. **Unauthenticated**: Redirected to `/signup`
2. **Authenticated (Unsubscribed)**: Redirected to `/pricing`
3. **Authenticated (Subscribed)**: Full console access
4. **Super Admin**: Full access + tenant observability

### Role-Based Access Control

#### User Roles
- `USER` - Standard user
- `ADMIN` - Tenant admin
- `SUPER_ADMIN` - System admin

#### Super Admin Detection
- Role in `auth.users.raw_user_meta_data.role`
- Email domain `@settler.dev`

## Implementation

### Server-Side Auth Gate

```typescript
import { requireConsoleAccess } from '@/lib/auth/console-gate';

export default async function ConsoleLayout({ children }) {
  await requireConsoleAccess(); // Redirects if not authenticated/subscribed
  return <>{children}</>;
}
```

### API Route Protection

```typescript
import { requireConsoleApiAccess } from '@/lib/api/console-auth';

export async function GET(request: NextRequest) {
  const authCheck = await requireConsoleApiAccess(request);
  if (authCheck) return authCheck; // Returns 401/403 if unauthorized
  
  // Handle request...
}
```

### Super Admin Check

```typescript
import { isSuperAdmin, requireSuperAdmin } from '@/lib/auth/super-admin';

// Check without throwing
const isAdmin = await isSuperAdmin();

// Check with error
await requireSuperAdmin(); // Throws if not super admin
```

## Subscription Gating

### Subscription Status

```typescript
import { getSubscriptionStatus } from '@/lib/get-subscription-status';

const status = await getSubscriptionStatus();
// Returns: { tier, hasSubscription, isPaid, isEnterprise }
```

### Subscription Tiers
- `unsubscribed` - No subscription
- `free` - Free tier
- `starter` - Starter plan
- `professional` - Professional plan
- `enterprise` - Enterprise plan

## Security Best Practices

### Server-Side Validation
- Always validate auth server-side
- Never trust client-side checks alone
- Use middleware for route protection

### Error Handling
- Never expose sensitive errors
- Return generic error messages
- Log errors server-side only

### Token Management
- Use secure, HTTP-only cookies
- Implement token rotation
- Revoke tokens on logout

## Related Documentation

- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Security Documentation](../SECURITY.md)
