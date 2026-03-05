# REMEDIATION_CHECKLIST

Rule: zero remainder.
Owner: Codex

## Items

- [x] Create repository truth baseline document with commands and observed outcomes.
  - status: fixed
  - verification: `test -f docs/audit/REPO_TRUTH.md`

- [x] Produce scored 100-point initial audit with evidence mapping.
  - status: fixed
  - verification: `test -f docs/audit/AUDIT_100.md`

- [x] Create ROI-ranked remediation plan.
  - status: fixed
  - verification: `test -f docs/audit/REMEDIATION_PLAN.md`

- [x] Produce final audit document with before/after score and risk notes.
  - status: fixed
  - verification: `test -f docs/audit/AUDIT_100_FINAL.md`

- [x] Produce audit changelog of fixes.
  - status: fixed
  - verification: `test -f docs/audit/CHANGELOG_OF_FIXES.md`

- [x] Add canonical docs navigation entrypoint.
  - status: fixed
  - verification: `test -f docs/START_HERE.md`

- [x] Update root README to point to canonical docs and verification commands.
  - status: fixed
  - verification: `rg "START_HERE" README.md`

## Deferred items

None.
