# Deployment Verification Checklist

**Date Created**: 2025-12-10  
**Last Updated**: 2025-12-10

## Pre-Deployment Checklist

### ✅ Code Changes Verified
- [x] `/docs` route fix applied (`app/[slug]/page.tsx`)
- [x] `/console` error handling fix applied (`app/console/layout.tsx`)
- [x] TypeScript compilation passes
- [x] Linting passes
- [x] No breaking changes introduced

### ⚠️ Environment Variables Required

**CRITICAL - Must be set before deployment:**

```bash
# Supabase (Required for database and authentication)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site URLs (Have defaults but should be set)
NEXT_PUBLIC_SITE_URL=https://www.settler.dev
NEXT_PUBLIC_APP_URL=https://www.settler.dev
```

**IMPORTANT - Required for specific features:**

```bash
# Billing (Required for Stripe integration)
STRIPE_SECRET_KEY=sk_live_...

# Email (Required for transactional emails)
RESEND_API_KEY=re_...

# Authentication (Required for JWT)
JWT_SECRET=your-32-character-secret-minimum
```

**OPTIONAL - Nice to have:**

```bash
# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...

# Caching/Queues
REDIS_URL=rediss://...
```

### Verification Steps

1. **Verify Environment Variables**
   ```bash
   tsx scripts/verify-env-vars.ts --mode=production
   ```

2. **Run Type Check**
   ```bash
   cd packages/web && npm run typecheck
   ```

3. **Run Linting**
   ```bash
   cd packages/web && npm run lint
   ```

4. **Build Test**
   ```bash
   cd packages/web && npm run build
   ```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "fix: resolve /docs route conflict and /console error handling"
   git push origin main
   ```

2. **Monitor Vercel Deployment**
   - Check Vercel dashboard for build status
   - Watch for any build errors
   - Verify environment variables are set in Vercel project settings

3. **Wait for Deployment to Complete**
   - Production deployment typically takes 2-5 minutes
   - Preview deployments are faster

## Post-Deployment Verification

### Automated Testing

Run the route testing script:
```bash
chmod +x scripts/test-routes.sh
./scripts/test-routes.sh https://www.settler.dev
```

### Manual Testing Checklist

#### Critical Routes
- [ ] `/` - Homepage loads correctly
- [ ] `/docs` - **FIXED** Documentation page loads (was 404)
- [ ] `/console` - **FIXED** Redirects to signup if not authenticated (was 500)
- [ ] `/pricing` - Pricing page loads
- [ ] `/playground` - Playground loads
- [ ] `/signup` - Signup page loads

#### Navigation Links
- [ ] All navigation menu items work
- [ ] Footer links work
- [ ] Internal links don't 404
- [ ] External links open correctly

#### Authentication Flow
- [ ] `/console` redirects to `/signup` when not authenticated
- [ ] `/console` loads when authenticated
- [ ] Dashboard routes work when authenticated

#### Error Handling
- [ ] 404 pages show proper error page
- [ ] 500 errors are handled gracefully
- [ ] Error boundaries catch React errors

### Performance Checks

- [ ] Page load times are acceptable (< 3s)
- [ ] Images load correctly
- [ ] No console errors in browser
- [ ] Mobile responsiveness works

### SEO & Accessibility

- [ ] Meta tags are present
- [ ] Open Graph tags work
- [ ] Structured data is valid
- [ ] Accessibility features work (skip links, ARIA labels)

## Monitoring

### Error Monitoring

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for any 500 errors
   - Check for Supabase connection errors

2. **Check Browser Console**
   - Open browser DevTools
   - Check for JavaScript errors
   - Verify no failed API calls

3. **Use Error Monitoring Script**
   ```bash
   # If you see an error, analyze it:
   tsx scripts/monitor-errors.ts "your error message here"
   ```

### Key Metrics to Monitor

- **Error Rate**: Should be < 1%
- **Response Times**: Should be < 500ms for API routes
- **Page Load Times**: Should be < 3s
- **Uptime**: Should be > 99.9%

## Rollback Plan

If critical issues are found:

1. **Immediate Rollback**
   ```bash
   # In Vercel Dashboard:
   # Deployments → Previous Deployment → Promote to Production
   ```

2. **Fix Issues**
   - Identify the problem
   - Create a fix
   - Test locally
   - Redeploy

3. **Verify Fix**
   - Run test script again
   - Manual testing
   - Monitor logs

## Success Criteria

✅ **Deployment is successful if:**
- All critical routes return 200 or appropriate status codes
- No 500 errors in logs
- Environment variables are properly configured
- Authentication flow works
- No console errors in browser
- Performance metrics are acceptable

## Next Steps After Successful Deployment

1. ✅ Monitor error logs for 24 hours
2. ✅ Test all user flows
3. ✅ Collect user feedback
4. ✅ Address any issues found
5. ✅ Plan next improvements

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Run `scripts/verify-env-vars.ts` to check configuration
3. Run `scripts/test-routes.sh` to test routes
4. Review `docs/qa-report.md` for known issues

---

**Last Verified**: [Update after deployment]  
**Deployed By**: [Your name]  
**Deployment Status**: [Pending/In Progress/Success/Failed]
