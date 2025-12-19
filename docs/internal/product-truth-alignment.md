# Product Truth Alignment - Phase 2

**Date**: 2025-01-XX  
**Purpose**: Ensure marketing, console UI, onboarding, and docs align with core invariant.

## Core Invariant

**"Reconciliation is a system behavior, not a human task."**

## Language Rules

### ✅ CORRECT Language
- "Reconciliation happens automatically"
- "Continuous reconciliation"
- "System-native behavior"
- "Exception supervision" (not "manual review")
- "The old way is structurally broken" (not "inefficient")

### ❌ INCORRECT Language
- "Configure reconciliation"
- "Set up reconciliation"
- "Manual reconciliation"
- "You need to..."
- "You must configure..."
- "Tuning reconciliation"
- "User-managed logic"

## Changes Made

### Landing Page (`/app/page.tsx`)
- ✅ Changed "Save hours of manual work" → "No configuration, no manual work—just continuous matching"
- ✅ Updated code example to emphasize automatic behavior
- ✅ Changed "jobs" → "reconciliations" in user-facing text

### Console Pages
- ✅ Removed all mock data
- ✅ Changed "jobs" → "reconciliation runs" or "reconciliations"
- ✅ Removed "coming soon" placeholders

### Admin Pages
- ✅ Removed "coming soon" pages
- ✅ Redirected to functional alternatives

## Remaining Issues

### API Terminology
- **Issue**: API still uses `.jobs.create()` instead of `.reconciliations.create()`
- **Impact**: Code examples expose "job" concept
- **Action**: Consider API refactor (breaking change) or update examples to use wrapper

### Marketing Docs
- **Issue**: `/marketing/customer-acquisition-kit/website-getting-started.md` still uses:
  - "Create Your First Reconciliation Job"
  - "Configure matching rules"
  - "More Coming Soon"
- **Action**: Update to emphasize automatic behavior

### Onboarding Flow
- **Issue**: May still imply configuration burden
- **Action**: Audit onboarding to ensure zero-configuration path exists

## Success Criteria

- [ ] No language implies manual setup burden
- [ ] No language implies constant tuning
- [ ] No language implies user-managed logic
- [ ] All copy emphasizes continuous reconciliation
- [ ] All copy emphasizes exception supervision
- [ ] All copy emphasizes system-native behavior
