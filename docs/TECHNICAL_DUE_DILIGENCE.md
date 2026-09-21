# Technical Due Diligence Boundary

**As of:** 2026-09-21

Settler's technical diligence position is evidence-led and unscored. Self-assigned readiness scores
are not used.

## Verified repository properties

- TypeScript lint, strict type checks, builds, tests, route contracts, and policy gates pass through
  `pnpm verify`.
- Deterministic fixture output, replay, and proofpack contracts have dedicated verification commands.
- Tenant-scoped route coverage is 421/421 in the latest local run.
- The current lockfile passes pnpm audit and OSV after upgrading Vite and removing an unused
  vulnerable load-test dependency.

## Partial evidence

- RLS definitions are present, but current live target verification is credential-blocked.
- Enterprise identity has configuration contracts; provider-specific end-to-end evidence is absent.
- Recovery, rollback, SLO, and incident controls require observations from the deployed target.
- Dependency scanning is clean locally; authenticated Dependabot completeness is not available in
  the current environment.

## Missing external evidence

- independent penetration test;
- production restore and disaster-recovery exercise;
- third-party compliance assessment or certification;
- buyer-approved performance and scale observations; and
- counsel-reviewed IP, license, and data-rights conclusions.

Use `docs/DUE_DILIGENCE.md`, `docs/SYSTEM_GUARANTEES.md`, and
`docs/TENANT_ISOLATION_VERIFICATION.md` for the current evidence boundary. Historical technical
self-assessments are archived under `docs/archive/2026-09-21-evidence-audit/`.
