# Release Verification Pipeline

This repository uses a staged verification runner (`scripts/verify-release.mjs`) with bounded timeouts, per-stage logs, and machine-readable summaries.

## Command matrix

| Command                                   | Purpose                                                                                                               | Typical duration | Output                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------: | ---------------------------------------------------------------- |
| `pnpm run verify:fast`                    | Fast local + PR gate checks (policy, lint, typecheck, route, boundary, and static security controls).                 |         2-12 min | `artifacts/verification/<run-id>/summary.{json,md}` + stage logs |
| `pnpm run verify:build`                   | Isolated production build stage.                                                                                      |         3-20 min | Same summary/log artifacts                                       |
| `pnpm run verify:test`                    | Isolated core test stage.                                                                                             |         2-25 min | Same summary/log artifacts                                       |
| `pnpm run verify:release` (`verify:full`) | Full release gate including runtime security smoke + launch capture + launch artifact + security evidence validation. |         8-45 min | Same summary/log artifacts                                       |
| `pnpm run verify:artifacts`               | Validate generated launch capture manifest/files.                                                                     |           <1 min | Console output                                                   |

## Stage list

`verify:release` runs these stages in order:

1. `root` (`pnpm run verify:root`)
2. `lint`
3. `typecheck`
4. `claims`
5. `boundaries`
6. `routes`
7. `security` (`pnpm run verify:security`)
8. `build`
9. `securityRuntime` (`pnpm run verify:security:runtime`)
10. `test`
11. `launchManifest` (`pnpm run verify:launch-assets`)
12. `capture` (`pnpm run capture:launch`)
13. `artifacts` (`pnpm run verify:artifacts`)
14. `securityEvidence` (`pnpm run verify:security:evidence`)

On first failure, the runner stops and emits stage-specific logs.

## Evidence artifacts

Every run writes:

- `summary.json` (machine-readable status and durations)
- `summary.md` (human review table)
- `<stage>.log` for each executed stage

Default location: `artifacts/verification/<iso-timestamp>/`.

## Running individual stages

```bash
node scripts/verify-release.mjs --stage=build
node scripts/verify-release.mjs --stage=securityRuntime
node scripts/verify-release.mjs --profile=artifacts
```

## CI usage

Use the `release-verify` workflow:

- `verify-fast` runs fast static gates.
- `security-supply-chain` runs dependency CVE scan + SBOM generation and uploads artifacts.
- `verify-release` downloads those security artifacts and enforces `RELEASE_REQUIRE_SECURITY_EVIDENCE=1` (with optional `RELEASE_ALLOW_AUDIT_UNAVAILABLE=1` policy override when registry audit endpoint is unavailable).

## Threat model

See `docs/release/THREAT_ASSESSMENT.md` for release-time OWASP Top 10 mapping and residual risk notes.
