# Settler.dev Live Website QA & Front-End Infrastructure Audit

**Date**: 2025-12-10  
**Production URL**: https://www.settler.dev  
**Framework**: Next.js 14 (App Router)  
**Deployment**: Vercel

## Phase 0: Context Discovery

### Routing Architecture

- **Framework**: Next.js 14 with App Router (`/packages/web/src/app/`)
- **Routing Mode**: App Router (file-based routing)
- **Layout**: Root layout at `src/app/layout.tsx` with tenant-aware theming
- **Navigation**: Client component at `src/components/Navigation.tsx`
- **Footer**: Server component at `src/components/Footer.tsx`

### Key Routes Identified

From Navigation component:

- `/` - Homepage
- `/docs` - Documentation
- `/cookbooks` - Cookbooks
- `/receipts` - Receipts API
- `/feature-flags` - Feature Flags
- `/console` - Console
- `/pricing` - Pricing
- `/enterprise` - Enterprise
- `/community` - Community
- `/support` - Support
- `/playground` - Playground

From Footer:

- `/legal/terms` - Terms of Service
- `/legal/privacy` - Privacy Policy
- `/legal/license` - License

### Environment Variables Pattern

- `NEXT_PUBLIC_SITE_URL` - Defaults to `https://settler.dev`
- `NEXT_PUBLIC_APP_URL` - Defaults to `https://settler.dev`
- `NEXT_PUBLIC_SUPABASE_URL` - Required for Supabase
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Database
- `STRIPE_SECRET_KEY` - Billing
- `RESEND_API_KEY` - Email
- `REDIS_URL` - Caching/queues
- `JWT_SECRET` - Authentication

---

## Phase 1: Live Site Crawl & UX/Content QA

### Navigation & Link Integrity

_[To be filled during browser testing]_

### Page Coverage

_[To be filled during browser testing]_

### Responsiveness & Layout

_[To be filled during browser testing]_

### Content Quality & Clarity

_[To be filled during browser testing]_

### Visual Polish & Professionalism

_[To be filled during browser testing]_

---

## Phase 2: Performance, SEO & Accessibility Snapshot

### Performance

_[To be filled]_

### SEO

_[To be filled]_

### Accessibility

_[To be filled]_

---

## Phase 3: Repo Route & Component Audit

### Route Mapping

_[To be filled]_

### Dead/Unused Code

_[To be filled]_

### Design System & Consistency

_[To be filled]_

---

## Phase 4: Env Vars, Services, and Missing Connections

### Environment Variables Audit

_[To be filled]_

### Third-Party Services

_[To be filled]_

---

## Phase 5: Prioritized Issue List

### Critical Issues

_[To be filled]_

### High Priority Issues

_[To be filled]_

### Medium Priority Issues

_[To be filled]_

### Low Priority Issues

_[To be filled]_

---

## Phase 6: Quick Fixes Applied

_[To be filled]_
