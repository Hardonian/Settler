# Dependency Audit

Date: 2026-03-11

## Commands
- `SECURITY_AUDIT_MODE=warn node scripts/audit-deps.mjs`

## Result
- Outcome: `warn-backend-unavailable`
- Degraded reasons:
  - `pnpm-audit-backend-unavailable`
  - `osv-scanner-missing`

## Safe fixes applied
- None (no dependency changes made in this pass).

## Risk notes
- Dependency vulnerability verification is currently degraded in this environment.
- Security claims should remain bounded until online audit backend + `osv-scanner` evidence are available in CI.

## Follow-up
- Enforce dependency audit in CI with strict mode and artifact retention.
