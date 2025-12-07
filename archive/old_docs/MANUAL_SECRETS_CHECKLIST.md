# Manual Secrets & Environment Variables Checklist

**Purpose:** Step-by-step checklist for configuring all required secrets and environment variables across platforms.

**Priority Order:**

1. 🔴 **CRITICAL** - Required for application to boot
2. ⚠️ **HIGH** - Required for core features
3. ℹ️ **RECOMMENDED** - Optional but recommended for production
4. 📝 **OPTIONAL** - Nice to have

---

## Pre-Flight: Generate Security Secrets

Before configuring platforms, generate secure random secrets:

```bash
# Generate JWT_SECRET (min 32 characters)
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (min 32 characters)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (exactly 32 characters)
openssl rand -base64 24 | head -c 32
```

**Store these securely** (password manager, secret manager) - you'll need them for Vercel configuration.

---

## 1. GitHub Repository Secrets 🔴 CRITICAL

**Location:** GitHub → Your Repository → Settings → Secrets and variables → Actions → New repository secret

### Required Secrets

| Secret Name         | Value Source                                    | Priority    | Notes                         |
| ------------------- | ----------------------------------------------- | ----------- | ----------------------------- |
| `VERCEL_TOKEN`      | Vercel Dashboard → Settings → Tokens            | 🔴 CRITICAL | Create token if doesn't exist |
| `VERCEL_ORG_ID`     | Vercel Dashboard → Project → Settings → General | 🔴 CRITICAL | Found in project settings     |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Project → Settings → General | 🔴 CRITICAL | Found in project settings     |

### Optional Secrets

| Secret Name  | Value Source                          | Priority    | Notes                 |
| ------------ | ------------------------------------- | ----------- | --------------------- |
| `SNYK_TOKEN` | Snyk Dashboard → Settings → API Token | ℹ️ OPTIONAL | For security scanning |

**Steps:**

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret listed above
4. Verify secrets are set (they will show as `***`)

**Verification:**

- Check that `deploy-preview.yml` workflow can access `secrets.VERCEL_TOKEN`
- Run a test deployment to verify

---

## 2. Vercel Environment Variables 🔴 CRITICAL

**Location:** Vercel Dashboard → Your Project → Settings → Environment Variables

### Production Environment

**Core Configuration:**

- [ ] `NODE_ENV` = `production`
- [ ] `DEPLOYMENT_ENV` = `production`

**Database (Supabase):**

