# Release Readiness Checklist

**Last Updated:** January 2026  
**Purpose:** Use this checklist before every release to ensure enterprise-grade quality and investor readiness.

---

## Pre-Release Checklist

### Documentation

- [ ] **README.md** updated with latest features and changes
- [ ] **CHANGELOG.md** updated with all changes (following conventional commits)
- [ ] **SECURITY.md** reviewed and updated if needed
- [ ] **CONTRIBUTING.md** reviewed and updated if needed
- [ ] **docs/** directory reviewed for accuracy and completeness
- [ ] All documentation links verified (no broken links)
- [ ] Terminology consistent across all docs (check `/TERMINOLOGY.md`)

### Legal & Licensing

- [ ] **LICENSE** file present and matches README claims
- [ ] **LEGAL/** documents reviewed for consistency
- [ ] Terms of Service, Privacy Policy, Commercial License aligned
- [ ] No contradictions between legal documents
- [ ] Jurisdiction specified in legal documents (not placeholder)
- [ ] OSS vs Platform boundary clearly documented (`/docs/LICENSING_OVERVIEW.md`)

### Security

- [ ] **SECURITY.md** reviewed and up-to-date
- [ ] Vulnerability reporting process documented
- [ ] No secrets in repository (run secret scanning)
- [ ] `.gitignore` covers all secret patterns
- [ ] `.env.example` or `.env.template` comprehensive and up-to-date
- [ ] Dependencies audited (`npm audit`)
- [ ] Security headers configured correctly
- [ ] RLS policies reviewed and tested
- [ ] Webhook verification implemented (if applicable)

### Build & CI/CD

- [ ] **Clean install** works (`rm -rf node_modules && npm install`)
- [ ] **Lint** passes (`npm run lint`)
- [ ] **Typecheck** passes (`npm run typecheck`)
- [ ] **Build** succeeds (`npm run build`)
- [ ] **Tests** pass (`npm run test` if exists)
- [ ] **CI/CD** workflows pass (GitHub Actions)
- [ ] **Vercel** build succeeds (if applicable)
- [ ] Node version pinned (`.nvmrc` or `package.json` engines)
- [ ] Package manager pinned (`package.json` packageManager)

### Code Quality

- [ ] No dead code (unused imports, functions, files)
- [ ] No commented-out code (unless explicitly marked "preserve")
- [ ] Error handling consistent (no silent failures)
- [ ] Error boundaries in place (React components)
- [ ] Graceful degradation patterns implemented
- [ ] No hard-coded configuration values
- [ ] Environment variables properly validated
- [ ] Logging hygiene (no PII in logs)

### Database & Migrations

- [ ] **Migrations** reviewed and tested
- [ ] Migration order correct (no conflicts)
- [ ] No destructive migrations without warnings
- [ ] Rollback procedures documented (`/docs/DATABASE.md`)
- [ ] Schema changes documented
- [ ] RLS policies tested
- [ ] Indexes optimized (no missing critical indexes)

### Testing

- [ ] **Unit tests** pass (if exists)
- [ ] **Integration tests** pass (if exists)
- [ ] **E2E tests** pass (if exists)
- [ ] **Smoke tests** pass (`npm run test:smoke`)
- [ ] Test coverage maintained (target: 70%+ for critical paths)
- [ ] Critical user journeys tested manually

### Performance

- [ ] **Build time** acceptable (< 5 minutes for full build)
- [ ] **Bundle size** optimized (no unnecessary dependencies)
- [ ] **API response times** acceptable (< 200ms p95)
- [ ] **Database queries** optimized (no N+1 queries)
- [ ] **Caching** implemented where appropriate
- [ ] **CDN** configured (if applicable)

### Monitoring & Observability

- [ ] **Error tracking** configured (Sentry or similar)
- [ ] **Logging** configured (structured logs)
- [ ] **Metrics** configured (API metrics, business metrics)
- [ ] **Alerts** configured for critical errors
- [ ] **Health checks** implemented (`/api/health`)
- [ ] **Status page** updated (if applicable)

### Deployment

- [ ] **Environment variables** documented (`/docs/CONFIGURATION.md`)
- [ ] **Deployment guide** updated (`/docs/DEPLOYMENT.md`)
- [ ] **Rollback plan** documented
- [ ] **Database migrations** tested in staging
- [ ] **Feature flags** configured (if applicable)
- [ ] **Backup** procedures verified

### Compliance

- [ ] **GDPR** compliance verified (if applicable)
- [ ] **SOC 2** controls verified (if applicable)
- [ ] **PCI-DSS** compliance verified (if applicable)
- [ ] **Data retention** policies implemented
- [ ] **Privacy policy** reviewed and updated
- [ ] **Terms of service** reviewed and updated

### Investor Readiness

- [ ] **Investor documentation** reviewed (`/docs/investor/`)
- [ ] **Positioning** clear (`/docs/investor/POSITIONING.md`)
- [ ] **Business model** documented
- [ ] **Competitive advantages** clear
- [ ] **Risk mitigations** documented
- [ ] **Roadmap** public-safe and up-to-date

---

## Post-Release Checklist

### Immediate (Within 24 Hours)

- [ ] **Monitor** error rates and alerts
- [ ] **Verify** critical user journeys work
- [ ] **Check** performance metrics
- [ ] **Review** user feedback (support tickets, GitHub issues)
- [ ] **Update** status page (if applicable)

### Short-Term (Within 1 Week)

- [ ] **Review** analytics and usage metrics
- [ ] **Gather** user feedback
- [ ] **Document** any issues or improvements needed
- [ ] **Plan** next release based on feedback

### Long-Term (Within 1 Month)

- [ ] **Review** release metrics (adoption, errors, performance)
- [ ] **Update** documentation based on user feedback
- [ ] **Plan** next major release
- [ ] **Review** and update this checklist if needed

---

## Release Process

### 1. Pre-Release (1 Week Before)

- [ ] Complete pre-release checklist above
- [ ] Create release branch (`release/vX.Y.Z`)
- [ ] Update CHANGELOG.md
- [ ] Update version numbers (if applicable)
- [ ] Run full test suite
- [ ] Deploy to staging environment

### 2. Release Day

- [ ] Final review of checklist
- [ ] Merge release branch to main
- [ ] Tag release (`git tag vX.Y.Z`)
- [ ] Push tags (`git push --tags`)
- [ ] Deploy to production
- [ ] Verify deployment (health checks, smoke tests)
- [ ] Announce release (if applicable)

### 3. Post-Release

- [ ] Complete post-release checklist above
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Plan next release

---

## Emergency Release Process

For critical security fixes or urgent bug fixes:

1. **Assess** severity and impact
2. **Create** hotfix branch (`hotfix/vX.Y.Z`)
3. **Fix** issue and add tests
4. **Update** CHANGELOG.md
5. **Review** with team (if time permits)
6. **Deploy** to production
7. **Monitor** closely
8. **Follow up** with full release process

---

## Quality Gates

**Release is NOT ready if:**

- ❌ Any critical security vulnerabilities exist
- ❌ Build fails
- ❌ Tests fail
- ❌ Documentation is incomplete or inaccurate
- ❌ Legal documents have contradictions
- ❌ Secrets are exposed
- ❌ Critical user journeys broken
- ❌ Performance degradation > 20%

**Release IS ready if:**

- ✅ All checklist items completed
- ✅ All quality gates passed
- ✅ Team approval (if required)
- ✅ Stakeholder sign-off (if required)

---

## Questions?

**Release Process:** See `/docs/OPERATIONS_RUNBOOK.md`  
**Deployment:** See `/docs/DEPLOYMENT.md`  
**Security:** See `/SECURITY.md`

---

**This checklist is a living document. Update it based on lessons learned from each release.**
