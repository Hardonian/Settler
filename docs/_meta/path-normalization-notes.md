# Path Normalization Notes

## Intent

Normalize documentation discoverability without unsafe mass renames that could break deep links, scripts, or external references.

## Current compatibility exceptions

1. Uppercase legacy docs (example: `docs/ARCHITECTURE.md`) are retained for compatibility but explicitly marked as **SUPERSEDED**.
2. Root-level `launch/` folder is retained as historical campaign collateral while canonical launch operations live under `docs/launch/`.
3. Legacy index-style docs are retained as redirect surfaces rather than removed.

## Normalization rule going forward

- New docs should prefer lowercase kebab-case naming.
- New canonical docs belong in explicit domain folders under `docs/`.
- New historical snapshots should go to `docs/archive/` with archive-index entries.
- New governance or inventory artifacts should go under `docs/_meta/` and be labeled **META**.