- [ ] `SUPABASE_URL` = `https://your-project.supabase.co` (from Supabase dashboard)
- [ ] `SUPABASE_ANON_KEY` = `eyJ...` (from Supabase dashboard - anon/public key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (from Supabase dashboard - service_role key) ⚠️ **SERVER-ONLY**
- [ ] `SUPABASE_REALTIME_EVENTS_PER_SECOND` = `10` (optional, has default)

**Redis (Upstash):**

- [ ] `UPSTASH_REDIS_REST_URL` = `https://your-redis.upstash.io` (from Upstash dashboard)
- [ ] `UPSTASH_REDIS_REST_TOKEN` = `Bearer token` (from Upstash dashboard)

**Security:**

- [ ] `JWT_SECRET` = `[generated secret, min 32 chars]`
- [ ] `JWT_REFRESH_SECRET` = `[generated secret, min 32 chars]` (optional, falls back to JWT_SECRET)
- [ ] `ENCRYPTION_KEY` = `[generated secret, exactly 32 chars]`
- [ ] `ALLOWED_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com` ⚠️ **RESTRICT FROM `*`**
- [ ] `TRUST_PROXY` = `true` ⚠️ **REQUIRED FOR VERCEL**
- [ ] `SECURE_COOKIES` = `true` ⚠️ **REQUIRED FOR PRODUCTION**

**Observability (Sentry):**

- [ ] `SENTRY_DSN` = `https://key@sentry.io/project-id` (from Sentry dashboard) ℹ️ RECOMMENDED
- [ ] `SENTRY_ENVIRONMENT` = `production`
- [ ] `SENTRY_TRACES_SAMPLE_RATE` = `0.1` (optional, has default)

**Service Configuration:**

- [ ] `SERVICE_NAME` = `settler-api` (optional, has default)
- [ ] `LOG_LEVEL` = `info` (optional, has default)
- [ ] `METRICS_ENABLED` = `true` (optional, has default)
- [ ] `HEALTH_CHECK_ENABLED` = `true` (optional, has default)

**Steps:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. For each variable:
   - Click "Add New"
   - Enter variable name
   - Enter value
   - **Select "Production" environment** (and Preview/Development if needed)
   - Click "Save"
3. **Critical:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is **NOT** exposed to client (server-only)
4. **Critical:** Set `TRUST_PROXY=true` and `SECURE_COOKIES=true` in production
5. **Security:** Restrict `ALLOWED_ORIGINS` to your actual domains (not `*`)

### Preview Environment

Same as Production, but:

- [ ] `SENTRY_ENVIRONMENT` = `preview`
- May use different Supabase/Redis instances for testing

### Development Environment

Same as Preview, but:

- [ ] `NODE_ENV` = `development`
- [ ] `SENTRY_ENVIRONMENT` = `development`

**Verification:**

- Deploy a preview and check logs for missing env vars
- Test API endpoints to ensure database/Redis connections work

---

## 3. Supabase Configuration 🔴 CRITICAL

**Location:** https://supabase.com → Your Project → Project Settings → API

### Required Configuration

- [ ] **Project URL** → Copy to `SUPABASE_URL` in Vercel
- [ ] **anon/public key** → Copy to `SUPABASE_ANON_KEY` in Vercel
- [ ] **service_role key** → Copy to `SUPABASE_SERVICE_ROLE_KEY` in Vercel ⚠️ **KEEP SECRET**

### Additional Setup

- [ ] Enable Row Level Security (RLS) on tables
- [ ] Configure database migrations (if using)
- [ ] Set up Edge Functions secrets (if using Edge Functions):
  ```bash
  supabase secrets set KEY_NAME=value
  ```

**Steps:**

1. Create Supabase project at https://supabase.com (if not exists)
2. Go to Project Settings → API
3. Copy values to Vercel environment variables (see Section 2)
4. **Important:** Never expose `service_role` key to client - it bypasses RLS

**Verification:**

- Test database connection from API
- Verify RLS policies are working
- Check Supabase logs for connection issues

---

## 4. Upstash Redis Configuration 🔴 CRITICAL

**Location:** https://upstash.com → Your Redis Database → REST API

### Required Configuration

- [ ] **REST URL** → Copy to `UPSTASH_REDIS_REST_URL` in Vercel
- [ ] **Token** → Copy to `UPSTASH_REDIS_REST_TOKEN` in Vercel

**Steps:**

1. Create Upstash Redis database at https://upstash.com (if not exists)
2. Go to Redis → REST API tab
3. Copy REST URL and Token
4. Add to Vercel environment variables (see Section 2)

**Verification:**

- Test Redis connection from API
- Check Upstash dashboard for connection metrics

---

## 5. Sentry Configuration ℹ️ RECOMMENDED

**Location:** https://sentry.io → Your Project → Settings → Client Keys (DSN)

### Required Configuration

- [ ] **DSN** → Copy to `SENTRY_DSN` in Vercel
- [ ] Set `SENTRY_ENVIRONMENT` per environment (production, preview, development)

**Steps:**

1. Create Sentry project at https://sentry.io (if not exists)
2. Go to Project Settings → Client Keys (DSN)
3. Copy DSN
4. Add `SENTRY_DSN` to Vercel (all environments)
5. Set `SENTRY_ENVIRONMENT` per environment

**Verification:**

- Trigger a test error and check Sentry dashboard
- Verify errors are being captured

---

## 6. Local Development Setup 📝

For local development, create `.env` file (copy from `.env.example`):

**Required for Local:**

- [ ] `NODE_ENV` = `development`
- [ ] `SUPABASE_URL` (or use `DB_HOST`, `DB_PORT`, etc. for local PostgreSQL)
- [ ] `SUPABASE_ANON_KEY`
- [ ] `UPSTASH_REDIS_REST_URL` (or use `REDIS_HOST=localhost` for local Redis)
- [ ] `JWT_SECRET` (can use dev value for local)
- [ ] `ENCRYPTION_KEY` (can use dev value for local)

**Steps:**

1. Copy `.env.example` to `.env`
2. Fill in values (can use test/dev values for local)
3. Ensure `.env` is in `.gitignore` (already configured)
4. Run `npm run dev` to test

---

## Verification Checklist

After configuring all secrets, verify:

### Application Boot

- [ ] API starts without errors
- [ ] No "missing required environment variable" errors in logs
- [ ] Health check endpoint responds (`/health`)

### Database Connection

- [ ] Supabase connection successful
- [ ] Database queries work
- [ ] RLS policies are active

### Redis Connection

- [ ] Upstash Redis connection successful
- [ ] Cache operations work
- [ ] Queue operations work (if using)

### Authentication

- [ ] JWT token generation works
- [ ] API key authentication works
- [ ] Encryption/decryption works

### Observability

- [ ] Sentry errors are captured (if configured)
- [ ] Logs are being generated
- [ ] Metrics endpoint works (`/metrics`)

### Security

- [ ] CORS is restricted (not `*` in production)
- [ ] Cookies are secure (`SECURE_COOKIES=true`)
- [ ] Proxy headers are trusted (`TRUST_PROXY=true`)
- [ ] Service role keys are NOT exposed to client

---

## Troubleshooting

### "Missing required environment variable" Error

1. Check Vercel environment variables are set for correct environment
2. Verify variable names match exactly (case-sensitive)
3. Check that required variables are not empty
4. Run validation script: `tsx scripts/check-env.ts --env=production`

### Database Connection Fails

1. Verify `SUPABASE_URL` is correct (HTTPS URL)
2. Check `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Verify Supabase project is active
4. Check network/firewall rules

### Redis Connection Fails

1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
2. Check Upstash database is active
3. Verify REST API is enabled in Upstash dashboard

### Authentication Fails

1. Verify `JWT_SECRET` is at least 32 characters
2. Check `ENCRYPTION_KEY` is exactly 32 characters
3. Verify secrets are not using placeholder values

### CORS Errors

1. Check `ALLOWED_ORIGINS` includes your frontend domain
2. Verify format is correct (comma-separated, no spaces)
3. Ensure `TRUST_PROXY=true` if behind reverse proxy

---

## Security Best Practices

✅ **DO:**

- Use strong, randomly generated secrets
- Store secrets in platform secret managers (Vercel, GitHub)
- Rotate secrets periodically
- Use different secrets per environment
- Restrict CORS to specific domains
- Never commit secrets to version control
- Use server-only scope for sensitive keys (service role keys)

❌ **DON'T:**

- Use placeholder values in production (`your-key-here`, `change-in-production`)
- Expose service role keys to client
- Use `ALLOWED_ORIGINS=*` in production
- Commit `.env` files to git
- Share secrets via email/chat
- Use same secrets across environments

---

## Next Steps

After completing this checklist:

1. ✅ Run validation script: `tsx scripts/check-env.ts --env=production`
2. ✅ Deploy to preview environment and test
3. ✅ Monitor logs for any missing/invalid env vars
4. ✅ Set up alerts for secret expiration (if applicable)
5. ✅ Document any environment-specific configurations

---

**Last Updated:** $(date)  
**Review Frequency:** Quarterly or when adding new services
