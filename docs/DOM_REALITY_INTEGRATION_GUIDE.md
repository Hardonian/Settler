# DOM Reality Integration Guide

Complete guide for integrating DOM reality enforcement into your development workflow.

## Quick Integration

### 1. Add to Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run DOM reality tests on frontend changes
if git diff --cached --name-only | grep -q "packages/web\|tests/e2e/dom-reality"; then
  echo "🔍 Running DOM reality checks..."
  npm run qa:dom-reality || exit 1
fi
```

### 2. Add to CI Pipeline

The workflow `.github/workflows/dom-reality.yml` is already configured. It will:
- Run on PRs affecting frontend code
- Run on pushes to main/develop
- Generate reports
- Comment on PRs with results
- Fail on critical issues

### 3. Add to Package Scripts

Already added:
- `npm run qa:dom-reality` - Run tests
- `npm run qa:dom-reality:report` - Generate reports
- `npm run qa:dom-reality:inspect` - Deep inspection
- `npm run qa:dom-reality:ci` - CI integration helper

## Development Workflow

### Before Committing

```bash
# Run DOM reality tests
npm run qa:dom-reality

# If issues found, generate report
npm run qa:dom-reality:report

# Review and fix issues
# Update fix log
```

### During Development

```bash
# Watch mode (if supported)
npm run qa:dom-reality -- --watch

# Test specific route
npm run qa:dom-reality -- --grep "/pricing"
```

### Before Deployment

```bash
# Full QA suite including DOM reality
npm run qa:all
```

## CI/CD Integration

### GitHub Actions

The workflow is configured to:
1. Run tests automatically
2. Generate reports
3. Upload artifacts
4. Comment on PRs
5. Fail on critical issues

### Custom CI

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps chromium

# Start dev server
npm run dev --workspace=packages/web &

# Wait for server
# ... wait logic ...

# Run tests
npm run qa:dom-reality

# Generate report
npm run qa:dom-reality:report

# Check critical issues
npx tsx scripts/dom-reality-ci-integration.ts test-results/dom-reality-reports exit
```

## IDE Integration

### VS Code

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "DOM Reality Tests",
      "type": "shell",
      "command": "npm run qa:dom-reality",
      "problemMatcher": []
    },
    {
      "label": "DOM Reality Report",
      "type": "shell",
      "command": "npm run qa:dom-reality:report",
      "problemMatcher": []
    }
  ]
}
```

### IntelliJ/WebStorm

1. Run → Edit Configurations
2. Add → npm
3. Command: `run`
4. Scripts: `qa:dom-reality`

## Monitoring

### Regular Inspections

Set up scheduled inspections:

```yaml
# .github/workflows/dom-reality-scheduled.yml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
```

### Performance Tracking

Track metrics over time:
- CLS scores
- Hydration mismatches
- Critical issues count

## Troubleshooting

### Tests Fail in CI

1. Check server startup
2. Verify Playwright browsers installed
3. Check timeout settings
4. Review CI logs

### Reports Not Generated

1. Verify test results directory exists
2. Check file permissions
3. Ensure tests completed
4. Review error logs

### Performance Issues

1. Reduce route count for faster runs
2. Use caching (see optimization guide)
3. Run tests in parallel
4. Skip non-critical routes

## Best Practices

1. **Run Before PR**: Always run tests before opening PR
2. **Fix Critical Issues**: Never merge with critical issues
3. **Update Fix Log**: Document all fixes
4. **Monitor Trends**: Track metrics over time
5. **Regular Audits**: Schedule weekly inspections

## Resources

- [Quick Start](DOM_REALITY_QUICK_START.md)
- [Verification Checklist](DOM_REALITY_VERIFICATION_CHECKLIST.md)
- [Fix Log](DOM_REALITY_FIX_LOG.md)
- [Summary](DOM_REALITY_SUMMARY.md)
