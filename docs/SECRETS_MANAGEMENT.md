# Secrets Management Guide

This document provides a comprehensive list of all secrets required for:

- **GitHub Actions** (CI/CD workflows)
- **Vercel** (Frontend build and deployment)
- **Supabase** (Backend database and edge functions)

## ⚠️ Security Warning

**NEVER commit secrets to version control!**

- `.env` files are gitignored
- Use GitHub Secrets for CI/CD
- Use Vercel Environment Variables for deployments
- Use Supabase Secrets for edge functions

---

## 📋 GitHub Secrets (Source of Truth)

GitHub Secrets are used by CI/CD workflows. Set these in: **Repository Settings → Secrets and variables → Actions**

### 🔴 Critical Secrets (Required)

| Secret Name                 | Description                           | Where to Get                                                 | Used By                    |
| --------------------------- | ------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| `SUPABASE_URL`              | Supabase project URL                  | Supabase Dashboard → Settings → API                          | All workflows              |
| `SUPABASE_ANON_KEY`         | Supabase anonymous/public key         | Supabase Dashboard → Settings → API                          | All workflows              |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin)     | Supabase Dashboard → Settings → API                          | Migrations, edge functions |
| `SUPABASE_ACCESS_TOKEN`     | Supabase CLI access token             | Supabase Dashboard → Account → Access Tokens                 | Migration workflows        |
| `SUPABASE_PROJECT_REF`      | Supabase project reference ID         | Supabase Dashboard → Settings → General                      | Migration workflows        |
| `SUPABASE_DB_PASSWORD`      | Database password                     | Supabase Dashboard → Settings → Database                     | Migration workflows        |
| `DATABASE_URL`              | PostgreSQL connection string          | Supabase Dashboard → Settings → Database → Connection string | Migrations, API            |
| `DIRECT_URL`                | Direct DB connection (bypass pooler)  | Supabase Dashboard → Settings → Database                     | Prisma migrations          |
| `JWT_SECRET`                | JWT token signing secret (32+ chars)  | Generate: `openssl rand -base64 32`                          | API authentication         |
| `ENCRYPTION_KEY`            | AES-256-GCM encryption key (32 chars) | Generate: `openssl rand -hex 16`                             | Data encryption            |
| `RESEND_API_KEY`            | Resend API key for emails             | Resend Dashboard → API Keys                                  | Email service              |
| `STRIPE_SECRET_KEY`         | Stripe secret key                     | Stripe Dashboard → Developers → API keys                     | Payment processing         |
| `STRIPE_WEBHOOK_SECRET`     | Stripe webhook signing secret         | Stripe Dashboard → Webhooks → Signing secret                 | Webhook verification       |
| `VERCEL_TOKEN`              | Vercel deployment token               | Vercel Dashboard → Settings → Tokens                         | Deployment workflows       |
| `VERCEL_ORG_ID`             | Vercel organization ID                | Vercel Dashboard → Settings → General                        | Deployment workflows       |
| `VERCEL_PROJECT_ID`         | Vercel project ID                     | Vercel Dashboard → Project Settings → General                | Deployment workflows       |

### 🟡 Important Secrets (Recommended)

| Secret Name                | Description                     | Where to Get                                         | Used By               |
| -------------------------- | ------------------------------- | ---------------------------------------------------- | --------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST API URL      | Upstash Dashboard → Your Database → REST API         | Redis caching         |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token    | Upstash Dashboard → Your Database → REST API         | Redis caching         |
| `REDIS_URL`                | Redis connection URL (fallback) | Upstash Dashboard → Your Database → Redis URL        | Redis caching         |
| `SENTRY_DSN`               | Sentry DSN for error tracking   | Sentry Dashboard → Settings → Projects → Client Keys | Error tracking        |
| `SNYK_TOKEN`               | Snyk security scanning token    | Snyk Dashboard → Settings → API Token                | Security scanning     |
| `OPENAI_API_KEY`           | OpenAI API key                  | OpenAI Dashboard → API Keys                          | AI features (if used) |
| `PRODUCTION_URL`           | Production API URL              | Your production domain                               | Health checks         |
| `E2E_API_KEY`              | API key for E2E tests           | Generate test API key                                | E2E testing           |
| `E2E_BASE_URL`             | Base URL for E2E tests          | Test environment URL                                 | E2E testing           |

