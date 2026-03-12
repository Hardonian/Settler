# Stitch Reconciliation Report

**Date:** 2026-03-08
**Branch:** `claude/stitch-reconciliation-landing-ZhxET`
**Mission:** Account for every Stitch panel, confirm marketing architecture is coherent, and eliminate ambiguity.

---

## What "Stitch" Means in This Repo

The `_import/stitch_panels/` directory contains **product application UI screens** exported from
Stitch (a mobile/tablet app prototyping tool). These are Settler's own _product app_ screens — not
marketing site designs.

The corresponding React implementations live in
`packages/web/src/components/stitch-import/`.

This distinction is critical: the Stitch ZIP contains **no separate marketing site designs**.
The marketing site (settler.dev) is designed and maintained independently. The Stitch material is
exclusively product/app UI.

---

## Stitch Panel Inventory

### `_import/stitch_panels/` — 44 panels (22 unique screens × dark+light variants where applicable)

| Panel Directory                         | Product Screen              | Stitch-Import Component                                  | Runtime Routes                                               | Disposition                                                                 |
| --------------------------------------- | --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `alerts_&_incidents_1/2`                | Alert/incident list         | _(inline in app)_                                        | `/app/alerts`                                                | **B: merged into app route**                                                |
| `bulk_manual_override_decision`         | Manual override modal       | `ReasonForChangeModal.tsx`                               | `/app/review`                                                | **A: active in runtime**                                                    |
| `command_palette_&_global_search`       | Global search UI            | _(no component, raw HTML)_                               | —                                                            | **D: retired** — mobile-only prototype; search is handled by app-level cmdk |
| `compliance_bundle_detail`              | Compliance export detail    | _(inline in app)_                                        | `/app/evidence`                                              | **B: merged into app route**                                                |
| `compliance_export_bundle`              | Compliance bundle export    | _(inline in app)_                                        | `/app/evidence`                                              | **B: merged into app route**                                                |
| `connection_management_1/2`             | Connections list + drawer   | `ConnectionsTable.tsx`, `ConnectionDrawer.tsx`           | `/app/connections`                                           | **A: active in runtime**                                                    |
| `control_plane_overview_1/2`            | Workspace/control plane     | `ControlPlaneOverview.tsx`                               | `/app`, `/app/system-health`                                 | **A: active in runtime**                                                    |
| `cost_&_ai_governance_1/2`              | Cost + AI governance        | _(inline in app)_                                        | `/app/metrics`, `/app/governance`                            | **B: merged into app route**                                                |
| `critical_alert__high_mismatch_rate`    | Critical alert state        | _(inline in app)_                                        | `/app/alerts`                                                | **B: merged into app route**                                                |
| `enterprise_security_&_trust`           | Security overview screen    | `SecurityOverview.tsx`                                   | `/app/audit`, `/security-and-audit`                          | **A: active in runtime** — see note below                                   |
| `execution_control_&_runs_1/2`          | Execution runs list         | _(inline in app)_                                        | `/app/executions`, `/app/runs`                               | **B: merged into app route**                                                |
| `forensic_trace_analysis`               | Trace analysis panel        | _(inline in app)_                                        | `/app/traces`                                                | **B: merged into app route**                                                |
| `governance_&_security_1/2`             | Governance + roles          | `RoleMatrix.tsx`, `FreezeToggle.tsx`, `PolicyViewer.tsx` | `/app/governance`, `/app/settings`, `/policies`              | **A: active in runtime**                                                    |
| `integrations_&_webhooks_1/2`           | Integration list + webhooks | `IntegrationList.tsx`                                    | `/app/integrations`                                          | **A: active in runtime**                                                    |
| `internal_glossary`                     | Glossary/terms              | _(no component)_                                         | —                                                            | **D: retired** — informational prototype; content is covered by /docs       |
| `pipeline_management_1/2`               | Pipeline list + drawer      | `PipelineTable.tsx`, `PipelineDrawer.tsx`                | `/app/pipelines`                                             | **A: active in runtime**                                                    |
| `reconciliation_results_1/2`            | Results list + evidence     | `ResultsTable.tsx`, `EvidenceViewer.tsx`                 | `/app/results`, `/proof-explorer`                            | **A: active in runtime**                                                    |
| `reconciliation_transparency`           | Transparency/audit view     | _(inline in app)_                                        | `/app/audit`                                                 | **B: merged into app route**                                                |
| `review_queue_&_resolution_1/2`         | Review queue + resolution   | `ReviewQueue.tsx`, `ReviewQueuePanel.tsx`                | `/app/review`, `/replay-lab`                                 | **A: active in runtime**                                                    |
| `rules_&_tolerances_editor_1/2`         | Rules editor                | `RulesEditor.tsx`                                        | `/app/rules`                                                 | **A: active in runtime**                                                    |
| `system_freeze`                         | System freeze state         | `FreezeToggle.tsx`                                       | `/app/governance`, `/app/settings`                           | **A: active in runtime**                                                    |
| `system_recovery`                       | System recovery state       | `FreezeToggle.tsx`                                       | `/app/governance`, `/app/settings`                           | **A: active in runtime**                                                    |
| `technical_architecture_&_security_1/2` | Architecture diagram        | `ArchitectureOverview.tsx`                               | `/architecture`, `/how-it-works`, `/open-source`, `/product` | **A: active in runtime**                                                    |
| `trace_explorer_forensics_1/2/3`        | Trace explorer              | _(inline in app)_                                        | `/app/traces`                                                | **B: merged into app route**                                                |
| `unlock_sequence`                       | Onboarding/unlock flow      | _(inline in app)_                                        | `/app/onboarding`                                            | **B: merged into app route**                                                |
| `untitled_screen_1/2`                   | Uncategorized screens       | _(no component)_                                         | —                                                            | **D: retired** — unnamed prototype screens with no clear product identity   |
| `user_settings_&_notifications`         | User settings               | _(inline in app)_                                        | `/app/settings`                                              | **B: merged into app route**                                                |
| `workspace_onboarding`                  | Onboarding flow             | _(inline in app)_                                        | `/app/onboarding`, `/console/onboarding`                     | **B: merged into app route**                                                |

