# Front-End Architecture Overview

## Current Architecture

### Framework & Stack

- **Next.js 14** with App Router (`packages/web/`)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **Prisma** for database ORM
- **Vercel** for deployment

### Routing Structure

The app uses Next.js App Router with the following structure:

```
packages/web/src/app/
├── layout.tsx              # Root layout (Navigation, Footer, global providers)
├── page.tsx                # Homepage (hard-coded hero, features, CTAs)
├── pricing/
│   ├── layout.tsx
│   └── page.tsx            # Pricing page (hard-coded plans, FAQ)
├── docs/
│   ├── layout.tsx
│   └── page.tsx            # Documentation hub
├── console/
│   ├── layout.tsx          # Console layout (auth check, ConsoleLayout sidebar)
│   ├── page.tsx            # Console overview
│   ├── api-keys/
│   ├── billing/
│   ├── receipts/
│   ├── feature-flags/
│   └── usage/
└── [other marketing pages]
```

### Current Page Rendering

**Marketing Pages** (e.g., `/`, `/pricing`):

- Hard-coded React components with static content
- Navigation items hard-coded in `Navigation.tsx`
- Footer items hard-coded in `Footer.tsx`
- No tenant awareness or dynamic configuration

**Console Pages** (`/console/*`):

- Protected by auth check in `console/layout.tsx`
- Uses `ConsoleLayout` component with hard-coded sidebar navigation
- Fetches data from API routes (`/api/console/*`)
- No tenant-specific branding or navigation

### Navigation System

**Main Navigation** (`components/Navigation.tsx`):

- Hard-coded array of navigation items
- Fixed logo and branding
- No tenant-specific customization

**Console Navigation** (`components/console/ConsoleLayout.tsx`):

- Hard-coded sidebar items
- Fixed styling and layout
- No tenant-specific customization

### Authentication & User Model

**Auth Provider**: Supabase Auth

- Server-side auth via `lib/supabase/server.ts`
- Session management via cookies
- User object from `supabase.auth.getUser()`

**Account Model**:

- `BillingAccount` in Prisma schema (has `tenantId` field)
- Links to Stripe customer/subscription
- Used for billing, usage tracking, feature flags

**Current Tenant Usage**:

- `tenantId` exists in `BillingAccount` but not fully utilized
- Some domain logic references `tenantId` (feature flags, usage events)
- No tenant resolution or multi-tenant UI layer

### Theming & Styling

**Design System**:

- Tailwind CSS with custom theme tokens
- Dark mode support via `DarkModeToggle`
- Custom UI components in `components/ui/`
- No tenant-specific theming currently

**Color System**:

- Hard-coded gradient colors (electric-cyan, electric-purple, etc.)
- CSS variables for theme colors
- No dynamic tenant branding

### Component Structure

**Marketing Components**:

- `AnimatedHero`, `AnimatedPricingCard`, `ConversionCTA`, etc.
- Reusable but content is hard-coded in page components
- No block-based or schema-driven rendering

**Console Components**:

- `ConsoleLayout` for sidebar navigation
- Domain-specific components in `components/console/`
- Data fetching via API routes

## Where to Plug In Tenant-Aware Theming & Config

### 1. Tenant Resolution Layer

**Location**: `src/shared/tenant/tenantResolver.ts`

**Purpose**: Determine which tenant is being served based on:

- Request host/domain (primary domain or custom domain)
- URL path (optional `/t/[tenantSlug]` for preview)
- Default to main Settler tenant if no match

**Integration Points**:

- Next.js middleware for early tenant resolution
- Server components can access resolved tenant
- API routes can use tenant context

### 2. Theme Provider

**Location**: `src/components/tenant/TenantThemeProvider.tsx`

**Purpose**:

- Fetch `TenantBranding` config for resolved tenant
- Provide theme tokens (colors, fonts) via React Context
- Apply CSS variables or Tailwind classes dynamically

**Integration Points**:

- Wrap root layout or specific layouts
- Components can consume theme via context
- Navigation/Footer can use tenant branding

### 3. Navigation System

