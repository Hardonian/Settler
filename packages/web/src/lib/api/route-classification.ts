/**
 * API Route Classification Registry
 *
 * This file is the authoritative classification of every API route in the Settler
 * application. Classifications drive:
 *  - Auth enforcement decisions
 *  - Tenant-scope validation requirements
 *  - Rate limit tiers
 *  - Security audit scope
 *
 * Classification types:
 *   public-read        Unauthenticated GET — no session or API key required
 *   public-write       Unauthenticated mutation — webhook ingress, form submissions
 *   authenticated-user Session auth required; no tenant-scope constraint
 *   tenant-scoped      API key or session auth + tenantId isolation enforced in queries
 *   admin-internal     Requires super-admin or internal admin role
 *   webhook-provider   Raw body expected; HMAC/provider signature must be verified
 *   api-key-service    Bearer API key auth (no session); tenant inferred from key
 *   health-system      Public liveness/readiness probe; returns no sensitive data
 *   cron-internal      Protected by CRON_SECRET; not for external callers
 *   legacy-dead        Route exists but is disabled or pending removal
 *
 * Each entry maps a route pattern → { class, methods, notes? }
 */

export type RouteClass =
  | "public-read"
  | "public-write"
  | "authenticated-user"
  | "tenant-scoped"
  | "admin-internal"
  | "webhook-provider"
  | "api-key-service"
  | "health-system"
  | "cron-internal"
  | "legacy-dead";

export interface RouteClassification {
  class: RouteClass;
  methods: ("GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "*")[];
  /** Auth mechanism enforced in handler */
  auth: string;
  /** Whether tenantId is scoped in DB queries */
  tenantScoped: boolean;
  notes?: string;
}

/**
 * Route classification map.
 * Keys are path patterns as they appear under /api/.
 * Dynamic segments are written as [param].
 */
export const ROUTE_CLASSIFICATIONS: Record<string, RouteClassification> = {
  // ── Health & System ───────────────────────────────────────────────────────

  health: {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
    notes: "Public liveness probe. Returns no sensitive data.",
  },
  "health/console": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "health/stripe": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "internal/health/deep": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "Deep health check including DB table existence checks. Requires auth.",
  },
  status: {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "status/health": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },

  // ── V1 Public API (API-key / tenant-scoped) ───────────────────────────────

