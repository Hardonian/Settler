# Private Material Risk Review

Date: 2026-03-11

## Scope

- Checked tracked files for private/investor/secret indicators using:
  - `git ls-files | rg -i 'investor|private|secret|credential|key|pem|pfx|internal-only'`

## Findings

- `INVESTOR-RELATIONS-PRIVATE/` is fully tracked in git (multiple markdown files, including business strategy and investor collateral).
- Secrets guidance docs are tracked under `.github/` and `docs/` (expected), but should be reviewed to ensure no live secret values are embedded.
- No root-level historical archive directories remain outside `docs/archive/`.

## Risk Assessment

- **Risk level: Medium (process risk)**
  - Tracking `INVESTOR-RELATIONS-PRIVATE/` in the main repository can increase accidental disclosure risk in forks, mirrors, CI logs, or broad contributor access.

## Safe Remediation Plan (non-destructive)

1. Add repository-level policy documenting `INVESTOR-RELATIONS-PRIVATE/` as restricted/internal-only content.
2. Decide target control model:
   - Move private investor materials to a separate private repository, **or**
   - Keep in-repo but enforce strict access controls and CODEOWNERS restrictions.
3. If private material should never have been tracked publicly, perform a dedicated history rewrite with stakeholder approval (e.g., `git filter-repo`) and rotate any exposed credentials.
4. Add guardrails:
   - CI check preventing sensitive directory publication in release artifacts.
   - Secret scanning gate on PRs touching private directories.
