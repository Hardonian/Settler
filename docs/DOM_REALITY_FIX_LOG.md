# DOM Reality Fix Log

This document tracks fixes applied to resolve DOM rendering issues identified during DOM reality inspections.

## Format

Each entry follows this format:

```markdown
### [Date] - [Route] - [Issue Type]

**Issue**: Brief description
**Root Cause**: What caused the issue
**Fix**: What was changed
**Files Changed**: List of files modified
**Verification**: How to verify the fix works
```

---

## Fixes Applied

### 2025-01-XX - Homepage - Skip-to-main link visibility

**Issue**: Skip-to-main link was not properly hidden by default
**Root Cause**: CSS class `.skip-to-main` needed proper styling
**Fix**: Ensured skip-to-main link is visually hidden but focusable
**Files Changed**: 
- `packages/web/src/app/globals.css`
- `packages/web/src/app/layout.tsx`
**Verification**: 
- Link should be invisible by default
- Link should appear on focus (Tab key)
- Link should navigate to #main-content

---

## Pending Fixes

*No pending fixes at this time*

---

## Known Issues (Not Yet Fixed)

*No known issues at this time*

---

## CSS Invariants to Enforce

The following CSS patterns should be enforced to prevent regression:

1. **Skip-to-main links**: Must use `.skip-to-main` class with proper visibility styles
2. **Hidden content**: Use `aria-hidden="true"` for intentionally hidden content
3. **Responsive containers**: Use `overflow-x: hidden` on body/html to prevent horizontal scroll
4. **Flex/Grid containers**: Set `min-height` or ensure content fills container
5. **Dynamic imports**: Always provide loading states for client-only components

## Test Coverage Added

- DOM reality enforcement tests (`tests/e2e/dom-reality-enforcement.spec.ts`)
- Frontend reality gates (`tests/e2e/frontend-reality-gates.spec.ts`)
- Visual regression tests (`tests/e2e/visual.spec.ts`)
- Accessibility tests (`tests/e2e/a11y.spec.ts`)

## Guardrails Introduced

1. **Pre-commit hooks**: Run linting and formatting
2. **CI checks**: DOM reality tests must pass
3. **Visual regression**: Screenshot comparisons on critical routes
4. **Accessibility**: Axe-core scans on all pages
5. **Performance**: Core Web Vitals monitoring