  v1: {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
    notes: "API root. Returns API metadata. API-key required.",
  },
  "v1/health": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "v1/ready": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "v1/meta": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "v1/convert": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/datasets": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/feature-flags": {
    class: "api-key-service",
    methods: ["GET", "POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/feature-flags/[id]": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/feature-flags/evaluate": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/receipts": {
    class: "api-key-service",
    methods: ["GET", "POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/receipts/[id]": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/metrics/summary": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/metrics/timeseries": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/metrics/top": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/recon/jobs": {
    class: "api-key-service",
    methods: ["GET", "POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs": {
    class: "api-key-service",
    methods: ["GET", "POST"],
    auth: "apiKey",
    tenantScoped: true,
    notes: "Tenant isolation enforced via ctx.tenantId in all DB queries.",
  },
  "v1/runs/[id]": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/evidence": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/results": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/replay": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/trust-explorer/getExecutionGraph": {
    class: "api-key-service",
    methods: ["GET"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/trust-explorer/findPolicyImpact": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/trust-explorer/traceArtifactLineage": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },
  "v1/runs/[id]/trust-explorer/verifyProofChain": {
    class: "api-key-service",
    methods: ["POST"],
    auth: "apiKey",
    tenantScoped: true,
  },

  // ── Console API (session auth, operator-scoped) ───────────────────────────

  "console/activities": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/ai-analysis": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/ai-tokens/usage": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/alerts": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/alerts/[id]/acknowledge": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/analytics/datasets": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/analytics/pivot": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/analytics/rollup": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/analytics/saved-views": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/api-keys": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session+apiKey",
    tenantScoped: true,
    notes: "API keys are scoped to the authenticated user's tenant.",
  },
  "console/api-keys/[id]": {
    class: "tenant-scoped",
    methods: ["GET", "DELETE"],
    auth: "session+apiKey",
    tenantScoped: true,
  },
  "console/api-logs": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/billing": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/billing/ai-tokens": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/costs": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/feature-flags": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/feature-flags/[id]/environments/[env]": {
    class: "tenant-scoped",
    methods: ["GET", "PUT", "DELETE"],
    auth: "session",
    tenantScoped: true,
  },
  "console/health": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "console/insights": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/meaningful-changes": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/metrics": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/operator/control-plane": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+adminRole",
    tenantScoped: false,
    notes: "Operator control plane. Requires elevated console role.",
  },
  "console/operator/runs": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "console/performance": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/reality": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/receipts": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/receipts/[id]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/receipts-v2": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/reconciliation": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/site/branding": {
    class: "admin-internal",
    methods: ["GET", "POST", "PUT", "DELETE"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "Site-wide branding config. Requires super admin.",
  },
  "console/site/experiments": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/experiments/[id]": {
    class: "admin-internal",
    methods: ["GET", "PUT", "DELETE"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/experiments/[id]/start": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/experiments/[id]/results": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/navigation": {
    class: "admin-internal",
    methods: ["GET", "PUT"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/pages": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/pages/[id]": {
    class: "admin-internal",
    methods: ["GET", "PUT", "DELETE"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/pages/[id]/publish": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/site/ui-config": {
    class: "admin-internal",
    methods: ["GET", "PUT"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/subscription-status": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/subscription": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/support/tickets": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/support/triage": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "console/tables/[table]": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "Raw table viewer. Super admin only.",
  },
  "console/tenants": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "console/user-role": {
    class: "authenticated-user",
    methods: ["GET"],
    auth: "session",
    tenantScoped: false,
  },
  "console/usage": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/alerts": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/analytics": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/export": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/export/[exportId]": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/export/[exportId]/download": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/usage/warnings": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "console/webhooks": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "console/webhooks/[id]": {
    class: "tenant-scoped",
    methods: ["GET", "PUT", "DELETE"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Admin API (super admin) ───────────────────────────────────────────────

  "admin/audit": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/exceptions": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/exceptions/[id]/escalate": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/exceptions/[id]/resolve": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/health": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/jobforge": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/metrics": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/runs": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },
  "admin/stream": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },

  // ── Ops API (internal admin tooling) ─────────────────────────────────────

  "ops/activation-funnel": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/customers": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
    notes: "Returns all billing accounts. Requires admin role.",
  },
  "ops/dashboard": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session",
    tenantScoped: false,
    notes: "Aggregated ops metrics. Requires authenticated session.",
  },
  "ops/edge-functions": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/integration-status": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/overview": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/performance": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/retry-queues": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "ops/system-health": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },

  // ── Cron (internal scheduled jobs) ───────────────────────────────────────

  "cron/check-reliability-alerts": {
    class: "cron-internal",
    methods: ["POST"],
    auth: "cronSecret",
    tenantScoped: false,
  },
  "cron/daily-cost-rollup": {
    class: "cron-internal",
    methods: ["POST", "GET"],
    auth: "cronSecret",
    tenantScoped: false,
    notes: "GET delegates to POST. Both require CRON_SECRET.",
  },
  "cron/email-lifecycle": {
    class: "cron-internal",
    methods: ["POST"],
    auth: "cronSecret",
    tenantScoped: false,
  },
  "cron/low-activity": {
    class: "cron-internal",
    methods: ["POST"],
    auth: "cronSecret",
    tenantScoped: false,
  },
  "cron/monthly-summary": {
    class: "cron-internal",
    methods: ["POST"],
    auth: "cronSecret",
    tenantScoped: false,
  },

  // ── Stripe (webhook + billing mutations) ─────────────────────────────────

  "stripe/checkout": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
    notes: "Creates Stripe checkout session. Requires authenticated user.",
  },
  "stripe/portal": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "stripe/webhook": {
    class: "webhook-provider",
    methods: ["POST"],
    auth: "stripeSignature",
    tenantScoped: false,
    notes: "Raw body. Stripe-Signature header must be verified. Bypasses middleware.",
  },

  // ── Billing ───────────────────────────────────────────────────────────────

  "billing/dispute": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "billing/payment-recovery": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "billing/retry-payment": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Connectors ────────────────────────────────────────────────────────────

  "connectors/backfill/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/callback/[providerId]": {
    class: "webhook-provider",
    methods: ["GET", "POST"],
    auth: "oauthState",
    tenantScoped: true,
    notes: "OAuth callback. State param carries tenant context.",
  },
  "connectors/connect/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/disconnect/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/refresh/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/sync/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/test/[providerId]": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "connectors/webhook/[providerId]": {
    class: "webhook-provider",
    methods: ["POST"],
    auth: "providerSignature",
    tenantScoped: true,
    notes: "Provider webhook. Must verify provider-specific signature.",
  },

  // ── Control Plane ─────────────────────────────────────────────────────────

  "control-plane/failures": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },
  "control-plane/keys": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },
  "control-plane/metrics": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },
  "control-plane/policies": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },
  "control-plane/policies/[policyId]": {
    class: "admin-internal",
    methods: ["GET", "PUT", "DELETE"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },
  "control-plane/triggers": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
  },

  // ── AI ────────────────────────────────────────────────────────────────────

  "ai/data-insights": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "ai/onboarding-assistant": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "ai/support-assistant": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "ai/troubleshooting": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Data & Exports ────────────────────────────────────────────────────────

  "data/export": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "data/import": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  exports: {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "imports/validate": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Enterprise ────────────────────────────────────────────────────────────

  "enterprise/contact": {
    class: "public-write",
    methods: ["POST"],
    auth: "none",
    tenantScoped: false,
    notes: "Contact form. Rate-limited. No auth required.",
  },
  "enterprise/ip-allowlist": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+adminRole",
    tenantScoped: true,
  },
  "enterprise/ip-allowlist/[id]": {
    class: "admin-internal",
    methods: ["DELETE", "PUT"],
    auth: "session+adminRole",
    tenantScoped: true,
  },

  // ── Explorer ──────────────────────────────────────────────────────────────

  "explorer/execution/[id]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "explorer/history": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Feedback Loops ────────────────────────────────────────────────────────

  "feedback-loops/insights": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Foundry ───────────────────────────────────────────────────────────────

  "foundry/datasets": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "foundry/datasets/[id]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "foundry/runs": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "foundry/runs/[id]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },

  // ── GTM ───────────────────────────────────────────────────────────────────

  "gtm/demo/reset": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
    notes: "Demo tenant reset. Checks isDemoTenant() before mutation.",
  },
  "gtm/funnel-stage": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "gtm/roi": {
    class: "authenticated-user",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
    notes: "billingAccountId required in query params. Session auth + ownership inferred.",
  },