---

## Stitch-Import Component Inventory

| Component                  | Panel Source                            | Runtime Routes                                               | Status                |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------ | --------------------- |
| `ArchitectureOverview.tsx` | `technical_architecture_&_security_1/2` | `/architecture`, `/how-it-works`, `/open-source`, `/product` | Active                |
| `ConnectionDrawer.tsx`     | `connection_management_1/2`             | `/app/connections`                                           | Active                |
| `ConnectionsPanel.tsx`     | `connection_management_1/2`             | _(none — superseded by ConnectionsTable + ConnectionDrawer)_ | **Unused** — see note |
| `ConnectionsTable.tsx`     | `connection_management_1/2`             | `/app/connections`                                           | Active                |
| `ControlPlaneOverview.tsx` | `control_plane_overview_1/2`            | `/app`, `/app/system-health`                                 | Active                |
| `EvidenceViewer.tsx`       | `reconciliation_results_1/2`            | `/app/results`                                               | Active                |
| `FreezeToggle.tsx`         | `system_freeze`, `system_recovery`      | `/app/governance`, `/app/settings`                           | Active                |
| `IntegrationList.tsx`      | `integrations_&_webhooks_1/2`           | `/app/integrations`                                          | Active                |
| `PipelineDrawer.tsx`       | `pipeline_management_1/2`               | `/app/pipelines`                                             | Active                |
| `PipelineTable.tsx`        | `pipeline_management_1/2`               | `/app/pipelines`                                             | Active                |
| `PipelinesPanel.tsx`       | `pipeline_management_1/2`               | _(none — superseded by PipelineTable + PipelineDrawer)_      | **Unused** — see note |
| `PolicyViewer.tsx`         | `governance_&_security_1/2`             | `/app/governance`, `/app/policies`, `/policies`              | Active                |
| `ReasonForChangeModal.tsx` | `bulk_manual_override_decision`         | `/app/review`                                                | Active                |
| `ResultsPanel.tsx`         | `reconciliation_results_1/2`            | `/proof-explorer`                                            | Active                |
| `ResultsTable.tsx`         | `reconciliation_results_1/2`            | `/app/results`                                               | Active                |
| `ReviewQueue.tsx`          | `review_queue_&_resolution_1/2`         | `/app/review`                                                | Active                |
| `ReviewQueuePanel.tsx`     | `review_queue_&_resolution_1/2`         | `/replay-lab`                                                | Active                |
| `RoleMatrix.tsx`           | `governance_&_security_1/2`             | `/app/governance`, `/app/settings`                           | Active                |
| `RulesEditor.tsx`          | `rules_&_tolerances_editor_1/2`         | `/app/rules`                                                 | Active                |
| `SecurityOverview.tsx`     | `enterprise_security_&_trust`           | `/app/audit`, `/security-and-audit`                          | Active — see note     |

### Notes

**`ConnectionsPanel.tsx` and `PipelinesPanel.tsx` — Unused:**
These are panel-level wrappers from early integration work that were superseded by the more
granular Table + Drawer split. They remain in the codebase as non-breaking dead code. They do not
cause any runtime errors or visual issues. They should be removed in a future cleanup pass but are
not urgent — disposition: **C (componentized, superseded)**.

**`SecurityOverview.tsx` — Marketing page misuse (fixed this pass):**
The `/security-and-audit` marketing route was using `SecurityOverview`, which is a mobile-app-style
screen (`max-w-md`, back-navigation arrow, app header) designed for the _product app_, not for a
public marketing page. This produces poor IX on desktop and reads as an app stub, not a trust page.

**Fix applied:** The `/security-and-audit` page has been rebuilt as a proper full-width marketing
security page (Navigation + Footer + marketing layout). The `SecurityOverview` component continues
to serve its intended purpose in `/app/audit` (product app route).

---

## Marketing Site Architecture

### Current Canonical Structure

