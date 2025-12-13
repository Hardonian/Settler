# Settler Architecture Overview

**Last Updated:** 2025-01-20  
**Status:** Production-Ready

## Executive Summary

Settler is a Reconciliation-as-a-Service (RaaS) platform built as a Next.js monorepo. The system provides financial reconciliation, receipt parsing, feature flags, and deterministic computation APIs. It follows a **Hexagonal Architecture** pattern with clear separation between domain logic, infrastructure, and presentation layers.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web App (packages/web)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Marketing  │  │   Console    │  │   API Routes  │     │
│  │    Pages     │  │   Dashboard  │  │  (Next.js)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain Layer (packages/web/src/domain)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Billing    │  │ Reconciliation│  │   Receipts   │     │
│  │   Service    │  │    Engine     │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Infrastructure Layer (Supabase + Prisma)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │     Redis     │  │    Stripe     │     │
│  │  (Supabase)  │  │   (Upstash)   │  │   (Billing)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Entry Points

### Frontend Entry Points

1. **Landing Page** (`/`)
   - Marketing homepage
   - Hero, features, pricing CTA
   - Route: `packages/web/src/app/page.tsx`

2. **Pricing Page** (`/pricing`)
   - Plan comparison
   - Checkout initiation
   - Route: `packages/web/src/app/pricing/page.tsx`

3. **Signup Page** (`/signup`)
   - User registration
   - Supabase Auth integration
   - Route: `packages/web/src/app/signup/page.tsx`

4. **Console Dashboard** (`/console`)
   - Authenticated user dashboard
   - Protected route (requires auth)
   - Route: `packages/web/src/app/console/page.tsx`

5. **Billing Console** (`/console/billing`)
   - Subscription management
   - Usage tracking
   - Route: `packages/web/src/app/console/billing/page.tsx`

### API Entry Points

#### Public APIs (v1)

- `POST /api/v1/receipts` - Parse receipt (requires API key)
- `GET /api/v1/receipts/[id]` - Get receipt by ID
- `POST /api/v1/feature-flags/evaluate` - Evaluate feature flag
- `GET /api/v1/feature-flags/[id]` - Get flag config
- `POST /api/v1/convert` - Currency/unit conversion

#### Authenticated APIs

- `GET /api/console/billing` - Get billing status
- `GET /api/console/usage` - Get usage metrics
- `GET /api/console/api-keys` - List API keys
- `POST /api/console/api-keys` - Create API key

#### Billing APIs

- `POST /api/stripe/checkout` - Create checkout session (authenticated)
- `POST /api/stripe/webhook` - Stripe webhook handler (public, signature verified)
- `POST /api/stripe/portal` - Create customer portal session (authenticated)

#### Admin APIs

- `GET /api/admin/audit-logs` - Audit log query
- `POST /api/admin/impersonate` - User impersonation (admin only)

## Database Schema (Prisma)

### Core Tables

#### Billing Tables
- `billing_accounts` - User billing accounts (1:1 with users)
- `subscriptions` - Active subscriptions (linked to Stripe)
- `stripe_events` - Webhook event log (idempotency)
- `usage_events` - Granular usage tracking
- `usage_aggregate_daily` - Daily aggregated usage

#### Reconciliation Tables
- `recon_jobs` - Reconciliation job definitions
- `recon_results` - Job execution results
- `recon_templates` - Reusable job templates
- `recon_audits` - Audit trail for recon operations

#### Receipts Tables
- `receipt_uploads` - Upload metadata
- `receipts` - Parsed receipt data
- `receipt_items` - Line items from receipts

#### Feature Flags Tables
- `feature_flags` - Flag definitions
- `feature_flag_environments` - Environment-specific configs
- `feature_flag_overrides` - User/tenant overrides

#### Multi-Tenant Tables
- `tenants` - Tenant/organization records
- `tenant_branding` - White-label branding config
- `tenant_pages` - Custom page content
- `experiments` - A/B test definitions