### 🟢 Optional Secrets

| Secret Name                         | Description                        | Where to Get                 | Used By                     |
| ----------------------------------- | ---------------------------------- | ---------------------------- | --------------------------- |
| `SUPABASE_PROJECT_REF_PREVIEW`      | Preview environment project ref    | Supabase Dashboard           | Preview deployments         |
| `SUPABASE_URL_PREVIEW`              | Preview environment URL            | Supabase Dashboard           | Preview deployments         |
| `SUPABASE_ANON_KEY_PREVIEW`         | Preview environment anon key       | Supabase Dashboard           | Preview deployments         |
| `SUPABASE_SERVICE_ROLE_KEY_PREVIEW` | Preview environment service key    | Supabase Dashboard           | Preview deployments         |
| `DATABASE_URL_PREVIEW`              | Preview database URL               | Supabase Dashboard           | Preview deployments         |
| `DIRECT_URL_PREVIEW`                | Preview direct DB URL              | Supabase Dashboard           | Preview deployments         |
| `SUPABASE_DB_PASSWORD_STAGING`      | Staging database password          | Supabase Dashboard           | Staging migrations          |
| `SUPABASE_DB_PASSWORD_PRODUCTION`   | Production database password       | Supabase Dashboard           | Production migrations       |
| `PUBLIC_MIRROR_REPO_URL`            | Public mirror repository URL       | GitHub repository URL        | OSS mirror sync             |
| `PUBLIC_MIRROR_GIT_USERNAME`        | Git username for mirror            | GitHub username              | OSS mirror sync             |
| `PUBLIC_MIRROR_GIT_TOKEN`           | Git token for mirror               | GitHub Personal Access Token | OSS mirror sync             |
| `IP_RPM`                            | Rate limit per IP (requests/min)   | Set custom value             | Edge function rate limiting |
| `USER_RPM`                          | Rate limit per user (requests/min) | Set custom value             | Edge function rate limiting |
| `CACHE_MAX_AGE`                     | Auth cache TTL in seconds          | Set custom value             | Edge function caching       |

---

## 🚀 Vercel Environment Variables

Vercel environment variables are used at build-time and runtime. Set these in: **Vercel Dashboard → Project → Settings → Environment Variables**

### 🔴 Critical Variables (Required)

| Variable Name                   | Type      | Environments                     | Description                     | Source                    |
| ------------------------------- | --------- | -------------------------------- | ------------------------------- | ------------------------- |
| `SUPABASE_URL`                  | Encrypted | Production, Preview, Development | Supabase project URL            | GitHub secret             |
| `SUPABASE_ANON_KEY`             | Encrypted | Production, Preview, Development | Supabase anonymous key          | GitHub secret             |
| `SUPABASE_SERVICE_ROLE_KEY`     | Encrypted | Production, Preview, Development | Supabase service role key       | GitHub secret             |
| `DATABASE_URL`                  | Encrypted | Production, Preview, Development | PostgreSQL connection string    | GitHub secret             |
| `DIRECT_URL`                    | Encrypted | Production, Preview              | Direct DB connection            | GitHub secret             |
| `JWT_SECRET`                    | Encrypted | Production, Preview              | JWT signing secret              | GitHub secret             |
| `ENCRYPTION_KEY`                | Encrypted | Production, Preview              | Encryption key                  | GitHub secret             |
| `RESEND_API_KEY`                | Encrypted | Production, Preview              | Resend API key                  | GitHub secret             |
| `RESEND_FROM_EMAIL`             | Plain     | Production, Preview              | Default sender email            | Set manually              |
| `STRIPE_SECRET_KEY`             | Encrypted | Production, Preview              | Stripe secret key               | GitHub secret             |
| `STRIPE_WEBHOOK_SECRET`         | Encrypted | Production, Preview              | Stripe webhook secret           | GitHub secret             |
| `NEXT_PUBLIC_SUPABASE_URL`      | Plain     | Production, Preview, Development | Supabase URL (client-side)      | Same as SUPABASE_URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain     | Production, Preview, Development | Supabase anon key (client-side) | Same as SUPABASE_ANON_KEY |

