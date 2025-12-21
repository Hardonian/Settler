# DOM Reality Verification Checklist

This checklist ensures the browser's final painted output matches product intent across all routes, breakpoints, and states.

## Pre-Deployment Verification

### 1. DOM Reality Inspection
- [ ] Run `npm run qa:dom-reality:inspect` to capture SSR, hydration, and final DOM states
- [ ] Review generated reports in `test-results/dom-reality-reports/`
- [ ] Verify no critical issues exist
- [ ] Address all warnings before deployment

### 2. Automated Tests
- [ ] Run `npm run qa:dom-reality` - all tests must pass
- [ ] Run `npm run qa:reality` - site reality audit must pass
- [ ] Run `npm run qa:a11y` - accessibility checks must pass
- [ ] Run `npm run qa:visual` - visual regression tests must pass

### 3. Manual Verification Steps

#### Desktop (1280x720)
- [ ] Homepage renders correctly
- [ ] Navigation is visible and functional
- [ ] All CTAs are visible and clickable
- [ ] No horizontal scroll
- [ ] Content is not clipped
- [ ] Images load and display correctly
- [ ] Forms are visible and functional

#### Mobile (375x667)
- [ ] Homepage renders correctly
- [ ] Navigation menu works (hamburger menu if applicable)
- [ ] No horizontal scroll
- [ ] Text is readable (not too small)
- [ ] Touch targets are at least 44x44px
- [ ] Forms are usable on mobile
- [ ] Images are responsive

#### Dark Mode
- [ ] Theme toggle works
- [ ] All text is readable (sufficient contrast)
- [ ] Images/icons are visible
- [ ] No white flashes on page load

### 4. Hydration Verification

#### DevTools Steps
1. Open Chrome DevTools → Network tab
2. Enable "Disable cache"
3. Reload page
4. Check Console for hydration warnings
5. Verify no React hydration errors

#### What to Observe
- [ ] No hydration warnings in console
- [ ] Content appears immediately (SSR working)
- [ ] No layout shifts after hydration
- [ ] Interactive elements work immediately after hydration

### 5. CSS Root Cause Verification

#### Check for Common Issues
- [ ] No conflicting Tailwind classes (e.g., `hidden` + `block`)
- [ ] No elements with `display: none` that should be visible
- [ ] No elements with `opacity: 0` that should be visible
- [ ] No zero-width/zero-height containers
- [ ] No `overflow: hidden` clipping important content
- [ ] No absolute/fixed elements without positioning anchors

#### DevTools Inspection
1. Open DevTools → Elements tab
2. Select any invisible element
3. Check Computed styles:
   - `display` should not be `none` (unless intentional)
   - `visibility` should not be `hidden` (unless intentional)
   - `opacity` should not be `0` (unless intentional)
   - `width` and `height` should be > 0
4. Check Layout:
   - Element should have bounding box
   - Element should not be clipped by parent

### 6. Accessibility Verification

#### Semantic HTML
- [ ] Page has `<main>` or `[role="main"]`
- [ ] Headings follow hierarchy (h1 → h2 → h3)
- [ ] No duplicate IDs
- [ ] All interactive elements have labels

#### Screen Reader
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Navigation order matches visual order
- [ ] All content is announced correctly
- [ ] Skip links work

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators are visible
- [ ] Focus order is logical
- [ ] No keyboard traps

### 7. Performance Verification

#### Core Web Vitals
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] First Input Delay (FID) < 100ms

#### DevTools Performance Tab
1. Record page load
2. Check for:
   - Long tasks blocking rendering
   - Excessive layout shifts
   - Unused CSS/JS
   - Large images not optimized

### 8. Cross-Browser Verification

#### Browsers to Test
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

#### What to Check
- [ ] Layout renders correctly
- [ ] No console errors
- [ ] Interactive elements work
- [ ] CSS animations/transitions work

### 9. Responsive Breakpoints

#### Breakpoints to Test
- [ ] Mobile: 375px, 390px, 414px
- [ ] Tablet: 768px, 1024px
- [ ] Desktop: 1280px, 1920px

#### What to Check
- [ ] Layout adapts correctly
- [ ] No horizontal scroll
- [ ] Text remains readable
- [ ] Images scale appropriately

### 10. Error States

#### Test Error Scenarios
- [ ] 404 page renders correctly
- [ ] 500 error page renders correctly
- [ ] Network error handling
- [ ] Empty data states
- [ ] Loading states

## Regression Prevention

### Automated Checks
- [ ] DOM reality tests run in CI
- [ ] Visual regression tests run in CI
- [ ] Accessibility tests run in CI
- [ ] Tests fail build on critical issues

### Code Review Checklist
- [ ] No `display: none` on content elements
- [ ] No conflicting visibility classes
- [ ] All dynamic imports have loading states
- [ ] All client components handle SSR gracefully
- [ ] No hydration mismatches introduced

## Common Issues and Fixes

### Issue: Element invisible due to CSS
**Root Cause**: Conflicting Tailwind classes or CSS specificity
**Fix**: Remove conflicting classes, use conditional rendering instead

### Issue: Hydration mismatch
**Root Cause**: Server/client rendering different content
**Fix**: Ensure server and client render same initial state

### Issue: Layout shift after hydration
**Root Cause**: Client-only content replacing SSR content
**Fix**: Use SSR for initial content, hydrate progressively

### Issue: Horizontal scroll on mobile
**Root Cause**: Fixed width elements or overflow not hidden
**Fix**: Use responsive units, add `overflow-x: hidden` to body

### Issue: Zero-height container
**Root Cause**: Flex/Grid misconfiguration or collapsed content
**Fix**: Set min-height or ensure content fills container

## Reporting Issues

When reporting DOM reality issues, include:
1. Route affected
2. Viewport size
3. Browser/device
4. Screenshot
5. DevTools computed styles
6. Console errors/warnings
7. Steps to reproduce

## Success Criteria

✅ No UI exists in code but not on screen
✅ No hydration warnings or silent recoveries
✅ Layout is stable across reloads, navigation, and breakpoints
✅ DOM reflects truth, not assumptions
✅ Visual correctness is enforced automatically
