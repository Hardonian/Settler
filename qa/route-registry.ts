/**
 * Route Registry - Auto-generated
 * Generated at: 2025-12-19T03:44:19.189Z
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
    "path": "/admin",
    "type": "page",
    "file": "admin/page.tsx",
    "dynamic": false,
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
    "path": "/admin/experiments/id",
    "type": "page",
    "file": "admin/experiments/[id]/page.tsx",
    "dynamic": false,
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
    "path": "/admin/metrics",
    "type": "page",
    "file": "admin/metrics/page.tsx",
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
    "path": "/admin/pages/id/editor",
    "type": "page",
    "file": "admin/pages/[id]/editor/page.tsx",
    "dynamic": false,
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
    "path": "/admin/webhooks",
    "type": "page",
    "file": "admin/webhooks/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/audit-logs",
    "type": "route",
    "file": "api/admin/audit-logs/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/billing/reconcile",
    "type": "route",
    "file": "api/admin/billing/reconcile/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/cleanup",
    "type": "route",
    "file": "api/admin/cleanup/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/impersonate",
    "type": "route",
    "file": "api/admin/impersonate/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/admin/impersonate/stop",
    "type": "route",
    "file": "api/admin/impersonate/stop/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/ai/chatbot",
    "type": "route",
    "file": "api/ai/chatbot/route.ts",
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
    "path": "/api/analytics",
    "type": "route",
    "file": "api/analytics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/ab-test",
    "type": "route",
    "file": "api/analytics/ab-test/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/chatbot",
    "type": "route",
    "file": "api/analytics/chatbot/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/churn",
    "type": "route",
    "file": "api/analytics/churn/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/churn-risk",
    "type": "route",
    "file": "api/analytics/churn-risk/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/conversion",
    "type": "route",
    "file": "api/analytics/conversion/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/events",
    "type": "route",
    "file": "api/analytics/events/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/funnel",
    "type": "route",
    "file": "api/analytics/funnel/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/retention-cohorts",
    "type": "route",
    "file": "api/analytics/retention-cohorts/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/analytics/sdk",
    "type": "route",
    "file": "api/analytics/sdk/route.ts",
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
    "path": "/api/console/alerts/id/acknowledge",
    "type": "route",
    "file": "api/console/alerts/[id]/acknowledge/route.ts",
    "dynamic": false,
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
    "path": "/api/console/api-keys/id",
    "type": "route",
    "file": "api/console/api-keys/[id]/route.ts",
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
    "path": "/api/console/feature-flags/id/environments/env",
    "type": "route",
    "file": "api/console/feature-flags/[id]/environments/[env]/route.ts",
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
    "path": "/api/console/ops-briefings",
    "type": "route",
    "file": "api/console/ops-briefings/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ops-briefings/id",
    "type": "route",
    "file": "api/console/ops-briefings/[id]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ops-insights",
    "type": "route",
    "file": "api/console/ops-insights/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ops-insights/id",
    "type": "route",
    "file": "api/console/ops-insights/[id]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/ops-recommendations/id/execute",
    "type": "route",
    "file": "api/console/ops-recommendations/[id]/execute/route.ts",
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
    "path": "/api/console/receipts/id",
    "type": "route",
    "file": "api/console/receipts/[id]/route.ts",
    "dynamic": false,
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
    "path": "/api/console/site/experiments/id",
    "type": "route",
    "file": "api/console/site/experiments/[id]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments/id/results",
    "type": "route",
    "file": "api/console/site/experiments/[id]/results/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/experiments/id/start",
    "type": "route",
    "file": "api/console/site/experiments/[id]/start/route.ts",
    "dynamic": false,
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
    "path": "/api/console/site/pages/id",
    "type": "route",
    "file": "api/console/site/pages/[id]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/pages/id/publish",
    "type": "route",
    "file": "api/console/site/pages/[id]/publish/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/site/setup",
    "type": "route",
    "file": "api/console/site/setup/route.ts",
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
    "path": "/api/console/webhooks",
    "type": "route",
    "file": "api/console/webhooks/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/console/webhooks/id",
    "type": "route",
    "file": "api/console/webhooks/[id]/route.ts",
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
    "path": "/api/enterprise/ip-allowlist/id",
    "type": "route",
    "file": "api/enterprise/ip-allowlist/[id]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/experiments/event",
    "type": "route",
    "file": "api/experiments/event/route.ts",
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
    "path": "/api/integrations/integrationId/debug",
    "type": "route",
    "file": "api/integrations/[integrationId]/debug/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/integrationId/test",
    "type": "route",
    "file": "api/integrations/[integrationId]/test/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/integrationId/upgrade",
    "type": "route",
    "file": "api/integrations/[integrationId]/upgrade/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/integrations/integrationId/versions",
    "type": "route",
    "file": "api/integrations/[integrationId]/versions/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/investor/metrics",
    "type": "route",
    "file": "api/investor/metrics/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/invite/token",
    "type": "route",
    "file": "api/invite/[token]/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/marketing/newsletter/subscribe",
    "type": "route",
    "file": "api/marketing/newsletter/subscribe/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/marketing/rss",
    "type": "route",
    "file": "api/marketing/rss/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/marketing/social-share",
    "type": "route",
    "file": "api/marketing/social-share/route.ts",
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
    "path": "/api/playground/simulate",
    "type": "route",
    "file": "api/playground/simulate/route.ts",
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
    "path": "/api/projects/snapshots/snapshotId/export",
    "type": "route",
    "file": "api/projects/snapshots/[snapshotId]/export/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/projects/snapshots/snapshotId/rollback",
    "type": "route",
    "file": "api/projects/snapshots/[snapshotId]/rollback/route.ts",
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
    "path": "/api/referrals",
    "type": "route",
    "file": "api/referrals/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/sales/deck",
    "type": "route",
    "file": "api/sales/deck/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/sales/roi-calculator",
    "type": "route",
    "file": "api/sales/roi-calculator/route.ts",
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
    "path": "/api/share/id",
    "type": "route",
    "file": "api/share/[id]/route.ts",
    "dynamic": false,
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
    "path": "/api/v1/feature-flags/evaluate",
    "type": "route",
    "file": "api/v1/feature-flags/evaluate/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/v1/feature-flags/id",
    "type": "route",
    "file": "api/v1/feature-flags/[id]/route.ts",
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
    "path": "/api/v1/receipts/id",
    "type": "route",
    "file": "api/v1/receipts/[id]/route.ts",
    "dynamic": false,
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
    "path": "/api/workspaces/workspaceId/invites",
    "type": "route",
    "file": "api/workspaces/[workspaceId]/invites/route.ts",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/api/workspaces/workspaceId/onboarding",
    "type": "route",
    "file": "api/workspaces/[workspaceId]/onboarding/route.ts",
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
    "path": "/billing/success",
    "type": "page",
    "file": "billing/success/page.tsx",
    "dynamic": false,
    "catchAll": false,
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
    "path": "/changelog/slug",
    "type": "page",
    "file": "changelog/[slug]/page.tsx",
    "dynamic": false,
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
    "path": "/console/changes",
    "type": "page",
    "file": "console/changes/page.tsx",
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
    "path": "/console/ingestion/ingestionId",
    "type": "page",
    "file": "console/ingestion/[ingestionId]/page.tsx",
    "dynamic": false,
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
    "path": "/console/reconciliation/runId",
    "type": "page",
    "file": "console/reconciliation/[runId]/page.tsx",
    "dynamic": false,
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
    "path": "/console/site/experiments/id",
    "type": "page",
    "file": "console/site/experiments/[id]/page.tsx",
    "dynamic": false,
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
    "path": "/console/site/pages/id",
    "type": "page",
    "file": "console/site/pages/[id]/page.tsx",
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
    "path": "/dashboard/integrations/integrationId",
    "type": "page",
    "file": "dashboard/integrations/[integrationId]/page.tsx",
    "dynamic": false,
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
    "path": "/dashboard/jobs/jobId",
    "type": "page",
    "file": "dashboard/jobs/[jobId]/page.tsx",
    "dynamic": false,
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
    "path": "/docs/cli",
    "type": "page",
    "file": "docs/cli/page.tsx",
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
    "path": "/docs/integrations/integrationId",
    "type": "page",
    "file": "docs/integrations/[integrationId]/page.tsx",
    "dynamic": false,
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
    "path": "/edge-ai/nodes/new",
    "type": "page",
    "file": "edge-ai/nodes/new/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/edge-ai/nodes/nodeId",
    "type": "page",
    "file": "edge-ai/nodes/[nodeId]/page.tsx",
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
    "path": "/how-it-works",
    "type": "page",
    "file": "how-it-works/page.tsx",
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
    "path": "/invite/token",
    "type": "page",
    "file": "invite/[token]/page.tsx",
    "dynamic": false,
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
    "path": "/roadmap",
    "type": "page",
    "file": "roadmap/page.tsx",
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
    "path": "/signup",
    "type": "page",
    "file": "signup/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/slug",
    "type": "page",
    "file": "[slug]/page.tsx",
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
    "path": "/support/category/categoryId",
    "type": "page",
    "file": "support/category/[categoryId]/page.tsx",
    "dynamic": false,
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
    "path": "/trust",
    "type": "page",
    "file": "trust/page.tsx",
    "dynamic": false,
    "catchAll": false,
    "optional": false
  },
  {
    "path": "/use-cases/slug",
    "type": "page",
    "file": "use-cases/[slug]/page.tsx",
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
  "/admin",
  "/admin/experiments",
  "/admin/experiments/id",
  "/admin/experiments/new",
  "/admin/metrics",
  "/admin/pages",
  "/admin/pages/id/editor",
  "/admin/pages/new",
  "/admin/webhooks",
  "/architecture",
  "/benchmarks",
  "/billing/success",
  "/changelog",
  "/changelog/slug",
  "/community",
  "/community/contributors",
  "/comparison",
  "/console",
  "/console/ai-analysis",
  "/console/alerts-view",
  "/console/analytics",
  "/console/api-keys",
  "/console/billing",
  "/console/briefings",
  "/console/changes",
  "/console/costs",
  "/console/docs",
  "/console/feature-flags",
  "/console/feature-flags-policy",
  "/console/ingestion/ingestionId",
  "/console/insights",
  "/console/onboarding",
  "/console/ops",
  "/console/performance",
  "/console/playground",
  "/console/playground/cli",
  "/console/playground/convert",
  "/console/playground/flags",
  "/console/playground/receipts",
  "/console/playground/reconcile",
  "/console/receipts",
  "/console/receipts-hash",
  "/console/reconciliation-view",
  "/console/reconciliation/runId",
  "/console/setup-check",
  "/console/site",
  "/console/site/branding",
  "/console/site/experiments",
  "/console/site/experiments/id",
  "/console/site/navigation",
  "/console/site/pages/id",
  "/console/support",
  "/console/usage",
  "/console/webhooks",
  "/cookbook",
  "/cookbooks",
  "/dashboard",
  "/dashboard/addons",
  "/dashboard/billing",
  "/dashboard/billing/invoices",
  "/dashboard/billing/payment-methods",
  "/dashboard/integrations",
  "/dashboard/integrations/integrationId",
  "/dashboard/jobs",
  "/dashboard/jobs/jobId",
  "/dashboard/usage",
  "/dashboard/user",
  "/docs",
  "/docs/api",
  "/docs/cli",
  "/docs/examples",
  "/docs/integrations/integrationId",
  "/docs/quickstart",
  "/docs/sdk",
  "/docs/sdk/go",
  "/docs/sdk/nodejs",
  "/docs/sdk/python",
  "/docs/sdk/ruby",
  "/edge-ai",
  "/edge-ai/nodes",
  "/edge-ai/nodes/new",
  "/edge-ai/nodes/nodeId",
  "/enterprise",
  "/enterprise/dashboard",
  "/feature-flags",
  "/founder",
  "/how-it-works",
  "/integrations/request",
  "/invite/token",
  "/legal",
  "/legal/aup",
  "/legal/cookies",
  "/legal/dpa",
  "/legal/license",
  "/legal/privacy",
  "/legal/subprocessors",
  "/legal/terms",
  "/mobile",
  "/offline",
  "/oss",
  "/oss/stats",
  "/playground",
  "/pricing",
  "/proof",
  "/react-settler-demo",
  "/realtime-dashboard",
  "/receipts",
  "/roadmap",
  "/runbooks",
  "/schematics",
  "/security",
  "/signup",
  "/slug",
  "/status",
  "/support",
  "/support/category/categoryId",
  "/support/contact",
  "/trust",
  "/use-cases/slug",
  "/vision",
  "/why-settler"
];

export const ALL_ROUTES: string[] = [
  "/",
  "/admin",
  "/admin/experiments",
  "/admin/experiments/id",
  "/admin/experiments/new",
  "/admin/metrics",
  "/admin/pages",
  "/admin/pages/id/editor",
  "/admin/pages/new",
  "/admin/webhooks",
  "/api/admin/audit-logs",
  "/api/admin/billing/reconcile",
  "/api/admin/cleanup",
  "/api/admin/impersonate",
  "/api/admin/impersonate/stop",
  "/api/ai/chatbot",
  "/api/ai/data-insights",
  "/api/ai/onboarding-assistant",
  "/api/ai/support-assistant",
  "/api/ai/troubleshooting",
  "/api/analytics",
  "/api/analytics/ab-test",
  "/api/analytics/chatbot",
  "/api/analytics/churn",
  "/api/analytics/churn-risk",
  "/api/analytics/conversion",
  "/api/analytics/events",
  "/api/analytics/funnel",
  "/api/analytics/retention-cohorts",
  "/api/analytics/sdk",
  "/api/billing/dispute",
  "/api/billing/payment-recovery",
  "/api/billing/retry-payment",
  "/api/console/activities",
  "/api/console/ai-analysis",
  "/api/console/ai-tokens/usage",
  "/api/console/alerts",
  "/api/console/alerts/id/acknowledge",
  "/api/console/analytics/datasets",
  "/api/console/analytics/pivot",
  "/api/console/analytics/rollup",
  "/api/console/analytics/saved-views",
  "/api/console/api-keys",
  "/api/console/api-keys/id",
  "/api/console/billing",
  "/api/console/billing/ai-tokens",
  "/api/console/costs",
  "/api/console/feature-flags",
  "/api/console/feature-flags/id/environments/env",
  "/api/console/insights",
  "/api/console/meaningful-changes",
  "/api/console/metrics",
  "/api/console/ops-briefings",
  "/api/console/ops-briefings/id",
  "/api/console/ops-insights",
  "/api/console/ops-insights/id",
  "/api/console/ops-recommendations/id/execute",
  "/api/console/performance",
  "/api/console/receipts",
  "/api/console/receipts-v2",
  "/api/console/receipts/id",
  "/api/console/reconciliation",
  "/api/console/site/branding",
  "/api/console/site/experiments",
  "/api/console/site/experiments/id",
  "/api/console/site/experiments/id/results",
  "/api/console/site/experiments/id/start",
  "/api/console/site/navigation",
  "/api/console/site/pages",
  "/api/console/site/pages/id",
  "/api/console/site/pages/id/publish",
  "/api/console/site/setup",
  "/api/console/subscription",
  "/api/console/support/tickets",
  "/api/console/support/triage",
  "/api/console/usage",
  "/api/console/usage/alerts",
  "/api/console/usage/analytics",
  "/api/console/usage/export",
  "/api/console/usage/warnings",
  "/api/console/webhooks",
  "/api/console/webhooks/id",
  "/api/cron/daily-cost-rollup",
  "/api/cron/email-lifecycle",
  "/api/cron/low-activity",
  "/api/cron/monthly-summary",
  "/api/data/export",
  "/api/data/import",
  "/api/docs/openapi",
  "/api/enterprise/contact",
  "/api/enterprise/ip-allowlist",
  "/api/enterprise/ip-allowlist/id",
  "/api/experiments/event",
  "/api/feedback-loops/insights",
  "/api/health",
  "/api/health/console",
  "/api/health/stripe",
  "/api/image-optimize",
  "/api/integrations/analytics",
  "/api/integrations/health",
  "/api/integrations/integrationId/debug",
  "/api/integrations/integrationId/test",
  "/api/integrations/integrationId/upgrade",
  "/api/integrations/integrationId/versions",
  "/api/investor/metrics",
  "/api/invite/token",
  "/api/marketing/newsletter/subscribe",
  "/api/marketing/rss",
  "/api/marketing/social-share",
  "/api/metrics",
  "/api/milestones",
  "/api/onboarding/progress",
  "/api/onboarding/progress/skip",
  "/api/ops/customers",
  "/api/ops/edge-functions",
  "/api/ops/overview",
  "/api/ops/retry-queues",
  "/api/ops/system-health",
  "/api/oss/stats",
  "/api/playground/simulate",
  "/api/pricing/experiments",
  "/api/projects",
  "/api/projects/snapshots",
  "/api/projects/snapshots/snapshotId/export",
  "/api/projects/snapshots/snapshotId/rollback",
  "/api/quota",
  "/api/rbac/roles",
  "/api/rbac/users",
  "/api/referrals",
  "/api/sales/deck",
  "/api/sales/roi-calculator",
  "/api/seo/generate-sitemap",
  "/api/share/id",
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
  "/api/v1/feature-flags/evaluate",
  "/api/v1/feature-flags/id",
  "/api/v1/receipts",
  "/api/v1/receipts/id",
  "/api/v1/recon/jobs",
  "/api/vercel-example",
  "/api/workspaces",
  "/api/workspaces/workspaceId/invites",
  "/api/workspaces/workspaceId/onboarding",
  "/architecture",
  "/benchmarks",
  "/billing/success",
  "/changelog",
  "/changelog/slug",
  "/community",
  "/community/contributors",
  "/comparison",
  "/console",
  "/console/ai-analysis",
  "/console/alerts-view",
  "/console/analytics",
  "/console/api-keys",
  "/console/billing",
  "/console/briefings",
  "/console/changes",
  "/console/costs",
  "/console/docs",
  "/console/feature-flags",
  "/console/feature-flags-policy",
  "/console/ingestion/ingestionId",
  "/console/insights",
  "/console/onboarding",
  "/console/ops",
  "/console/performance",
  "/console/playground",
  "/console/playground/cli",
  "/console/playground/convert",
  "/console/playground/flags",
  "/console/playground/receipts",
  "/console/playground/reconcile",
  "/console/receipts",
  "/console/receipts-hash",
  "/console/reconciliation-view",
  "/console/reconciliation/runId",
  "/console/setup-check",
  "/console/site",
  "/console/site/branding",
  "/console/site/experiments",
  "/console/site/experiments/id",
  "/console/site/navigation",
  "/console/site/pages/id",
  "/console/support",
  "/console/usage",
  "/console/webhooks",
  "/cookbook",
  "/cookbooks",
  "/dashboard",
  "/dashboard/addons",
  "/dashboard/billing",
  "/dashboard/billing/invoices",
  "/dashboard/billing/payment-methods",
  "/dashboard/integrations",
  "/dashboard/integrations/integrationId",
  "/dashboard/jobs",
  "/dashboard/jobs/jobId",
  "/dashboard/usage",
  "/dashboard/user",
  "/docs",
  "/docs/api",
  "/docs/cli",
  "/docs/examples",
  "/docs/integrations/integrationId",
  "/docs/quickstart",
  "/docs/sdk",
  "/docs/sdk/go",
  "/docs/sdk/nodejs",
  "/docs/sdk/python",
  "/docs/sdk/ruby",
  "/edge-ai",
  "/edge-ai/nodes",
  "/edge-ai/nodes/new",
  "/edge-ai/nodes/nodeId",
  "/enterprise",
  "/enterprise/dashboard",
  "/feature-flags",
  "/founder",
  "/how-it-works",
  "/integrations/request",
  "/invite/token",
  "/legal",
  "/legal/aup",
  "/legal/cookies",
  "/legal/dpa",
  "/legal/license",
  "/legal/privacy",
  "/legal/subprocessors",
  "/legal/terms",
  "/mobile",
  "/offline",
  "/oss",
  "/oss/stats",
  "/playground",
  "/pricing",
  "/proof",
  "/react-settler-demo",
  "/realtime-dashboard",
  "/receipts",
  "/roadmap",
  "/runbooks",
  "/schematics",
  "/security",
  "/signup",
  "/slug",
  "/status",
  "/support",
  "/support/category/categoryId",
  "/support/contact",
  "/trust",
  "/use-cases/slug",
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
