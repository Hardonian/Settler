# Production Deployment Runbook

**Last Updated:** January 2024  
**Status:** Active

## Pre-Deployment Checklist

### Environment Variables

Verify all required environment variables are set in Vercel:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SITE_URL` - Site URL (e.g., https://settler.dev)

**Optional but Recommended:**
- `STRIPE_SECRET_KEY` - Stripe secret key (for billing)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SENTRY_DSN` - Sentry error tracking
- `RESEND_API_KEY` - Email service API key
- `NEXT_PUBLIC_ANALYTICS_PROVIDERS` - Analytics providers (default: "vercel")

### Database Migrations

1. **Verify migrations are up to date:**
   ```bash
   npm run verify:schema
   ```

2. **Apply migrations if needed:**
   ```bash
   npm run db:migrate:prod
   ```

3. **Verify critical tables exist:**
   - `billing_accounts`
   - `api_keys`
   - `tenants`
   - `usage_events`

### Build Verification

1. **Run type check:**
   ```bash
   npm run typecheck
   ```

2. **Run linting:**
   ```bash
   npm run lint
   ```

3. **Run build:**
   ```bash
   npm run build
   ```

4. **Run smoke tests:**
   ```bash
   npm run test:smoke:console
   ```

## Deployment Steps

### 1. Vercel Deployment

1. Push changes to main branch (or create PR)
2. Vercel will automatically build and deploy
3. Monitor build logs for errors

### 2. Post-Deployment Verification

#### Health Checks

1. **Global health endpoint:**
   ```bash
   curl https://settler.dev/api/health
   ```
   Expected: `{"status":"healthy",...}`

2. **Console health endpoint:**
   ```bash
   curl https://settler.dev/api/health/console
   ```
   Expected: `{"status":"healthy","checks":{...}}`

#### Functional Tests

1. **Homepage loads:**
   - Visit https://settler.dev
   - Verify navigation menu visible
   - Verify no console errors

2. **Console navigation:**
   - Click "Console" in navigation
   - Verify page loads (may show public overview if not authenticated)
   - Verify no 500 errors

3. **Legal pages:**
   - Visit https://settler.dev/legal/terms
   - Visit https://settler.dev/legal/privacy
   - Visit https://settler.dev/legal/cookies
   - Visit https://settler.dev/legal/aup
   - Verify all pages load correctly

4. **Cookie consent:**
   - Visit homepage
   - Verify cookie banner appears
   - Test consent preferences
   - Verify preferences persist

5. **Signup flow:**
   - Visit https://settler.dev/signup
   - Verify Terms acceptance checkbox is present
   - Test signup (if test account available)

## Monitoring

### Error Monitoring

1. **Check Sentry** (if configured):
   - Review error dashboard
   - Check for new errors
   - Verify error rates are normal

2. **Check Vercel logs:**
   - Review function logs
   - Check for 500 errors
   - Monitor response times

3. **Run error monitoring script:**
   ```bash
   tsx scripts/monitor-api-errors.ts
   ```

### Performance Monitoring

1. **Vercel Analytics:**
   - Check Core Web Vitals
   - Review page load times
   - Monitor API response times

2. **Database Performance:**
   - Check query performance
   - Monitor connection pool usage
   - Review slow query logs

### Health Monitoring

1. **Automated health checks:**
   - Set up cron job to check `/api/health` endpoint
   - Alert if status is not "healthy"

2. **Uptime monitoring:**
   - Use external service (e.g., UptimeRobot)
   - Monitor critical endpoints

## Rollback Procedure

If deployment fails or issues are detected:

1. **Immediate rollback:**
   - Go to Vercel dashboard
   - Select previous deployment
   - Click "Promote to Production"

2. **Investigate issues:**
   - Check error logs
   - Review recent changes
   - Run diagnostic scripts

3. **Fix and redeploy:**
   - Fix issues in development
   - Test locally
   - Redeploy

## Troubleshooting

### Console Returns 500

1. Check health endpoint: `/api/health/console`
2. Verify Supabase connection
3. Check database migrations
4. Review error logs

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database is accessible
3. Verify connection pool limits
4. Check for migration issues

### Missing Environment Variables

1. Check Vercel environment variables
2. Verify all required vars are set
3. Check for typos in variable names
4. Restart deployment if vars were added

### Cookie Consent Not Working

1. Check browser console for errors
2. Verify localStorage is available
3. Check consent component is loaded
4. Verify analytics gating is working

## Emergency Contacts

- **Technical Issues:** Check GitHub Issues or Discord
- **Security Issues:** security@settler.dev
- **Legal Issues:** legal@settler.dev

## Post-Deployment Tasks

1. ✅ Verify all health checks pass
2. ✅ Test critical user flows
3. ✅ Monitor error rates for 24 hours
4. ✅ Check analytics are tracking correctly
5. ✅ Verify cookie consent is working
6. ✅ Test signup flow with Terms acceptance

## Notes

- All API routes return 200 even on errors (prevents 500s)
- Console gracefully degrades if dependencies fail
- Legal pages include "not legal advice" disclaimers
- Cookie consent respects Do Not Track / Global Privacy Control
