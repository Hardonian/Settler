# Route Inventory

**Generated:** 2026-01-XX  
**Framework:** Next.js 14 (App Router)  
**Base URL:** https://settler.dev

## Overview

This document maps all routes in the Settler web application, their purpose, source files, and where they're linked from in the navigation.

---

## Static Routes

### `/` (Home)
- **Source:** `packages/web/src/app/page.tsx`
- **Purpose:** Main landing page with hero, features, stats, and CTAs
- **Linked from:** 
  - Navigation logo
  - Footer brand link
- **Components:** Navigation, Footer, AnimatedHero, TrustBadges, CustomerLogos, SocialProof, NewsletterSignup, ConversionCTA
- **Status:** ✅ Complete

### `/docs`
- **Source:** `packages/web/src/app/docs/page.tsx`
- **Layout:** `packages/web/src/app/docs/layout.tsx`
- **Purpose:** Developer documentation with interactive sidebar
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Product section)
  - Footer (Resources section - "API Reference")
  - Home page CTAs
- **Components:** Navigation, Footer, AnimatedPageWrapper, AnimatedHero, AnimatedSidebar
- **Status:** ✅ Complete

### `/cookbooks`
- **Source:** `packages/web/src/app/cookbooks/page.tsx`
- **Purpose:** Pre-built reconciliation workflows and code examples
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Product section)
  - Docs page
- **Components:** Navigation, Footer, AnimatedPageWrapper
- **Status:** ✅ Complete

### `/pricing`
- **Source:** `packages/web/src/app/pricing/page.tsx`
- **Purpose:** Pricing plans and feature comparison
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Product section)
  - Home page CTAs
  - Enterprise page CTAs
- **Components:** Navigation, Footer, AnimatedPageWrapper, AnimatedHero, AnimatedPricingCard, TrustBadges, FeatureComparison, AnimatedFAQ
- **Status:** ✅ Complete

### `/enterprise`
- **Source:** `packages/web/src/app/enterprise/page.tsx`
- **Purpose:** Enterprise solutions and contact form
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Product section)
  - Pricing page (Enterprise plan CTA)
  - Support page CTAs
- **Components:** Navigation, Footer, AnimatedPageWrapper, AnimatedHero, AnimatedFeatureCard, TrustBadges, ConversionCTA
- **Status:** ✅ Complete

### `/community`
- **Source:** `packages/web/src/app/community/page.tsx`
- **Purpose:** Community hub with positioning feedback and real-time posts
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Resources section)
  - Support page
- **Components:** Navigation, Footer, PositioningFeedbackForm, RealtimePosts
- **Status:** ✅ Complete (Missing AnimatedPageWrapper wrapper)

### `/support`
- **Source:** `packages/web/src/app/support/page.tsx`
- **Purpose:** Support center with FAQs, support tiers, and escalation info
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Resources section)
  - Pricing page CTAs
- **Components:** Navigation, Footer, AnimatedPageWrapper, AnimatedHero, FAQSchema
- **Status:** ✅ Complete

### `/playground`
- **Source:** `packages/web/src/app/playground/page.tsx`
- **Purpose:** Interactive API playground for testing reconciliation
- **Linked from:** 
  - Navigation (Desktop & Mobile)
  - Footer (Product section)
  - Home page CTAs ("Get Started")
  - Docs page CTAs
  - Cookbooks page CTAs
- **Components:** Navigation, Footer, AnimatedPageWrapper, AnimatedHero, TrustBadges, ConversionCTA
- **Status:** ✅ Complete

---

## Application Routes

### `/dashboard`
- **Source:** `packages/web/src/app/dashboard/page.tsx`
- **Purpose:** Public ecosystem dashboard showing real-time metrics
- **Linked from:** 
  - Signup page (after registration)
- **Components:** None (Missing Navigation/Footer)
- **Status:** ⚠️ Missing Navigation/Footer

### `/mobile`
- **Source:** `packages/web/src/app/mobile/page.tsx`
- **Purpose:** Secure mobile app demonstration
- **Linked from:** None (direct access only)
- **Components:** SecureMobileApp (Missing Navigation/Footer)
- **Status:** ⚠️ Missing Navigation/Footer (may be intentional for mobile app)

