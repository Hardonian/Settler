# State Management Patterns

**Phase 5 - State Patterns Guide**  
**Last Updated:** Phase 5 Implementation

## Overview

This document describes the patterns and conventions for managing state in the Settler web application. We follow a clear separation between server state and UI state.

## State Categories

### 1. Server State

**Definition:** Data that comes from APIs, databases, or external services.

**Characteristics:**
- Can be cached
- Can be invalidated
- Can be refetched
- Shared across components
- Changes based on server updates

**Management:** TanStack Query (React Query)

**Examples:**
- Dashboard metrics
- User profiles
- Reconciliation jobs
- Posts/community data
- Settings

### 2. UI/Local State

**Definition:** State that controls UI behavior and doesn't come from a server.

**Characteristics:**
- Component-specific
- Doesn't need caching
- Doesn't need invalidation
- Usually temporary (modal open/close, form inputs)

**Management:** React `useState` or `useReducer`

**Examples:**
- Modal open/close
- Form input values
- UI toggles (sidebar, dropdowns)
- Current tab selection
- Accordion expanded state

### 3. Global UI State (Future)

**Definition:** UI state that needs to be shared across many components.

**When to use:**
- Multi-step workflows (onboarding, wizards)
- Complex UI state that spans multiple pages
- State that doesn't fit server state but needs to be global

**Management:** Zustand (if/when needed)

**Examples:**
- Onboarding progress
- Multi-step form state
- Global UI preferences (not persisted)

## Patterns

### Pattern 1: Server State with React Query

**When to use:** Fetching data from APIs/databases

**Pattern:**
```typescript
// 1. Data access function (lib/data/example.ts)
export async function getExampleData(): Promise<ExampleData> {
  const supabase = await createClient();
  const { data } = await supabase.from('table').select();
  return data;
}

// 2. Hook (lib/hooks/use-example.ts)
export function useExampleData() {
  return useQuery({
    queryKey: queryKeys.example.all(),
    queryFn: getExampleData,
  });
}

// 3. Component usage
export default function ExampleComponent() {
  const { data, isLoading, isError } = useExampleData();
  
  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;
  
  return <div>{data}</div>;
}
```

### Pattern 2: Local UI State

**When to use:** Component-specific UI state

