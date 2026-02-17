# Settler

Settler is a reconciliation platform monorepo that provides a multi-tenant API, web console, SDKs, and background processing for matching financial records and surfacing discrepancies.

## Landing strip

- Deterministic reconciliation workflows backed by PostgreSQL/Supabase and a Next.js console.
- Monorepo with API, web app, adapters, SDKs, and JobForge/Workhorse background processing.
- Designed for multi-tenant, audit-friendly financial data operations.
- Extensible via adapters, job types, and SDK integrations.

**Who this is for:** engineers building reconciliation pipelines, fintech operators running internal finance ops, and contributors extending adapters/SDKs.

**Quickstart:** install dependencies and start the web console via the Quick Start section below (pnpm + Supabase/Postgres required).

## Why This Exists

- Financial teams need deterministic, reviewable reconciliation workflows rather than opaque “black box” matching.
- Reconciliation is fragile when the ingestion, matching, and audit trail are scattered across services.
- Settler centralizes reconciliation logic, visibility, and integrations in one codebase while keeping infrastructure components modular.

## What This Project Is

- A monorepo that ships a reconciliation API, a developer/ops console, SDKs, and background job processing.
- A reference implementation of reconciliation workflows using Postgres (Supabase), Next.js, and Node.
- A collection of adapters and integration points that connect external data sources to core reconciliation logic.
- **Open core**: The reconciliation engine, SDKs, and basic adapters are freely available.

## What This Project Is NOT

- A general-purpose accounting system or ledger.
- A compliance or correctness guarantee (operators still review and resolve discrepancies).
- A hosted SaaS instance out of the box (deployment and infrastructure are your responsibility).
- A fully open-source project (core is accessible, some components are commercial).

## Where This Fits (If Part of a Larger System)

- **Upstream inputs:** transaction exports, bank feeds, invoicing systems, and external data sources via adapters.
- **Core responsibilities:** ingest, normalize, reconcile, and surface discrepancies with an audit trail.
- **Downstream outputs:** dashboards, exports, and webhook/event-driven integrations for downstream systems.

## Core Capabilities

- Reconciliation API with multi-tenant data modeling and structured error handling.
- Next.js web console for operational visibility and admin workflows.
- JobForge-backed background processing with configurable job types.
- Workhorse Python worker for batch or queue-driven execution paths.
- SDKs and adapters for integrating external services and automations.

## Quick Start

### Prerequisites

- Node.js 24.x (see `.nvmrc`)
- pnpm 10.x (see `package.json`)
- PostgreSQL (Supabase or a local Postgres instance)

### Install and Run

```bash
pnpm install
cp .env.example .env
```

Set the required environment variables in `.env`, then run migrations and start the web console:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
pnpm exec tsx scripts/run-migrations-remote.ts
pnpm --filter @settler/web dev
```

**Success signal:** open `http://localhost:3000` and sign up to reach the console UI.

## Architecture Overview

High-level flow:

1. API routes receive requests and validate inputs.
2. Domain/application services orchestrate reconciliation logic.
3. Persistence and adapters handle storage and external integrations.
4. JobForge + Workhorse handle asynchronous/background execution.

Key directories:

- `packages/api`: reconciliation API (domain, application, infrastructure, routes)
- `packages/web`: Next.js web console
- `packages/adapters`: integration adapters
- `packages/jobforge-*`: job queue infrastructure
- `packages/workhorse`: Python worker for batch processing
- `packages/sdk-*`: language SDKs

## Extending the Project

- **Add an adapter:** implement a new adapter in `packages/adapters` and register it with the API boundary.
- **Add a job type:** extend JobForge types in `packages/jobforge-adapter-settler` and update workers.
- **Add UI surfaces:** use `packages/web` for console pages and shared UI patterns.
- **Add SDK functionality:** update the relevant SDK in `packages/sdk-*` and keep API contracts in sync.

Common pitfalls:

