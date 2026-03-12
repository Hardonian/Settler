# Static vs Dynamic Architecture Plan

## Decision framework

A page should be dynamic only if it requires tenant/user-specific data, operational freshness, or write/read workflows that cannot be safely prerendered. Otherwise keep it static for reliability and SEO.

## Recommended split

- Keep static: **84** pages.
- Convert/keep dynamic: **146** pages.
- Move to template-driven static generation: **24** pages.

## Dynamic candidates (priority)

1. Enterprise dashboards (`/enterprise/dashboard`, `/dashboard/**`, `/console/**`, `/app/**`) for live KPIs, tenant metrics, and permissions.
2. Audit reports and verification history (`/admin/audit`, `/app/audit`, `/console/audit-trail`, `/console/reconciliation/[runId]`, `/console/runs/[runId]`).
3. Replay explorer and execution detail (`/explorer/execution/[id]`, `/console/replay/[executionId]`, `/app/executions/[id]`, `/app/proofs/[id]`).
4. Analytics views (`/admin/analytics`, `/console/analytics`, `/app/metrics`, `/dashboard/usage`, `/realtime-dashboard`).

## Static preservation requirements during migration

- Preserve existing route paths; do not alter URL contracts.
- Keep metadata parity (`title`, `description`, Open Graph/Twitter) for all migrated pages.
- Preserve canonical tags and sitemap entries for public-facing pages.
- For any dynamic conversion, provide explicit fallback states (loading/empty/error) to avoid hard 500 behavior on user routes.

## Rollout sequencing

1. Migrate template-driven clusters first (low risk, high reduction in duplication).
2. Harden dynamic data boundaries for dashboard/admin surfaces with tenant-aware guards and cache controls.
3. Run SEO parity checks (URL map, metadata snapshots, canonical diff) before release.
