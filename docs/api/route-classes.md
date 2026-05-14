# API Route Classes (Auth + Tenant Taxonomy)

Generated from `docs/api/route-inventory.json`.

| Route group | Routes | Auth required | Tenant scoped | Critical routes | Example paths with badges |
| --- | ---: | ---: | ---: | ---: | --- |
| admin | 10 | 10/10 | 7/10 | 10/10 | `auth` `tenant` `critical` `/api/admin/audit`<br/>`auth` `tenant` `critical` `/api/admin/exceptions`<br/>`auth` `global` `critical` `/api/admin/exceptions/[id]/escalate` |
| ai | 4 | 3/4 | 0/4 | 0/4 | `auth` `global` `medium` `/api/ai/data-insights`<br/>`auth` `global` `medium` `/api/ai/onboarding-assistant`<br/>`public` `global` `medium` `/api/ai/support-assistant` |
| billing | 4 | 4/4 | 0/4 | 4/4 | `auth` `global` `critical` `/api/billing/dispute`<br/>`auth` `global` `critical` `/api/billing/payment-recovery`<br/>`auth` `global` `critical` `/api/billing/payment-recovery` |
| builder | 2 | 0/2 | 0/2 | 0/2 | `public` `global` `medium` `/api/builder/revalidate`<br/>`public` `global` `medium` `/api/builder/revalidate` |
| connectors | 8 | 1/8 | 8/8 | 0/8 | `public` `tenant` `high` `/api/connectors/backfill/[providerId]`<br/>`public` `tenant` `high` `/api/connectors/callback/[providerId]`<br/>`public` `tenant` `high` `/api/connectors/connect/[providerId]` |
| console | 82 | 82/82 | 29/82 | 11/82 | `auth` `global` `medium` `/api/console/activities`<br/>`auth` `global` `medium` `/api/console/ai-analysis`<br/>`auth` `global` `medium` `/api/console/ai-analysis` |
| control-plane | 7 | 7/7 | 3/7 | 7/7 | `auth` `tenant` `critical` `/api/control-plane/failures`<br/>`auth` `tenant` `critical` `/api/control-plane/failures`<br/>`auth` `global` `critical` `/api/control-plane/keys` |
| cron | 6 | 0/6 | 0/6 | 0/6 | `public` `global` `medium` `/api/cron/check-reliability-alerts`<br/>`public` `global` `medium` `/api/cron/daily-cost-rollup`<br/>`public` `global` `medium` `/api/cron/daily-cost-rollup` |
| data | 2 | 0/2 | 0/2 | 0/2 | `public` `global` `medium` `/api/data/export`<br/>`public` `global` `medium` `/api/data/import` |
| docs | 1 | 0/1 | 0/1 | 0/1 | `public` `global` `medium` `/api/docs/openapi` |
| enterprise | 4 | 3/4 | 0/4 | 0/4 | `public` `global` `high` `/api/enterprise/contact`<br/>`auth` `global` `high` `/api/enterprise/ip-allowlist`<br/>`auth` `global` `high` `/api/enterprise/ip-allowlist` |
| explorer | 2 | 0/2 | 2/2 | 0/2 | `public` `tenant` `medium` `/api/explorer/execution/[id]`<br/>`public` `tenant` `medium` `/api/explorer/history` |
| exports | 2 | 2/2 | 2/2 | 0/2 | `auth` `tenant` `medium` `/api/exports`<br/>`auth` `tenant` `medium` `/api/exports` |
| feedback-loops | 1 | 1/1 | 0/1 | 0/1 | `auth` `global` `medium` `/api/feedback-loops/insights` |
| foundry | 4 | 0/4 | 0/4 | 0/4 | `public` `global` `medium` `/api/foundry/datasets`<br/>`public` `global` `medium` `/api/foundry/datasets/[id]`<br/>`public` `global` `medium` `/api/foundry/runs` |
| gtm | 3 | 3/3 | 1/3 | 0/3 | `auth` `tenant` `medium` `/api/gtm/demo/reset`<br/>`auth` `global` `medium` `/api/gtm/funnel-stage`<br/>`auth` `global` `medium` `/api/gtm/roi` |
| health | 3 | 0/3 | 0/3 | 0/3 | `public` `global` `medium` `/api/health`<br/>`public` `global` `medium` `/api/health/console`<br/>`public` `global` `medium` `/api/health/stripe` |
| image-optimize | 1 | 0/1 | 0/1 | 0/1 | `public` `global` `medium` `/api/image-optimize` |
| imports | 1 | 0/1 | 1/1 | 0/1 | `public` `tenant` `medium` `/api/imports/validate` |
| integrations | 6 | 5/6 | 0/6 | 0/6 | `auth` `global` `high` `/api/integrations/[integrationId]/debug`<br/>`auth` `global` `high` `/api/integrations/[integrationId]/test`<br/>`auth` `global` `high` `/api/integrations/[integrationId]/upgrade` |
| internal | 3 | 0/3 | 1/3 | 0/3 | `public` `tenant` `medium` `/api/internal/health/deep`<br/>`public` `global` `medium` `/api/internal/jobs/drain`<br/>`public` `global` `medium` `/api/internal/jobs/drain` |
| invite | 2 | 2/2 | 2/2 | 0/2 | `auth` `tenant` `medium` `/api/invite/[token]`<br/>`auth` `tenant` `medium` `/api/invite/[token]` |
| jobs | 7 | 4/7 | 7/7 | 7/7 | `public` `tenant` `critical` `/api/jobs`<br/>`public` `tenant` `critical` `/api/jobs/[id]`<br/>`auth` `tenant` `critical` `/api/jobs/[id]/exceptions` |
| metrics | 2 | 1/2 | 0/2 | 0/2 | `auth` `global` `high` `/api/metrics`<br/>`public` `global` `high` `/api/metrics/prometheus` |
| milestones | 2 | 2/2 | 0/2 | 0/2 | `auth` `global` `medium` `/api/milestones`<br/>`auth` `global` `medium` `/api/milestones` |
| onboarding | 3 | 3/3 | 0/3 | 0/3 | `auth` `global` `medium` `/api/onboarding/progress`<br/>`auth` `global` `medium` `/api/onboarding/progress`<br/>`auth` `global` `medium` `/api/onboarding/progress/skip` |
| ops | 9 | 9/9 | 2/9 | 0/9 | `auth` `tenant` `high` `/api/ops/activation-funnel`<br/>`auth` `global` `high` `/api/ops/customers`<br/>`auth` `tenant` `high` `/api/ops/dashboard` |
| oss | 1 | 0/1 | 0/1 | 0/1 | `public` `global` `medium` `/api/oss/stats` |
| pricing | 1 | 1/1 | 0/1 | 0/1 | `auth` `global` `medium` `/api/pricing/experiments` |
| projects | 5 | 3/5 | 0/5 | 0/5 | `auth` `global` `medium` `/api/projects`<br/>`public` `global` `medium` `/api/projects/snapshots`<br/>`public` `global` `medium` `/api/projects/snapshots` |
| public | 2 | 0/2 | 1/2 | 0/2 | `public` `global` `medium` `/api/public/reality`<br/>`public` `tenant` `medium` `/api/public/ui-config` |
| quota | 1 | 1/1 | 1/1 | 0/1 | `auth` `tenant` `medium` `/api/quota` |
| rbac | 2 | 2/2 | 2/2 | 0/2 | `auth` `tenant` `medium` `/api/rbac/roles`<br/>`auth` `tenant` `medium` `/api/rbac/users` |
| receipts | 1 | 0/1 | 1/1 | 0/1 | `public` `tenant` `medium` `/api/receipts/ocr` |
| referrals | 2 | 0/2 | 0/2 | 0/2 | `public` `global` `medium` `/api/referrals`<br/>`public` `global` `medium` `/api/referrals` |
| runs | 2 | 2/2 | 1/2 | 0/2 | `auth` `global` `medium` `/api/runs/[runId]`<br/>`auth` `tenant` `medium` `/api/runs/create` |
| seo | 1 | 0/1 | 0/1 | 0/1 | `public` `global` `medium` `/api/seo/generate-sitemap` |
| share | 2 | 0/2 | 0/2 | 0/2 | `public` `global` `medium` `/api/share/[id]`<br/>`public` `global` `medium` `/api/share/[id]` |
| status | 2 | 0/2 | 0/2 | 0/2 | `public` `global` `medium` `/api/status`<br/>`public` `global` `medium` `/api/status/health` |
| stripe | 3 | 2/3 | 2/3 | 1/3 | `auth` `tenant` `medium` `/api/stripe/checkout`<br/>`auth` `global` `medium` `/api/stripe/portal`<br/>`public` `tenant` `critical` `/api/stripe/webhook` |
| support | 4 | 4/4 | 0/4 | 4/4 | `auth` `global` `critical` `/api/support/canned-responses`<br/>`auth` `global` `critical` `/api/support/canned-responses`<br/>`auth` `global` `critical` `/api/support/report-issue` |
| user | 5 | 4/5 | 0/5 | 0/5 | `auth` `global` `medium` `/api/user/checklist`<br/>`auth` `global` `medium` `/api/user/checklist`<br/>`auth` `global` `medium` `/api/user/pre-test` |
| v1 | 29 | 21/29 | 13/29 | 11/29 | `public` `global` `medium` `/api/v1`<br/>`auth` `global` `medium` `/api/v1/convert`<br/>`auth` `tenant` `medium` `/api/v1/datasets` |
| vercel-example | 2 | 2/2 | 0/2 | 0/2 | `auth` `global` `medium` `/api/vercel-example`<br/>`auth` `global` `medium` `/api/vercel-example` |
| workspaces | 6 | 6/6 | 6/6 | 0/6 | `auth` `tenant` `medium` `/api/workspaces`<br/>`auth` `tenant` `medium` `/api/workspaces`<br/>`auth` `tenant` `medium` `/api/workspaces/[workspaceId]/invites` |

## Route access classes

- **Public:** `authRequired=false` and `tenantScoped=false`.
- **Authenticated global/operator:** `authRequired=true` and `tenantScoped=false`.
- **Tenant-scoped:** `tenantScoped=true` (auth required unless explicitly documented otherwise).
- **Criticality badge:** derived from route inventory (`critical`, `medium`, etc.) for endpoint risk triage.