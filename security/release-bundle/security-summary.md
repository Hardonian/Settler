# Security Evidence Summary

- Commit SHA: 55784e8e3f84899d6d7bb916ea22ba5db063e396
- Timestamp: 2026-03-07T22:02:35.901Z
- CI Run ID: n/a
- Audit Policy Mode: warn
- Evidence Completeness: partial
- Header Contract Completeness: enforced-contract-satisfied
- Dependency Triage Completeness: blocked-missing-authenticated-input
- RLS Proof Level: static-only

## Snapshot

- Route registry total: 228
- Tenant-scoped verified: 160/160
- Cross-tenant test status: passed
- Header probe blocking failures: 0
- Header probe limited findings: 5
- Dependency audit outcome: warn-backend-unavailable
- Dependency triage complete: false
- Admin route authz failures: 0
- RLS proof level: static-only

## Release Blocking Findings

- [EXTERNAL-TOOLING] dependency-audit-degraded: Dependency audit degraded: pnpm-audit-backend-unavailable, osv-scanner-missing
- [POLICY-DEPENDENT] rls-live-proof-not-confirmed: RLS proof level is static-only.

## Boundaries

- Enforced header/CSP failures are blocking; framework-limited/best-effort findings are non-blocking and explicitly labeled.
- Dependency triage is complete only when authenticated Dependabot export is ingested.
- Audit backend/tooling degradation is machine-visible in dependency-audit and releaseBlockingFindings.
- RLS is live-confirmed only when DB credentials are present and live verification passes.
