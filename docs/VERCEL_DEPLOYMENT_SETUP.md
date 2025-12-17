# Vercel Deployment Setup Guide

## Adding DATABASE_URL to Vercel

### Step 1: Add Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Settler** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:[YOUR_PASSWORD]@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**

### Step 2: Clear Build Cache and Redeploy

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) menu on the latest deployment
3. Select **Redeploy**
4. Check **"Use existing Build Cache"** → **Uncheck it** (to clear cache)
5. Click **Redeploy**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Clear build cache and redeploy
vercel --prod --force
```

#### Option C: Force Redeploy via Git Push

```bash
# Make a small change to trigger redeploy
git commit --allow-empty -m "chore: redeploy with new build cache and DATABASE_URL"
git push
```

### Step 3: Verify Environment Variables

After deployment, verify the environment variable is set:

1. Go to **Deployments** → Latest deployment
2. Click on the deployment
3. Go to **Build Logs**
4. Check that `DATABASE_URL` is available (it won't show the value for security)

Or use Vercel CLI:
```bash
vercel env ls
```

## Build Cache Clearing

### Why Clear Build Cache?

- Ensures Prisma client is regenerated with correct DATABASE_URL
- Clears any cached build artifacts
- Ensures fresh build with new environment variables

### When to Clear Cache

- After adding new environment variables
- After Prisma schema changes
- After dependency updates
- When experiencing build issues

## Post-Deployment Verification

### 1. Check Health Endpoint

```bash
curl https://your-domain.com/api/health/console
```

**Expected:** Status 200 with health details

### 2. Test Console Routes

```bash
# Should return 200 with error code (not 500)
curl https://your-domain.com/api/console/api-keys
```

### 3. Check Build Logs

In Vercel Dashboard → Deployments → Latest → Build Logs:
- ✅ Prisma client generated successfully
- ✅ No DATABASE_URL errors
- ✅ Build completed successfully

### 4. Verify Migrations

After deployment, migrations should run automatically if configured, or run manually:

```bash
# Via Vercel CLI (if you have access)
vercel env pull .env.production
npm run db:migrate:pending
```

## Environment Variables Checklist

Ensure these are set in Vercel:

- ✅ `DATABASE_URL` - Database connection string
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - Optional (for admin operations)

## Troubleshooting

### Issue: Build Fails with "DATABASE_URL not found"

**Solution:**
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Ensure it's set for the correct environment (Production/Preview)
3. Clear build cache and redeploy

### Issue: Prisma Client Generation Fails

**Solution:**
1. Clear build cache
2. Ensure `DATABASE_URL` is set before build
3. Check build logs for specific error

### Issue: Database Connection Errors

**Solution:**
1. Verify `DATABASE_URL` format is correct
2. Check Supabase IP allowlist (Settings → Database → Connection pooling)
3. Verify database is accessible

## Security Best Practices

1. ✅ **Never commit** `.env` files to git
2. ✅ **Use Vercel environment variables** for production
3. ✅ **Use different passwords** for dev/staging/production
4. ✅ **Rotate passwords** periodically
5. ✅ **Restrict IP access** in Supabase dashboard

## Quick Reference

```bash
# Add environment variable (via CLI)
vercel env add DATABASE_URL production

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.production

# Redeploy with cleared cache
vercel --prod --force
```

## Next Steps After Deployment

1. ✅ **Verify health endpoint** - `/api/health/console`
2. ✅ **Test console routes** - `/api/console/api-keys`
3. ✅ **Check build logs** - Ensure no errors
4. ✅ **Monitor error rates** - Should be < 1%
5. ✅ **Run migrations** - If not automatic

---

**Note:** The actual `DATABASE_URL` value should be added manually in Vercel dashboard for security. Never commit passwords to git.
