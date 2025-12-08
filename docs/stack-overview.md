# Stack Overview

**Last Updated:** 2025-01-XX  
**Product:** Settler (Reconciliation-as-a-Service API)

## Executive Summary

Settler is a monorepo-based reconciliation platform built on:
- **Frontend:** Next.js 14 (App Router) with React
- **Backend:** Express.js API + Supabase (Postgres, Auth, RLS)
- **Infrastructure:** Vercel (frontend) + Supabase (backend) + Upstash Redis (optional)
- **Architecture:** Multi-tenant SaaS with Row-Level Security (RLS)

---

## Frontend Stack

### Framework & Runtime
- **Next.js 14.0.4** (App Router mode)
- **React 18.2.0**
- **TypeScript 5.3.3**
- **SSR/ISR:** Server Components + Server Actions
- **Deployment:** Vercel

### Key Libraries
- `@supabase/ssr` (0.8.0) - Supabase SSR integration
- `@supabase/supabase-js` (2.86.0) - Supabase client
- TailwindCSS + Framer Motion - UI/styling
- MDX - Content rendering

### State Management
- **Server State:** Supabase queries via Server Components
- **Client State:** React hooks (useState, useEffect)
- **No global state library** (TanStack Query, SWR, etc.) - relying on Supabase realtime subscriptions where needed

### Authentication
- **Supabase Auth** (email/password, magic links)
- Cookie-based sessions via `@supabase/ssr`
- Middleware handles auth refresh

---

## Backend Stack

### API Server
- **Express.js 4.18.2** (Node.js 20+)
- **TypeScript** throughout
- **Monorepo structure** (Turbo)

### Database & ORM
- **Supabase Postgres** (primary database)
- **Migrations:** Supabase migration files in `supabase/migrations/`
- **No ORM** - direct SQL queries via Supabase client
- **RLS (Row-Level Security):** Enabled on all tenant-scoped tables

### Key Backend Libraries
- `@supabase/supabase-js` - Database client
- `pg` - Direct Postgres access (fallback)
- `bullmq` (5.3.0) - Job queues (requires Redis)
- `ioredis` (5.3.2) - Redis client
- `@upstash/redis` (1.25.0) - Upstash Redis (serverless-friendly)
- `express-rate-limit` + `rate-limit-redis` - Rate limiting
- `winston` - Logging
- `@sentry/node` - Error tracking

---

## Supabase Footprint

### Database Tables (Core)
- `tenants` - Multi-tenancy foundation
- `users` - User accounts (linked to Supabase Auth)
- `jobs`, `executions`, `matches`, `unmatched` - Reconciliation core
- `webhooks`, `webhook_deliveries`, `webhook_payloads` - Webhook system
- `reports` - Generated reports
- `audit_logs` - Audit trail
- `api_keys` - API key management
- `reconciliation_graph_nodes`, `reconciliation_graph_edges` - Graph engine
- `financial_ledger`, `account_balances` - Financial tracking
- `leads`, `deals`, `contacts`, `activity_logs` - CRM schema
- `profiles`, `posts`, `activity_log`, `positioning_feedback`, `notifications` - Ecosystem/marketing schema
- `error_logs` - Error tracking
- `tenant_usage`, `tenant_quota_usage` - Usage tracking

### RLS Policies
- **Status:** Enabled on all tenant-scoped tables
- **Pattern:** Tenant isolation via `current_tenant_id()` function
- **Coverage:** Core tables have policies; some newer tables may need review (see `docs/supabase-gaps.md`)

### Edge Functions
- **Status:** ❌ **Not implemented** (directory exists but empty)
- **Potential uses:**
  - Webhook delivery retries
  - Scheduled cleanup jobs
  - Email sending (Resend integration)
  - Background reconciliation processing

### Storage
- **Status:** ⚠️ **Not configured**
- **Potential uses:**
  - Report exports (PDFs, CSVs)
  - User-uploaded files
  - Log archives

### Cron Jobs
- **Status:** ❌ **Not configured**
- **Potential uses:**
  - Daily data retention cleanup
  - Weekly report generation
  - Periodic cache warming
  - Email digest sending

---

## External Services

### Currently Wired
- ✅ **Supabase** - Database, Auth, RLS
- ✅ **Sentry** - Error tracking (configured, may need DSN)
- ✅ **Upstash Redis** - Caching, queues, rate limiting (optional)

### Referenced but Not Wired
- ❌ **Resend** - Transactional email (not implemented)
- ❌ **PostHog/Plausible** - Product analytics (not found)
- ❌ **Logflare** - Log aggregation (not found)

---

## Redis Usage

### Current Use Cases
1. **Job Queues** (`bullmq`) - Background job processing
2. **Caching** - Reconciliation results, API responses
3. **Rate Limiting** - Token bucket algorithm
4. **Session Storage** - (potential, not confirmed)

### Decision
**Redis IS REQUIRED** for production due to:
- BullMQ job queues (critical for async reconciliation processing)
- Rate limiting (security/abuse prevention)
- Caching (performance optimization)

See `docs/redis-decision.md` for detailed rationale.

---

## Infrastructure & Deployment

### Frontend
- **Platform:** Vercel
- **Build:** Next.js build via Turbo
- **Environment:** `.env.example` → Vercel env vars

### Backend API
- **Platform:** Vercel Serverless Functions (or Express server)
- **Database:** Supabase Postgres
- **Redis:** Upstash (serverless Redis)

### CI/CD
- GitHub Actions workflows:
  - `ci.yml` - Linting, type checking, tests
  - `deploy-preview.yml` - Preview deployments
  - `deploy-production.yml` - Production deployments
  - `supabase-migrate.yml` - Database migrations

---

## Missing Pieces & Gaps

### High Priority
1. **Email Service (Resend)** - No transactional email implementation
2. **Supabase Edge Functions** - Not implemented
3. **Supabase Storage** - Not configured
4. **Cron Jobs** - Not configured

### Medium Priority
1. **Product Analytics** - No analytics integration
2. **Structured Logging** - Winston exists but may need better setup
3. **Background Job Workers** - BullMQ exists but workers may not be fully wired

### Low Priority
1. **CDN/Asset Storage** - May not be needed yet
2. **Search** - Postgres full-text search may be sufficient

---

## Environment Variables

See `.env.example` for complete list. Key variables:

**Supabase:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Redis:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Email (to be added):**
- `RESEND_API_KEY`

**Observability:**
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`

---

## Next Steps

1. Review `docs/supabase-gaps.md` for database/RLS issues
2. Review `docs/redis-decision.md` for Redis rationale
3. Review `docs/background-jobs.md` for async job patterns
4. Review `FOUNDER_CHECKLIST_STACK_GAPS.md` for manual setup tasks
