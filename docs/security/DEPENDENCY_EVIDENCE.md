# Dependency Evidence

## What is verified

1. Local audit findings from `artifacts/security/dependency-audit-latest.json`
2. Lockfile inventory presence
3. Authenticated advisory completeness from either:
   - `DEPENDABOT_ALERTS_EXPORT_PATH` import
   - `gh api repos/:repo/dependabot/alerts` with token + repo context

## Status semantics

- `PASS`: local audit clear and authenticated advisory completeness confirmed
- `PASS_WITH_DEGRADED_EVIDENCE`: local audit clear, advisory completeness partial/unavailable in standard mode
- `FAIL`: local audit failed or strict mode lacks authenticated advisory completeness

## Operator commands

- Standard: `SECURITY_DEPENDENCY_EVIDENCE_MODE=standard node scripts/security/dependency-evidence.mjs`
- Strict: `SECURITY_DEPENDENCY_EVIDENCE_MODE=strict node scripts/security/dependency-evidence.mjs`
- Import export: `DEPENDABOT_ALERTS_EXPORT_PATH=security/dependabot-alerts.json ...`
