# Ops Intelligence Library

Utilities and helpers for the Ops Intelligence system.

## Modules

### Constants (`constants.ts`)
Centralized constants for thresholds, limits, and configuration.

### Utils (`utils.ts`)
Helper functions for validation, formatting, debouncing, and retry logic.

### Cache (`cache.ts`)
In-memory cache with TTL for API responses.

## Usage

```typescript
import { cache, CACHE_TTL_INSIGHTS } from '@/lib/ops-intelligence';
import { debounce, retryWithBackoff, formatConfidence } from '@/lib/ops-intelligence/utils';
import { DEFAULT_PAGE_SIZE, COST_SPIKE_THRESHOLD_PERCENT } from '@/lib/ops-intelligence/constants';
```

## Performance

- Cache TTL: 5 minutes for insights, 15 minutes for briefings
- Debounce delay: 300ms for filters
- Retry attempts: 3 with exponential backoff
- API timeout: 30 seconds
