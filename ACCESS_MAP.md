# Access Map

This inventory enumerates App Router pages and API routes, plus navigation links, and classifies access as PUBLIC, AUTH_REQUIRED, or HYBRID.

## Fusion vs Vercel Mismatch Table (Observed)

| Dimension | Builder.io Fusion (repo evidence) | Vercel default | Mismatch / Impact | Resolution |
| --- | --- | --- | --- | --- |
| Node version | `.nvmrc` pins `24` and `engines.node >=24` in root and web packages. | Vercel defaults to LTS unless specified. | Risk of running lower Node unless Vercel config forces 24.x. | Keep `nodeVersion: 24.x` in `vercel.json`. |
| Package manager | Repo scripts assume workspace installs; Builder/Fusion docs show `npm run dev` for local. | Vercel auto-detects lockfile; root `vercel.json` used `npm install`. | `pnpm install --frozen-lockfile` required for parity. | Added `pnpm-workspace.yaml` and Vercel install/build commands set to pnpm; pnpm lockfile still required. |
| Build command | `packages/web` uses `next build`; root uses `turbo run build`. | Vercel defaults to `next build` in project root. | Monorepo requires targeting `@settler/web`. | Vercel build command set to `pnpm --filter @settler/web build`. |
| Env vars | Builder.io uses `NEXT_PUBLIC_BUILDER_API_KEY`/`BUILDER_API_KEY`. Supabase env validated at runtime. | Vercel needs runtime envs; build should not hard-fail on missing public envs for public pages. | Missing envs could crash if enforced at build-time. | Existing env validator + middleware fail-closed for protected routes only. |
| Edge vs Node runtime | Many pages use Node runtime (`runtime = 'nodejs'`). Middleware runs on Edge. | Vercel defaults to Edge for middleware. | Ensure middleware is edge-safe and auth gating doesn’t break public routes. | Middleware updated to gate only auth-required paths and allow public routes safely. |
| Case sensitivity | Linux on Vercel is case-sensitive. | Local may be macOS case-insensitive. | Potential import casing errors. | No case issues detected in reviewed paths. |

## Navigation Inventory

### Header Navigation (`Navigation.tsx`)
- Primary (always visible):
  - /demo (Demo)
  - /playground (Playground)
  - /docs (Docs)
  - /pricing (Pricing)
  - /console (Console) **only when authenticated**
- Secondary (More dropdown / mobile):
  - /cookbooks (Cookbooks)
  - /runbooks (Runbooks)
  - /schematics (Schematics)
  - /receipts (Receipts API)
  - /feature-flags (Feature Flags)
  - /enterprise (Enterprise)
  - /community (Community)
  - /support (Support)
- CTA:
  - /console/playground (Get Started; redirects to /playground)

### Footer Navigation (`Footer.tsx`)
- Product:
  - /docs (Documentation)
  - /cookbooks (Cookbook)
  - /runbooks (Runbooks)
  - /schematics (Schematics)
  - /playground (Playground)
  - /pricing (Pricing)
  - /enterprise (Enterprise)
- Resources:
  - /support (Support)
  - /community (Community)
  - https://github.com/shardie-github/Settler-API (GitHub)
  - /docs (API Reference)
  - https://status.settler.dev (Status)
- Legal:
  - /legal/terms (Terms of Service)
  - /legal/privacy (Privacy Policy)
  - /legal/license (License)
  - /legal/cookies (Cookie Policy)
  - /legal/aup (Acceptable Use Policy)
  - /legal/dpa (Data Processing Agreement)
- Social:
  - https://twitter.com/settler_io
  - https://github.com/shardie-github/Settler-API
  - https://discord.gg/settler

## Page Route Inventory (App Router)

