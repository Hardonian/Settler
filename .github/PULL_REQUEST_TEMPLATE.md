# Pull Request

## Description

<!-- Describe your changes in detail -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Security fix

## Work Classification

> Per [CONTRIBUTING.md](../../CONTRIBUTING.md), label this PR as one of:

- [ ] **Maintenance** — cosmetic, polish, or consistency work
- [ ] **Leverage** — improves operator throughput, verification confidence, release safety, or contract coherence
- [ ] **Moat** — compounds reconciliation intelligence, evidence depth, policy memory, or audit trust

## Tenant & Security Impact

- [ ] This change has NO impact on tenant isolation or security boundaries
- [ ] This change affects tenant-scoped code — `pnpm run verify:tenant` and `pnpm run test:cross-tenant` pass

## CI Verification Checklist

**⚠️ CI MUST PASS BEFORE MERGE**

- [ ] CI link: (paste link to CI run after pushing)
- [ ] ✅ Repository integrity check passed (`repo-integrity`)
- [ ] ✅ Lint and typecheck passed
- [ ] ✅ Tests passed
- [ ] ✅ Build succeeded
- [ ] ✅ Vercel parity check passed (`vercel:parity`)
- [ ] ✅ Canonical production check passed (`check:production`)
- [ ] ✅ No workspace drift detected
- [ ] ✅ No phantom package references
- [ ] ✅ All scripts reference valid files

## Testing

<!-- Describe how you tested your changes -->

- [ ] Local testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing completed

## Deployment Notes

<!-- Any special considerations for deployment? -->

- [ ] Environment variables documented (if new ones added)
- [ ] Database migrations included (if applicable)
- [ ] Breaking changes documented
- [ ] Rollback plan considered

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if applicable)
- [ ] No console.logs or debug code left behind
- [ ] No secrets or sensitive data committed

## Related Issues

<!-- Link related issues -->

Closes #

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

---

**Remember:**

- CI green = merge allowed ✅
- CI red = merge impossible ❌
- Never merge with failing CI checks