### `/react-settler-demo`
- **Source:** `packages/web/src/app/react-settler-demo/page.tsx`
- **Purpose:** Demo of @settler/react-settler component library
- **Linked from:** None (direct access only)
- **Components:** ReconciliationDashboard (Missing Navigation/Footer)
- **Status:** ⚠️ Missing Navigation/Footer

### `/realtime-dashboard`
- **Source:** `packages/web/src/app/realtime-dashboard/page.tsx`
- **Purpose:** Real-time reconciliation execution dashboard
- **Linked from:** None (direct access with jobId/apiKey params)
- **Components:** None (Missing Navigation/Footer)
- **Status:** ⚠️ Missing Navigation/Footer

### `/signup`
- **Source:** `packages/web/src/app/signup/page.tsx`
- **Purpose:** User registration page
- **Linked from:** None (direct access)
- **Components:** Navigation, Footer
- **Status:** ✅ Complete

---

## Legal Routes

### `/legal/privacy`
- **Source:** `packages/web/src/app/legal/privacy/page.tsx`
- **Purpose:** Privacy Policy
- **Linked from:** 
  - Footer (Legal section)
- **Components:** Navigation, Footer, AnimatedPageWrapper
- **Status:** ✅ Complete

### `/legal/terms`
- **Source:** `packages/web/src/app/legal/terms/page.tsx`
- **Purpose:** Terms of Service
- **Linked from:** 
  - Footer (Legal section)
- **Components:** Navigation, Footer, AnimatedPageWrapper
- **Status:** ✅ Complete

### `/legal/license`
- **Source:** `packages/web/src/app/legal/license/page.tsx`
- **Purpose:** MIT License information
- **Linked from:** 
  - Footer (Legal section)
- **Components:** Navigation, Footer, AnimatedPageWrapper
- **Status:** ✅ Complete

---

## API Routes

### `/api/analytics`
- **Source:** `packages/web/src/app/api/analytics/route.ts`
- **Purpose:** Analytics endpoint
- **Status:** ✅ Complete

### `/api/status/health`
- **Source:** `packages/web/src/app/api/status/health/route.ts`
- **Purpose:** Health check endpoint
- **Status:** ✅ Complete

---

## Special Files

### `/robots.ts`
- **Source:** `packages/web/src/app/robots.ts`
- **Purpose:** Robots.txt generation
- **Status:** ✅ Complete

### `/sitemap.ts`
- **Source:** `packages/web/src/app/sitemap.ts`
- **Purpose:** Sitemap.xml generation
- **Status:** ✅ Complete

---

## Navigation Structure

### Desktop Navigation
- Docs
- Cookbooks
- Pricing
- Enterprise
- Community
- Support
- Playground
- Get Started (CTA button → /playground)
- Dark Mode Toggle

### Mobile Navigation
- Same as desktop, collapsed into hamburger menu

### Footer Links

**Product:**
- Documentation → `/docs`
- Cookbooks → `/cookbooks`
- Playground → `/playground`
- Pricing → `/pricing`
- Enterprise → `/enterprise`

**Resources:**
- Support → `/support`
- Community → `/community`
- GitHub → External (https://github.com/shardie-github/Settler-API)
- API Reference → `/docs`
- Status → External (https://status.settler.dev)

**Legal:**
- Terms of Service → `/legal/terms`
- Privacy Policy → `/legal/privacy`
- License → `/legal/license`

**Social:**
- Twitter → External (@settler_io)
- GitHub → External
- Discord → External

---

## Issues Found

1. **Missing Navigation/Footer:**
   - `/dashboard` - Missing Navigation/Footer
   - `/mobile` - Missing Navigation/Footer (may be intentional)
   - `/react-settler-demo` - Missing Navigation/Footer
   - `/realtime-dashboard` - Missing Navigation/Footer

2. **Inconsistent Page Wrappers:**
   - `/community` - Missing AnimatedPageWrapper (has custom wrapper)
   - Some pages use AnimatedPageWrapper, others don't

3. **Missing Links:**
   - `/signup` - Not linked from anywhere (intentional?)
   - `/dashboard` - Only linked from signup page
   - `/mobile`, `/react-settler-demo`, `/realtime-dashboard` - Not in navigation

---

## Recommendations

1. Add Navigation/Footer to dashboard pages for consistency
2. Standardize page wrappers (use AnimatedPageWrapper consistently)
3. Consider adding `/signup` link to navigation or footer
4. Review if demo pages should be publicly accessible or require authentication
