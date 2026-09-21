# Procurement FAQ

**Last reviewed:** 2026-09-21
**Evidence rule:** Answers describe repository evidence and known gaps; contract terms and
deployment behavior require separate written confirmation.

## What does Settler do?

Settler performs deterministic reconciliation across financial data sources, routes exceptions for
operator review, and can generate replayable evidence artifacts.

## Is Settler production certified?

No. A passing repository build is not a certification. No SOC 2, ISO 27001, PCI, HIPAA, GDPR, or
CCPA certification or legal opinion is registered in the evidence room.

## How is tenant data isolated?

The codebase uses required tenant identifiers, tenant-scoped SQL checks, route authorization, and
RLS definitions. Static coverage and application guard tests pass. Live database verification must
be run for the contracted environment; the configured target was credential-blocked on 2026-09-21.
See [`TENANT_ISOLATION_VERIFICATION.md`](TENANT_ISOLATION_VERIFICATION.md).

## What authentication is supported?

API key and JWT paths exist. OIDC environment contracts exist but require provider-specific
configuration and end-to-end validation. SCIM is not shipped. Run
`pnpm run verify:enterprise-identity` and `pnpm run verify:scim-posture` for current repository
posture.

## What security evidence is available?

- full repository gate: `pnpm verify`;
- tenant route coverage: `pnpm run verify:tenant`;
- cross-tenant application tests: `pnpm run test:cross-tenant`;
- dependency audit: `pnpm run audit:deps` with pnpm audit and OSV;
- live RLS harness: `pnpm run verify:rls:live` (currently not passing against the configured target);
- security posture: `pnpm run verify:security:fast` (conditional while live RLS and authenticated
  advisory evidence are absent).

## Are penetration-test or compliance reports available?

No completed independent penetration-test report or compliance certification is registered. Do not
represent readiness documentation as third-party assurance.

## What are the uptime, support, retention, deletion, residency, and recovery commitments?

These are not universal repository guarantees. They must be specified in an executed order form,
MSA, DPA, and SLA for the selected deployment, then supported by target-environment monitoring,
restore tests, and operational evidence.

## Is customer data used for model training?

No universal statement is authorized without the executed data terms and deployed provider
configuration. Optional AI boundaries must be documented for the customer and remain separate from
the deterministic reconciliation path.

## What should a buyer request?

1. The current due-diligence index.
2. A target-environment security and RLS evidence run.
3. The proposed architecture and subprocessor list for that deployment.
4. Executed commercial and data-processing terms.
5. Recovery, incident, and support commitments with named owners.

Use [`DUE_DILIGENCE.md`](DUE_DILIGENCE.md) and the private evidence register as the source of truth.
The superseded FAQ is archived for provenance and is not approved collateral.
