# System Control Boundaries

**Last reviewed:** 2026-09-21
**Status:** Repository controls verified; deployment guarantees require target-environment evidence

Settler does not make an unconditional availability, security, accuracy, delivery, or compliance
guarantee from repository evidence alone. Customer commitments belong in an executed agreement
and must be supported by observations from the contracted deployment.

## Verified repository controls

- Tenant-scoped repository methods and route coverage are checked by `pnpm run verify:tenant`.
- Cross-tenant application guard paths are checked by `pnpm run test:cross-tenant`.
- Deterministic matching is checked by `pnpm run verify:determinism`.
- Replay and proofpack behavior are checked by `pnpm run verify:replay` and
  `pnpm run verify:proofpack`.
- Build, lint, type, route, contract, and policy checks run through `pnpm verify`.

These results prove the tested code and fixtures. They do not prove the configuration or runtime
behavior of an untested deployment.

## Deployment-dependent controls

The following require current target-environment evidence before they can be represented as
guarantees:

- live PostgreSQL RLS policy presence and same-tenant/cross-tenant/anonymous behavior;
- authentication-provider configuration and end-to-end login;
- backup restoration, RPO, RTO, rollback, and incident response;
- webhook delivery, retry, and ordering observations;
- usage-meter completeness and billing reconciliation;
- availability, latency, throughput, and error-rate objectives; and
- encryption, residency, retention, and subprocessor configuration.

Run `pnpm run verify:rls:live` with authorized target credentials for live RLS evidence. The
2026-09-21 attempt against the configured target failed authentication and therefore produced no
live RLS proof.

## Explicit non-guarantees

- Reconciliation is not guaranteed to be 100% accurate.
- Evidence artifacts support review; they do not replace auditor judgment or certification.
- Service-role and database-administrator access remain privileged bypass paths that require
  operational controls.
- External systems, network availability, and source-data quality are outside the deterministic
  matching boundary.

## Claim rule

Use “verified” only with the command, artifact, environment, and observation date that support the
claim. If any of those are missing, describe the implementation or control objective instead of a
guarantee.