- Keep tenant isolation boundaries intact (RLS policies and tenant-scoped queries).
- Maintain deterministic reconciliation logic (no hidden side effects in matching).
- Update docs and scripts together; CI enforces docs reality checks.

## Failure & Degradation Model

- API requests return explicit error responses with HTTP status codes when validation fails.
- If dependencies (Postgres, Redis) are unavailable, health checks fail and background jobs pause.
- Background jobs follow retry rules defined in JobForge configuration; failed jobs are surfaced for review.
- Settler surfaces discrepancies but does not auto-resolve correctness disputes.

## Deploy Assumptions (Vercel-safe)

- Marketing routes are static-first and must render without auth/session/database assumptions.
- `/app/*` routes are auth-gated in middleware and redirect unauthenticated traffic to `/login?next=...`.
- Stripe/Supabase are optional for public routes. Missing env vars on marketing pages must degrade gracefully (never hard-500).
- Stripe webhooks are handled in Node runtime with raw request body signature verification (`request.text()` + `stripe.webhooks.constructEvent`).
- Security headers and request identifiers are attached at middleware level for observability and safe defaults.

## Env Matrix

| Scope | Variables | Required | Behavior when missing |
| --- | --- | --- | --- |
| Public marketing | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Public pages still render; integrations/features degrade safely |
| App-gated routes (`/app/*`) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Requests are redirected to login/fail-closed paths |
| Stripe webhook | `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` | Yes (for webhook processing) | Webhook endpoint returns configuration error response (non-500) |
| Server data layer | `DATABASE_URL` (or supported DB fallback vars) | Yes | API/data-backed operations fail closed with structured errors |

## Verification

Run from repo root:

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run test:e2e -- --project=chromium tests/e2e/marketing-crawl.spec.ts
```

Interpretation:
- Lint/typecheck/test/build must pass before release.
- Marketing crawl must show no 500 responses and no hydration-related console errors.
- Any failure here should block deploy/merge until fixed.

## Security & Safety Considerations

- Treat service-role credentials and database URLs as high-privilege secrets.
- Tenant isolation relies on Postgres RLS and tenant-scoped access patterns.
- Run verification scripts before release; they validate contracts and environment assumptions.

## Contributing

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, quality gates, and review expectations.
- Open issues using the templates in `.github/ISSUE_TEMPLATE`.
- Use Discussions (if enabled) for Q&A, ideas, and integration showcases.

## Open Core vs Commercial

### What's Included (Free/Open)

**Self-hosted deployment:**

- Reconciliation engine and API (Node.js/Next.js)
- PostgreSQL schema and migrations
- Webhook handling with idempotency
- TypeScript, Go, and Python SDKs
- Basic adapters (Stripe, Shopify, PayPal)
- Developer console UI
- Background job processing (JobForge/Workhorse)

**Use this if:**

- You want to self-host on your own infrastructure
- You need custom integrations or modifications
- You prefer to manage your own operations
- You're building internal tools

### Commercial Add-ons

**Hosted service (settler.dev):**

- Managed infrastructure and scaling
- Priority support and SLAs
- Advanced analytics and dashboards
- SSO and enterprise authentication
- Custom adapter development
- Dedicated support channels

**Use this if:**

- You don't want to manage infrastructure
- You need guaranteed uptime and support
- You want advanced features without development
- You need enterprise integrations

### Upgrading from Self-Hosted to Commercial

No migration required. The commercial service uses the same API:

1. Keep your existing integration code
2. Change API endpoint from `your-domain.com` to `api.settler.dev`
3. Use new API keys from the commercial console
4. All webhooks, SDKs, and integrations continue working

Contact: commercial@settler.dev (no sales calls, email-only)

## License & Governance

- The repository is governed under a proprietary license. See [`LICENSE`](LICENSE).
- Some subpackages carry different licenses; see [`docs/LICENSING_OVERVIEW.md`](docs/LICENSING_OVERVIEW.md).
- Governance and decision-making are documented in [`GOVERNANCE.md`](GOVERNANCE.md).
