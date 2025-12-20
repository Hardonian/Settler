# Configuration Guide

**Last Updated:** January 2026  
**Audience:** Developers, DevOps Engineers

---

## Overview

This guide documents all environment variables required to configure and run Settler. Environment variables are organized by category and include required vs optional status, default values, and usage notes.

---

## Quick Start

### Local Development

1. Copy `.env.template` to `.env`
2. Fill in required values (see below)
3. Start development server: `npm run dev`

### Production Deployment

Set environment variables in your deployment platform (Vercel, GitHub Actions, etc.). See platform-specific sections below.

---

## Required Environment Variables

### Core Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node.js environment | `development`, `production` | Yes |
| `PORT` | Server port | `3000` | No (default: 3000) |

### Database (Supabase/PostgreSQL)

**Option 1: Supabase (Recommended)**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` | Yes (for admin ops) |

**Option 2: Direct PostgreSQL**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes (if not using Supabase) |

**Option 3: Individual DB Variables**

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` | No |
| `DB_PORT` | PostgreSQL port | `5432` | No |
| `DB_NAME` | Database name | `settler` | No |
| `DB_USER` | Database user | `postgres` | No |
| `DB_PASSWORD` | Database password | `password` | Yes |
| `DB_SSL` | Enable SSL | `true`, `false` | No |

### Security

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | `min-32-characters-long-secret` | Yes |
| `ENCRYPTION_KEY` | Encryption key (AES-256) | `exactly-32-characters-long` | Yes |

**Security Notes:**
- `JWT_SECRET`: Minimum 32 characters, use cryptographically random string
- `ENCRYPTION_KEY`: Exactly 32 characters, use cryptographically random string
- Never commit secrets to version control
- Use environment variable management tools (Vercel, GitHub Secrets, etc.)

### Redis (Upstash)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://xxx.upstash.io` | No (falls back to in-memory) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | `token` | No (if UPSTASH_REDIS_REST_URL set) |

**Note:** Redis is optional. If not configured, rate limiting falls back to in-memory storage.

---

## Optional Environment Variables

### Application URLs

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://settler.dev` | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://app.settler.dev` | No |

### Stripe (Billing)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` | Yes (for billing) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` | Yes (for billing) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | Yes (for webhooks) |

### Observability

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` | No |
| `SENTRY_ENVIRONMENT` | Sentry environment | `production`, `staging` | No |

### Feature Flags

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_FEATURE_X` | Feature toggle | `true`, `false` | No |

### OpenAI (Autonomous Agents)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` | No (for AI features) |

---

## Platform-Specific Configuration

### Vercel

1. Go to Project Settings → Environment Variables
2. Add variables for each environment (Production, Preview, Development)
3. Variables prefixed with `NEXT_PUBLIC_` are exposed to client-side code
4. Restart deployment after adding variables

**Required for Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `STRIPE_SECRET_KEY` (if using billing)
- `STRIPE_PUBLISHABLE_KEY` (if using billing)

### GitHub Actions

Set secrets in Repository Settings → Secrets and variables → Actions.

**Required for CI:**
- `DATABASE_URL` (for tests)
- `SUPABASE_URL` (for tests)
- `SUPABASE_ANON_KEY` (for tests)
- `JWT_SECRET` (for tests)
- `ENCRYPTION_KEY` (for tests)

### Local Development

Create `.env` file in repository root:

```bash
# Core
NODE_ENV=development
PORT=3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Security
JWT_SECRET=your-jwt-secret-min-32-chars-long
ENCRYPTION_KEY=exactly-32-characters-long

# Optional
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=token
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Environment Variable Validation

### Validation Script

Run validation to check environment variables:

```bash
npm run validate:env
```

### Build-Time vs Runtime

- **Build-time variables:** Used during `npm run build` (e.g., `NEXT_PUBLIC_*`)
- **Runtime variables:** Used when application runs (e.g., `DATABASE_URL`, `JWT_SECRET`)

**Note:** Variables prefixed with `NEXT_PUBLIC_` are embedded in the client bundle. Never include secrets in `NEXT_PUBLIC_*` variables.

---

## Security Best Practices

### Secrets Management

1. **Never commit secrets** to version control
2. **Use environment variables** for all secrets
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use different secrets** for each environment
5. **Limit access** to production secrets

### Secret Generation

**JWT Secret:**
```bash
openssl rand -base64 32
```

**Encryption Key (32 characters):**
```bash
openssl rand -hex 16
```

### Secret Scanning

The repository includes secret scanning in CI:
- Gitleaks for secret detection
- npm audit for dependency vulnerabilities
- Snyk for security scanning

---

## Troubleshooting

### Common Issues

**"Missing required environment variable"**
- Check `.env` file exists (local) or variables are set (production)
- Verify variable names match exactly (case-sensitive)
- Check for typos or extra spaces

**"Database connection failed"**
- Verify `DATABASE_URL` or Supabase variables are correct
- Check database is accessible from your network
- Verify SSL settings (`DB_SSL=true` for production)

**"JWT secret too short"**
- Ensure `JWT_SECRET` is at least 32 characters
- Ensure `ENCRYPTION_KEY` is exactly 32 characters

**"Client-side variable not available"**
- Ensure variable is prefixed with `NEXT_PUBLIC_`
- Restart dev server after adding `NEXT_PUBLIC_*` variables
- Rebuild application after changing build-time variables

---

## Reference

- **Environment Schema:** See `config/env.schema.ts` for complete schema
- **Validation Script:** See `scripts/check-env.ts`
- **Getting Started:** See [docs/GETTING_STARTED.md](./GETTING_STARTED.md)
- **Deployment:** See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

---

**For platform-specific setup instructions, see deployment documentation.**