### Key Relationships

```
User (Supabase Auth)
  └─> BillingAccount (1:1)
      └─> Subscription (1:many)
      └─> UsageEvent (1:many)
      └─> UsageAggregateDaily (1:many)

Tenant
  └─> TenantBranding (1:1)
  └─> TenantPages (1:many)
  └─> Experiments (1:many)
  └─> BillingAccount (1:1, optional)

ReconJob
  └─> ReconResult (1:many)
  └─> ReconAudit (1:many)
```

## External Dependencies

### Critical External Services

1. **Supabase** (PostgreSQL + Auth)
   - Database: PostgreSQL 15+
   - Auth: Supabase Auth (JWT-based)
   - RLS: Row-level security policies
   - Config: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

2. **Stripe** (Billing)
   - Checkout Sessions
   - Subscriptions
   - Webhooks (signature verification)
   - Config: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

3. **Upstash Redis** (Caching/Queues)
   - Rate limiting
   - Job queues (BullMQ)
   - Caching
   - Config: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

4. **Resend** (Email)
   - Transactional emails
   - Config: `RESEND_API_KEY`

5. **Sentry** (Error Tracking)
   - Error monitoring
   - Performance tracking
   - Config: `SENTRY_DSN` (optional)

### Optional Services

- **Vercel Analytics** - Web analytics
- **OpenTelemetry** - Distributed tracing (if configured)

## Authentication & Authorization

### Auth Flow

1. **User Registration/Login**
   - Supabase Auth handles OAuth + email/password
   - JWT tokens stored in HTTP-only cookies
   - Middleware (`packages/web/middleware.ts`) refreshes session

2. **API Key Authentication**
   - API keys stored in `api_keys` table (encrypted)
   - Used for programmatic API access
   - Scoped to billing account

3. **Route Protection**
   - Middleware checks Supabase session
   - Protected routes: `/console/*`, `/dashboard/*`
   - Public routes: `/`, `/pricing`, `/docs/*`

### Authorization Levels

- **Public** - No auth required (marketing pages)
- **Authenticated** - Requires valid Supabase session
- **Admin** - Requires admin role in Supabase Auth metadata
- **API Key** - Valid API key with proper scopes

## Billing Flow

### Subscription Lifecycle

1. **Checkout Initiation**
   ```
   User clicks "Upgrade" → POST /api/stripe/checkout
   → Creates Stripe Checkout Session
   → Redirects to Stripe hosted checkout
   ```

2. **Payment Success**
   ```
   Stripe redirects → /billing/success?session_id={id}
   → Page polls /api/console/billing
   → Webhook processes subscription (async)
   ```

3. **Webhook Processing**
   ```
   Stripe → POST /api/stripe/webhook
   → Verifies signature (raw body)
   → Checks idempotency (stripe_events table)
   → Creates/updates Subscription record
   → Grants entitlements
   ```

4. **Usage Tracking**
   ```
   API call → UsageEvent created
   → Daily aggregation → UsageAggregateDaily
   → Billing page displays usage
   ```

### Plan Configuration

Plans defined in `packages/web/src/domain/billing/planConfig.ts`:
- **Free**: 1K reconciliations, 100 receipts, 100K flags/month
- **Pro**: 100K reconciliations, 10K receipts, 1M flags/month ($99/mo)
- **Scale**: 1M reconciliations, 100K receipts, 10M flags/month ($499/mo)

## Background Jobs

### Cron Jobs (Vercel Cron)

- `/api/cron/email-lifecycle` - Email automation
- `/api/cron/monthly-summary` - Monthly reports
- `/api/cron/low-activity` - User engagement

### Queue Jobs (BullMQ + Redis)

- Webhook delivery retries
- Usage aggregation
- Receipt processing (async)

## Deployment Architecture

### Vercel Deployment

