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

---

## 9) Execution wave 2 (2026-03-11): inventory-driven consolidation

### Outcome snapshot

- Additional docs archived this wave: **8**.
- High-confidence docs deleted this wave: **5**.
- Clusters resolved this wave: **4** (`launch-docs`, `onboarding-setup`, `prompts`, `case-variant exact duplicates`).
- Canonical docs materially strengthened: **4** (`docs/launch/README.md`, `docs/launch/launch-checklist.md`, `docs/getting-started/README.md`, `docs/prompts/README.md`).

### Clusters resolved

1. **launch-docs**
   - Canonical docs: `docs/launch/README.md`, `docs/launch/launch-checklist.md`, `docs/launch/QUICK_START.md`.
   - Archived: `docs/LAUNCH_CHECKLIST.md`, `docs/SOLO_FOUNDER_LAUNCH_SUMMARY.md`.
   - Consolidation action: merged durable checklist gates (lint/typecheck/release-note verification) into canonical launch checklist.

2. **onboarding-setup**
   - Canonical docs: `docs/getting-started/README.md`, `docs/developer-guide.md`, `docs/quickstart-cli.md`.
   - Archived: `docs/DEVELOPER_GUIDE.md`, `docs/QUICKSTART_CLI.md`, `docs/ENV_SETUP_GUIDE.md`, `docs/REMOTE_SETUP_GUIDE.md`.
   - Consolidation action: merged environment + remote database bootstrap essentials into `docs/getting-started/README.md`.

3. **prompts**
   - Canonical docs: `docs/prompts/README.md`, `docs/infrastructure/ai-prompt-schema.md`.
   - Archived: `docs/SUPABASE_AI_CHATBOT_PROMPT.md`, `docs/infrastructure/AI_PROMPT_COMPLETE.md`.
   - Deleted: `docs/MISSING_IMAGES_PROMPTS.md` (one-off generated image TODO prompt dump; no reusable prompt-system logic).

4. **case-variant exact duplicates (high-confidence deletion wave)**
   - Deleted exact duplicate lower-case docs:
     - `docs/architecture.md` (duplicate of `docs/ARCHITECTURE.md`)
     - `docs/onboarding.md` (duplicate of `docs/ONBOARDING.md`)
     - `docs/operations.md` (duplicate of `docs/OPERATIONS.md`)
     - `docs/workflows.md` (duplicate of `docs/WORKFLOWS.md`)

### High-confidence deletions completed

- `docs/architecture.md` — exact duplicate path variant of canonical `docs/ARCHITECTURE.md`.
- `docs/onboarding.md` — exact duplicate path variant of canonical `docs/ONBOARDING.md`.
- `docs/operations.md` — exact duplicate path variant of canonical `docs/OPERATIONS.md`.
- `docs/workflows.md` — exact duplicate path variant of canonical `docs/WORKFLOWS.md`.
- `docs/MISSING_IMAGES_PROMPTS.md` — one-off prompt debris with no durable operational/decision content.

### Touched-link repairs completed

Updated references in touched docs to point to canonical active paths, including:

- CLI docs links switched from `docs/QUICKSTART_CLI.md` to `docs/quickstart-cli.md`.
- Setup-guide references switched from archived `REMOTE_SETUP_GUIDE.md` to `docs/getting-started/README.md`.
- Architecture links switched from removed `docs/architecture.md` to `docs/ARCHITECTURE.md`.
- Launch checklist references switched to `docs/launch/launch-checklist.md`.

### Low-confidence deletion candidates left for manual review

- Broad audit/review report clusters under `archive/completion-reports/` and root `docs/*SUMMARY*.md` where forensic or stakeholder context may still be needed.
- Strategic narrative overlaps (`docs/strategy/*`, root strategy docs) needing product-owner decision on final canonical narrative.
- Security-summary overlaps where timelines differ but controls language is still partially unique.