**Location**: `src/components/tenant/TenantNavigation.tsx`

**Purpose**:

- Replace hard-coded `Navigation.tsx` with tenant-aware version
- Read from `TenantNavigation.navItems` and `.footerItems`
- Fall back to default if not configured

**Integration Points**:

- Replace `Navigation` import in layouts
- Console navigation can also be tenant-aware

### 4. Page Rendering Layer

**Location**: `src/domain/siteBuilder/pageRenderer.tsx`

**Purpose**:

- Replace hard-coded page components with `PageRenderer`
- Read `TenantPage.blocks` JSON and render block components
- Support experiments/variants for A/B testing

**Integration Points**:

- Marketing pages (`/`, `/pricing`, etc.) can use `PageRenderer`
- Docs pages can optionally use block-based rendering
- Keep existing pages as fallback during migration

### 5. Console Site Designer

**Location**: `src/app/console/site/`

**Purpose**:

- No-code editor for tenant admins/marketers
- Edit pages, branding, navigation via UI
- Manage experiments and variants

**Integration Points**:

- Add to `ConsoleLayout` sidebar navigation
- Use existing console auth and layout patterns
- API routes in `/api/console/site/*`

## Tenant Identification Mechanism

### Recommended Approach

1. **Primary Method**: Domain-based resolution
   - Check `request.headers.host` against `Tenant.primaryDomain` or `Tenant.customDomain`
   - Default to main tenant if no match

2. **Secondary Method**: Subdomain resolution
   - Extract subdomain from host (e.g., `partner-x.settler.dev`)
   - Match against tenant slug

3. **Tertiary Method**: Path-based preview (optional)
   - `/t/[tenantSlug]/*` for testing/preview
   - Requires auth (only for tenant admins)

4. **Fallback**: Default tenant
   - Slug: `"default"`
   - Domain: `settler.dev` (or configured primary domain)
   - Used when no tenant matches

### Implementation Strategy

```typescript
// src/shared/tenant/tenantResolver.ts
export async function resolveTenant(request: Request): Promise<Tenant | null> {
  const host = request.headers.get("host") || "";
  const url = new URL(request.url);

  // 1. Check custom domain
  const tenantByDomain = await findTenantByDomain(host);
  if (tenantByDomain) return tenantByDomain;

  // 2. Check subdomain
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const tenantBySlug = await findTenantBySlug(subdomain);
    if (tenantBySlug) return tenantBySlug;
  }

  // 3. Check path-based preview (if authenticated)
  const pathMatch = url.pathname.match(/^\/t\/([^/]+)/);
  if (pathMatch) {
    const tenantBySlug = await findTenantBySlug(pathMatch[1]);
    if (tenantBySlug && (await canAccessTenant(userId, tenantBySlug.id))) {
      return tenantBySlug;
    }
  }

  // 4. Default tenant
  return await getDefaultTenant();
}
```

## Migration Strategy

### Phase 1: Non-Breaking Addition

- Add tenant models to Prisma
- Create default tenant (slug: "default") with current hard-coded config
- Implement tenant resolution (defaults to main tenant)
- Existing pages continue to work unchanged

### Phase 2: Gradual Migration

- Migrate one page at a time to block-based rendering
- Keep old page as fallback if tenant page not found
- Test with default tenant first

### Phase 3: Full Multi-Tenant

- All marketing pages use `PageRenderer`
- Navigation and branding fully tenant-aware
- Console site designer available for tenant admins

## Backwards Compatibility

- **Default tenant** = current Settler.dev behavior
- Existing pages work if no `TenantPage` exists for a route
- Hard-coded navigation/Footer as fallback if tenant config missing
- No breaking changes to existing console features

## Next Steps

1. ✅ Document current architecture (this file)
2. ⏭️ Add tenant models to Prisma schema
3. ⏭️ Implement tenant resolution middleware
4. ⏭️ Create block-based page schema and renderer
5. ⏭️ Build Site Designer UI in console
6. ⏭️ Add experiments/A/B testing layer
7. ⏭️ Migrate existing pages to block-based system
