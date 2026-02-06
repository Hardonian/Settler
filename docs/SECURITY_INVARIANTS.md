# Security Invariants

## Tenant Isolation

### Invariant 1: Every data access must be scoped to a tenant

**Statement:** All queries against tenant-scoped tables must include a valid `tenantId` that is enforced through RLS policies.

**Enforcement Points:**

1. **Compile-time enforcement** (TypeScript):
   - File: `packages/api/src/domain/repositories/IJobRepository.ts`
   - All methods require `tenantId` as a parameter
   - Type signature changes prevent accidental omission

2. **Runtime enforcement** (JavaScript):
   - File: `packages/api/src/db/index.ts` - `queryWithTenant()` function
   - Validates `tenantId` is a valid UUID before executing query
   - Throws `TENANT ISOLATION VIOLATION` error if validation fails

3. **Database enforcement** (PostgreSQL RLS):
   - Files:
     - `packages/api/src/db/migrations/multi-tenancy.sql` (lines 161-247)
     - `supabase/migrations/20260131000001_rls_policy_completion.sql`
   - RLS policies filter all queries by `current_tenant_id()` session variable
   - Triggers automatically propagate tenant_id to child tables

**Functions that enforce:**

- `queryWithTenant(tenantId, text, params)` - packages/api/src/db/index.ts:70
- `transactionWithTenant(tenantId, callback)` - packages/api/src/db/index.ts:114
- `TenantContext.setTenantContext(client, tenantId)` - packages/api/src/infrastructure/tenancy/TenantContext.ts:15

**Deprecated (unsafe) functions:**

- `query(text, params)` - packages/api/src/db/index.ts:48 ⚠️ **DEPRECATED**
  - Bypasses RLS unless tenant context is manually set
  - Logs warning in development mode
  - Only use for: admin operations, migrations, tenant creation

### Invariant 2: Cross-tenant access must be impossible

**Statement:** A user authenticated in Tenant A cannot read, modify, or delete data belonging to Tenant B.

**Enforcement Points:**

1. **Repository Layer:**
   - File: `packages/api/src/infrastructure/repositories/JobRepository.ts`
   - All methods use `queryWithTenant()` which sets RLS context
   - Example: `findById(id, tenantId, userId)` passes tenantId to query layer

2. **Middleware Layer:**
   - File: `packages/api/src/middleware/tenant.ts`
   - Extracts tenant from JWT claims, custom domain, subdomain, or header
   - Validates tenant is active (not suspended/cancelled)
   - Sets `req.tenantId` for downstream use

3. **Database Layer:**
   - RLS policies use `tenant_id = current_tenant_id()` predicate
   - Even with raw SQL access, data is filtered by current tenant context
   - Example policy from multi-tenancy.sql:
   ```sql
   CREATE POLICY tenant_isolation_jobs ON jobs
     USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
   ```

**Test Coverage:**

- File: `packages/api/src/__tests__/multi-tenancy/cross-tenant-prevention.test.ts`
- Tests verify:
  - Tenant B cannot read Tenant A's jobs (returns null/empty)
  - Tenant B cannot update Tenant A's jobs (0 rows affected)
  - Tenant B cannot delete Tenant A's jobs (0 rows affected)
  - SQL injection attempts bypassing RLS fail
  - Invalid/missing tenantId throws enforcement error

### Invariant 3: Tenant context must be set on every connection

**Statement:** Every database connection used for tenant-scoped queries must have tenant context set via `SET LOCAL app.current_tenant_id`.

**Enforcement Points:**

1. **TenantContext Class:**
   - File: `packages/api/src/infrastructure/tenancy/TenantContext.ts`
   - `setTenantContext(client, tenantId)` - Sets session variable
   - `clearTenantContext(client)` - Resets after query (defense in depth)
   - `withTenantContext()` - Wrapper for automatic cleanup

2. **Connection Pool:**
   - File: `packages/api/src/infrastructure/tenancy/TenantConnectionPool.ts`
   - `getConnection(tenantId)` - Automatically sets context on connect
   - `query(tenantId, text, params)` - One-shot query with context
   - `transaction(tenantId, callback)` - Transaction with context

