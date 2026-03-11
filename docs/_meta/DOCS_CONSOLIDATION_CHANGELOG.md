# Docs Consolidation Changelog

_Date: 2026-03-11_

## 1) Executive summary

- Total markdown docs scanned (excluding generated/vendor dirs): **1329**.
- Canonical entry docs updated: **3** (`README.md`, `CONTRIBUTING.md`, `docs/README.md`).
- Inventory/governance/meta artifacts created: **10**.
- Historical docs archived this pass: **13** (root-level superseded launch/reality/summary cluster).
- Deleted docs: **0** (conservative retention policy applied).
- Manual review queue: **large** (see `docs/_meta/doc-inventory.*`, `docs/_meta/orphan-docs.md`, `docs/_meta/doc-clusters.md`).

## 2) Canonical docs created/updated

| Path | Why canonical now | Source inputs |
|---|---|---|
| `README.md` | Clean external/repo entrypoint with deterministic quickstart and docs routing. | Prior duplicated README content + launch quickstart cluster. |
| `CONTRIBUTING.md` | Stable contributor gate + docs governance integration. | Existing contributing flow + docs governance requirements from this pass. |
| `docs/README.md` | Explicit docs hub and meta-index for discoverability. | Existing docs hub + new governance/meta outputs. |
| `docs/_meta/DOC_MAP.md` | Canonical map of documentation categories. | Repo structure review from inventory pass. |
| `docs/_meta/DOCS_GOVERNANCE.md` | Anti-entropy rules for future doc growth. | Consolidation policy from this pass. |
| `docs/archive/README.md` | Archive rationale and revival/indexing policy. | Existing archive note + governance requirements. |
| `docs/prompts/README.md` | Prompt asset curation policy and indexing pointer. | Existing `prompts/` directory + prompt handling rules. |

## 3) Merges performed

| Source | Destination | Retained content summary |
|---|---|---|
| Duplicated root README blocks | `README.md` | Consolidated deterministic quickstart, repo structure, and docs map while removing repeated sections. |
| Root launch/summary cluster (high-level orientation) | `README.md`, `docs/README.md`, governance/meta docs | Preserved durable entrypoint guidance; moved milestone-specific details to archive. |

## 4) Archives created

See canonical index:
- `docs/_meta/archive-index.md`
- `docs/_meta/archive-index.json`

This pass archived 13 superseded root docs to:
- `docs/archive/2026-03/root-superseded/`

## 5) Deletions

No markdown docs were deleted in this pass.

### High-confidence deletions

- None executed (safety-first posture).

### Low-confidence/manual-review candidates

- See `docs/_meta/doc-inventory.md` entries flagged `investigate` and `docs/_meta/orphan-docs.md`.

## 6) Manual review queue

Primary unresolved clusters requiring additional human-domain review:

- `plans-roadmaps`
- `audits-reviews`
- `prompts`
- `security-docs`
- `launch-docs`
- `onboarding-setup`

Supporting artifacts:
- `docs/_meta/doc-clusters.md`
- `docs/_meta/doc-inventory.json`
- `docs/_meta/orphan-docs.md`

## 7) Follow-up recommendations

1. Consolidate `docs/strategy`, `docs/strategic`, and root-level strategic docs into one live roadmap + archive remaining snapshots.
2. Build a canonical security doc set (`docs/security/overview`, `docs/security/controls`, `docs/security/verification`) and archive overlapping historical audits.
3. Split prompt assets into `active` vs `historical` with per-prompt metadata (owner, assumptions, expected outputs).
4. Add lightweight CI doc-check script for orphan detection and missing archive index entries.

## 8) Risks / caveats

- Inventory and status classification is heuristic-assisted; some docs need owner validation before deletion.
- Large orphan population reflects historical doc sprawl and weak linking, not necessarily low value.
- No destructive deletions were applied due to safety gate and high ambiguity across many planning/report docs.