### 🟡 Important Variables (Recommended)

| Variable Name              | Type      | Environments        | Description              | Source             |
| -------------------------- | --------- | ------------------- | ------------------------ | ------------------ |
| `UPSTASH_REDIS_REST_URL`   | Encrypted | Production, Preview | Upstash Redis REST URL   | GitHub secret      |
| `UPSTASH_REDIS_REST_TOKEN` | Encrypted | Production, Preview | Upstash Redis REST token | GitHub secret      |
| `REDIS_URL`                | Encrypted | Production, Preview | Redis connection URL     | GitHub secret      |
| `SENTRY_DSN`               | Encrypted | Production, Preview | Sentry DSN               | GitHub secret      |
| `NEXT_PUBLIC_SENTRY_DSN`   | Plain     | Production, Preview | Sentry DSN (client-side) | Same as SENTRY_DSN |
| `NEXT_PUBLIC_SITE_URL`     | Plain     | Production, Preview | Public site URL          | Set manually       |
| `NEXT_PUBLIC_APP_URL`      | Plain     | Production, Preview | Public app URL           | Set manually       |
| `NODE_ENV`                 | Plain     | Production, Preview | Node environment         | Auto-set by Vercel |
| `TRUST_PROXY`              | Plain     | Production, Preview | Trust proxy headers      | Set to `true`      |
| `SECURE_COOKIES`           | Plain     | Production, Preview | Enable secure cookies    | Set to `true`      |

### 🟢 Optional Variables

| Variable Name                    | Type  | Environments        | Description         | Source          |
| -------------------------------- | ----- | ------------------- | ------------------- | --------------- |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Plain | Production          | Google Analytics ID | Set manually    |
| `NEXT_PUBLIC_POSTHOG_KEY`        | Plain | Production          | PostHog API key     | Set manually    |
| `SENTRY_ENVIRONMENT`             | Plain | Production, Preview | Sentry environment  | Set manually    |
| `SENTRY_TRACES_SAMPLE_RATE`      | Plain | Production, Preview | Sentry sample rate  | Set to `0.1`    |
| `LOG_LEVEL`                      | Plain | Production, Preview | Logging level       | Set to `info`   |
| `RATE_LIMIT_DEFAULT`             | Plain | Production, Preview | Default rate limit  | Set to `1000`   |
| `RATE_LIMIT_WINDOW_MS`           | Plain | Production, Preview | Rate limit window   | Set to `900000` |

### ⚠️ Important Notes for Vercel

1. **NEXT*PUBLIC* Variables**: These are exposed to the browser. Only use for non-sensitive configuration.
2. **Encrypted Variables**: Use "Encrypted" type for secrets. Vercel encrypts these at rest.
3. **Environment Scoping**: Set variables for Production, Preview, and/or Development as needed.
4. **Build vs Runtime**: Some variables are needed at build-time (NEXT*PUBLIC*\*), others at runtime.

---

## 🗄️ Supabase Secrets (Edge Functions)

Supabase secrets are used by edge functions. Set these via CLI or Dashboard: **Supabase Dashboard → Project → Edge Functions → Secrets**

### 🔴 Critical Secrets (Required)

| Secret Name                | Description                        | Where to Get      | Used By                  |
| -------------------------- | ---------------------------------- | ----------------- | ------------------------ |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST API URL         | Upstash Dashboard | Edge functions           |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token       | Upstash Dashboard | Edge functions           |
| `IP_RPM`                   | Rate limit per IP (requests/min)   | Set custom value  | auth_edge_guard function |
| `USER_RPM`                 | Rate limit per user (requests/min) | Set custom value  | auth_edge_guard function |
| `CACHE_MAX_AGE`            | Auth cache TTL in seconds          | Set custom value  | auth_edge_guard function |

### 🟡 Important Secrets (Recommended)

