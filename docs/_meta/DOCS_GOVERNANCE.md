# Documentation Governance

## Scope and intent

This policy keeps Settler docs navigable, truthful, and low-entropy.

## Placement rules

- `README.md`: concise repository entry only.
- `docs/`: canonical product/engineering docs.
- `docs/archive/`: superseded/historical docs retained for traceability.
- `prompts/`: reusable active prompt assets.
- `docs/archive/prompts/`: superseded or one-off prompt runs.
- Avoid new root-level planning/audit markdown unless it is an intentional canonical document.

## When to create a new doc

Create a new doc only when one of these is true:
1. the topic is durable and distinct from existing canonical docs;
2. the audience and ownership are clear;
3. cross-linking from a hub location is added in the same change.

Otherwise, extend an existing canonical doc.

## Naming conventions

- Prefer lowercase kebab-case under `docs/`.
- Keep filenames purpose-specific (`overview`, `runbook`, `reference`, `decision-*`).
- Avoid vague names like `final`, `new`, `misc`, `notes`.

## Plan/audit/report handling

- Extract enduring facts into canonical docs (`architecture`, `operations`, `security`, `reference`).
- Archive source report/plan when historical context is still useful.
- Delete only trivial/generated or fully duplicated material with no historical value.

## Archive requirements

Any archived doc must be represented in both:
- `docs/_meta/archive-index.md`
- `docs/_meta/archive-index.json`

Each entry must include original path, archived path, reason, merge target (if any), public/internal safety, and date.

## Deletion criteria

Delete markdown only when at least one condition is provable:
- empty/trivial placeholder;
- exact duplicate with no unique context;
- fully merged content with no forensic value;
- generated transient artifact that is reproducible.

When uncertain: `merge > archive > manual-review > delete`.

## Orphan prevention

- New docs must be linked from at least one meaningful hub (`README.md`, `docs/README.md`, or a local section index).
- Review `docs/_meta/orphan-docs.md` during documentation-heavy PRs.

## Change traceability

For significant doc moves/archives/deletions, update:
- `docs/_meta/DOCS_CONSOLIDATION_CHANGELOG.md`
- `docs/_meta/archive-index.*` (if archiving)
