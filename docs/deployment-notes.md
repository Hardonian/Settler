# Vercel Deployment Notes

**Last Updated:** 2026-01-XX  
**Project:** Settler Web Application

---

## Environment Variables

### Required Variables

The following environment variables should be configured in Vercel:

#### Public Variables (NEXT_PUBLIC_*)

- `NEXT_PUBLIC_SETTLER_API_KEY` - API key for Settler SDK (used in mobile page demo)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (if using Supabase)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (if using Supabase)

#### Server Variables

- `SETTLER_API_KEY` - Server-side API key (if needed)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

### Configuration

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable for:
   - Production
   - Preview
   - Development (optional)

---

## Build Configuration

### Build Command
```bash
cd ../.. && npx turbo run build --filter=@settler/web...
```

### Install Command
```bash
npm install --frozen-lockfile
```

### Output Directory
Next.js default (`.next`)

### Framework Preset
Next.js (auto-detected)

---

## Routing & Rewrites

### Static Routes
All routes are handled by Next.js App Router:
- `/` - Home page
- `/docs` - Documentation
- `/pricing` - Pricing page
- `/enterprise` - Enterprise page
- `/community` - Community hub
- `/support` - Support center
- `/playground` - Interactive playground
- `/dashboard` - Public dashboard
- `/legal/*` - Legal pages

### API Routes
- `/api/analytics` - Analytics endpoint
- `/api/status/health` - Health check

### Rewrites
Configured in `vercel.json`:
- `/sw.js` → `/sw.js` (Service Worker)
- `/manifest.json` → `/manifest.json` (PWA Manifest)

---

## Security Headers

Security headers are configured in both `next.config.js` and `vercel.json`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## Performance

### Build Settings
- Node.js version: Check `.nvmrc` or use latest LTS
- Build memory: 8GB (`NODE_OPTIONS=--max-old-space-size=8192`)

### Optimizations
- Next.js Image Optimization enabled
- SWC minification enabled
- React Strict Mode enabled
- Automatic code splitting

---

## Monitoring

### Analytics
- Vercel Analytics: Enabled (`@vercel/analytics/react`)
- Speed Insights: Enabled (`@vercel/speed-insights/next`)

### Health Checks
- `/api/status/health` - Health check endpoint
- Monitor via Vercel Dashboard or external monitoring service

---

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Build command verified locally
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] All routes tested in preview deployment
- [ ] Responsive design verified on mobile/tablet/desktop
- [ ] Dark mode tested
- [ ] External links verified
- [ ] Analytics configured
- [ ] Error tracking set up (if applicable)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified

---

## Troubleshooting

### Build Failures

1. **Dependencies not found**
   - Ensure `package-lock.json` is committed
   - Check `installCommand` in `vercel.json`

2. **Type errors**
   - Run `npm run typecheck` locally
   - Fix any TypeScript errors
   - Check `tsconfig.json` configuration

3. **Memory issues**
   - Increase `NODE_OPTIONS` in build env
   - Check build logs for memory errors

### Runtime Issues

1. **Environment variables not available**
   - Verify variables are set in Vercel dashboard
   - Check variable names match code exactly
   - Ensure variables are set for correct environment

2. **API routes not working**
   - Check route handlers are properly exported
   - Verify API routes are in `app/api/` directory
   - Check Vercel function logs

3. **Static assets not loading**
   - Verify files are in `public/` directory
   - Check file paths are correct
   - Ensure files are committed to git

---

## Post-Deployment Verification

1. **Homepage**
   - [ ] Loads correctly
   - [ ] Navigation works
   - [ ] All links functional
   - [ ] Images load
   - [ ] Dark mode works

2. **All Routes**
   - [ ] Each route loads without errors
   - [ ] Navigation between pages works
   - [ ] No console errors
   - [ ] Responsive on mobile

3. **Performance**
   - [ ] Page load times acceptable
   - [ ] Core Web Vitals in good range
   - [ ] No layout shifts

4. **SEO**
   - [ ] Meta tags present
   - [ ] Open Graph tags work
   - [ ] Sitemap accessible
   - [ ] Robots.txt configured

---

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review build output
3. Test locally with `npm run build && npm run start`
4. Check Vercel documentation: https://vercel.com/docs

---

**Last Updated:** 2026-01-XX
