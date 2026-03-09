# Documentation Truth Report

## Scope

Convergence pass across root README, docs IA, API docs, support/troubleshooting surfaces, package READMEs, and homepage messaging.

## Major stale claims found

- Package-level READMEs used outdated npm-only workflows and route lists not aligned with current workspace scripts.
- Docs lacked a single support/self-help surface for replay/proof failures.
- Terminology drift across “evidence/receipt/capsule/history” had no canonical glossary entry point.

## Docs added/updated/removed

### Updated

- `README.md`
- `docs/README.md`
- `docs/INDEX.md`
- `docs/architecture/README.md`
- `docs/api/README.md`
- `packages/api/README.md`
- `packages/cli/README.md`
- `packages/web/src/app/(marketing)/home/page.tsx`
- `CHANGELOG.md`

### Added

- `docs/operations/README.md`
- `docs/support/README.md`
- `docs/support/api-error-guide.md`
- `docs/support/doctor-and-health-checks.md`
- `docs/troubleshooting/README.md`
- `docs/troubleshooting/replay-divergence.md`
- `docs/troubleshooting/proof-verification-failures.md`
- `docs/troubleshooting/local-setup.md`
- `docs/reference/glossary.md`

## Terminology decisions

Standardized around: execution, proof/capsule, replay, execution ledger, policy simulation, failure class, trace_id, tenant, control plane.

## Support/self-help surfaces added

Created symptom-based docs for replay divergence, proof verification failures, API error handling, health checks, and local setup issues.

## Website messaging changes

Homepage messaging now explicitly foregrounds deterministic execution ledger, replay lab, policy simulation, and failure intelligence (instead of generic reconciliation-only framing).

## Implementation-vs-docs mismatches fixed

- Route docs now distinguish public operational endpoints and v1/v2 internal/strategic route families.
- CLI docs now align with current top-level command families in `packages/cli/src/index.ts`.

## Final verification results

- CLI build and help commands executed successfully.
- API route validator executed successfully.
- API tenant safety test suite passed (7/7 suites).
- Web API-route validation script executed but reported a path-resolution issue when run from package scope.
