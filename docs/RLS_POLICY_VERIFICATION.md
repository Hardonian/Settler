# RLS Policy Verification Guide

This document describes Row Level Security (RLS) policies for tenant isolation and provides example SQL queries to verify they work correctly.

## Overview

All tables with `tenant_id` columns have RLS enabled to ensure:
- Users can only read/write their tenant's rows
- Service role bypass is server-only (never exposed to client)
- Cross-tenant data leakage is prevented

## Key Tables with RLS

### 1. `billing_accounts`
- **Policy**: `billing_accounts_user_access`
- **Rule**: Users can access their own billing account OR if tenant_id matches current tenant
- **Verification Query**:
```sql
-- As authenticated user, should only see own billing account
SELECT * FROM billing_accounts;

-- As service role (server-side), can see all
SET ROLE service_role;
SELECT * FROM billing_accounts;
RESET ROLE;
```

### 2. `usage_events`
- **Policy**: `usage_events_billing_account_access`
- **Rule**: Users can access usage events for billing accounts they own
- **Verification Query**:
```sql
-- As authenticated user
SELECT ue.*, ba.user_id, ba.tenant_id 
FROM usage_events ue
JOIN billing_accounts ba ON ba.id = ue.billing_account_id;

-- Should only return events for user's billing accounts
```

### 3. `api_keys`
- **Policy**: `api_keys_user_access`
- **Rule**: Users can access their own API keys OR keys within their tenant
- **Verification Query**:
```sql
-- As authenticated user
SELECT * FROM api_keys WHERE user_id = auth.uid();

-- Should only return own keys
```

### 4. `audit_log`
- **Policy**: `Users can read their tenant's audit logs`
- **Rule**: Users can read audit logs for their tenant
- **Verification Query**:
```sql
-- As authenticated user
SELECT * FROM audit_log 
WHERE tenant_id IN (
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
);
```

## Helper Functions

### `current_user_id()`
Returns the current user ID from JWT claims.

### `current_tenant_id()`
Returns the current tenant ID from app settings (set by middleware).

## Testing RLS Policies

### Test as Regular User
```sql
-- Set user context (simulate authenticated user)
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';

-- Try to access data
SELECT * FROM billing_accounts;
-- Should only return rows where user_id matches OR tenant_id matches
```

### Test as Service Role
```sql
-- Switch to service role (server-side only)
SET ROLE service_role;

-- Should be able to access all data
SELECT * FROM billing_accounts;

-- Reset role
RESET ROLE;
```

## Security Notes

1. **Service Role**: Only use `service_role` on the server-side (never expose to client)
2. **Tenant Isolation**: All policies check `tenant_id` to prevent cross-tenant access
3. **User Isolation**: Policies also check `user_id` for user-specific data
4. **Audit Logging**: All RLS policy changes are logged in `audit_log` table

## Common Issues

### Issue: User can't see their own data
**Solution**: Check that `current_user_id()` returns correct UUID and that `user_id` column matches.

### Issue: Cross-tenant data leakage
**Solution**: Verify `current_tenant_id()` is set correctly and that policies check `tenant_id`.

### Issue: Service role queries fail
**Solution**: Ensure `SET ROLE service_role` is used only server-side, never in client code.
