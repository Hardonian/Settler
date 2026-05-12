# GitHub Workflow Tiers

This document defines the tiered workflow strategy for CI/CD.

## Tiers

### Tier 1: Required (Blocking)
These checks must pass before merge:
- `conflict-markers` - Ensures no unresolved merge conflicts
- `parity` - Core build/test validation
- `typecheck` - Type safety
- `security-baseline` - Critical security scans

### Tier 2: Advisory (Non-Blocking)
These run but don't block merges:
- `code-quality` - Linting, formatting
- `dependency-review` - Dependency audits
- `visual-regression` - UI tests (if configured)

### Tier 3: Scheduled/Nightly
Expensive audit suites run on schedule:
- Full security audits
- Performance benchmarks
- Comprehensive integration tests

## Main Branch Protection
Branch protection requires only Tier 1 checks to pass.