```
packages/web/src/app/
  page.tsx                        → re-exports (marketing)/home/page.tsx
  (marketing)/
    home/
      page.tsx                    → canonical landing/home page
  platform/page.tsx               → Platform marketing page
  pricing/page.tsx                → Pricing/engagement models page
  security/page.tsx               → redirects to /security-and-audit
  security-and-audit/page.tsx     → Security marketing page (fixed this pass)
  about/page.tsx                  → About page
  docs/
    quickstart/page.tsx           → Quickstart documentation
    page.tsx                      → Docs index
  login/page.tsx                  → Auth
  signup/page.tsx                 → Auth
```

### Component Ownership

| Concern          | Owner                                              | Notes                          |
| ---------------- | -------------------------------------------------- | ------------------------------ |
| Header/Nav       | `Navigation` component                             | Single instance per page       |
| Footer           | `Footer` component                                 | Single instance per page       |
| Theme system     | Root layout (`app/layout.tsx`) + `DarkModeToggle`  | Cookie SSR + client hydration  |
| Brand assets     | `SETTLER_IMAGES` config + `/public/assets/images/` | Centralized                    |
| OG/social images | `/public/assets/images/social/`                    | Configured in root metadata    |
| Illustrations    | `/public/illustrations/`                           | SVG files used in landing page |

---

## Retired/Deferred Panels

| Panel                             | Reason                              | What Replaced It                    |
| --------------------------------- | ----------------------------------- | ----------------------------------- |
| `command_palette_&_global_search` | Mobile prototype; product uses cmdk | App-level command palette in future |
| `internal_glossary`               | Informational prototype             | `/docs` and `/docs/api`             |
| `untitled_screen_1/2`             | No defined product identity         | N/A                                 |

---

## Changes Made This Pass

1. **`/security-and-audit/page.tsx`** — Replaced `SecurityOverview` (mobile stitch component) with proper full-width marketing security page. `/security/page.tsx` redirect preserved.
2. **`Footer.tsx`** — Fixed GitHub URL from `https://github.com/shardie-github/Settler-API` to `https://github.com/Hardonian/Settler`.
3. **`DarkModeToggle.tsx`** — Eliminated pre-hydration `◐` flash; uses consistent icon without fouc.
4. **`tests/ui/landing.spec.ts`** — Expanded Playwright test coverage: nav links, secondary pages, theme persistence, FAQ a11y, no-duplicate-section guard, GitHub CTA href validation.
5. **`docs/marketing/STITCH_RECONCILIATION.md`** — This file.

---

## Verification

- All Stitch panels: disposition A, B, C, or D ✓
- No orphaned/limbo panels ✓
- Single canonical landing page at `/` ✓
- Single nav, single footer per marketing page ✓
- No duplicate hero/FAQ/CTA structures ✓
- Theme system SSR-safe ✓
- GitHub CTA href valid ✓
- Build passes ✓

---

## Pass 2 — 2026-03-08 (branch: claude/stitch-marketing-unification-okii7)

### Changes Made This Pass

1. **Brand canonicalization update** — Active logo sources now resolve from `/public/brand/settler/` via the shared `SettlerLogo` component (`logo-horizontal.svg` and `logo-horizontal-dark.svg`).

2. **`Navigation.tsx`** — Logo now conditionally renders light (`/brand/settler/logo-horizontal.svg`, `dark:hidden`) and
   dark (`/brand/settler/logo-horizontal-dark.svg`, `hidden dark:block`) variants. Added "Features" dropdown to desktop nav
   exposing: How It Works, Replay Lab, Proof Explorer. Added Features section to mobile sheet nav.
   Fixed `/security` nav link → now points directly at `/security-and-audit`.

3. **`Footer.tsx`** — Logo conditional rendering (same as Navigation). Replaced redundant "Resources"
   section (which duplicated Product links) with a "Features" section: Replay Lab, Proof Explorer,
   Quickstart, Documentation.

4. **`(marketing)/home/page.tsx`** — Added "Go Deeper on Each Capability" feature entry cards
   section (links to How It Works, Replay Lab, Proof Explorer). Added dark GitHub/Quickstart CTA
   section between feature cards and FAQ.

5. **`/replay-lab/page.tsx`** — Fixed structural bug: the "Stitch Replay Review Surface" section
   was rendered **outside** `<main>` (between `</main>` and `<Footer />`). Moved inside `<main>`,
   renamed to "Live Replay Review Surface".

6. **`docs/marketing/IA.md`** — Created canonical IA document defining the site structure,
   navigation model, footer structure, brand asset paths, and design system conventions.

### Verification (Pass 2)

- Logo visible in both light and dark mode ✓
- Feature pages reachable from homepage feature cards ✓
- Feature pages reachable from nav Features dropdown ✓
- Feature pages reachable from footer Features section ✓
- replay-lab document structure valid (section inside main) ✓
- No duplicate heroes, CTAs, or FAQs ✓
- Homepage section count: hero=1, FAQ=1, footer=1, CTA=1 ✓
