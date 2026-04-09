# Data Architecture

**Phase 5 - Data Layer Architecture**  
**Last Updated:** Phase 5 Implementation

## Overview

The Settler web application uses a centralized, predictable data architecture built on **TanStack Query (React Query)** for server state management. This architecture ensures:

- **Consistent data fetching** across all components
- **Smart caching and invalidation** to minimize unnecessary requests
- **Clear separation** between server state and UI state
- **Type-safe** data access with TypeScript
- **Predictable data flow** that's easy to reason about and extend

## Architecture Layers

### 1. Data Access Layer (`/lib/data/`)

Pure functions that fetch data from APIs, databases, or external services. These functions:

- Are **not React hooks** - they're pure async functions
- Handle data fetching logic only
- Return typed data structures
- Can be used in Server Components, Route Handlers, or wrapped in hooks

**Example:**

```typescript
// lib/data/dashboard.ts
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  // ... fetch logic
  return metrics;
}
```

**Key Files:**

- `/lib/data/queryKeys.ts` - Centralized query key factory
- `/lib/data/dashboard.ts` - Dashboard metrics data access
- `/lib/data/jobs.ts` - Reconciliation jobs data access

### 2. Hooks Layer (`/lib/hooks/`)

React Query hooks that wrap data access functions. These hooks:

- Use TanStack Query for caching, loading states, error handling
- Expose consistent API: `{ data, isLoading, isError, error, refetch }`
- Handle query key management automatically
- Support dependent queries, enabled/disabled states

**Example:**

```typescript
// lib/hooks/use-dashboard.ts
export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: getDashboardMetrics,
    staleTime: 30 * 1000,
  });
}
```

**Key Hooks:**

- `useDashboardMetrics()` - Dashboard metrics
- `useExternalMetrics()` - GitHub/NPM metrics
- `useJobs()` - Reconciliation jobs
- `useRealtimeExecution()` - Real-time execution updates (EventSource)

### 3. UI Components Layer

Components that consume hooks and render data. Use standardized loading/error/empty components:

- `<DataLoader />` - Handles loading, error, and empty states
- `<ErrorState />` - Reusable error display
- `<EmptyState />` - Reusable empty state display

**Example:**

```typescript
const metricsQuery = useDashboardMetrics();

return (
  <DataLoader
    query={metricsQuery}
    isEmpty={(data) => data.totalPosts === 0}
  >
    {(data) => <DashboardView metrics={data} />}
  </DataLoader>
);
```

## State Management Strategy

### Server State (TanStack Query)

**What it is:**

- Data fetched from APIs, databases, external services
- Data that can be cached, invalidated, refetched
- Data shared across multiple components

**How to use:**

- Use hooks from `/lib/hooks/`
- Never use `useState` + `useEffect` for server data
- Let React Query handle caching, loading, errors

**Examples:**

- Dashboard metrics
- User profiles
- Reconciliation jobs
- Posts/community data

### UI/Local State (React useState)

**What it is:**

- Component-local state (modals, toggles, form inputs)
- State that doesn't need to be shared
- State that doesn't come from a server

**How to use:**

- Use `useState` for simple local state
- Use `useReducer` for complex local state
- Keep it minimal - prefer server state when possible

**Examples:**

- Modal open/close state
- Form input values (before submission)
- UI toggles (dark mode, sidebar)
- Current tab selection

### Global UI State (Future: Zustand if needed)

**When to use:**

- UI state that needs to be shared across many components
- Multi-step workflows (onboarding, wizards)
- Complex UI state that doesn't belong in server state

**Current status:** Not yet needed. If needed, we'll add Zustand for global UI state only.

## Query Keys

Query keys are centralized in `/lib/data/queryKeys.ts` using a factory pattern:

```typescript
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    metrics: () => ["dashboard", "metrics"] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (filters?) => ["jobs", "list", filters] as const,
    detail: (id: string) => ["jobs", id] as const,
  },
};
```

**Benefits:**

- Type-safe query keys
- Consistent naming
- Easy invalidation: `queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })`
- Prevents typos and inconsistencies

## Caching Strategy

### Default Configuration

Configured in `/lib/providers/query-provider.tsx`:

