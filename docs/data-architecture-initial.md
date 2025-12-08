# Data Architecture - Initial Assessment

**Date:** Phase 5 - Initial Survey  
**Status:** Pre-Refactoring Baseline

## Current Stack

### Framework
- **Next.js 14** with `app/` router (Server Components + Route Handlers)
- No `pages/` directory - fully migrated to App Router

### State Management Libraries
- **None installed** - No React Query, SWR, Zustand, Redux, or other state management libraries
- Pure React hooks (`useState`, `useEffect`) for client-side state
- Server Components for server-side data fetching

### Data Fetching Patterns

#### Server Components (Good Pattern)
- `dashboard/page.tsx`: Fetches data directly in Server Component using Supabase server client
- Uses `createClient()` from `@/lib/supabase/server`
- Multiple sequential Supabase queries with error handling
- No caching strategy - fetches fresh on every request

#### Client Components (Anti-Patterns Found)
1. **realtime-dashboard/page.tsx**:
   - Uses `useState` + `useEffect` for EventSource connection
   - Manual state management for connection status, logs, errors
   - No error recovery strategy beyond reload
   - No shared state or caching

2. **react-settler-demo/page.tsx**:
   - Uses `useState` + `useEffect` + `useCallback` for data fetching
   - Direct SDK client instantiation in component
   - Manual loading/error state management
   - No caching or invalidation

### Current Data Access Layer

#### Supabase Clients
- `/lib/supabase/client.ts`: Browser client for Client Components
- `/lib/supabase/server.ts`: Server client for Server Components/Route Handlers
- Both properly configured with SSR support

#### API Client
- `/lib/api/client.ts`: Defensive fetch wrapper with retries, timeouts, error handling
- Used for external API calls (GitHub, NPM metrics)
- Not used for internal data fetching

### Issues Identified

1. **No Centralized Data Layer**
   - Data fetching logic scattered across components
   - No single source of truth for API calls
   - Duplicate query logic possible

2. **No Caching Strategy**
   - Server Components refetch on every request
   - Client Components refetch on every mount
   - No shared cache between components
   - No stale-while-revalidate pattern

3. **No Query Key Management**
   - No standardized way to identify cached data
   - No invalidation strategy
   - No optimistic updates

4. **Mixed Patterns**
   - Server Components: Direct Supabase calls (good)
   - Client Components: useState/useEffect (bad)
   - No consistency in error handling
   - No consistency in loading states

5. **No Mutation Patterns**
   - No standardized way to update data
   - No optimistic updates
   - No rollback on error

6. **State Management Confusion**
   - Server state (from APIs) mixed with UI state (modals, toggles)
   - No clear separation

### Current Data Domains

1. **Dashboard Metrics**
   - User counts (new users this week, total profiles)
   - Activity counts (actions last hour)
   - Post engagement metrics
   - External metrics (GitHub stars, NPM downloads)

2. **Reconciliation Data**
   - Jobs list
   - Execution status
   - Real-time updates via EventSource

3. **User/Profile Data**
   - Profiles table queries
   - Activity logs

4. **Posts/Community Data**
   - Posts table queries
   - Engagement metrics

### Recommendations

1. **Install TanStack Query (React Query)**
   - Best fit for Next.js App Router
   - Excellent SSR/SSG support
   - Built-in caching, invalidation, optimistic updates
   - Works seamlessly with Server Components

2. **Create Centralized Data Layer**
   - `/lib/data/` for all data access functions
   - `/lib/data/queryKeys.ts` for query key management
   - `/lib/hooks/` for reusable query/mutation hooks

3. **Separate Server vs Client State**
   - Server state → TanStack Query
   - UI state → useState or small Zustand stores (if needed)

4. **Standardize Patterns**
   - All server data fetching through hooks
   - Consistent error/loading/empty states
   - Standardized mutation patterns

5. **Document Everything**
   - Data architecture overview
   - State patterns guide
   - API contracts

## Next Steps

1. Install TanStack Query
2. Set up QueryClient provider
3. Create query key structure
4. Create data access functions
5. Create standardized hooks
6. Refactor existing components
7. Document architecture
