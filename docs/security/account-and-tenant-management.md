# Account and Tenant Management Security

## Security Goals

- strict tenant isolation
- deterministic role enforcement
- auditable account lifecycle actions
- no silent privilege expansion

## Tenant Resolution

For control-plane and export surfaces, tenant identity is resolved in this order:

1. API key auth context (`authenticateApiKey`)
2. Session user mapping via billing account (`billingAccount.tenantId`)

If tenant resolution fails, APIs return unauthorized responses.

## Role Model

Target roles:

- viewer
- developer
- operator
- admin
- enterprise admin

Each privileged mutation must validate role and, when required, privileged approval metadata.

## Isolation Controls

- Every data query for tenant resources must include `tenantId` predicate.
- Tenant IDs must be included in cache keys for shared stores.
- Admin impersonation paths must validate source/target tenant boundaries.
- Export/report generation must remain tenant-constrained.

## API Key Security

Required capabilities:

- creation with scoped permissions
- rotation
- revocation
- usage monitoring
- audit logging

Key material is never returned in full after creation; UI/API surfaces return masked prefixes only.

## Audit Requirements

Capture and retain account and tenant security events:

- login events
- API key lifecycle events
- configuration/policy changes
- privileged operations
- remediation actions

All events should include actor identity, tenant, timestamp, and trace identifiers.
