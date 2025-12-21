# DOM Reality Enforcement - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Run Tests

```bash
npm run qa:dom-reality
```

This will:
- Start the development server automatically
- Test all 9 critical routes
- Capture SSR, hydration, and final DOM states
- Detect invisible elements, hydration mismatches, and layout shifts
- Generate individual route reports

### Step 2: Generate Report

```bash
npm run qa:dom-reality:report
```

This will:
- Aggregate all test results
- Generate comprehensive JSON and Markdown reports
- Provide fix recommendations
- Calculate metrics and statistics

### Step 3: Review Report

```bash
cat test-results/dom-reality-report.md
```

Or open in your editor:
```bash
code test-results/dom-reality-report.md
```

## 📊 What Gets Tested

### Routes
- `/` - Homepage
- `/signup` - Sign up page
- `/console` - Developer console
- `/playground` - API playground
- `/pricing` - Pricing page
- `/docs` - Documentation
- `/trust` - Trust/security page
- `/cookbook` - Cookbook
- `/runbooks` - Runbooks

### Scenarios
- ✅ SSR HTML capture
- ✅ Post-hydration DOM capture
- ✅ Final painted DOM capture
- ✅ Invisible element detection
- ✅ Hydration mismatch detection
- ✅ Layout shift measurement (CLS)
- ✅ Accessibility validation
- ✅ Mobile, tablet, desktop breakpoints
- ✅ Light and dark themes
- ✅ Console error monitoring

## 🎯 Understanding the Report

### Report Structure

```markdown
# DOM Reality Enforcement Report

## Summary
- Total Routes Tested: 9
- Routes with Issues: X
- Critical Issues: X
- Warnings: X

## Route Status
| Route | Status | Issues | Critical | Visible Nodes | Invisible Nodes | CLS |
|-------|--------|--------|----------|---------------|-----------------|-----|
| /     | ✅ pass | 0      | 0        | 1234         | 56              | 0.05|

## Issues by Type
- invisible: X
- hydration_mismatch: X
- layout_shift: X
- accessibility: X

## Recommendations
- Fix X hydration mismatch(es)
- Review X invisible element(s)
- ...

## Suggested Fixes
### [Route] Issue Description
**Fix:** ...
```

### Status Indicators

- ✅ **pass** - No issues found
- ⚠️ **warning** - Non-critical issues found
- ❌ **fail** - Critical issues found

### Issue Types

1. **invisible** - Element exists in DOM but not visible
2. **hydration_mismatch** - SSR and client render differently
3. **layout_shift** - Content shifts after load (CLS > 0.1)
4. **accessibility** - A11y violations (duplicate IDs, missing labels)
5. **css_root_cause** - CSS causing rendering issues

## 🔧 Fixing Issues

### Common Fixes

1. **Invisible Elements**
   - Check computed styles in DevTools
   - Remove `display: none` or use conditional rendering
   - Fix flex/grid layouts causing collapse

2. **Hydration Mismatches**
   - Ensure server and client render same content
   - Use `useEffect` for client-only content
   - Avoid `window`/`document` in render

3. **Layout Shifts**
   - Add explicit dimensions to images
   - Reserve space for dynamic content
   - Avoid inserting content above existing content

4. **Accessibility**
   - Remove duplicate IDs
   - Add `aria-label` or wrap in `<label>`
   - Ensure semantic HTML structure

### Fix Template

```markdown
### [Route] Issue Description

**Issue Type:** [type]
**Severity:** [critical | warning | info]
**Element:** [selector]

**What was wrong:**
- Description

**Why the fix works:**
- Explanation

**Files Changed:**
- `path/to/file.tsx` - Description

**Verification:**
- Steps to verify
```

## 📈 CI/CD Integration

Tests automatically run on:
- Pull requests affecting frontend code
- Pushes to main/develop branches

Reports are:
- Uploaded as GitHub Actions artifacts
- Commented on PRs
- Available for 30 days

## 🐛 Troubleshooting

### Tests Fail to Start

**Issue:** Server doesn't start

**Solution:**
```bash
# Check if port 3000 is available
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or change port in playwright.config.ts
```

### Tests Timeout

**Issue:** Tests take too long

**Solution:**
- Increase timeout in test file
- Check network connectivity
- Verify server is responding

### Missing Reports

**Issue:** No reports generated

**Solution:**
```bash
# Check test results directory
ls test-results/dom-reality-reports/

# Run report generator manually
npm run qa:dom-reality:report
```

## 📚 Additional Resources

- **Verification Checklist:** `docs/dom-reality-verification-checklist.md`
- **Fix Log:** `docs/dom-reality-fix-log.md`
- **Summary:** `docs/dom-reality-summary.md`
- **Implementation:** `docs/dom-reality-implementation-complete.md`

## 🎓 Best Practices

1. **Run tests before committing** - Catch issues early
2. **Review reports weekly** - Track trends over time
3. **Fix critical issues immediately** - Don't let them accumulate
4. **Document fixes** - Update fix log for future reference
5. **Expand coverage** - Add new routes as they're created

## ✅ Success Criteria

Your frontend is healthy when:
- ✅ No critical issues in reports
- ✅ CLS < 0.1 (good) or < 0.25 (acceptable)
- ✅ No hydration warnings in console
- ✅ All critical CTAs visible and clickable
- ✅ Accessibility score > 90

---

**Ready to start?** Run `npm run qa:dom-reality` now! 🚀