| Route | In nav? | Logged-out behavior | Data sensitivity | Access | Required change |
| --- | --- | --- | --- | --- | --- |
| / | Header logo | 200 | Public | PUBLIC | Middleware allowlist |
| /pricing | Header primary + Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /support | Header secondary + Footer resources | 200 | Public | PUBLIC | Middleware allowlist |
| /support/contact | Footer resources (contact CTA), support page | 200 | Public | PUBLIC | Middleware allowlist |
| /support/category/[categoryId] | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs | Header primary + Footer product/resources | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/getting-started | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/quickstart | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/api | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/auth | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/status | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/errors | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/webhooks | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/cli | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/examples | No (redirects to /docs) | 200 (redirect to /docs) | Public | PUBLIC | Middleware allowlist |
| /docs/integrations | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/integrations/[integrationId] | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/sdk | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/sdk/nodejs | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/sdk/python | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/sdk/ruby | No | 200 | Public | PUBLIC | Middleware allowlist |
| /docs/sdk/go | No | 200 | Public | PUBLIC | Middleware allowlist |
| /playground | Header primary + Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /demo | Header primary | 200 | Public | PUBLIC | Middleware allowlist |
| /demo/api | No | 200 | Public | PUBLIC | Middleware allowlist |
| /demo/receipts | No | 200 | Public | PUBLIC | Middleware allowlist |
| /demo/reconciliation | No | 200 | Public | PUBLIC | Middleware allowlist |
| /trust | No | 200 | Public | PUBLIC | Middleware allowlist |
| /security | No | 200 | Public | PUBLIC | Middleware allowlist |
| /status | Footer resources (external status site) | 200 | Public | PUBLIC | Middleware allowlist |
| /roadmap | No | 200 | Public | PUBLIC | Middleware allowlist |
| /changelog | No | 200 | Public | PUBLIC | Middleware allowlist |
| /changelog/[slug] | No | 200 | Public | PUBLIC | Middleware allowlist |
| /legal | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/terms | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/privacy | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/cookies | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/aup | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/dpa | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/license | Footer legal | 200 | Public | PUBLIC | Middleware allowlist |
| /legal/subprocessors | No | 200 | Public | PUBLIC | Middleware allowlist |
| /community | Header secondary + Footer resources | 200 | Public | PUBLIC | Middleware allowlist |
| /community/contributors | No | 200 | Public | PUBLIC | Middleware allowlist |
| /enterprise | Header secondary + Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /benchmarks | No | 200 | Public | PUBLIC | Middleware allowlist |
| /roi-calculator | No | 200 | Public | PUBLIC | Middleware allowlist |
| /vision | No | 200 | Public | PUBLIC | Middleware allowlist |
| /why-settler | No | 200 | Public | PUBLIC | Middleware allowlist |
| /how-it-works | No | 200 | Public | PUBLIC | Middleware allowlist |
| /architecture | No | 200 | Public | PUBLIC | Middleware allowlist |
| /founder | No | 200 | Public | PUBLIC | Middleware allowlist |
| /feature-flags | Header secondary | 200 | Public | PUBLIC | Middleware allowlist |
| /receipts | Header secondary | 200 | Public | PUBLIC | Middleware allowlist |
| /cookbook | Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /cookbooks | Header secondary + Footer product | 200 (redirect to /cookbook) | Public | PUBLIC | Middleware allowlist |
| /runbooks | Header secondary + Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /schematics | Header secondary + Footer product | 200 | Public | PUBLIC | Middleware allowlist |
| /react-settler-demo | No | 200 | Public | PUBLIC | Middleware allowlist |
| /oss | No | 200 | Public | PUBLIC | Middleware allowlist |
| /oss/stats | No | 200 | Public | PUBLIC | Middleware allowlist |
| /offline | No | 200 | Public | PUBLIC | Middleware allowlist |
| /mobile | No | 200 | Public | PUBLIC | Middleware allowlist |
| /integrations/request | No | 200 | Public | PUBLIC | Middleware allowlist |
| /use-cases/[slug] | No | 200 | Public | PUBLIC | Middleware allowlist |
| /builder/[...page] | No | 200 (Builder content) | Public | PUBLIC | Middleware allowlist |
| /invite/[token] | No | 200 | Public read-only invite info | HYBRID | Middleware allowlist (GET), API enforces POST auth |
| /signup | No | 200 | Public | PUBLIC | Middleware allowlist |
| /billing/success | No | 302 -> /signup?next=/billing/success | Private (billing) | AUTH_REQUIRED | Middleware auth gate |
| /edge-ai | No | 200 | Public | PUBLIC | Middleware allowlist |
| /edge-ai/nodes | No | 302 -> /signup?next=/edge-ai/nodes | Private (tenant infrastructure) | AUTH_REQUIRED | Middleware auth gate |
| /edge-ai/nodes/new | No | 302 -> /signup?next=/edge-ai/nodes/new | Private | AUTH_REQUIRED | Middleware auth gate |
| /edge-ai/nodes/[nodeId] | No | 302 -> /signup?next=/edge-ai/nodes/[nodeId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /realtime-dashboard | No | 302 -> /signup?next=/realtime-dashboard | Private (execution telemetry) | AUTH_REQUIRED | Middleware auth gate |
| /ux-playground | No | 302 -> /signup?next=/ux-playground | Private | AUTH_REQUIRED | Middleware auth gate |
| /ux-playground/events | No | 302 -> /signup?next=/ux-playground/events | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard | No | 302 -> /signup?next=/dashboard | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/user | No | 302 -> /signup?next=/dashboard/user | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/usage | No | 302 -> /signup?next=/dashboard/usage | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/addons | No | 302 -> /signup?next=/dashboard/addons | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/billing | No | 302 -> /signup?next=/dashboard/billing | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/billing/invoices | No | 302 -> /signup?next=/dashboard/billing/invoices | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/billing/payment-methods | No | 302 -> /signup?next=/dashboard/billing/payment-methods | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/integrations | No | 302 -> /signup?next=/dashboard/integrations | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/integrations/[integrationId] | No | 302 -> /signup?next=/dashboard/integrations/[integrationId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/integrations/[integrationId]/logs | No | 302 -> /signup?next=/dashboard/integrations/[integrationId]/logs | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/jobs | No | 302 -> /signup?next=/dashboard/jobs | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/jobs/[jobId] | No | 302 -> /signup?next=/dashboard/jobs/[jobId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /dashboard/jobs/[jobId]/exceptions | No | 302 -> /signup?next=/dashboard/jobs/[jobId]/exceptions | Private | AUTH_REQUIRED | Middleware auth gate |
| /console | Header primary (auth only) | 302 -> /signup?next=/console | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/onboarding | No | 302 -> /signup?next=/console/onboarding | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/billing | No | 302 -> /signup?next=/console/billing | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/usage | No | 302 -> /signup?next=/console/usage | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/usage/alerts | No | 302 -> /signup?next=/console/usage/alerts | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/usage/warnings | No | 302 -> /signup?next=/console/usage/warnings | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/costs | No | 302 -> /signup?next=/console/costs | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/subscription | No | 302 -> /signup?next=/console/subscription | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/support | Header secondary (Support) | 302 -> /signup?next=/console/support | Private support data | AUTH_REQUIRED | Middleware auth gate |
| /console/activity | No | 302 -> /signup?next=/console/activity | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/changes | No | 302 -> /signup?next=/console/changes | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/briefings | No | 302 -> /signup?next=/console/briefings | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/ops | No | 302 -> /signup?next=/console/ops | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/analytics | No | 302 -> /signup?next=/console/analytics | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/insights | No | 302 -> /signup?next=/console/insights | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/performance | No | 302 -> /signup?next=/console/performance | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/reality | No | 302 -> /signup?next=/console/reality | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/receipt-matching | No | 302 -> /signup?next=/console/receipt-matching | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/receipts | No | 302 -> /signup?next=/console/receipts | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/receipts-hash | No | 302 -> /signup?next=/console/receipts-hash | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/reconciliation-view | No | 302 -> /signup?next=/console/reconciliation-view | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/reconciliation/[runId] | No | 302 -> /signup?next=/console/reconciliation/[runId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/runs/[runId] | No | 302 -> /signup?next=/console/runs/[runId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/alerts-view | No | 302 -> /signup?next=/console/alerts-view | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/approvals | No | 302 -> /signup?next=/console/approvals | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/audit-trail | No | 302 -> /signup?next=/console/audit-trail | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/bulk-operations | No | 302 -> /signup?next=/console/bulk-operations | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/control-plane | No | 302 -> /signup?next=/console/control-plane | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/diagnostics | No | 302 -> /signup?next=/console/diagnostics | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/docs | No | 302 -> /signup?next=/console/docs | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/feature-flags | No | 302 -> /signup?next=/console/feature-flags | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/feature-flags-policy | No | 302 -> /signup?next=/console/feature-flags-policy | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/inspector | No | 302 -> /signup?next=/console/inspector | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/ingestion/[ingestionId] | No | 302 -> /signup?next=/console/ingestion/[ingestionId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/rules-engine | No | 302 -> /signup?next=/console/rules-engine | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/setup-check | No | 302 -> /signup?next=/console/setup-check | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/sla | No | 302 -> /signup?next=/console/sla | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/tables | No | 302 -> /signup?next=/console/tables | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/tables/[table] | No | 302 -> /signup?next=/console/tables/[table] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/webhooks | No | 302 -> /signup?next=/console/webhooks | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/workflows | No | 302 -> /signup?next=/console/workflows | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/workflows/new | No | 302 -> /signup?next=/console/workflows/new | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/workflows/[id] | No | 302 -> /signup?next=/console/workflows/[id] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/api-keys | No | 302 -> /signup?next=/console/api-keys | Private (API keys) | AUTH_REQUIRED | Middleware auth gate |
| /console/api-logs | No | 302 -> /signup?next=/console/api-logs | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/api-playground | No | 302 -> /signup?next=/console/api-playground | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/api-playground/collections | No | 302 -> /signup?next=/console/api-playground/collections | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/api-test | No | 302 -> /signup?next=/console/api-test | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/ai-analysis | No | 302 -> /signup?next=/console/ai-analysis | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/multi-source-reconciliation | No | 302 -> /signup?next=/console/multi-source-reconciliation | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site | No | 302 -> /signup?next=/console/site | Private (site builder) | AUTH_REQUIRED | Middleware auth gate |
| /console/site/branding | No | 302 -> /signup?next=/console/site/branding | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site/navigation | No | 302 -> /signup?next=/console/site/navigation | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site/pages/[id] | No | 302 -> /signup?next=/console/site/pages/[id] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site/ui-config | No | 302 -> /signup?next=/console/site/ui-config | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site/experiments | No | 302 -> /signup?next=/console/site/experiments | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/site/experiments/[id] | No | 302 -> /signup?next=/console/site/experiments/[id] | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/admin/activation | No | 302 -> /signup?next=/console/admin/activation | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/admin/tenants | No | 302 -> /signup?next=/console/admin/tenants | Private | AUTH_REQUIRED | Middleware auth gate |
| /console/playground | Header CTA (Get Started) | 200 (redirect to /playground) | Public | PUBLIC | Middleware allowlist for redirect |
| /console/playground/cli | No | 200 (redirect to /playground/cli) | Public | PUBLIC | Middleware allowlist for redirect |
| /console/playground/convert | No | 200 (redirect to /playground/convert) | Public | PUBLIC | Middleware allowlist for redirect |
| /console/playground/flags | No | 200 (redirect to /playground/flags) | Public | PUBLIC | Middleware allowlist for redirect |
| /console/playground/receipts | No | 200 (redirect to /playground/receipts) | Public | PUBLIC | Middleware allowlist for redirect |
| /console/playground/reconcile | No | 200 (redirect to /playground/reconcile) | Public | PUBLIC | Middleware allowlist for redirect |
| /admin | No | 302 -> /signup?next=/admin | Private (admin) | AUTH_REQUIRED | Middleware auth gate |
| /admin/analytics | No | 302 -> /signup?next=/admin/analytics | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/audit | No | 302 -> /signup?next=/admin/audit | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/branding | No (redirects to /console/site/branding) | 302 -> /signup?next=/admin/branding | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/database | No | 302 -> /signup?next=/admin/database | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/database/[table] | No | 302 -> /signup?next=/admin/database/[table] | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/exceptions | No | 302 -> /signup?next=/admin/exceptions | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/exceptions/[id] | No | 302 -> /signup?next=/admin/exceptions/[id] | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/experiments | No | 302 -> /signup?next=/admin/experiments | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/experiments/new | No | 302 -> /signup?next=/admin/experiments/new | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/experiments/[id] | No | 302 -> /signup?next=/admin/experiments/[id] | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/flags | No (redirects to /console/feature-flags) | 302 -> /signup?next=/admin/flags | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/metrics | No | 302 -> /signup?next=/admin/metrics | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/monitoring | No | 302 -> /signup?next=/admin/monitoring | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/ops | No | 302 -> /signup?next=/admin/ops | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/pages | No | 302 -> /signup?next=/admin/pages | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/pages/new | No | 302 -> /signup?next=/admin/pages/new | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/pages/[id]/editor | No | 302 -> /signup?next=/admin/pages/[id]/editor | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/runs | No | 302 -> /signup?next=/admin/runs | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/runs/compare | No | 302 -> /signup?next=/admin/runs/compare | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/runs/[runId] | No | 302 -> /signup?next=/admin/runs/[runId] | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/settings | No | 302 -> /signup?next=/admin/settings | Private | AUTH_REQUIRED | Middleware auth gate |
| /admin/webhooks | No | 302 -> /signup?next=/admin/webhooks | Private | AUTH_REQUIRED | Middleware auth gate |
| /enterprise/dashboard | No | 302 -> /signup?next=/enterprise/dashboard | Private | AUTH_REQUIRED | Middleware auth gate |
| /investor/reality | No | 302 -> /signup?next=/investor/reality | Private | AUTH_REQUIRED | Middleware auth gate |
| /investor/proof | No | 302 -> /signup?next=/investor/proof | Private | AUTH_REQUIRED | Middleware auth gate |
| /review/polish | No | 302 -> /signup?next=/review/polish | Private | AUTH_REQUIRED | Middleware auth gate |
| /proof | No | 200 | Public | PUBLIC | Middleware allowlist |
| /comparison | No | 200 | Public | PUBLIC | Middleware allowlist |
| /receipts | Header secondary | 200 | Public | PUBLIC | Middleware allowlist |
| /[slug] | No | 404 if no tenant; renders tenant page if resolved | Tenant-specific public content | HYBRID | Existing tenant resolution + middleware allowlist for public routing |

## API Route Inventory (App Router)

| Route | Logged-out behavior | Data sensitivity | Access | Guard |
| --- | --- | --- | --- | --- |
| /api/health | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/health/stripe | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/health/console | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/status | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/status/health | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/oss/stats | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/public/reality | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/public/ui-config | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/docs/openapi | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/builder/revalidate | 401 if signature invalid | Public content revalidate | PUBLIC | Webhook secret verification |
| /api/seo/generate-sitemap | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/metrics/prometheus | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1 | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/receipts | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/receipts/[id] | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/recon/jobs | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/feature-flags | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/feature-flags/[id] | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/feature-flags/evaluate | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/v1/convert | 200 | Public | PUBLIC | Route handler (requireAuth: false) |
| /api/exports | 200 | Public export | PUBLIC | Route handler (requireAuth: false) |
| /api/share/[id] | 200 | Shared public content | PUBLIC | Route handler (requireAuth: false) |
| /api/referrals | 200 | Public referral tracking | PUBLIC | Route handler (requireAuth: false) |
| /api/invite/[token] (GET) | 200 | Invite metadata | PUBLIC | Route handler (requireAuth: false) |
| /api/invite/[token] (POST) | 401 if unauthenticated | Workspace membership | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/stripe/webhook | 200/400 | Billing webhook | PUBLIC (webhook) | Signature validation |
| /api/stripe/checkout | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/stripe/portal | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/user/value-moments | 200 | User guidance | PUBLIC | Route handler (requireAuth: false) |
| /api/user/checklist | 401 if unauthenticated | User onboarding | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/user/upgrade | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/user/pre-test | 401 if unauthenticated | User onboarding | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/milestones | 401 if unauthenticated | User milestones | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/feedback-loops/insights | 401 if unauthenticated | Internal analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/health | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/audit | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/runs | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/stream | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/exceptions | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/exceptions/[id]/resolve | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/exceptions/[id]/escalate | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/admin/metrics | 401 if unauthenticated | Admin | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/edge-functions | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/performance | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/customers | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/activation-funnel | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/retry-queues | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/system-health | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ops/overview | 401 if unauthenticated | Ops | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/rbac/roles | 401 if unauthenticated | RBAC | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/rbac/users | 401 if unauthenticated | RBAC | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/projects | 401 if unauthenticated | Projects | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/projects/snapshots | 401 if unauthenticated | Projects | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/projects/snapshots/[snapshotId]/export | 401 if unauthenticated | Projects | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/projects/snapshots/[snapshotId]/rollback | 401 if unauthenticated | Projects | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/workspaces | 401 if unauthenticated | Workspaces | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/workspaces/[workspaceId]/invites | 401 if unauthenticated | Workspaces | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/workspaces/[workspaceId]/onboarding | 401 if unauthenticated | Workspaces | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/runs/create | 401 if unauthenticated | Runs | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/runs/[runId] | 401 if unauthenticated | Runs | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/quota | 401 if unauthenticated | Usage limits | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/metrics | 401 if unauthenticated | Internal metrics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/health | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/analytics | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/[integrationId]/test | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/[integrationId]/debug | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/[integrationId]/upgrade | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/[integrationId]/versions | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/connect/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/callback/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/webhook/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/test/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/sync/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/disconnect/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/refresh/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/backfill/[providerId] | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/receipts | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/receipts/[id] | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/performance | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/health | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/feature-flags | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/feature-flags/[id]/environments/[env] | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/meaningful-changes | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/subscription-status | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/reality | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/receipts-v2 | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/api-keys | 401 if unauthenticated | API keys | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/api-keys/[id] | 401 if unauthenticated | API keys | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/api-logs | 401 if unauthenticated | Console data | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/branding | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/navigation | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/pages | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/pages/[id]/publish | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/pages/[id] | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/experiments | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/experiments/[id] | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/experiments/[id]/results | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/experiments/[id]/start | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/site/ui-config | 401 if unauthenticated | Site builder | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/usage | 401 if unauthenticated | Usage | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/usage/export | 401 if unauthenticated | Usage | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/usage/analytics | 401 if unauthenticated | Usage | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/usage/alerts | 401 if unauthenticated | Usage | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/usage/warnings | 401 if unauthenticated | Usage | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/user-role | 401 if unauthenticated | RBAC | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/analytics/rollup | 401 if unauthenticated | Analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/analytics/saved-views | 401 if unauthenticated | Analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/analytics/datasets | 401 if unauthenticated | Analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/analytics/pivot | 401 if unauthenticated | Analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/subscription | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/tenants | 401 if unauthenticated | Tenants | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/costs | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/insights | 401 if unauthenticated | Analytics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/reconciliation | 401 if unauthenticated | Reconciliation | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/ai-analysis | 401 if unauthenticated | AI analysis | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/tables/[table] | 401 if unauthenticated | Data tables | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/alerts | 401 if unauthenticated | Alerts | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/alerts/[id]/acknowledge | 401 if unauthenticated | Alerts | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/billing | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/billing/ai-tokens | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/support/tickets | 401 if unauthenticated | Support tickets | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/support/triage | 401 if unauthenticated | Support tickets | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/activities | 401 if unauthenticated | Activity log | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/webhooks | 401 if unauthenticated | Webhooks | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/webhooks/[id] | 401 if unauthenticated | Webhooks | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/metrics | 401 if unauthenticated | Metrics | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/console/ai-tokens/usage | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/billing/payment-recovery | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/billing/dispute | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/billing/retry-payment | 401 if unauthenticated | Billing | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/support/tickets | 401 if unauthenticated | Support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/support/report-issue | 401 if unauthenticated | Support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/support/canned-responses | 401 if unauthenticated | Support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/enterprise/contact | 200 | Public inquiry | PUBLIC | Route handler (requireAuth: false) |
| /api/enterprise/ip-allowlist | 401 if unauthenticated | Enterprise security | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/enterprise/ip-allowlist/[id] | 401 if unauthenticated | Enterprise security | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/gtm/funnel-stage | 401 if unauthenticated | Marketing attribution | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/gtm/roi | 401 if unauthenticated | Marketing attribution | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/gtm/demo/reset | 401 if unauthenticated | Demo tooling | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/onboarding/progress | 401 if unauthenticated | Onboarding | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/onboarding/progress/skip | 401 if unauthenticated | Onboarding | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/pricing/experiments | 401 if unauthenticated | Pricing experimentation | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/jobs/[jobId] | 200 | Job telemetry | PUBLIC | Route handler (requireAuth: false) |
| /api/jobs/[jobId]/progress | 200 | Job telemetry | PUBLIC | Route handler (requireAuth: false) |
| /api/jobs/[jobId]/exceptions | 200 | Job telemetry | PUBLIC | Route handler (requireAuth: false) |
| /api/jobs/[jobId]/exceptions/[exceptionId] | 200 | Job telemetry | PUBLIC | Route handler (requireAuth: false) |
| /api/jobs/bulk | 200 | Job telemetry | PUBLIC | Route handler (requireAuth: false) |
| /api/data/import | 401 if unauthenticated | Data import | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/data/export | 401 if unauthenticated | Data export | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/cron/check-reliability-alerts | 200 | Scheduled ops | PUBLIC (cron token) | Route handler (cron auth) |
| /api/cron/monthly-summary | 200 | Scheduled ops | PUBLIC (cron token) | Route handler (cron auth) |
| /api/cron/email-lifecycle | 200 | Scheduled ops | PUBLIC (cron token) | Route handler (cron auth) |
| /api/cron/daily-cost-rollup | 200 | Scheduled ops | PUBLIC (cron token) | Route handler (cron auth) |
| /api/cron/low-activity | 200 | Scheduled ops | PUBLIC (cron token) | Route handler (cron auth) |
| /api/vercel-example | 401 if unauthenticated | Demo | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/health | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/integrations/analytics | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ai/data-insights | 401 if unauthenticated | AI insights | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ai/support-assistant | 401 if unauthenticated | AI support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ai/troubleshooting | 401 if unauthenticated | AI support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/ai/onboarding-assistant | 401 if unauthenticated | AI support | AUTH_REQUIRED | Route handler (requireAuth: true) |
| /api/connectors/* | 401 if unauthenticated | Integrations | AUTH_REQUIRED | Route handler (requireAuth: true) |
