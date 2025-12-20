# Release Readiness Checklist

**Last Updated:** January 2026  
**Purpose:** Ensure repository is ready for external scrutiny (customers, auditors, investors)

---

## Pre-Release Checklist

### Documentation

- [ ] **README.md** - Clear, concise, investor-grade entry point
- [ ] **SECURITY.md** - Comprehensive security policy
- [ ] **CONTRIBUTING.md** - Contribution guidelines
- [ ] **CHANGELOG.md** - Up-to-date version history
- [ ] **LICENSE** - Clear licensing posture
- [ ] **docs/PRODUCT_OVERVIEW.md** - Product overview for external audiences
- [ ] **docs/ARCHITECTURE_OVERVIEW.md** - Architecture summary
- [ ] **docs/CONFIGURATION.md** - Environment variable documentation
- [ ] **docs/FAQ.md** - Frequently asked questions
- [ ] **docs/GLOSSARY.md** - Terminology definitions
- [ ] **docs/LICENSING_OVERVIEW.md** - Licensing explanation
- [ ] **docs/THREAT_MODEL.md** - Security threat model

### Legal & Licensing

- [ ] **LICENSE** - Matches README claims (proprietary vs OSS)
- [ ] **LEGAL/TERMS_OF_SERVICE.md** - Terms are current and consistent
- [ ] **LEGAL/PRIVACY_POLICY.md** - Privacy policy is current
- [ ] **LEGAL/COMMERCIAL_LICENSE.md** - Commercial license terms
- [ ] **docs/LICENSING_OVERVIEW.md** - No contradictions with LICENSE
- [ ] Code headers (if any) don't contradict license

### Security

- [ ] **SECURITY.md** - Comprehensive security policy
- [ ] **.gitignore** - Excludes `.env*` files
- [ ] **.env.example** or **.env.template** - Comprehensive with notes
- [ ] **No secrets in code** - Verified via secret scanning
- [ ] **docs/THREAT_MODEL.md** - Threat model documented
- [ ] **RLS policies** - Documented and verified
- [ ] **Dependency hygiene** - No critical vulnerabilities

### Build & CI/CD

- [ ] **package.json** - Node version declared (`engines`)
- [ ] **.nvmrc** - Node version specified
- [ ] **CI workflows** - Professional, well-documented
- [ ] **Build scripts** - `lint`, `typecheck`, `test`, `build`
- [ ] **Build passes** - Verified locally and in CI
- [ ] **Vercel config** - Build configuration correct
- [ ] **No build warnings** - Clean builds

### Repository Structure

- [ ] **Root directory** - Clean, only essential files
- [ ] **Archive structure** - Non-essential files archived
- [ ] **archive/ARCHIVE_INDEX.md** - Archive documented
- [ ] **docs/** - Well-organized documentation
- [ ] **No duplicate docs** - Consolidated duplicates
- [ ] **No internal-only docs in public** - Moved to `/archive` or `/docs/internal`

### Code Quality

- [ ] **Lint passes** - No linting errors
- [ ] **Typecheck passes** - No type errors
- [ ] **Tests pass** - All tests green
- [ ] **No dead code** - Unused code removed
- [ ] **Error handling** - Graceful degradation
- [ ] **No hard-500 errors** - Missing env handled gracefully

### Database & Migrations

- [ ] **Migrations organized** - Active vs archived clear
- [ ] **docs/DATABASE.md** - Database documentation
- [ ] **Migration naming** - Professional (no `final_final`)
- [ ] **No commented SQL** - In active migrations
- [ ] **Production safety** - No destructive migrations without warnings

### Investor Readiness

- [ ] **docs/INVESTOR_READY_SUMMARY.md** - Investor summary
- [ ] **docs/POSITIONING.md** - Market positioning
- [ ] **No confidential numbers** - Unless already public
- [ ] **Tone is factual** - No hype, no placeholders

---

## Verification Steps

### Build Verification

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Lint
npm run lint

# Typecheck
npm run typecheck

# Tests
npm run test

# Build
npm run build
```

**Expected:** All commands pass without errors.

### Secret Scanning

```bash
# Check for common secret patterns
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" --exclude-dir=node_modules --exclude-dir=.git .
```

**Expected:** Only in `.env.example`, `.env.template`, or documentation.

### Documentation Links

```bash
# Check for broken internal links (if link checker available)
npm run qa:links
```

**Expected:** No broken internal links.

### Environment Variables

```bash
# Validate environment schema
npm run validate:env
```

**Expected:** Schema validates successfully.

---

## Post-Release Checklist

### Monitoring

- [ ] **Error tracking** - Sentry or similar configured
- [ ] **Metrics** - Application metrics tracked
- [ ] **Logs** - Structured logging with correlation IDs
- [ ] **Alerts** - Critical errors alert configured

### Documentation Updates

- [ ] **CHANGELOG.md** - Updated with release notes
- [ ] **Version tags** - Git tags created
- [ ] **Release notes** - Published (if applicable)

### Communication

- [ ] **Announcement** - Release announced (if applicable)
- [ ] **Support ready** - Support team aware of release
- [ ] **Documentation published** - Docs updated on website

---

## Release Sign-Off

### Technical Review

- [ ] **Code review** - All changes reviewed
- [ ] **Security review** - Security implications assessed
- [ ] **Performance review** - Performance impact assessed

### Business Review

- [ ] **Product review** - Product implications understood
- [ ] **Legal review** - Legal implications assessed (if needed)
- [ ] **Marketing review** - Marketing implications understood (if needed)

### Approval

- [ ] **Technical lead approval**
- [ ] **Product owner approval** (if applicable)
- [ ] **Release manager approval**

---

## Emergency Rollback

### Rollback Triggers

- Critical security vulnerability discovered
- Data loss or corruption
- Service outage > 5 minutes
- Customer data breach

### Rollback Process

1. **Immediate:** Revert deployment to previous version
2. **Investigation:** Identify root cause
3. **Fix:** Develop and test fix
4. **Communication:** Notify affected customers
5. **Post-mortem:** Document incident and learnings

---

## Notes

- **Frequency:** Review this checklist before each major release
- **Owner:** Release Manager or Technical Lead
- **Updates:** Update checklist based on learnings from each release

---

**This checklist ensures consistent release quality and investor readiness.**
