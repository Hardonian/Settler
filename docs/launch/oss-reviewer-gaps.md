# OSS Reviewer Gap Assessment

## Current strengths

- Monorepo includes substantial implementation surface (web, API, CLI, Rust kernel, SDKs).
- Determinism and evidence concepts are repeatedly documented across product/security pages.
- Kernel-vs-control-plane distinction is stated in public pages.

## Current weaknesses

- Narrative density is high, and many docs overlap, making canonical architecture paths harder to identify quickly.
- Some generated/marketing-like text in the repo still weakens technical signal.
- Route and feature breadth can appear sprawling versus clearly tiered "core vs optional" paths.

## Fixes completed

- Tightened enterprise/security content to reduce over-claim risk and improve architecture truthfulness.
- Removed overconfident AI knowledge-base claims (certification/pricing/integration count assertions).

## Fixes deferred

- Create a single "technical north star" doc that maps canonical architecture docs and deprecates duplicates.
- Add an explicit "minimum credible OSS path" from clone → run → verify replay proof.
- Add a maintained repo map for what is production path vs experimental path.

## Launch blockers

- **Blocker:** Lack of a sharply curated canonical doc path for external technical reviewers under time pressure.

## Non-blockers

- Refactoring of broad route/content inventory.
- Optional visual system unification work.
