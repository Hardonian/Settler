# DOM Reality Verification Checklist

This checklist helps verify that the browser's final painted output matches product intent across all routes, breakpoints, and states.

## Pre-Deployment Verification

### 1. DOM Reality Inspection

For each critical route:

- [ ] **SSR HTML captured** - Server-rendered HTML is captured before hydration
- [ ] **Post-hydration DOM captured** - DOM after React hydration is captured
- [ ] **Final painted DOM captured** - Final DOM after all effects and dynamic imports
- [ ] **Node-by-node comparison** - All three states compared for discrepancies
- [ ] **No invisible critical content** - All intended content is visible
- [ ] **No hydration mismatches** - SSR and client render identical content
- [ ] **No layout shifts** - CLS score < 0.1 (good) or < 0.25 (acceptable)

### 2. Render & Paint Order Analysis

- [ ] **Above-the-fold content renders first** - Critical content visible immediately
- [ ] **First Contentful Paint < 1.8s** - Fast initial render
- [ ] **No blocking resources** - CSS and JS don't block rendering
- [ ] **No layout shifts after hydration** - Content doesn't jump
- [ ] **No invisible elements due to layout** - All elements have proper dimensions

### 3. Hydration & Client Mismatch Detection

- [ ] **No hydration warnings in console** - Check browser console for React warnings
- [ ] **No conditional rendering divergence** - Server and client use same conditions
- [ ] **No useEffect gates hiding content** - Content visible without waiting for effects
- [ ] **Suspense fallbacks resolve** - Loading states don't persist indefinitely
- [ ] **Dynamic imports load correctly** - No blank UI from failed imports
- [ ] **No silent React recoveries** - All errors are logged

### 4. CSS & Layout Root Cause Trace

For every invisible or broken element:

- [ ] **Computed styles inspected** - DevTools shows actual computed values
- [ ] **CSS rule identified** - Exact rule causing issue found
- [ ] **Source attributed** - Tailwind utility, global stylesheet, or component CSS
- [ ] **Responsive breakpoints validated** - Mobile layout tested independently
- [ ] **No conflicting utilities** - No `hidden` + `block` or `opacity-0` + `opacity-100`

### 5. Accessibility & Semantic DOM Validation

- [ ] **Correct semantic hierarchy** - `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- [ ] **No hidden but focusable elements** - Interactive elements are visible
- [ ] **No duplicate IDs** - Each ID is unique
- [ ] **ARIA attributes reflect state** - `aria-hidden`, `aria-expanded` match visual state
- [ ] **Screen reader order matches visual** - Tab order is logical

### 6. Playwright-Level Reality Verification

- [ ] **DOM snapshot comparisons** - Snapshots captured and compared
- [ ] **Screenshot captures** - Screenshots taken per route
- [ ] **Layout shift detection** - CLS measured and logged
- [ ] **Visibility assertions** - Critical components verified visible
- [ ] **Hydration mismatch detection** - Tests fail on mismatches

## DevTools Verification Steps

### Chrome DevTools

1. **Open DevTools** → Elements tab
2. **Check computed styles** for suspicious elements:
   - Right-click element → Inspect
   - Check Computed tab for `display`, `visibility`, `opacity`, `width`, `height`
3. **Check for hydration warnings**:
   - Console tab → Filter by "hydration" or "mismatch"
4. **Measure layout shifts**:
   - Performance tab → Record → Navigate → Check Layout Shift events
5. **Check accessibility**:
   - Lighthouse tab → Run audit → Check Accessibility score

### React DevTools

1. **Check component tree** - Verify all components render
2. **Check for Suspense boundaries** - Ensure fallbacks resolve
3. **Check for error boundaries** - Verify error handling

## What to Observe During Testing

### During Resize

- [ ] Content doesn't overflow horizontally
- [ ] Navigation remains accessible
- [ ] Images scale correctly
- [ ] Text remains readable
- [ ] No layout shifts

### During Refresh

- [ ] Content appears immediately (no blank screen)
- [ ] No flash of unstyled content (FOUC)
- [ ] Theme persists correctly
- [ ] No hydration warnings

### During Navigation

- [ ] Smooth transitions (if implemented)
- [ ] No layout shifts
- [ ] Loading states appear appropriately
- [ ] No broken images or assets

## Known Intentional Patterns

These patterns are intentional and should NOT be flagged:

1. **Skip-to-main-content link** - Hidden until focused (accessibility feature)
2. **Hover states with opacity-0/opacity-100** - Intentional for interactive elements
3. **Theme script in layout.tsx** - Modifies DOM before hydration (requires `suppressHydrationWarning`)
4. **Hidden preload divs** - Used for prefetching components (performance optimization)

## Regression Prevention

### CSS Invariants to Enforce

- No `display: none` on interactive elements (use conditional rendering)
- No `opacity: 0` on critical content (use conditional rendering)
- No absolute/fixed positioning without anchors
- No excessive z-index values (>1000)

### Test Coverage Added

- [ ] DOM reality tests run in CI
- [ ] Tests fail on critical issues
- [ ] Tests warn on layout shifts > 0.25
- [ ] Tests verify accessibility

### Guardrails Introduced

- [ ] Pre-commit hook checks for hydration warnings
- [ ] CI fails on DOM reality test failures
- [ ] Visual regression tests catch layout changes
- [ ] Accessibility tests catch a11y violations

## Running Verification

```bash
# Run DOM reality tests
npm run qa:dom-reality

# Generate comprehensive report
npm run qa:dom-reality:report

# View report
cat test-results/dom-reality-report.md
```

## Success Criteria

✅ **No UI exists in code but not on screen**
✅ **No hydration warnings or silent recoveries**
✅ **Layout is stable across reloads, navigation, and breakpoints**
✅ **DOM reflects truth, not assumptions**
✅ **Visual correctness is enforced automatically**
