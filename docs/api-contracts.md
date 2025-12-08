# API Contracts & Data Shapes

**Phase 5 - API Contracts Documentation**  
**Last Updated:** Phase 5 Implementation

## Overview

This document defines the data shapes, types, and API contracts used throughout the Settler web application. All data structures are typed with TypeScript.

## Entity Types

### Dashboard Metrics

**Type:** `DashboardMetrics`

**Source:** `/lib/data/dashboard.ts`

```typescript
interface DashboardMetrics {
  newUsersWeek: number;
  actionsLastHour: number;
  topPostEngagement: number;
  topPostTitle: string;
  totalPosts: number;
  totalProfiles: number;
  allCylindersFiring: boolean;
}
```

**Usage:**
```typescript
const { data } = useDashboardMetrics();
// data: DashboardMetrics
```

### External Metrics

**Type:** `ExternalMetrics`

**Source:** `/lib/data/dashboard.ts`

```typescript
interface ExternalMetrics {
  github: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    lastUpdated: string; // ISO date string
  };
  npm: {
    downloads: number;
    version: string;
    lastUpdated: string; // ISO date string
  };
  timestamp: string; // ISO date string
}
```

**Usage:**
```typescript
const { data } = useExternalMetrics();
// data: ExternalMetrics
```

### Reconciliation Job

**Type:** `Job`

**Source:** `/lib/data/jobs.ts`

```typescript
interface Job {
  id: string;
  name: string;
  source: unknown; // Adapter-specific configuration
  createdAt?: string; // ISO date string
}
```

**Usage:**
```typescript
const { data } = useJobs({ apiKey, limit: 10 });
// data: Job[]
```

### Execution Update

**Type:** `ExecutionUpdate`

**Source:** `/lib/hooks/use-realtime-execution.ts`

```typescript
interface ExecutionUpdate {
  type: string;
  executionId?: string;
  status?: 'running' | 'completed' | 'failed';
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  error?: string;
  summary?: {
    total_source_records?: number;
    total_target_records?: number;
    matched_count?: number;
    unmatched_source_count?: number;
    unmatched_target_count?: number;
    errors_count?: number;
    accuracy_percentage?: number;
  };
}
```

**Usage:**
```typescript
const { execution } = useRealtimeExecution({ jobId, apiKey });
// execution: ExecutionUpdate | null
```

### KPI Health Data

**Type:** `KpiHealthData`

**Source:** `/lib/data/dashboard.ts`

```typescript
interface KpiHealthData {
  new_users_week: number;
  actions_last_hour: number;
  top_post_engagement: number;
  all_cylinders_firing: boolean;
}
```

**Note:** This comes from a Supabase RPC function `get_kpi_health_status()`.

### Top Post

**Type:** `TopPost`

**Source:** `/lib/data/dashboard.ts`

```typescript
interface TopPost {
  id: string;
  title: string;
  views: number;
  upvotes: number;
}
```

## Query Keys

All query keys are defined in `/lib/data/queryKeys.ts`:

```typescript
export const queryKeys = {
  user: {
    all: ['user'] as const,
    detail: (id: string) => ['user', id] as const,
    current: () => ['user', 'current'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    metrics: () => ['dashboard', 'metrics'] as const,
    kpiHealth: () => ['dashboard', 'kpi-health'] as const,
    externalMetrics: () => ['dashboard', 'external-metrics'] as const,
  },
  activity: {
    all: ['activity'] as const,
    list: (filters?: { since?: string }) => ['activity', 'list', filters] as const,
    recent: (hours?: number) => ['activity', 'recent', hours] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (filters?: { status?: string; limit?: number }) => ['posts', 'list', filters] as const,
    detail: (id: string) => ['posts', id] as const,
    topEngaged: (date?: string) => ['posts', 'top-engaged', date] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    list: (filters?: { since?: string }) => ['profiles', 'list', filters] as const,
    count: (filters?: { since?: string }) => ['profiles', 'count', filters] as const,
  },
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: { limit?: number; status?: string }) => ['jobs', 'list', filters] as const,
    detail: (id: string) => ['jobs', id] as const,
    execution: (jobId: string) => ['jobs', jobId, 'execution'] as const,
  },
  settings: {
    all: ['settings'] as const,
    current: () => ['settings', 'current'] as const,
  },
};
```

## Data Access Functions

### Dashboard

**File:** `/lib/data/dashboard.ts`

#### `getDashboardMetrics()`

**Returns:** `Promise<DashboardMetrics>`

**Description:** Fetches dashboard metrics from Supabase, including user counts, activity counts, and post engagement metrics.

**Error Handling:** Returns default values (0) if queries fail, logs warnings.

#### `getExternalMetricsData()`

**Returns:** `Promise<ExternalMetrics>`

**Description:** Fetches external metrics from GitHub and NPM APIs.

**Error Handling:** Returns fallback data with zeros if API calls fail.

### Jobs

**File:** `/lib/data/jobs.ts`

#### `getJobs(apiKey: string, options?: { limit?: number })`

