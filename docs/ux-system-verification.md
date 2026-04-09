# UX System Verification Guide

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Active

## Overview

This document describes how to verify that the UX system is working correctly. Use this guide for:

- Development verification
- QA testing
- Production validation

## Verification Checklist

### Phase 1: Motion System

#### Motion Tokens

- [ ] Open `/ux-playground` route
- [ ] Navigate to "Motion Primitives" section
- [ ] Verify all buttons animate on hover (unless disabled)
- [ ] Verify cards animate on mount
- [ ] Verify reduced motion is respected (check browser settings)

**How to test reduced motion:**

1. Open browser DevTools
2. Run: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
3. Should return `true` if reduced motion is enabled
4. All animations should be disabled or duration = 0

#### Motion Primitives

- [ ] `AnimatedButton` - hover and tap animations work
- [ ] `AnimatedCard` - entrance animation works
- [ ] `Reveal` - scroll-triggered animations work
- [ ] `PageTransition` - route transitions work (if implemented)

**Files to check:**

- `packages/web/src/lib/motion/tokens.ts`
- `packages/web/src/lib/motion/variants.ts`
- `packages/web/src/components/motion/`

### Phase 2: State Machine System

#### XState Conventions

- [ ] Open `/ux-playground` route
- [ ] Navigate to "State Machine Demo" section
- [ ] Fill out form and submit
- [ ] Verify state transitions: idle → pending → success/error
- [ ] Verify retry works on error
- [ ] Verify reset works

**State Machine Demo:**

- File: `packages/web/src/app/ux-playground/page.tsx`
- Machine: `packages/web/src/lib/xstate/demo-machine.ts`

#### Onboarding Flow

- [ ] Navigate to `/console/onboarding`
- [ ] Create workspace (step 1)
- [ ] Verify state machine handles:
  - Form validation
  - Async workspace creation
  - Progress updates
  - Step transitions
- [ ] Test error handling (disconnect network, verify retry works)
- [ ] Test back/forward navigation (if implemented)

**Onboarding Machine:**

- File: `packages/web/src/lib/xstate/onboarding-machine.ts`
- Component: `packages/web/src/app/console/onboarding/page.tsx`

### Phase 3: Feedback Components

#### Progress Indicator

- [ ] Navigate to `/console/onboarding`
- [ ] Verify progress bar animates smoothly
- [ ] Verify step indicators show correct states
- [ ] Verify percentage updates correctly

**Component:** `packages/web/src/components/feedback/ProgressIndicator.tsx`

#### Success Toast

- [ ] Complete a step in onboarding
- [ ] Verify success toast appears
- [ ] Verify toast auto-dismisses after 3 seconds
- [ ] Verify celebration animation (if enabled)
- [ ] Verify reduced motion disables celebration

**Component:** `packages/web/src/components/feedback/SuccessToast.tsx`

#### Error Feedback

- [ ] Trigger an error (disconnect network, invalid input)
- [ ] Verify error message displays clearly
- [ ] Verify retry button works
- [ ] Verify helpful guidance is shown

**Component:** `packages/web/src/components/feedback/ErrorFeedback.tsx`

#### Achievement Badge

- [ ] Complete 50% of onboarding
- [ ] Verify achievement badge appears
- [ ] Verify badge auto-dismisses
- [ ] Verify celebration animation (tasteful, not gimmicky)

**Component:** `packages/web/src/components/feedback/AchievementBadge.tsx`

### Phase 4: Accessibility

#### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Verify Enter/Space activate buttons
- [ ] Verify Escape closes modals/toasts

#### Screen Readers

- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify ARIA labels are present
- [ ] Verify ARIA live regions announce changes
- [ ] Verify form errors are announced

#### Reduced Motion

- [ ] Enable reduced motion in OS settings
- [ ] Verify all animations are disabled or minimal
- [ ] Verify no constant motion
- [ ] Verify no layout thrash

### Phase 5: Performance

#### Animation Performance

- [ ] Open Chrome DevTools → Performance
- [ ] Record while interacting with animations
- [ ] Verify 60fps (16ms per frame)
- [ ] Verify no layout thrash (use `transform` and `opacity` only)

#### State Machine Performance

- [ ] Verify no infinite loops
- [ ] Verify machines reach terminal states
- [ ] Verify no memory leaks (check React DevTools)

### Phase 6: Error Handling

#### Network Errors

- [ ] Disconnect network
- [ ] Try to submit form
- [ ] Verify error message appears
- [ ] Verify retry works when network reconnects

#### Validation Errors

- [ ] Submit form with invalid data
- [ ] Verify inline validation errors appear
- [ ] Verify errors clear when fixed
- [ ] Verify form cannot be submitted with errors

#### Timeout Errors

- [ ] Simulate slow network (Chrome DevTools → Network → Slow 3G)
- [ ] Verify timeout handling (if implemented)
- [ ] Verify user can retry

## Testing Routes

### Internal Playground

- **Route:** `/ux-playground`
- **Purpose:** Verify motion and state machine patterns
- **Access:** Internal only (not public)

### Onboarding Flow

- **Route:** `/console/onboarding`
- **Purpose:** Real-world state machine implementation
- **Access:** Authenticated users

## Common Issues

### Issue: Animations not respecting reduced motion

**Solution:** Check that `getReducedMotionDuration()` and `getReducedMotionSpring()` are used

### Issue: State machine stuck in pending state

**Solution:** Check that `onDone` and `onError` handlers are defined for all `invoke` calls

### Issue: Feedback components not appearing

**Solution:** Check that state machine actions trigger component state updates

### Issue: Performance issues with animations

**Solution:** Verify animations use `transform` and `opacity` only, not layout properties

## Browser Support

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify touch interactions work
- [ ] Verify reduced motion works on mobile

## Automated Testing

Consider adding:

- [ ] E2E tests for state machine flows (Playwright)
- [ ] Visual regression tests for animations
- [ ] Accessibility tests (axe-core)

## Reporting Issues

When reporting issues, include:

1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Network conditions (if relevant)

---

## Quick Verification Script

Run this in browser console on `/ux-playground`:

```javascript
// Check motion tokens
console.log(
  "Motion tokens:",
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "Reduced" : "Normal"
);

// Check state machine
// (Navigate to State Machine Demo and fill form)

// Check feedback components
// (Complete steps in onboarding)
```

---

**Last Verified:** [Date]  
**Verified By:** [Name]
