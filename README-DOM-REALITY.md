# DOM Reality Enforcement System

> **If the browser does not paint it, it does not exist.**

Comprehensive DOM reality enforcement ensuring browser-rendered output matches product intent across all routes, breakpoints, and states.

## 🚀 Quick Start

```bash
# Run tests
npm run qa:dom-reality

# Generate report
npm run qa:dom-reality:report

# View results
cat test-results/dom-reality-reports/DOM_REALITY_REPORT.md
```

## 📚 Documentation

- **[Quick Start](docs/DOM_REALITY_QUICK_START.md)** - Get started in 3 steps
- **[Verification Checklist](docs/DOM_REALITY_VERIFICATION_CHECKLIST.md)** - Manual verification steps
- **[Fix Log](docs/DOM_REALITY_FIX_LOG.md)** - Track fixes
- **[Summary](docs/DOM_REALITY_SUMMARY.md)** - System overview
- **[Implementation](docs/DOM_REALITY_IMPLEMENTATION_COMPLETE.md)** - Technical details
- **[Integration Guide](docs/DOM_REALITY_INTEGRATION_GUIDE.md)** - CI/CD integration
- **[Complete Guide](docs/DOM_REALITY_COMPLETE.md)** - Full documentation

## ✨ Features

- **DOM State Capture**: SSR, hydration, and final DOM snapshots
- **Issue Detection**: Invisible elements, hydration mismatches, layout shifts
- **Performance Monitoring**: FCP, LCP, CLS, TTI metrics
- **Regression Prevention**: Automated guardrails
- **CI/CD Integration**: Automatic testing and reporting

## 🎯 What Gets Tested

- 14+ critical routes
- Multiple viewports (mobile, tablet, desktop)
- Light/dark themes
- Accessibility compliance
- Performance metrics

## 📊 Reports

Reports are generated in:
- `test-results/dom-reality-reports/DOM_REALITY_REPORT.md` (Markdown)
- `test-results/dom-reality-reports/DOM_REALITY_REPORT.html` (HTML)

## 🔧 Scripts

- `npm run qa:dom-reality` - Run all DOM reality tests
- `npm run qa:dom-reality:report` - Generate reports
- `npm run qa:dom-reality:inspect` - Deep inspection
- `npm run qa:dom-reality:ci` - CI integration helper
- `npm run qa:dom-reality:check-env` - Verify environment variables
- `npm run qa:all` - Includes DOM reality tests

## 🔐 Environment Variables

Tests automatically load environment variables from `.env` files (same priority as Next.js):

```bash
# Check if env vars are loaded
npm run qa:dom-reality:check-env
```

**Local:** Create `.env.local` file (gitignored)  
**CI/CD:** Uses GitHub secrets automatically  
**Preview/Production:** Uses Vercel environment variables

See [Environment Setup Guide](docs/DOM_REALITY_ENV_SETUP.md) for details.

## ✅ Success Criteria

- ✅ No UI exists in code but not on screen
- ✅ No hydration warnings or silent recoveries
- ✅ Layout is stable across reloads, navigation, and breakpoints
- ✅ DOM reflects truth, not assumptions
- ✅ Visual correctness is enforced automatically

## 📖 Learn More

See [Complete Documentation](docs/DOM_REALITY_COMPLETE.md) for full details.

---

**Ready to start?** Run `npm run qa:dom-reality` now! 🚀
