# Vercel Redeploy Checklist

## Pre-Deployment

- [ ] **DATABASE_URL added to Vercel**
  - Go to Vercel Dashboard → Project → Settings → Environment Variables
  - Add `DATABASE_URL` = `postgresql://postgres:[PASSWORD]@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres`
  - Set for: Production ✅ Preview ✅ Development ✅

- [ ] **Other environment variables verified**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (optional)

- [ ] **Prisma client generated locally** (optional, will regenerate on build)
  - `npm run prisma:generate`

## Deployment Steps

### Option 1: Via Vercel Dashboard (Recommended)

1. [ ] Go to **Deployments** tab
2. [ ] Click **⋯** (three dots) on latest deployment
3. [ ] Select **Redeploy**
4. [ ] **Uncheck** "Use existing Build Cache" (to clear cache)
5. [ ] Click **Redeploy**
6. [ ] Wait for build to complete

### Option 2: Via Vercel CLI

```bash
# Login if needed
vercel login

# Deploy with cleared cache
vercel --prod --force
```

### Option 3: Via Git Push

```bash
# Make empty commit to trigger redeploy
git commit --allow-empty -m "chore: redeploy with DATABASE_URL and cleared cache"
git push
```

## Post-Deployment Verification

- [ ] **Build completed successfully**
  - Check Vercel Dashboard → Deployments → Latest → Build Logs
  - No errors related to DATABASE_URL
  - Prisma client generated successfully

- [ ] **Health check passes**
  ```bash
  curl https://your-domain.com/api/health/console
  ```
  - Status: 200
  - All checks pass

- [ ] **Console routes work**
  ```bash
  curl https://your-domain.com/api/console/api-keys
  ```
  - Returns 200 with error code (not 500)
  - Or returns 401 if unauthenticated (expected)

- [ ] **Console page loads**
  - Navigate to `https://your-domain.com/console`
  - Page loads without 500 errors

- [ ] **Database migrations applied** (if needed)
  - Check if migrations run automatically
  - Or run manually: `npm run db:migrate:pending`

## Monitoring

- [ ] **Error rate < 1%**
  - Check Vercel Analytics or logs
  - Console routes should have minimal errors

- [ ] **Response times acceptable**
  - P95 < 500ms for console routes

- [ ] **No DATABASE_URL errors in logs**
  - Check Vercel function logs
  - No connection errors

## Rollback Plan (if needed)

If deployment fails:

1. [ ] **Revert to previous deployment**
   - Vercel Dashboard → Deployments → Previous deployment → ⋯ → Promote to Production

2. [ ] **Check environment variables**
   - Verify DATABASE_URL format
   - Verify all required vars are set

3. [ ] **Review build logs**
   - Identify specific error
   - Fix and redeploy

## Success Criteria

✅ Build completes without errors  
✅ Health check returns 200  
✅ Console routes return proper status codes (not 500)  
✅ No DATABASE_URL connection errors  
✅ Prisma client generated successfully  

---

**Quick Deploy Command:**
```bash
vercel --prod --force
```

**Or use the script:**
```bash
./scripts/vercel-deploy.sh production
```