```typescript
{
  staleTime: 30 * 1000,        // 30 seconds - data is fresh
  gcTime: 5 * 60 * 1000,      // 5 minutes - cache retention
  refetchOnWindowFocus: false, // Don't refetch on focus
  retry: 1,                    // Retry failed requests once
}
```

### Per-Query Configuration

Override defaults per query:

```typescript
useQuery({
  queryKey: queryKeys.dashboard.metrics(),
  queryFn: getDashboardMetrics,
  staleTime: 60 * 1000, // 1 minute for this specific query
});
```

### Cache Invalidation

Invalidate queries when data changes:

```typescript
// After creating a job
const mutation = useMutation({
  mutationFn: createJob,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
  },
});
```

## Server Components vs Client Components

### Server Components (Next.js App Router)

**Use for:**

- Initial data fetching (SEO, performance)
- Static or infrequently changing data
- Data that doesn't need real-time updates

**Pattern:**

```typescript
// app/dashboard/page.tsx (Server Component)
async function DashboardMetrics() {
  const metrics = await getDashboardMetrics(); // Direct call
  return <DashboardView metrics={metrics} />;
}
```

**Benefits:**

- No client-side JavaScript needed
- Faster initial load
- Better SEO

### Client Components + React Query

**Use for:**

- Data that needs real-time updates
- Interactive data (filters, pagination)
- Data that changes frequently

**Pattern:**

```typescript
// app/dashboard/page.tsx (Client Component)
'use client';
export default function Dashboard() {
  const { data } = useDashboardMetrics(); // React Query hook
  return <DashboardView metrics={data} />;
}
```

**Benefits:**

- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

## Data Flow

### Fetching Data

1. **Component** calls hook: `useDashboardMetrics()`
2. **Hook** uses React Query: `useQuery({ queryKey, queryFn })`
3. **Query function** calls data access: `getDashboardMetrics()`
4. **Data access** fetches from API/DB: `supabase.from('...').select()`
5. **Data flows back** through layers to component

### Updating Data

1. **Component** calls mutation hook: `useCreateJob()`
2. **Mutation** sends request: `createJob(data)`
3. **On success**, invalidate queries: `queryClient.invalidateQueries(...)`
4. **React Query** refetches affected queries automatically
5. **Components** update with new data

## Error Handling

### Standardized Error States

All hooks expose consistent error handling:

```typescript
const { data, isLoading, isError, error } = useDashboardMetrics();

if (isError) {
  return <ErrorState error={error} onRetry={() => refetch()} />;
}
```

### Error Boundaries

Use React Error Boundaries for unexpected errors:

```typescript
<ErrorBoundary componentName="Dashboard">
  <DashboardContent />
</ErrorBoundary>
```

## Performance Considerations

### Avoid Over-Fetching

- Use dependent queries: only fetch when required data is available
- Use selectors to transform data: `select: (data) => data.items`
- Combine requests where logical

### Avoid Over-Rendering

- Use `select` option to subscribe to specific data slices
- Use `useMemo` for expensive transformations
- Keep components small and focused

### Cache Optimization

- Set appropriate `staleTime` per query type
- Use `gcTime` to control cache retention
- Invalidate strategically, not excessively

## Migration Guide

### Before (Anti-Pattern)

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch("/api/data")
    .then((res) => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

### After (Correct Pattern)

```typescript
const { data, isLoading, isError, error } = useData();
```

## Best Practices

1. **Always use hooks** for server data - never `useState` + `useEffect`
2. **Centralize data access** - all API calls in `/lib/data/`
3. **Use query keys** - always use the factory from `queryKeys`
4. **Handle loading/error states** - use `<DataLoader />` component
5. **Invalidate on mutations** - keep cache in sync
6. **Type everything** - use TypeScript interfaces for all data shapes
7. **Document data shapes** - see `/docs/api-contracts.md`

## Future Enhancements

- [ ] Add mutation hooks for create/update/delete operations
- [ ] Implement optimistic updates for better UX
- [ ] Add query prefetching for navigation
- [ ] Consider Zustand for complex global UI state
- [ ] Add data transformation layer for API response normalization

## Related Documentation

- `/docs/data-architecture-initial.md` - Initial assessment
- `/docs/state-patterns.md` - Detailed state management patterns
- `/docs/api-contracts.md` - API contracts and data shapes