**Audit Trail:**

- All queries log tenant context in audit_logs table
- Failed tenant validation is logged with stack trace in development

## Data Integrity

### Invariant 4: Reconciliation results must be deterministic

**Statement:** Given the same source and target data, the reconciliation algorithm must produce identical results.

**Enforcement:**

- Deterministic sorting in matching algorithms
- Version-controlled rulesets
- Immutable execution records

### Invariant 5: No hard deletes of tenant data

**Statement:** Tenant data must use soft deletes (`deleted_at` timestamp) to maintain audit trail and enable recovery.

**Enforcement Points:**

- RLS policies check `deleted_at IS NULL`
- All DELETE operations are converted to UPDATE operations
- Cleanup jobs run only after retention period expires

## Authentication & Authorization

### Invariant 6: All API requests must be authenticated

**Statement:** Every request to protected endpoints must have a valid JWT or API key.

**Enforcement Points:**

- File: `packages/api/src/middleware/auth.ts`
- Validates JWT signature and expiration
- Validates API key against hash in database
- Sets `req.userId` for downstream authorization

### Invariant 7: API keys must be scoped to a tenant

**Statement:** API keys belong to a user, and users belong to a tenant. Access via API key is implicitly scoped.

**Enforcement:**

- API key lookup joins to users table
- User's tenant_id is extracted and used for RLS
- API keys can have additional scope restrictions (read-only, etc.)

## Testing Requirements

### Cross-Tenant Isolation Test Suite

**Location:** `packages/api/src/__tests__/multi-tenancy/cross-tenant-prevention.test.ts`

**Critical Tests:**

1. `should prevent tenant B from accessing tenant A job via repository` - Verifies repository layer isolation
2. `should filter data by tenant context in raw queries` - Verifies RLS enforcement
3. `should prevent direct cross-tenant access via SQL injection attempt` - Verifies RLS is injection-proof
4. `should reject queries without valid tenantId` - Verifies runtime parameter validation
5. `should enforce tenant isolation in UPDATE operations` - Verifies mutation isolation
6. `should enforce tenant isolation in DELETE operations` - Verifies deletion isolation

**Verification Command:**

```bash
RUN_DB_TESTS=true pnpm --filter @settler/api test -- cross-tenant-prevention
```

**Expected Behavior:**

- All tests pass with enforcement enabled
- At least one test FAILS if enforcement is removed (this proves the tests are valid)

## Migration Guide

### For Repository Authors

When creating a new repository:

1. Extend `TenantScopedRepository` (preferred):

```typescript
import { TenantScopedRepository } from "../tenancy/TenantEnforcement";

export class MyRepository extends TenantScopedRepository {
  async findById(id: string): Promise<MyEntity | null> {
    // tenantId is already validated and available as this.tenantId
    const results = await this.query("SELECT * FROM my_table WHERE id = $1", [id]);
    return results[0] || null;
  }
}
```

2. Or use `queryWithTenant` directly:

```typescript
import { queryWithTenant } from "../../db";

export async function getEntity(tenantId: string, id: string) {
  return queryWithTenant(tenantId, "SELECT * FROM my_table WHERE id = $1", [id]);
}
```

### ❌ Never Do This

```typescript
// DANGEROUS: Bypasses RLS
import { query } from "../../db";

export async function getEntity(id: string) {
  return query("SELECT * FROM my_table WHERE id = $1", [id]); // NO TENANT SCOPE!
}
```

## Incident Response

If tenant isolation is suspected to be compromised:

1. **Immediate:** Disable affected endpoints
2. **Investigate:** Check audit_logs for cross-tenant queries
3. **Verify:** Run `cross-tenant-prevention.test.ts` to confirm isolation
4. **Remediate:** Fix any bypasses found
5. **Communicate:** Notify affected tenants per SLA

## Compliance

These invariants satisfy:

- SOC 2 Type II multi-tenancy requirements
- GDPR data isolation (Article 32)
- PCI-DSS scope reduction via tenant isolation
