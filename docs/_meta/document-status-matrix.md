# Document Status Matrix

Snapshot of high-signal docs and their intended trust level.

| Path                                         | Domain                         | Status     | Canonical replacement / pointer              | Action                                                     |
| -------------------------------------------- | ------------------------------ | ---------- | -------------------------------------------- | ---------------------------------------------------------- |
| `docs/platform-index.md`                     | Global docs navigation         | CANONICAL  | N/A                                          | Keep as primary entrypoint.                                |
| `docs/capabilities.md`                       | Capability registry            | CANONICAL  | N/A                                          | Keep authoritative capability map.                         |
| `docs/architecture/platform-architecture.md` | Architecture                   | CANONICAL  | N/A                                          | Keep as architecture authority.                            |
| `docs/setup/env-matrix.md`                   | Setup                          | CANONICAL  | N/A                                          | Keep in setup spine.                                       |
| `docs/setup/operator-runbook.md`             | Operations                     | CANONICAL  | N/A                                          | Keep in setup spine.                                       |
| `docs/launch/README.md`                      | Launch/readiness               | CANONICAL  | N/A                                          | Keep as launch hub.                                        |
| `docs/README.md`                             | Docs hub                       | SUPPORTING | `docs/platform-index.md`                     | Keep as discovery hub; defer authority to platform index.  |
| `docs/INDEX.md`                              | Role-based navigation          | SUPPORTING | `docs/platform-index.md`                     | Marked non-canonical to avoid authority split.             |
| `docs/DOCUMENTATION_INDEX.md`                | Legacy index                   | SUPERSEDED | `docs/platform-index.md`                     | Retained as redirect-style pointer.                        |
| `docs/SOURCE_OF_TRUTH.md`                    | Legacy source-of-truth framing | SUPERSEDED | `docs/platform-index.md` + canonical spine   | Marked superseded and narrowed.                            |
| `docs/ARCHITECTURE.md`                       | Legacy architecture narrative  | SUPERSEDED | `docs/architecture/platform-architecture.md` | Marked superseded with compatibility retention.            |
| `docs/ARCHITECTURE_OVERVIEW.md`              | Legacy architecture overview   | SUPERSEDED | `docs/architecture/platform-architecture.md` | Marked superseded with compatibility retention.            |
| `launch/*.md` (repo root)                    | Legacy social launch drafts    | SUPERSEDED | `docs/launch/`                               | Scoped as historical campaign artifacts.                   |
| `docs/archive/**`                            | Historical docs                | ARCHIVED   | N/A                                          | Continue index discipline in `docs/_meta/archive-index.*`. |
| `docs/_meta/**`                              | Governance/inventory artifacts | META       | N/A                                          | Keep explicitly meta; never canonical product truth.       |
