# QA Artifacts

This directory contains QA crawl reports and evidence from automated site testing.

## Files

- `report.json` - Machine-readable crawl report with all page data, links, errors
- `summary.md` - Human-readable summary of issues found
- `FIXES_SUMMARY.md` - Summary of fixes applied
- `screenshots/` - Desktop and mobile screenshots for each page (gitignored)

## Running the Crawler

```bash
# Crawl live site (https://settler.dev)
npm run qa:crawl:live

# Crawl local development server
npm run qa:crawl:local

# Crawl custom URL
npm run qa:crawl <url>
```

## Report Format

The crawler generates:
- **HTTP status codes** for each route
- **Console errors and warnings**
- **Network failures** (4xx/5xx)
- **Link graph** showing internal link relationships
- **Broken links** detection
- **Screenshots** (desktop + mobile) for visual verification

## Interpretation

- **Pages with 500 errors**: Critical - route is completely broken
- **Pages with 400 errors**: May be expected (e.g., 404 for missing resources)
- **Console errors**: Check if they're critical or ignorable (CSP violations, analytics, etc.)
- **Network errors**: Failed resource loads (images, fonts, API calls)
- **Broken links**: Internal links pointing to non-existent routes

## Next Steps After Crawl

1. Review `summary.md` for human-readable overview
2. Check `report.json` for detailed data
3. Fix critical issues (500 errors, broken links)
4. Re-run crawler to verify fixes
5. Commit fixes with clear commit messages
