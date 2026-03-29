# Settler – MODEL_SPEC.md

Last Updated: 2026-03-29

## Product Identity

Settler is a reconciliation-intelligence and exception/evidence operating system, not just a UI/API wrapper.

## Product focus (current)

- deterministic reconciliation outcomes
- operator-visible exception handling and adjudication
- provenance-rich run detail and evidence artifacts
- multi-tenant safety with explicit security boundaries

## Operating doctrine (non-negotiable)

- Operator truth first: never present uncertain or degraded behavior as complete success.
- Canonical run/detail truth: each run must remain replayable, attributable, and auditable.
- Determinism by default: explicitly mark non-deterministic boundaries.
- Evidence before claims: behavior assertions require tests/verification artifacts.
- Tenant isolation always: no cross-tenant data or metadata bleed.
- Contract discipline: no silent drift in API, policy, route-class, or evidence surfaces.

## Work classification standard

All significant implementation work must be labeled:

- **Maintenance**: cosmetic/polish consistency work.
- **Leverage**: improvements in operator throughput, verification confidence, release safety, contract coherence.
- **Moat**: compounding reconciliation intelligence, evidence depth, policy memory, workflow lock-in, audit trust.

## Required pressure-test for major feature work

1. What new reconciliation intelligence compounds from real usage?
2. Which operator decisions/exceptions become reusable policy memory?
3. How does this strengthen evidence/provenance trust?
4. How does this increase switching cost/workflow centrality?
5. How are tenant boundaries and degraded-state semantics verified?

## Canonical execution references

- `AGENTS.md`
- `docs/repo-os/README.md`
- `docs/repo-os/verification-matrix.md`
- `docs/repo-os/checklists/implementation-pass.md`
- `prompts/IMPLEMENTATION_EXECUTION_HEADER.md`

## Prompt and visual assets

- `prompts/IMPLEMENTATION_EXECUTION_HEADER.md`
- `prompts/GEMINI_IMAGE_PROMPT.md`
- `prompts/VIDEO_PROMPT.md`
- `prompts/STITCH_UI_PROMPT.md`