**Returns:** `Promise<Job[]>`

**Description:** Fetches reconciliation jobs using the Settler SDK.

**Parameters:**
- `apiKey`: API key for authentication
- `options.limit`: Maximum number of jobs to fetch (default: 10)

**Error Handling:** Throws errors from SDK, should be caught by React Query.

## Hooks API

### `useDashboardMetrics()`

**File:** `/lib/hooks/use-dashboard.ts`

**Returns:** `UseQueryResult<DashboardMetrics>`

**Query Key:** `['dashboard', 'metrics']`

**Stale Time:** 30 seconds

**Example:**
```typescript
const { data, isLoading, isError, error } = useDashboardMetrics();
```

### `useExternalMetrics()`

**File:** `/lib/hooks/use-dashboard.ts`

**Returns:** `UseQueryResult<ExternalMetrics>`

**Query Key:** `['dashboard', 'external-metrics']`

**Stale Time:** 5 minutes

**Example:**
```typescript
const { data, isLoading, isError, error } = useExternalMetrics();
```

### `useJobs(options)`

**File:** `/lib/hooks/use-jobs.ts`

**Parameters:**
```typescript
interface UseJobsOptions {
  apiKey: string;
  limit?: number;
  enabled?: boolean;
}
```

**Returns:** `UseQueryResult<Job[]>`

**Query Key:** `['jobs', 'list', { limit }]`

**Stale Time:** 10 seconds

**Example:**
```typescript
const { data, isLoading, isError, error, refetch } = useJobs({
  apiKey: '...',
  limit: 10,
  enabled: true,
});
```

### `useRealtimeExecution(options)`

**File:** `/lib/hooks/use-realtime-execution.ts`

**Parameters:**
```typescript
interface UseRealtimeExecutionOptions {
  jobId: string;
  apiKey: string;
  enabled?: boolean;
  onUpdate?: (update: ExecutionUpdate) => void;
  onError?: (error: Error) => void;
}
```

**Returns:**
```typescript
interface UseRealtimeExecutionResult {
  connected: boolean;
  execution: ExecutionUpdate | null;
  logs: string[];
  errors: string[];
  reconnect: () => void;
  disconnect: () => void;
}
```

**Description:** Manages real-time execution updates via EventSource. This is a special case that doesn't use React Query.

**Example:**
```typescript
const { connected, execution, logs, errors } = useRealtimeExecution({
  jobId: '...',
  apiKey: '...',
  enabled: true,
});
```

## Supabase Tables

### `profiles`

**Columns:**
- `id`: UUID (primary key)
- `created_at`: Timestamp
- Other profile fields...

**Queries:**
- Count new users: `supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', since)`

### `activity_log`

**Columns:**
- `id`: UUID (primary key)
- `created_at`: Timestamp
- Other activity fields...

**Queries:**
- Count recent activity: `supabase.from('activity_log').select('*', { count: 'exact', head: true }).gte('created_at', since)`

### `posts`

**Columns:**
- `id`: UUID (primary key)
- `title`: String
- `views`: Number
- `upvotes`: Number
- `status`: String ('published', etc.)
- `created_at`: Timestamp

**Queries:**
- List posts: `supabase.from('posts').select('id, title, views, upvotes').eq('status', 'published')`

## External APIs

### GitHub API

**Endpoint:** Configured in `/lib/api/external.ts`

**Returns:**
```typescript
{
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
}
```

### NPM Registry API

**Endpoint:** Configured in `/lib/api/external.ts`

**Returns:**
```typescript
{
  downloads: number;
  version: string;
}
```

## Error Shapes

### React Query Error

**Type:** `Error` or custom error type

**Structure:**
```typescript
{
  message: string;
  // ... other error properties
}
```

**Handling:**
```typescript
const { isError, error } = useQuery(...);
if (isError) {
  // error is Error | null
  console.error(error?.message);
}
```

## Type Safety

All data shapes are typed with TypeScript. When adding new data:

1. **Define the interface** in the data access file
2. **Export the type** for reuse
3. **Type the hook return** value
4. **Type the query function** return value

**Example:**
```typescript
// lib/data/example.ts
export interface ExampleData {
  id: string;
  name: string;
}

export async function getExampleData(): Promise<ExampleData> {
  // ...
}

// lib/hooks/use-example.ts
export function useExampleData() {
  return useQuery<ExampleData>({
    queryKey: queryKeys.example.all(),
    queryFn: getExampleData,
  });
}
```

## Future API Contracts

As new features are added, document:

1. **New entity types** - Add to this file
2. **New query keys** - Add to `queryKeys.ts`
3. **New hooks** - Document parameters and return types
4. **New mutations** - Document request/response shapes
5. **New endpoints** - Document URL, method, request/response

## Related Documentation

- `/docs/data-architecture.md` - Overall data architecture
- `/docs/state-patterns.md` - State management patterns
- `/lib/data/queryKeys.ts` - Query key definitions
- `/lib/data/*.ts` - Data access function implementations
