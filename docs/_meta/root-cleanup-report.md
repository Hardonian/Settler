# Root Cleanup Report

Date: 2026-03-11

## Scope
Repository root structure and root-level clutter candidates.

## Findings
- Root currently has **78 files**, including **29 markdown files**, which is high for discoverability.
- Root-level markdown is intentionally preserved by `docs/repo/ROOT_POLICY.md` allowlisting and existing source-of-truth links.
- No root file moves were applied in this pass to avoid breaking policy, docs references, and CI/documentation contracts.

## Actions taken
- Fixed malformed `package.json` script block by removing duplicate conflicting command definitions and restoring valid JSON.
- Kept root layout stable; documented cleanup candidates for a dedicated policy-driven follow-up.

## Candidate clutter (manual follow-up)
These appear archival/operational and are likely better under `docs/archive/` or `docs/reports/` after policy update:
- `DEPENDENCY_FIX_PLAN.md`
- `SAFE_BREAKING_CHANGES_PLAN.md`
- `PRODUCT_CLARITY_AUDIT.md`
- `FRONTEND_DESIGN_REVIEW.md`
- `REALITY_AUDIT.md`

## Decision
- **No file moves in root** during this pass (risk-managed).
- Root normalization should be executed alongside an update to `docs/repo/ROOT_POLICY.md` and link rewrites.
