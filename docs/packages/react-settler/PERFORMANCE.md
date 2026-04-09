# Performance Optimization Guide

React.Settler includes built-in performance optimizations. This guide shows how to maximize performance for large datasets.

## Virtualization

Use `VirtualizedTable` for large transaction lists:

```tsx
import { VirtualizedTable } from "@settler/react-settler";

<VirtualizedTable transactions={transactions} height={600} rowHeight={50} />;
```

Benefits:

- Renders only visible rows
- Handles 10,000+ transactions smoothly
- Reduces memory usage

## Memoization

Components are memoized by default. Use filtered/sorted hooks for derived data:

```tsx
import { useFilteredTransactions, useSortedTransactions } from "@settler/react-settler";

function MyComponent({ transactions, filters }) {
  const filtered = useFilteredTransactions(transactions, filters);
  const sorted = useSortedTransactions(filtered, "date", "desc");

  return <TransactionTable transactions={sorted} />;
}
```

## Debouncing

Debounce search inputs:

```tsx
import { SearchBar } from "@settler/react-settler";

<SearchBar
  debounceMs={300}
  onSearch={(query) => {
    // Only fires after 300ms of no typing
  }}
/>;
```

## Lazy Loading

Load data incrementally:

```tsx
import { useState, useEffect } from "react";

function MyComponent() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPage(page).then((data) => {
      setTransactions((prev) => [...prev, ...data]);
    });
  }, [page]);

  return (
    <>
      <TransactionTable transactions={transactions} />
      <button onClick={() => setPage((p) => p + 1)}>Load More</button>
    </>
  );
}
```

## Telemetry Performance Tracking

Monitor performance in production:

```tsx
import { setTelemetryConfig } from "@settler/react-settler";

setTelemetryConfig({
  trackPerformance: true,
  sampleRate: 0.1, // Track 10% of events
});
```

## Best Practices

1. **Batch Updates**: Group multiple state updates
2. **Avoid Inline Functions**: Memoize callbacks
3. **Use Keys**: Always provide stable keys for lists
4. **Code Splitting**: Lazy load reconciliation components
5. **Image Optimization**: Optimize images in metric cards

## Performance Benchmarks

- **VirtualizedTable**: Handles 10,000+ rows at 60fps
- **Filtered Transactions**: Filters 1,000 transactions in <1ms
- **Component Render**: <16ms for typical dashboard
- **Config Compilation**: <50ms for complex workflows

## Profiling

Use React DevTools Profiler to identify bottlenecks:

1. Open React DevTools
2. Go to Profiler tab
3. Record a session
4. Analyze component render times
