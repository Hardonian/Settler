# Script Audit

Date: 2026-03-11

## Method
Classified scripts by references in:
- `package.json` scripts
- `.github/workflows/*.yml`
- documentation references

## Summary
- ACTIVE: 158
- LEGACY (doc-only references): 16
- UNUSED (no package/CI/docs references detected): 124

## Notes
- "UNUSED" does **not** imply safe deletion; many scripts appear emergency or manual operational tools.
- Command surface scripts validated and healthy:
  - `demo:settler`
  - `simulate:settler`
  - `replay:run`
  - `tenant:create`
  - `chaos:test`

## Actions taken
- Removed duplicate legacy command declarations from `package.json` so only canonical runner-based commands remain.

## Recommended next step
- Move truly obsolete scripts to `scripts/archive/` behind owner-reviewed allowlist.