- **Runtime**: Node.js 24+ (for Prisma binary engine)
- **Edge Runtime**: Used sparingly (only for simple routes)
- **Build**: Turbo monorepo build
- **Environment**: Environment variables in Vercel dashboard

### Build Process

1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate`)
3. Type check (`tsc`)
4. Lint (`eslint`)
5. Build packages (`turbo run build`)
6. Next.js build (`next build`)

### Database Migrations

- Supabase migrations in `/supabase/migrations/`
- Prisma migrations (if used) via `prisma migrate`
- Run on deploy via Supabase CLI or GitHub Actions

## Security Architecture

### Data Protection

- **Encryption at Rest**: Supabase encryption
- **Encryption in Transit**: TLS/HTTPS everywhere
- **Sensitive Data**: Encrypted with `ENCRYPTION_KEY` (AES-256-GCM)
- **API Keys**: Stored encrypted, never logged

### Row-Level Security (RLS)

- Supabase RLS policies enforce tenant isolation
- Service role key only used server-side
- Anon key used client-side (with RLS)

### Webhook Security

- Stripe webhooks verify signature using raw body
- Idempotency keys prevent duplicate processing
- Event log in `stripe_events` table

## Monitoring & Observability

### Error Tracking

- Sentry integration (optional)
- Error boundaries in React components
- Structured logging

### Metrics

- Vercel Analytics (web)
- Custom usage metrics in database
- Health check endpoint: `/api/status/health`

### Logging

- Structured logs (JSON)
- Log levels: `error`, `warn`, `info`, `debug`
- PII scrubbing in logs

## API Rate Limiting

- Default: 1000 requests per 15 minutes
- Per-endpoint overrides
- Redis-backed rate limiting
- Config: `RATE_LIMIT_DEFAULT`, `RATE_LIMIT_WINDOW_MS`

## File Structure

```
packages/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── console/      # Console pages
│   │   └── [slug]/       # Dynamic routes
│   ├── components/       # React components
│   ├── domain/           # Domain logic
│   │   └── billing/      # Billing domain
│   ├── lib/              # Shared utilities
│   │   ├── supabase/     # Supabase clients
│   │   └── env/          # Env validation
│   └── shared/           # Shared code
│       └── db/           # Prisma client
├── middleware.ts         # Next.js middleware
└── package.json
```

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Cache/Queue**: Redis (Upstash)
- **Auth**: Supabase Auth
- **Billing**: Stripe
- **Email**: Resend
- **Monitoring**: Sentry (optional)
- **Deployment**: Vercel

## Development Workflow

1. **Local Setup**
   ```bash
   npm install
   cp .env.example .env
   # Configure env vars
   npm run db:migrate:local
   npm run dev
   ```

2. **Database Changes**
   ```bash
   # Create migration
   npm run db:new
   # Apply locally
   npm run db:migrate:local
   ```

3. **Testing**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

## Production Considerations

### Environment Variables

See `config/env.schema.ts` for complete list. Critical vars:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`, `ENCRYPTION_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Scaling

- **Database**: Supabase auto-scaling
- **API**: Vercel serverless functions (auto-scale)
- **Cache**: Upstash Redis (serverless)
- **Bottlenecks**: Prisma connection pooling, Stripe API rate limits

### Disaster Recovery

- Database backups: Supabase automated backups
- Code: Git repository (GitHub)
- Secrets: Vercel environment variables
- Webhook replay: Stripe webhook replay API

## Known Limitations

1. **Prisma Binary Engine**: Requires Node.js runtime (not Edge)
2. **Webhook Processing**: Must use Node.js runtime for raw body access
3. **Tenant Isolation**: RLS policies must be maintained manually
4. **Rate Limiting**: Redis required for distributed rate limiting

## Future Enhancements

- GraphQL API layer
- WebSocket support for real-time updates
- Multi-region deployment
- Advanced analytics dashboard
- Custom adapter marketplace
