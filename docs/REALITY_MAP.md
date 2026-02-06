# Reality Map

**Scope:** Settler end-to-end flows mapped to routes, data stores, external dependencies, and invariants.

## Stack Snapshot

- **Web:** Next.js App Router (`packages/web`)
- **API:** Express + TypeScript (`packages/api`)
- **Workers:** JobForge (Node) + Workhorse (Python)
- **Data:** Supabase/Postgres (RLS enforced), Redis
- **SDKs:** TypeScript, Python, Go, Ruby, C#, Java

## Primary Flows

### 1) Console Sign-in → Tenant Context → Console APIs

- **Routes**
  - Web UI: `/console/*` (App Router)
  - APIs: `/api/console/*`
- **Data stores**
  - `billing_accounts`, `subscriptions`, `tenants`, `usage_events`
- **External deps**
  - Supabase Auth (user context), Stripe (entitlements)
- **Invariants**
  - Tenant isolation enforced by RLS and `tenant_id` filters.
  - Errors use `{ code, message, traceId, retryable }` envelope.

### 2) Reconciliation Workflow (Create → Run → Results)

- **Routes**
  - Create job: `/api/v1/recon/jobs`
  - Read results: `/api/console/reconciliation`, `/console/reconciliation/[runId]`
- **Data stores**
  - `normalized_transactions`, `reconciliation_runs`, `reconciliation_matches`
- **External deps**
  - Adapters (Stripe, Shopify, PayPal) via `packages/adapters`
- **Invariants**
  - Deterministic matching logic; no hidden side effects.
  - No hard 500s on user routes; fail closed for entitlements.

### 3) Billing & Webhooks (Checkout → Webhook → Entitlements)

- **Routes**
  - Checkout: `/api/stripe/checkout`
  - Webhook: `/api/stripe/webhook`
- **Data stores**
  - `billing_accounts`, `subscriptions`
- **External deps**
  - Stripe (signature verification + idempotency)
- **Invariants**
  - Webhooks must use **Node runtime**, verify raw body, and reject replays.
  - Entitlements are enforced server-side; demo mode returns safe fallback.

### 4) Demo Mode (Deterministic Sandbox)

- **Routes**
  - Playground dataset: `/playground/demo-dataset`
  - Playground run: `/playground/demo-run`
  - Web demo: `/demo/*`
- **Data stores**
  - `demo/data/*.json` (seeded deterministic files)
- **External deps**
  - None (all demo data is local and deterministic)
- **Invariants**
  - No external calls in demo mode.
  - Resettable via `npm run demo:reset`.

## External Dependencies

- **Stripe** (billing + webhooks)
- **Supabase** (Postgres + Auth + RLS)
- **Redis** (job queues, caching)
- **OpenAI** (optional; gated)

## Error & Safety Guarantees

- **Error envelope:** `{ code, message, traceId, retryable }`
- **No hard 500s:** user routes must return graceful fallback responses.
- **Tenant isolation:** RLS + tenant-scoped queries.
- **Rate limits:** public endpoints are rate limited (in-memory; Redis upgrade path documented).

## Verification Commands (Reality Gates)

- `pnpm run verify:fast`
- `pnpm run verify:docs`
- `pnpm run test:smoke`
- `pnpm run test:e2e`
