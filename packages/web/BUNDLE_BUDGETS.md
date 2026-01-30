# Bundle Size Budgets

## Scale-Readiness: Performance Budget Guidelines

**WHY THIS MATTERS AT SCALE:**
- Every 100KB added = ~1s slower load time on 3G
- Larger bundles = higher CDN costs
- Poor performance = lower conversion rates
- Tech debt compounds - easier to prevent than fix

## Target Budgets

### Page Bundles (Initial Load)

| Page Type | Budget | Current | Status |
|-----------|--------|---------|--------|
| Landing pages | 200KB | TBD | ⏳ Baseline needed |
| Dashboard | 300KB | TBD | ⏳ Baseline needed |
| Console pages | 250KB | TBD | ⏳ Baseline needed |
| Admin pages | 350KB | TBD | ⏳ Baseline needed |

### Shared Bundles

| Bundle | Budget | Notes |
|--------|--------|-------|
| Framework chunk | 180KB | Next.js + React core |
| Common chunk | 100KB | Shared utilities |
| Vendor chunk | 150KB | Third-party libs |

### Total Bundle Size

| Metric | Target | Notes |
|--------|--------|-------|
| First Load JS | < 300KB | Critical for performance |
| Total JS | < 1MB | All pages combined |
| Unused JS | < 20% | Code splitting effectiveness |

## Monitoring

### Development

```bash
# Quick size check (after build)
pnpm bundle:size

# Full analysis with visualization
pnpm analyze:bundle
```

### CI/CD

Add to GitHub Actions:
```yaml
- name: Check bundle size
  run: |
    cd packages/web
    pnpm build
    # Add size comparison with main branch
    # Fail if increase > 10%
```

## Optimization Strategies

### 1. Code Splitting

✅ **Current Implementation:**
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting (App Router)

🎯 **Improvement Opportunities:**
```typescript
// Heavy components - use dynamic imports
const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <Skeleton />,
  ssr: false, // Skip SSR for admin pages
});

// Conditionally loaded features
const AnalyticsPanel = dynamic(() =>
  import('@/components/analytics/Panel').then(mod => mod.AnalyticsPanel),
  { ssr: false }
);
```

### 2. Tree Shaking

✅ **Current Implementation:**
```javascript
// next.config.js
optimizePackageImports: [
  'lucide-react',        // Icons: 300KB → 20KB per icon
  'date-fns',            // Dates: 200KB → 2KB per function
  'recharts',            // Charts: 400KB → varies by chart type
]
```

🎯 **Best Practices:**
```typescript
// ✅ Good - tree-shakeable
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

// ❌ Bad - imports everything
import * as Icons from 'lucide-react';
import DateFns from 'date-fns';
```

### 3. Server Components

✅ **Current Implementation:**
- Server Components for data fetching
- Client Components marked with 'use client'

🎯 **Optimization:**
- Move more components to Server Components
- Use React Server Actions for mutations
- Minimize 'use client' boundary

### 4. External Dependencies

Review before adding:
- Is it tree-shakeable?
- What's the bundle size?
- Can we use a lighter alternative?
- Do we need the whole library?

**Heavy Dependencies (Monitor These):**
```typescript
// Current heavy deps (size estimates)
"framer-motion": "~180KB"      // Consider motion-one for smaller sites
"@tanstack/react-query": "~50KB"  // Worth it for data management
"@builder.io/react": "~200KB"  // Page builder - admin only
"recharts": "~400KB"           // Charts - lazy load by chart type
```

## Budget Enforcement

### Automated Checks

1. **Pre-commit:** Warn on large imports
2. **CI/CD:** Fail if bundle increases > 10% without approval
3. **PR Comments:** Show bundle size diff
4. **Production:** Monitor actual bundle delivery

### Review Process

When bundle increases:
1. Identify what changed (bundle analysis)
2. Justify the increase (feature value vs. cost)
3. Explore alternatives (lighter lib, code split, lazy load)
4. Update budget if justified
5. Document decision

## Baseline Measurement

To establish current baselines:

```bash
cd packages/web

# Clean build
pnpm clean:build
pnpm build

# Measure sizes
pnpm bundle:size

# Record results in this file
# Update "Current" column in tables above
```

## Performance Impact

| Bundle Size | 3G Load Time | 4G Load Time | Impact |
|-------------|--------------|--------------|--------|
| 100KB | ~1s | ~0.3s | ✅ Excellent |
| 200KB | ~2s | ~0.6s | ✅ Good |
| 300KB | ~3s | ~0.9s | ⚠️ Acceptable |
| 500KB | ~5s | ~1.5s | ❌ Poor |
| 1MB | ~10s | ~3s | ❌ Unacceptable |

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Bundle Size Best Practices](https://web.dev/performance-budgets-101/)
- [Core Web Vitals](https://web.dev/vitals/)

## Next Steps

1. ✅ Enable bundle analysis (`pnpm analyze:bundle`)
2. ⏳ Run baseline measurement
3. ⏳ Document current sizes
4. ⏳ Set up CI monitoring
5. ⏳ Add PR size diff comments
6. ⏳ Create dashboard for tracking

---

**Last Updated:** 2026-01-30
**Owner:** Engineering Team
**Review Cadence:** Quarterly or on major releases
