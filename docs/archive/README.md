# Documentation Archive

The archive preserves historical/superseded documentation without polluting canonical contributor and user paths.

## Why this exists

Settler has accumulated planning docs, audits, launch notes, and execution summaries that still have forensic value. Archiving keeps institutional memory while keeping active docs lean.

## What belongs here

- Superseded plans and launch docs.
- Historical audits/reports after durable findings are merged into canonical docs.
- One-off prompt runs that are not maintained assets.
- Milestone implementation summaries that are no longer current truth.

## What does **not** belong here

- Active setup/run/deploy docs.
- Current architecture and security invariants.
- Primary reference docs required for users or contributors.

## Revival policy

Archived docs are historical context, not default truth. If reviving content:

1. validate against current code reality,
2. merge durable content into canonical docs,
3. keep the archived source for traceability.

## Indexing requirement

Every archived move must be recorded in:

- `docs/_meta/archive-index.md`
- `docs/_meta/archive-index.json`

## Execution wave folders

- `2026-03/root-superseded/`: first consolidation wave (root superseded docs).
- `2026-03/execution-wave-2/`: launch, onboarding, and prompt historical docs moved during inventory execution wave.

## Unified archive model

Canonical archive root is `docs/archive/`.

- Active archive waves: `docs/archive/2026-03/...`
- Legacy imported archives: `docs/archive/legacy/root-archive/` and `docs/archive/legacy/historical-planning-archive/`

Do not create new root-level archive folders outside `docs/archive/`.