**Pattern:**
```typescript
export default function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && <ModalContent onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

### Pattern 3: Form State

**When to use:** Form inputs before submission

**Pattern:**
```typescript
export default function Form() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </form>
  );
}
```

**Note:** For complex forms, consider `react-hook-form` or `formik`.

### Pattern 4: Real-time Data (EventSource)

**When to use:** Real-time updates via Server-Sent Events

**Pattern:**
```typescript
// Custom hook for EventSource
export function useRealtimeExecution({ jobId, apiKey }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/${jobId}`);
    eventSource.onmessage = (e) => setData(JSON.parse(e.data));
    return () => eventSource.close();
  }, [jobId]);
  
  return { data };
}
```

**Note:** This is a special case - EventSource doesn't fit React Query's model, so we use a custom hook.

### Pattern 5: URL State (Query Parameters)

**When to use:** Filters, pagination, search that should be shareable

**Pattern:**
```typescript
import { useSearchParams } from 'next/navigation';

export default function FilteredList() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  
  const { data } = useFilteredData({ filter });
  
  return <List data={data} />;
}
```

**Benefits:**
- Shareable URLs
- Browser back/forward works
- Deep linking

### Pattern 6: Derived State

**When to use:** State computed from other state

**Pattern:**
```typescript
export default function Component() {
  const { data } = useData();
  
  // Derived state - computed from data
  const filtered = useMemo(
    () => data.filter(item => item.active),
    [data]
  );
  
  return <List items={filtered} />;
}
```

**Note:** Use `useMemo` for expensive computations, but don't overuse it.

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: useState + useEffect for Server Data

```typescript
// DON'T DO THIS
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/data').then(res => res.json()).then(setData);
}, []);
```

**Why:** No caching, no error handling, refetches on every mount, duplicates logic.

**✅ Do this instead:**
```typescript
const { data } = useData();
```

### ❌ Anti-Pattern 2: Mixing Server and UI State

```typescript
// DON'T DO THIS
const [state, setState] = useState({
  data: null,        // Server state
  loading: true,     // UI state
  isModalOpen: false // UI state
});
```

**Why:** Hard to manage, can't cache server state properly.

**✅ Do this instead:**
```typescript
const { data, isLoading } = useData(); // Server state
const [isModalOpen, setIsModalOpen] = useState(false); // UI state
```

### ❌ Anti-Pattern 3: Fetching in Multiple Components

```typescript
// Component A
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// Component B
useEffect(() => {
  fetch('/api/data').then(setData); // Duplicate fetch!
}, []);
```

**Why:** Duplicate requests, no shared cache.

**✅ Do this instead:**
```typescript
// Both components use the same hook
const { data } = useData(); // Shared cache, single request
```

### ❌ Anti-Pattern 4: Manual Loading/Error States

```typescript
// DON'T DO THIS
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
// ... manual handling
```

**Why:** Duplicates logic, inconsistent UX.

**✅ Do this instead:**
```typescript
const { data, isLoading, isError, error } = useData();
// Use <DataLoader /> component
```

## SSR/SSG Patterns (Next.js App Router)

### Server Components for Initial Data

**Pattern:**
```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await getData(); // Direct fetch
  return <ClientComponent initialData={data} />;
}
```

**Benefits:**
- Faster initial load
- Better SEO
- No client-side JavaScript needed

### Client Components with React Query

**Pattern:**
```typescript
// app/page.tsx (Client Component)
'use client';
export default function Page() {
  const { data } = useData(); // React Query hook
  return <View data={data} />;
}
```

**Benefits:**
- Caching
- Background refetching
- Optimistic updates

### Hybrid Approach

**Pattern:**
```typescript
// Server Component fetches initial data
export default async function Page() {
  const initialData = await getData();
  return <ClientPage initialData={initialData} />;
}

// Client Component hydrates with React Query
'use client';
export function ClientPage({ initialData }) {
  const { data } = useData({
    initialData, // Hydrate cache with server data
  });
  return <View data={data} />;
}
```

**Benefits:**
- Fast initial load (SSR)
- Client-side caching and updates

## Multi-Step Workflows

### Pattern: URL-Based State

**When to use:** Onboarding, wizards, multi-step forms

**Pattern:**
```typescript
// app/onboarding/[step]/page.tsx
export default function OnboardingStep({ params }) {
  const step = params.step;
  const { data } = useOnboardingData();
  
  return <StepComponent step={step} data={data} />;
}
```

**Benefits:**
- Shareable URLs
- Browser navigation works
- Can bookmark progress

### Pattern: Zustand Store (Future)

**When to use:** Complex workflows that don't fit URL params

**Pattern:**
```typescript
// lib/stores/onboarding.ts (if needed)
import { create } from 'zustand';

interface OnboardingState {
  step: number;
  data: Record<string, unknown>;
  setStep: (step: number) => void;
  updateData: (data: Record<string, unknown>) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  updateData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
}));
```

**Note:** Only use if URL-based state doesn't work.

## Testing State

### Testing Server State Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useData } from '@/lib/hooks/use-data';

test('fetches data', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  
  const { result } = renderHook(() => useData(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### Testing Local State

```typescript
import { render, screen } from '@testing-library/react';
import Component from './component';

test('toggles modal', () => {
  render(<Component />);
  const button = screen.getByText('Open');
  fireEvent.click(button);
  expect(screen.getByText('Modal Content')).toBeInTheDocument();
});
```

## Summary

1. **Server state** → TanStack Query hooks
2. **Local UI state** → `useState` / `useReducer`
3. **Global UI state** → Zustand (if needed)
4. **URL state** → `useSearchParams` / `useRouter`
5. **Real-time** → Custom hooks for EventSource
6. **Never** mix server and UI state in one object
7. **Always** use hooks for server data, never `useState` + `useEffect`

## Related Documentation

- `/docs/data-architecture.md` - Overall data architecture
- `/docs/api-contracts.md` - API contracts and data shapes
