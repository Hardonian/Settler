# Document Governance Map

## Purpose

This map defines how to classify and route Settler documentation so readers can quickly identify what is authoritative versus historical.

Primary canonical spine:

- `docs/platform-index.md`
- `docs/capabilities.md`
- `docs/architecture/platform-architecture.md`
- `docs/setup/*`
- `docs/launch/*` for launch/readiness execution assets

## Status model

| Status         | Meaning                                                       | Expected location                                                                                     | Index behavior                                                           |
| -------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **CANONICAL**  | Current source of truth for a platform domain.                | `docs/` canonical paths (`platform-index`, `capabilities`, `architecture/`, `setup/`, core runbooks). | Must be linked from `docs/platform-index.md` and/or `docs/README.md`.    |
| **SUPPORTING** | Useful working reference that complements canonical docs.     | Domain folders in `docs/` (`reference/`, `reports/`, `security/`, etc).                               | Linked from local domain indexes; not positioned as repo-wide authority. |
| **SUPERSEDED** | Previously authoritative guidance replaced by canonical docs. | Kept in place with explicit superseded banner or moved under `docs/archive/`.                         | Must point to replacement canonical doc.                                 |
| **ARCHIVED**   | Historical artifacts kept for provenance.                     | `docs/archive/` with index entries in `docs/_meta/archive-index.*`.                                   | Should not appear as primary entrypoints.                                |
| **GENERATED**  | Machine-generated or reproducible evidence artifacts.         | `docs/_meta/`, `reports/`, tool output directories.                                                   | Clearly labeled as generated/evidence; never treated as policy truth.    |
| **DRAFT**      | Exploratory or in-progress material pending validation.       | Prefer domain folder with draft marker in header.                                                     | Excluded from canonical indexes unless needed for active review.         |
| **META**       | Governance, inventory, and repository hygiene documentation.  | `docs/_meta/`.                                                                                        | Linked from `docs/README.md` governance section only.                    |

## Canonical authority routing

- Platform entry and tie-breaker: `docs/platform-index.md`.
- Capability authority: `docs/capabilities.md`.
- Architecture authority: `docs/architecture/platform-architecture.md`.
- Setup/operator truth: `docs/setup/`.
- Launch/readiness execution set: `docs/launch/README.md` + linked launch docs.

## Compatibility notes

Some legacy files remain in original paths to avoid link breakage. These files must be explicitly marked **SUPERSEDED** and point to canonical replacements.
