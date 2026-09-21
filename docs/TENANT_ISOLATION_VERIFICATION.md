# Tenant Isolation Verification

**Last reviewed:** 2026-09-21
**Current evidence level:** Static and application-test evidence; live database evidence pending

## Control model

Settler uses layered tenant controls:

1. repository methods require `tenantId`;
2. tenant-scoped SQL is checked for a `tenant_id` predicate;
3. routes resolve membership and authorization before tenant data access;
4. tenant-scoped tables have RLS definitions in the migration set; and
5. cross-tenant negative paths are exercised in automated tests.

These layers reduce the likelihood that one application defect exposes another tenant's records.
They do not justify a deployment-wide absolute claim without a live database test in the target
environment.

## Current verified evidence

| Evidence                     | Command                             | Current boundary                                                               |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Tenant route coverage        | `pnpm run verify:tenant`            | Static control-presence check; latest run covered 421/421 tenant-scoped routes |
| Application guard tests      | `pnpm run test:cross-tenant`        | 36 passed; 11 DB-backed tests skip unless `RUN_DB_TESTS=true`                  |
| Repository and entity guards | `tenant-isolation-enforced.test.ts` | Missing tenant IDs and cross-tenant entity saves are rejected                  |
| Migration policy definitions | `pnpm run verify:security:fast`     | Static policy evidence only                                                    |
| Live RLS allow/deny matrix   | `pnpm run verify:rls:live`          | Not verified on 2026-09-21; configured target rejected authentication          |

## Live verification required for release evidence

An enterprise release must run the RLS harness with authorized, non-production test credentials
against the target schema. Passing evidence requires all of the following:

- RLS is enabled and at least one applicable policy exists on every critical tenant table;
- a same-tenant fixture is readable;
- a cross-tenant fixture is not readable;
- an unscoped/anonymous fixture is not readable; and
- the DB-backed cross-tenant suite runs without skipped tests.

```bash
pnpm run verify:rls:live
RUN_DB_TESTS=true pnpm run test:cross-tenant
```

Do not describe tenant isolation as complete, universal, or deployment-verified when either command
is skipped, credential-blocked, or failing.

## Privileged boundaries

Database owners, superusers, roles with `BYPASSRLS`, and service-role credentials can bypass RLS.
Their use must be restricted, logged, rotated, and covered by operational review. Operator-wide
views must use an explicit global scope and must not be presented as ordinary tenant access.

The normative engineering invariants remain in `SECURITY_INVARIANTS.md`.
