/**
 * Route Registry - Auto-generated
 * Generated at: 2026-02-14T04:35:08.676Z
 * 
 * This file contains all routes discovered in the Next.js app directory.
 * Use this for type-safe route checking and link validation.
 */

export interface RouteInfo {
  path: string;
  type: 'page' | 'layout' | 'route' | 'not-found' | 'error' | 'loading' | 'template';
  file: string;
  dynamic?: boolean;
  catchAll?: boolean;
  optional?: boolean;
}

export const ROUTES: RouteInfo[] = [
  {
    "path": "/",
    "type": "template",
    "file": "template.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/[slug]",
    "type": "page",
    "file": "[slug]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/about",
    "type": "page",
    "file": "about/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin",
    "type": "page",
    "file": "admin/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/analytics",
    "type": "page",
    "file": "admin/analytics/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/audit",
    "type": "page",
    "file": "admin/audit/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/branding",
    "type": "page",
    "file": "admin/branding/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/database",
    "type": "page",
    "file": "admin/database/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/database/[table]",
    "type": "page",
    "file": "admin/database/[table]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/exceptions",
    "type": "page",
    "file": "admin/exceptions/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/exceptions/[id]",
    "type": "page",
    "file": "admin/exceptions/[id]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/experiments",
    "type": "page",
    "file": "admin/experiments/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/experiments/[id]",
    "type": "page",
    "file": "admin/experiments/[id]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/experiments/new",
    "type": "page",
    "file": "admin/experiments/new/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/flags",
    "type": "page",
    "file": "admin/flags/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/jobforge",
    "type": "page",
    "file": "admin/jobforge/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/metrics",
    "type": "page",
    "file": "admin/metrics/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/monitoring",
    "type": "page",
    "file": "admin/monitoring/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/ops",
    "type": "page",
    "file": "admin/ops/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/pages",
    "type": "page",
    "file": "admin/pages/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/pages/[id]/editor",
    "type": "page",
    "file": "admin/pages/[id]/editor/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/pages/new",
    "type": "page",
    "file": "admin/pages/new/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/runs",
    "type": "page",
    "file": "admin/runs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/runs/[runId]",
    "type": "page",
    "file": "admin/runs/[runId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/runs/compare",
    "type": "page",
    "file": "admin/runs/compare/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/settings",
    "type": "page",
    "file": "admin/settings/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/admin/webhooks",
    "type": "page",
    "file": "admin/webhooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/audit",
    "type": "route",
    "file": "api/admin/audit/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/exceptions",
    "type": "route",
    "file": "api/admin/exceptions/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/exceptions/[id]/escalate",
    "type": "route",
    "file": "api/admin/exceptions/[id]/escalate/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/exceptions/[id]/resolve",
    "type": "route",
    "file": "api/admin/exceptions/[id]/resolve/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/health",
    "type": "route",
    "file": "api/admin/health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/jobforge",
    "type": "route",
    "file": "api/admin/jobforge/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/metrics",
    "type": "route",
    "file": "api/admin/metrics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/runs",
    "type": "route",
    "file": "api/admin/runs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/stream",
    "type": "route",
    "file": "api/admin/stream/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ai/data-insights",
    "type": "route",
    "file": "api/ai/data-insights/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ai/onboarding-assistant",
    "type": "route",
    "file": "api/ai/onboarding-assistant/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ai/support-assistant",
    "type": "route",
    "file": "api/ai/support-assistant/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ai/troubleshooting",
    "type": "route",
    "file": "api/ai/troubleshooting/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/billing/dispute",
    "type": "route",
    "file": "api/billing/dispute/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/billing/payment-recovery",
    "type": "route",
    "file": "api/billing/payment-recovery/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/billing/retry-payment",
    "type": "route",
    "file": "api/billing/retry-payment/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/builder/revalidate",
    "type": "route",
    "file": "api/builder/revalidate/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/backfill/[providerId]",
    "type": "route",
    "file": "api/connectors/backfill/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/callback/[providerId]",
    "type": "route",
    "file": "api/connectors/callback/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/connect/[providerId]",
    "type": "route",
    "file": "api/connectors/connect/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/disconnect/[providerId]",
    "type": "route",
    "file": "api/connectors/disconnect/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/refresh/[providerId]",
    "type": "route",
    "file": "api/connectors/refresh/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/sync/[providerId]",
    "type": "route",
    "file": "api/connectors/sync/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/test/[providerId]",
    "type": "route",
    "file": "api/connectors/test/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/connectors/webhook/[providerId]",
    "type": "route",
    "file": "api/connectors/webhook/[providerId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/activities",
    "type": "route",
    "file": "api/console/activities/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ai-analysis",
    "type": "route",
    "file": "api/console/ai-analysis/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ai-tokens/usage",
    "type": "route",
    "file": "api/console/ai-tokens/usage/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/alerts",
    "type": "route",
    "file": "api/console/alerts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/alerts/[id]/acknowledge",
    "type": "route",
    "file": "api/console/alerts/[id]/acknowledge/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/analytics/datasets",
    "type": "route",
    "file": "api/console/analytics/datasets/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/analytics/pivot",
    "type": "route",
    "file": "api/console/analytics/pivot/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/analytics/rollup",
    "type": "route",
    "file": "api/console/analytics/rollup/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/analytics/saved-views",
    "type": "route",
    "file": "api/console/analytics/saved-views/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/api-keys",
    "type": "route",
    "file": "api/console/api-keys/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/api-keys/[id]",
    "type": "route",
    "file": "api/console/api-keys/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/api-logs",
    "type": "route",
    "file": "api/console/api-logs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/billing",
    "type": "route",
    "file": "api/console/billing/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/billing/ai-tokens",
    "type": "route",
    "file": "api/console/billing/ai-tokens/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/costs",
    "type": "route",
    "file": "api/console/costs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/feature-flags",
    "type": "route",
    "file": "api/console/feature-flags/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/feature-flags/[id]/environments/[env]",
    "type": "route",
    "file": "api/console/feature-flags/[id]/environments/[env]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/health",
    "type": "route",
    "file": "api/console/health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/insights",
    "type": "route",
    "file": "api/console/insights/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/meaningful-changes",
    "type": "route",
    "file": "api/console/meaningful-changes/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/metrics",
    "type": "route",
    "file": "api/console/metrics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/performance",
    "type": "route",
    "file": "api/console/performance/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/reality",
    "type": "route",
    "file": "api/console/reality/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/receipts",
    "type": "route",
    "file": "api/console/receipts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/receipts-v2",
    "type": "route",
    "file": "api/console/receipts-v2/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/receipts/[id]",
    "type": "route",
    "file": "api/console/receipts/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/reconciliation",
    "type": "route",
    "file": "api/console/reconciliation/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/branding",
    "type": "route",
    "file": "api/console/site/branding/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments",
    "type": "route",
    "file": "api/console/site/experiments/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments/[id]",
    "type": "route",
    "file": "api/console/site/experiments/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments/[id]/results",
    "type": "route",
    "file": "api/console/site/experiments/[id]/results/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments/[id]/start",
    "type": "route",
    "file": "api/console/site/experiments/[id]/start/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/navigation",
    "type": "route",
    "file": "api/console/site/navigation/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/pages",
    "type": "route",
    "file": "api/console/site/pages/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/pages/[id]",
    "type": "route",
    "file": "api/console/site/pages/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/pages/[id]/publish",
    "type": "route",
    "file": "api/console/site/pages/[id]/publish/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/ui-config",
    "type": "route",
    "file": "api/console/site/ui-config/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/subscription",
    "type": "route",
    "file": "api/console/subscription/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/subscription-status",
    "type": "route",
    "file": "api/console/subscription-status/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/support/tickets",
    "type": "route",
    "file": "api/console/support/tickets/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/support/triage",
    "type": "route",
    "file": "api/console/support/triage/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/tables/[table]",
    "type": "route",
    "file": "api/console/tables/[table]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/tenants",
    "type": "route",
    "file": "api/console/tenants/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/usage",
    "type": "route",
    "file": "api/console/usage/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/usage/alerts",
    "type": "route",
    "file": "api/console/usage/alerts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/usage/analytics",
    "type": "route",
    "file": "api/console/usage/analytics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/usage/export",
    "type": "route",
    "file": "api/console/usage/export/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/usage/warnings",
    "type": "route",
    "file": "api/console/usage/warnings/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/user-role",
    "type": "route",
    "file": "api/console/user-role/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/webhooks",
    "type": "route",
    "file": "api/console/webhooks/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/webhooks/[id]",
    "type": "route",
    "file": "api/console/webhooks/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/cron/check-reliability-alerts",
    "type": "route",
    "file": "api/cron/check-reliability-alerts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/cron/daily-cost-rollup",
    "type": "route",
    "file": "api/cron/daily-cost-rollup/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/cron/email-lifecycle",
    "type": "route",
    "file": "api/cron/email-lifecycle/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/cron/low-activity",
    "type": "route",
    "file": "api/cron/low-activity/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/cron/monthly-summary",
    "type": "route",
    "file": "api/cron/monthly-summary/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/data/export",
    "type": "route",
    "file": "api/data/export/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/data/import",
    "type": "route",
    "file": "api/data/import/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/docs/openapi",
    "type": "route",
    "file": "api/docs/openapi/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/enterprise/contact",
    "type": "route",
    "file": "api/enterprise/contact/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/enterprise/ip-allowlist",
    "type": "route",
    "file": "api/enterprise/ip-allowlist/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/enterprise/ip-allowlist/[id]",
    "type": "route",
    "file": "api/enterprise/ip-allowlist/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/exports",
    "type": "route",
    "file": "api/exports/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/feedback-loops/insights",
    "type": "route",
    "file": "api/feedback-loops/insights/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/gtm/demo/reset",
    "type": "route",
    "file": "api/gtm/demo/reset/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/gtm/funnel-stage",
    "type": "route",
    "file": "api/gtm/funnel-stage/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/gtm/roi",
    "type": "route",
    "file": "api/gtm/roi/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/health",
    "type": "route",
    "file": "api/health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/health/console",
    "type": "route",
    "file": "api/health/console/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/health/stripe",
    "type": "route",
    "file": "api/health/stripe/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/image-optimize",
    "type": "route",
    "file": "api/image-optimize/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/imports/validate",
    "type": "route",
    "file": "api/imports/validate/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/[integrationId]/debug",
    "type": "route",
    "file": "api/integrations/[integrationId]/debug/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/[integrationId]/test",
    "type": "route",
    "file": "api/integrations/[integrationId]/test/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/[integrationId]/upgrade",
    "type": "route",
    "file": "api/integrations/[integrationId]/upgrade/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/[integrationId]/versions",
    "type": "route",
    "file": "api/integrations/[integrationId]/versions/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/analytics",
    "type": "route",
    "file": "api/integrations/analytics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/health",
    "type": "route",
    "file": "api/integrations/health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/internal/health/deep",
    "type": "route",
    "file": "api/internal/health/deep/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/internal/jobs/drain",
    "type": "route",
    "file": "api/internal/jobs/drain/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/invite/[token]",
    "type": "route",
    "file": "api/invite/[token]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs",
    "type": "route",
    "file": "api/jobs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/[id]",
    "type": "route",
    "file": "api/jobs/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/[id]/exceptions",
    "type": "route",
    "file": "api/jobs/[id]/exceptions/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/[id]/exceptions/[exceptionId]",
    "type": "route",
    "file": "api/jobs/[id]/exceptions/[exceptionId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/[id]/progress",
    "type": "route",
    "file": "api/jobs/[id]/progress/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/[id]/result",
    "type": "route",
    "file": "api/jobs/[id]/result/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/jobs/bulk",
    "type": "route",
    "file": "api/jobs/bulk/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/metrics",
    "type": "route",
    "file": "api/metrics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/metrics/prometheus",
    "type": "route",
    "file": "api/metrics/prometheus/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/milestones",
    "type": "route",
    "file": "api/milestones/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/onboarding/progress",
    "type": "route",
    "file": "api/onboarding/progress/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/onboarding/progress/skip",
    "type": "route",
    "file": "api/onboarding/progress/skip/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/activation-funnel",
    "type": "route",
    "file": "api/ops/activation-funnel/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/customers",
    "type": "route",
    "file": "api/ops/customers/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/edge-functions",
    "type": "route",
    "file": "api/ops/edge-functions/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/overview",
    "type": "route",
    "file": "api/ops/overview/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/performance",
    "type": "route",
    "file": "api/ops/performance/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/retry-queues",
    "type": "route",
    "file": "api/ops/retry-queues/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ops/system-health",
    "type": "route",
    "file": "api/ops/system-health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/oss/stats",
    "type": "route",
    "file": "api/oss/stats/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/pricing/experiments",
    "type": "route",
    "file": "api/pricing/experiments/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/projects",
    "type": "route",
    "file": "api/projects/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/projects/snapshots",
    "type": "route",
    "file": "api/projects/snapshots/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/projects/snapshots/[snapshotId]/export",
    "type": "route",
    "file": "api/projects/snapshots/[snapshotId]/export/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/projects/snapshots/[snapshotId]/rollback",
    "type": "route",
    "file": "api/projects/snapshots/[snapshotId]/rollback/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/public/reality",
    "type": "route",
    "file": "api/public/reality/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/public/ui-config",
    "type": "route",
    "file": "api/public/ui-config/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/quota",
    "type": "route",
    "file": "api/quota/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/rbac/roles",
    "type": "route",
    "file": "api/rbac/roles/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/rbac/users",
    "type": "route",
    "file": "api/rbac/users/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/receipts/ocr",
    "type": "route",
    "file": "api/receipts/ocr/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/referrals",
    "type": "route",
    "file": "api/referrals/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/runs/[runId]",
    "type": "route",
    "file": "api/runs/[runId]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/runs/create",
    "type": "route",
    "file": "api/runs/create/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/seo/generate-sitemap",
    "type": "route",
    "file": "api/seo/generate-sitemap/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/share/[id]",
    "type": "route",
    "file": "api/share/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/status",
    "type": "route",
    "file": "api/status/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/status/health",
    "type": "route",
    "file": "api/status/health/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/stripe/checkout",
    "type": "route",
    "file": "api/stripe/checkout/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/stripe/portal",
    "type": "route",
    "file": "api/stripe/portal/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/stripe/webhook",
    "type": "route",
    "file": "api/stripe/webhook/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/support/canned-responses",
    "type": "route",
    "file": "api/support/canned-responses/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/support/report-issue",
    "type": "route",
    "file": "api/support/report-issue/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/support/tickets",
    "type": "route",
    "file": "api/support/tickets/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/user/checklist",
    "type": "route",
    "file": "api/user/checklist/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/user/pre-test",
    "type": "route",
    "file": "api/user/pre-test/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/user/upgrade",
    "type": "route",
    "file": "api/user/upgrade/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/user/value-moments",
    "type": "route",
    "file": "api/user/value-moments/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1",
    "type": "route",
    "file": "api/v1/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/convert",
    "type": "route",
    "file": "api/v1/convert/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/feature-flags",
    "type": "route",
    "file": "api/v1/feature-flags/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/feature-flags/[id]",
    "type": "route",
    "file": "api/v1/feature-flags/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/feature-flags/evaluate",
    "type": "route",
    "file": "api/v1/feature-flags/evaluate/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/receipts",
    "type": "route",
    "file": "api/v1/receipts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/receipts/[id]",
    "type": "route",
    "file": "api/v1/receipts/[id]/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/recon/jobs",
    "type": "route",
    "file": "api/v1/recon/jobs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/vercel-example",
    "type": "route",
    "file": "api/vercel-example/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/workspaces",
    "type": "route",
    "file": "api/workspaces/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/workspaces/[workspaceId]/invites",
    "type": "route",
    "file": "api/workspaces/[workspaceId]/invites/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/workspaces/[workspaceId]/onboarding",
    "type": "route",
    "file": "api/workspaces/[workspaceId]/onboarding/route.ts",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/app",
    "type": "page",
    "file": "app/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/architecture",
    "type": "page",
    "file": "architecture/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/benchmarks",
    "type": "page",
    "file": "benchmarks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/billing",
    "type": "error",
    "file": "billing/error.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/billing/success",
    "type": "page",
    "file": "billing/success/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/blog",
    "type": "page",
    "file": "blog/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/builder/[...page]",
    "type": "page",
    "file": "builder/[...page]/page.tsx",
    "dynamic": true,
    "catchAll": true,
    "optional": false
  },
  {
    "path": "/changelog",
    "type": "page",
    "file": "changelog/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/changelog/[slug]",
    "type": "page",
    "file": "changelog/[slug]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/community",
    "type": "page",
    "file": "community/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/community/contributors",
    "type": "page",
    "file": "community/contributors/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/comparison",
    "type": "page",
    "file": "comparison/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console",
    "type": "page",
    "file": "console/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/activity",
    "type": "page",
    "file": "console/activity/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/admin/activation",
    "type": "page",
    "file": "console/admin/activation/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/admin/jobs",
    "type": "page",
    "file": "console/admin/jobs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/admin/tenants",
    "type": "page",
    "file": "console/admin/tenants/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/ai-analysis",
    "type": "page",
    "file": "console/ai-analysis/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/alerts-view",
    "type": "page",
    "file": "console/alerts-view/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/analytics",
    "type": "page",
    "file": "console/analytics/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/api-keys",
    "type": "page",
    "file": "console/api-keys/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/api-logs",
    "type": "page",
    "file": "console/api-logs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/api-playground",
    "type": "page",
    "file": "console/api-playground/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/api-playground/collections",
    "type": "page",
    "file": "console/api-playground/collections/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/api-test",
    "type": "page",
    "file": "console/api-test/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/approvals",
    "type": "page",
    "file": "console/approvals/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/audit-trail",
    "type": "page",
    "file": "console/audit-trail/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/billing",
    "type": "page",
    "file": "console/billing/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/briefings",
    "type": "page",
    "file": "console/briefings/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/bulk-operations",
    "type": "page",
    "file": "console/bulk-operations/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/changes",
    "type": "page",
    "file": "console/changes/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/control-plane",
    "type": "page",
    "file": "console/control-plane/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/costs",
    "type": "page",
    "file": "console/costs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/diagnostics",
    "type": "page",
    "file": "console/diagnostics/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/docs",
    "type": "page",
    "file": "console/docs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/feature-flags",
    "type": "page",
    "file": "console/feature-flags/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/feature-flags-policy",
    "type": "page",
    "file": "console/feature-flags-policy/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/ingestion/[ingestionId]",
    "type": "page",
    "file": "console/ingestion/[ingestionId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/insights",
    "type": "page",
    "file": "console/insights/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/inspector",
    "type": "page",
    "file": "console/inspector/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/multi-source-reconciliation",
    "type": "page",
    "file": "console/multi-source-reconciliation/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/onboarding",
    "type": "page",
    "file": "console/onboarding/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/ops",
    "type": "page",
    "file": "console/ops/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/performance",
    "type": "page",
    "file": "console/performance/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground",
    "type": "page",
    "file": "console/playground/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground/cli",
    "type": "page",
    "file": "console/playground/cli/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground/convert",
    "type": "page",
    "file": "console/playground/convert/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground/flags",
    "type": "page",
    "file": "console/playground/flags/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground/receipts",
    "type": "page",
    "file": "console/playground/receipts/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/playground/reconcile",
    "type": "page",
    "file": "console/playground/reconcile/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/reality",
    "type": "page",
    "file": "console/reality/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/receipt-matching",
    "type": "page",
    "file": "console/receipt-matching/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/receipts",
    "type": "page",
    "file": "console/receipts/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/receipts-hash",
    "type": "page",
    "file": "console/receipts-hash/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/reconciliation-view",
    "type": "page",
    "file": "console/reconciliation-view/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/reconciliation/[runId]",
    "type": "page",
    "file": "console/reconciliation/[runId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/rules-engine",
    "type": "page",
    "file": "console/rules-engine/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/runs",
    "type": "error",
    "file": "console/runs/error.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/runs/[runId]",
    "type": "page",
    "file": "console/runs/[runId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/setup-check",
    "type": "page",
    "file": "console/setup-check/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site",
    "type": "page",
    "file": "console/site/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/branding",
    "type": "page",
    "file": "console/site/branding/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/experiments",
    "type": "page",
    "file": "console/site/experiments/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/experiments/[id]",
    "type": "page",
    "file": "console/site/experiments/[id]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/navigation",
    "type": "page",
    "file": "console/site/navigation/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/pages/[id]",
    "type": "page",
    "file": "console/site/pages/[id]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/site/ui-config",
    "type": "page",
    "file": "console/site/ui-config/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/sla",
    "type": "page",
    "file": "console/sla/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/support",
    "type": "page",
    "file": "console/support/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/tables",
    "type": "page",
    "file": "console/tables/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/tables/[table]",
    "type": "page",
    "file": "console/tables/[table]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/usage",
    "type": "page",
    "file": "console/usage/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/webhooks",
    "type": "page",
    "file": "console/webhooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/workflows",
    "type": "page",
    "file": "console/workflows/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/workflows/[id]",
    "type": "page",
    "file": "console/workflows/[id]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/console/workflows/new",
    "type": "page",
    "file": "console/workflows/new/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/contact",
    "type": "page",
    "file": "contact/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/cookbook",
    "type": "page",
    "file": "cookbook/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/cookbooks",
    "type": "page",
    "file": "cookbooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard",
    "type": "page",
    "file": "dashboard/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/addons",
    "type": "page",
    "file": "dashboard/addons/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/billing",
    "type": "page",
    "file": "dashboard/billing/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/billing/invoices",
    "type": "page",
    "file": "dashboard/billing/invoices/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/billing/payment-methods",
    "type": "page",
    "file": "dashboard/billing/payment-methods/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/integrations",
    "type": "page",
    "file": "dashboard/integrations/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/integrations/[integrationId]",
    "type": "page",
    "file": "dashboard/integrations/[integrationId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/integrations/[integrationId]/logs",
    "type": "page",
    "file": "dashboard/integrations/[integrationId]/logs/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/jobs",
    "type": "page",
    "file": "dashboard/jobs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/jobs/[jobId]",
    "type": "page",
    "file": "dashboard/jobs/[jobId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/jobs/[jobId]/exceptions",
    "type": "page",
    "file": "dashboard/jobs/[jobId]/exceptions/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/usage",
    "type": "page",
    "file": "dashboard/usage/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/dashboard/user",
    "type": "page",
    "file": "dashboard/user/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/demo",
    "type": "page",
    "file": "demo/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/demo/api",
    "type": "page",
    "file": "demo/api/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/demo/receipts",
    "type": "page",
    "file": "demo/receipts/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/demo/reconciliation",
    "type": "page",
    "file": "demo/reconciliation/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs",
    "type": "page",
    "file": "docs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/api",
    "type": "page",
    "file": "docs/api/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/auth",
    "type": "page",
    "file": "docs/auth/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/cli",
    "type": "page",
    "file": "docs/cli/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/errors",
    "type": "page",
    "file": "docs/errors/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/examples",
    "type": "page",
    "file": "docs/examples/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/getting-started",
    "type": "page",
    "file": "docs/getting-started/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/integrations",
    "type": "page",
    "file": "docs/integrations/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/integrations/[integrationId]",
    "type": "page",
    "file": "docs/integrations/[integrationId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/quickstart",
    "type": "page",
    "file": "docs/quickstart/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/sdk",
    "type": "page",
    "file": "docs/sdk/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/sdk/go",
    "type": "page",
    "file": "docs/sdk/go/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/sdk/nodejs",
    "type": "page",
    "file": "docs/sdk/nodejs/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/sdk/python",
    "type": "page",
    "file": "docs/sdk/python/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/sdk/ruby",
    "type": "page",
    "file": "docs/sdk/ruby/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/status",
    "type": "page",
    "file": "docs/status/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/docs/webhooks",
    "type": "page",
    "file": "docs/webhooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/edge-ai",
    "type": "page",
    "file": "edge-ai/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/edge-ai/nodes",
    "type": "page",
    "file": "edge-ai/nodes/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/edge-ai/nodes/[nodeId]",
    "type": "page",
    "file": "edge-ai/nodes/[nodeId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/edge-ai/nodes/new",
    "type": "page",
    "file": "edge-ai/nodes/new/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/engine",
    "type": "page",
    "file": "engine/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/engine/create-run-pack",
    "type": "page",
    "file": "engine/create-run-pack/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/engine/import-results",
    "type": "page",
    "file": "engine/import-results/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/engine/view-variances",
    "type": "page",
    "file": "engine/view-variances/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/enterprise",
    "type": "page",
    "file": "enterprise/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/enterprise/dashboard",
    "type": "page",
    "file": "enterprise/dashboard/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/feature-flags",
    "type": "page",
    "file": "feature-flags/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/founder",
    "type": "page",
    "file": "founder/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/home",
    "type": "page",
    "file": "(marketing)/home/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/how-it-works",
    "type": "page",
    "file": "how-it-works/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/integrations",
    "type": "page",
    "file": "integrations/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/integrations/request",
    "type": "page",
    "file": "integrations/request/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/investor/proof",
    "type": "page",
    "file": "investor/proof/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/investor/reality",
    "type": "page",
    "file": "investor/reality/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/invite/[token]",
    "type": "page",
    "file": "invite/[token]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal",
    "type": "page",
    "file": "legal/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/aup",
    "type": "page",
    "file": "legal/aup/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/cookies",
    "type": "page",
    "file": "legal/cookies/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/dpa",
    "type": "page",
    "file": "legal/dpa/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/license",
    "type": "page",
    "file": "legal/license/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/privacy",
    "type": "page",
    "file": "legal/privacy/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/subprocessors",
    "type": "page",
    "file": "legal/subprocessors/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/legal/terms",
    "type": "page",
    "file": "legal/terms/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/login",
    "type": "page",
    "file": "login/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/mobile",
    "type": "page",
    "file": "mobile/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/offline",
    "type": "page",
    "file": "offline/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/open-source",
    "type": "page",
    "file": "open-source/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/oss",
    "type": "page",
    "file": "oss/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/oss/stats",
    "type": "page",
    "file": "oss/stats/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/platform",
    "type": "page",
    "file": "platform/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/playground",
    "type": "page",
    "file": "playground/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/pricing",
    "type": "page",
    "file": "pricing/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/privacy",
    "type": "page",
    "file": "privacy/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/product",
    "type": "page",
    "file": "product/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/proof",
    "type": "page",
    "file": "proof/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/react-settler-demo",
    "type": "page",
    "file": "react-settler-demo/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/realtime-dashboard",
    "type": "page",
    "file": "realtime-dashboard/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/receipts",
    "type": "page",
    "file": "receipts/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/review/polish",
    "type": "page",
    "file": "review/polish/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/roadmap",
    "type": "page",
    "file": "roadmap/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/roi-calculator",
    "type": "page",
    "file": "roi-calculator/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/runbooks",
    "type": "page",
    "file": "runbooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/schematics",
    "type": "page",
    "file": "schematics/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/security",
    "type": "page",
    "file": "security/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/security-and-audit",
    "type": "page",
    "file": "security-and-audit/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/signup",
    "type": "page",
    "file": "signup/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/status",
    "type": "page",
    "file": "status/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/support",
    "type": "page",
    "file": "support/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/support/articles/[articleId]",
    "type": "page",
    "file": "support/articles/[articleId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/support/category/[categoryId]",
    "type": "page",
    "file": "support/category/[categoryId]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/support/contact",
    "type": "page",
    "file": "support/contact/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/terms",
    "type": "page",
    "file": "terms/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/trust",
    "type": "page",
    "file": "trust/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/use-cases/[slug]",
    "type": "page",
    "file": "use-cases/[slug]/page.tsx",
    "dynamic": true,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/ux-playground",
    "type": "page",
    "file": "ux-playground/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/ux-playground/events",
    "type": "page",
    "file": "ux-playground/events/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/verify",
    "type": "page",
    "file": "verify/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/vision",
    "type": "page",
    "file": "vision/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/why-settler",
    "type": "page",
    "file": "why-settler/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  }
];

export const PAGE_ROUTES: string[] = [
  "/[slug]",
  "/about",
  "/admin",
  "/admin/analytics",
  "/admin/audit",
  "/admin/branding",
  "/admin/database",
  "/admin/database/[table]",
  "/admin/exceptions",
  "/admin/exceptions/[id]",
  "/admin/experiments",
  "/admin/experiments/[id]",
  "/admin/experiments/new",
  "/admin/flags",
  "/admin/jobforge",
  "/admin/metrics",
  "/admin/monitoring",
  "/admin/ops",
  "/admin/pages",
  "/admin/pages/[id]/editor",
  "/admin/pages/new",
  "/admin/runs",
  "/admin/runs/[runId]",
  "/admin/runs/compare",
  "/admin/settings",
  "/admin/webhooks",
  "/app",
  "/architecture",
  "/benchmarks",
  "/billing/success",
  "/blog",
  "/builder/[...page]",
  "/changelog",
  "/changelog/[slug]",
  "/community",
  "/community/contributors",
  "/comparison",
  "/console",
  "/console/activity",
  "/console/admin/activation",
  "/console/admin/jobs",
  "/console/admin/tenants",
  "/console/ai-analysis",
  "/console/alerts-view",
  "/console/analytics",
  "/console/api-keys",
  "/console/api-logs",
  "/console/api-playground",
  "/console/api-playground/collections",
  "/console/api-test",
  "/console/approvals",
  "/console/audit-trail",
  "/console/billing",
  "/console/briefings",
  "/console/bulk-operations",
  "/console/changes",
  "/console/control-plane",
  "/console/costs",
  "/console/diagnostics",
  "/console/docs",
  "/console/feature-flags",
  "/console/feature-flags-policy",
  "/console/ingestion/[ingestionId]",
  "/console/insights",
  "/console/inspector",
  "/console/multi-source-reconciliation",
  "/console/onboarding",
  "/console/ops",
  "/console/performance",
  "/console/playground",
  "/console/playground/cli",
  "/console/playground/convert",
  "/console/playground/flags",
  "/console/playground/receipts",
  "/console/playground/reconcile",
  "/console/reality",
  "/console/receipt-matching",
  "/console/receipts",
  "/console/receipts-hash",
  "/console/reconciliation-view",
  "/console/reconciliation/[runId]",
  "/console/rules-engine",
  "/console/runs/[runId]",
  "/console/setup-check",
  "/console/site",
  "/console/site/branding",
  "/console/site/experiments",
  "/console/site/experiments/[id]",
  "/console/site/navigation",
  "/console/site/pages/[id]",
  "/console/site/ui-config",
  "/console/sla",
  "/console/support",
  "/console/tables",
  "/console/tables/[table]",
  "/console/usage",
  "/console/webhooks",
  "/console/workflows",
  "/console/workflows/[id]",
  "/console/workflows/new",
  "/contact",
  "/cookbook",
  "/cookbooks",
  "/dashboard",
  "/dashboard/addons",
  "/dashboard/billing",
  "/dashboard/billing/invoices",
  "/dashboard/billing/payment-methods",
  "/dashboard/integrations",
  "/dashboard/integrations/[integrationId]",
  "/dashboard/integrations/[integrationId]/logs",
  "/dashboard/jobs",
  "/dashboard/jobs/[jobId]",
  "/dashboard/jobs/[jobId]/exceptions",
  "/dashboard/usage",
  "/dashboard/user",
  "/demo",
  "/demo/api",
  "/demo/receipts",
  "/demo/reconciliation",
  "/docs",
  "/docs/api",
  "/docs/auth",
  "/docs/cli",
  "/docs/errors",
  "/docs/examples",
  "/docs/getting-started",
  "/docs/integrations",
  "/docs/integrations/[integrationId]",
  "/docs/quickstart",
  "/docs/sdk",
  "/docs/sdk/go",
  "/docs/sdk/nodejs",
  "/docs/sdk/python",
  "/docs/sdk/ruby",
  "/docs/status",
  "/docs/webhooks",
  "/edge-ai",
  "/edge-ai/nodes",
  "/edge-ai/nodes/[nodeId]",
  "/edge-ai/nodes/new",
  "/engine",
  "/engine/create-run-pack",
  "/engine/import-results",
  "/engine/view-variances",
  "/enterprise",
  "/enterprise/dashboard",
  "/feature-flags",
  "/founder",
  "/home",
  "/how-it-works",
  "/integrations",
  "/integrations/request",
  "/investor/proof",
  "/investor/reality",
  "/invite/[token]",
  "/legal",
  "/legal/aup",
  "/legal/cookies",
  "/legal/dpa",
  "/legal/license",
  "/legal/privacy",
  "/legal/subprocessors",
  "/legal/terms",
  "/login",
  "/mobile",
  "/offline",
  "/open-source",
  "/oss",
  "/oss/stats",
  "/platform",
  "/playground",
  "/pricing",
  "/privacy",
  "/product",
  "/proof",
  "/react-settler-demo",
  "/realtime-dashboard",
  "/receipts",
  "/review/polish",
  "/roadmap",
  "/roi-calculator",
  "/runbooks",
  "/schematics",
  "/security",
  "/security-and-audit",
  "/signup",
  "/status",
  "/support",
  "/support/articles/[articleId]",
  "/support/category/[categoryId]",
  "/support/contact",
  "/terms",
  "/trust",
  "/use-cases/[slug]",
  "/ux-playground",
  "/ux-playground/events",
  "/verify",
  "/vision",
  "/why-settler"
];

export const ALL_ROUTES: string[] = [
  "/",
  "/[slug]",
  "/about",
  "/admin",
  "/admin/analytics",
  "/admin/audit",
  "/admin/branding",
  "/admin/database",
  "/admin/database/[table]",
  "/admin/exceptions",
  "/admin/exceptions/[id]",
  "/admin/experiments",
  "/admin/experiments/[id]",
  "/admin/experiments/new",
  "/admin/flags",
  "/admin/jobforge",
  "/admin/metrics",
  "/admin/monitoring",
  "/admin/ops",
  "/admin/pages",
  "/admin/pages/[id]/editor",
  "/admin/pages/new",
  "/admin/runs",
  "/admin/runs/[runId]",
  "/admin/runs/compare",
  "/admin/settings",
  "/admin/webhooks",
  "/api/admin/audit",
  "/api/admin/exceptions",
  "/api/admin/exceptions/[id]/escalate",
  "/api/admin/exceptions/[id]/resolve",
  "/api/admin/health",
  "/api/admin/jobforge",
  "/api/admin/metrics",
  "/api/admin/runs",
  "/api/admin/stream",
  "/api/ai/data-insights",
  "/api/ai/onboarding-assistant",
  "/api/ai/support-assistant",
  "/api/ai/troubleshooting",
  "/api/billing/dispute",
  "/api/billing/payment-recovery",
  "/api/billing/retry-payment",
  "/api/builder/revalidate",
  "/api/connectors/backfill/[providerId]",
  "/api/connectors/callback/[providerId]",
  "/api/connectors/connect/[providerId]",
  "/api/connectors/disconnect/[providerId]",
  "/api/connectors/refresh/[providerId]",
  "/api/connectors/sync/[providerId]",
  "/api/connectors/test/[providerId]",
  "/api/connectors/webhook/[providerId]",
  "/api/console/activities",
  "/api/console/ai-analysis",
  "/api/console/ai-tokens/usage",
  "/api/console/alerts",
  "/api/console/alerts/[id]/acknowledge",
  "/api/console/analytics/datasets",
  "/api/console/analytics/pivot",
  "/api/console/analytics/rollup",
  "/api/console/analytics/saved-views",
  "/api/console/api-keys",
  "/api/console/api-keys/[id]",
  "/api/console/api-logs",
  "/api/console/billing",
  "/api/console/billing/ai-tokens",
  "/api/console/costs",
  "/api/console/feature-flags",
  "/api/console/feature-flags/[id]/environments/[env]",
  "/api/console/health",
  "/api/console/insights",
  "/api/console/meaningful-changes",
  "/api/console/metrics",
  "/api/console/performance",
  "/api/console/reality",
  "/api/console/receipts",
  "/api/console/receipts-v2",
  "/api/console/receipts/[id]",
  "/api/console/reconciliation",
  "/api/console/site/branding",
  "/api/console/site/experiments",
  "/api/console/site/experiments/[id]",
  "/api/console/site/experiments/[id]/results",
  "/api/console/site/experiments/[id]/start",
  "/api/console/site/navigation",
  "/api/console/site/pages",
  "/api/console/site/pages/[id]",
  "/api/console/site/pages/[id]/publish",
  "/api/console/site/ui-config",
  "/api/console/subscription",
  "/api/console/subscription-status",
  "/api/console/support/tickets",
  "/api/console/support/triage",
  "/api/console/tables/[table]",
  "/api/console/tenants",
  "/api/console/usage",
  "/api/console/usage/alerts",
  "/api/console/usage/analytics",
  "/api/console/usage/export",
  "/api/console/usage/warnings",
  "/api/console/user-role",
  "/api/console/webhooks",
  "/api/console/webhooks/[id]",
  "/api/cron/check-reliability-alerts",
  "/api/cron/daily-cost-rollup",
  "/api/cron/email-lifecycle",
  "/api/cron/low-activity",
  "/api/cron/monthly-summary",
  "/api/data/export",
  "/api/data/import",
  "/api/docs/openapi",
  "/api/enterprise/contact",
  "/api/enterprise/ip-allowlist",
  "/api/enterprise/ip-allowlist/[id]",
  "/api/exports",
  "/api/feedback-loops/insights",
  "/api/gtm/demo/reset",
  "/api/gtm/funnel-stage",
  "/api/gtm/roi",
  "/api/health",
  "/api/health/console",
  "/api/health/stripe",
  "/api/image-optimize",
  "/api/imports/validate",
  "/api/integrations/[integrationId]/debug",
  "/api/integrations/[integrationId]/test",
  "/api/integrations/[integrationId]/upgrade",
  "/api/integrations/[integrationId]/versions",
  "/api/integrations/analytics",
  "/api/integrations/health",
  "/api/internal/health/deep",
  "/api/internal/jobs/drain",
  "/api/invite/[token]",
  "/api/jobs",
  "/api/jobs/[id]",
  "/api/jobs/[id]/exceptions",
  "/api/jobs/[id]/exceptions/[exceptionId]",
  "/api/jobs/[id]/progress",
  "/api/jobs/[id]/result",
  "/api/jobs/bulk",
  "/api/metrics",
  "/api/metrics/prometheus",
  "/api/milestones",
  "/api/onboarding/progress",
  "/api/onboarding/progress/skip",
  "/api/ops/activation-funnel",
  "/api/ops/customers",
  "/api/ops/edge-functions",
  "/api/ops/overview",
  "/api/ops/performance",
  "/api/ops/retry-queues",
  "/api/ops/system-health",
  "/api/oss/stats",
  "/api/pricing/experiments",
  "/api/projects",
  "/api/projects/snapshots",
  "/api/projects/snapshots/[snapshotId]/export",
  "/api/projects/snapshots/[snapshotId]/rollback",
  "/api/public/reality",
  "/api/public/ui-config",
  "/api/quota",
  "/api/rbac/roles",
  "/api/rbac/users",
  "/api/receipts/ocr",
  "/api/referrals",
  "/api/runs/[runId]",
  "/api/runs/create",
  "/api/seo/generate-sitemap",
  "/api/share/[id]",
  "/api/status",
  "/api/status/health",
  "/api/stripe/checkout",
  "/api/stripe/portal",
  "/api/stripe/webhook",
  "/api/support/canned-responses",
  "/api/support/report-issue",
  "/api/support/tickets",
  "/api/user/checklist",
  "/api/user/pre-test",
  "/api/user/upgrade",
  "/api/user/value-moments",
  "/api/v1",
  "/api/v1/convert",
  "/api/v1/feature-flags",
  "/api/v1/feature-flags/[id]",
  "/api/v1/feature-flags/evaluate",
  "/api/v1/receipts",
  "/api/v1/receipts/[id]",
  "/api/v1/recon/jobs",
  "/api/vercel-example",
  "/api/workspaces",
  "/api/workspaces/[workspaceId]/invites",
  "/api/workspaces/[workspaceId]/onboarding",
  "/app",
  "/architecture",
  "/benchmarks",
  "/billing",
  "/billing/success",
  "/blog",
  "/builder/[...page]",
  "/changelog",
  "/changelog/[slug]",
  "/community",
  "/community/contributors",
  "/comparison",
  "/console",
  "/console/activity",
  "/console/admin/activation",
  "/console/admin/jobs",
  "/console/admin/tenants",
  "/console/ai-analysis",
  "/console/alerts-view",
  "/console/analytics",
  "/console/api-keys",
  "/console/api-logs",
  "/console/api-playground",
  "/console/api-playground/collections",
  "/console/api-test",
  "/console/approvals",
  "/console/audit-trail",
  "/console/billing",
  "/console/briefings",
  "/console/bulk-operations",
  "/console/changes",
  "/console/control-plane",
  "/console/costs",
  "/console/diagnostics",
  "/console/docs",
  "/console/feature-flags",
  "/console/feature-flags-policy",
  "/console/ingestion/[ingestionId]",
  "/console/insights",
  "/console/inspector",
  "/console/multi-source-reconciliation",
  "/console/onboarding",
  "/console/ops",
  "/console/performance",
  "/console/playground",
  "/console/playground/cli",
  "/console/playground/convert",
  "/console/playground/flags",
  "/console/playground/receipts",
  "/console/playground/reconcile",
  "/console/reality",
  "/console/receipt-matching",
  "/console/receipts",
  "/console/receipts-hash",
  "/console/reconciliation-view",
  "/console/reconciliation/[runId]",
  "/console/rules-engine",
  "/console/runs",
  "/console/runs/[runId]",
  "/console/setup-check",
  "/console/site",
  "/console/site/branding",
  "/console/site/experiments",
  "/console/site/experiments/[id]",
  "/console/site/navigation",
  "/console/site/pages/[id]",
  "/console/site/ui-config",
  "/console/sla",
  "/console/support",
  "/console/tables",
  "/console/tables/[table]",
  "/console/usage",
  "/console/webhooks",
  "/console/workflows",
  "/console/workflows/[id]",
  "/console/workflows/new",
  "/contact",
  "/cookbook",
  "/cookbooks",
  "/dashboard",
  "/dashboard/addons",
  "/dashboard/billing",
  "/dashboard/billing/invoices",
  "/dashboard/billing/payment-methods",
  "/dashboard/integrations",
  "/dashboard/integrations/[integrationId]",
  "/dashboard/integrations/[integrationId]/logs",
  "/dashboard/jobs",
  "/dashboard/jobs/[jobId]",
  "/dashboard/jobs/[jobId]/exceptions",
  "/dashboard/usage",
  "/dashboard/user",
  "/demo",
  "/demo/api",
  "/demo/receipts",
  "/demo/reconciliation",
  "/docs",
  "/docs/api",
  "/docs/auth",
  "/docs/cli",
  "/docs/errors",
  "/docs/examples",
  "/docs/getting-started",
  "/docs/integrations",
  "/docs/integrations/[integrationId]",
  "/docs/quickstart",
  "/docs/sdk",
  "/docs/sdk/go",
  "/docs/sdk/nodejs",
  "/docs/sdk/python",
  "/docs/sdk/ruby",
  "/docs/status",
  "/docs/webhooks",
  "/edge-ai",
  "/edge-ai/nodes",
  "/edge-ai/nodes/[nodeId]",
  "/edge-ai/nodes/new",
  "/engine",
  "/engine/create-run-pack",
  "/engine/import-results",
  "/engine/view-variances",
  "/enterprise",
  "/enterprise/dashboard",
  "/feature-flags",
  "/founder",
  "/home",
  "/how-it-works",
  "/integrations",
  "/integrations/request",
  "/investor/proof",
  "/investor/reality",
  "/invite/[token]",
  "/legal",
  "/legal/aup",
  "/legal/cookies",
  "/legal/dpa",
  "/legal/license",
  "/legal/privacy",
  "/legal/subprocessors",
  "/legal/terms",
  "/login",
  "/mobile",
  "/offline",
  "/open-source",
  "/oss",
  "/oss/stats",
  "/platform",
  "/playground",
  "/pricing",
  "/privacy",
  "/product",
  "/proof",
  "/react-settler-demo",
  "/realtime-dashboard",
  "/receipts",
  "/review/polish",
  "/roadmap",
  "/roi-calculator",
  "/runbooks",
  "/schematics",
  "/security",
  "/security-and-audit",
  "/signup",
  "/status",
  "/support",
  "/support/articles/[articleId]",
  "/support/category/[categoryId]",
  "/support/contact",
  "/terms",
  "/trust",
  "/use-cases/[slug]",
  "/ux-playground",
  "/ux-playground/events",
  "/verify",
  "/vision",
  "/why-settler"
];

/**
 * Check if a path matches a route (handles dynamic segments)
 */
export function isRoute(path: string): boolean {
  // Exact match
  if (PAGE_ROUTES.includes(path)) {
    return true;
  }
  
  // Check dynamic routes
  for (const route of ROUTES) {
    if (route.type !== 'page') continue;
    
    if (route.dynamic || route.catchAll) {
      // Simple pattern matching for dynamic routes
      const routePattern = route.path
        .replace(/\[.*?\]/g, '[^/]+') // Replace [param] with pattern
        .replace(/\[\.\.\..*?\]/g, '.*'); // Replace [...param] with catch-all
      
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(path)) {
        return true;
      }
    }
  }
  
  return false;
}
