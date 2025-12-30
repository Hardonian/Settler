# UX Interaction Specification

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** Active

## Overview

This document defines the interaction patterns, motion rules, and feedback mechanisms for the Settler application. All interactions must follow these specifications to ensure consistency, accessibility, and performance.

## Table of Contents

1. [Motion Rules](#motion-rules)
2. [State Machine Patterns](#state-machine-patterns)
3. [Feedback Mechanisms](#feedback-mechanisms)
4. [Accessibility Requirements](#accessibility-requirements)
5. [Performance Constraints](#performance-constraints)
6. [Interaction Surfaces](#interaction-surfaces)
7. [Error Handling](#error-handling)

---

## Motion Rules

### When Motion is Allowed

Motion is **allowed** for:
- **State transitions**: When UI reflects a state change (e.g., form submission → loading → success)
- **Page/route transitions**: When navigating between pages
- **Progressive disclosure**: When revealing content (accordions, modals, dropdowns)
- **Feedback**: Success, error, or attention-grabbing feedback
- **Entrance animations**: When content first appears (with intersection observer)

### When Motion is Forbidden

Motion is **forbidden** for:
- **Constant motion**: No infinite loops, pulsing, or continuous animation
- **Decorative only**: Motion that doesn't reflect state or provide feedback
- **Performance-critical areas**: Lists with 100+ items, real-time data streams
- **When user prefers reduced motion**: Always respect `prefers-reduced-motion`

### Motion Tokens

All motion must use tokens from `@/lib/motion/tokens`:
- **Durations**: `motionDurations` (fast: 0.1s, default: 0.2s, moderate: 0.3s, slow: 0.5s)
- **Easing**: `motionEasing` (easeOut, easeInOut, sharp)
- **Springs**: `motionSprings` (gentle, default, snappy, bouncy)
- **Distances**: `motionDistances` (small: 8px, default: 16px, large: 32px)

**Implementation**: See `packages/web/src/lib/motion/tokens.ts`

---

## State Machine Patterns

### When to Use State Machines

State machines are **required** for:
- **Multi-step flows**: Onboarding, wizards, setup processes
- **Form submissions**: Any form with validation and async submission
- **Async operations**: API calls, data fetching, file uploads
- **Complex interactions**: Multi-modal dialogs, multi-select operations

State machines are **optional** for:
- **Simple toggles**: Boolean state (use `useState` is fine)
- **Static content**: Display-only components

### Standard States

All async operations must use these states:
- `idle`: Initial state, ready for input
- `pending`: Operation in progress
- `success`: Operation completed successfully
- `error`: Operation failed

**Implementation**: See `packages/web/src/lib/xstate/types.ts`

### State Machine Conventions

1. **Context**: Keep flat, serializable, separate data/error
2. **Events**: Use UPPER_SNAKE_CASE, be specific
3. **Guards**: Pure functions, descriptive names
4. **Actions**: Use `assign()` for context updates
5. **Services**: Use `invoke` for async operations

**Implementation**: See `packages/web/src/lib/xstate/conventions.ts`

---

## Feedback Mechanisms

### Progress Feedback

**When**: Multi-step flows, long-running operations

**Implementation**:
- Use `Progress` component with percentage
- Show step indicators (e.g., "Step 2 of 5")
- Animate progress bar with `motionDurations.moderate`

**Example**: `packages/web/src/app/console/onboarding/page.tsx`

### Success Feedback

**When**: Operation completes successfully

**Implementation**:
- Toast notification (non-blocking)
- Success badge/icon (temporary, auto-dismiss)
- Subtle celebration animation (respect reduced motion)

**Animation**: Use `success` variant from `@/lib/motion/variants`

### Error Feedback

**When**: Operation fails, validation errors

**Implementation**:
- Alert component with clear message
- Inline validation errors (near input)
- Retry button (if applicable)
- Never block user from fixing error

**Animation**: Use `fadeUp` variant, no bounce/celebration

### Loading Feedback

**When**: Async operations, data fetching

**Implementation**:
- Spinner (for < 1s operations)
- Skeleton screens (for > 1s operations)
- Progress indicator (for known duration)
- Disable actions during loading

**Animation**: Use `motionDurations.slow` for spinner, no motion for skeleton

---

## Accessibility Requirements

### Keyboard Navigation

- **Tab order**: Logical, visible focus indicators
- **Enter/Space**: Activate buttons, submit forms
- **Escape**: Close modals, cancel operations
- **Arrow keys**: Navigate lists, tabs, menus

### Screen Readers

- **ARIA labels**: All interactive elements
- **ARIA live regions**: For dynamic content (toasts, errors)
- **ARIA states**: `aria-busy`, `aria-disabled`, `aria-invalid`
- **Semantic HTML**: Use proper elements (button, form, nav)

### Reduced Motion

- **Always check**: `prefers-reduced-motion` media query
- **Fallback**: Duration 0, no spring animations
- **Implementation**: Use `getReducedMotionDuration()` and `getReducedMotionSpring()`

### Focus Management

- **Focus trap**: In modals, dialogs
- **Focus restoration**: After closing modals
- **Visible focus**: Never remove focus indicators

---

## Performance Constraints

### Animation Performance

- **No layout thrash**: Use `transform` and `opacity` only
- **GPU acceleration**: Use `will-change` sparingly
- **Frame budget**: 60fps (16ms per frame)
- **Reduce complexity**: Simple animations over complex

### State Machine Performance

- **No infinite loops**: Machines must reach terminal states
- **Debounce inputs**: For validation, search
- **Cancel operations**: Allow cancellation of pending operations

### Rendering Performance

- **Virtualize lists**: 100+ items
- **Lazy load**: Below-fold content
- **Memoize**: Expensive computations

---

## Interaction Surfaces

### Navigation

**Files**: `packages/web/src/components/Navigation.tsx`

**Patterns**:
- Smooth transitions between routes
- Active state indication
- Mobile menu animation

**Motion**: `pageTransition` variant

### Forms and Inputs

**Files**: 
- `packages/web/src/app/signup/page.tsx`
- `packages/web/src/app/console/onboarding/page.tsx`

**Patterns**:
- Inline validation (on blur or submit)
- Loading state during submission
- Success/error feedback
- Disable submit during pending

**State Machine**: Required for forms with validation + async submission

### Onboarding / Setup / Wizards

**Files**: `packages/web/src/app/console/onboarding/page.tsx`

**Patterns**:
- Multi-step progression
- Back/forward navigation
- Progress indicator
- Step validation
- Skip optional steps

**State Machine**: Required (use XState)

**Motion**: `stepTransition` variant for step changes

### Dashboards, Lists, Cards

**Files**: 
- `packages/web/src/app/dashboard/page.tsx`
- `packages/web/src/app/console/page.tsx`

**Patterns**:
- Card hover effects (subtle)
- List item animations (stagger)
- Loading skeletons
- Empty states

**Motion**: `fadeUp` for cards, `staggerContainer` for lists

### Loading States

**Patterns**:
- Spinner for < 1s
- Skeleton for > 1s
- Progress bar for known duration
- Disable actions during loading

**Implementation**: See `packages/web/src/components/ui/data-loader.tsx`

### Empty States

**Patterns**:
- Clear message
- Action button (if applicable)
- Illustration (optional)

**Implementation**: See `packages/web/src/components/ui/empty-state.tsx`

### Error States

**Patterns**:
- Clear error message
- Retry button (if applicable)
- Helpful guidance
- Never block recovery

**Implementation**: See `packages/web/src/components/ui/error-state.tsx`

---

## Error Handling

### Error States in State Machines

All async operations must handle:
- **Network errors**: Timeout, connection failure
- **Validation errors**: Client-side validation
- **Server errors**: 4xx, 5xx responses
- **Timeout errors**: Long-running operations

### Error Recovery

- **Retry**: Allow retry for transient errors
- **Reset**: Allow reset to initial state
- **Partial recovery**: Save progress if possible

### Error Messages

- **User-friendly**: No technical jargon
- **Actionable**: Tell user what to do
- **Specific**: Not generic "Something went wrong"

---

## Implementation Checklist

When implementing a new interaction:

- [ ] Motion uses tokens from `@/lib/motion/tokens`
- [ ] Motion respects `prefers-reduced-motion`
- [ ] State machine used for multi-step/async flows
- [ ] Loading states disable actions
- [ ] Error states allow recovery
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Performance tested (60fps)
- [ ] No layout thrash
- [ ] Focus management correct

---

## Examples

### Example 1: Form Submission

**File**: `packages/web/src/app/ux-playground/page.tsx` (StateMachineDemo)

**Pattern**:
1. User fills form → `idle` state
2. User submits → `pending` state (disable inputs, show spinner)
3. Success → `success` state (show success message, allow reset)
4. Error → `error` state (show error, allow retry)

**State Machine**: `demoFormMachine` in `packages/web/src/lib/xstate/demo-machine.ts`

### Example 2: Multi-Step Flow

**File**: `packages/web/src/app/console/onboarding/page.tsx`

**Pattern**:
1. Show current step
2. Validate step
3. Allow back/forward navigation
4. Show progress indicator
5. Complete flow → redirect

**TODO**: Refactor to use XState (Phase 3)

---

## References

- Motion System: `packages/web/src/lib/motion/`
- State Machine System: `packages/web/src/lib/xstate/`
- Motion Components: `packages/web/src/components/motion/`
- Playground: `packages/web/src/app/ux-playground/`

---

## Changelog

- **2025-01-XX**: Initial specification