| Secret Name             | Description              | Where to Get      | Used By                      |
| ----------------------- | ------------------------ | ----------------- | ---------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe secret key        | Stripe Dashboard  | Stripe integration functions |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret    | Stripe Dashboard  | Stripe webhook functions     |
| `OPENAI_API_KEY`        | OpenAI API key           | OpenAI Dashboard  | AI-powered functions         |
| `RESEND_API_KEY`        | Resend API key           | Resend Dashboard  | Email functions              |
| `FRONTEND_URL`          | Frontend application URL | Your frontend URL | Email functions              |

### Setting Supabase Secrets

**Via CLI:**

```bash
supabase secrets set UPSTASH_REDIS_REST_URL="your-url" --project-ref your-project-ref
supabase secrets set UPSTASH_REDIS_REST_TOKEN="your-token" --project-ref your-project-ref
```

**Via Dashboard:**

1. Go to Supabase Dashboard → Your Project → Edge Functions
2. Click on a function → Settings → Secrets
3. Add secrets as needed

---

## 📝 Environment Variable Categories

### Core Configuration

- `NODE_ENV` - Environment mode (development/production)
- `DEPLOYMENT_ENV` - Deployment identifier
- `PORT` - Server port
- `HOST` - Server host

### Database (Supabase/PostgreSQL)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection

### Redis (Upstash)

- `UPSTASH_REDIS_REST_URL` - Upstash REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash REST API token
- `REDIS_URL` - Redis connection URL (fallback)

### Security & Authentication

- `JWT_SECRET` - JWT signing secret (32+ chars)
- `JWT_REFRESH_SECRET` - JWT refresh secret (optional)
- `ENCRYPTION_KEY` - AES-256-GCM key (32 chars)
- `ALLOWED_ORIGINS` - CORS allowed origins

### Email (Resend)

- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Default sender email
- `RESEND_FROM_NAME` - Default sender name

### Payment (Stripe)

- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Observability (Sentry)

- `SENTRY_DSN` - Sentry DSN
- `SENTRY_ENVIRONMENT` - Sentry environment
- `SENTRY_TRACES_SAMPLE_RATE` - Sentry sample rate

### Client-Side (NEXT*PUBLIC*\*)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL (exposed to browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (exposed to browser)
- `NEXT_PUBLIC_SITE_URL` - Public site URL
- `NEXT_PUBLIC_APP_URL` - Public app URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (client-side)
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - Google Analytics ID
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key

---

## 🔐 Secret Generation Commands

### Generate JWT Secret

```bash
openssl rand -base64 32
```

### Generate Encryption Key (32 chars)

```bash
openssl rand -hex 16
```

### Generate Random Password

```bash
openssl rand -base64 24
```

---

## ✅ Setup Checklist

### GitHub Secrets

- [ ] Set all critical secrets in GitHub repository settings
- [ ] Verify secrets are accessible in workflows
- [ ] Test CI/CD pipeline with secrets

### Vercel Environment Variables

- [ ] Set all critical variables in Vercel dashboard
- [ ] Configure NEXT*PUBLIC* variables for client-side access
- [ ] Set environment scoping (Production/Preview/Development)
- [ ] Verify build succeeds with all variables

### Supabase Secrets

- [ ] Set edge function secrets via CLI or dashboard
- [ ] Verify edge functions can access secrets
- [ ] Test edge function deployments

### Local Development (.env)

- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required values
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test local development server

---

## 🚨 Security Best Practices

1. **Never commit secrets** - `.env` files are gitignored
2. **Rotate secrets regularly** - Update secrets every 90 days
3. **Use different secrets per environment** - Separate dev/staging/prod
4. **Limit secret access** - Only grant access to necessary services
5. **Monitor secret usage** - Review access logs regularly
6. **Use encrypted storage** - All secrets should be encrypted at rest
7. **Never log secrets** - Avoid logging secret values
8. **Use secret management tools** - Consider tools like HashiCorp Vault for production

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Environment Variable Schema](./config/env.schema.ts)

---

## 🔄 Sync Workflow

1. **GitHub** → Source of truth for CI/CD secrets
2. **Vercel** → Sync from GitHub secrets (manual or via script)
3. **Supabase** → Set separately for edge functions
4. **Local** → Copy from `.env.example` and fill values

---

**Last Updated**: Generated automatically from codebase analysis
**Maintained By**: Development Team