  // ── Image ─────────────────────────────────────────────────────────────────

  "image-optimize": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Integrations ──────────────────────────────────────────────────────────

  "integrations/[integrationId]/debug": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+adminRole",
    tenantScoped: true,
  },
  "integrations/[integrationId]/test": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "integrations/[integrationId]/upgrade": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "integrations/[integrationId]/versions": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "integrations/analytics": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "integrations/health": {
    class: "health-system",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },

  // ── Internal ──────────────────────────────────────────────────────────────

  "internal/jobs/drain": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "Job queue drain. Destructive operation — super admin only.",
  },

  // ── Invite ────────────────────────────────────────────────────────────────

  "invite/[token]": {
    class: "public-read",
    methods: ["GET", "POST"],
    auth: "token",
    tenantScoped: false,
    notes: "GET: public — token is the credential. POST: accept invite, requires auth.",
  },

  // ── Jobs ──────────────────────────────────────────────────────────────────

  jobs: {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/bulk": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/[id]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/[id]/progress": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/[id]/result": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/[id]/exceptions": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "jobs/[id]/exceptions/[exceptionId]": {
    class: "tenant-scoped",
    methods: ["GET", "PUT"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Metrics ───────────────────────────────────────────────────────────────

  metrics: {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session+apiKey",
    tenantScoped: true,
  },
  "metrics/prometheus": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "apiKey+adminRole",
    tenantScoped: false,
    notes: "Prometheus scrape endpoint. Must be restricted to scraper IP or API key.",
  },

  // ── Milestones ────────────────────────────────────────────────────────────

  milestones: {
    class: "authenticated-user",
    methods: ["GET"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Onboarding ────────────────────────────────────────────────────────────

  "onboarding/progress": {
    class: "authenticated-user",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: false,
  },
  "onboarding/progress/skip": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Operator ──────────────────────────────────────────────────────────────

  "operator/incidents": {
    class: "admin-internal",
    methods: ["GET", "POST"],
    auth: "session+adminRole",
    tenantScoped: false,
  },

  // ── OSS ───────────────────────────────────────────────────────────────────

  "oss/stats": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
    notes: "Public OSS download and playground statistics.",
  },

  // ── Pricing ───────────────────────────────────────────────────────────────

  "pricing/experiments": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
  },

  // ── Projects ──────────────────────────────────────────────────────────────

  projects: {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "projects/snapshots": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "projects/snapshots/[snapshotId]/export": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },
  "projects/snapshots/[snapshotId]/rollback": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
    notes: "Destructive rollback. Tenant ownership must be verified before execution.",
  },

  // ── Public ────────────────────────────────────────────────────────────────

  "public/reality": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },
  "public/ui-config": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
    notes: "Returns public tenant UI config only. No sensitive data exposed.",
  },

  // ── Quota ─────────────────────────────────────────────────────────────────

  quota: {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },

  // ── RBAC ──────────────────────────────────────────────────────────────────

  "rbac/roles": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "rbac/users": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },

  // ── Receipts ──────────────────────────────────────────────────────────────

  "receipts/ocr": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Referrals ─────────────────────────────────────────────────────────────

  referrals: {
    class: "authenticated-user",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Runs ──────────────────────────────────────────────────────────────────

  runs: {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },
  "runs/create": {
    class: "tenant-scoped",
    methods: ["POST"],
    auth: "session",
    tenantScoped: true,
    notes: "Idempotency-Key header required.",
  },
  "runs/[runId]": {
    class: "tenant-scoped",
    methods: ["GET"],
    auth: "session",
    tenantScoped: true,
  },

  // ── SEO ───────────────────────────────────────────────────────────────────

  "seo/generate-sitemap": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },

  // ── Share ─────────────────────────────────────────────────────────────────

  "share/[id]": {
    class: "public-read",
    methods: ["GET", "POST"],
    auth: "shareToken",
    tenantScoped: false,
    notes: "GET: public share link — token is the credential. POST: requires session.",
  },

  // ── Support ───────────────────────────────────────────────────────────────

  "support/canned-responses": {
    class: "admin-internal",
    methods: ["GET"],
    auth: "session+adminRole",
    tenantScoped: false,
  },
  "support/report-issue": {
    class: "public-write",
    methods: ["POST"],
    auth: "none",
    tenantScoped: false,
    notes: "Bug reports. Rate-limited. No auth required to encourage reporting.",
  },
  "support/tickets": {
    class: "authenticated-user",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: false,
  },

  // ── User ──────────────────────────────────────────────────────────────────

  "user/checklist": {
    class: "authenticated-user",
    methods: ["GET"],
    auth: "session",
    tenantScoped: false,
  },
  "user/pre-test": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "user/upgrade": {
    class: "authenticated-user",
    methods: ["POST"],
    auth: "session",
    tenantScoped: false,
  },
  "user/value-moments": {
    class: "authenticated-user",
    methods: ["GET"],
    auth: "session",
    tenantScoped: false,
  },

  // ── Workspaces ────────────────────────────────────────────────────────────

  workspaces: {
    class: "authenticated-user",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: false,
  },
  "workspaces/[workspaceId]/invites": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
    notes: "workspaceId ownership must be verified before listing or sending invites.",
  },
  "workspaces/[workspaceId]/onboarding": {
    class: "tenant-scoped",
    methods: ["GET", "POST"],
    auth: "session",
    tenantScoped: true,
  },

  // ── Docs ──────────────────────────────────────────────────────────────────

  "docs/openapi": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },

  // ── Builder ───────────────────────────────────────────────────────────────

  "builder/revalidate": {
    class: "admin-internal",
    methods: ["POST"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "ISR cache revalidation. Must be super admin.",
  },

  // ── OpenAPI JSON ─────────────────────────────────────────────────────────

  "openapi.json": {
    class: "public-read",
    methods: ["GET"],
    auth: "none",
    tenantScoped: false,
  },

  // ── Legacy / Example ──────────────────────────────────────────────────────

  "vercel-example": {
    class: "legacy-dead",
    methods: ["GET"],
    auth: "session+superAdmin",
    tenantScoped: false,
    notes: "Internal SDK demo. Disabled in production. Super admin only.",
  },
} as const;

/**
 * Get the classification for a route path.
 * Path should be relative to /api/ (e.g. "v1/runs").
 */
export function getRouteClassification(path: string): RouteClassification | undefined {
  return ROUTE_CLASSIFICATIONS[path];
}

/**
 * Returns all routes with a given classification.
 */
export function getRoutesByClass(routeClass: RouteClass): Array<[string, RouteClassification]> {
  return Object.entries(ROUTE_CLASSIFICATIONS).filter(([, v]) => v.class === routeClass);
}
