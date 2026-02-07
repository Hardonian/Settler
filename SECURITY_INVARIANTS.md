# Security Invariants: Tenant Isolation

This document states the exact tenant isolation invariants enforced in the Settler API
and where each is mechanically checked. Nothing here is aspirational — every claim is
backed by code that throws, rejects, or blocks if violated.

---

## Tenancy Key

| Key                | Origin                                                                    | Set by                                                       |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `tenant_id` (UUID) | JWT claim, API key lookup, `X-Tenant-ID` header, subdomain, custom domain | `tenantMiddleware` (`packages/api/src/middleware/tenant.ts`) |

The middleware resolves `req.tenantId` before any route handler executes.
If no tenant can be determined, the request is rejected with **403**.

---

## Invariants

### INV-1: Every repository method requires `tenantId`

**Where:** `IUserRepository`, `IJobRepository` interfaces
(`packages/api/src/domain/repositories/`)

Every read/write method signature includes a mandatory `tenantId: string` parameter.
TypeScript compilation fails if a caller omits it.

**Runtime guard:** Each repository implementation throws `Error('tenantId is required …')`
if `tenantId` is falsy at the top of every method.

### INV-2: Every SQL query on tenant-scoped tables includes `tenant_id` in WHERE

**Where:** `UserRepository`, `JobRepository`, `ReconciliationMatcher`, `AuditTrail`

All `SELECT`, `UPDATE`, `DELETE` queries contain `AND tenant_id = $N`.
The `assertTenantScoped()` guard in `packages/api/src/db/index.ts` enforces this at
runtime for all queries made via `tenantScopedQuery()`. In development/test it
**throws**; in production it **logs a warning**.

**Tables enforced:**
`users`, `jobs`, `executions`, `matches`, `unmatched`, `reports`, `webhooks`,
`api_keys`, `webhook_payloads`, `audit_logs`, `idempotency_keys`, `tenant_usage`,
`tenant_quota_usage`, `normalized_transactions`, `reconciliation_runs`,
`reconciliation_matches`, `audit_exports`, `alert_rules`, `alert_history`

### INV-3: Row-Level Security (RLS) is enabled on all tenant-scoped tables

**Where:** `packages/api/src/db/migrations/multi-tenancy.sql`

PostgreSQL RLS policies use `current_setting('app.current_tenant_id')` to filter rows.
RLS is the defense-in-depth layer — even if application code had a bug, the database
itself prevents cross-tenant row access when tenant context is set.

### INV-4: Tenant context propagation via DB triggers

**Where:** `packages/api/src/db/migrations/multi-tenancy.sql` (triggers section)

`BEFORE INSERT OR UPDATE` triggers on `jobs`, `executions`, `matches`, `unmatched`,
`reports`, `webhooks`, `api_keys`, `idempotency_keys` automatically propagate
`tenant_id` from parent records if not explicitly set. This prevents orphaned rows
without tenant context.

### INV-5: Cross-tenant save is rejected at the entity level

**Where:** `UserRepository.save()`, `JobRepository.create()`

If an entity's `tenantId` does not match the scoped `tenantId` passed to the method,
the operation throws `Error('Tenant mismatch')`. This prevents a compromised or buggy
caller from writing data into a foreign tenant.

### INV-6: Service layer enforces tenantId on every operation

**Where:** `UserService`, `JobService`
(`packages/api/src/application/services/`)

All service methods (`createUser`, `getUserById`, `deleteUser`, `createJob`, `getJob`,
`listJobs`, `updateJob`, `deleteJob`) require `tenantId`. They throw immediately if
it's missing, before touching any repository.

### INV-7: Authorization middleware double-checks tenant membership

**Where:** `packages/api/src/middleware/authorization.ts`

`requirePermission()` and `requireAnyPermission()` both verify the user belongs to the
current tenant (`WHERE u.id = $1 AND u.tenant_id = $3`). If the user is not a member
of the resolved tenant, the request gets **403 Forbidden**.

### INV-8: Audit trail queries are tenant-scoped

**Where:** `packages/api/src/services/audit-trail.ts`

`getAuditLogs()` always includes `tenant_id = $1` as the first WHERE condition.
The where clause can never be empty. `getAuditExport()` filters by `tenant_id = $2`.

### INV-9: Reconciliation matching is tenant-scoped

**Where:** `packages/api/src/services/ingestion/reconciliation-matcher.ts`

`matchTransaction()` requires `tenantId` and adds `AND tenant_id = $2` to all
transaction lookups. `getSourceAdapter()` is also tenant-scoped. This prevents
cross-tenant transaction matching.

---

## Test Coverage

| Test file                                                   | What it proves                                                                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__tests__/multi-tenancy/tenant-isolation-enforced.test.ts` | Guard rails on every repo method, cross-tenant save rejection, assertTenantScoped catches unscoped queries, matchTransaction/getAuditLogs reject missing tenantId |
| `__tests__/multi-tenancy/tenant-isolation.test.ts`          | RLS enforcement with two live tenants, cross-tenant read returns empty                                                                                            |

---

## How to Verify

```bash
# Run isolation tests (unit — no DB required)
npx jest --testPathPattern=tenant-isolation-enforced

# Run full RLS tests (requires database)
RUN_DB_TESTS=true npx jest --testPathPattern=tenant-isolation

# Build — TypeScript will catch any caller that omits tenantId
npm run build
```
