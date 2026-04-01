# Dependency Evidence

- status: PASS_WITH_DEGRADED_EVIDENCE
- evidenceCompleteness: degraded
- mode: standard
- ecosystems: cargo, npm
- localAuditOutcome: warn-backend-unavailable
- advisoryStatus: unauthenticated

## Environment constraints

- Run `pnpm run audit:deps` to capture local audit state.
- Package registry audit backend/tooling degraded.
- No authenticated advisory source configured.

## Next operator action

- Run `pnpm run audit:deps` before release verification.
- Restore registry audit connectivity/auth and rerun `pnpm run audit:deps`.
- Provide DEPENDABOT_ALERTS_EXPORT_PATH or set GITHUB_TOKEN/GH_TOKEN with GITHUB_REPOSITORY.
