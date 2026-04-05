# Operator Customization Studio

**Status:** implementation-backed operator documentation  
**Last updated:** 2026-04-05

## What this is

The Operator Customization Studio is a **tenant- and user-scoped** layer for **admin console presentation**: which dashboard modules appear, in what order, optional title/help overrides, and numeric **attention** thresholds for presentation-only warnings (for example, usage volume highlighted against a configured limit).

It does **not**:

- change reconciliation outcomes, match results, or exception canonical status;
- alter evidence contracts, proofpack semantics, or export truth;
- inject uptime, SLA, or durability claims;
- apply prompt-generated changes without an explicit **review → apply to draft → publish** path.

Canonical metrics on the admin dashboard still come from **`GET /api/admin/metrics`** and stream posture from the existing admin stream. Customization only controls **composition and copy** of registered modules.

## Data model and persistence

- **Schema version:** `1` (`CUSTOMIZATION_SCHEMA_VERSION` in `packages/web/src/lib/operator-customization/schema.ts`).
- **Tables:** `operator_customization_states`, `operator_customization_proposals`, `operator_customization_audits`, `operator_interaction_signals` (see `prisma/schema.prisma` and migration `20260405120000_operator_customization_studio`).
- **Scope:** `tenantId` + **super-admin `userId`** + `surface` (`admin_dashboard` today). Super-admins may pass `?tenantId=` on APIs; otherwise the **`default`** slug tenant is used.

## Registry and locked modules

Module definitions live in `packages/web/src/lib/operator-customization/registry.ts`. Each module declares:

- **truthClass** — e.g. `canonical_metric`, `connectivity_posture`, `operator_workflow`, `presentation_summary`;
- **sourceOfTruthHint** — which API or subsystem backs the block;
- **locked** — connectivity and time-range controls cannot be removed or reordered.

## Draft vs published

- **Draft** is edited in the studio and saved via **`PUT /api/admin/operator-customization`**.
- **Publish** copies validated draft to **published** config: **`POST /api/admin/operator-customization/publish`**.
- **Revert draft** resets the draft from published: **`POST /api/admin/operator-customization/revert-draft`**.
- The admin dashboard (`/admin`) renders the **published** layout.

## Prompt-assisted proposals

- **POST `/api/admin/operator-customization/proposals`** accepts natural language and returns a **structured patch** when a **rules-based** intent matches (`packages/web/src/lib/operator-customization/proposal-rules.ts`).
- **This build does not call an LLM.** `inferenceMode` is `rules` or recorded as `degraded_unavailable` only if extended later; the API response and studio copy state clearly that proposals are deterministic rules.
- Applying a proposal: **POST `/api/admin/operator-customization/proposals/[id]/apply`** merges the patch into **draft only** (not live until publish).

## Operator “learning” / suggestions

- **POST `/api/admin/operator-customization/signals`** records `module_view` and `layout_reorder` events (module id must exist in the registry).
- **GET `/api/admin/operator-customization/suggestions`** returns **pin module** style suggestions with **explicit visit counts** over seven days (`packages/web/src/lib/operator-customization/suggestion-engine.ts`).
- Dismiss in the UI is **session-local** unless extended to server-side preference storage.

## Audit trail

`operator_customization_audits` records actions such as `draft_saved`, `published`, `draft_reverted_to_published`, and `proposal_applied_to_draft` with JSON **details** (before/after snapshots where applicable).

## Presets

System presets are defined in `packages/web/src/lib/operator-customization/presets.ts`, including **Solo operator**, **Buyer demo**, and **Exception ops**. Applying a preset updates the **draft**; operators still **publish** to change the live dashboard.

## Intentional limits (this pass)

- Single surface: **`admin_dashboard`** only.
- No drag-and-drop canvas beyond **up/down reorder** and enable/disable where allowed.
- No org-level entitlement gates in code yet (future packaging hook).
- LLM-based intent or diff explanations are **out of scope** until a reviewed provider path exists.

## Related files

- UI: `packages/web/src/app/admin/operator-customization/page.tsx`, `packages/web/src/app/admin/page.tsx`
- APIs: `packages/web/src/app/api/admin/operator-customization/**`
- Services: `packages/web/src/lib/server/operator-customization/**`
