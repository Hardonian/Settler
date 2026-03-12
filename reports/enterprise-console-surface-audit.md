# Enterprise Surface Audit — Console / Cloud / Web

Date: 2026-03-12
Branch: `feat/parallel-enterprise-console-surfacing`

## Scope

- Console navigation and discoverability (`/console/*`).
- Console overview feature surfacing and premium differentiation.
- Public pricing communication for premium/enterprise value.

## Current-state findings (before changes)

1. **Enterprise surfaces existed but were under-discoverable in console navigation.**
   - Replay Lab, Audit Trail, Bulk Operations, Approvals, Rules Engine, and Operator Console pages existed as routes, but were not consistently surfaced in the main sidebar.
2. **Overview page lacked a clear “enterprise capabilities” entry panel.**
   - Core metrics were visible, but enterprise workflows (traceability/governance/operator intelligence) required route knowledge.
3. **Pricing page communicated engagement models, but not a product-surface capability comparison.**
   - Enterprise value language existed, but with limited mapping to real console surfaces.

## Implemented upgrades

1. **Console IA / navigation upgrade**
   - Added an `Enterprise` section in the sidebar with premium callout badge.
   - Surfaced routes:
     - Replay Lab
     - Audit Trail
     - Bulk Operations
     - Approvals
     - Rules Engine
     - Operator Console
   - Added Analytics Studio to core navigation for better reporting discovery.

2. **Console overview enterprise surfacing**
   - Added an “Enterprise Capability Surfaces” card on `/console` with direct entry points to:
     - Replay Lab
     - Audit Trail
     - Bulk Operations
     - Operator Console
   - Keeps feature claims tied to existing, routed pages.

3. **Pricing communication upgrade (truthful productization)**
   - Added a capability comparison table on `/pricing` that maps tier value to real surfaces:
     - Replay / trace diff
     - Bulk ops + approvals
     - Audit trail / retention
     - Operator control plane / failure intelligence
   - Added direct CTA links to console and replay surfaces to reduce claim-to-proof distance.

## CLI-to-UI gap notes

The following capability classes are now explicitly surfaced in UI navigation and/or pricing:

- Replay / deterministic traceability
- Bulk governance operations
- Approval workflows
- Operator intelligence surfaces

Residual gaps still not fully productized in a dedicated UI flow (recommend next track):

- CLI `tenant-check` style isolation diagnostics surfaced as tenant safety scorecards in console.
- CLI `verify-export` evidence integrity surfaced as guided verification reports in console.
- CLI `lineage` artifacts surfaced as visual topology explorer in console.

## Verification run

- `pnpm -C packages/web exec eslint src/components/console/ConsoleLayout.tsx src/app/console/page.tsx src/app/pricing/page.tsx`
- `pnpm -C packages/web typecheck`

## Residual risk

- Navigation additions increase route visibility but do not alter authorization semantics; route-level and API-level gating remain the enforcement boundary.
- Pricing comparison wording remains qualitative for managed/enterprise custom contracts; this is intentional to avoid fabricating fixed contract guarantees.
