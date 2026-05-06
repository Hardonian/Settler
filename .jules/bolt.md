## 2026-05-06 - Parallelizing Supabase Schema Checks

**Learning:** When doing verification or healthchecks against the Supabase SDK by querying many individual tables/indexes, executing them sequentially results in N+1 network requests, severely impacting performance.
**Action:** Use `Promise.all` mapping over the array of tables/indexes to parallelize the requests, bounded only by the network limits, bringing execution time down from O(N) network roundtrips to O(1).
