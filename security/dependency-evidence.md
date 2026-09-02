# Dependency Evidence
- status: PASS_WITH_DEGRADED_EVIDENCE
- evidenceCompleteness: degraded
- mode: standard
- ecosystems: cargo, npm
- localAuditOutcome: warn-findings
- advisoryStatus: unauthenticated

## Environment constraints
- Package registry audit backend/tooling degraded.
- No authenticated advisory source configured.

## Next operator action
- Restore registry audit connectivity/auth and rerun `pnpm run audit:deps`.
- Provide DEPENDABOT_ALERTS_EXPORT_PATH or set GITHUB_TOKEN/GH_TOKEN with GITHUB_REPOSITORY.