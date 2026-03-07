# Security Verification Model

Settler verification now separates **verified**, **degraded**, **skipped**, **unavailable**, and **failed** evidence lanes.

## Modes

- `verify:security:fast`: static checks + local runtime checks + dependency evidence in `standard` mode.
- `verify:security:full`: full evidence pipeline with explicit degraded reporting.
- `verify:security:enterprise`: strict dependency completeness + required runtime RLS proof.

## Evidence dimensions

- Dependency evidence (`security/dependency-evidence.json`)
- RLS evidence (`security/rls-evidence.json`)
- Final verdict (`security/security-verdict.json`)

Each artifact includes:

- `status`
- `reason`
- `evidenceCompleteness`/`evidenceLevel`
- `environmentConstraints`
- `nextOperatorAction`

## Policy controls

- `SECURITY_DEPENDENCY_EVIDENCE_MODE=standard|strict`
- `SECURITY_RLS_EVIDENCE_MODE=static-only|runtime-rls|runtime-rls-required`

Strict policy fails when required evidence is missing.
