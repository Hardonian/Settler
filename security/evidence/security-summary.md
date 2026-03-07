# Security Evidence Summary

- Commit SHA: 5c0313937628f0b74394775590e7ebf74cca8467
- Timestamp: 2026-03-07T20:47:28.022Z
- CI Run ID: n/a
- Audit Policy Mode: strict
- Evidence Completeness: partial

## Snapshot

- Route registry total: 228
- Tenant-scoped verified: 160/160
- Cross-tenant test status: passed
- Header probe failed checks: 136
- Dependency audit outcome: warn-backend-unavailable
- Admin route authz failures: 0
- RLS proof level: static-only

## Boundaries

- Dependency findings are authoritative only when registry audit backend is reachable.
- Route classification and tenant checks are static-analysis controls; runtime tests are still required.
- Header probes cover GET-accessible routes and selected error/denial paths.
- RLS is live-confirmed only when DB credentials are present and the live verification script runs.
