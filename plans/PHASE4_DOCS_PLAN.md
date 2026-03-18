# Phase 4 Documentation Plan - Settler

## Objective
Create operator-grade documentation that answers: what, who, how, verification, boundaries, and traps.

---

## 1. Root README Improvements
**Status:** Needs tightening
**Actions:**
- Add clear "What is Settler" - deterministic reconciliation platform
- Add "Who is this for" - finance ops teams needing audit-ready reconciliation
- Consolidate verification commands section
- Add link to "What Works Today" reference

## 2. Local Setup / Quickstart
**Status:** Exists (SETUP.md, docs/getting-started/)
**Actions:**
- Tighten "Time-to-first-working-screen" section
- Add clear prerequisite checklist
- Add "Common Setup Traps" subsection

## 3. Environment Variables Reference
**Status:** Exists (docs/setup/env-matrix.md)
**Actions:**
- Already comprehensive - verify it covers all required vars
- Add quick reference table for minimal setup

## 4. Troubleshooting Section
**Status:** Exists (docs/troubleshooting/)
**Actions:**
- Expand with "Common Setup Traps" guide
- Add diagnostic command reference

## 5. "What Works Today" Section
**Status:** Missing - needs creation
**Location:** docs/getting-started/WHAT_WORKS.md
**Content:**
- Core reconciliation workflow (Stripe ↔ Bank matching)
- Manual review queue
- Evidence generation
- Basic ingestion pipelines

## 6. "Known Boundaries / Intentionally Unfinished" Section
**Status:** Partial (docs/KNOWN_LIMITATIONS.md)
**Actions:**
- Create focused "Intentionally Unfinished" doc
- Distinguish between "not yet built" vs "known limitation"
- Add product readiness indicators

## 7. Verification Commands Section
**Status:** Scattered in multiple files
**Actions:**
- Create docs/VERIFICATION_COMMANDS.md
- Categorize: setup, runtime, CI, debug
- Add expected outputs / success criteria

## 8. Demo/Seed Walkthrough
**Status:** Scripts exist, documentation thin
**Actions:**
- Create docs/getting-started/DEMO_WALKTHROUGH.md
- Document pnpm demo:seed and its usage
- Document generate-demo-data workflow
- Add step-by-step verification of seeded state

---

## Key Questions to Answer

| Question | Current Answer | Needed Answer |
|----------|---------------|---------------|
| What is Settler? | In README | Clear 1-liner + detailed description |
| Who is it for? | Not explicit | "Finance ops teams needing audit-ready reconciliation" |
| What works today? | Scattered | Single source of truth |
| How to run locally? | SETUP.md | Consolidated quickstart |
| How to verify? | Multiple scripts | Single verification reference |
| What's not production-ready? | KNOWN_LIMITATIONS.md | Focused "intentionally unfinished" |
| How to avoid setup traps? | Scattered | Common traps guide |

---

## Proposed File Changes

1. **README.md** - Add clarity sections, tighten language
2. **docs/getting-started/WHAT_WORKS.md** - NEW: What works today
3. **docs/getting-started/INTENTIONAL_BOUNDARIES.md** - NEW: Production readiness
4. **docs/VERIFICATION_COMMANDS.md** - NEW: Consolidated verification
5. **docs/getting-started/DEMO_WALKTHROUGH.md** - NEW: Seed/demo guide
6. **docs/troubleshooting/SETUP_TRAPS.md** - NEW: Common setup issues
7. **SETUP.md** - Reference new docs, add quick links
