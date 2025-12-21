# DOM Reality Quick Start Guide

Get started with DOM reality enforcement in 3 steps.

## Step 1: Run Tests

```bash
npm run qa:dom-reality
```

This runs comprehensive DOM reality tests on all critical routes, checking:
- SSR vs hydration vs final DOM consistency
- Element visibility
- Hydration mismatches
- Layout shifts
- Accessibility violations

## Step 2: Generate Report

```bash
npm run qa:dom-reality:report
```

This generates comprehensive reports:
- `test-results/dom-reality-reports/DOM_REALITY_REPORT.md` - Markdown report
- `test-results/dom-reality-reports/DOM_REALITY_REPORT.html` - HTML report

## Step 3: Review Results

```bash
# View markdown report
cat test-results/dom-reality-reports/DOM_REALITY_REPORT.md

# Or open HTML report in browser
open test-results/dom-reality-reports/DOM_REALITY_REPORT.html
```

## Advanced Usage

### Deep Inspection

For detailed DOM analysis:

```bash
npm run qa:dom-reality:inspect
```

This captures:
- SSR HTML snapshots
- Post-hydration DOM snapshots
- Final painted DOM snapshots
- Detailed issue analysis

### Run All QA Tests

```bash
npm run qa:all
```

This runs all QA tests including DOM reality checks.

### CI Integration

DOM reality tests run automatically in CI on:
- Pull requests affecting frontend code
- Pushes to main/develop branches

## What Gets Tested

### Routes
- `/` (Homepage)
- `/signup`
- `/pricing`
- `/docs`
- `/console`
- `/playground`
- `/trust`
- And more...

### Viewports
- Mobile: 375x667, 390x844
- Tablet: 768x1024
- Desktop: 1280x720

### Themes
- Light mode
- Dark mode

## Understanding Results

### Critical Issues
These must be fixed before deployment:
- Hydration mismatches
- Missing critical content
- High CLS scores (>0.25)
- Duplicate IDs

### Warnings
These should be reviewed:
- Invisible elements with content
- Moderate CLS scores (0.1-0.25)
- Missing accessible labels

### Metrics
- **SSR Nodes**: Server-rendered elements
- **Hydrated Nodes**: After React hydration
- **Final Nodes**: After all effects
- **Visible/Invisible**: Element visibility counts
- **CLS Score**: Cumulative Layout Shift

## Next Steps

1. **Fix Issues**: Address critical issues first
2. **Review Warnings**: Check if warnings need fixes
3. **Monitor**: Set up regular inspections
4. **Document**: Update fix log with changes

## Resources

- **[Verification Checklist](DOM_REALITY_VERIFICATION_CHECKLIST.md)** - Step-by-step verification
- **[Fix Log](DOM_REALITY_FIX_LOG.md)** - Track fixes
- **[Summary](DOM_REALITY_SUMMARY.md)** - System overview
- **[Implementation](DOM_REALITY_IMPLEMENTATION_COMPLETE.md)** - Technical details

## Troubleshooting

### Tests Fail to Start
- Ensure dev server is running: `npm run dev --workspace=packages/web`
- Check port 3000 is available
- Verify Playwright is installed: `npx playwright install`

### Reports Not Generated
- Check `test-results/dom-reality-reports/` directory exists
- Ensure tests completed successfully
- Check file permissions

### High CLS Scores
- Review layout shifts in DevTools Performance tab
- Check for dynamic content loading
- Ensure images have dimensions

## Support

For issues or questions:
1. Check existing documentation
2. Review test output
3. Check CI logs for errors

---

**Ready to start?** Run `npm run qa:dom-reality` now! 🚀
