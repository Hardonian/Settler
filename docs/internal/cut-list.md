# Cut List

**Generated:** 2025-12-24  
**Purpose:** Document what was removed and why it didn't support reality

## What Was Cut

### Nothing Yet - This Is a Baseline

This document tracks what gets removed in future cleanup passes. The current transformation focused on:
1. **Adding** centralized entitlements (not removing old code yet)
2. **Adding** value ledger (not removing old metrics yet)
3. **Adding** moat (rules engine)
4. **Fixing** fail-open subscription gates

## Future Cleanup Candidates

### Duplicate Subscription Checks
- **Location**: Multiple files check subscription status
- **Why**: Scattered logic, hard to maintain
- **Action**: Migrate all to `packages/web/src/lib/entitlements/index.ts`
- **Status**: Not yet done - old code still exists for backward compatibility

### Unused Pricing Components
- **Location**: `packages/web/src/components/pricing/`
- **Why**: May have experimental pricing components not used
- **Action**: Audit and remove unused components
- **Status**: Not yet audited

### Dead Routes
- **Location**: `packages/web/src/app/`
- **Why**: May have routes that don't work or aren't linked
- **Action**: Run `npm run qa:routes` and check for dead links
- **Status**: Not yet checked

### Speculative Copy
- **Location**: Marketing pages, docs
- **Why**: Claims features that don't exist
- **Action**: Audit against implemented features
- **Status**: Not yet audited

## What Becomes Later

### Old Subscription Logic
- **Becomes**: Deprecated, then removed after migration period
- **Timeline**: After all code paths use entitlements system

### Experimental Pricing Components
- **Becomes**: Archived if unused, or integrated if valuable
- **Timeline**: After pricing page audit

## Notes

- **Conservative approach**: Don't break existing functionality
- **Migration period**: Old code exists alongside new code during transition
- **Verification**: All cuts must pass `npm run qa:reality` before removal
